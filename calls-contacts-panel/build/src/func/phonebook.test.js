"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const phonebook_1 = require("./phonebook");
const database_1 = require("../database");
const config_1 = require("../config");
beforeAll(() => (0, tslib_1.__awaiter)(void 0, void 0, void 0, function* () {
    yield (0, config_1.loadConfig)();
    yield (0, database_1.initDb)();
    yield (0, phonebook_1.monitorPhonebook)();
}));
describe('phonebook', () => {
    it.skip('should perform delete entry queries', () => (0, tslib_1.__awaiter)(void 0, void 0, void 0, function* () {
        const res = yield (0, phonebook_1.deleteEntry)(-999);
        expect(res).toBe(false);
    }));
    it.skip('should create and delete an entry', () => (0, tslib_1.__awaiter)(void 0, void 0, void 0, function* () {
        expect.assertions(1);
        const entry = {
            groupId: 2,
            displayName: '__TEST__displayname',
            firstName: '__TEST__firstname',
            lastName: '__TEST__lastname',
            title: '__TEST__title',
            company: '__TEST__company',
            address: '__TEST__address',
            emails: ['__TEST__email1', '__TEST__email2'],
            websites: ['__TEST__website1', '__TEST__website2'],
            numbers: [
                {
                    number: '+99123123123',
                    type: 'cell',
                    flags: [],
                },
                {
                    number: '123123123999',
                    type: 'work',
                    flags: ['fax'],
                }
            ]
        };
        const id = yield (0, phonebook_1.createEntry)(entry);
        const res = yield (0, phonebook_1.deleteEntry)(id);
        expect(res).toBe(true);
    }));
});
afterAll(() => (0, tslib_1.__awaiter)(void 0, void 0, void 0, function* () {
    yield (0, database_1.closeDb)();
}));
//# sourceMappingURL=phonebook.test.js.map