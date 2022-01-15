"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const config_1 = require("../config");
const caller_id_1 = require("./caller-id");
const entries = [
    {
        combinedName: 'a',
        groupId: -1,
        groupName: 'gn',
        groupType: 'external',
        id: 5,
        numbers: [
            {
                flags: [],
                number: '404',
                type: 'cell',
            }
        ]
    },
    {
        combinedName: 'b',
        groupId: -1,
        groupName: 'gn',
        groupType: 'external',
        id: 6,
        numbers: [
            {
                flags: [],
                number: '08888403',
                type: 'cell',
            }
        ]
    },
];
beforeAll(() => (0, tslib_1.__awaiter)(void 0, void 0, void 0, function* () {
    yield (0, config_1.loadConfig)();
    (0, config_1.getConfig)().callerIdPrefixes = ['08888', '+238888'];
    yield (0, caller_id_1.updateCallerId)(entries);
}));
describe('caller-id', () => {
    it('should resolve an exact match', () => {
        const match = (0, caller_id_1.resolveCaller)('404');
        expect(match).toBe(entries[0]);
    });
    it('should resolve incoming (with prefix) -> phonebook (no prefix)', () => {
        const match = (0, caller_id_1.resolveCaller)('08888404');
        expect(match).toBe(entries[0]);
    });
    it('should resolve incoming (no prefix) -> phonebook (with prefix)', () => {
        const match = (0, caller_id_1.resolveCaller)('403');
        expect(match).toBe(entries[1]);
    });
});
//# sourceMappingURL=caller-id.test.js.map