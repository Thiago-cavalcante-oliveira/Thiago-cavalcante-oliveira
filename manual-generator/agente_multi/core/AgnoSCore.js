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
exports.AgnoSCore = exports.BaseAgent = void 0;
var eventemitter3_1 = require("eventemitter3");
var uuid_1 = require("uuid");
var BaseAgent = /** @class */ (function (_super) {
    __extends(BaseAgent, _super);
    function BaseAgent(config) {
        var _this = _super.call(this) || this;
        _this.isActive = false;
        _this.taskQueue = [];
        _this.currentTask = null;
        _this.config = config;
        return _this;
    }
    BaseAgent.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.isActive = true;
                        return [4 /*yield*/, this.initialize()];
                    case 1:
                        _a.sent();
                        this.log("\uD83E\uDD16 ".concat(this.config.name, " v").concat(this.config.version, " iniciado"));
                        return [2 /*return*/];
                }
            });
        });
    };
    BaseAgent.prototype.stop = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.isActive = false;
                        return [4 /*yield*/, this.cleanup()];
                    case 1:
                        _a.sent();
                        this.log("\u23F9\uFE0F ".concat(this.config.name, " finalizado"));
                        return [2 /*return*/];
                }
            });
        });
    };
    BaseAgent.prototype.executeTask = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, result, processingTime, markdownReport, finalResult, error_1, processingTime, errorResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isActive) {
                            throw new Error("Agente ".concat(this.config.name, " n\u00E3o est\u00E1 ativo"));
                        }
                        startTime = Date.now();
                        this.currentTask = task;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        this.log("\uD83D\uDD04 Processando tarefa: ".concat(task.type));
                        return [4 /*yield*/, this.processTask(task)];
                    case 2:
                        result = _a.sent();
                        processingTime = Date.now() - startTime;
                        return [4 /*yield*/, this.generateMarkdownReport(result)];
                    case 3:
                        markdownReport = _a.sent();
                        finalResult = __assign(__assign({}, result), { processingTime: processingTime, markdownReport: markdownReport });
                        this.log("\u2705 Tarefa conclu\u00EDda em ".concat(processingTime, "ms: ").concat(task.type));
                        this.emit('task_completed', finalResult);
                        return [2 /*return*/, finalResult];
                    case 4:
                        error_1 = _a.sent();
                        processingTime = Date.now() - startTime;
                        errorResult = {
                            id: (0, uuid_1.v4)(),
                            taskId: task.id,
                            success: false,
                            error: error_1 instanceof Error ? error_1.message : String(error_1),
                            timestamp: new Date(),
                            processingTime: processingTime
                        };
                        this.log("\u274C Erro na tarefa ".concat(task.type, ": ").concat(error_1), 'error');
                        this.emit('task_failed', errorResult);
                        return [2 /*return*/, errorResult];
                    case 5:
                        this.currentTask = null;
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    BaseAgent.prototype.log = function (message, level) {
        if (level === void 0) { level = 'info'; }
        var timestamp = new Date().toISOString();
        var emoji = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
        console.log("".concat(emoji, " [").concat(this.config.name, "] ").concat(timestamp, " - ").concat(message));
    };
    BaseAgent.prototype.sendTask = function (agentName, type, data, priority) {
        if (priority === void 0) { priority = 'medium'; }
        var task = {
            id: (0, uuid_1.v4)(),
            type: type,
            data: data,
            sender: this.config.name,
            timestamp: new Date(),
            priority: priority
        };
        this.emit('task_created', { target: agentName, task: task });
        return task;
    };
    BaseAgent.prototype.getConfig = function () {
        return this.config;
    };
    BaseAgent.prototype.getStatus = function () {
        var _a;
        return {
            isActive: this.isActive,
            currentTask: ((_a = this.currentTask) === null || _a === void 0 ? void 0 : _a.type) || null,
            queueSize: this.taskQueue.length
        };
    };
    return BaseAgent;
}(eventemitter3_1.EventEmitter));
exports.BaseAgent = BaseAgent;
var AgnoSCore = /** @class */ (function (_super) {
    __extends(AgnoSCore, _super);
    function AgnoSCore() {
        var _this = _super.call(this) || this;
        _this.agents = new Map();
        _this.taskHistory = [];
        _this.isRunning = false;
        return _this;
    }
    AgnoSCore.prototype.registerAgent = function (agent) {
        var _this = this;
        var config = agent.getConfig();
        this.agents.set(config.name, agent);
        // Configurar listeners do agente
        agent.on('task_completed', function (result) {
            _this.taskHistory.push(result);
            _this.emit('agent_task_completed', { agent: config.name, result: result });
        });
        agent.on('task_failed', function (result) {
            _this.taskHistory.push(result);
            _this.emit('agent_task_failed', { agent: config.name, result: result });
        });
        agent.on('task_created', function (_a) {
            var target = _a.target, task = _a.task;
            _this.routeTask(target, task);
        });
        console.log("\uD83D\uDD0C Agente registrado: ".concat(config.name, " v").concat(config.version));
    };
    AgnoSCore.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, _b, name_1, agent, error_2;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        this.isRunning = true;
                        _i = 0, _a = Array.from(this.agents.entries());
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        _b = _a[_i], name_1 = _b[0], agent = _b[1];
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, agent.start()];
                    case 3:
                        _c.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _c.sent();
                        console.error("\u274C Erro ao iniciar agente ".concat(name_1, ": ").concat(error_2));
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        console.log("\uD83D\uDE80 AgnoS Core iniciado com ".concat(this.agents.size, " agentes"));
                        return [2 /*return*/];
                }
            });
        });
    };
    AgnoSCore.prototype.stop = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, _b, name_2, agent, error_3;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        this.isRunning = false;
                        _i = 0, _a = Array.from(this.agents.entries());
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        _b = _a[_i], name_2 = _b[0], agent = _b[1];
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, agent.stop()];
                    case 3:
                        _c.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_3 = _c.sent();
                        console.error("\u274C Erro ao finalizar agente ".concat(name_2, ": ").concat(error_3));
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        console.log('⏹️ AgnoS Core finalizado');
                        return [2 /*return*/];
                }
            });
        });
    };
    AgnoSCore.prototype.executeTask = function (agentName_1, type_1, data_1) {
        return __awaiter(this, arguments, void 0, function (agentName, type, data, priority) {
            var agent, task;
            if (priority === void 0) { priority = 'medium'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isRunning) {
                            throw new Error('Sistema não está em execução');
                        }
                        agent = this.agents.get(agentName);
                        if (!agent) {
                            throw new Error("Agente n\u00E3o encontrado: ".concat(agentName));
                        }
                        task = {
                            id: (0, uuid_1.v4)(),
                            type: type,
                            data: data,
                            sender: 'system',
                            timestamp: new Date(),
                            priority: priority
                        };
                        return [4 /*yield*/, agent.executeTask(task)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    AgnoSCore.prototype.routeTask = function (targetAgentName, task) {
        var targetAgent = this.agents.get(targetAgentName);
        if (targetAgent) {
            // Executar task de forma assíncrona
            targetAgent.executeTask(task).catch(function (error) {
                console.error("\u274C Erro no roteamento de task para ".concat(targetAgentName, ": ").concat(error));
            });
        }
        else {
            console.error("\u274C Agente destino n\u00E3o encontrado: ".concat(targetAgentName));
        }
    };
    AgnoSCore.prototype.getAgent = function (name) {
        return this.agents.get(name);
    };
    AgnoSCore.prototype.getAgents = function () {
        return Array.from(this.agents.keys());
    };
    AgnoSCore.prototype.getTaskHistory = function () {
        return this.taskHistory;
    };
    AgnoSCore.prototype.getSystemStatus = function () {
        var status = {
            isRunning: this.isRunning,
            totalAgents: this.agents.size,
            totalTasksProcessed: this.taskHistory.length,
            agents: {}
        };
        for (var _i = 0, _a = Array.from(this.agents.entries()); _i < _a.length; _i++) {
            var _b = _a[_i], name_3 = _b[0], agent = _b[1];
            status.agents[name_3] = agent.getStatus();
        }
        return status;
    };
    return AgnoSCore;
}(eventemitter3_1.EventEmitter));
exports.AgnoSCore = AgnoSCore;
