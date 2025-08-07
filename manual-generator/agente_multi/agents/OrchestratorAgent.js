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
exports.OrchestratorAgent = void 0;
var AgnoSCore_js_1 = require("../core/AgnoSCore.js");
var MinIOService_js_1 = require("../services/MinIOService.js");
var LoginAgent_js_1 = require("./LoginAgent.js");
var CrawlerAgent_js_1 = require("./CrawlerAgent.js");
var AnalysisAgent_js_1 = require("./AnalysisAgent.js");
var ContentAgent_js_1 = require("./ContentAgent.js");
var GeneratorAgent_js_1 = require("./GeneratorAgent.js");
var playwright_1 = require("playwright");
var OrchestratorAgent = /** @class */ (function (_super) {
    __extends(OrchestratorAgent, _super);
    function OrchestratorAgent() {
        var _this = this;
        var config = {
            name: 'OrchestratorAgent',
            version: '1.0.0',
            description: 'Agente orquestrador que coordena todo o pipeline de geração de manuais',
            capabilities: [
                { name: 'agent_coordination', description: 'Coordenação de múltiplos agentes especializados', version: '1.0.0' },
                { name: 'pipeline_management', description: 'Gerenciamento do pipeline de execução', version: '1.0.0' },
                { name: 'error_recovery', description: 'Recuperação de erros e retry automático', version: '1.0.0' },
                { name: 'execution_monitoring', description: 'Monitoramento em tempo real da execução', version: '1.0.0' },
                { name: 'result_aggregation', description: 'Agregação de resultados de múltiplos agentes', version: '1.0.0' }
            ]
        };
        _this = _super.call(this, config) || this;
        _this.agents = new Map();
        _this.browser = null;
        _this.page = null;
        _this.currentExecution = null;
        _this.minioService = new MinIOService_js_1.MinIOService();
        _this.initializeAgents();
        return _this;
    }
    OrchestratorAgent.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            var _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0: return [4 /*yield*/, this.minioService.initialize()];
                    case 1:
                        _f.sent();
                        // Inicializar browser
                        _a = this;
                        return [4 /*yield*/, playwright_1.chromium.launch({
                                headless: true,
                                args: ['--no-sandbox', '--disable-setuid-sandbox']
                            })];
                    case 2:
                        // Inicializar browser
                        _a.browser = _f.sent();
                        _b = this;
                        return [4 /*yield*/, this.browser.newPage()];
                    case 3:
                        _b.page = _f.sent();
                        // Configurar agentes com recursos compartilhados
                        if (this.page) {
                            (_c = this.agents.get('CrawlerAgent')) === null || _c === void 0 ? void 0 : _c.setPage(this.page);
                            (_d = this.agents.get('CrawlerAgent')) === null || _d === void 0 ? void 0 : _d.setBrowser(this.browser);
                            (_e = this.agents.get('LoginAgent')) === null || _e === void 0 ? void 0 : _e.setPage(this.page);
                        }
                        this.log('OrchestratorAgent inicializado - pronto para orquestrar pipeline completo');
                        return [2 /*return*/];
                }
            });
        });
    };
    OrchestratorAgent.prototype.initializeAgents = function () {
        var _this = this;
        this.agents.set('LoginAgent', new LoginAgent_js_1.LoginAgent());
        this.agents.set('CrawlerAgent', new CrawlerAgent_js_1.CrawlerAgent());
        this.agents.set('AnalysisAgent', new AnalysisAgent_js_1.AnalysisAgent());
        this.agents.set('ContentAgent', new ContentAgent_js_1.ContentAgent());
        this.agents.set('GeneratorAgent', new GeneratorAgent_js_1.GeneratorAgent());
        // Inicializar todos os agentes
        this.agents.forEach(function (agent, name) { return __awaiter(_this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, agent.initialize()];
                    case 1:
                        _a.sent();
                        this.log("Agente ".concat(name, " inicializado com sucesso"));
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        this.log("Erro ao inicializar ".concat(name, ": ").concat(error_1), 'error');
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    };
    OrchestratorAgent.prototype.processTask = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, _a, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        startTime = Date.now();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 12, , 13]);
                        _a = task.type;
                        switch (_a) {
                            case 'generate_manual': return [3 /*break*/, 2];
                            case 'execute_full_pipeline': return [3 /*break*/, 4];
                            case 'generation_complete': return [3 /*break*/, 6];
                            case 'execute_partial_pipeline': return [3 /*break*/, 8];
                        }
                        return [3 /*break*/, 10];
                    case 2: return [4 /*yield*/, this.handleManualGeneration(task)];
                    case 3: return [2 /*return*/, _b.sent()];
                    case 4: return [4 /*yield*/, this.handleFullPipelineExecution(task)];
                    case 5: return [2 /*return*/, _b.sent()];
                    case 6: return [4 /*yield*/, this.handleGenerationComplete(task)];
                    case 7: return [2 /*return*/, _b.sent()];
                    case 8: return [4 /*yield*/, this.handlePartialPipelineExecution(task)];
                    case 9: return [2 /*return*/, _b.sent()];
                    case 10: throw new Error("Tipo de tarefa n\u00E3o suportada: ".concat(task.type));
                    case 11: return [3 /*break*/, 13];
                    case 12:
                        error_2 = _b.sent();
                        return [2 /*return*/, {
                                id: task.id,
                                taskId: task.id,
                                success: false,
                                error: error_2 instanceof Error ? error_2.message : String(error_2),
                                timestamp: new Date(),
                                processingTime: Date.now() - startTime
                            }];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    OrchestratorAgent.prototype.handleManualGeneration = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, url, outputFormat, includeScreenshots, authRequired, maxDepth, title, config, result, error_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = task.data, url = _a.url, outputFormat = _a.outputFormat, includeScreenshots = _a.includeScreenshots, authRequired = _a.authRequired, maxDepth = _a.maxDepth, title = _a.title;
                        this.log("\uD83D\uDCD6 Iniciando gera\u00E7\u00E3o de manual: ".concat(title || url));
                        config = {
                            maxRetries: 3,
                            timeoutMinutes: 10,
                            enableScreenshots: includeScreenshots || true,
                            outputFormats: outputFormat ? [outputFormat] : ['markdown'],
                            targetUrl: url,
                            authConfig: authRequired ? {
                                type: 'basic',
                                credentials: task.data.credentials
                            } : undefined
                        };
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.executeFullPipeline(config)];
                    case 2:
                        result = _b.sent();
                        return [2 /*return*/, {
                                id: task.id,
                                taskId: task.id,
                                success: result.success,
                                data: {
                                    documents: result.documentsGenerated,
                                    executionId: result.executionId,
                                    duration: result.totalDuration,
                                    agentsExecuted: result.agentsExecuted,
                                    statistics: result.statistics
                                },
                                timestamp: new Date(),
                                processingTime: result.totalDuration
                            }];
                    case 3:
                        error_3 = _b.sent();
                        this.log("\u274C Erro na gera\u00E7\u00E3o de manual: ".concat(error_3), 'error');
                        return [2 /*return*/, {
                                id: task.id,
                                taskId: task.id,
                                success: false,
                                error: error_3 instanceof Error ? error_3.message : String(error_3),
                                timestamp: new Date(),
                                processingTime: 0
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    OrchestratorAgent.prototype.executeFullPipeline = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            var executionId, startTime, result, sessionData, authContext, loginResult, _a, _b, crawlerResult, _c, _d, analysisResult, _e, _f, contentResult, _g, _h, generatorResult, _j, _k, error_4;
            var _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
            return __generator(this, function (_0) {
                switch (_0.label) {
                    case 0:
                        executionId = "exec_".concat(Date.now());
                        startTime = new Date();
                        this.log("\uD83D\uDE80 Iniciando pipeline completo de gera\u00E7\u00E3o de manual - ID: ".concat(executionId));
                        result = {
                            success: false,
                            executionId: executionId,
                            startTime: startTime,
                            endTime: new Date(),
                            totalDuration: 0,
                            agentsExecuted: [],
                            documentsGenerated: {},
                            statistics: {
                                pagesProcessed: 0,
                                elementsAnalyzed: 0,
                                screenshotsCaptured: 0,
                                wordCount: 0
                            },
                            reports: {},
                            errors: []
                        };
                        this.currentExecution = result;
                        _0.label = 1;
                    case 1:
                        _0.trys.push([1, 15, , 17]);
                        sessionData = null;
                        authContext = null;
                        if (!config.authConfig) return [3 /*break*/, 4];
                        this.log('📋 FASE 1: Executando LoginAgent');
                        return [4 /*yield*/, this.executeAgentTask('LoginAgent', 'authenticate', {
                                credentials: config.authConfig.credentials,
                                page: this.page
                            })];
                    case 2:
                        loginResult = _0.sent();
                        if (!loginResult.success) {
                            throw new Error("LoginAgent falhou: ".concat(loginResult.error));
                        }
                        result.agentsExecuted.push('LoginAgent');
                        _a = result.reports;
                        _b = 'LoginAgent';
                        return [4 /*yield*/, this.agents.get('LoginAgent').generateMarkdownReport(loginResult)];
                    case 3:
                        _a[_b] = _0.sent();
                        sessionData = (_l = loginResult.data) === null || _l === void 0 ? void 0 : _l.sessionData;
                        authContext = {
                            loginScreenshot: (_m = loginResult.data) === null || _m === void 0 ? void 0 : _m.loginScreenshot,
                            postLoginScreenshot: (_o = loginResult.data) === null || _o === void 0 ? void 0 : _o.postLoginScreenshot,
                            authType: config.authConfig.type
                        };
                        return [3 /*break*/, 5];
                    case 4:
                        this.log('⏭️ FASE 1: Pulando LoginAgent - autenticação não necessária');
                        _0.label = 5;
                    case 5:
                        // FASE 2: Crawling e Captura
                        this.log('🕷️ FASE 2: Executando CrawlerAgent');
                        return [4 /*yield*/, this.executeAgentTask('CrawlerAgent', 'start_crawl', {
                                url: config.targetUrl,
                                sessionData: sessionData,
                                authContext: authContext,
                                enableScreenshots: config.enableScreenshots,
                                page: this.page
                            })];
                    case 6:
                        crawlerResult = _0.sent();
                        if (!crawlerResult.success) {
                            throw new Error("CrawlerAgent falhou: ".concat(crawlerResult.error));
                        }
                        result.agentsExecuted.push('CrawlerAgent');
                        _c = result.reports;
                        _d = 'CrawlerAgent';
                        return [4 /*yield*/, this.agents.get('CrawlerAgent').generateMarkdownReport(crawlerResult)];
                    case 7:
                        _c[_d] = _0.sent();
                        result.statistics.pagesProcessed = ((_p = crawlerResult.data) === null || _p === void 0 ? void 0 : _p.pagesProcessed) || 0;
                        result.statistics.elementsAnalyzed = ((_q = crawlerResult.data) === null || _q === void 0 ? void 0 : _q.totalElements) || 0;
                        result.statistics.screenshotsCaptured = ((_s = (_r = crawlerResult.data) === null || _r === void 0 ? void 0 : _r.screenshots) === null || _s === void 0 ? void 0 : _s.length) || 0;
                        // FASE 3: Análise com IA
                        this.log('🧠 FASE 3: Executando AnalysisAgent');
                        return [4 /*yield*/, this.executeAgentTask('AnalysisAgent', 'analyze_crawl_data', {
                                crawlResults: (_t = crawlerResult.data) === null || _t === void 0 ? void 0 : _t.crawlResults,
                                sessionData: sessionData,
                                authContext: authContext
                            })];
                    case 8:
                        analysisResult = _0.sent();
                        if (!analysisResult.success) {
                            throw new Error("AnalysisAgent falhou: ".concat(analysisResult.error));
                        }
                        result.agentsExecuted.push('AnalysisAgent');
                        _e = result.reports;
                        _f = 'AnalysisAgent';
                        return [4 /*yield*/, this.agents.get('AnalysisAgent').generateMarkdownReport(analysisResult)];
                    case 9:
                        _e[_f] = _0.sent();
                        // FASE 4: Geração de Conteúdo User-Friendly
                        this.log('📝 FASE 4: Executando ContentAgent');
                        return [4 /*yield*/, this.executeAgentTask('ContentAgent', 'generate_user_friendly_content', {
                                crawlAnalysis: analysisResult.data,
                                sessionData: sessionData,
                                authContext: authContext,
                                rawData: (_u = crawlerResult.data) === null || _u === void 0 ? void 0 : _u.crawlResults
                            })];
                    case 10:
                        contentResult = _0.sent();
                        if (!contentResult.success) {
                            throw new Error("ContentAgent falhou: ".concat(contentResult.error));
                        }
                        result.agentsExecuted.push('ContentAgent');
                        _g = result.reports;
                        _h = 'ContentAgent';
                        return [4 /*yield*/, this.agents.get('ContentAgent').generateMarkdownReport(contentResult)];
                    case 11:
                        _g[_h] = _0.sent();
                        // FASE 5: Geração de Documentos Finais
                        this.log('📄 FASE 5: Executando GeneratorAgent');
                        return [4 /*yield*/, this.executeAgentTask('GeneratorAgent', 'generate_final_documents', {
                                userContent: contentResult.data,
                                crawlAnalysis: analysisResult.data,
                                sessionData: sessionData,
                                authContext: authContext,
                                rawData: (_v = crawlerResult.data) === null || _v === void 0 ? void 0 : _v.crawlResults
                            })];
                    case 12:
                        generatorResult = _0.sent();
                        if (!generatorResult.success) {
                            throw new Error("GeneratorAgent falhou: ".concat(generatorResult.error));
                        }
                        result.agentsExecuted.push('GeneratorAgent');
                        _j = result.reports;
                        _k = 'GeneratorAgent';
                        return [4 /*yield*/, this.agents.get('GeneratorAgent').generateMarkdownReport(generatorResult)];
                    case 13:
                        _j[_k] = _0.sent();
                        // Agregação dos resultados finais
                        if (generatorResult.data) {
                            result.documentsGenerated = {
                                markdown: (_w = generatorResult.data.minioUrls) === null || _w === void 0 ? void 0 : _w.markdown,
                                html: (_x = generatorResult.data.minioUrls) === null || _x === void 0 ? void 0 : _x.html,
                                pdf: (_y = generatorResult.data.minioUrls) === null || _y === void 0 ? void 0 : _y.pdf
                            };
                            result.statistics.wordCount = ((_z = generatorResult.data.metadata) === null || _z === void 0 ? void 0 : _z.wordCount) || 0;
                        }
                        result.success = true;
                        result.endTime = new Date();
                        result.totalDuration = result.endTime.getTime() - result.startTime.getTime();
                        this.log("\u2705 Pipeline completo executado com SUCESSO em ".concat(result.totalDuration, "ms"));
                        this.log("\uD83D\uDCCA Estat\u00EDsticas: ".concat(result.statistics.pagesProcessed, " p\u00E1ginas, ").concat(result.statistics.elementsAnalyzed, " elementos, ").concat(result.statistics.wordCount, " palavras"));
                        // Gerar relatório final consolidado
                        return [4 /*yield*/, this.generateFinalReport(result)];
                    case 14:
                        // Gerar relatório final consolidado
                        _0.sent();
                        return [3 /*break*/, 17];
                    case 15:
                        error_4 = _0.sent();
                        result.errors.push(error_4 instanceof Error ? error_4.message : String(error_4));
                        result.endTime = new Date();
                        result.totalDuration = result.endTime.getTime() - result.startTime.getTime();
                        this.log("\u274C Pipeline falhou: ".concat(error_4), 'error');
                        return [4 /*yield*/, this.generateErrorReport(result, error_4)];
                    case 16:
                        _0.sent();
                        return [3 /*break*/, 17];
                    case 17:
                        this.currentExecution = result;
                        return [2 /*return*/, result];
                }
            });
        });
    };
    OrchestratorAgent.prototype.executeAgentTask = function (agentName, taskType, data) {
        return __awaiter(this, void 0, void 0, function () {
            var agent, taskData, result, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        agent = this.agents.get(agentName);
                        if (!agent) {
                            throw new Error("Agente ".concat(agentName, " n\u00E3o encontrado"));
                        }
                        taskData = {
                            id: "task_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9)),
                            type: taskType,
                            data: data,
                            priority: 'high',
                            timestamp: new Date(),
                            sender: 'OrchestratorAgent'
                        };
                        this.log("\uD83D\uDD04 Executando ".concat(agentName, ".").concat(taskType));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, agent.processTask(taskData)];
                    case 2:
                        result = _a.sent();
                        if (result.success) {
                            this.log("\u2705 ".concat(agentName, " conclu\u00EDdo com sucesso"));
                        }
                        else {
                            this.log("\u274C ".concat(agentName, " falhou: ").concat(result.error), 'error');
                        }
                        return [2 /*return*/, result];
                    case 3:
                        error_5 = _a.sent();
                        this.log("\uD83D\uDCA5 Erro cr\u00EDtico em ".concat(agentName, ": ").concat(error_5), 'error');
                        return [2 /*return*/, {
                                id: taskData.id,
                                taskId: taskData.id,
                                success: false,
                                error: error_5 instanceof Error ? error_5.message : String(error_5),
                                timestamp: new Date(),
                                processingTime: 0
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    OrchestratorAgent.prototype.handleFullPipelineExecution = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var config, startTime, result, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        config = task.data.config;
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.executeFullPipeline(config)];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, {
                                id: task.id,
                                taskId: task.id,
                                success: result.success,
                                data: result,
                                timestamp: new Date(),
                                processingTime: Date.now() - startTime,
                                error: result.errors.length > 0 ? result.errors.join('; ') : undefined
                            }];
                    case 3:
                        error_6 = _a.sent();
                        throw error_6;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    OrchestratorAgent.prototype.handleGenerationComplete = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var documents, startTime;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                documents = task.data.documents;
                startTime = Date.now();
                this.log('🎉 Recebida notificação de geração completa');
                // Atualizar execução atual com os documentos gerados
                if (this.currentExecution) {
                    this.currentExecution.documentsGenerated = {
                        markdown: (_a = documents.minioUrls) === null || _a === void 0 ? void 0 : _a.markdown,
                        html: (_b = documents.minioUrls) === null || _b === void 0 ? void 0 : _b.html,
                        pdf: (_c = documents.minioUrls) === null || _c === void 0 ? void 0 : _c.pdf
                    };
                    if (documents.metadata) {
                        this.currentExecution.statistics.wordCount = documents.metadata.wordCount;
                    }
                }
                return [2 /*return*/, {
                        id: task.id,
                        taskId: task.id,
                        success: true,
                        data: { acknowledged: true },
                        timestamp: new Date(),
                        processingTime: Date.now() - startTime
                    }];
            });
        });
    };
    OrchestratorAgent.prototype.handlePartialPipelineExecution = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime;
            return __generator(this, function (_a) {
                startTime = Date.now();
                return [2 /*return*/, {
                        id: task.id,
                        taskId: task.id,
                        success: false,
                        error: 'Pipeline parcial não implementado ainda',
                        timestamp: new Date(),
                        processingTime: Date.now() - startTime
                    }];
            });
        });
    };
    OrchestratorAgent.prototype.generateFinalReport = function (result) {
        return __awaiter(this, void 0, void 0, function () {
            var report;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        report = "# \uD83C\uDF89 Relat\u00F3rio Final - Sistema Multi-Agente de Gera\u00E7\u00E3o de Manuais\n\n## Execu\u00E7\u00E3o ".concat(result.executionId, "\n\n**Status:** ").concat(result.success ? '✅ SUCESSO TOTAL' : '❌ FALHOU', "  \n**In\u00EDcio:** ").concat(result.startTime.toLocaleString('pt-BR'), "  \n**Fim:** ").concat(result.endTime.toLocaleString('pt-BR'), "  \n**Dura\u00E7\u00E3o Total:** ").concat((result.totalDuration / 1000).toFixed(2), "s\n\n## \uD83D\uDCCA Estat\u00EDsticas Finais\n\n- **P\u00E1ginas Processadas:** ").concat(result.statistics.pagesProcessed, "\n- **Elementos Analisados:** ").concat(result.statistics.elementsAnalyzed, "\n- **Screenshots Capturados:** ").concat(result.statistics.screenshotsCaptured, "\n- **Palavras no Manual:** ").concat(result.statistics.wordCount, "\n\n## \uD83E\uDD16 Agentes Executados (").concat(result.agentsExecuted.length, "/5)\n\n").concat(result.agentsExecuted.map(function (agent, index) { return "".concat(index + 1, ". \u2705 ").concat(agent); }).join('\n'), "\n\n## \uD83D\uDCC4 Documentos Gerados\n\n").concat(result.documentsGenerated.markdown ? "- **Markdown:** [Download](".concat(result.documentsGenerated.markdown, ")") : '- **Markdown:** ❌ Não gerado', "\n").concat(result.documentsGenerated.html ? "- **HTML:** [Visualizar](".concat(result.documentsGenerated.html, ")") : '- **HTML:** ❌ Não gerado', "\n").concat(result.documentsGenerated.pdf ? "- **PDF:** [Download](".concat(result.documentsGenerated.pdf, ")") : '- **PDF:** ❌ Não gerado', "\n\n## \uD83D\uDD17 Relat\u00F3rios Individuais\n\n").concat(Object.entries(result.reports).map(function (_a) {
                            var agent = _a[0], url = _a[1];
                            return "- **".concat(agent, ":** [Ver Relat\u00F3rio](").concat(url, ")");
                        }).join('\n'), "\n\n## \uD83C\uDFAF Resumo do Pipeline\n\n1. **LoginAgent** \u2192 Autentica\u00E7\u00E3o e captura de sess\u00E3o \u2705\n2. **CrawlerAgent** \u2192 Navega\u00E7\u00E3o e captura de elementos \u2705\n3. **AnalysisAgent** \u2192 An\u00E1lise inteligente com IA \u2705\n4. **ContentAgent** \u2192 Conte\u00FAdo user-friendly \u2705\n5. **GeneratorAgent** \u2192 Documentos finais \u2705\n\n## \uD83D\uDCA1 Conclus\u00E3o\n\n").concat(result.success ?
                            "\uD83C\uDF89 **PIPELINE EXECUTADO COM SUCESSO TOTAL!**\n\nO sistema multi-agente funcionou perfeitamente, gerando documenta\u00E7\u00E3o completa e profissional. Os manuais est\u00E3o prontos para uso e dispon\u00EDveis nos links acima.\n\n### Pr\u00F3ximos Passos:\n- Downloads dos documentos nos formatos desejados\n- Revis\u00E3o do conte\u00FAdo gerado\n- Feedback para melhorias futuras" :
                            "\u274C **PIPELINE FALHOU**\n\nErros encontrados: ".concat(result.errors.join(', '), "\n\n### A\u00E7\u00F5es Recomendadas:\n- Verificar logs dos agentes individuais\n- Corrigir problemas identificados\n- Executar novamente o pipeline"), "\n\n---\n\n*Relat\u00F3rio gerado automaticamente pelo OrchestratorAgent em ").concat(new Date().toLocaleString('pt-BR'), "*\n");
                        return [4 /*yield*/, this.minioService.uploadReportMarkdown(report, 'OrchestratorAgent', result.executionId)];
                    case 1:
                        _a.sent();
                        this.log('📋 Relatório final consolidado salvo no MinIO');
                        return [2 /*return*/];
                }
            });
        });
    };
    OrchestratorAgent.prototype.generateErrorReport = function (result, error) {
        return __awaiter(this, void 0, void 0, function () {
            var report;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        report = "# \u274C Relat\u00F3rio de Erro - Pipeline Multi-Agente\n\n## Execu\u00E7\u00E3o ".concat(result.executionId, "\n\n**Status:** FALHOU  \n**Erro Principal:** ").concat(error instanceof Error ? error.message : String(error), "  \n**Dura\u00E7\u00E3o at\u00E9 Falha:** ").concat((result.totalDuration / 1000).toFixed(2), "s\n\n## Agentes Executados Antes da Falha (").concat(result.agentsExecuted.length, "/5)\n\n").concat(result.agentsExecuted.map(function (agent, index) { return "".concat(index + 1, ". \u2705 ").concat(agent); }).join('\n'), "\n\n## Erros Detalhados\n\n").concat(result.errors.map(function (err, index) { return "".concat(index + 1, ". ").concat(err); }).join('\n'), "\n\n## A\u00E7\u00F5es de Recupera\u00E7\u00E3o\n\n1. Verificar logs individuais dos agentes\n2. Verificar conectividade de rede\n3. Verificar configura\u00E7\u00F5es das APIs (Gemini, MinIO)\n4. Verificar permiss\u00F5es de arquivos\n5. Tentar executar pipeline novamente\n\n---\n\n*Relat\u00F3rio de erro gerado em ").concat(new Date().toLocaleString('pt-BR'), "*\n");
                        return [4 /*yield*/, this.minioService.uploadReportMarkdown(report, 'OrchestratorAgent', "".concat(result.executionId, "_ERROR"))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    OrchestratorAgent.prototype.generateMarkdownReport = function (taskResult) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp;
            return __generator(this, function (_a) {
                timestamp = new Date().toISOString();
                return [2 /*return*/, "# Relat\u00F3rio do OrchestratorAgent\n\n**Task ID:** ".concat(taskResult.taskId, "\n**Timestamp:** ").concat(timestamp, "\n**Status:** ").concat(taskResult.success ? '✅ Sucesso' : '❌ Falha', "\n\n").concat(taskResult.success ?
                        "## \u2705 Orquestra\u00E7\u00E3o Conclu\u00EDda com Sucesso\n\nO pipeline completo foi executado e todos os documentos foram gerados." :
                        "## \u274C Falha na Orquestra\u00E7\u00E3o\n\n**Erro:** ".concat(taskResult.error), "\n\nConsulte o relat\u00F3rio final completo para detalhes.\n")];
            });
        });
    };
    OrchestratorAgent.prototype.cleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, _b, name_1, agent, error_7;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _i = 0, _a = Array.from(this.agents.entries());
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 7];
                        _b = _a[_i], name_1 = _b[0], agent = _b[1];
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 5, , 6]);
                        if (!agent.cleanup) return [3 /*break*/, 4];
                        return [4 /*yield*/, agent.cleanup()];
                    case 3:
                        _c.sent();
                        _c.label = 4;
                    case 4:
                        this.log("Agente ".concat(name_1, " finalizado"));
                        return [3 /*break*/, 6];
                    case 5:
                        error_7 = _c.sent();
                        this.log("Erro ao finalizar ".concat(name_1, ": ").concat(error_7), 'warn');
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 1];
                    case 7:
                        if (!this.browser) return [3 /*break*/, 9];
                        return [4 /*yield*/, this.browser.close()];
                    case 8:
                        _c.sent();
                        this.browser = null;
                        this.page = null;
                        _c.label = 9;
                    case 9:
                        this.agents.clear();
                        this.currentExecution = null;
                        this.log('OrchestratorAgent finalizado - todos os recursos liberados');
                        return [2 /*return*/];
                }
            });
        });
    };
    return OrchestratorAgent;
}(AgnoSCore_js_1.BaseAgent));
exports.OrchestratorAgent = OrchestratorAgent;
