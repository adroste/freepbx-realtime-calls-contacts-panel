"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAmi = exports.initAmi = void 0;
const tslib_1 = require("tslib");
const yana_1 = (0, tslib_1.__importDefault)(require("yana"));
const config_1 = require("../config");
const ini_1 = (0, tslib_1.__importDefault)(require("ini"));
const promises_1 = require("fs/promises");
const TAG = '[AMI]';
let ami;
function parseManagerConf(raw) {
    const obj = ini_1.default.parse(raw);
    const port = parseInt(obj['general']['port']);
    const adminPassword = obj['admin']['secret'];
    if (!port || !adminPassword)
        throw new Error(`${TAG} asterisk manager config does not include required values: general->port, admin->secret`);
    return {
        port,
        adminPassword
    };
}
function initAmi() {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        const managerConfigRaw = yield (0, promises_1.readFile)((0, config_1.getConfig)().managerConfFile, 'utf-8');
        const managerConfig = parseManagerConf(managerConfigRaw);
        ami = new yana_1.default({
            port: managerConfig.port,
            host: '127.0.0.1',
            login: 'admin',
            password: managerConfig.adminPassword,
            events: 'on',
            reconnect: true
        });
        yield ami.connect();
        console.log(TAG, 'asterisk manager interface connected');
    });
}
exports.initAmi = initAmi;
function getAmi() {
    if (!ami)
        throw new Error('asterisk manager interface was not initialized');
    return ami;
}
exports.getAmi = getAmi;
//# sourceMappingURL=ami.js.map