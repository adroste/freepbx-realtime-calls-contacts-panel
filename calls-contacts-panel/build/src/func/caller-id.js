"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.offCallerIdChange = exports.onCallerIdChange = exports.stopCallerId = exports.startCallerId = exports.updateCallerId = exports.resolveCaller = exports.createLookupTable = void 0;
const tslib_1 = require("tslib");
const phonebook_1 = require("./phonebook");
const events_1 = require("events");
const config_1 = require("../config");
const lodash_1 = require("lodash");
const TAG = '[Caller ID]';
const callerIdMonitor = new events_1.EventEmitter();
let lookupTable = {};
function createLookupTable(phonebook) {
    const resolveLength = (0, config_1.getConfig)().callerIdResolveLength;
    const table = {};
    const add = (number, entry, overwrite) => {
        if (overwrite || (!overwrite && !table[number]))
            table[number] = entry;
        if (overwrite || (!overwrite && !table[number]))
            table[number.slice(-resolveLength)] = entry;
    };
    for (const entry of phonebook) {
        if (!entry.numbers)
            continue;
        for (const number of entry.numbers) {
            add(number.number, entry, true);
            for (const prefix of (0, config_1.getConfig)().callerIdPrefixes) {
                if (number.number.startsWith(prefix))
                    add(number.number.slice(prefix.length), entry, false);
                else
                    add(prefix + number.number, entry, false);
            }
        }
    }
    return table;
}
exports.createLookupTable = createLookupTable;
function resolveCaller(phoneNumber) {
    if (!phoneNumber)
        return null;
    const resolveLength = (0, config_1.getConfig)().callerIdResolveLength;
    return lookupTable[phoneNumber]
        || lookupTable[phoneNumber.slice(-resolveLength)]
        || null;
}
exports.resolveCaller = resolveCaller;
function updateCallerId(phonebook) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        const nextLookupTable = createLookupTable(phonebook);
        if ((0, lodash_1.isEqual)(nextLookupTable, lookupTable))
            return;
        lookupTable = nextLookupTable;
        callerIdMonitor.emit('callerId');
    });
}
exports.updateCallerId = updateCallerId;
function startCallerId() {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        console.log(TAG, 'started');
        yield updateCallerId((0, phonebook_1.getPhonebook)());
        (0, phonebook_1.onPhonebookChange)(updateCallerId);
    });
}
exports.startCallerId = startCallerId;
function stopCallerId() {
    console.log(TAG, 'stopped');
    lookupTable = {};
    (0, phonebook_1.offPhonebookChange)(updateCallerId);
}
exports.stopCallerId = stopCallerId;
function onCallerIdChange(listener) {
    callerIdMonitor.on('callerId', listener);
}
exports.onCallerIdChange = onCallerIdChange;
function offCallerIdChange(listener) {
    callerIdMonitor.off('callerId', listener);
}
exports.offCallerIdChange = offCallerIdChange;
//# sourceMappingURL=caller-id.js.map