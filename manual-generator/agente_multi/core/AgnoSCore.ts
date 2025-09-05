import { EventEmitter } from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import { AgentConfig, TaskData, TaskResult } from '../../types/types';
import { logger } from '../utils/logger';
import { Logger } from 'pino';

export abstract class BaseAgent extends EventEmitter {
  public config: AgentConfig;
  protected isActive: boolean = false;
  protected log: Logger;

  constructor(config: AgentConfig) {
    super();
    this.config = config;
    this.log = logger.child({ agent: this.config.name });
  }

  abstract initialize(): Promise<void>;
  abstract processTask(task: TaskData): Promise<TaskResult>;
  abstract cleanup(): Promise<void>;
  abstract generateMarkdownReport(taskResult: TaskResult): Promise<string>;

  async start(): Promise<void> {
    this.isActive = true;
    await this.initialize();
    this.log.info(`🤖 Agente ${this.config.name} v${this.config.version} iniciado`);
  }

  async stop(): Promise<void> {
    this.isActive = false;
    await this.cleanup();
    this.log.info(`⏹️ Agente ${this.config.name} finalizado`);
  }

  async executeTask(task: TaskData): Promise<TaskResult> {
    if (!this.isActive) {
      throw new Error(`Agente ${this.config.name} não está ativo.`);
    }

    const startTime = Date.now();
    this.log.info({ taskType: task.type }, `🔄 Processando tarefa`);
    
    try {
      const result = await this.processTask(task);
      const processingTime = Date.now() - startTime;
      
      const markdownReport = await this.generateMarkdownReport(result).catch(err => {
        this.log.error({error: err}, "Falha ao gerar relatório markdown");
        return "Erro ao gerar relatório.";
      });

      const finalResult: TaskResult = { ...result, processingTime, markdownReport };
      this.log.info({ taskType: task.type, processingTime }, `✅ Tarefa concluída`);
      
      this.emit('task_completed', finalResult);
      return finalResult;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorResult: TaskResult = {
        id: uuidv4(),
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        processingTime
      };

      this.log.error({ error: errorResult.error, stack: (error as Error).stack }, `❌ Erro na tarefa ${task.type}`);
      this.emit('task_failed', errorResult);
      return errorResult;
    }
  }
}

export class AgnoSCore extends EventEmitter {
  private agents: Map<string, BaseAgent> = new Map();
  private isRunning: boolean = false;

  registerAgent(agent: BaseAgent): void {
    const agentName = agent.config.name;
    this.agents.set(agentName, agent);
    logger.info(`🔌 Agente registado: ${agentName}`);
  }

  async start(): Promise<void> {
    this.isRunning = true;
    for (const agent of this.agents.values()) {
      await agent.start();
    }
    logger.info(`🚀 AgnoS Core iniciado com ${this.agents.size} agentes.`);
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    for (const agent of this.agents.values()) {
      await agent.stop();
    }
    logger.info('⏹️ AgnoS Core finalizado.');
  }

  async executeTask(agentName: string, type: string, data: Record<string, any>, priority: TaskData['priority'] = 'medium'): Promise<TaskResult> {
    if (!this.isRunning) throw new Error('Sistema não está em execução.');
    
    const agent = this.agents.get(agentName);
    if (!agent) throw new Error(`Agente não encontrado: ${agentName}`);
    
    const task: TaskData = { id: uuidv4(), type, data, sender: 'system', timestamp: new Date(), priority };
    return agent.executeTask(task);
  }

  getAgent(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }
}

