"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDb = exports.initDb = exports.getDbCdr = exports.getDb = exports.parseFreepbxConf = void 0;
const tslib_1 = require("tslib");
const promise_1 = require("mysql2/promise");
const config_1 = require("./config");
const promises_1 = require("fs/promises");
const TAG = '[Database]';
const CDR_DB_NAME = 'asteriskcdrdb';
const PBX_CONFIG_OPTIONS = ['AMPDBUSER', 'AMPDBPASS', 'AMPDBHOST', 'AMPDBPORT', 'AMPDBNAME'];
let pool;
let poolCdr;
function parseFreepbxConf(raw) {
    const lines = raw.split('\n');
    const options = {};
    lines.forEach(l => {
        var _a;
        const split = l.split('=');
        if (split.length !== 2)
            return;
        const key = PBX_CONFIG_OPTIONS.find(o => split[0].includes(o));
        if (!key)
            return;
        const val = (_a = split[1].match(/'([\S\s]*)'\s*;/)) === null || _a === void 0 ? void 0 : _a[1];
        options[key] = val || '';
    });
    if (!PBX_CONFIG_OPTIONS.every(option => typeof options[option] === 'string'))
        throw new Error(`${TAG} freepbx config does not include all required values: ${PBX_CONFIG_OPTIONS.join(', ')}`);
    return options;
}
exports.parseFreepbxConf = parseFreepbxConf;
function getDb() {
    if (!pool)
        throw new Error('database pool was not initialized');
    return pool;
}
exports.getDb = getDb;
function getDbCdr() {
    if (!poolCdr)
        throw new Error('database pool was not initialized');
    return poolCdr;
}
exports.getDbCdr = getDbCdr;
function initDb() {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        const pbxConfigRaw = yield (0, promises_1.readFile)((0, config_1.getConfig)().freepbxConfFile, 'utf-8');
        const pbxConfig = parseFreepbxConf(pbxConfigRaw);
        pool = (0, promise_1.createPool)({
            user: pbxConfig.AMPDBUSER,
            host: pbxConfig.AMPDBHOST,
            database: pbxConfig.AMPDBNAME,
            password: pbxConfig.AMPDBPASS,
            port: parseInt(pbxConfig.AMPDBPORT),
        });
        poolCdr = (0, promise_1.createPool)({
            user: pbxConfig.AMPDBUSER,
            host: pbxConfig.AMPDBHOST,
            database: CDR_DB_NAME,
            password: pbxConfig.AMPDBPASS,
            port: parseInt(pbxConfig.AMPDBPORT),
        });
        yield pool.getConnection();
        yield poolCdr.getConnection();
    });
}
exports.initDb = initDb;
function closeDb() {
    return Promise.all([poolCdr.end(), pool.end()]);
}
exports.closeDb = closeDb;
//# sourceMappingURL=database.js.map