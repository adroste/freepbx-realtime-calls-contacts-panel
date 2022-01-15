import { CallerInfo, IncomingOutgoing } from './call-types';
import { offCallerIdChange, onCallerIdChange, resolveCaller } from './caller-id';

import { EventEmitter } from 'events';
import { getConfig } from '../config';
import { getDbCdr } from '../database';

const TAG = '[Call Log Monitor]';
const CALL_LOG_LIMIT = 10000;
const callLogsMonitor = new EventEmitter();
let checkInterval: NodeJS.Timer;
let lastCdrCount = 0;
let callLogs: CallLog[] = [];

// cdr fields (old, not complete): http://www.asteriskdocs.org/en/3rd_Edition/asterisk-book-html-chunk/asterisk-SysAdmin-SECT-1.html
// newer: https://wiki.asterisk.org/wiki/display/AST/Asterisk+12+CDR+Specification

export type CallStatus = 'NO ANSWER' | 'FAILED' | 'BUSY' | 'ANSWERED' | 'UNKNOWN'; // disposition

export interface CallLog {
  id: string, // id + sequence should be unique in combination
  sequence: number,
  linkedId: string,
  linkedLogs?: CallLog[], // sorted ascending by sequence

  direction: IncomingOutgoing, // FreePBX: from-internal => outgoing (at least for CDRs)
  durationSec: number,
  from: CallerInfo,
  lastApp: string, // asterisk specific: last used dialplan app
  recording: string,
  startTime: string,
  status: CallStatus,
  to: CallerInfo,
  via?: string, // channel/did the call went through
                // like outbound_cnum for outgoing calls
                // or did for incoming calls
}

export interface CallLogsFilter {
  limit?: number,
  types?: 'all' | 'onlyCalls',
  search?: string,
}

interface CdrRow {
  calldate: Date,
  src: string,
  dst: string,
  dcontext: string,
  channel: string,
  lastapp: string,
  duration: number,
  disposition: string,
  uniqueid: string,
  did: string,
  recordingfile: string,
  cnum: string,
  cnam: string,
  outbound_cnum: string,
  linkedid: string,
  sequence: number,
}

export function applyCallLogsFilter(callLogs: CallLog[], filter?: CallLogsFilter): CallLog[] {
  if (!filter)
    return callLogs;

  let logs = [ ...callLogs ];

  if (filter.types === 'onlyCalls')
    logs = logs.filter(l => ['dial', 'appdial'].includes(l.lastApp.toLowerCase()));

  if (filter.search) {
    logs = logs.filter(l => {
      for (const key of ['lastApp', 'recording', 'startTime', 'status', 'via'] as const)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (l[key]?.toLowerCase().includes(filter.search!))
          return true;
      for (const key of ['from', 'to'] as const)
        for (const iKey of ['displayName', 'phoneNumber'] as const)
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          if (l[key]?.[iKey]?.toLowerCase().includes(filter.search!))
            return true;
      // TODO: maybe also search linked logs/events for better search results
      return false;
    });
  }

  if (filter.limit)
    logs = logs.slice(0, filter.limit);

  return logs;
}

export async function updateCallLogs(force = false) {
  const count = await queryCdrCount();
  if (!force && lastCdrCount === count)
    return; // no check necessary
  lastCdrCount = count;
  // callLogs ordered descending, therefore first element = newest element
  callLogs = await queryCallLogs();
  callLogsMonitor.emit('callLogs', callLogs);
}
const forceUpdateCallLogs = () => updateCallLogs(true);

export function monitorCallLogs() {
  checkInterval = setInterval(updateCallLogs, 
    getConfig().callLogsCheckIntervalMs);
  onCallerIdChange(forceUpdateCallLogs);
  console.log(TAG, 'started');
}

export function stopMonitorCallLogs() {
  clearInterval(checkInterval);
  offCallerIdChange(forceUpdateCallLogs);
  console.log(TAG, 'stopped');
}

export function getCallLogs() {
  return callLogs;
}

export function onCallLogs(listener: (callLogs: CallLog[]) => void) {
  callLogsMonitor.on('callLogs', listener);
}

export function offCallLogs(listener: (callLogs: CallLog[]) => void) {
  callLogsMonitor.off('callLogs', listener);
}

function getCdrIncomingOutgoing(entry: CdrRow): IncomingOutgoing {
  return entry.dcontext === 'from-internal'
    ? 'outgoing'
    : 'incoming';
}

function getCdrFromCallerInfo(entry: CdrRow): CallerInfo {
  const caller = resolveCaller(entry.cnum);
  if (caller) {
    return {
      displayName: caller.combinedName || entry.cnam || undefined,
      phoneNumber: entry.cnum,
      phoneBookId: caller.id
    };
  }
  return {
    displayName: entry.cnam || undefined,
    phoneNumber: entry.cnum || undefined,
    phoneBookId: undefined
  };
}

function getCdrToCallerInfo(entry: CdrRow): CallerInfo {
  const caller = resolveCaller(entry.dst);
  if (caller) {
    return {
      displayName: caller.combinedName || undefined,
      phoneNumber: entry.dst,
      phoneBookId: caller.id
    };
  }
  return {
    displayName: undefined,
    phoneNumber: entry.dst,
    phoneBookId: undefined
  };
}

export async function queryCdrCount(): Promise<number> {
  const [res] = await getDbCdr().query('SELECT COUNT(*) FROM cdr');
  if (!Array.isArray(res) || !res[0])
    throw new Error(`${TAG} query failed`);
  return (res[0] as { 'COUNT(*)': number })['COUNT(*)'];
}

/**
 * Returns CallLog[] in descending order (from new to old)
 * @returns 
 */
async function queryCallLogs(): Promise<CallLog[]> {
  const [rawCdr] = await getDbCdr().query(`
SELECT calldate, src, dst, dcontext, channel, lastapp, duration, disposition, 
  uniqueid, did, recordingfile, cnum, cnam, outbound_cnum, linkedid, sequence
FROM cdr
ORDER BY calldate ASC
LIMIT ?
  `, [CALL_LOG_LIMIT]);
  if (!Array.isArray(rawCdr))
    throw new Error(`${TAG} call log query failed, result is no array`);
  const rows = rawCdr as CdrRow[];

  const callLogs: CallLog[] = rows.map(r => ({
    id: r.uniqueid,
    linkedId: r.linkedid,
    sequence: r.sequence,

    direction: getCdrIncomingOutgoing(r),
    durationSec: r.duration,
    from: getCdrFromCallerInfo(r),
    lastApp: r.lastapp,
    recording: r.recordingfile,
    startTime: r.calldate.toISOString(),
    status: r.disposition as CallStatus,
    to: getCdrToCallerInfo(r),
    via: r.outbound_cnum || r.did || undefined,
  }));

  const linkedLogs: { [id: string]: CallLog[] | undefined } = {};
  callLogs.forEach(l => { 
    const linked = linkedLogs[l.linkedId];
    if (linked) {
      linked.push(l);
      // sort ascending
      linked.sort((a, b) => a.sequence - b.sequence);
    } else {
      linkedLogs[l.linkedId] = [l];
    }
  });

  const callLogsFiltered: CallLog[] = [];
  callLogs.forEach(l => {
    const lid = l.linkedId;
    const linked = linkedLogs[lid];
    const first = linked?.shift();
    if (linked && first) {
      if (linked.length)
        first.linkedLogs = linked;
      callLogsFiltered.push(first);
      linkedLogs[lid] = undefined; // mark as resolved
    }
  });
  return callLogsFiltered.reverse();
}
