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
exports.ContentAgent = void 0;
var AgnoSCore_js_1 = require("../core/AgnoSCore.js");
var MinIOService_js_1 = require("../services/MinIOService.js");
var GeminiKeyManager_js_1 = require("../services/GeminiKeyManager.js");
var fs = require("fs/promises");
var path = require("path");
var ContentAgent = /** @class */ (function (_super) {
    __extends(ContentAgent, _super);
    function ContentAgent() {
        var _this = this;
        var config = {
            name: 'ContentAgent',
            version: '1.0.0',
            description: 'Agente especializado na criação de conteúdo amigável para usuários',
            capabilities: [
                { name: 'content_generation', description: 'Geração de conteúdo user-friendly', version: '1.0.0' },
                { name: 'step_by_step_guides', description: 'Criação de guias passo a passo', version: '1.0.0' },
                { name: 'troubleshooting_guides', description: 'Criação de guias de solução de problemas', version: '1.0.0' },
                { name: 'user_experience_writing', description: 'Escrita focada na experiência do usuário', version: '1.0.0' },
                { name: 'content_organization', description: 'Organização lógica de conteúdo', version: '1.0.0' }
            ]
        };
        _this = _super.call(this, config) || this;
        _this.currentContent = null;
        _this.keyManager = new GeminiKeyManager_js_1.GeminiKeyManager();
        _this.minioService = new MinIOService_js_1.MinIOService();
        _this.contentCacheFile = path.join(process.cwd(), 'output', 'content-draft.md');
        return _this;
    }
    ContentAgent.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.minioService.initialize()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.keyManager.loadStatus()];
                    case 2:
                        _a.sent();
                        this.log('ContentAgent inicializado para criação de conteúdo user-friendly');
                        return [2 /*return*/];
                }
            });
        });
    };
    ContentAgent.prototype.processTask = function (task) {
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
                            case 'generate_user_friendly_content': return [3 /*break*/, 2];
                            case 'create_user_guide': return [3 /*break*/, 4];
                            case 'optimize_content': return [3 /*break*/, 6];
                        }
                        return [3 /*break*/, 8];
                    case 2: return [4 /*yield*/, this.handleContentGeneration(task)];
                    case 3: return [2 /*return*/, _b.sent()];
                    case 4: return [4 /*yield*/, this.handleUserGuideCreation(task)];
                    case 5: return [2 /*return*/, _b.sent()];
                    case 6: return [4 /*yield*/, this.handleContentOptimization(task)];
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
    ContentAgent.prototype.handleContentGeneration = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, _a, crawlAnalysis, sessionData, authContext, rawData, userContent, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        startTime = Date.now();
                        _a = task.data, crawlAnalysis = _a.crawlAnalysis, sessionData = _a.sessionData, authContext = _a.authContext, rawData = _a.rawData;
                        this.log('Iniciando geração de conteúdo user-friendly');
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.generateUserFriendlyContent(crawlAnalysis, authContext, rawData)];
                    case 2:
                        userContent = _b.sent();
                        this.currentContent = userContent;
                        // Enviar para o próximo agente
                        this.sendTask('GeneratorAgent', 'generate_final_documents', {
                            userContent: userContent,
                            crawlAnalysis: crawlAnalysis,
                            sessionData: sessionData,
                            authContext: authContext,
                            rawData: rawData
                        }, 'high');
                        return [2 /*return*/, {
                                id: task.id,
                                taskId: task.id,
                                success: true,
                                data: userContent,
                                timestamp: new Date(),
                                processingTime: Date.now() - startTime
                            }];
                    case 3:
                        error_2 = _b.sent();
                        this.log("Erro na gera\u00E7\u00E3o de conte\u00FAdo: ".concat(error_2), 'error');
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ContentAgent.prototype.handleUserGuideCreation = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, analysis, context, startTime, guide, error_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = task.data, analysis = _a.analysis, context = _a.context;
                        startTime = Date.now();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.createSpecificUserGuide(analysis, context)];
                    case 2:
                        guide = _b.sent();
                        return [2 /*return*/, {
                                id: task.id,
                                taskId: task.id,
                                success: true,
                                data: guide,
                                timestamp: new Date(),
                                processingTime: Date.now() - startTime
                            }];
                    case 3:
                        error_3 = _b.sent();
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ContentAgent.prototype.handleContentOptimization = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, content, feedback, startTime, optimized, error_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = task.data, content = _a.content, feedback = _a.feedback;
                        startTime = Date.now();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.optimizeContent(content, feedback)];
                    case 2:
                        optimized = _b.sent();
                        return [2 /*return*/, {
                                id: task.id,
                                taskId: task.id,
                                success: true,
                                data: optimized,
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
    ContentAgent.prototype.generateUserFriendlyContent = function (crawlAnalysis, authContext, rawData) {
        return __awaiter(this, void 0, void 0, function () {
            var metadata, introduction, sections, appendices, summary, userContent;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.log('Gerando conteúdo estruturado para usuários finais');
                        return [4 /*yield*/, this.generateMetadata(crawlAnalysis)];
                    case 1:
                        metadata = _a.sent();
                        return [4 /*yield*/, this.generateIntroduction(crawlAnalysis, authContext)];
                    case 2:
                        introduction = _a.sent();
                        return [4 /*yield*/, this.generateUserGuideSections(crawlAnalysis, rawData)];
                    case 3:
                        sections = _a.sent();
                        return [4 /*yield*/, this.generateAppendices(crawlAnalysis)];
                    case 4:
                        appendices = _a.sent();
                        return [4 /*yield*/, this.generateSummary(crawlAnalysis)];
                    case 5:
                        summary = _a.sent();
                        userContent = {
                            metadata: metadata,
                            introduction: introduction,
                            sections: sections,
                            appendices: appendices,
                            summary: summary
                        };
                        this.log("Conte\u00FAdo gerado: ".concat(sections.length, " se\u00E7\u00F5es principais"));
                        return [2 /*return*/, userContent];
                }
            });
        });
    };
    ContentAgent.prototype.generateMetadata = function (analysis) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, response, aiMetadata, error_5;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prompt = "\nBaseado nesta an\u00E1lise de aplica\u00E7\u00E3o web, gere metadados para um manual do usu\u00E1rio:\n\nAN\u00C1LISE:\n- Total de P\u00E1ginas: ".concat(analysis.totalPages, "\n- Total de Elementos: ").concat(analysis.totalElements, "\n- Resumo: ").concat(analysis.summary, "\n- Complexidade: ").concat(analysis.technicalInsights.complexity, "\n\nGere metadados apropriados em formato JSON:\n- title: T\u00EDtulo atraente do manual\n- subtitle: Subt\u00EDtulo descritivo\n- version: Vers\u00E3o (1.0.0)\n- targetAudience: P\u00FAblico-alvo\n- estimatedReadTime: Tempo estimado de leitura\n\nFoque em linguagem clara e acess\u00EDvel para usu\u00E1rios finais.\n");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.keyManager.handleApiCall(function (model) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, model.generateContent(prompt)];
                                        case 1: return [2 /*return*/, _a.sent()];
                                    }
                                });
                            }); })];
                    case 2:
                        response = _a.sent();
                        aiMetadata = this.parseAIResponse(response.response.text());
                        return [2 /*return*/, {
                                title: aiMetadata.title || 'Manual do Usuário',
                                subtitle: aiMetadata.subtitle || 'Guia completo de utilização',
                                version: aiMetadata.version || '1.0.0',
                                dateCreated: new Date().toLocaleDateString('pt-BR'),
                                targetAudience: aiMetadata.targetAudience || 'Usuários finais',
                                estimatedReadTime: aiMetadata.estimatedReadTime || '15-20 minutos'
                            }];
                    case 3:
                        error_5 = _a.sent();
                        this.log("Erro na gera\u00E7\u00E3o de metadados: ".concat(error_5), 'warn');
                        return [2 /*return*/, {
                                title: 'Manual do Usuário - Aplicação Web',
                                subtitle: 'Guia completo para utilização da aplicação',
                                version: '1.0.0',
                                dateCreated: new Date().toLocaleDateString('pt-BR'),
                                targetAudience: 'Usuários finais da aplicação web',
                                estimatedReadTime: '15-20 minutos'
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ContentAgent.prototype.generateIntroduction = function (analysis, authContext) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, response, aiIntro, error_6;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prompt = "\nCrie uma introdu\u00E7\u00E3o amig\u00E1vel para um manual do usu\u00E1rio baseado nesta an\u00E1lise:\n\nAN\u00C1LISE:\n".concat(analysis.summary, "\n\nFUNCIONALIDADES PRINCIPAIS:\n").concat(analysis.keyFunctionalities.join(', '), "\n\nCONTEXTO DE AUTENTICA\u00C7\u00C3O:\n").concat((authContext === null || authContext === void 0 ? void 0 : authContext.authType) || 'Não requer autenticação', "\n\nCrie uma introdu\u00E7\u00E3o que inclua:\n1. overview: Vis\u00E3o geral da aplica\u00E7\u00E3o\n2. requirements: Requisitos necess\u00E1rios\n3. howToUseManual: Como usar este manual\n\nUse linguagem simples e acolhedora. Responda em JSON.\n");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.keyManager.handleApiCall(function (model) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, model.generateContent(prompt)];
                                        case 1: return [2 /*return*/, _a.sent()];
                                    }
                                });
                            }); })];
                    case 2:
                        response = _a.sent();
                        aiIntro = this.parseAIResponse(response.response.text());
                        return [2 /*return*/, {
                                overview: aiIntro.overview || 'Esta aplicação web oferece diversas funcionalidades para melhorar sua experiência digital.',
                                requirements: aiIntro.requirements || ['Navegador web atualizado', 'Conexão com internet', 'Dados de acesso (se necessário)'],
                                howToUseManual: aiIntro.howToUseManual || 'Este manual está organizado em seções que cobrem desde o acesso inicial até as funcionalidades avançadas. Cada seção inclui instruções passo a passo com capturas de tela.'
                            }];
                    case 3:
                        error_6 = _a.sent();
                        this.log("Erro na gera\u00E7\u00E3o da introdu\u00E7\u00E3o: ".concat(error_6), 'warn');
                        return [2 /*return*/, {
                                overview: 'Esta aplicação web foi projetada para oferecer uma experiência intuitiva e eficiente. Este manual irá guiá-lo através de todas as funcionalidades disponíveis.',
                                requirements: ['Navegador web moderno (Chrome, Firefox, Safari, Edge)', 'Conexão estável com a internet', 'Credenciais de acesso quando aplicável'],
                                howToUseManual: 'Este manual está dividido em seções temáticas. Cada seção contém instruções detalhadas, screenshots e dicas úteis. Você pode navegar diretamente para a seção de seu interesse ou seguir sequencialmente.'
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ContentAgent.prototype.generateUserGuideSections = function (analysis, rawData) {
        return __awaiter(this, void 0, void 0, function () {
            var sections, _a, _b, _i, _c, pageAnalysis, section, workflowSection;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        sections = [];
                        if (!analysis.pageAnalyses.some(function (page) { return page.purpose.toLowerCase().includes('login') ||
                            page.purpose.toLowerCase().includes('auth'); })) return [3 /*break*/, 2];
                        _b = (_a = sections).push;
                        return [4 /*yield*/, this.generateLoginSection(analysis)];
                    case 1:
                        _b.apply(_a, [_d.sent()]);
                        _d.label = 2;
                    case 2:
                        _i = 0, _c = analysis.pageAnalyses;
                        _d.label = 3;
                    case 3:
                        if (!(_i < _c.length)) return [3 /*break*/, 6];
                        pageAnalysis = _c[_i];
                        return [4 /*yield*/, this.generatePageSection(pageAnalysis, rawData)];
                    case 4:
                        section = _d.sent();
                        if (section) {
                            sections.push(section);
                        }
                        _d.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6: return [4 /*yield*/, this.generateWorkflowSection(analysis)];
                    case 7:
                        workflowSection = _d.sent();
                        if (workflowSection) {
                            sections.push(workflowSection);
                        }
                        this.log("".concat(sections.length, " se\u00E7\u00F5es de usu\u00E1rio geradas"));
                        return [2 /*return*/, sections];
                }
            });
        });
    };
    ContentAgent.prototype.generateLoginSection = function (analysis) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        id: 'login_access',
                        title: 'Acessando a Aplicação',
                        description: 'Como fazer login e acessar a aplicação pela primeira vez',
                        steps: [
                            {
                                stepNumber: 1,
                                action: 'Abrir o navegador',
                                description: 'Abra seu navegador web preferido (Chrome, Firefox, Safari ou Edge)',
                                expectedResult: 'O navegador deve estar funcionando normalmente'
                            },
                            {
                                stepNumber: 2,
                                action: 'Navegar para a aplicação',
                                description: 'Digite o endereço da aplicação na barra de endereços',
                                expectedResult: 'A página de login deve aparecer'
                            },
                            {
                                stepNumber: 3,
                                action: 'Inserir credenciais',
                                description: 'Digite seu usuário e senha nos campos apropriados',
                                expectedResult: 'Os campos devem ser preenchidos com suas informações'
                            },
                            {
                                stepNumber: 4,
                                action: 'Fazer login',
                                description: 'Clique no botão de login para acessar a aplicação',
                                expectedResult: 'Você deve ser redirecionado para a página principal'
                            }
                        ],
                        tips: [
                            'Mantenha suas credenciais seguras',
                            'Use uma senha forte e única',
                            'Se esquecer a senha, procure a opção "Esqueci minha senha"'
                        ],
                        troubleshooting: [
                            'Se não conseguir fazer login, verifique se as credenciais estão corretas',
                            'Certifique-se de que a tecla Caps Lock não está ativada',
                            'Tente limpar o cache do navegador se houver problemas'
                        ],
                        relatedSections: ['navigation_basics', 'user_account']
                    }];
            });
        });
    };
    ContentAgent.prototype.generatePageSection = function (pageAnalysis, rawData) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, response, aiSection, sectionId, error_7;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!pageAnalysis.elementAnalyses || pageAnalysis.elementAnalyses.length === 0) {
                            return [2 /*return*/, null];
                        }
                        prompt = "\nCrie uma se\u00E7\u00E3o do manual do usu\u00E1rio baseada nesta p\u00E1gina:\n\nP\u00C1GINA: ".concat(pageAnalysis.title, "\nPROP\u00D3SITO: ").concat(pageAnalysis.purpose, "\nELEMENTOS: ").concat(pageAnalysis.elementAnalyses.length, "\n\nELEMENTOS PRINCIPAIS:\n").concat(pageAnalysis.elementAnalyses.slice(0, 10).map(function (el, i) { return "\n".concat(i + 1, ". ").concat(el.description, "\n   Categoria: ").concat(el.category, "\n   Benef\u00EDcio: ").concat(el.userBenefit, "\n   Como usar: ").concat(el.usageInstructions, "\n"); }).join(''), "\n\nJORNADA DO USU\u00C1RIO:\n").concat(pageAnalysis.userJourney.join(' → '), "\n\nCrie um objeto JSON com:\n- title: T\u00EDtulo da se\u00E7\u00E3o\n- description: Descri\u00E7\u00E3o do que o usu\u00E1rio aprender\u00E1\n- steps: Array de passos detalhados\n- tips: Dicas \u00FAteis\n- troubleshooting: Problemas comuns e solu\u00E7\u00F5es\n\nFoque em linguagem clara e instru\u00E7\u00F5es pr\u00E1ticas.\n");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.keyManager.handleApiCall(function (model) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, model.generateContent(prompt)];
                                        case 1: return [2 /*return*/, _a.sent()];
                                    }
                                });
                            }); })];
                    case 2:
                        response = _a.sent();
                        aiSection = this.parseAIResponse(response.response.text());
                        sectionId = pageAnalysis.url.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
                        return [2 /*return*/, {
                                id: sectionId,
                                title: aiSection.title || pageAnalysis.title,
                                description: aiSection.description || "Como usar ".concat(pageAnalysis.title),
                                steps: aiSection.steps || this.generateStepsFromElements(pageAnalysis.elementAnalyses),
                                tips: aiSection.tips || ['Explore cada funcionalidade com calma'],
                                troubleshooting: aiSection.troubleshooting || ['Se houver problemas, atualize a página'],
                                relatedSections: []
                            }];
                    case 3:
                        error_7 = _a.sent();
                        this.log("Erro na gera\u00E7\u00E3o da se\u00E7\u00E3o: ".concat(error_7), 'warn');
                        return [2 /*return*/, this.generateFallbackPageSection(pageAnalysis)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ContentAgent.prototype.generateWorkflowSection = function (analysis) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, response, aiSection, error_8;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!analysis.userWorkflows || analysis.userWorkflows.length === 0) {
                            return [2 /*return*/, null];
                        }
                        prompt = "\nCrie uma se\u00E7\u00E3o sobre fluxos de trabalho principais baseada nesta an\u00E1lise:\n\nFLUXOS IDENTIFICADOS:\n".concat(analysis.userWorkflows.join('\n'), "\n\nFUNCIONALIDADES PRINCIPAIS:\n").concat(analysis.keyFunctionalities.join('\n'), "\n\nCrie uma se\u00E7\u00E3o JSON que explique os principais fluxos de trabalho de forma sequencial e did\u00E1tica.\nInclua title, description, steps detalhados, tips e troubleshooting.\n");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.keyManager.handleApiCall(function (model) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, model.generateContent(prompt)];
                                        case 1: return [2 /*return*/, _a.sent()];
                                    }
                                });
                            }); })];
                    case 2:
                        response = _a.sent();
                        aiSection = this.parseAIResponse(response.response.text());
                        return [2 /*return*/, {
                                id: 'main_workflows',
                                title: aiSection.title || 'Fluxos de Trabalho Principais',
                                description: aiSection.description || 'Como executar as principais tarefas na aplicação',
                                steps: aiSection.steps || [],
                                tips: aiSection.tips || ['Siga os fluxos na ordem sugerida'],
                                troubleshooting: aiSection.troubleshooting || ['Se algum passo falhar, retorne ao anterior'],
                                relatedSections: []
                            }];
                    case 3:
                        error_8 = _a.sent();
                        this.log("Erro na gera\u00E7\u00E3o da se\u00E7\u00E3o de workflows: ".concat(error_8), 'warn');
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ContentAgent.prototype.generateAppendices = function (analysis) {
        return __awaiter(this, void 0, void 0, function () {
            var troubleshooting, glossary, faqs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.generateTroubleshootingItems(analysis)];
                    case 1:
                        troubleshooting = _a.sent();
                        return [4 /*yield*/, this.generateGlossaryItems(analysis)];
                    case 2:
                        glossary = _a.sent();
                        return [4 /*yield*/, this.generateFAQItems(analysis)];
                    case 3:
                        faqs = _a.sent();
                        return [2 /*return*/, {
                                troubleshooting: troubleshooting,
                                glossary: glossary,
                                faqs: faqs
                            }];
                }
            });
        });
    };
    ContentAgent.prototype.generateTroubleshootingItems = function (analysis) {
        return __awaiter(this, void 0, void 0, function () {
            var commonIssues;
            return __generator(this, function (_a) {
                commonIssues = [
                    {
                        problem: 'Página não carrega corretamente',
                        symptoms: ['Página em branco', 'Elementos não aparecem', 'Erros no navegador'],
                        solutions: ['Atualize a página (F5)', 'Limpe o cache do navegador', 'Tente outro navegador', 'Verifique a conexão de internet'],
                        prevention: ['Use navegadores atualizados', 'Mantenha conexão estável']
                    },
                    {
                        problem: 'Não consigo fazer login',
                        symptoms: ['Credenciais rejeitadas', 'Página de login não responde', 'Erro de autenticação'],
                        solutions: ['Verifique usuário e senha', 'Desative Caps Lock', 'Use a opção "Esqueci senha"', 'Entre em contato com suporte'],
                        prevention: ['Anote suas credenciais em local seguro', 'Use senha forte']
                    },
                    {
                        problem: 'Funcionalidade não funciona como esperado',
                        symptoms: ['Botões não respondem', 'Formulários não enviam', 'Dados não salvam'],
                        solutions: ['Atualize a página', 'Tente novamente em alguns minutos', 'Use outro navegador', 'Verifique se todos os campos obrigatórios estão preenchidos'],
                        prevention: ['Preencha todos os campos necessários', 'Aguarde o carregamento completo da página']
                    }
                ];
                return [2 /*return*/, commonIssues];
            });
        });
    };
    ContentAgent.prototype.generateGlossaryItems = function (analysis) {
        return __awaiter(this, void 0, void 0, function () {
            var terms;
            return __generator(this, function (_a) {
                terms = [
                    {
                        term: 'Login',
                        definition: 'Processo de autenticação para acessar uma aplicação usando credenciais (usuário e senha)',
                        example: 'Fazer login no sistema para acessar suas informações pessoais'
                    },
                    {
                        term: 'Navegador',
                        definition: 'Software usado para acessar e navegar em sites na internet',
                        example: 'Chrome, Firefox, Safari e Edge são navegadores populares'
                    },
                    {
                        term: 'URL',
                        definition: 'Endereço web que identifica uma página específica na internet',
                        example: 'https://exemplo.com.br'
                    },
                    {
                        term: 'Cache',
                        definition: 'Armazenamento temporário de dados pelo navegador para acelerar o carregamento de páginas',
                        example: 'Limpar o cache pode resolver problemas de carregamento'
                    }
                ];
                return [2 /*return*/, terms];
            });
        });
    };
    ContentAgent.prototype.generateFAQItems = function (analysis) {
        return __awaiter(this, void 0, void 0, function () {
            var faqs;
            return __generator(this, function (_a) {
                faqs = [
                    {
                        question: 'Como posso acessar a aplicação?',
                        answer: 'Abra seu navegador web e digite o endereço da aplicação. Se necessário, faça login com suas credenciais.',
                        category: 'Acesso'
                    },
                    {
                        question: 'O que fazer se esquecer minha senha?',
                        answer: 'Procure pela opção "Esqueci minha senha" na tela de login. Siga as instruções enviadas para seu email.',
                        category: 'Acesso'
                    },
                    {
                        question: 'A aplicação funciona em dispositivos móveis?',
                        answer: 'A maioria das funcionalidades deve funcionar em dispositivos móveis através do navegador.',
                        category: 'Compatibilidade'
                    },
                    {
                        question: 'Posso usar qualquer navegador?',
                        answer: 'Recomendamos usar navegadores modernos como Chrome, Firefox, Safari ou Edge para melhor experiência.',
                        category: 'Compatibilidade'
                    }
                ];
                return [2 /*return*/, faqs];
            });
        });
    };
    ContentAgent.prototype.generateSummary = function (analysis) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        keyTakeaways: [
                            'Esta aplicação oferece diversas funcionalidades para melhorar sua produtividade',
                            'Siga os fluxos de trabalho sugeridos para obter melhores resultados',
                            'Consulte a seção de troubleshooting em caso de dificuldades',
                            'Mantenha suas credenciais seguras e atualize regularmente'
                        ],
                        nextSteps: [
                            'Explore cada seção do manual conforme sua necessidade',
                            'Pratique os fluxos de trabalho principais',
                            'Marque esta página para consultas futuras',
                            'Entre em contato com o suporte se precisar de ajuda adicional'
                        ],
                        supportContacts: [
                            'Email: suporte@aplicacao.com',
                            'Telefone: (11) 1234-5678',
                            'Chat online disponível durante horário comercial',
                            'Base de conhecimento: help.aplicacao.com'
                        ]
                    }];
            });
        });
    };
    ContentAgent.prototype.generateStepsFromElements = function (elements) {
        return elements.slice(0, 5).map(function (element, index) { return ({
            stepNumber: index + 1,
            action: element.usageInstructions || "Interagir com ".concat(element.description),
            description: element.description,
            expectedResult: element.userBenefit,
            notes: element.interactions ? ["Intera\u00E7\u00F5es dispon\u00EDveis: ".concat(element.interactions.join(', '))] : []
        }); });
    };
    ContentAgent.prototype.generateFallbackPageSection = function (pageAnalysis) {
        return {
            id: pageAnalysis.url.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
            title: pageAnalysis.title,
            description: "Como utilizar a p\u00E1gina ".concat(pageAnalysis.title),
            steps: this.generateStepsFromElements(pageAnalysis.elementAnalyses),
            tips: ['Leia cada instrução cuidadosamente', 'Teste cada funcionalidade'],
            troubleshooting: ['Se houver problemas, atualize a página', 'Verifique sua conexão de internet'],
            relatedSections: []
        };
    };
    ContentAgent.prototype.createSpecificUserGuide = function (analysis, context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementação para criação de guias específicos
                return [2 /*return*/, {
                        id: 'specific_guide',
                        title: 'Guia Específico',
                        description: 'Guia criado para necessidade específica',
                        steps: [],
                        tips: [],
                        troubleshooting: [],
                        relatedSections: []
                    }];
            });
        });
    };
    ContentAgent.prototype.optimizeContent = function (content, feedback) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementação para otimização de conteúdo baseado em feedback
                return [2 /*return*/, content];
            });
        });
    };
    ContentAgent.prototype.parseAIResponse = function (text) {
        try {
            var jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return JSON.parse(text);
        }
        catch (error) {
            this.log("Erro ao parsear resposta da IA: ".concat(error), 'warn');
            return {};
        }
    };
    ContentAgent.prototype.generateMarkdownReport = function (taskResult) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, report, content;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        timestamp = new Date().toISOString();
                        report = "# Relat\u00F3rio do ContentAgent\n\n**Task ID:** ".concat(taskResult.taskId, "\n**Timestamp:** ").concat(timestamp, "\n**Status:** ").concat(taskResult.success ? '✅ Sucesso' : '❌ Falha', "\n**Tempo de Processamento:** ").concat(taskResult.processingTime, "ms\n\n");
                        if (taskResult.success && taskResult.data) {
                            content = taskResult.data;
                            report += "## \uD83D\uDCDD Conte\u00FAdo User-Friendly Gerado\n\n### Metadados do Manual\n\n- **T\u00EDtulo:** ".concat(content.metadata.title, "\n- **Subt\u00EDtulo:** ").concat(content.metadata.subtitle, "\n- **Vers\u00E3o:** ").concat(content.metadata.version, "\n- **P\u00FAblico-Alvo:** ").concat(content.metadata.targetAudience, "\n- **Tempo de Leitura:** ").concat(content.metadata.estimatedReadTime, "\n\n### Estrutura do Conte\u00FAdo\n\n**Se\u00E7\u00F5es Principais:** ").concat(content.sections.length, "\n\n");
                            content.sections.forEach(function (section, index) {
                                report += "".concat(index + 1, ". **").concat(section.title, "**\n   - Passos: ").concat(section.steps.length, "\n   - Dicas: ").concat(section.tips.length, "\n   - Troubleshooting: ").concat(section.troubleshooting.length, "\n\n");
                            });
                            report += "\n### Recursos Adicionais\n\n- **Itens de Troubleshooting:** ".concat(content.appendices.troubleshooting.length, "\n- **Gloss\u00E1rio:** ").concat(content.appendices.glossary.length, "  \n- **FAQs:** ").concat(content.appendices.faqs.length, "\n\n### Introdu\u00E7\u00E3o\n\n").concat(content.introduction.overview, "\n\n### Requisitos\n\n");
                            content.introduction.requirements.forEach(function (req, index) {
                                report += "".concat(index + 1, ". ").concat(req, "\n");
                            });
                            report += "\n## Pr\u00F3ximas Etapas\n\n\u2705 Conte\u00FAdo user-friendly criado com sucesso\n\uD83D\uDD04 Dados encaminhados para GeneratorAgent  \n\uD83D\uDCC4 Aguardando gera\u00E7\u00E3o dos documentos finais (MD, PDF, HTML)\n\n";
                        }
                        else {
                            report += "## \u274C Erro na Gera\u00E7\u00E3o de Conte\u00FAdo\n\n**Erro:** ".concat(taskResult.error, "\n\n## A\u00E7\u00F5es Recomendadas\n\n- Verificar configura\u00E7\u00E3o da API Gemini\n- Verificar qualidade dos dados de an\u00E1lise\n- Revisar prompts de gera\u00E7\u00E3o de conte\u00FAdo\n\n");
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
    // 🔧 MÉTODOS DE PERSISTÊNCIA E CACHE
    ContentAgent.prototype.saveContentDraft = function (content, filename) {
        return __awaiter(this, void 0, void 0, function () {
            var outputDir, timestamp, draftFile, filePath, markdownContent;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        outputDir = path.join(process.cwd(), 'output', 'final_documents');
                        return [4 /*yield*/, fs.mkdir(outputDir, { recursive: true })];
                    case 1:
                        _a.sent();
                        timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                        draftFile = filename || "content-draft-".concat(timestamp, ".md");
                        filePath = path.join(outputDir, draftFile);
                        markdownContent = this.generateContentMarkdown(content);
                        return [4 /*yield*/, fs.writeFile(filePath, markdownContent, 'utf-8')];
                    case 2:
                        _a.sent();
                        this.log("\uD83D\uDCC4 Rascunho de conte\u00FAdo salvo em: ".concat(draftFile));
                        return [2 /*return*/, filePath];
                }
            });
        });
    };
    ContentAgent.prototype.generateContentMarkdown = function (content) {
        return "# ".concat(content.metadata.title, "\n").concat(content.metadata.subtitle, "\n\n**Vers\u00E3o**: ").concat(content.metadata.version, "\n**Data de Cria\u00E7\u00E3o**: ").concat(content.metadata.dateCreated, "\n**P\u00FAblico-Alvo**: ").concat(content.metadata.targetAudience, "\n**Tempo de Leitura**: ").concat(content.metadata.estimatedReadTime, "\n\n---\n\n## Introdu\u00E7\u00E3o\n").concat(content.introduction.overview, "\n\n### Requisitos\n").concat(content.introduction.requirements.map(function (req) { return "- ".concat(req); }).join('\n'), "\n\n---\n*Manual gerado automaticamente pelo ContentAgent v").concat(this.config.version, "*\n");
    };
    ContentAgent.prototype.finalize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.currentContent) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.saveContentDraft(this.currentContent, 'content-final-draft.md')];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        this.log('ContentAgent finalizado');
                        return [2 /*return*/];
                }
            });
        });
    };
    ContentAgent.prototype.cleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.currentContent = null;
                this.log('ContentAgent cleanup finalizado');
                return [2 /*return*/];
            });
        });
    };
    return ContentAgent;
}(AgnoSCore_js_1.BaseAgent));
exports.ContentAgent = ContentAgent;
