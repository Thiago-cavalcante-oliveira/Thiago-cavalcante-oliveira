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
function testManualGeneration() {
    return __awaiter(this, void 0, void 0, function () {
        var core, orchestratorAgent, testConfig, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🧪 Iniciando teste de geração de manual...');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    core = new AgnoSCore_js_1.AgnoSCore();
                    orchestratorAgent = new OrchestratorAgent_js_1.OrchestratorAgent();
                    core.registerAgent(orchestratorAgent);
                    // Iniciar o sistema
                    return [4 /*yield*/, core.start()];
                case 2:
                    // Iniciar o sistema
                    _a.sent();
                    console.log('✅ Sistema iniciado com sucesso!');
                    testConfig = {
                        targetUrl: 'https://www.google.com',
                        enableScreenshots: true,
                        outputFormats: ['markdown', 'html', 'pdf'],
                        maxRetries: 2,
                        timeoutMinutes: 10
                    };
                    console.log("\uD83C\uDFAF Testando gera\u00E7\u00E3o de manual para: ".concat(testConfig.targetUrl));
                    return [4 /*yield*/, core.executeTask('OrchestratorAgent', 'orchestrate_manual_generation', testConfig, 'high')];
                case 3:
                    result = _a.sent();
                    if (result.success) {
                        console.log('✅ Teste de geração de manual concluído com sucesso!');
                        console.log('📊 Resultado:', result);
                        if (result.markdownReport) {
                            console.log('\n📄 Relatório em Markdown:');
                            console.log('='.repeat(50));
                            console.log(result.markdownReport);
                            console.log('='.repeat(50));
                        }
                    }
                    else {
                        console.log('❌ Teste falhou:', result.error);
                    }
                    // Parar o sistema
                    return [4 /*yield*/, core.stop()];
                case 4:
                    // Parar o sistema
                    _a.sent();
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _a.sent();
                    console.error('❌ Erro durante o teste:', error_1);
                    process.exit(1);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Executar o teste
testManualGeneration().catch(function (error) {
    console.error('❌ Erro fatal no teste:', error);
    process.exit(1);
});
