"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkUserModulePermissions = exports.getUserExtension = exports.checkUsernamePassword = void 0;
const tslib_1 = require("tslib");
const bcrypt_1 = (0, tslib_1.__importDefault)(require("bcrypt"));
const database_1 = require("../database");
function checkUsernamePassword(username, password) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        const [rows] = yield (0, database_1.getDb)().query('SELECT id, password FROM userman_users WHERE username = ?', [username]);
        if (!Array.isArray(rows) || rows.length !== 1)
            return false;
        const res = rows[0];
        return bcrypt_1.default.compare(password, res.password);
    });
}
exports.checkUsernamePassword = checkUsernamePassword;
function getUserExtension(username) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        const [rows] = yield (0, database_1.getDb)().query('SELECT default_extension FROM userman_users WHERE username = ?', [username]);
        if (!Array.isArray(rows) || rows.length !== 1)
            return false;
        const res = rows[0];
        return res.default_extension || '';
    });
}
exports.getUserExtension = getUserExtension;
function checkUserModulePermissions(username, modules = ['cdr', 'contactmanager']) {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        const [rawRows] = yield (0, database_1.getDb)().query(`
SELECT s.key, s.val 
FROM userman_users_settings s
WHERE uid = (SELECT id FROM userman_users WHERE username = ?)
	AND s.key IN ('pbx_admin', 'pbx_modules')
`, [username]);
        if (!Array.isArray(rawRows))
            return false;
        const rows = rawRows;
        const keyVal = rows.reduce((keyVal, cur) => {
            keyVal[cur.key] = cur.val.toString();
            return keyVal;
        }, {});
        return keyVal.pbx_admin === '1'
            || modules.every(module => { var _a; return (_a = keyVal.pbx_modules) === null || _a === void 0 ? void 0 : _a.includes(module); });
    });
}
exports.checkUserModulePermissions = checkUserModulePermissions;
//# sourceMappingURL=auth.js.map