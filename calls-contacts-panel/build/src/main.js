"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const systemd_1 = require("./systemd");
const commander_1 = require("commander");
const console_stamp_1 = (0, tslib_1.__importDefault)(require("console-stamp"));
const ami_1 = require("./api/ami");
const database_1 = require("./database");
const http_api_1 = require("./api/http-api");
const ws_api_1 = require("./api/ws-api");
const config_1 = require("./config");
const active_calls_1 = require("./func/active-calls");
const call_logs_1 = require("./func/call-logs");
const phonebook_1 = require("./func/phonebook");
const caller_id_1 = require("./func/caller-id");
const web_server_1 = require("./web-server");
const banner = String.raw `
-----------------------------
Call & Contacts Panel Backend
-----------------------------
`;
console.log(banner);
console.log('\n');
(0, console_stamp_1.default)(console);
function onProcError(err) {
    console.error(err);
    process.exit(2);
}
process.on('uncaughtException', onProcError);
process.on('unhandledRejection', onProcError);
function ready() {
    setTimeout(() => {
        var _a;
        (_a = process.send) === null || _a === void 0 ? void 0 : _a.call(process, 'ready');
    }, 1000);
}
const program = new commander_1.Command();
program
    .name("npm run start --")
    .usage("[command]");
program.addHelpText('after', `
Example call:
  $ npm run start -- install`);
program
    .command('install')
    .description('Installs service (systemd)')
    .action(() => (0, tslib_1.__awaiter)(void 0, void 0, void 0, function* () {
    yield (0, systemd_1.installAsService)();
}));
program
    .command('uninstall')
    .description('Stops and removes service (systemd)')
    .action(() => (0, tslib_1.__awaiter)(void 0, void 0, void 0, function* () {
    yield (0, systemd_1.uninstallService)();
}));
program
    .command('run-as-service')
    .description('Starts the app as service')
    .action(() => (0, tslib_1.__awaiter)(void 0, void 0, void 0, function* () {
    console.log('running as service');
    yield (0, database_1.initDb)();
    yield (0, ami_1.initAmi)();
    yield (0, phonebook_1.monitorPhonebook)();
    yield (0, caller_id_1.startCallerId)();
    (0, active_calls_1.monitorActiveCalls)();
    (0, call_logs_1.monitorCallLogs)();
    yield (0, web_server_1.startWebServer)();
    (0, http_api_1.initHttpApi)();
    (0, ws_api_1.initWsApi)();
    ready();
}));
(() => (0, tslib_1.__awaiter)(void 0, void 0, void 0, function* () {
    yield (0, config_1.loadConfig)();
    program.parse();
}))();
//# sourceMappingURL=main.js.map