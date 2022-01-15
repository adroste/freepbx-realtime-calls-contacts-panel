"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExpress = exports.startWebServer = exports.httpServer = void 0;
const tslib_1 = require("tslib");
const http = (0, tslib_1.__importStar)(require("http"));
const cors_1 = (0, tslib_1.__importDefault)(require("cors"));
const express_1 = (0, tslib_1.__importDefault)(require("express"));
const config_1 = require("./config");
const TAG = '[Web Server]';
let app;
function promisedHttpListen(server, port) {
    return new Promise((resolve, reject) => {
        server.on('listening', resolve);
        server.on('error', reject);
        server.listen(port);
    });
}
function startWebServer() {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        setupExpress();
        exports.httpServer = http.createServer(app);
        const port = (0, config_1.getConfig)().httpPort;
        yield promisedHttpListen(exports.httpServer, port);
        console.log(TAG, `HTTP server listening on port ${port}`);
    });
}
exports.startWebServer = startWebServer;
function getExpress() {
    return app;
}
exports.getExpress = getExpress;
function setupExpress() {
    app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        origin: true,
        credentials: true,
    }));
}
//# sourceMappingURL=web-server.js.map