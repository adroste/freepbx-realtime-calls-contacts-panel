import { AMI_ACTION_TYPES, CoreShowChannelEvent } from '../api/ami-types';

import { CallerInfo } from './call-types';
import { EventEmitter } from 'events';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { getAmi } from '../api/ami';
import { getConfig } from '../config';
import { isEqual } from 'lodash';
import { resolveCaller } from './caller-id';

dayjs.extend(duration);

const TAG = '[Active Calls Monitor]';

const activeCallsMonitor = new EventEmitter();
let checkInterval: NodeJS.Timer;
let activeCalls: ActiveCall[] = [];

export interface ActiveCall {
  id: string,
  app: string, // application
  establishedAt: string,
  from: CallerInfo,
  status: string, // channelstatedesc
  to: CallerInfo,
  via: string, // channel
}

/**
 * Parse duration of format HH:mm:ss
 * @param formattedVal duration in format HH:mm:ss
 */
function parseDuration(formattedVal: string) {
  const [hours, minutes, seconds] = formattedVal.split(":").map( val => parseInt(val) );
  return { hours, minutes, seconds };
}

/**
 * Calculates a start time based on the current timestamp
 * and a running duration in format HH:mm:ss.
 * Smoothes the output by returning a matching output from the cache (activeCalls).
 * @param duration string in Format HH:mm:ss
 * @param now timestamp
 * @returns Timestamp in ISO Format
 */
function durationToStartTimeSmooth(id: string, duration: string, now: number): string {
    const found = activeCalls.find(call => call.id === id);
    if (found)
      return found.establishedAt;

    const durationObj = parseDuration(duration);
    // remove milliseconds
    const nowPrecisionSeconds = dayjs(now).millisecond(0);
    const subtracted = nowPrecisionSeconds.subtract(dayjs.duration(durationObj));
    return subtracted.toISOString();
}

export function parseShowChannelEvents(events: CoreShowChannelEvent[], now = Date.now()): ActiveCall[] {
  const linked: { [key: string]: CoreShowChannelEvent[] | undefined } = {};
  events.forEach(ev => {
    const l = linked[ev.linkedid];
    if (l) { // first event (start)
      l.push(ev);
      // assumption: ev with lowest unique id happened earlier
      l.sort((a, b) => a.uniqueid.localeCompare(b.uniqueid))
    } else {
      linked[ev.linkedid] = [ev];
    }
  });

  const calls: ActiveCall[] = [];
  Object.keys(linked).forEach(lid => {
    const l = linked[lid];
    if (!l?.length)
      return;
    // HINT: uniqueid === linkedid to determine start events does not work in all cases (e.g. originate)
    let start = l.find(ev => ev.uniqueid === ev.linkedid);
    if (!start)
      start = l[0];
    const evLink = l.find(ev => ev !== start);

    const fromNumber = start.calleridnum;
    const toNumber = evLink?.calleridnum || start.connectedlinenum || undefined;
    const fromCaller = resolveCaller(fromNumber);
    const toCaller = resolveCaller(toNumber);

    calls.push({
      id: start.uniqueid, 
      app: start.application,
      establishedAt: durationToStartTimeSmooth(start.uniqueid, evLink?.duration || start.duration, now),
      from: {
        displayName: fromCaller?.combinedName || undefined,
        phoneNumber: fromNumber,
        phoneBookId: fromCaller?.id || undefined,
      },
      status: evLink?.channelstatedesc || start.channelstatedesc,
      to: {
        displayName: toCaller?.combinedName || undefined,
        phoneNumber: toNumber,
        phoneBookId: toCaller?.id || undefined,
      },
      via: start.channel,
    })
  });
  return calls;
}

export async function amiCoreShowChannels() {
  const res = await getAmi().send({
    action: AMI_ACTION_TYPES.CoreShowChannels,
  });
  return res.eventlist as unknown as CoreShowChannelEvent[];
}

export async function checkActiveCalls() {
  let events: CoreShowChannelEvent[];
  try {
    events = await amiCoreShowChannels();
  } catch (err) { 
    console.error(TAG, 'active calls check failed', err);
    return;
  }
  const nextActiveCalls = parseShowChannelEvents(events);
  if (isEqual(activeCalls, nextActiveCalls))
    return;
  activeCalls = nextActiveCalls;
  activeCallsMonitor.emit('change', nextActiveCalls);
}

export function getActiveCalls() {
  return activeCalls;
}

export function monitorActiveCalls() {
  checkInterval = setInterval(checkActiveCalls, 
    getConfig().activeCallsCheckIntervalMs);
  console.log(TAG, 'started');
}

export function stopMonitorActiveCalls() {
  clearInterval(checkInterval);
  console.log(TAG, 'stopped');
}

export function onActiveCallsChange(listener: (activeCalls: ActiveCall[]) => void) {
  activeCallsMonitor.on('change', listener);
}

export function offActiveCallsChange(listener: (activeCalls: ActiveCall[]) => void) {
  activeCallsMonitor.off('change', listener);
}