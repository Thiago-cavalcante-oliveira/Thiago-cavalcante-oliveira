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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.LoginAgent = void 0;
var AgnoSCore_js_1 = require("../core/AgnoSCore.js");
var MinIOService_js_1 = require("../services/MinIOService.js");
var LoginAgent = /** @class */ (function (_super) {
    __extends(LoginAgent, _super);
    function LoginAgent() {
        var _this = this;
        var config = {
            name: 'LoginAgent',
            version: '1.0.0',
            description: 'Agente especializado em autenticação e gerenciamento de sessões',
            capabilities: [
                { name: 'basic_auth', description: 'Autenticação básica com usuário e senha', version: '1.0.0' },
                { name: 'oauth_auth', description: 'Autenticação OAuth 2.0', version: '1.0.0' },
                { name: 'session_management', description: 'Gerenciamento de sessões', version: '1.0.0' },
                { name: 'custom_auth', description: 'Fluxos de autenticação customizados', version: '1.0.0' }
            ]
        };
        _this = _super.call(this, config) || this;
        _this.page = null;
        _this.sessionData = null;
        _this.minioService = new MinIOService_js_1.MinIOService();
        return _this;
    }
    LoginAgent.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.minioService.initialize()];
                    case 1:
                        _a.sent();
                        this.log('LoginAgent inicializado e pronto para autenticação');
                        return [2 /*return*/];
                }
            });
        });
    };
    LoginAgent.prototype.processTask = function (task) {
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
                            case 'authenticate': return [3 /*break*/, 2];
                            case 'check_session': return [3 /*break*/, 4];
                            case 'logout': return [3 /*break*/, 6];
                        }
                        return [3 /*break*/, 8];
                    case 2: return [4 /*yield*/, this.handleAuthentication(task)];
                    case 3: return [2 /*return*/, _b.sent()];
                    case 4: return [4 /*yield*/, this.handleSessionCheck(task)];
                    case 5: return [2 /*return*/, _b.sent()];
                    case 6: return [4 /*yield*/, this.handleLogout(task)];
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
    LoginAgent.prototype.handleAuthentication = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, credentials, page, loginScreenshot, authType, authResult, _b, _c, postLoginScreenshot, error_2;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _a = task.data, credentials = _a.credentials, page = _a.page;
                        this.page = page;
                        if (!this.page) {
                            throw new Error('Página não fornecida para autenticação');
                        }
                        this.log("Iniciando autentica\u00E7\u00E3o para: ".concat(credentials.loginUrl || 'página atual'));
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 19, , 20]);
                        if (!credentials.loginUrl) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.page.goto(credentials.loginUrl, { waitUntil: 'domcontentloaded' })];
                    case 2:
                        _d.sent();
                        return [4 /*yield*/, this.page.waitForTimeout(2000)];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4: return [4 /*yield*/, this.captureLoginPage()];
                    case 5:
                        loginScreenshot = _d.sent();
                        return [4 /*yield*/, this.detectAuthenticationType()];
                    case 6:
                        authType = _d.sent();
                        this.log("Tipo de autentica\u00E7\u00E3o detectado: ".concat(authType));
                        authResult = false;
                        _b = authType;
                        switch (_b) {
                            case 'basic': return [3 /*break*/, 7];
                            case 'oauth': return [3 /*break*/, 9];
                            case 'custom': return [3 /*break*/, 11];
                        }
                        return [3 /*break*/, 13];
                    case 7: return [4 /*yield*/, this.performBasicAuth(credentials)];
                    case 8:
                        authResult = _d.sent();
                        return [3 /*break*/, 14];
                    case 9: return [4 /*yield*/, this.performOAuthAuth(credentials)];
                    case 10:
                        authResult = _d.sent();
                        return [3 /*break*/, 14];
                    case 11: return [4 /*yield*/, this.performCustomAuth(credentials)];
                    case 12:
                        authResult = _d.sent();
                        return [3 /*break*/, 14];
                    case 13: throw new Error("Tipo de autentica\u00E7\u00E3o n\u00E3o suportado: ".concat(authType));
                    case 14:
                        if (!authResult) return [3 /*break*/, 17];
                        // Capturar dados da sessão
                        _c = this;
                        return [4 /*yield*/, this.captureSessionData()];
                    case 15:
                        // Capturar dados da sessão
                        _c.sessionData = _d.sent();
                        return [4 /*yield*/, this.capturePostLoginPage()];
                    case 16:
                        postLoginScreenshot = _d.sent();
                        // Notificar próximo agente (CrawlerAgent)
                        this.sendTask('CrawlerAgent', 'start_authenticated_crawl', {
                            sessionData: this.sessionData,
                            loginScreenshot: loginScreenshot,
                            postLoginScreenshot: postLoginScreenshot,
                            authType: authType,
                            credentials: {
                                username: credentials.username,
                                loginUrl: credentials.loginUrl
                            }
                        }, 'high');
                        return [2 /*return*/, {
                                id: task.id,
                                taskId: task.id,
                                success: true,
                                data: {
                                    authenticated: true,
                                    authType: authType,
                                    sessionId: this.sessionData.sessionId,
                                    userContext: this.sessionData.userContext,
                                    screenshots: [loginScreenshot, postLoginScreenshot]
                                },
                                timestamp: new Date(),
                                processingTime: 0 // será calculado pelo BaseAgent
                            }];
                    case 17: return [2 /*return*/, {
                            id: task.id,
                            taskId: task.id,
                            success: false,
                            error: 'Falha na autenticação - verifique as credenciais',
                            timestamp: new Date(),
                            processingTime: 0
                        }];
                    case 18: return [3 /*break*/, 20];
                    case 19:
                        error_2 = _d.sent();
                        this.log("Erro na autentica\u00E7\u00E3o: ".concat(error_2), 'error');
                        throw error_2;
                    case 20: return [2 /*return*/];
                }
            });
        });
    };
    LoginAgent.prototype.handleSessionCheck = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var page, isValid, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        page = task.data.page;
                        this.page = page;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.validateSession()];
                    case 2:
                        isValid = _a.sent();
                        return [2 /*return*/, {
                                id: task.id,
                                taskId: task.id,
                                success: true,
                                data: { sessionValid: isValid },
                                timestamp: new Date(),
                                processingTime: 0
                            }];
                    case 3:
                        error_3 = _a.sent();
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    LoginAgent.prototype.handleLogout = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var page, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        page = task.data.page;
                        this.page = page;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.performLogout()];
                    case 2:
                        _a.sent();
                        this.sessionData = null;
                        return [2 /*return*/, {
                                id: task.id,
                                taskId: task.id,
                                success: true,
                                data: { loggedOut: true },
                                timestamp: new Date(),
                                processingTime: 0
                            }];
                    case 3:
                        error_4 = _a.sent();
                        throw error_4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    LoginAgent.prototype.detectAuthenticationType = function () {
        return __awaiter(this, void 0, void 0, function () {
            var authIndicators;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.page)
                            throw new Error('Página não disponível');
                        return [4 /*yield*/, this.page.evaluate(function () {
                                return {
                                    hasBasicForm: !!(document.querySelector('input[type="password"]') &&
                                        document.querySelector('input[type="email"], input[type="text"], input[name*="user"], input[name*="login"]')),
                                    hasOAuth: !!document.querySelector('[class*="oauth"], [href*="oauth"], [class*="google"], [class*="facebook"], [class*="microsoft"]'),
                                    hasCustomForm: !!document.querySelector('form')
                                };
                            })];
                    case 1:
                        authIndicators = _a.sent();
                        if (authIndicators.hasBasicForm)
                            return [2 /*return*/, 'basic'];
                        if (authIndicators.hasOAuth)
                            return [2 /*return*/, 'oauth'];
                        return [2 /*return*/, 'custom'];
                }
            });
        });
    };
    LoginAgent.prototype.performBasicAuth = function (credentials) {
        return __awaiter(this, void 0, void 0, function () {
            var usernameField, passwordField, submitButton, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.page)
                            throw new Error('Página não disponível');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 15, , 16]);
                        this.log('Executando autenticação básica');
                        return [4 /*yield*/, this.page.$('input[type="email"], input[type="text"], input[name*="user"], input[name*="login"], input[placeholder*="email"], input[placeholder*="usuário"]')];
                    case 2:
                        usernameField = _a.sent();
                        return [4 /*yield*/, this.page.$('input[type="password"]')];
                    case 3:
                        passwordField = _a.sent();
                        if (!usernameField || !passwordField) {
                            throw new Error('Campos de login não encontrados');
                        }
                        // Preencher credenciais
                        return [4 /*yield*/, usernameField.fill(credentials.username)];
                    case 4:
                        // Preencher credenciais
                        _a.sent();
                        return [4 /*yield*/, this.page.waitForTimeout(500)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, passwordField.fill(credentials.password)];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, this.page.waitForTimeout(500)];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, this.page.$('button[type="submit"], input[type="submit"], button[class*="login"], button[class*="submit"], button[class*="signin"]')];
                    case 8:
                        submitButton = _a.sent();
                        if (!submitButton) return [3 /*break*/, 10];
                        return [4 /*yield*/, submitButton.click()];
                    case 9:
                        _a.sent();
                        return [3 /*break*/, 12];
                    case 10: 
                    // Fallback: pressionar Enter
                    return [4 /*yield*/, passwordField.press('Enter')];
                    case 11:
                        // Fallback: pressionar Enter
                        _a.sent();
                        _a.label = 12;
                    case 12: 
                    // Aguardar resposta
                    return [4 /*yield*/, this.page.waitForTimeout(4000)];
                    case 13:
                        // Aguardar resposta
                        _a.sent();
                        return [4 /*yield*/, this.verifyAuthenticationSuccess()];
                    case 14: 
                    // Verificar sucesso
                    return [2 /*return*/, _a.sent()];
                    case 15:
                        error_5 = _a.sent();
                        this.log("Erro na autentica\u00E7\u00E3o b\u00E1sica: ".concat(error_5), 'error');
                        return [2 /*return*/, false];
                    case 16: return [2 /*return*/];
                }
            });
        });
    };
    LoginAgent.prototype.performOAuthAuth = function (credentials) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.log('OAuth ainda não implementado', 'warn');
                return [2 /*return*/, false];
            });
        });
    };
    LoginAgent.prototype.performCustomAuth = function (credentials) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, step, error_6;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!credentials.customSteps) {
                            this.log('Steps customizados não fornecidos', 'error');
                            return [2 /*return*/, false];
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, , 8]);
                        this.log('Executando autenticação customizada');
                        _i = 0, _a = credentials.customSteps;
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        step = _a[_i];
                        return [4 /*yield*/, this.executeCustomStep(step)];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [4 /*yield*/, this.verifyAuthenticationSuccess()];
                    case 6: return [2 /*return*/, _b.sent()];
                    case 7:
                        error_6 = _b.sent();
                        this.log("Erro na autentica\u00E7\u00E3o customizada: ".concat(error_6), 'error');
                        return [2 /*return*/, false];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    LoginAgent.prototype.executeCustomStep = function (step) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.page)
                            throw new Error('Página não disponível');
                        _a = step.type;
                        switch (_a) {
                            case 'fill': return [3 /*break*/, 1];
                            case 'click': return [3 /*break*/, 3];
                            case 'wait': return [3 /*break*/, 5];
                            case 'waitForSelector': return [3 /*break*/, 7];
                        }
                        return [3 /*break*/, 9];
                    case 1: return [4 /*yield*/, this.page.fill(step.selector, step.value || '')];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 9];
                    case 3: return [4 /*yield*/, this.page.click(step.selector)];
                    case 4:
                        _b.sent();
                        return [3 /*break*/, 9];
                    case 5: return [4 /*yield*/, this.page.waitForTimeout(step.timeout || 1000)];
                    case 6:
                        _b.sent();
                        return [3 /*break*/, 9];
                    case 7: return [4 /*yield*/, this.page.waitForSelector(step.selector, { timeout: step.timeout || 10000 })];
                    case 8:
                        _b.sent();
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    LoginAgent.prototype.verifyAuthenticationSuccess = function () {
        return __awaiter(this, void 0, void 0, function () {
            var authResult, successCount, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.page)
                            return [2 /*return*/, false];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.page.evaluate(function () {
                                // Verificar se não há mais campos de senha (indicativo de sucesso)
                                var passwordFields = document.querySelectorAll('input[type="password"]');
                                // Verificar indicadores positivos de sucesso
                                var successIndicators = document.querySelectorAll('[class*="dashboard"], [class*="profile"], [class*="logout"], [class*="welcome"], [class*="menu"], nav, header');
                                // Verificar se URL mudou (não contém mais "login")
                                var currentUrl = window.location.href.toLowerCase();
                                var hasLoginInUrl = currentUrl.includes('login') || currentUrl.includes('signin') || currentUrl.includes('auth');
                                // Verificar se há mensagens de erro
                                var errorMessages = document.querySelectorAll('[class*="error"], [class*="invalid"], [class*="fail"], .alert-danger');
                                return {
                                    noPasswordFields: passwordFields.length === 0,
                                    hasSuccessIndicators: successIndicators.length > 0,
                                    urlChanged: !hasLoginInUrl,
                                    noErrors: errorMessages.length === 0,
                                    currentUrl: currentUrl
                                };
                            })];
                    case 2:
                        authResult = _a.sent();
                        this.log("Verifica\u00E7\u00E3o de autentica\u00E7\u00E3o: ".concat(JSON.stringify(authResult)));
                        successCount = [
                            authResult.noPasswordFields,
                            authResult.hasSuccessIndicators,
                            authResult.urlChanged,
                            authResult.noErrors
                        ].filter(Boolean).length;
                        return [2 /*return*/, successCount >= 2];
                    case 3:
                        error_7 = _a.sent();
                        this.log("Erro na verifica\u00E7\u00E3o: ".concat(error_7), 'error');
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    LoginAgent.prototype.captureSessionData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var sessionData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.page)
                            return [2 /*return*/, null];
                        return [4 /*yield*/, this.page.evaluate(function () {
                                var _a, _b, _c, _d, _e;
                                var userInfo = {
                                    name: (_b = (_a = document.querySelector('[class*="user-name"], [class*="username"], [class*="display-name"]')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim(),
                                    email: (_d = (_c = document.querySelector('[class*="user-email"], [class*="email"]')) === null || _c === void 0 ? void 0 : _c.textContent) === null || _d === void 0 ? void 0 : _d.trim(),
                                    avatar: (_e = document.querySelector('[class*="avatar"], [class*="profile-img"]')) === null || _e === void 0 ? void 0 : _e.getAttribute('src')
                                };
                                return {
                                    cookies: document.cookie,
                                    localStorage: JSON.stringify(localStorage),
                                    sessionStorage: JSON.stringify(sessionStorage),
                                    url: window.location.href,
                                    userInfo: userInfo,
                                    timestamp: new Date().toISOString()
                                };
                            })];
                    case 1:
                        sessionData = _a.sent();
                        return [2 /*return*/, __assign(__assign({}, sessionData), { sessionId: "session_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9)), userContext: sessionData.userInfo })];
                }
            });
        });
    };
    LoginAgent.prototype.captureLoginPage = function () {
        return __awaiter(this, void 0, void 0, function () {
            var filename, localPath, minioUrl;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.page)
                            throw new Error('Página não disponível');
                        filename = "login_page_".concat(Date.now(), ".png");
                        localPath = "output/screenshots/".concat(filename);
                        return [4 /*yield*/, this.page.screenshot({
                                path: localPath,
                                fullPage: true,
                                type: 'png'
                            })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.minioService.uploadScreenshot(localPath, filename)];
                    case 2:
                        minioUrl = _a.sent();
                        this.log("Screenshot da p\u00E1gina de login capturado: ".concat(filename));
                        return [2 /*return*/, minioUrl || localPath];
                }
            });
        });
    };
    LoginAgent.prototype.capturePostLoginPage = function () {
        return __awaiter(this, void 0, void 0, function () {
            var filename, localPath, minioUrl;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.page)
                            throw new Error('Página não disponível');
                        filename = "post_login_page_".concat(Date.now(), ".png");
                        localPath = "output/screenshots/".concat(filename);
                        return [4 /*yield*/, this.page.screenshot({
                                path: localPath,
                                fullPage: true,
                                type: 'png'
                            })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.minioService.uploadScreenshot(localPath, filename)];
                    case 2:
                        minioUrl = _a.sent();
                        this.log("Screenshot p\u00F3s-login capturado: ".concat(filename));
                        return [2 /*return*/, minioUrl || localPath];
                }
            });
        });
    };
    LoginAgent.prototype.validateSession = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.verifyAuthenticationSuccess()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    LoginAgent.prototype.performLogout = function () {
        return __awaiter(this, void 0, void 0, function () {
            var logoutButton, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.page)
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, this.page.$('a[href*="logout"], button[class*="logout"], a[class*="signout"], button[class*="sign-out"]')];
                    case 2:
                        logoutButton = _a.sent();
                        if (!logoutButton) return [3 /*break*/, 5];
                        return [4 /*yield*/, logoutButton.click()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.page.waitForTimeout(2000)];
                    case 4:
                        _a.sent();
                        this.log('Logout realizado com sucesso');
                        return [3 /*break*/, 6];
                    case 5:
                        this.log('Botão de logout não encontrado', 'warn');
                        _a.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        error_8 = _a.sent();
                        this.log("Erro no logout: ".concat(error_8), 'error');
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    LoginAgent.prototype.generateMarkdownReport = function (taskResult) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, report;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        timestamp = new Date().toISOString();
                        report = "# Relat\u00F3rio do LoginAgent\n\n**Task ID:** ".concat(taskResult.taskId, "\n**Timestamp:** ").concat(timestamp, "\n**Status:** ").concat(taskResult.success ? '✅ Sucesso' : '❌ Falha', "\n**Tempo de Processamento:** ").concat(taskResult.processingTime, "ms\n\n");
                        if (taskResult.success && taskResult.data) {
                            report += "## Resultado da Autentica\u00E7\u00E3o\n\n- **Autenticado:** ".concat(taskResult.data.authenticated ? 'Sim' : 'Não', "\n- **Tipo de Autentica\u00E7\u00E3o:** ").concat(taskResult.data.authType, "\n- **Session ID:** ").concat(taskResult.data.sessionId, "\n- **Usu\u00E1rio:** ").concat(((_a = taskResult.data.userContext) === null || _a === void 0 ? void 0 : _a.name) || 'N/A', "\n- **Email:** ").concat(((_b = taskResult.data.userContext) === null || _b === void 0 ? void 0 : _b.email) || 'N/A', "\n\n## Screenshots Capturados\n\n");
                            if (taskResult.data.screenshots) {
                                taskResult.data.screenshots.forEach(function (screenshot, index) {
                                    report += "".concat(index + 1, ". ![Screenshot ").concat(index + 1, "](").concat(screenshot, ")\n");
                                });
                            }
                            report += "\n## Pr\u00F3ximas Etapas\n\n\u2705 Sess\u00E3o estabelecida com sucesso\n\uD83D\uDD04 Dados encaminhados para CrawlerAgent\n\uD83D\uDCCB Aguardando in\u00EDcio do processo de crawling\n\n";
                        }
                        else {
                            report += "## Erro na Autentica\u00E7\u00E3o\n\n**Erro:** ".concat(taskResult.error, "\n\n## A\u00E7\u00F5es Recomendadas\n\n- Verificar credenciais fornecidas\n- Verificar se a URL de login est\u00E1 correta\n- Verificar se o site est\u00E1 acess\u00EDvel\n- Tentar novamente com credenciais v\u00E1lidas\n\n");
                        }
                        // Salvar relatório no MinIO
                        return [4 /*yield*/, this.minioService.uploadReportMarkdown(report, this.config.name, taskResult.taskId)];
                    case 1:
                        // Salvar relatório no MinIO
                        _c.sent();
                        return [2 /*return*/, report];
                }
            });
        });
    };
    LoginAgent.prototype.setPage = function (page) {
        this.page = page;
    };
    LoginAgent.prototype.cleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.page = null;
                this.sessionData = null;
                this.log('LoginAgent finalizado e recursos liberados');
                return [2 /*return*/];
            });
        });
    };
    return LoginAgent;
}(AgnoSCore_js_1.BaseAgent));
exports.LoginAgent = LoginAgent;
