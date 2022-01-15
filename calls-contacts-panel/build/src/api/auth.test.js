"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const auth_1 = require("./auth");
const database_1 = require("../database");
const config_1 = require("../config");
beforeAll(() => (0, tslib_1.__awaiter)(void 0, void 0, void 0, function* () {
    yield (0, config_1.loadConfig)();
    yield (0, database_1.initDb)();
}));
describe('auth - checkUsernamePassword', () => {
    it('should return false on empty inputs', () => (0, tslib_1.__awaiter)(void 0, void 0, void 0, function* () {
        const res = yield (0, auth_1.checkUsernamePassword)('', '');
        expect(res).toBe(false);
    }));
});
describe('auth - checkUserModulePermissions', () => {
    it('should return false on empty inputs', () => (0, tslib_1.__awaiter)(void 0, void 0, void 0, function* () {
        const res = yield (0, auth_1.checkUserModulePermissions)('');
        expect(res).toBe(false);
    }));
});
afterAll(() => (0, tslib_1.__awaiter)(void 0, void 0, void 0, function* () {
    yield (0, database_1.closeDb)();
}));
//# sourceMappingURL=auth.test.js.map