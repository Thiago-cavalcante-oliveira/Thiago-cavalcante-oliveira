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
exports.AnalysisAgent = void 0;
var AgnoSCore_js_1 = require("../core/AgnoSCore.js");
var MinIOService_js_1 = require("../services/MinIOService.js");
var GeminiKeyManager_js_1 = require("../services/GeminiKeyManager.js");
var fs = require("fs/promises");
var path = require("path");
var AnalysisAgent = /** @class */ (function (_super) {
    __extends(AnalysisAgent, _super);
    function AnalysisAgent() {
        var _this = this;
        var config = {
            name: 'AnalysisAgent',
            version: '1.0.0',
            description: 'Agente especializado em análise inteligente de dados de crawling usando IA',
            capabilities: [
                { name: 'ai_analysis', description: 'Análise com IA de elementos e páginas web', version: '1.0.0' },
                { name: 'element_description', description: 'Descrição detalhada de elementos interativos', version: '1.0.0' },
                { name: 'user_journey_mapping', description: 'Mapeamento de jornadas do usuário', version: '1.0.0' },
                { name: 'accessibility_analysis', description: 'Análise de acessibilidade', version: '1.0.0' },
                { name: 'functionality_classification', description: 'Classificação de funcionalidades', version: '1.0.0' }
            ]
        };
        _this = _super.call(this, config) || this;
        _this.currentAnalysis = null;
        _this.componentCache = new Map();
        _this.keyManager = new GeminiKeyManager_js_1.GeminiKeyManager();
        _this.minioService = new MinIOService_js_1.MinIOService();
        _this.cacheFile = path.join(process.cwd(), 'output', 'component-analysis-cache.json');
        return _this;
    }
    AnalysisAgent.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.minioService.initialize()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.keyManager.loadStatus()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.loadComponentCache()];
                    case 3:
                        _a.sent();
                        this.log('AnalysisAgent inicializado com IA Gemini');
                        return [2 /*return*/];
                }
            });
        });
    };
    AnalysisAgent.prototype.processTask = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, _a, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        startTime = Date.now();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 10, , 11]);
                        _a = task.type;
                        switch (_a) {
                            case 'analyze_crawl_data': return [3 /*break*/, 2];
                            case 'analyze_page': return [3 /*break*/, 4];
                            case 'analyze_elements': return [3 /*break*/, 6];
                        }
                        return [3 /*break*/, 8];
                    case 2: return [4 /*yield*/, this.handleCrawlAnalysis(task)];
                    case 3: return [2 /*return*/, _b.sent()];
                    case 4: return [4 /*yield*/, this.handlePageAnalysis(task)];
                    case 5: return [2 /*return*/, _b.sent()];
                    case 6: return [4 /*yield*/, this.handleElementAnalysis(task)];
                    case 7: return [2 /*return*/, _b.sent()];
                    case 8: throw new Error("Tipo de tarefa n\u00E3o suportada: ".concat(task.type));
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        error_1 = _b.sent();
                        return [2 /*return*/, {
                                id: task.id,
                                taskId: task.id,
                                success: false,
                                error: error_1 instanceof Error ? error_1.message : String(error_1),
                                timestamp: new Date(),
                                processingTime: Date.now() - startTime
                            }];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    AnalysisAgent.prototype.handleCrawlAnalysis = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, _a, crawlResults, sessionData, authContext, pageAnalyses, _i, crawlResults_1, pageData, pageAnalysis, crawlAnalysis, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        startTime = Date.now();
                        _a = task.data, crawlResults = _a.crawlResults, sessionData = _a.sessionData, authContext = _a.authContext;
                        this.log('Iniciando análise completa dos dados de crawling');
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, , 8]);
                        pageAnalyses = [];
                        _i = 0, crawlResults_1 = crawlResults;
                        _b.label = 2;
                    case 2:
                        if (!(_i < crawlResults_1.length)) return [3 /*break*/, 5];
                        pageData = crawlResults_1[_i];
                        this.log("Analisando p\u00E1gina: ".concat(pageData.title));
                        return [4 /*yield*/, this.analyzePageData(pageData)];
                    case 3:
                        pageAnalysis = _b.sent();
                        pageAnalyses.push(pageAnalysis);
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [4 /*yield*/, this.generateCrawlAnalysis(crawlResults, pageAnalyses, authContext)];
                    case 6:
                        crawlAnalysis = _b.sent();
                        this.currentAnalysis = crawlAnalysis;
                        // Enviar para o próximo agente
                        this.sendTask('ContentAgent', 'generate_user_friendly_content', {
                            crawlAnalysis: crawlAnalysis,
                            sessionData: sessionData,
                            authContext: authContext,
                            rawData: crawlResults
                        }, 'high');
                        return [2 /*return*/, {
                                id: task.id,
                                taskId: task.id,
                                success: true,
                                data: crawlAnalysis,
                                timestamp: new Date(),
                                processingTime: Date.now() - startTime
                            }];
                    case 7:
                        error_2 = _b.sent();
                        this.log("Erro na an\u00E1lise do crawling: ".concat(error_2), 'error');
                        throw error_2;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    AnalysisAgent.prototype.handlePageAnalysis = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var pageData, startTime, analysis, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pageData = task.data.pageData;
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.analyzePageData(pageData)];
                    case 2:
                        analysis = _a.sent();
                        return [2 /*return*/, {
                                id: task.id,
                                taskId: task.id,
                                success: true,
                                data: analysis,
                                timestamp: new Date(),
                                processingTime: Date.now() - startTime
                            }];
                    case 3:
                        error_3 = _a.sent();
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AnalysisAgent.prototype.handleElementAnalysis = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, elements, context, startTime, analyses, error_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = task.data, elements = _a.elements, context = _a.context;
                        startTime = Date.now();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.analyzeElements(elements, context)];
                    case 2:
                        analyses = _b.sent();
                        return [2 /*return*/, {
                                id: task.id,
                                taskId: task.id,
                                success: true,
                                data: analyses,
                                timestamp: new Date(),
                                processingTime: Date.now() - startTime
                            }];
                    case 3:
                        error_4 = _b.sent();
                        throw error_4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AnalysisAgent.prototype.analyzePageData = function (pageData) {
        return __awaiter(this, void 0, void 0, function () {
            var elements, pagePrompt, response, aiAnalysis, elementAnalyses, accessibility, pageAnalysis, error_5;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        elements = pageData.elements || [];
                        pagePrompt = "\nAnalise esta p\u00E1gina web e forne\u00E7a insights detalhados:\n\nP\u00C1GINA:\n- URL: ".concat(pageData.url, "\n- T\u00EDtulo: ").concat(pageData.title, "\n- Total de Elementos: ").concat(elements.length, "\n\nELEMENTOS DETECTADOS:\n").concat(elements.map(function (el, i) { return "\n".concat(i + 1, ". ").concat(el.type, " - \"").concat(el.text, "\"\n   Funcionalidade: ").concat(el.functionality, "\n   Posi\u00E7\u00E3o: x:").concat(el.position.x, ", y:").concat(el.position.y, "\n   Import\u00E2ncia: ").concat(el.importance, "\n"); }).join(''), "\n\nPor favor, forne\u00E7a:\n\n1. PROP\u00D3SITO DA P\u00C1GINA: Qual \u00E9 o objetivo principal desta p\u00E1gina?\n\n2. JORNADA DO USU\u00C1RIO: Quais s\u00E3o os passos t\u00EDpicos que um usu\u00E1rio seguiria nesta p\u00E1gina?\n\n3. RECURSOS PRINCIPAIS: Quais s\u00E3o as funcionalidades mais importantes?\n\n4. FLUXO DE NAVEGA\u00C7\u00C3O: Como os elementos se conectam para formar um fluxo l\u00F3gico?\n\n5. ACESSIBILIDADE: Que problemas de acessibilidade voc\u00EA identifica?\n\nResponda em formato JSON estruturado.\n");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, this.keyManager.handleApiCall(function (model) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, model.generateContent(pagePrompt)];
                                        case 1: return [2 /*return*/, _a.sent()];
                                    }
                                });
                            }); })];
                    case 2:
                        response = _a.sent();
                        aiAnalysis = this.parseAIResponse(response.response.text());
                        return [4 /*yield*/, this.analyzeElements(elements, {
                                pageUrl: pageData.url,
                                pageTitle: pageData.title,
                                pagePurpose: aiAnalysis.purpose || 'Página web'
                            })];
                    case 3:
                        elementAnalyses = _a.sent();
                        return [4 /*yield*/, this.analyzeAccessibility(elements)];
                    case 4:
                        accessibility = _a.sent();
                        pageAnalysis = {
                            url: pageData.url,
                            title: pageData.title,
                            purpose: aiAnalysis.purpose || 'Propósito não identificado',
                            userJourney: aiAnalysis.userJourney || ['Acessar página', 'Interagir com elementos'],
                            keyFeatures: aiAnalysis.keyFeatures || elements.slice(0, 5).map(function (el) { return el.text; }),
                            elementAnalyses: elementAnalyses,
                            navigationFlow: aiAnalysis.navigationFlow || ['Navegação sequencial'],
                            accessibility: accessibility
                        };
                        this.log("P\u00E1gina analisada: ".concat(pageData.title, " (").concat(elementAnalyses.length, " elementos)"));
                        return [2 /*return*/, pageAnalysis];
                    case 5:
                        error_5 = _a.sent();
                        this.log("Erro na an\u00E1lise com IA da p\u00E1gina: ".concat(error_5), 'warn');
                        // Fallback sem IA
                        return [2 /*return*/, this.createFallbackPageAnalysis(pageData, elements)];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    AnalysisAgent.prototype.analyzeElements = function (elements, context) {
        return __awaiter(this, void 0, void 0, function () {
            var analyses, batchSize, _loop_1, this_1, i;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        analyses = [];
                        batchSize = 5;
                        _loop_1 = function (i) {
                            var batch, batchPrompt, response, aiAnalyses_1, error_6;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        batch = elements.slice(i, i + batchSize);
                                        batchPrompt = "\nAnalise estes elementos web e forne\u00E7a descri\u00E7\u00F5es detalhadas para um manual do usu\u00E1rio:\n\nCONTEXTO:\n- P\u00E1gina: ".concat(context.pageTitle, "\n- URL: ").concat(context.pageUrl, "\n- Prop\u00F3sito: ").concat(context.pagePurpose, "\n\nELEMENTOS:\n").concat(batch.map(function (el, idx) { return "\nELEMENTO ".concat(i + idx + 1, ":\n- Tipo: ").concat(el.type, "\n- Texto: \"").concat(el.text, "\"\n- Funcionalidade: ").concat(el.functionality, "\n- Atributos: ").concat(JSON.stringify(el.attributes), "\n- Import\u00E2ncia: ").concat(el.importance, "\n- Vis\u00EDvel: ").concat(el.isVisible, "\n"); }).join(''), "\n\nPara cada elemento, forne\u00E7a:\n1. DESCRI\u00C7\u00C3O: Descri\u00E7\u00E3o clara e amig\u00E1vel para usu\u00E1rios leigos\n2. BENEF\u00CDCIO: Como este elemento beneficia o usu\u00E1rio\n3. INSTRU\u00C7\u00D5ES: Como usar este elemento passo a passo\n4. CATEGORIA: Categorize (navega\u00E7\u00E3o, entrada, a\u00E7\u00E3o, informa\u00E7\u00E3o, etc.)\n5. INTERA\u00C7\u00D5ES: Que outras intera\u00E7\u00F5es s\u00E3o poss\u00EDveis\n\nResponda em formato JSON com array de objetos.\n");
                                        _b.label = 1;
                                    case 1:
                                        _b.trys.push([1, 3, , 4]);
                                        return [4 /*yield*/, this_1.keyManager.handleApiCall(function (model) { return __awaiter(_this, void 0, void 0, function () {
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0: return [4 /*yield*/, model.generateContent(batchPrompt)];
                                                        case 1: return [2 /*return*/, _a.sent()];
                                                    }
                                                });
                                            }); })];
                                    case 2:
                                        response = _b.sent();
                                        aiAnalyses_1 = this_1.parseAIResponse(response.response.text());
                                        if (Array.isArray(aiAnalyses_1)) {
                                            batch.forEach(function (element, idx) {
                                                var analysis = aiAnalyses_1[idx] || {};
                                                analyses.push({
                                                    id: element.id,
                                                    description: analysis.description || "".concat(element.type, " com texto \"").concat(element.text, "\""),
                                                    functionality: analysis.functionality || element.functionality,
                                                    userBenefit: analysis.userBenefit || 'Permite interação com a página',
                                                    importance: element.importance,
                                                    usageInstructions: analysis.usageInstructions || 'Clique para interagir',
                                                    category: analysis.category || _this.categorizeElement(element.type),
                                                    interactions: analysis.interactions || ['click']
                                                });
                                            });
                                        }
                                        return [3 /*break*/, 4];
                                    case 3:
                                        error_6 = _b.sent();
                                        this_1.log("Erro na an\u00E1lise de elementos com IA: ".concat(error_6), 'warn');
                                        // Fallback sem IA
                                        batch.forEach(function (element) {
                                            analyses.push(_this.createFallbackElementAnalysis(element));
                                        });
                                        return [3 /*break*/, 4];
                                    case 4:
                                        if (!(i + batchSize < elements.length)) return [3 /*break*/, 6];
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                                    case 5:
                                        _b.sent();
                                        _b.label = 6;
                                    case 6: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < elements.length)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_1(i)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        i += batchSize;
                        return [3 /*break*/, 1];
                    case 4:
                        this.log("".concat(analyses.length, " elementos analisados"));
                        return [2 /*return*/, analyses];
                }
            });
        });
    };
    AnalysisAgent.prototype.generateCrawlAnalysis = function (crawlResults, pageAnalyses, authContext) {
        return __awaiter(this, void 0, void 0, function () {
            var totalElements, authType, analysisPrompt, response, aiAnalysis, crawlAnalysis, error_7;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        totalElements = crawlResults.reduce(function (sum, page) { var _a; return sum + (((_a = page.elements) === null || _a === void 0 ? void 0 : _a.length) || 0); }, 0);
                        authType = authContext && authContext.authType ? authContext.authType : 'public';
                        analysisPrompt = "\nAnalise este crawling completo de aplica\u00E7\u00E3o web e gere insights abrangentes:\n\nDADOS GERAIS:\n- Total de P\u00E1ginas: ".concat(crawlResults.length, "\n- Total de Elementos: ").concat(totalElements, "\n- Contexto de Autentica\u00E7\u00E3o: ").concat(authType, "\n\nP\u00C1GINAS ANALISADAS:\n").concat(pageAnalyses.map(function (page, i) { return "\nP\u00C1GINA ".concat(i + 1, ": ").concat(page.title, "\n- URL: ").concat(page.url, "\n- Prop\u00F3sito: ").concat(page.purpose, "\n- Elementos: ").concat(page.elementAnalyses.length, "\n- Recursos Principais: ").concat(page.keyFeatures.join(', '), "\n- Jornada do Usu\u00E1rio: ").concat(page.userJourney.join(' → '), "\n"); }).join(''), "\n\nPor favor, forne\u00E7a uma an\u00E1lise completa:\n\n1. RESUMO EXECUTIVO: Resumo geral da aplica\u00E7\u00E3o\n2. FUNCIONALIDADES PRINCIPAIS: Liste as funcionalidades mais importantes\n3. FLUXOS DE TRABALHO: Identifique os principais fluxos de trabalho do usu\u00E1rio\n4. RECOMENDA\u00C7\u00D5ES: Sugest\u00F5es de melhoria\n5. INSIGHTS T\u00C9CNICOS: Tecnologias e padr\u00F5es identificados\n6. COMPLEXIDADE: Avalie a complexidade geral (low/medium/high)\n\nResponda em formato JSON estruturado.\n");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.keyManager.handleApiCall(function (model) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, model.generateContent(analysisPrompt)];
                                        case 1: return [2 /*return*/, _a.sent()];
                                    }
                                });
                            }); })];
                    case 2:
                        response = _a.sent();
                        aiAnalysis = this.parseAIResponse(response.response.text());
                        crawlAnalysis = {
                            summary: aiAnalysis.summary || 'Aplicação web com múltiplas funcionalidades',
                            totalPages: crawlResults.length,
                            totalElements: totalElements,
                            keyFunctionalities: aiAnalysis.keyFunctionalities || ['Navegação', 'Interação'],
                            userWorkflows: aiAnalysis.userWorkflows || ['Acesso → Navegação → Interação'],
                            recommendations: aiAnalysis.recommendations || ['Melhorar acessibilidade'],
                            pageAnalyses: pageAnalyses,
                            technicalInsights: {
                                technologies: aiAnalysis.technologies || ['HTML', 'JavaScript'],
                                patterns: aiAnalysis.patterns || ['SPA'],
                                complexity: aiAnalysis.complexity || 'medium'
                            }
                        };
                        this.log('Análise completa do crawling gerada');
                        return [2 /*return*/, crawlAnalysis];
                    case 3:
                        error_7 = _a.sent();
                        this.log("Erro na an\u00E1lise geral: ".concat(error_7), 'warn');
                        return [2 /*return*/, this.createFallbackCrawlAnalysis(crawlResults, pageAnalyses)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AnalysisAgent.prototype.analyzeAccessibility = function (elements) {
        return __awaiter(this, void 0, void 0, function () {
            var score, issues, recommendations;
            return __generator(this, function (_a) {
                score = 100;
                issues = [];
                recommendations = [];
                elements.forEach(function (element) {
                    // Verificar labels
                    if (['input', 'select', 'textarea'].includes(element.type)) {
                        if (!element.attributes['aria-label'] && !element.attributes.placeholder) {
                            issues.push("Campo ".concat(element.text, " sem label acess\u00EDvel"));
                            recommendations.push('Adicionar aria-label ou placeholder');
                            score -= 5;
                        }
                    }
                    // Verificar contraste (simulado)
                    if (element.importance > 3 && !element.text) {
                        issues.push("Elemento importante sem texto descritivo");
                        recommendations.push('Adicionar texto descritivo ou aria-label');
                        score -= 3;
                    }
                });
                return [2 /*return*/, {
                        score: Math.max(0, score),
                        issues: issues,
                        recommendations: recommendations
                    }];
            });
        });
    };
    AnalysisAgent.prototype.parseAIResponse = function (text) {
        try {
            // Tentar extrair JSON da resposta
            var jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            // Se não houver JSON válido, tentar parse direto
            return JSON.parse(text);
        }
        catch (error) {
            this.log("Erro ao parsear resposta da IA: ".concat(error), 'warn');
            return {};
        }
    };
    AnalysisAgent.prototype.categorizeElement = function (type) {
        var categoryMap = {
            'input': 'entrada',
            'button': 'ação',
            'submit_button': 'ação',
            'link': 'navegação',
            'select': 'entrada',
            'textarea': 'entrada',
            'checkbox': 'seleção',
            'radio': 'seleção',
            'interactive': 'interação'
        };
        return categoryMap[type] || 'geral';
    };
    AnalysisAgent.prototype.createFallbackElementAnalysis = function (element) {
        return {
            id: element.id,
            description: "".concat(element.functionality, " com o texto \"").concat(element.text, "\""),
            functionality: element.functionality,
            userBenefit: 'Permite interação com a aplicação',
            importance: element.importance,
            usageInstructions: element.type.includes('button') ? 'Clique para executar a ação' : 'Interaja conforme necessário',
            category: this.categorizeElement(element.type),
            interactions: ['click', 'focus']
        };
    };
    AnalysisAgent.prototype.createFallbackPageAnalysis = function (pageData, elements) {
        var _this = this;
        return {
            url: pageData.url,
            title: pageData.title,
            purpose: 'Página da aplicação web',
            userJourney: ['Acessar página', 'Visualizar conteúdo', 'Interagir com elementos'],
            keyFeatures: elements.slice(0, 5).map(function (el) { return el.text || el.type; }),
            elementAnalyses: elements.map(function (el) { return _this.createFallbackElementAnalysis(el); }),
            navigationFlow: ['Entrada na página', 'Navegação entre elementos', 'Execução de ações'],
            accessibility: {
                score: 75,
                issues: ['Análise detalhada não disponível'],
                recommendations: ['Verificar acessibilidade manualmente']
            }
        };
    };
    AnalysisAgent.prototype.createFallbackCrawlAnalysis = function (crawlResults, pageAnalyses) {
        var totalElements = crawlResults.reduce(function (sum, page) { var _a; return sum + (((_a = page.elements) === null || _a === void 0 ? void 0 : _a.length) || 0); }, 0);
        return {
            summary: 'Aplicação web com múltiplas páginas e funcionalidades interativas',
            totalPages: crawlResults.length,
            totalElements: totalElements,
            keyFunctionalities: ['Navegação web', 'Interação com formulários', 'Acesso a informações'],
            userWorkflows: ['Login → Navegação → Interação', 'Busca → Resultados → Seleção'],
            recommendations: ['Melhorar acessibilidade', 'Otimizar navegação', 'Adicionar mais feedback visual'],
            pageAnalyses: pageAnalyses,
            technicalInsights: {
                technologies: ['HTML', 'CSS', 'JavaScript'],
                patterns: ['Single Page Application', 'Responsive Design'],
                complexity: 'medium'
            }
        };
    };
    AnalysisAgent.prototype.generateMarkdownReport = function (taskResult) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, report, analysis;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        timestamp = new Date().toISOString();
                        report = "# Relat\u00F3rio do AnalysisAgent\n\n**Task ID:** ".concat(taskResult.taskId, "\n**Timestamp:** ").concat(timestamp, "\n**Status:** ").concat(taskResult.success ? '✅ Sucesso' : '❌ Falha', "\n**Tempo de Processamento:** ").concat(taskResult.processingTime, "ms\n\n");
                        if (taskResult.success && taskResult.data) {
                            analysis = taskResult.data;
                            report += "## \uD83D\uDCCA Resumo da An\u00E1lise\n\n".concat(analysis.summary, "\n\n### Estat\u00EDsticas Gerais\n\n- **P\u00E1ginas Analisadas:** ").concat(analysis.totalPages, "\n- **Total de Elementos:** ").concat(analysis.totalElements, "\n- **Complexidade:** ").concat(analysis.technicalInsights.complexity, "\n\n## \uD83C\uDFAF Funcionalidades Principais\n\n");
                            analysis.keyFunctionalities.forEach(function (func, index) {
                                report += "".concat(index + 1, ". ").concat(func, "\n");
                            });
                            report += "\n## \uD83D\uDD04 Fluxos de Trabalho do Usu\u00E1rio\n\n";
                            analysis.userWorkflows.forEach(function (workflow, index) {
                                report += "".concat(index + 1, ". ").concat(workflow, "\n");
                            });
                            report += "\n## \uD83D\uDCF1 An\u00E1lise por P\u00E1gina\n\n";
                            analysis.pageAnalyses.forEach(function (page, index) {
                                report += "### ".concat(index + 1, ". ").concat(page.title, "\n\n- **URL:** ").concat(page.url, "\n- **Prop\u00F3sito:** ").concat(page.purpose, "\n- **Elementos Analisados:** ").concat(page.elementAnalyses.length, "\n- **Score de Acessibilidade:** ").concat(page.accessibility.score, "/100\n\n**Recursos Principais:**\n");
                                page.keyFeatures.forEach(function (feature) {
                                    report += "- ".concat(feature, "\n");
                                });
                                report += "\n**Jornada do Usu\u00E1rio:**\n".concat(page.userJourney.join(' → '), "\n\n");
                            });
                            report += "\n## \uD83D\uDCA1 Recomenda\u00E7\u00F5es\n\n";
                            analysis.recommendations.forEach(function (rec, index) {
                                report += "".concat(index + 1, ". ").concat(rec, "\n");
                            });
                            report += "\n## \uD83D\uDD27 Insights T\u00E9cnicos\n\n**Tecnologias Identificadas:**\n".concat(analysis.technicalInsights.technologies.join(', '), "\n\n**Padr\u00F5es Arquiteturais:**\n").concat(analysis.technicalInsights.patterns.join(', '), "\n\n## Pr\u00F3ximas Etapas\n\n\u2705 An\u00E1lise com IA conclu\u00EDda\n\uD83D\uDD04 Dados encaminhados para ContentAgent\n\uD83D\uDCDD Aguardando gera\u00E7\u00E3o de conte\u00FAdo user-friendly\n\n");
                        }
                        else {
                            report += "## \u274C Erro na An\u00E1lise\n\n**Erro:** ".concat(taskResult.error, "\n\n## A\u00E7\u00F5es Recomendadas\n\n- Verificar configura\u00E7\u00E3o da API Gemini\n- Verificar qualidade dos dados de entrada\n- Tentar novamente com dados diferentes\n\n");
                        }
                        // Salvar relatório no MinIO
                        return [4 /*yield*/, this.minioService.uploadReportMarkdown(report, this.config.name, taskResult.taskId)];
                    case 1:
                        // Salvar relatório no MinIO
                        _a.sent();
                        return [2 /*return*/, report];
                }
            });
        });
    };
    // 🔧 MÉTODOS ADICIONAIS PARA CACHE E PERSISTÊNCIA
    AnalysisAgent.prototype.loadComponentCache = function () {
        return __awaiter(this, void 0, void 0, function () {
            var data, cache, error_8;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fs.readFile(this.cacheFile, 'utf-8')];
                    case 1:
                        data = _a.sent();
                        cache = JSON.parse(data);
                        Object.entries(cache).forEach(function (_a) {
                            var key = _a[0], value = _a[1];
                            _this.componentCache.set(key, value);
                        });
                        this.log("\uD83D\uDCCB Cache de componentes carregado: ".concat(this.componentCache.size, " entradas"));
                        return [3 /*break*/, 3];
                    case 2:
                        error_8 = _a.sent();
                        this.log('📝 Criando novo cache de componentes');
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AnalysisAgent.prototype.saveComponentCache = function () {
        return __awaiter(this, void 0, void 0, function () {
            var cache_1, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        cache_1 = {};
                        this.componentCache.forEach(function (value, key) {
                            cache_1[key] = value;
                        });
                        return [4 /*yield*/, fs.writeFile(this.cacheFile, JSON.stringify(cache_1, null, 2), 'utf-8')];
                    case 1:
                        _a.sent();
                        this.log("\uD83D\uDCBE Cache de componentes salvo: ".concat(this.componentCache.size, " entradas"));
                        return [3 /*break*/, 3];
                    case 2:
                        error_9 = _a.sent();
                        this.log("\u274C Erro ao salvar cache: ".concat(error_9), 'error');
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AnalysisAgent.prototype.generateElementHash = function (element) {
        var crypto = require('crypto');
        var elementKey = "".concat(element.type, "-").concat(element.text, "-").concat(element.selector);
        return crypto.createHash('md5').update(elementKey).digest('hex');
    };
    AnalysisAgent.prototype.getCachedAnalysis = function (element) {
        return __awaiter(this, void 0, void 0, function () {
            var hash;
            return __generator(this, function (_a) {
                hash = this.generateElementHash(element);
                return [2 /*return*/, this.componentCache.get(hash) || null];
            });
        });
    };
    AnalysisAgent.prototype.cacheAnalysis = function (element, analysis) {
        return __awaiter(this, void 0, void 0, function () {
            var hash;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        hash = this.generateElementHash(element);
                        this.componentCache.set(hash, analysis);
                        if (!(this.componentCache.size % 10 === 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.saveComponentCache()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    AnalysisAgent.prototype.saveAnalysisResults = function (analysis, filename) {
        return __awaiter(this, void 0, void 0, function () {
            var outputDir, timestamp, analysisFile, filePath, markdownContent;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        outputDir = path.join(process.cwd(), 'output', 'final_documents');
                        return [4 /*yield*/, fs.mkdir(outputDir, { recursive: true })];
                    case 1:
                        _a.sent();
                        timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                        analysisFile = filename || "analysis-results-".concat(timestamp, ".md");
                        filePath = path.join(outputDir, analysisFile);
                        markdownContent = this.generateAnalysisMarkdown(analysis);
                        return [4 /*yield*/, fs.writeFile(filePath, markdownContent, 'utf-8')];
                    case 2:
                        _a.sent();
                        this.log("\uD83D\uDCC4 Resultados de an\u00E1lise salvos em: ".concat(analysisFile));
                        return [2 /*return*/, filePath];
                }
            });
        });
    };
    AnalysisAgent.prototype.generateAnalysisMarkdown = function (analysis) {
        var functionalitiesList = analysis.keyFunctionalities.map(function (func) { return "- ".concat(func); }).join('\n');
        var workflowsList = analysis.userWorkflows.map(function (workflow, idx) { return "".concat(idx + 1, ". ").concat(workflow); }).join('\n');
        var recommendationsList = analysis.recommendations.map(function (rec) { return "- ".concat(rec); }).join('\n');
        var technologiesList = analysis.technicalInsights.technologies.map(function (tech) { return "- ".concat(tech); }).join('\n');
        var patternsList = analysis.technicalInsights.patterns.map(function (pattern) { return "- ".concat(pattern); }).join('\n');
        var pagesContent = analysis.pageAnalyses.map(function (page, idx) {
            var userJourneySteps = page.userJourney.map(function (step) { return "1. ".concat(step); }).join('\n');
            var navigationSteps = page.navigationFlow.map(function (nav) { return "- ".concat(nav); }).join('\n');
            var accessibilityIssues = page.accessibility.issues.length > 0 ?
                page.accessibility.issues.map(function (issue) { return "- \u274C ".concat(issue); }).join('\n') :
                '- ✅ Nenhum problema crítico encontrado';
            var accessibilityRecs = page.accessibility.recommendations.length > 0 ?
                "**Recomenda\u00E7\u00F5es de Acessibilidade**:\n".concat(page.accessibility.recommendations.map(function (rec) { return "- ".concat(rec); }).join('\n')) : '';
            return "\n### ".concat(idx + 1, ". ").concat(page.title, "\n- **URL**: ").concat(page.url, "\n- **Prop\u00F3sito**: ").concat(page.purpose, "\n- **Elementos Analisados**: ").concat(page.elementAnalyses.length, "\n- **Recursos Principais**: ").concat(page.keyFeatures.join(', '), "\n\n**Jornada do Usu\u00E1rio**:\n").concat(userJourneySteps, "\n\n**Navega\u00E7\u00E3o**:\n").concat(navigationSteps, "\n\n**Acessibilidade** (Pontua\u00E7\u00E3o: ").concat(page.accessibility.score, "/10):\n").concat(accessibilityIssues, "\n\n").concat(accessibilityRecs, "\n");
        }).join('\n');
        return "# Relat\u00F3rio de An\u00E1lise - ".concat(new Date().toLocaleString(), "\n\n## \uD83D\uDCCB Resumo Executivo\n").concat(analysis.summary, "\n\n## \uD83D\uDCCA Estat\u00EDsticas Gerais\n- **Total de P\u00E1ginas Analisadas**: ").concat(analysis.totalPages, "\n- **Total de Elementos Interativos**: ").concat(analysis.totalElements, "\n- **Complexidade do Sistema**: ").concat(analysis.technicalInsights.complexity.toUpperCase(), "\n\n## \uD83C\uDFAF Funcionalidades Principais\n").concat(functionalitiesList, "\n\n## \uD83D\uDC64 Fluxos de Usu\u00E1rio Identificados\n").concat(workflowsList, "\n\n## \uD83D\uDCA1 Recomenda\u00E7\u00F5es\n").concat(recommendationsList, "\n\n## \uD83D\uDD27 Insights T\u00E9cnicos\n\n### Tecnologias Identificadas\n").concat(technologiesList, "\n\n### Padr\u00F5es de Design\n").concat(patternsList, "\n\n## \uD83D\uDCD1 An\u00E1lise Detalhada por P\u00E1gina\n").concat(pagesContent, "\n\n---\n*Relat\u00F3rio gerado automaticamente pelo AnalysisAgent v").concat(this.config.version, "*\n");
    };
    AnalysisAgent.prototype.finalize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.saveComponentCache()];
                    case 1:
                        _a.sent();
                        this.log('AnalysisAgent finalizado');
                        return [2 /*return*/];
                }
            });
        });
    };
    AnalysisAgent.prototype.cleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.currentAnalysis = null;
                        return [4 /*yield*/, this.saveComponentCache()];
                    case 1:
                        _a.sent();
                        this.log('AnalysisAgent cleanup finalizado');
                        return [2 /*return*/];
                }
            });
        });
    };
    return AnalysisAgent;
}(AgnoSCore_js_1.BaseAgent));
exports.AnalysisAgent = AnalysisAgent;
