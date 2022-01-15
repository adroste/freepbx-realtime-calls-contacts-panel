"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initHttpApi = void 0;
const tslib_1 = require("tslib");
const express_1 = (0, tslib_1.__importDefault)(require("express"));
const config_1 = require("../config");
const web_server_1 = require("../web-server");
const phonebook_fanvil_1 = require("../func/phonebook-fanvil");
const phonebook_yealink_1 = require("../func/phonebook-yealink");
const caller_id_1 = require("../func/caller-id");
const TAG = '[HTTP API]';
function initHttpApi() {
    const app = (0, web_server_1.getExpress)();
    app.use('/callpanel/', express_1.default.static((0, config_1.getConfig)().frontendBuildDir));
    app.get('/callpanel/fanvil-phonebook.xml', (_, res) => {
        res.setHeader('content-type', 'text/xml');
        res.send((0, phonebook_fanvil_1.getPhonebookFanvilXml)());
    });
    app.get('/callpanel/yealink-phonebook.xml', (_, res) => {
        res.setHeader('content-type', 'text/xml');
        res.send((0, phonebook_yealink_1.getPhonebookYealinkXml)());
    });
    app.get('/callpanel/lookupcallerid', (req, res) => {
        const number = req.query['number'];
        if (!number || typeof number !== 'string') {
            res.send('');
        }
        else {
            const caller = (0, caller_id_1.resolveCaller)(number);
            res.send((caller === null || caller === void 0 ? void 0 : caller.combinedName) || number);
        }
    });
    console.log(TAG, `HTTP api listening...`);
}
exports.initHttpApi = initHttpApi;
//# sourceMappingURL=http-api.js.map