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
require("dotenv/config");
var AgnoSCore_js_1 = require("./core/AgnoSCore.js");
var OrchestratorAgent_js_1 = require("./agents/OrchestratorAgent.js");
var LoginAgent_js_1 = require("./agents/LoginAgent.js");
var CrawlerAgent_js_1 = require("./agents/CrawlerAgent.js");
var AnalysisAgent_js_1 = require("./agents/AnalysisAgent.js");
var ContentAgent_js_1 = require("./agents/ContentAgent.js");
var GeneratorAgent_js_1 = require("./agents/GeneratorAgent.js");
var ScreenshotAgent_js_1 = require("./agents/ScreenshotAgent.js");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var core_1, orchestratorAgent, loginAgent, crawlerAgent, analysisAgent, contentAgent, generatorAgent, screenshotAgent, error_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🚀 Iniciando Sistema Multi-Agente para Geração de Manuais...');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    core_1 = new AgnoSCore_js_1.AgnoSCore();
                    orchestratorAgent = new OrchestratorAgent_js_1.OrchestratorAgent();
                    loginAgent = new LoginAgent_js_1.LoginAgent();
                    crawlerAgent = new CrawlerAgent_js_1.CrawlerAgent();
                    analysisAgent = new AnalysisAgent_js_1.AnalysisAgent();
                    contentAgent = new ContentAgent_js_1.ContentAgent();
                    generatorAgent = new GeneratorAgent_js_1.GeneratorAgent();
                    screenshotAgent = new ScreenshotAgent_js_1.ScreenshotAgent();
                    // Registrar todos os agentes
                    core_1.registerAgent(orchestratorAgent);
                    core_1.registerAgent(loginAgent);
                    core_1.registerAgent(crawlerAgent);
                    core_1.registerAgent(analysisAgent);
                    core_1.registerAgent(contentAgent);
                    core_1.registerAgent(generatorAgent);
                    core_1.registerAgent(screenshotAgent);
                    // Iniciar o sistema
                    return [4 /*yield*/, core_1.start()];
                case 2:
                    // Iniciar o sistema
                    _a.sent();
                    console.log('✅ Sistema Multi-Agente iniciado com sucesso!');
                    console.log('📊 Status do sistema:', core_1.getSystemStatus());
                    // Aguardar por interrupção do usuário
                    process.on('SIGINT', function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    console.log('\n🛑 Recebido sinal de interrupção, finalizando sistema...');
                                    return [4 /*yield*/, core_1.stop()];
                                case 1:
                                    _a.sent();
                                    process.exit(0);
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    // Manter o processo ativo
                    console.log('🔄 Sistema em execução. Pressione Ctrl+C para finalizar.');
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('❌ Erro ao iniciar o sistema:', error_1);
                    process.exit(1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Executar o sistema
main().catch(function (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
});
