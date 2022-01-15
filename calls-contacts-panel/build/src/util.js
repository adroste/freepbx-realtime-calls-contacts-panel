"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProperPath = void 0;
const tslib_1 = require("tslib");
const appRoot = (0, tslib_1.__importStar)(require("app-root-path"));
const path_1 = require("path");
function getProperPath(path) {
    if (path.startsWith('./') || path.startsWith('../'))
        return (0, path_1.join)(appRoot.toString(), path);
    return path;
}
exports.getProperPath = getProperPath;
//# sourceMappingURL=util.js.map