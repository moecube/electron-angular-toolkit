#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs-extra");
var path = require("path");
var configPath = path.join(__dirname, '..', '..', '@angular', 'cli', 'models', 'webpack-configs', 'common.js');
var copyConfigPath = path.join(__dirname, '..', '..', '@angular', 'cli', 'models', 'webpack-configs', 'common.original.js');
function nativeDependencies(node_modules) {
    if (node_modules === void 0) { node_modules = 'node_modules'; }
    return __awaiter(this, void 0, void 0, function () {
        var result, _i, _a, lib, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    result = [];
                    _i = 0;
                    return [4 /*yield*/, fs.readdir(node_modules)];
                case 1:
                    _a = _d.sent();
                    _d.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 7];
                    lib = _a[_i];
                    return [4 /*yield*/, fs.pathExists(path.join(node_modules, lib, 'binding.gyp'))];
                case 3:
                    if (_d.sent()) {
                        result.push(lib);
                    }
                    return [4 /*yield*/, fs.pathExists(path.join(node_modules, lib, 'node_modules'))];
                case 4:
                    if (!_d.sent()) return [3 /*break*/, 6];
                    _c = (_b = result).concat;
                    return [4 /*yield*/, nativeDependencies(path.join(node_modules, lib, 'node_modules'))];
                case 5:
                    result = _c.apply(_b, [_d.sent()]);
                    _d.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 2];
                case 7: return [2 /*return*/, result];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var externals, _i, _a, lib, originalConfig, newConfig;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    externals = {};
                    _i = 0;
                    return [4 /*yield*/, nativeDependencies()];
                case 1:
                    _a = _b.sent();
                    _b.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    lib = _a[_i];
                    externals[lib] = "require('" + lib + "')";
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 2];
                case 4: return [4 /*yield*/, fs.pathExists(copyConfigPath)];
                case 5:
                    if (!!(_b.sent())) return [3 /*break*/, 7];
                    return [4 /*yield*/, fs.copy(configPath, copyConfigPath)];
                case 6:
                    _b.sent();
                    _b.label = 7;
                case 7: return [4 /*yield*/, fs.readFile(copyConfigPath, 'utf-8')];
                case 8:
                    originalConfig = _b.sent();
                    newConfig = originalConfig.replace(/return ?{/, "return {\n    target: 'electron-renderer',\n    externals: " + JSON.stringify(externals) + "\n  ");
                    return [4 /*yield*/, fs.writeFile(configPath, newConfig)];
                case 9:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    });
}
