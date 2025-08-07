"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.ScreenshotAgent = void 0;
var AgnoSCore_js_1 = require("../core/AgnoSCore.js");
var MinIOService_js_1 = require("../services/MinIOService.js");
var playwright_1 = require("playwright");
var fs = require("fs/promises");
var path = require("path");
var crypto = require("crypto");
var ScreenshotAgent = /** @class */ (function (_super) {
    __extends(ScreenshotAgent, _super);
    function ScreenshotAgent() {
        var _this = this;
        var config = {
            name: 'ScreenshotAgent',
            version: '1.0.0',
            description: 'Agente especializado em captura e gerenciamento de screenshots com cache otimizado',
            capabilities: [
                { name: 'screenshot_capture', description: 'Captura de screenshots com cache inteligente', version: '1.0.0' },
                { name: 'element_screenshot', description: 'Captura de screenshots de elementos específicos', version: '1.0.0' },
                { name: 'batch_processing', description: 'Processamento em lote de screenshots', version: '1.0.0' },
                { name: 'cache_management', description: 'Gerenciamento avançado de cache com detecção de duplicatas', version: '1.0.0' },
                { name: 'minio_integration', description: 'Integração com MinIO para armazenamento em nuvem', version: '1.0.0' }
            ]
        };
        _this = _super.call(this, config) || this;
        _this.cache = new Map();
        _this.browser = null;
        _this.currentPage = null;
        _this.minioService = new MinIOService_js_1.MinIOService();
        _this.cacheFilePath = path.join(process.cwd(), 'output', 'screenshot-cache.json');
        _this.setupTaskHandlers();
        return _this;
    }
    ScreenshotAgent.prototype.setupTaskHandlers = function () {
        // Este método não é mais necessário pois vamos usar processTask
    };
    ScreenshotAgent.prototype.processTask = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = task.type;
                        switch (_a) {
                            case 'take_screenshot': return [3 /*break*/, 1];
                            case 'take_element_screenshot': return [3 /*break*/, 3];
                            case 'batch_screenshots': return [3 /*break*/, 5];
                            case 'clear_cache': return [3 /*break*/, 7];
                            case 'optimize_cache': return [3 /*break*/, 9];
                        }
                        return [3 /*break*/, 11];
                    case 1: return [4 /*yield*/, this.handleTakeScreenshot(task)];
                    case 2: return [2 /*return*/, _b.sent()];
                    case 3: return [4 /*yield*/, this.handleElementScreenshot(task)];
                    case 4: return [2 /*return*/, _b.sent()];
                    case 5: return [4 /*yield*/, this.handleBatchScreenshots(task)];
                    case 6: return [2 /*return*/, _b.sent()];
                    case 7: return [4 /*yield*/, this.handleClearCache(task)];
                    case 8: return [2 /*return*/, _b.sent()];
                    case 9: return [4 /*yield*/, this.handleOptimizeCache(task)];
                    case 10: return [2 /*return*/, _b.sent()];
                    case 11: throw new Error("Tipo de tarefa n\u00E3o suportada: ".concat(task.type));
                }
            });
        });
    };
    ScreenshotAgent.prototype.generateMarkdownReport = function (taskResult) {
        return __awaiter(this, void 0, void 0, function () {
            var data, stats;
            return __generator(this, function (_a) {
                data = taskResult.data;
                if (taskResult.taskId.includes('take_screenshot')) {
                    return [2 /*return*/, "## Screenshot Capturada\n- **URL:** ".concat(data.url || 'N/A', "\n- **Arquivo:** ").concat(data.path || 'N/A', "\n- **Cache:** ").concat(data.fromCache ? '✅ Reutilizado' : '❌ Nova captura', "\n- **Hash:** ").concat(data.hash ? data.hash.substring(0, 8) : 'N/A', "\n").concat(data.duplicate ? '- **Status:** Duplicata detectada e otimizada' : '')];
                }
                if (taskResult.taskId.includes('batch_screenshots')) {
                    stats = data.statistics || {};
                    return [2 /*return*/, "## Processamento em Lote\n- **Total:** ".concat(stats.total || 0, " screenshots\n- **Cache Hits:** ").concat(stats.cacheHits || 0, "\n- **Novas:** ").concat(stats.newScreenshots || 0, "\n- **Duplicatas:** ").concat(stats.duplicates || 0, "\n- **Taxa de Sucesso:** ").concat(((stats.successRate || 0) * 100).toFixed(1), "%")];
                }
                return [2 /*return*/, "## Tarefa de Screenshot\n- **Tipo:** ".concat(taskResult.taskId, "\n- **Status:** ").concat(taskResult.success ? '✅ Sucesso' : '❌ Erro', "\n- **Tempo:** ").concat(taskResult.processingTime, "ms")];
            });
        });
    };
    ScreenshotAgent.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        this.log('🖼️ Inicializando Screenshot Agent...');
                        // Inicializar MinIO
                        return [4 /*yield*/, this.minioService.initialize()];
                    case 1:
                        // Inicializar MinIO
                        _a.sent();
                        // Carregar cache existente
                        return [4 /*yield*/, this.loadCache()];
                    case 2:
                        // Carregar cache existente
                        _a.sent();
                        // Inicializar browser
                        return [4 /*yield*/, this.initializeBrowser()];
                    case 3:
                        // Inicializar browser
                        _a.sent();
                        this.log('✅ Screenshot Agent inicializado');
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        this.log("\u274C Erro na inicializa\u00E7\u00E3o: ".concat(error_1), 'error');
                        throw error_1;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    ScreenshotAgent.prototype.initializeBrowser = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!!this.browser) return [3 /*break*/, 2];
                        _a = this;
                        return [4 /*yield*/, playwright_1.chromium.launch({
                                headless: true,
                                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
                            })];
                    case 1:
                        _a.browser = _b.sent();
                        this.log('🌐 Browser inicializado');
                        _b.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    ScreenshotAgent.prototype.loadCache = function () {
        return __awaiter(this, void 0, void 0, function () {
            var cacheData, cacheArray, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, fs.access(this.cacheFilePath).then(function () { return true; }).catch(function () { return false; })];
                    case 1:
                        if (!_a.sent()) return [3 /*break*/, 3];
                        return [4 /*yield*/, fs.readFile(this.cacheFilePath, 'utf-8')];
                    case 2:
                        cacheData = _a.sent();
                        cacheArray = JSON.parse(cacheData);
                        this.cache = new Map(cacheArray);
                        this.log("\uD83D\uDCCB Cache carregado: ".concat(this.cache.size, " entradas"));
                        _a.label = 3;
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        this.log("\u26A0\uFE0F Erro ao carregar cache: ".concat(error_2), 'warn');
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    ScreenshotAgent.prototype.saveCache = function () {
        return __awaiter(this, void 0, void 0, function () {
            var cacheArray, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        cacheArray = Array.from(this.cache.entries());
                        return [4 /*yield*/, fs.mkdir(path.dirname(this.cacheFilePath), { recursive: true })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, fs.writeFile(this.cacheFilePath, JSON.stringify(cacheArray, null, 2))];
                    case 2:
                        _a.sent();
                        this.log("\uD83D\uDCBE Cache salvo: ".concat(this.cache.size, " entradas"));
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        this.log("\u274C Erro ao salvar cache: ".concat(error_3), 'error');
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ScreenshotAgent.prototype.generateCacheKey = function (url, selector, viewport) {
        var data = "".concat(url, ":").concat(selector || 'fullpage', ":").concat(viewport ? "".concat(viewport.width, "x").concat(viewport.height) : 'default');
        return crypto.createHash('md5').update(data).digest('hex');
    };
    ScreenshotAgent.prototype.calculateImageHash = function (imagePath) {
        return __awaiter(this, void 0, void 0, function () {
            var imageBuffer, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fs.readFile(imagePath)];
                    case 1:
                        imageBuffer = _a.sent();
                        return [2 /*return*/, crypto.createHash('sha256').update(imageBuffer).digest('hex')];
                    case 2:
                        error_4 = _a.sent();
                        this.log("\u274C Erro ao calcular hash da imagem: ".concat(error_4), 'error');
                        return [2 /*return*/, ''];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ScreenshotAgent.prototype.handleTakeScreenshot = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, _a, url, outputPath, selector, _b, type, _c, reuseSession, viewport, cacheKey, cached, _d, screenshotResult, imageHash, duplicateEntry, cacheEntry, remotePath, error_5, error_6;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        startTime = Date.now();
                        _a = task.data, url = _a.url, outputPath = _a.outputPath, selector = _a.selector, _b = _a.type, type = _b === void 0 ? 'fullpage' : _b, _c = _a.reuseSession, reuseSession = _c === void 0 ? true : _c;
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 13, , 14]);
                        this.log("\uD83D\uDCF8 Capturando screenshot: ".concat(url));
                        viewport = { width: 1920, height: 1080 };
                        cacheKey = this.generateCacheKey(url, selector, viewport);
                        cached = this.cache.get(cacheKey);
                        _d = cached;
                        if (!_d) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.isCacheValid(cached)];
                    case 2:
                        _d = (_e.sent());
                        _e.label = 3;
                    case 3:
                        if (_d) {
                            this.log("\u2705 Screenshot encontrada no cache: ".concat(cached.path));
                            return [2 /*return*/, {
                                    id: task.id,
                                    taskId: task.id,
                                    success: true,
                                    data: {
                                        path: cached.path,
                                        url: cached.url,
                                        fromCache: true,
                                        hash: cached.hash
                                    },
                                    timestamp: new Date(),
                                    processingTime: Date.now() - startTime
                                }];
                        }
                        return [4 /*yield*/, this.captureScreenshot(url, outputPath, selector, type, reuseSession)];
                    case 4:
                        screenshotResult = _e.sent();
                        return [4 /*yield*/, this.calculateImageHash(screenshotResult.path)];
                    case 5:
                        imageHash = _e.sent();
                        duplicateEntry = this.findDuplicateByHash(imageHash);
                        if (!duplicateEntry) return [3 /*break*/, 7];
                        this.log("\uD83D\uDD04 Screenshot duplicada detectada, reutilizando: ".concat(duplicateEntry.path));
                        // Remover arquivo duplicado
                        return [4 /*yield*/, fs.unlink(screenshotResult.path).catch(function () { })];
                    case 6:
                        // Remover arquivo duplicado
                        _e.sent();
                        return [2 /*return*/, {
                                id: task.id,
                                taskId: task.id,
                                success: true,
                                data: {
                                    path: duplicateEntry.path,
                                    url: duplicateEntry.url,
                                    fromCache: true,
                                    duplicate: true,
                                    hash: duplicateEntry.hash
                                },
                                timestamp: new Date(),
                                processingTime: Date.now() - startTime
                            }];
                    case 7:
                        cacheEntry = {
                            hash: imageHash,
                            path: screenshotResult.path,
                            url: url,
                            timestamp: Date.now(),
                            metadata: {
                                viewport: viewport,
                                element: selector,
                                selector: selector
                            }
                        };
                        this.cache.set(cacheKey, cacheEntry);
                        return [4 /*yield*/, this.saveCache()];
                    case 8:
                        _e.sent();
                        if (!screenshotResult.path) return [3 /*break*/, 12];
                        _e.label = 9;
                    case 9:
                        _e.trys.push([9, 11, , 12]);
                        remotePath = "screenshots/".concat(path.basename(screenshotResult.path));
                        return [4 /*yield*/, this.minioService.uploadFile(screenshotResult.path, remotePath)];
                    case 10:
                        _e.sent();
                        this.log("\u2601\uFE0F Screenshot enviada para MinIO: ".concat(remotePath));
                        return [3 /*break*/, 12];
                    case 11:
                        error_5 = _e.sent();
                        this.log("\u26A0\uFE0F Erro no upload para MinIO: ".concat(error_5), 'warn');
                        return [3 /*break*/, 12];
                    case 12: return [2 /*return*/, {
                            id: task.id,
                            taskId: task.id,
                            success: true,
                            data: {
                                path: screenshotResult.path,
                                url: url,
                                fromCache: false,
                                hash: imageHash
                            },
                            timestamp: new Date(),
                            processingTime: Date.now() - startTime
                        }];
                    case 13:
                        error_6 = _e.sent();
                        this.log("\u274C Erro ao capturar screenshot: ".concat(error_6), 'error');
                        throw error_6;
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    ScreenshotAgent.prototype.handleElementScreenshot = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, _a, url, outputPath, selectors, page, results, i, selector, elementPath, element, buffer, imageHash, duplicate, cacheKey, remotePath, error_7, error_8, error_9;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        startTime = Date.now();
                        _a = task.data, url = _a.url, outputPath = _a.outputPath, selectors = _a.selectors;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 26, , 27]);
                        this.log("\uD83D\uDCF8 Capturando screenshots de elementos: ".concat(url));
                        if (!!this.browser) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.initializeBrowser()];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3: return [4 /*yield*/, this.browser.newPage()];
                    case 4:
                        page = _b.sent();
                        return [4 /*yield*/, page.setViewportSize({ width: 1920, height: 1080 })];
                    case 5:
                        _b.sent();
                        return [4 /*yield*/, page.goto(url, { waitUntil: 'networkidle' })];
                    case 6:
                        _b.sent();
                        results = [];
                        i = 0;
                        _b.label = 7;
                    case 7:
                        if (!(i < selectors.length)) return [3 /*break*/, 23];
                        selector = selectors[i];
                        elementPath = "".concat(outputPath, "_element_").concat(i + 1, "_").concat(selector.replace(/[^a-zA-Z0-9]/g, '_'), ".png");
                        _b.label = 8;
                    case 8:
                        _b.trys.push([8, 21, , 22]);
                        return [4 /*yield*/, page.$(selector)];
                    case 9:
                        element = _b.sent();
                        if (!element) return [3 /*break*/, 19];
                        return [4 /*yield*/, element.screenshot()];
                    case 10:
                        buffer = _b.sent();
                        return [4 /*yield*/, fs.writeFile(elementPath, buffer)];
                    case 11:
                        _b.sent();
                        return [4 /*yield*/, this.calculateImageHash(elementPath)];
                    case 12:
                        imageHash = _b.sent();
                        duplicate = this.findDuplicateByHash(imageHash);
                        if (!duplicate) return [3 /*break*/, 14];
                        return [4 /*yield*/, fs.unlink(elementPath).catch(function () { })];
                    case 13:
                        _b.sent();
                        results.push({
                            selector: selector,
                            path: duplicate.path,
                            fromCache: true,
                            hash: duplicate.hash
                        });
                        return [3 /*break*/, 18];
                    case 14:
                        cacheKey = this.generateCacheKey(url, selector);
                        this.cache.set(cacheKey, {
                            hash: imageHash,
                            path: elementPath,
                            url: url,
                            timestamp: Date.now(),
                            metadata: {
                                viewport: { width: 1920, height: 1080 },
                                element: selector,
                                selector: selector
                            }
                        });
                        results.push({
                            selector: selector,
                            path: elementPath,
                            fromCache: false,
                            hash: imageHash
                        });
                        _b.label = 15;
                    case 15:
                        _b.trys.push([15, 17, , 18]);
                        remotePath = "screenshots/elements/".concat(path.basename(elementPath));
                        return [4 /*yield*/, this.minioService.uploadFile(elementPath, remotePath)];
                    case 16:
                        _b.sent();
                        return [3 /*break*/, 18];
                    case 17:
                        error_7 = _b.sent();
                        this.log("\u26A0\uFE0F Erro no upload para MinIO: ".concat(error_7), 'warn');
                        return [3 /*break*/, 18];
                    case 18: return [3 /*break*/, 20];
                    case 19:
                        this.log("\u26A0\uFE0F Elemento n\u00E3o encontrado: ".concat(selector), 'warn');
                        _b.label = 20;
                    case 20: return [3 /*break*/, 22];
                    case 21:
                        error_8 = _b.sent();
                        this.log("\u274C Erro ao capturar elemento ".concat(selector, ": ").concat(error_8), 'error');
                        return [3 /*break*/, 22];
                    case 22:
                        i++;
                        return [3 /*break*/, 7];
                    case 23: return [4 /*yield*/, page.close()];
                    case 24:
                        _b.sent();
                        return [4 /*yield*/, this.saveCache()];
                    case 25:
                        _b.sent();
                        return [2 /*return*/, {
                                id: task.id,
                                taskId: task.id,
                                success: true,
                                data: {
                                    results: results,
                                    totalElements: results.length,
                                    cached: results.filter(function (r) { return r.fromCache; }).length
                                },
                                timestamp: new Date(),
                                processingTime: Date.now() - startTime
                            }];
                    case 26:
                        error_9 = _b.sent();
                        this.log("\u274C Erro ao capturar screenshots de elementos: ".concat(error_9), 'error');
                        throw error_9;
                    case 27: return [2 /*return*/];
                }
            });
        });
    };
    ScreenshotAgent.prototype.captureScreenshot = function (url_1, outputPath_1, selector_1) {
        return __awaiter(this, arguments, void 0, function (url, outputPath, selector, type, reuseSession) {
            var page, element, buffer, buffer;
            if (type === void 0) { type = 'fullpage'; }
            if (reuseSession === void 0) { reuseSession = true; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.browser) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.initializeBrowser()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!(reuseSession && this.currentPage)) return [3 /*break*/, 3];
                        page = this.currentPage;
                        return [3 /*break*/, 6];
                    case 3: return [4 /*yield*/, this.browser.newPage()];
                    case 4:
                        page = _a.sent();
                        return [4 /*yield*/, page.setViewportSize({ width: 1920, height: 1080 })];
                    case 5:
                        _a.sent();
                        if (reuseSession) {
                            this.currentPage = page;
                        }
                        _a.label = 6;
                    case 6: return [4 /*yield*/, page.goto(url, { waitUntil: 'networkidle' })];
                    case 7:
                        _a.sent();
                        // Aguardar um pouco para garantir que a página carregou completamente
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
                    case 8:
                        // Aguardar um pouco para garantir que a página carregou completamente
                        _a.sent();
                        // Criar diretório se não existir
                        return [4 /*yield*/, fs.mkdir(path.dirname(outputPath), { recursive: true })];
                    case 9:
                        // Criar diretório se não existir
                        _a.sent();
                        if (!selector) return [3 /*break*/, 15];
                        return [4 /*yield*/, page.$(selector)];
                    case 10:
                        element = _a.sent();
                        if (!element) return [3 /*break*/, 13];
                        return [4 /*yield*/, element.screenshot()];
                    case 11:
                        buffer = _a.sent();
                        return [4 /*yield*/, fs.writeFile(outputPath, buffer)];
                    case 12:
                        _a.sent();
                        return [3 /*break*/, 14];
                    case 13: throw new Error("Elemento n\u00E3o encontrado: ".concat(selector));
                    case 14: return [3 /*break*/, 18];
                    case 15: return [4 /*yield*/, page.screenshot({
                            fullPage: type === 'fullpage'
                        })];
                    case 16:
                        buffer = _a.sent();
                        return [4 /*yield*/, fs.writeFile(outputPath, buffer)];
                    case 17:
                        _a.sent();
                        _a.label = 18;
                    case 18:
                        if (!!reuseSession) return [3 /*break*/, 20];
                        return [4 /*yield*/, page.close()];
                    case 19:
                        _a.sent();
                        _a.label = 20;
                    case 20: return [2 /*return*/, { path: outputPath }];
                }
            });
        });
    };
    ScreenshotAgent.prototype.isCacheValid = function (cached) {
        return __awaiter(this, void 0, void 0, function () {
            var maxAge, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        // Verificar se arquivo ainda existe
                        return [4 /*yield*/, fs.access(cached.path)];
                    case 1:
                        // Verificar se arquivo ainda existe
                        _b.sent();
                        maxAge = 60 * 60 * 1000;
                        return [2 /*return*/, (Date.now() - cached.timestamp) < maxAge];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ScreenshotAgent.prototype.findDuplicateByHash = function (hash) {
        for (var _i = 0, _a = Array.from(this.cache.entries()); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], entry = _b[1];
            if (entry.hash === hash) {
                return entry;
            }
        }
        return null;
    };
    ScreenshotAgent.prototype.handleBatchScreenshots = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, screenshots, results, cacheHits, newScreenshots, duplicates, _i, screenshots_1, screenshot, result, error_10, error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        screenshots = task.data.screenshots;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 9]);
                        this.log("\uD83D\uDCF8 Processamento em lote: ".concat(screenshots.length, " screenshots"));
                        results = [];
                        cacheHits = 0;
                        newScreenshots = 0;
                        duplicates = 0;
                        _i = 0, screenshots_1 = screenshots;
                        _a.label = 2;
                    case 2:
                        if (!(_i < screenshots_1.length)) return [3 /*break*/, 7];
                        screenshot = screenshots_1[_i];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this.handleTakeScreenshot({
                                id: "batch_".concat(Date.now()),
                                type: 'take_screenshot',
                                data: screenshot,
                                sender: 'ScreenshotAgent',
                                priority: 'medium',
                                timestamp: new Date()
                            })];
                    case 4:
                        result = _a.sent();
                        results.push(result.data);
                        if (result.data.fromCache) {
                            cacheHits++;
                        }
                        else {
                            newScreenshots++;
                        }
                        if (result.data.duplicate) {
                            duplicates++;
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        error_10 = _a.sent();
                        this.log("\u274C Erro em screenshot individual: ".concat(error_10), 'error');
                        results.push({
                            url: screenshot.url,
                            error: error_10 instanceof Error ? error_10.message : String(error_10),
                            success: false
                        });
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7:
                        this.log("\uD83D\uDCCA Estat\u00EDsticas do lote: ".concat(cacheHits, " cache hits, ").concat(newScreenshots, " novas, ").concat(duplicates, " duplicatas"));
                        return [2 /*return*/, {
                                id: task.id,
                                taskId: task.id,
                                success: true,
                                data: {
                                    results: results,
                                    statistics: {
                                        total: screenshots.length,
                                        cacheHits: cacheHits,
                                        newScreenshots: newScreenshots,
                                        duplicates: duplicates,
                                        successRate: results.filter(function (r) { return r.success !== false; }).length / screenshots.length
                                    }
                                },
                                timestamp: new Date(),
                                processingTime: Date.now() - startTime
                            }];
                    case 8:
                        error_11 = _a.sent();
                        this.log("\u274C Erro no processamento em lote: ".concat(error_11), 'error');
                        throw error_11;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    ScreenshotAgent.prototype.handleClearCache = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var oldSize, error_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        oldSize = this.cache.size;
                        this.cache.clear();
                        return [4 /*yield*/, this.saveCache()];
                    case 1:
                        _a.sent();
                        this.log("\uD83D\uDDD1\uFE0F Cache limpo: ".concat(oldSize, " entradas removidas"));
                        return [2 /*return*/, {
                                id: task.id,
                                taskId: task.id,
                                success: true,
                                data: {
                                    cleared: oldSize,
                                    message: "Cache limpo com sucesso: ".concat(oldSize, " entradas removidas")
                                },
                                timestamp: new Date(),
                                processingTime: 0
                            }];
                    case 2:
                        error_12 = _a.sent();
                        this.log("\u274C Erro ao limpar cache: ".concat(error_12), 'error');
                        throw error_12;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ScreenshotAgent.prototype.handleOptimizeCache = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, initialSize, removed, invalid, _i, _a, _b, key, entry, _c, error_13;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        startTime = Date.now();
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 10, , 11]);
                        this.log('🔧 Otimizando cache...');
                        initialSize = this.cache.size;
                        removed = 0;
                        invalid = 0;
                        _i = 0, _a = Array.from(this.cache.entries());
                        _d.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 8];
                        _b = _a[_i], key = _b[0], entry = _b[1];
                        return [4 /*yield*/, this.isCacheValid(entry)];
                    case 3:
                        if (!(_d.sent())) {
                            this.cache.delete(key);
                            removed++;
                        }
                        _d.label = 4;
                    case 4:
                        _d.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, fs.access(entry.path)];
                    case 5:
                        _d.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        _c = _d.sent();
                        this.cache.delete(key);
                        invalid++;
                        return [3 /*break*/, 7];
                    case 7:
                        _i++;
                        return [3 /*break*/, 2];
                    case 8: return [4 /*yield*/, this.saveCache()];
                    case 9:
                        _d.sent();
                        this.log("\u2705 Cache otimizado: ".concat(removed, " expiradas, ").concat(invalid, " inv\u00E1lidas, ").concat(this.cache.size, " restantes"));
                        return [2 /*return*/, {
                                id: task.id,
                                taskId: task.id,
                                success: true,
                                data: {
                                    initialSize: initialSize,
                                    finalSize: this.cache.size,
                                    removed: removed,
                                    invalid: invalid,
                                    optimization: "".concat(((removed + invalid) / initialSize * 100).toFixed(1), "% redu\u00E7\u00E3o")
                                },
                                timestamp: new Date(),
                                processingTime: Date.now() - startTime
                            }];
                    case 10:
                        error_13 = _d.sent();
                        this.log("\u274C Erro na otimiza\u00E7\u00E3o do cache: ".concat(error_13), 'error');
                        throw error_13;
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    ScreenshotAgent.prototype.cleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_14;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.saveCache()];
                    case 1:
                        _a.sent();
                        if (!(this.currentPage && !this.currentPage.isClosed())) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.currentPage.close()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        if (!this.browser) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.browser.close()];
                    case 4:
                        _a.sent();
                        this.browser = null;
                        _a.label = 5;
                    case 5:
                        this.log('🧹 Screenshot Agent finalizado');
                        return [3 /*break*/, 7];
                    case 6:
                        error_14 = _a.sent();
                        this.log("\u274C Erro na finaliza\u00E7\u00E3o: ".concat(error_14), 'error');
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    // Métodos públicos para uso por outros agentes
    ScreenshotAgent.prototype.takeScreenshot = function (url, outputPath, selector) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.handleTakeScreenshot({
                            id: "direct_".concat(Date.now()),
                            type: 'take_screenshot',
                            data: { url: url, outputPath: outputPath, selector: selector },
                            sender: 'ScreenshotAgent',
                            priority: 'medium',
                            timestamp: new Date()
                        })];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.data];
                }
            });
        });
    };
    ScreenshotAgent.prototype.getCacheStatistics = function () {
        if (this.cache.size === 0) {
            return { size: 0, oldestEntry: 0, newestEntry: 0 };
        }
        var timestamps = Array.from(this.cache.values()).map(function (entry) { return entry.timestamp; });
        return {
            size: this.cache.size,
            oldestEntry: Math.min.apply(Math, timestamps),
            newestEntry: Math.max.apply(Math, timestamps)
        };
    };
    return ScreenshotAgent;
}(AgnoSCore_js_1.BaseAgent));
exports.ScreenshotAgent = ScreenshotAgent;
