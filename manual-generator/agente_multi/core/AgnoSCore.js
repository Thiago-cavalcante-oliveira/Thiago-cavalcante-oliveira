"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgnoSCore = exports.BaseAgent = void 0;
const eventemitter3_1 = require("eventemitter3");
const uuid_1 = require("uuid");
class BaseAgent extends eventemitter3_1.EventEmitter {
    constructor(config) {
        super();
        this.isActive = false;
        this.taskQueue = [];
        this.currentTask = null;
        this.config = config;
    }
    async start() {
        this.isActive = true;
        await this.initialize();
        this.log(`🤖 ${this.config.name} v${this.config.version} iniciado`);
    }
    async stop() {
        this.isActive = false;
        await this.cleanup();
        this.log(`⏹️ ${this.config.name} finalizado`);
    }
    async executeTask(task) {
        if (!this.isActive) {
            throw new Error(`Agente ${this.config.name} não está ativo`);
        }
        const startTime = Date.now();
        this.currentTask = task;
        try {
            this.log(`🔄 Processando tarefa: ${task.type}`);
            const result = await this.processTask(task);
            const processingTime = Date.now() - startTime;
            // Gerar relatório em markdown
            const markdownReport = await this.generateMarkdownReport(result);
            const finalResult = {
                ...result,
                processingTime,
                markdownReport
            };
            this.log(`✅ Tarefa concluída em ${processingTime}ms: ${task.type}`);
            this.emit('task_completed', finalResult);
            return finalResult;
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            const errorResult = {
                id: (0, uuid_1.v4)(),
                taskId: task.id,
                success: false,
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date(),
                processingTime
            };
            this.log(`❌ Erro na tarefa ${task.type}: ${error}`, 'error');
            this.emit('task_failed', errorResult);
            return errorResult;
        }
        finally {
            this.currentTask = null;
        }
    }
    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const emoji = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
        console.log(`${emoji} [${this.config.name}] ${timestamp} - ${message}`);
    }
    sendTask(agentName, type, data, priority = 'medium') {
        const task = {
            id: (0, uuid_1.v4)(),
            type,
            data,
            sender: this.config.name,
            timestamp: new Date(),
            priority
        };
        this.emit('task_created', { target: agentName, task });
        return task;
    }
    getConfig() {
        return this.config;
    }
    getStatus() {
        return {
            isActive: this.isActive,
            currentTask: this.currentTask?.type || null,
            queueSize: this.taskQueue.length
        };
    }
}
exports.BaseAgent = BaseAgent;
class AgnoSCore extends eventemitter3_1.EventEmitter {
    constructor() {
        super();
        this.agents = new Map();
        this.taskHistory = [];
        this.isRunning = false;
    }
    registerAgent(agent) {
        const config = agent.getConfig();
        this.agents.set(config.name, agent);
        // Configurar listeners do agente
        agent.on('task_completed', (result) => {
            this.taskHistory.push(result);
            this.emit('agent_task_completed', { agent: config.name, result });
        });
        agent.on('task_failed', (result) => {
            this.taskHistory.push(result);
            this.emit('agent_task_failed', { agent: config.name, result });
        });
        agent.on('task_created', ({ target, task }) => {
            this.routeTask(target, task);
        });
        console.log(`🔌 Agente registrado: ${config.name} v${config.version}`);
    }
    async start() {
        this.isRunning = true;
        // Inicializar todos os agentes
        for (const [name, agent] of Array.from(this.agents.entries())) {
            try {
                await agent.start();
            }
            catch (error) {
                console.error(`❌ Erro ao iniciar agente ${name}: ${error}`);
            }
        }
        console.log(`🚀 AgnoS Core iniciado com ${this.agents.size} agentes`);
    }
    async stop() {
        this.isRunning = false;
        // Finalizar todos os agentes
        for (const [name, agent] of Array.from(this.agents.entries())) {
            try {
                await agent.stop();
            }
            catch (error) {
                console.error(`❌ Erro ao finalizar agente ${name}: ${error}`);
            }
        }
        console.log('⏹️ AgnoS Core finalizado');
    }
    async executeTask(agentName, type, data, priority = 'medium') {
        if (!this.isRunning) {
            throw new Error('Sistema não está em execução');
        }
        const agent = this.agents.get(agentName);
        if (!agent) {
            throw new Error(`Agente não encontrado: ${agentName}`);
        }
        const task = {
            id: (0, uuid_1.v4)(),
            type,
            data,
            sender: 'system',
            timestamp: new Date(),
            priority
        };
        return await agent.executeTask(task);
    }
    routeTask(targetAgentName, task) {
        const targetAgent = this.agents.get(targetAgentName);
        if (targetAgent) {
            // Executar task de forma assíncrona
            targetAgent.executeTask(task).catch(error => {
                console.error(`❌ Erro no roteamento de task para ${targetAgentName}: ${error}`);
            });
        }
        else {
            console.error(`❌ Agente destino não encontrado: ${targetAgentName}`);
        }
    }
    getAgent(name) {
        return this.agents.get(name);
    }
    getAgents() {
        return Array.from(this.agents.keys());
    }
    getTaskHistory() {
        return this.taskHistory;
    }
    getSystemStatus() {
        const status = {
            isRunning: this.isRunning,
            totalAgents: this.agents.size,
            totalTasksProcessed: this.taskHistory.length,
            agents: {}
        };
        for (const [name, agent] of Array.from(this.agents.entries())) {
            status.agents[name] = agent.getStatus();
        }
        return status;
    }
}
exports.AgnoSCore = AgnoSCore;
