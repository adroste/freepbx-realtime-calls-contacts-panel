"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const active_calls_1 = require("./active-calls");
const dayjs_1 = (0, tslib_1.__importDefault)(require("dayjs"));
const ami_1 = require("../api/ami");
const config_1 = require("../config");
beforeAll(() => (0, tslib_1.__awaiter)(void 0, void 0, void 0, function* () {
    yield (0, config_1.loadConfig)();
    yield (0, ami_1.initAmi)();
}));
describe('active-calls', () => {
    it('should fetch active-calls without error', () => (0, tslib_1.__awaiter)(void 0, void 0, void 0, function* () {
        expect.assertions(1);
        const events = yield (0, active_calls_1.amiCoreShowChannels)();
        expect(Array.isArray(events)).toBe(true);
    }));
});
describe('active-calls CoreShowChannels event parser', () => {
    it('should parse ringing from intern to extern', () => {
        const events = [
            {
                event: 'CoreShowChannel',
                actionid: '87606710',
                channel: 'PJSIP/Telekom-9536043-0000003d',
                channelstate: '5',
                channelstatedesc: 'Ringing',
                calleridnum: '+4916012312333',
                calleridname: 'CID:05123123123',
                connectedlinenum: '05123123123',
                connectedlinename: '<unknown>',
                language: 'de_DE',
                accountcode: '',
                context: 'from-pstn',
                exten: '+4916012312333',
                priority: '1',
                uniqueid: '1641238260.71',
                linkedid: '1641238260.70',
                application: 'AppDial',
                applicationdata: '(Outgoing Line)',
                duration: '00:00:04',
                bridgeid: ''
            },
            {
                event: 'CoreShowChannel',
                actionid: '87606710',
                channel: 'PJSIP/100-0000003c',
                channelstate: '4',
                channelstatedesc: 'Ring',
                calleridnum: '05123123123',
                calleridname: '<unknown>',
                connectedlinenum: '+4916012312333',
                connectedlinename: 'CID:05123123123',
                language: 'de_DE',
                accountcode: '',
                context: 'macro-dialout-trunk',
                exten: 's',
                priority: '27',
                uniqueid: '1641238260.70',
                linkedid: '1641238260.70',
                application: 'Dial',
                applicationdata: 'PJSIP/+4916012312333@Telekom-9536043,300,Ttrb(func-apply-sipheaders^s^1,(1))U(sub-send-obroute-email^+4916012312333^+4916012312333^1^1641238260^^05123123123)',
                duration: '00:00:05',
                bridgeid: ''
            }
        ];
        const now = Date.now();
        const calls = (0, active_calls_1.parseShowChannelEvents)(events, now);
        expect(calls).toHaveLength(1);
        expect(calls[0].id).toBe('1641238260.70');
        expect(calls[0].establishedAt).toBe((0, dayjs_1.default)(now).millisecond(0).subtract(4, 's').toISOString());
        expect(calls[0].from.phoneNumber).toBe('05123123123');
        expect(calls[0].to.phoneNumber).toBe('+4916012312333');
    });
});
//# sourceMappingURL=active-calls.test.js.map