"use strict";
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
exports.GeminiKeyManager = void 0;
var generative_ai_1 = require("@google/generative-ai");
var fs = require("fs/promises");
var path = require("path");
var GeminiKeyManager = /** @class */ (function () {
    function GeminiKeyManager() {
        this.genAI = new Map();
        this.DAILY_LIMIT_FREE_TIER = 50;
        this.RATE_LIMIT_WINDOW = 60000; // 1 minuto
        this.statusFile = path.join(process.cwd(), 'gemini-keys-status.json');
        this.keyManager = {
            keys: [],
            currentKeyIndex: 0,
            rotationStrategy: 'health-based'
        };
        this.loadApiKeys();
    }
    GeminiKeyManager.prototype.loadApiKeys = function () {
        var _this = this;
        var keys = [];
        // Carregar todas as chaves configuradas no .env
        for (var i = 1; i <= 10; i++) {
            var key = process.env["GEMINI_API_KEY_".concat(i)];
            if (key && key.trim() !== '') {
                keys.push(key.trim());
            }
        }
        // Compatibilidade com chave única (versão anterior)
        var singleKey = process.env.GEMINI_API_KEY;
        if (singleKey && singleKey.trim() !== '' && !keys.includes(singleKey.trim())) {
            keys.push(singleKey.trim());
        }
        if (keys.length === 0) {
            throw new Error('Nenhuma chave API do Gemini configurada');
        }
        // Inicializar status das chaves
        this.keyManager.keys = keys.map(function (key) { return ({
            key: key,
            isActive: true,
            lastUsed: new Date(0),
            requestCount: 0,
            quotaExhausted: false,
            dailyLimit: _this.DAILY_LIMIT_FREE_TIER,
            resetTime: _this.getNextResetTime()
        }); });
        // Inicializar clientes GoogleGenerativeAI
        keys.forEach(function (key) {
            _this.genAI.set(key, new generative_ai_1.GoogleGenerativeAI(key));
        });
        console.log("\uD83D\uDD11 GeminiKeyManager: ".concat(keys.length, " chaves API configuradas"));
    };
    GeminiKeyManager.prototype.getNextResetTime = function () {
        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow;
    };
    GeminiKeyManager.prototype.loadStatus = function () {
        return __awaiter(this, void 0, void 0, function () {
            var data, saved, currentKeys_1, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fs.readFile(this.statusFile, 'utf-8')];
                    case 1:
                        data = _a.sent();
                        saved = JSON.parse(data);
                        currentKeys_1 = this.keyManager.keys.map(function (k) { return k.key; });
                        saved.keys = saved.keys.filter(function (k) { return currentKeys_1.includes(k.key); });
                        // Resetar contadores diários se necessário
                        saved.keys.forEach(function (key) {
                            if (key.resetTime && new Date() > new Date(key.resetTime)) {
                                key.requestCount = 0;
                                key.quotaExhausted = false;
                                key.resetTime = _this.getNextResetTime();
                                key.isActive = true;
                            }
                        });
                        this.keyManager = __assign(__assign({}, this.keyManager), saved);
                        console.log('🔄 Status das chaves API carregado do cache');
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.log('📝 Criando novo arquivo de status das chaves API');
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    GeminiKeyManager.prototype.saveStatus = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fs.writeFile(this.statusFile, JSON.stringify(this.keyManager, null, 2), 'utf-8')];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        console.error('❌ Erro ao salvar status das chaves:', error_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    GeminiKeyManager.prototype.getActiveModel = function () {
        return __awaiter(this, void 0, void 0, function () {
            var activeKey, genAI;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getNextAvailableKey()];
                    case 1:
                        activeKey = _a.sent();
                        if (!activeKey) {
                            throw new Error('Nenhuma chave API disponível no momento');
                        }
                        genAI = this.genAI.get(activeKey.key);
                        if (!genAI) {
                            throw new Error('Cliente GoogleGenerativeAI não encontrado');
                        }
                        return [2 /*return*/, {
                                model: genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }),
                                keyUsed: activeKey.key
                            }];
                }
            });
        });
    };
    GeminiKeyManager.prototype.getNextAvailableKey = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Resetar contadores diários se necessário
                this.resetDailyCountersIfNeeded();
                switch (this.keyManager.rotationStrategy) {
                    case 'health-based':
                        return [2 /*return*/, this.getHealthBasedKey()];
                    case 'least-used':
                        return [2 /*return*/, this.getLeastUsedKey()];
                    case 'round-robin':
                    default:
                        return [2 /*return*/, this.getRoundRobinKey()];
                }
                return [2 /*return*/];
            });
        });
    };
    GeminiKeyManager.prototype.resetDailyCountersIfNeeded = function () {
        var _this = this;
        var now = new Date();
        this.keyManager.keys.forEach(function (key) {
            if (key.resetTime && now > new Date(key.resetTime)) {
                key.requestCount = 0;
                key.quotaExhausted = false;
                key.resetTime = _this.getNextResetTime();
                key.isActive = true;
                console.log("\uD83D\uDD04 Chave resetada: ".concat(key.key.substring(0, 10), "..."));
            }
        });
    };
    GeminiKeyManager.prototype.getHealthBasedKey = function () {
        // Preferir chaves ativas com menor uso
        var availableKeys = this.keyManager.keys
            .filter(function (key) { return key.isActive && !key.quotaExhausted && key.requestCount < key.dailyLimit; })
            .sort(function (a, b) { return a.requestCount - b.requestCount; });
        return availableKeys.length > 0 ? availableKeys[0] : null;
    };
    GeminiKeyManager.prototype.getLeastUsedKey = function () {
        var availableKeys = this.keyManager.keys
            .filter(function (key) { return key.isActive && !key.quotaExhausted && key.requestCount < key.dailyLimit; })
            .sort(function (a, b) { return a.requestCount - b.requestCount; });
        return availableKeys.length > 0 ? availableKeys[0] : null;
    };
    GeminiKeyManager.prototype.getRoundRobinKey = function () {
        var maxAttempts = this.keyManager.keys.length;
        var attempts = 0;
        while (attempts < maxAttempts) {
            var key = this.keyManager.keys[this.keyManager.currentKeyIndex];
            this.keyManager.currentKeyIndex = (this.keyManager.currentKeyIndex + 1) % this.keyManager.keys.length;
            if (key.isActive && !key.quotaExhausted && key.requestCount < key.dailyLimit) {
                return key;
            }
            attempts++;
        }
        return null;
    };
    GeminiKeyManager.prototype.handleApiCall = function (apiCall) {
        return __awaiter(this, void 0, void 0, function () {
            var lastError, maxRetries, _loop_1, this_1, retry, state_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        lastError = null;
                        maxRetries = 3;
                        _loop_1 = function (retry) {
                            var activeModel, model, keyUsed_1, keyStatus, result, error_3, availableKeys;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _b.trys.push([0, 4, , 7]);
                                        return [4 /*yield*/, this_1.getActiveModel()];
                                    case 1:
                                        activeModel = _b.sent();
                                        if (!activeModel) {
                                            throw new Error('Nenhum modelo disponível');
                                        }
                                        model = activeModel.model, keyUsed_1 = activeModel.keyUsed;
                                        keyStatus = this_1.keyManager.keys.find(function (k) { return k.key === keyUsed_1; });
                                        if (!keyStatus) {
                                            throw new Error('Status da chave não encontrado');
                                        }
                                        return [4 /*yield*/, apiCall(model)];
                                    case 2:
                                        result = _b.sent();
                                        // Atualizar contadores de sucesso
                                        keyStatus.requestCount++;
                                        keyStatus.lastUsed = new Date();
                                        keyStatus.lastError = undefined;
                                        return [4 /*yield*/, this_1.saveStatus()];
                                    case 3:
                                        _b.sent();
                                        console.log("\u2705 API call successful with key: ".concat(keyUsed_1.substring(0, 10), "... (").concat(keyStatus.requestCount, "/").concat(keyStatus.dailyLimit, ")"));
                                        return [2 /*return*/, { value: result }];
                                    case 4:
                                        error_3 = _b.sent();
                                        lastError = error_3;
                                        return [4 /*yield*/, this_1.handleApiError(error_3)];
                                    case 5:
                                        _b.sent();
                                        availableKeys = this_1.keyManager.keys.filter(function (k) {
                                            return k.isActive && !k.quotaExhausted && k.requestCount < k.dailyLimit;
                                        });
                                        if (availableKeys.length === 0) {
                                            return [2 /*return*/, "break"];
                                        }
                                        // Aguardar antes da próxima tentativa
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000 * (retry + 1)); })];
                                    case 6:
                                        // Aguardar antes da próxima tentativa
                                        _b.sent();
                                        return [3 /*break*/, 7];
                                    case 7: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        retry = 0;
                        _a.label = 1;
                    case 1:
                        if (!(retry < maxRetries)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_1(retry)];
                    case 2:
                        state_1 = _a.sent();
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                        if (state_1 === "break")
                            return [3 /*break*/, 4];
                        _a.label = 3;
                    case 3:
                        retry++;
                        return [3 /*break*/, 1];
                    case 4: throw lastError || new Error('Todas as tentativas de API falharam');
                }
            });
        });
    };
    GeminiKeyManager.prototype.handleApiError = function (error) {
        return __awaiter(this, void 0, void 0, function () {
            var errorMsg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        errorMsg = error.message.toLowerCase();
                        if (!(errorMsg.includes('quota') || errorMsg.includes('exceeded') || errorMsg.includes('429'))) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.markKeyAsExhausted(error)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 2:
                        if (!(errorMsg.includes('403') || errorMsg.includes('invalid'))) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.markKeyAsInactive(error)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        if (errorMsg.includes('503') || errorMsg.includes('overloaded')) {
                            // Erro temporário, não marcar chave como inativa
                            console.log('⚠️ Serviço temporariamente sobrecarregado, tentando próxima chave');
                        }
                        _a.label = 5;
                    case 5: return [4 /*yield*/, this.saveStatus()];
                    case 6:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    GeminiKeyManager.prototype.markKeyAsExhausted = function (error) {
        return __awaiter(this, void 0, void 0, function () {
            var recentKeys;
            return __generator(this, function (_a) {
                recentKeys = this.keyManager.keys
                    .sort(function (a, b) { return b.lastUsed.getTime() - a.lastUsed.getTime(); });
                if (recentKeys.length > 0) {
                    recentKeys[0].quotaExhausted = true;
                    recentKeys[0].lastError = error.message;
                    console.log("\u26D4 Quota esgotada: ".concat(recentKeys[0].key.substring(0, 10), "..."));
                }
                return [2 /*return*/];
            });
        });
    };
    GeminiKeyManager.prototype.markKeyAsInactive = function (error) {
        return __awaiter(this, void 0, void 0, function () {
            var recentKeys;
            return __generator(this, function (_a) {
                recentKeys = this.keyManager.keys
                    .sort(function (a, b) { return b.lastUsed.getTime() - a.lastUsed.getTime(); });
                if (recentKeys.length > 0) {
                    recentKeys[0].isActive = false;
                    recentKeys[0].lastError = error.message;
                    console.log("\u274C Chave inativa: ".concat(recentKeys[0].key.substring(0, 10), "..."));
                }
                return [2 /*return*/];
            });
        });
    };
    GeminiKeyManager.prototype.getStatus = function () {
        var activeKeys = this.keyManager.keys.filter(function (k) { return k.isActive; }).length;
        var availableKeys = this.keyManager.keys.filter(function (k) {
            return k.isActive && !k.quotaExhausted && k.requestCount < k.dailyLimit;
        }).length;
        return {
            totalKeys: this.keyManager.keys.length,
            activeKeys: activeKeys,
            availableKeys: availableKeys,
            keyStatuses: this.keyManager.keys.map(function (k) { return (__assign(__assign({}, k), { key: k.key.substring(0, 10) + '...' // Mascarar chave para logs
             })); })
        };
    };
    GeminiKeyManager.prototype.resetAllKeys = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.keyManager.keys.forEach(function (key) {
                            key.requestCount = 0;
                            key.quotaExhausted = false;
                            key.isActive = true;
                            key.resetTime = _this.getNextResetTime();
                            key.lastError = undefined;
                        });
                        return [4 /*yield*/, this.saveStatus()];
                    case 1:
                        _a.sent();
                        console.log('🔄 Todas as chaves foram resetadas');
                        return [2 /*return*/];
                }
            });
        });
    };
    return GeminiKeyManager;
}());
exports.GeminiKeyManager = GeminiKeyManager;
