"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
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
exports.MinIOService = void 0;
var minio_1 = require("minio");
var fs = require("fs/promises");
var path = require("path");
var dotenv = require("dotenv");
dotenv.config();
var MinIOService = /** @class */ (function () {
    function MinIOService() {
        this.isAvailable = false;
        this.enabled = false;
        var endpoint = process.env.MINIO_ENDPOINT || 'localhost';
        var useSSL = process.env.MINIO_SECURE === 'true';
        var accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
        var secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';
        this.bucketName = process.env.MINIO_BUCKET_NAME || 'documentacao';
        this.endPoint = endpoint;
        this.enabled = !!(endpoint && accessKey && secretKey);
        if (this.enabled) {
            this.client = new minio_1.Client({
                endPoint: endpoint,
                port: useSSL ? 443 : 80,
                useSSL: useSSL,
                accessKey: accessKey,
                secretKey: secretKey
            });
            console.log("\u2705 MinIO configurado: ".concat(useSSL ? 'https' : 'http', "://").concat(endpoint, ":").concat(useSSL ? 443 : 80));
        }
        else {
            console.log('⚠️  MinIO não configurado - usando apenas armazenamento local');
        }
    }
    MinIOService.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var bucketExists, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        console.log('🗄️ [MinIO] Verificando conexão...');
                        // Testar conexão
                        return [4 /*yield*/, this.client.listBuckets()];
                    case 1:
                        // Testar conexão
                        _a.sent();
                        return [4 /*yield*/, this.client.bucketExists(this.bucketName)];
                    case 2:
                        bucketExists = _a.sent();
                        if (!!bucketExists) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.client.makeBucket(this.bucketName)];
                    case 3:
                        _a.sent();
                        console.log("\u2705 [MinIO] Bucket '".concat(this.bucketName, "' criado"));
                        _a.label = 4;
                    case 4:
                        this.isAvailable = true;
                        console.log("\u2705 [MinIO] Conectado ao bucket '".concat(this.bucketName, "'"));
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        console.log("\u26A0\uFE0F [MinIO] N\u00E3o dispon\u00EDvel: ".concat(error_1 instanceof Error ? error_1.message : error_1));
                        this.isAvailable = false;
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    MinIOService.prototype.uploadFile = function (localPath, remotePath, contentType) {
        return __awaiter(this, void 0, void 0, function () {
            var stats, url, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isAvailable) {
                            console.log('⚠️ [MinIO] Serviço não disponível, salvando localmente');
                            return [2 /*return*/, null];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fs.stat(localPath)];
                    case 2:
                        stats = _a.sent();
                        return [4 /*yield*/, this.client.fPutObject(this.bucketName, remotePath, localPath, {
                                'Content-Type': contentType || this.getContentType(localPath),
                                'Content-Length': stats.size
                            })];
                    case 3:
                        _a.sent();
                        url = "https://".concat(this.endPoint, "/").concat(this.bucketName, "/").concat(remotePath);
                        console.log("\uD83D\uDCE4 [MinIO] Upload realizado: ".concat(remotePath));
                        return [2 /*return*/, url];
                    case 4:
                        error_2 = _a.sent();
                        console.log("\u274C [MinIO] Erro no upload de ".concat(localPath, ": ").concat(error_2));
                        return [2 /*return*/, null];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    MinIOService.prototype.uploadBuffer = function (buffer, remotePath, contentType) {
        return __awaiter(this, void 0, void 0, function () {
            var url, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isAvailable) {
                            console.log('⚠️ [MinIO] Serviço não disponível');
                            return [2 /*return*/, null];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.client.putObject(this.bucketName, remotePath, buffer, buffer.length, {
                                'Content-Type': contentType
                            })];
                    case 2:
                        _a.sent();
                        url = "https://".concat(this.endPoint, "/").concat(this.bucketName, "/").concat(remotePath);
                        console.log("\uD83D\uDCE4 [MinIO] Buffer upload realizado: ".concat(remotePath));
                        return [2 /*return*/, url];
                    case 3:
                        error_3 = _a.sent();
                        console.log("\u274C [MinIO] Erro no upload do buffer: ".concat(error_3));
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    MinIOService.prototype.uploadScreenshot = function (localPath, filename) {
        return __awaiter(this, void 0, void 0, function () {
            var remotePath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        remotePath = "screenshots/".concat(filename);
                        return [4 /*yield*/, this.uploadFile(localPath, remotePath, 'image/png')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    MinIOService.prototype.uploadManual = function (content, filename, format) {
        return __awaiter(this, void 0, void 0, function () {
            var remotePath, contentType, buffer, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isAvailable) {
                            return [2 /*return*/, null];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        remotePath = "manuais/".concat(format, "/").concat(filename);
                        contentType = this.getContentTypeForFormat(format);
                        buffer = Buffer.from(content, 'utf-8');
                        return [4 /*yield*/, this.uploadBuffer(buffer, remotePath, contentType)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_4 = _a.sent();
                        console.log("\u274C [MinIO] Erro no upload do manual: ".concat(error_4));
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    MinIOService.prototype.uploadReportMarkdown = function (content, agentName, taskId) {
        return __awaiter(this, void 0, void 0, function () {
            var remotePath, buffer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isAvailable) {
                            return [2 /*return*/, null];
                        }
                        remotePath = "relatorios/".concat(agentName, "/").concat(taskId, ".md");
                        buffer = Buffer.from(content, 'utf-8');
                        return [4 /*yield*/, this.uploadBuffer(buffer, remotePath, 'text/markdown')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    MinIOService.prototype.downloadFile = function (remotePath, localPath) {
        return __awaiter(this, void 0, void 0, function () {
            var error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isAvailable) {
                            return [2 /*return*/, false];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.client.fGetObject(this.bucketName, remotePath, localPath)];
                    case 2:
                        _a.sent();
                        console.log("\uD83D\uDCE5 [MinIO] Download realizado: ".concat(remotePath, " -> ").concat(localPath));
                        return [2 /*return*/, true];
                    case 3:
                        error_5 = _a.sent();
                        console.log("\u274C [MinIO] Erro no download: ".concat(error_5));
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    MinIOService.prototype.listFiles = function (prefix) {
        return __awaiter(this, void 0, void 0, function () {
            var files_1, stream_1;
            return __generator(this, function (_a) {
                if (!this.isAvailable) {
                    return [2 /*return*/, []];
                }
                try {
                    files_1 = [];
                    stream_1 = this.client.listObjects(this.bucketName, prefix, true);
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            stream_1.on('data', function (obj) {
                                if (obj.name) {
                                    files_1.push(obj.name);
                                }
                            });
                            stream_1.on('error', function (error) {
                                reject(error);
                            });
                            stream_1.on('end', function () {
                                resolve(files_1);
                            });
                        })];
                }
                catch (error) {
                    console.log("\u274C [MinIO] Erro ao listar arquivos: ".concat(error));
                    return [2 /*return*/, []];
                }
                return [2 /*return*/];
            });
        });
    };
    MinIOService.prototype.deleteFile = function (remotePath) {
        return __awaiter(this, void 0, void 0, function () {
            var error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isAvailable) {
                            return [2 /*return*/, false];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.client.removeObject(this.bucketName, remotePath)];
                    case 2:
                        _a.sent();
                        console.log("\uD83D\uDDD1\uFE0F [MinIO] Arquivo removido: ".concat(remotePath));
                        return [2 /*return*/, true];
                    case 3:
                        error_6 = _a.sent();
                        console.log("\u274C [MinIO] Erro ao remover arquivo: ".concat(error_6));
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    MinIOService.prototype.getFileUrl = function (remotePath_1) {
        return __awaiter(this, arguments, void 0, function (remotePath, expiry) {
            var url, error_7;
            if (expiry === void 0) { expiry = 7 * 24 * 60 * 60; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isAvailable) {
                            return [2 /*return*/, null];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.client.presignedGetObject(this.bucketName, remotePath, expiry)];
                    case 2:
                        url = _a.sent();
                        return [2 /*return*/, url];
                    case 3:
                        error_7 = _a.sent();
                        console.log("\u274C [MinIO] Erro ao gerar URL: ".concat(error_7));
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    MinIOService.prototype.getContentType = function (filePath) {
        var ext = path.extname(filePath).toLowerCase();
        var contentTypes = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.pdf': 'application/pdf',
            '.html': 'text/html',
            '.md': 'text/markdown',
            '.txt': 'text/plain',
            '.json': 'application/json'
        };
        return contentTypes[ext] || 'application/octet-stream';
    };
    MinIOService.prototype.getContentTypeForFormat = function (format) {
        var types = {
            'md': 'text/markdown',
            'html': 'text/html',
            'pdf': 'application/pdf'
        };
        return types[format];
    };
    MinIOService.prototype.isServiceAvailable = function () {
        return this.isAvailable;
    };
    MinIOService.prototype.getBucketName = function () {
        return this.bucketName;
    };
    return MinIOService;
}());
exports.MinIOService = MinIOService;
