"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const database_1 = require("../database");
const config_1 = require("../config");
const call_logs_1 = require("./call-logs");
beforeAll(() => (0, tslib_1.__awaiter)(void 0, void 0, void 0, function* () {
    yield (0, config_1.loadConfig)();
    yield (0, database_1.initDb)();
}));
describe('call-logs', () => {
    it('should query count without error', () => (0, tslib_1.__awaiter)(void 0, void 0, void 0, function* () {
        const c = yield (0, call_logs_1.queryCdrCount)();
        expect(typeof c === 'number').toBe(true);
    }));
});
afterAll(() => (0, tslib_1.__awaiter)(void 0, void 0, void 0, function* () {
    yield (0, database_1.closeDb)();
}));
//# sourceMappingURL=call-logs.test.js.map