"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initWsApi = exports.io = exports.SEND_MSG = exports.RECV_MSG = void 0;
const tslib_1 = require("tslib");
const active_calls_1 = require("../func/active-calls");
const call_logs_1 = require("../func/call-logs");
const phonebook_1 = require("../func/phonebook");
const auth_1 = require("./auth");
const socket_io_1 = require("socket.io");
const web_server_1 = require("../web-server");
const makeCall_1 = require("./makeCall");
const TAG = '[Websocket API]';
exports.RECV_MSG = {
    subscribeActiveCalls: 'subscribeActiveCalls',
    unsubscribeActiveCalls: 'unsubscribeActiveCalls',
    subscribeCallLogs: 'subscribeCallLogs',
    unsubscribeCallLogs: 'unsubscribeCallLogs',
    subscribePhonebook: 'subscribePhonebook',
    unsubscribePhonebook: 'unsubscribePhonebook',
    makeCall: 'makeCall',
    createPhonebookEntry: 'createPhonebookEntry',
    deletePhonebookEntry: 'deletePhonebookEntry',
    updatePhonebookEntry: 'updatePhonebookEntry',
};
exports.SEND_MSG = {
    activeCalls: 'activeCalls',
    callLogs: 'callLogs',
    phonebook: 'phonebook',
    userExtension: 'userExtension',
};
function initWsApi() {
    exports.io = new socket_io_1.Server(web_server_1.httpServer, {
        path: '/callpanel/socket.io',
        cors: {
            origin: true,
            credentials: true,
        }
    });
    console.log(TAG, `WS api listening...`);
    exports.io.use((socket, next) => (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        const username = socket.handshake.auth.username || '';
        const password = socket.handshake.auth.password || '';
        if ((yield (0, auth_1.checkUsernamePassword)(username, password))
            && (yield (0, auth_1.checkUserModulePermissions)(username))) {
            next();
        }
        else {
            next(new Error('authentication failed'));
            socket.disconnect();
        }
    }));
    setListener();
}
exports.initWsApi = initWsApi;
function setListener() {
    exports.io.on('connection', socket => {
        let subscribedActiveCalls = false;
        function sendActiveCalls(activeCalls) {
            socket.emit(exports.SEND_MSG.activeCalls, activeCalls);
        }
        socket.on(exports.RECV_MSG.subscribeActiveCalls, () => {
            if (subscribedActiveCalls)
                return;
            subscribedActiveCalls = true;
            (0, active_calls_1.onActiveCallsChange)(sendActiveCalls);
            sendActiveCalls((0, active_calls_1.getActiveCalls)());
        });
        socket.on(exports.RECV_MSG.unsubscribeActiveCalls, () => {
            (0, active_calls_1.offActiveCallsChange)(sendActiveCalls);
            subscribedActiveCalls = false;
        });
        let subscribedCallLogs = false;
        let callLogsFilter;
        function sendCallLogs(callLogs) {
            socket.emit(exports.SEND_MSG.callLogs, (0, call_logs_1.applyCallLogsFilter)(callLogs, callLogsFilter));
        }
        socket.on(exports.RECV_MSG.subscribeCallLogs, (filter) => {
            if (!subscribedCallLogs)
                (0, call_logs_1.onCallLogs)(sendCallLogs);
            subscribedCallLogs = true;
            callLogsFilter = filter;
            sendCallLogs((0, call_logs_1.getCallLogs)());
        });
        socket.on(exports.RECV_MSG.unsubscribeCallLogs, () => {
            (0, call_logs_1.offCallLogs)(sendCallLogs);
            subscribedCallLogs = false;
        });
        let subscribedPhonebook = false;
        function sendPhonebook(phonebook) {
            socket.emit(exports.SEND_MSG.phonebook, phonebook);
        }
        socket.on(exports.RECV_MSG.subscribePhonebook, () => {
            if (subscribedPhonebook)
                return;
            subscribedPhonebook = true;
            (0, phonebook_1.onPhonebookChange)(sendPhonebook);
            sendPhonebook((0, phonebook_1.getPhonebook)());
        });
        socket.on(exports.RECV_MSG.unsubscribePhonebook, () => {
            (0, phonebook_1.offPhonebookChange)(sendPhonebook);
            subscribedPhonebook = false;
        });
        socket.on(exports.RECV_MSG.createPhonebookEntry, (entry, cb) => (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const id = yield (0, phonebook_1.createEntry)(entry);
            if (typeof cb === 'function')
                cb(id);
        }));
        socket.on(exports.RECV_MSG.updatePhonebookEntry, (id, entry, cb) => (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const success = yield (0, phonebook_1.updateEntry)(id, entry);
            if (typeof cb === 'function')
                cb(success);
        }));
        socket.on(exports.RECV_MSG.deletePhonebookEntry, (id, cb) => (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            const success = yield (0, phonebook_1.deleteEntry)(id);
            if (typeof cb === 'function')
                cb(success);
        }));
        socket.on('disconnect', () => {
            (0, active_calls_1.offActiveCallsChange)(sendActiveCalls);
            (0, call_logs_1.offCallLogs)(sendCallLogs);
            (0, phonebook_1.offPhonebookChange)(sendPhonebook);
        });
        socket.on(exports.RECV_MSG.makeCall, ({ from, to }) => {
            (0, makeCall_1.makeCall)(from, to);
        });
        (() => (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
            var _a, _b;
            if ((_b = (_a = socket.handshake) === null || _a === void 0 ? void 0 : _a.auth) === null || _b === void 0 ? void 0 : _b.username) {
                const extension = yield (0, auth_1.getUserExtension)(socket.handshake.auth.username);
                socket.emit(exports.SEND_MSG.userExtension, extension);
            }
        }))();
    });
}
//# sourceMappingURL=ws-api.js.map