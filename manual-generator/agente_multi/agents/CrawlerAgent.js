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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrawlerAgent = void 0;
var AgnoSCore_js_1 = require("../core/AgnoSCore.js");
var MinIOService_js_1 = require("../services/MinIOService.js");
var fs = require("fs/promises");
var path = require("path");
var CrawlerAgent = /** @class */ (function (_super) {
    __extends(CrawlerAgent, _super);
    function CrawlerAgent() {
        var _this = this;
        var config = {
            name: 'CrawlerAgent',
            version: '1.0.0',
            description: 'Agente especializado em navegação web e captura de dados',
            capabilities: [
                { name: 'web_crawling', description: 'Navegação e crawling de páginas web', version: '1.0.0' },
                { name: 'element_detection', description: 'Detecção de elementos interativos', version: '1.0.0' },
                { name: 'screenshot_capture', description: 'Captura de screenshots hierárquicos', version: '1.0.0' },
                { name: 'page_interaction', description: 'Interação com elementos da página', version: '1.0.0' }
            ]
        };
        _this = _super.call(this, config) || this;
        _this.page = null;
        _this.browser = null;
        _this.visitedPages = new Set();
        _this.allPageData = [];
        _this.minioService = new MinIOService_js_1.MinIOService();
        return _this;
    }
    CrawlerAgent.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.minioService.initialize()];
                    case 1:
                        _a.sent();
                        this.log('CrawlerAgent inicializado e pronto para navegação');
                        return [2 /*return*/];
                }
            });
        });
    };
    CrawlerAgent.prototype.processTask = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, _a, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        startTime = Date.now();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 12, , 13]);
                        _a = task.type;
                        switch (_a) {
                            case 'start_crawl': return [3 /*break*/, 2];
                            case 'start_authenticated_crawl': return [3 /*break*/, 4];
                            case 'crawl_page': return [3 /*break*/, 6];
                            case 'capture_elements': return [3 /*break*/, 8];
                        }
                        return [3 /*break*/, 10];
                    case 2: return [4 /*yield*/, this.handleCrawl(task)];
                    case 3: return [2 /*return*/, _b.sent()];
                    case 4: return [4 /*yield*/, this.handleAuthenticatedCrawl(task)];
                    case 5: return [2 /*return*/, _b.sent()];
                    case 6: return [4 /*yield*/, this.handlePageCrawl(task)];
                    case 7: return [2 /*return*/, _b.sent()];
                    case 8: return [4 /*yield*/, this.handleElementCapture(task)];
                    case 9: return [2 /*return*/, _b.sent()];
                    case 10: throw new Error("Tipo de tarefa n\u00E3o suportada: ".concat(task.type));
                    case 11: return [3 /*break*/, 13];
                    case 12:
                        error_1 = _b.sent();
                        return [2 /*return*/, {
                                id: task.id,
                                taskId: task.id,
                                success: false,
                                error: error_1 instanceof Error ? error_1.message : String(error_1),
                                timestamp: new Date(),
                                processingTime: Date.now() - startTime
                            }];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    CrawlerAgent.prototype.handleCrawl = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, url, sessionData, authContext, enableScreenshots, page, targetPage, crawlResults, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = task.data, url = _a.url, sessionData = _a.sessionData, authContext = _a.authContext, enableScreenshots = _a.enableScreenshots, page = _a.page;
                        this.log("Iniciando crawl de: ".concat(url));
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 8, , 9]);
                        targetPage = page || this.page;
                        if (!targetPage) {
                            throw new Error('Página não disponível para crawling');
                        }
                        if (!(targetPage.url() !== url)) return [3 /*break*/, 4];
                        return [4 /*yield*/, targetPage.goto(url, { waitUntil: 'domcontentloaded' })];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, targetPage.waitForTimeout(2000)];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4:
                        if (!sessionData) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.restoreSession(sessionData)];
                    case 5:
                        _b.sent();
                        _b.label = 6;
                    case 6: return [4 /*yield*/, this.performComprehensiveCrawl(url, 2)];
                    case 7:
                        crawlResults = _b.sent();
                        return [2 /*return*/, {
                                id: task.id,
                                taskId: task.id,
                                success: true,
                                data: {
                                    crawlResults: crawlResults,
                                    sessionData: sessionData,
                                    authContext: authContext,
                                    pagesProcessed: crawlResults.length,
                                    totalElements: crawlResults.reduce(function (sum, page) { var _a; return sum + (((_a = page.elements) === null || _a === void 0 ? void 0 : _a.length) || 0); }, 0),
                                    screenshots: crawlResults.flatMap(function (page) { return page.screenshots || []; }).filter(Boolean)
                                },
                                timestamp: new Date(),
                                processingTime: 0 // será calculado pelo BaseAgent
                            }];
                    case 8:
                        error_2 = _b.sent();
                        this.log("Erro no crawl: ".concat(error_2), 'error');
                        throw error_2;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    CrawlerAgent.prototype.handleAuthenticatedCrawl = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, sessionData, loginScreenshot, postLoginScreenshot, authType, startUrl, crawlResults, error_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = task.data, sessionData = _a.sessionData, loginScreenshot = _a.loginScreenshot, postLoginScreenshot = _a.postLoginScreenshot, authType = _a.authType;
                        this.log('Iniciando crawl autenticado');
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 7]);
                        if (!this.page) {
                            throw new Error('Página não disponível para crawling');
                        }
                        if (!sessionData) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.restoreSession(sessionData)];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        startUrl = this.page.url();
                        return [4 /*yield*/, this.performComprehensiveCrawl(startUrl, 2)];
                    case 4:
                        crawlResults = _b.sent();
                        // 📄 SALVAR DADOS INTERMEDIÁRIOS EM .MD
                        return [4 /*yield*/, this.saveCrawlerDataMarkdown(crawlResults)];
                    case 5:
                        // 📄 SALVAR DADOS INTERMEDIÁRIOS EM .MD
                        _b.sent();
                        // Enviar dados para análise
                        this.sendTask('AnalysisAgent', 'analyze_crawl_data', {
                            crawlResults: crawlResults,
                            sessionData: sessionData,
                            authContext: {
                                loginScreenshot: loginScreenshot,
                                postLoginScreenshot: postLoginScreenshot,
                                authType: authType
                            }
                        }, 'high');
                        return [2 /*return*/, {
                                id: task.id,
                                taskId: task.id,
                                success: true,
                                data: {
                                    pagesProcessed: crawlResults.length,
                                    totalElements: crawlResults.reduce(function (sum, page) { return sum + page.elements.length; }, 0),
                                    screenshots: crawlResults.flatMap(function (page) { return page.screenshots; }),
                                    startUrl: startUrl
                                },
                                timestamp: new Date(),
                                processingTime: 0
                            }];
                    case 6:
                        error_3 = _b.sent();
                        this.log("Erro no crawl autenticado: ".concat(error_3), 'error');
                        throw error_3;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    CrawlerAgent.prototype.handlePageCrawl = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, url, _b, options, pageData, error_4;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = task.data, url = _a.url, _b = _a.options, options = _b === void 0 ? {} : _b;
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        if (!this.page) {
                            throw new Error('Página não disponível');
                        }
                        return [4 /*yield*/, this.crawlSinglePage(url, options)];
                    case 2:
                        pageData = _c.sent();
                        return [2 /*return*/, {
                                id: task.id,
                                taskId: task.id,
                                success: true,
                                data: pageData,
                                timestamp: new Date(),
                                processingTime: 0
                            }];
                    case 3:
                        error_4 = _c.sent();
                        throw error_4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CrawlerAgent.prototype.handleElementCapture = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, elements, pageUrl, screenshots, error_5;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = task.data, elements = _a.elements, pageUrl = _a.pageUrl;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.captureElementScreenshots(elements, pageUrl)];
                    case 2:
                        screenshots = _b.sent();
                        return [2 /*return*/, {
                                id: task.id,
                                taskId: task.id,
                                success: true,
                                data: { screenshots: screenshots, elementCount: elements.length },
                                timestamp: new Date(),
                                processingTime: 0
                            }];
                    case 3:
                        error_5 = _b.sent();
                        throw error_5;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CrawlerAgent.prototype.performComprehensiveCrawl = function (startUrl, maxDepth) {
        return __awaiter(this, void 0, void 0, function () {
            var results, urlQueue, _a, url, depth, pageData, newLinks, _i, _b, link, error_6;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        results = [];
                        urlQueue = [{ url: startUrl, depth: 0 }];
                        this.visitedPages.clear();
                        this.log("Iniciando crawl abrangente de: ".concat(startUrl, " (max depth: ").concat(maxDepth, ")"));
                        _c.label = 1;
                    case 1:
                        if (!(urlQueue.length > 0)) return [3 /*break*/, 9];
                        _a = urlQueue.shift(), url = _a.url, depth = _a.depth;
                        if (this.visitedPages.has(url) || depth > maxDepth) {
                            return [3 /*break*/, 1];
                        }
                        this.log("Processando (depth ".concat(depth, "): ").concat(url));
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 6, , 7]);
                        return [4 /*yield*/, this.crawlSinglePage(url, { captureElements: true, depth: depth })];
                    case 3:
                        pageData = _c.sent();
                        if (!pageData) return [3 /*break*/, 5];
                        results.push(pageData);
                        this.visitedPages.add(url);
                        this.allPageData.push(pageData);
                        if (!(depth < maxDepth)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.discoverPageLinks(url)];
                    case 4:
                        newLinks = _c.sent();
                        for (_i = 0, _b = newLinks.slice(0, 3); _i < _b.length; _i++) { // Limitar a 3 links por página
                            link = _b[_i];
                            if (!this.visitedPages.has(link)) {
                                urlQueue.push({ url: link, depth: depth + 1 });
                            }
                        }
                        _c.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_6 = _c.sent();
                        this.log("Erro ao processar ".concat(url, ": ").concat(error_6), 'warn');
                        return [3 /*break*/, 7];
                    case 7: 
                    // Pausa entre páginas para evitar sobrecarga
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1500); })];
                    case 8:
                        // Pausa entre páginas para evitar sobrecarga
                        _c.sent();
                        return [3 /*break*/, 1];
                    case 9:
                        this.log("Crawl conclu\u00EDdo: ".concat(results.length, " p\u00E1ginas processadas"));
                        return [2 /*return*/, results];
                }
            });
        });
    };
    CrawlerAgent.prototype.crawlSinglePage = function (url_1) {
        return __awaiter(this, arguments, void 0, function (url, options) {
            var startTime, title, loadTime, mainScreenshot, elements, elementScreenshots, pageData, error_7;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.page)
                            return [2 /*return*/, null];
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 9, , 10]);
                        // Navegar para a página
                        return [4 /*yield*/, this.page.goto(url, {
                                waitUntil: 'domcontentloaded',
                                timeout: 30000
                            })];
                    case 2:
                        // Navegar para a página
                        _a.sent();
                        // Aguardar estabilização
                        return [4 /*yield*/, this.page.waitForTimeout(3000)];
                    case 3:
                        // Aguardar estabilização
                        _a.sent();
                        return [4 /*yield*/, this.page.title()];
                    case 4:
                        title = _a.sent();
                        loadTime = Date.now() - startTime;
                        return [4 /*yield*/, this.captureMainPageScreenshot(url)];
                    case 5:
                        mainScreenshot = _a.sent();
                        return [4 /*yield*/, this.detectAllInteractiveElements()];
                    case 6:
                        elements = _a.sent();
                        elementScreenshots = [];
                        if (!options.captureElements) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.captureElementScreenshots(elements, url)];
                    case 7:
                        elementScreenshots = _a.sent();
                        _a.label = 8;
                    case 8:
                        pageData = {
                            url: url,
                            title: title,
                            elements: elements,
                            screenshots: __spreadArray([mainScreenshot], elementScreenshots, true).filter(Boolean),
                            metadata: {
                                timestamp: new Date(),
                                loadTime: loadTime,
                                elementCount: elements.length
                            }
                        };
                        this.log("P\u00E1gina processada: ".concat(title, " (").concat(elements.length, " elementos)"));
                        return [2 /*return*/, pageData];
                    case 9:
                        error_7 = _a.sent();
                        this.log("Erro ao processar p\u00E1gina ".concat(url, ": ").concat(error_7), 'error');
                        return [2 /*return*/, null];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    CrawlerAgent.prototype.detectAllInteractiveElements = function () {
        return __awaiter(this, void 0, void 0, function () {
            var elements, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.page)
                            return [2 /*return*/, []];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.page.evaluate(function () {
                                var results = [];
                                // Seletores organizados por importância
                                var elementSelectors = [
                                    { selector: 'input[type="text"], input[type="email"], input[type="password"]', type: 'input', importance: 5 },
                                    { selector: 'button[type="submit"], input[type="submit"]', type: 'submit_button', importance: 5 },
                                    { selector: 'button:not([type="submit"])', type: 'button', importance: 4 },
                                    { selector: 'a[href]:not([href^="javascript:"]):not([href^="mailto:"])', type: 'link', importance: 3 },
                                    { selector: 'select', type: 'select', importance: 4 },
                                    { selector: 'textarea', type: 'textarea', importance: 4 },
                                    { selector: 'input[type="checkbox"]', type: 'checkbox', importance: 2 },
                                    { selector: 'input[type="radio"]', type: 'radio', importance: 2 },
                                    { selector: '[role="button"], [onclick]', type: 'interactive', importance: 3 }
                                ];
                                elementSelectors.forEach(function (_a) {
                                    var selector = _a.selector, type = _a.type, importance = _a.importance;
                                    var elements = document.querySelectorAll(selector);
                                    elements.forEach(function (element, index) {
                                        var _a;
                                        var rect = element.getBoundingClientRect();
                                        // Verificar visibilidade
                                        if (rect.width <= 0 || rect.height <= 0)
                                            return;
                                        var computedStyle = window.getComputedStyle(element);
                                        if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden')
                                            return;
                                        if (parseFloat(computedStyle.opacity) < 0.1)
                                            return;
                                        // Extrair texto descritivo
                                        var text = ((_a = element.textContent) === null || _a === void 0 ? void 0 : _a.trim()) ||
                                            element.getAttribute('placeholder') ||
                                            element.getAttribute('aria-label') ||
                                            element.getAttribute('title') ||
                                            element.getAttribute('alt') ||
                                            element.getAttribute('name') ||
                                            type;
                                        if (!text || text.length > 200) {
                                            text = "".concat(type, "_").concat(index);
                                        }
                                        // Determinar funcionalidade
                                        var functionality = 'Elemento interativo';
                                        switch (type) {
                                            case 'input':
                                                functionality = 'Campo de entrada de dados';
                                                break;
                                            case 'submit_button':
                                                functionality = 'Botão de envio de formulário';
                                                break;
                                            case 'button':
                                                functionality = 'Botão de ação';
                                                break;
                                            case 'link':
                                                functionality = 'Link de navegação';
                                                break;
                                            case 'select':
                                                functionality = 'Lista de seleção';
                                                break;
                                            case 'textarea':
                                                functionality = 'Área de texto';
                                                break;
                                            case 'checkbox':
                                                functionality = 'Caixa de seleção';
                                                break;
                                            case 'radio':
                                                functionality = 'Botão de escolha única';
                                                break;
                                        }
                                        // Gerar seletor único
                                        var generateSelector = function (el) {
                                            if (el.id)
                                                return "#".concat(el.id);
                                            var tagName = el.tagName.toLowerCase();
                                            var parent = el.parentElement;
                                            if (parent) {
                                                var siblings = Array.from(parent.children).filter(function (child) {
                                                    return child.tagName === el.tagName;
                                                });
                                                if (siblings.length === 1) {
                                                    return tagName;
                                                }
                                                var siblingIndex = siblings.indexOf(el) + 1;
                                                return "".concat(tagName, ":nth-of-type(").concat(siblingIndex, ")");
                                            }
                                            return tagName;
                                        };
                                        results.push({
                                            id: "element_".concat(Date.now(), "_").concat(index),
                                            text: text.substring(0, 100),
                                            type: type,
                                            functionality: functionality,
                                            selector: generateSelector(element),
                                            position: {
                                                x: Math.round(rect.left + rect.width / 2),
                                                y: Math.round(rect.top + rect.height / 2)
                                            },
                                            size: {
                                                width: Math.round(rect.width),
                                                height: Math.round(rect.height)
                                            },
                                            attributes: {
                                                href: element.getAttribute('href') || '',
                                                type: element.getAttribute('type') || '',
                                                placeholder: element.getAttribute('placeholder') || '',
                                                'aria-label': element.getAttribute('aria-label') || '',
                                                title: element.getAttribute('title') || '',
                                                name: element.getAttribute('name') || '',
                                                id: element.getAttribute('id') || '',
                                                className: element.className || ''
                                            },
                                            isVisible: true,
                                            importance: importance
                                        });
                                    });
                                });
                                // Ordenar por importância e posição (top-down, left-right)
                                return results.sort(function (a, b) {
                                    if (a.importance !== b.importance)
                                        return b.importance - a.importance;
                                    if (Math.abs(a.position.y - b.position.y) > 50) {
                                        return a.position.y - b.position.y;
                                    }
                                    return a.position.x - b.position.x;
                                });
                            })];
                    case 2:
                        elements = _a.sent();
                        this.log("".concat(elements.length, " elementos interativos detectados"));
                        return [2 /*return*/, elements];
                    case 3:
                        error_8 = _a.sent();
                        this.log("Erro ao detectar elementos: ".concat(error_8), 'error');
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CrawlerAgent.prototype.captureMainPageScreenshot = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var filename, localPath, minioUrl;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.page)
                            throw new Error('Página não disponível');
                        filename = "main_".concat(this.sanitizeUrl(url), "_").concat(Date.now(), ".png");
                        localPath = "output/screenshots/".concat(filename);
                        // Garantir que o diretório existe
                        return [4 /*yield*/, this.ensureDirectoryExists('output/screenshots')];
                    case 1:
                        // Garantir que o diretório existe
                        _a.sent();
                        return [4 /*yield*/, this.page.screenshot({
                                path: localPath,
                                fullPage: true,
                                type: 'png'
                            })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.minioService.uploadScreenshot(localPath, filename)];
                    case 3:
                        minioUrl = _a.sent();
                        this.log("Screenshot principal capturado: ".concat(filename));
                        return [2 /*return*/, minioUrl || localPath];
                }
            });
        });
    };
    CrawlerAgent.prototype.captureElementScreenshots = function (elements, pageUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var screenshots, i, element, locator, scrollError_1, filename, localPath, elementHandle, box, padding, minioUrl, captureError_1, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.page)
                            return [2 /*return*/, []];
                        screenshots = [];
                        return [4 /*yield*/, this.ensureDirectoryExists('output/screenshots/elements')];
                    case 1:
                        _a.sent();
                        this.log("Capturando screenshots de ".concat(elements.length, " elementos"));
                        i = 0;
                        _a.label = 2;
                    case 2:
                        if (!(i < Math.min(elements.length, 20))) return [3 /*break*/, 26];
                        element = elements[i];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 22, , 23]);
                        locator = this.page.locator(element.selector).first();
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 7, , 8]);
                        return [4 /*yield*/, locator.scrollIntoViewIfNeeded({ timeout: 3000 })];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, this.page.waitForTimeout(500)];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        scrollError_1 = _a.sent();
                        this.log("Erro no scroll para elemento ".concat(i, ": ").concat(scrollError_1), 'warn');
                        return [3 /*break*/, 8];
                    case 8: 
                    // Destacar elemento temporariamente para melhor visibilidade
                    return [4 /*yield*/, this.page.evaluate(function (selector) {
                            var el = document.querySelector(selector);
                            if (el) {
                                el.style.outline = '3px solid #ff4444';
                                el.style.outlineOffset = '2px';
                            }
                        }, element.selector)];
                    case 9:
                        // Destacar elemento temporariamente para melhor visibilidade
                        _a.sent();
                        filename = "element_".concat(i.toString().padStart(2, '0'), "_").concat(element.type, "_").concat(this.sanitizeText(element.text), ".png");
                        localPath = "output/screenshots/elements/".concat(filename);
                        _a.label = 10;
                    case 10:
                        _a.trys.push([10, 19, , 20]);
                        return [4 /*yield*/, locator.elementHandle({ timeout: 2000 })];
                    case 11:
                        elementHandle = _a.sent();
                        if (!elementHandle) return [3 /*break*/, 15];
                        return [4 /*yield*/, elementHandle.boundingBox()];
                    case 12:
                        box = _a.sent();
                        if (!box) return [3 /*break*/, 14];
                        padding = 30;
                        return [4 /*yield*/, this.page.screenshot({
                                path: localPath,
                                clip: {
                                    x: Math.max(0, box.x - padding),
                                    y: Math.max(0, box.y - padding),
                                    width: Math.min(1920, box.width + (padding * 2)),
                                    height: Math.min(1080, box.height + (padding * 2))
                                },
                                type: 'png'
                            })];
                    case 13:
                        _a.sent();
                        _a.label = 14;
                    case 14: return [3 /*break*/, 17];
                    case 15: 
                    // Fallback: screenshot por coordenadas
                    return [4 /*yield*/, this.page.screenshot({
                            path: localPath,
                            clip: {
                                x: Math.max(0, element.position.x - element.size.width / 2),
                                y: Math.max(0, element.position.y - element.size.height / 2),
                                width: element.size.width + 20,
                                height: element.size.height + 20
                            },
                            type: 'png'
                        })];
                    case 16:
                        // Fallback: screenshot por coordenadas
                        _a.sent();
                        _a.label = 17;
                    case 17: return [4 /*yield*/, this.minioService.uploadScreenshot(localPath, "elements/".concat(filename))];
                    case 18:
                        minioUrl = _a.sent();
                        screenshots.push(minioUrl || localPath);
                        return [3 /*break*/, 20];
                    case 19:
                        captureError_1 = _a.sent();
                        this.log("Erro ao capturar elemento ".concat(i, ": ").concat(captureError_1), 'warn');
                        return [3 /*break*/, 20];
                    case 20: 
                    // Remover destaque
                    return [4 /*yield*/, this.page.evaluate(function (selector) {
                            var el = document.querySelector(selector);
                            if (el) {
                                el.style.outline = '';
                                el.style.outlineOffset = '';
                            }
                        }, element.selector)];
                    case 21:
                        // Remover destaque
                        _a.sent();
                        return [3 /*break*/, 23];
                    case 22:
                        error_9 = _a.sent();
                        this.log("Erro geral no elemento ".concat(i, ": ").concat(error_9), 'warn');
                        return [3 /*break*/, 23];
                    case 23: 
                    // Pequena pausa entre capturas
                    return [4 /*yield*/, this.page.waitForTimeout(300)];
                    case 24:
                        // Pequena pausa entre capturas
                        _a.sent();
                        _a.label = 25;
                    case 25:
                        i++;
                        return [3 /*break*/, 2];
                    case 26:
                        this.log("".concat(screenshots.length, " screenshots de elementos capturados"));
                        return [2 /*return*/, screenshots];
                }
            });
        });
    };
    CrawlerAgent.prototype.restoreSession = function (sessionData) {
        return __awaiter(this, void 0, void 0, function () {
            var localStorageData, sessionStorageData, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.page || !sessionData)
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        if (!sessionData.localStorage) return [3 /*break*/, 3];
                        localStorageData = JSON.parse(sessionData.localStorage);
                        return [4 /*yield*/, this.page.evaluate(function (data) {
                                for (var _i = 0, _a = Object.entries(data); _i < _a.length; _i++) {
                                    var _b = _a[_i], key = _b[0], value = _b[1];
                                    localStorage.setItem(key, value);
                                }
                            }, localStorageData)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        if (!sessionData.sessionStorage) return [3 /*break*/, 5];
                        sessionStorageData = JSON.parse(sessionData.sessionStorage);
                        return [4 /*yield*/, this.page.evaluate(function (data) {
                                for (var _i = 0, _a = Object.entries(data); _i < _a.length; _i++) {
                                    var _b = _a[_i], key = _b[0], value = _b[1];
                                    sessionStorage.setItem(key, value);
                                }
                            }, sessionStorageData)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        this.log('Sessão restaurada com sucesso');
                        return [3 /*break*/, 7];
                    case 6:
                        error_10 = _a.sent();
                        this.log("Erro ao restaurar sess\u00E3o: ".concat(error_10), 'warn');
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    CrawlerAgent.prototype.discoverPageLinks = function (baseUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var links, baseHost_1, filteredLinks, uniqueLinks, error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.page)
                            return [2 /*return*/, []];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.page.evaluate(function () {
                                var anchors = Array.from(document.querySelectorAll('a[href]'));
                                return anchors
                                    .map(function (a) { return a.href; })
                                    .filter(function (href) {
                                    return href &&
                                        !href.startsWith('javascript:') &&
                                        !href.startsWith('mailto:') &&
                                        !href.startsWith('tel:') &&
                                        !href.includes('#') &&
                                        href.length < 200;
                                });
                            })];
                    case 2:
                        links = _a.sent();
                        baseHost_1 = new URL(baseUrl).hostname;
                        filteredLinks = links.filter(function (link) {
                            try {
                                var linkHost = new URL(link).hostname;
                                return linkHost === baseHost_1;
                            }
                            catch (_a) {
                                return false;
                            }
                        });
                        uniqueLinks = Array.from(new Set(filteredLinks));
                        this.log("".concat(uniqueLinks.length, " links \u00FAnicos descobertos em ").concat(baseUrl));
                        return [2 /*return*/, uniqueLinks];
                    case 3:
                        error_11 = _a.sent();
                        this.log("Erro ao descobrir links: ".concat(error_11), 'error');
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CrawlerAgent.prototype.sanitizeUrl = function (url) {
        return url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    };
    CrawlerAgent.prototype.sanitizeText = function (text) {
        return text
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 30);
    };
    CrawlerAgent.prototype.ensureDirectoryExists = function (dirPath) {
        return __awaiter(this, void 0, void 0, function () {
            var error_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fs.mkdir(dirPath, { recursive: true })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_12 = _a.sent();
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    CrawlerAgent.prototype.generateMarkdownReport = function (taskResult) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, report, data;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        timestamp = new Date().toISOString();
                        report = "# Relat\u00F3rio do CrawlerAgent\n\n**Task ID:** ".concat(taskResult.taskId, "\n**Timestamp:** ").concat(timestamp, "\n**Status:** ").concat(taskResult.success ? '✅ Sucesso' : '❌ Falha', "\n**Tempo de Processamento:** ").concat(taskResult.processingTime, "ms\n\n");
                        if (taskResult.success && taskResult.data) {
                            data = taskResult.data;
                            report += "## Resultado do Crawling\n\n- **P\u00E1ginas Processadas:** ".concat(data.pagesProcessed, "\n- **Total de Elementos:** ").concat(data.totalElements, "\n- **Screenshots Capturados:** ").concat(((_a = data.screenshots) === null || _a === void 0 ? void 0 : _a.length) || 0, "\n- **URL Inicial:** ").concat(data.startUrl, "\n\n## P\u00E1ginas Descobertas\n\n");
                            this.allPageData.forEach(function (page, index) {
                                report += "### ".concat(index + 1, ". ").concat(page.title, "\n\n- **URL:** ").concat(page.url, "\n- **Elementos:** ").concat(page.elements.length, "\n- **Screenshots:** ").concat(page.screenshots.length, "\n- **Tempo de Carregamento:** ").concat(page.metadata.loadTime, "ms\n\n");
                            });
                            report += "\n## Screenshots Principais\n\n";
                            if (data.screenshots) {
                                data.screenshots.slice(0, 10).forEach(function (screenshot, index) {
                                    report += "".concat(index + 1, ". ![Screenshot ").concat(index + 1, "](").concat(screenshot, ")\n");
                                });
                            }
                            report += "\n## Pr\u00F3ximas Etapas\n\n\u2705 Dados de crawling coletados com sucesso\n\uD83D\uDD04 Dados encaminhados para AnalysisAgent\n\uD83D\uDCCA Aguardando an\u00E1lise com IA dos elementos capturados\n\n";
                        }
                        else {
                            report += "## Erro no Crawling\n\n**Erro:** ".concat(taskResult.error, "\n\n## A\u00E7\u00F5es Recomendadas\n\n- Verificar conectividade de rede\n- Verificar se as p\u00E1ginas est\u00E3o acess\u00EDveis\n- Verificar se a sess\u00E3o ainda est\u00E1 v\u00E1lida\n- Tentar novamente\n\n");
                        }
                        // Salvar relatório no MinIO
                        return [4 /*yield*/, this.minioService.uploadReportMarkdown(report, this.config.name, taskResult.taskId)];
                    case 1:
                        // Salvar relatório no MinIO
                        _b.sent();
                        return [2 /*return*/, report];
                }
            });
        });
    };
    CrawlerAgent.prototype.setPage = function (page) {
        this.page = page;
    };
    CrawlerAgent.prototype.setBrowser = function (browser) {
        this.browser = browser;
    };
    // 📄 MÉTODOS DE PERSISTÊNCIA DE DADOS
    CrawlerAgent.prototype.saveCrawlerDataMarkdown = function (crawlResults) {
        return __awaiter(this, void 0, void 0, function () {
            var outputDir, timestamp, crawlerFile, filePath, markdownContent;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        outputDir = path.join(process.cwd(), 'output', 'final_documents');
                        return [4 /*yield*/, fs.mkdir(outputDir, { recursive: true })];
                    case 1:
                        _a.sent();
                        timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                        crawlerFile = "crawler-data-".concat(timestamp, ".md");
                        filePath = path.join(outputDir, crawlerFile);
                        markdownContent = this.generateCrawlerMarkdown(crawlResults);
                        return [4 /*yield*/, fs.writeFile(filePath, markdownContent, 'utf-8')];
                    case 2:
                        _a.sent();
                        this.log("\uD83D\uDCC4 Dados do crawler salvos em: ".concat(crawlerFile));
                        return [2 /*return*/, filePath];
                }
            });
        });
    };
    CrawlerAgent.prototype.generateCrawlerMarkdown = function (crawlResults) {
        var totalElements = crawlResults.reduce(function (sum, page) { var _a; return sum + (((_a = page.elements) === null || _a === void 0 ? void 0 : _a.length) || 0); }, 0);
        var totalScreenshots = crawlResults.reduce(function (sum, page) { var _a; return sum + (((_a = page.screenshots) === null || _a === void 0 ? void 0 : _a.length) || 0); }, 0);
        var pagesContent = crawlResults.map(function (page, idx) {
            var _a, _b, _c, _d, _e;
            var elementsContent = ((_a = page.elements) === null || _a === void 0 ? void 0 : _a.map(function (element, elemIdx) { return "\n".concat(elemIdx + 1, ". **").concat(element.type, "** - \"").concat(element.text, "\"\n   - Seletor: `").concat(element.selector, "`\n   - Funcionalidade: ").concat(element.functionality, "\n   - Import\u00E2ncia: ").concat(element.importance, "/10\n   ").concat(element.screenshot ? "- Screenshot: ".concat(element.screenshot) : '', "\n"); }).join('\n')) || 'Nenhum elemento interativo encontrado';
            var screenshotsContent = ((_b = page.screenshots) === null || _b === void 0 ? void 0 : _b.map(function (screenshot, scrIdx) {
                return "".concat(scrIdx + 1, ". ").concat(screenshot.split('/').pop());
            }).join('\n')) || 'Nenhum screenshot capturado';
            return "\n## ".concat(idx + 1, ". ").concat(page.title, "\n\n- **URL**: ").concat(page.url, "\n- **Elementos Encontrados**: ").concat(((_c = page.elements) === null || _c === void 0 ? void 0 : _c.length) || 0, "\n- **Screenshots**: ").concat(((_d = page.screenshots) === null || _d === void 0 ? void 0 : _d.length) || 0, "\n- **Tempo de Processamento**: ").concat(page.processingTime || 'N/A', "ms\n\n### Elementos Interativos\n").concat(elementsContent, "\n\n### Screenshots Capturados\n").concat(screenshotsContent, "\n\n### Links Descobertos\n").concat(((_e = page.links) === null || _e === void 0 ? void 0 : _e.map(function (link, linkIdx) { return "".concat(linkIdx + 1, ". ").concat(link); }).join('\n')) || 'Nenhum link encontrado', "\n");
        }).join('\n');
        return "# Relat\u00F3rio de Crawling - ".concat(new Date().toLocaleString(), "\n\n## \uD83D\uDCCA Estat\u00EDsticas Gerais\n\n- **Total de P\u00E1ginas Processadas**: ").concat(crawlResults.length, "\n- **Total de Elementos Interativos**: ").concat(totalElements, "\n- **Total de Screenshots**: ").concat(totalScreenshots, "\n- **Tempo de Execu\u00E7\u00E3o**: ").concat(Date.now(), "ms\n\n## \uD83C\uDF10 P\u00E1ginas Analisadas\n").concat(pagesContent, "\n\n---\n*Relat\u00F3rio gerado automaticamente pelo CrawlerAgent v").concat(this.config.version, "*\n");
    };
    CrawlerAgent.prototype.cleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.visitedPages.clear();
                this.allPageData = [];
                this.page = null;
                this.browser = null;
                this.log('CrawlerAgent finalizado e recursos liberados');
                return [2 /*return*/];
            });
        });
    };
    return CrawlerAgent;
}(AgnoSCore_js_1.BaseAgent));
exports.CrawlerAgent = CrawlerAgent;
