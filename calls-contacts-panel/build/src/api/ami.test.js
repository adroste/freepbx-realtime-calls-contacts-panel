"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const ami_1 = require("./ami");
const config_1 = require("../config");
beforeAll(() => (0, tslib_1.__awaiter)(void 0, void 0, void 0, function* () {
    yield (0, config_1.loadConfig)();
    yield (0, ami_1.initAmi)();
}));
describe('ami - asterisk manager interface', () => {
    it('should send and receive coreShowChannels', () => (0, tslib_1.__awaiter)(void 0, void 0, void 0, function* () {
        const res = yield (0, ami_1.getAmi)().send({
            action: 'CoreShowChannels',
        });
        console.dir(res);
        expect(res).toBeTruthy();
    }));
});
//# sourceMappingURL=ami.test.js.map