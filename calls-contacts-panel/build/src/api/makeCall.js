"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeCall = void 0;
const tslib_1 = require("tslib");
const ami_types_1 = require("./ami-types");
const ami_1 = require("./ami");
const TAG = '[Make Call]';
function makeCall(from, to) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        try {
            yield (0, ami_1.getAmi)().send({
                action: ami_types_1.AMI_ACTION_TYPES.Originate,
                Channel: `local/${from}@originate-skipvm`,
                Exten: to,
                Context: 'from-internal',
                Priority: 1,
                CallerID: `<${from}>`,
                Async: true,
            });
        }
        catch (err) {
            console.error(TAG, 'originate command failed', err);
        }
    });
}
exports.makeCall = makeCall;
//# sourceMappingURL=makeCall.js.map