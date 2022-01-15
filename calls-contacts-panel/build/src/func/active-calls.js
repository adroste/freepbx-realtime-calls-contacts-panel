"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.offActiveCallsChange = exports.onActiveCallsChange = exports.stopMonitorActiveCalls = exports.monitorActiveCalls = exports.getActiveCalls = exports.checkActiveCalls = exports.amiCoreShowChannels = exports.parseShowChannelEvents = void 0;
const tslib_1 = require("tslib");
const ami_types_1 = require("../api/ami-types");
const events_1 = require("events");
const dayjs_1 = (0, tslib_1.__importDefault)(require("dayjs"));
const duration_1 = (0, tslib_1.__importDefault)(require("dayjs/plugin/duration"));
const ami_1 = require("../api/ami");
const config_1 = require("../config");
const lodash_1 = require("lodash");
const caller_id_1 = require("./caller-id");
dayjs_1.default.extend(duration_1.default);
const TAG = '[Active Calls Monitor]';
const activeCallsMonitor = new events_1.EventEmitter();
let checkInterval;
let activeCalls = [];
function parseDuration(formattedVal) {
    const [hours, minutes, seconds] = formattedVal.split(":").map(val => parseInt(val));
    return { hours, minutes, seconds };
}
function durationToStartTimeSmooth(id, duration, now) {
    const found = activeCalls.find(call => call.id === id);
    if (found)
        return found.establishedAt;
    const durationObj = parseDuration(duration);
    const nowPrecisionSeconds = (0, dayjs_1.default)(now).millisecond(0);
    const subtracted = nowPrecisionSeconds.subtract(dayjs_1.default.duration(durationObj));
    return subtracted.toISOString();
}
function parseShowChannelEvents(events, now = Date.now()) {
    const linked = {};
    events.forEach(ev => {
        const l = linked[ev.linkedid];
        if (l) {
            l.push(ev);
            l.sort((a, b) => a.uniqueid.localeCompare(b.uniqueid));
        }
        else {
            linked[ev.linkedid] = [ev];
        }
    });
    const calls = [];
    Object.keys(linked).forEach(lid => {
        const l = linked[lid];
        if (!(l === null || l === void 0 ? void 0 : l.length))
            return;
        let start = l.find(ev => ev.uniqueid === ev.linkedid);
        if (!start)
            start = l[0];
        const evLink = l.find(ev => ev !== start);
        const fromNumber = start.calleridnum;
        const toNumber = (evLink === null || evLink === void 0 ? void 0 : evLink.calleridnum) || start.connectedlinenum || undefined;
        const fromCaller = (0, caller_id_1.resolveCaller)(fromNumber);
        const toCaller = (0, caller_id_1.resolveCaller)(toNumber);
        calls.push({
            id: start.uniqueid,
            app: start.application,
            establishedAt: durationToStartTimeSmooth(start.uniqueid, (evLink === null || evLink === void 0 ? void 0 : evLink.duration) || start.duration, now),
            from: {
                displayName: (fromCaller === null || fromCaller === void 0 ? void 0 : fromCaller.combinedName) || undefined,
                phoneNumber: fromNumber,
                phoneBookId: (fromCaller === null || fromCaller === void 0 ? void 0 : fromCaller.id) || undefined,
            },
            status: (evLink === null || evLink === void 0 ? void 0 : evLink.channelstatedesc) || start.channelstatedesc,
            to: {
                displayName: (toCaller === null || toCaller === void 0 ? void 0 : toCaller.combinedName) || undefined,
                phoneNumber: toNumber,
                phoneBookId: (toCaller === null || toCaller === void 0 ? void 0 : toCaller.id) || undefined,
            },
            via: start.channel,
        });
    });
    return calls;
}
exports.parseShowChannelEvents = parseShowChannelEvents;
function amiCoreShowChannels() {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        const res = yield (0, ami_1.getAmi)().send({
            action: ami_types_1.AMI_ACTION_TYPES.CoreShowChannels,
        });
        return res.eventlist;
    });
}
exports.amiCoreShowChannels = amiCoreShowChannels;
function checkActiveCalls() {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        let events;
        try {
            events = yield amiCoreShowChannels();
        }
        catch (err) {
            console.error(TAG, 'active calls check failed', err);
            return;
        }
        const nextActiveCalls = parseShowChannelEvents(events);
        if ((0, lodash_1.isEqual)(activeCalls, nextActiveCalls))
            return;
        activeCalls = nextActiveCalls;
        activeCallsMonitor.emit('change', nextActiveCalls);
    });
}
exports.checkActiveCalls = checkActiveCalls;
function getActiveCalls() {
    return activeCalls;
}
exports.getActiveCalls = getActiveCalls;
function monitorActiveCalls() {
    checkInterval = setInterval(checkActiveCalls, (0, config_1.getConfig)().activeCallsCheckIntervalMs);
    console.log(TAG, 'started');
}
exports.monitorActiveCalls = monitorActiveCalls;
function stopMonitorActiveCalls() {
    clearInterval(checkInterval);
    console.log(TAG, 'stopped');
}
exports.stopMonitorActiveCalls = stopMonitorActiveCalls;
function onActiveCallsChange(listener) {
    activeCallsMonitor.on('change', listener);
}
exports.onActiveCallsChange = onActiveCallsChange;
function offActiveCallsChange(listener) {
    activeCallsMonitor.off('change', listener);
}
exports.offActiveCallsChange = offActiveCallsChange;
//# sourceMappingURL=active-calls.js.map