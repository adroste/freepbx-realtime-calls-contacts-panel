"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryCdrCount = exports.offCallLogs = exports.onCallLogs = exports.getCallLogs = exports.stopMonitorCallLogs = exports.monitorCallLogs = exports.updateCallLogs = exports.applyCallLogsFilter = void 0;
const tslib_1 = require("tslib");
const caller_id_1 = require("./caller-id");
const events_1 = require("events");
const config_1 = require("../config");
const database_1 = require("../database");
const TAG = '[Call Log Monitor]';
const CALL_LOG_LIMIT = 10000;
const callLogsMonitor = new events_1.EventEmitter();
let checkInterval;
let lastCdrCount = 0;
let callLogs = [];
function applyCallLogsFilter(callLogs, filter) {
    if (!filter)
        return callLogs;
    let logs = [...callLogs];
    if (filter.types === 'onlyCalls')
        logs = logs.filter(l => ['dial', 'appdial'].includes(l.lastApp.toLowerCase()));
    if (filter.search) {
        logs = logs.filter(l => {
            var _a, _b, _c;
            for (const key of ['lastApp', 'recording', 'startTime', 'status', 'via'])
                if ((_a = l[key]) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(filter.search))
                    return true;
            for (const key of ['from', 'to'])
                for (const iKey of ['displayName', 'phoneNumber'])
                    if ((_c = (_b = l[key]) === null || _b === void 0 ? void 0 : _b[iKey]) === null || _c === void 0 ? void 0 : _c.toLowerCase().includes(filter.search))
                        return true;
            return false;
        });
    }
    if (filter.limit)
        logs = logs.slice(0, filter.limit);
    return logs;
}
exports.applyCallLogsFilter = applyCallLogsFilter;
function updateCallLogs(force = false) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        const count = yield queryCdrCount();
        if (!force && lastCdrCount === count)
            return;
        lastCdrCount = count;
        callLogs = yield queryCallLogs();
        callLogsMonitor.emit('callLogs', callLogs);
    });
}
exports.updateCallLogs = updateCallLogs;
const forceUpdateCallLogs = () => updateCallLogs(true);
function monitorCallLogs() {
    checkInterval = setInterval(updateCallLogs, (0, config_1.getConfig)().callLogsCheckIntervalMs);
    (0, caller_id_1.onCallerIdChange)(forceUpdateCallLogs);
    console.log(TAG, 'started');
}
exports.monitorCallLogs = monitorCallLogs;
function stopMonitorCallLogs() {
    clearInterval(checkInterval);
    (0, caller_id_1.offCallerIdChange)(forceUpdateCallLogs);
    console.log(TAG, 'stopped');
}
exports.stopMonitorCallLogs = stopMonitorCallLogs;
function getCallLogs() {
    return callLogs;
}
exports.getCallLogs = getCallLogs;
function onCallLogs(listener) {
    callLogsMonitor.on('callLogs', listener);
}
exports.onCallLogs = onCallLogs;
function offCallLogs(listener) {
    callLogsMonitor.off('callLogs', listener);
}
exports.offCallLogs = offCallLogs;
function getCdrIncomingOutgoing(entry) {
    return entry.dcontext === 'from-internal'
        ? 'outgoing'
        : 'incoming';
}
function getCdrFromCallerInfo(entry) {
    const caller = (0, caller_id_1.resolveCaller)(entry.cnum);
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
function getCdrToCallerInfo(entry) {
    const caller = (0, caller_id_1.resolveCaller)(entry.dst);
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
function queryCdrCount() {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        const [res] = yield (0, database_1.getDbCdr)().query('SELECT COUNT(*) FROM cdr');
        if (!Array.isArray(res) || !res[0])
            throw new Error(`${TAG} query failed`);
        return res[0]['COUNT(*)'];
    });
}
exports.queryCdrCount = queryCdrCount;
function queryCallLogs() {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        const [rawCdr] = yield (0, database_1.getDbCdr)().query(`
SELECT calldate, src, dst, dcontext, channel, lastapp, duration, disposition, 
  uniqueid, did, recordingfile, cnum, cnam, outbound_cnum, linkedid, sequence
FROM cdr
ORDER BY calldate ASC
LIMIT ?
  `, [CALL_LOG_LIMIT]);
        if (!Array.isArray(rawCdr))
            throw new Error(`${TAG} call log query failed, result is no array`);
        const rows = rawCdr;
        const callLogs = rows.map(r => ({
            id: r.uniqueid,
            linkedId: r.linkedid,
            sequence: r.sequence,
            direction: getCdrIncomingOutgoing(r),
            durationSec: r.duration,
            from: getCdrFromCallerInfo(r),
            lastApp: r.lastapp,
            recording: r.recordingfile,
            startTime: r.calldate.toISOString(),
            status: r.disposition,
            to: getCdrToCallerInfo(r),
            via: r.outbound_cnum || r.did || undefined,
        }));
        const linkedLogs = {};
        callLogs.forEach(l => {
            const linked = linkedLogs[l.linkedId];
            if (linked) {
                linked.push(l);
                linked.sort((a, b) => a.sequence - b.sequence);
            }
            else {
                linkedLogs[l.linkedId] = [l];
            }
        });
        const callLogsFiltered = [];
        callLogs.forEach(l => {
            const lid = l.linkedId;
            const linked = linkedLogs[lid];
            const first = linked === null || linked === void 0 ? void 0 : linked.shift();
            if (linked && first) {
                if (linked.length)
                    first.linkedLogs = linked;
                callLogsFiltered.push(first);
                linkedLogs[lid] = undefined;
            }
        });
        return callLogsFiltered.reverse();
    });
}
//# sourceMappingURL=call-logs.js.map