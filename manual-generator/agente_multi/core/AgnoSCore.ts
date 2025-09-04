import { EventEmitter } from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import { Page } from 'playwright';

// Interface restaurada para maior clareza
export interface AgentCapability {
  name: string;
  description: string;
  version: string;
}

export interface AgentConfig {
  name: string;
  version: string;
  description: string;
  capabilities: AgentCapability[];
  dependencies?: string[];
}

export interface TaskData {
  id: string;
  type: string;
  data: any;
  sender: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  executionId?: string;
  // A referência a OrchestrationConfig foi removida para manter o core agnóstico
}

export interface TaskResult {
  id: string;
  taskId: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: Date;
  processingTime: number;
  markdownReport?: string;
}

export abstract class BaseAgent extends EventEmitter {
  protected config: AgentConfig;
  protected isActive: boolean = false;
  protected taskQueue: TaskData[] = [];
  protected currentTask: TaskData | null = null;

  constructor(config: AgentConfig) {
    super();
    this.config = config;
  }

  // Métodos abstratos que cada agente deve implementar
  abstract initialize(): Promise<void>;
  abstract processTask(task: TaskData): Promise<TaskResult>;
  abstract cleanup(): Promise<void>;
  abstract generateMarkdownReport(taskResult: TaskResult): Promise<string>;

  async start(): Promise<void> {
    this.isActive = true;
    await this.initialize();
    this.log(`🤖 ${this.config.name} v${this.config.version} iniciado`);
  }

  async stop(): Promise<void> {
    this.isActive = false;
    await this.cleanup();
    this.log(`⏹️ ${this.config.name} finalizado`);
  }

  async executeTask(task: TaskData): Promise<TaskResult> {
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
      
      const finalResult: TaskResult = {
        ...result,
        processingTime,
        markdownReport
      };

      this.log(`✅ Tarefa concluída em ${processingTime}ms: ${task.type}`);
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

      this.log(`❌ Erro na tarefa ${task.type}: ${error}`, 'error');
      this.emit('task_failed', errorResult);

      return errorResult;
    } finally {
      this.currentTask = null;
    }
  }

  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const emoji = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
    console.log(`${emoji} [${this.config.name}] ${timestamp} - ${message}`);
  }

  protected async waitForDomSteady(page: Page, timeout: number = 30000): Promise<void> {
    let lastHash = '';
    let steadyCount = 0;
    const checkInterval = 500;
    const requiredSteadyCycles = 2;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const currentHash = await page.evaluate(() => {
        const body = document.body;
        if (!body) return '';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = body.innerHTML;
        tempDiv.querySelectorAll('script, style, noscript, link, meta').forEach(el => el.remove());
        return Array.from(tempDiv.querySelectorAll('*'))
          .map(el => el.tagName + (el.textContent ? el.textContent.trim().substring(0, 50) : ''))
          .join('');
      });

      if (currentHash === lastHash && currentHash !== '') {
        steadyCount++;
        if (steadyCount >= requiredSteadyCycles) {
          this.log(`DOM steady after ${steadyCount} cycles.`, 'info');
          return;
        }
      } else {
        steadyCount = 0;
      }
      lastHash = currentHash;
      await page.waitForTimeout(checkInterval);
    }
    this.log('DOM did not become steady within the timeout.', 'warn');
  }

  protected sendTask(agentName: string, type: string, data: any, priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'): void {
    const task: TaskData = {
      id: uuidv4(),
      type,
      data,
      sender: this.config.name,
      timestamp: new Date(),
      priority
    };
    this.emit('task_created', { target: agentName, task });
  }

  getConfig(): AgentConfig {
    return this.config;
  }

  getStatus(): { isActive: boolean; currentTask: string | null; queueSize: number } {
    return {
      isActive: this.isActive,
      currentTask: this.currentTask?.type || null,
      queueSize: this.taskQueue.length
    };
  }
}

export class AgnoSCore extends EventEmitter {
  private agents: Map<string, BaseAgent> = new Map();
  private taskHistory: TaskResult[] = [];
  private isRunning: boolean = false;

  constructor() {
    super();
  }

  registerAgent(agent: BaseAgent): void {
    const agentName = agent.getConfig().name;
    if (this.agents.has(agentName)) {
      console.warn(`⚠️ Agente ${agentName} já registado. A substituir.`);
    }
    this.agents.set(agentName, agent);

    // Configurar listeners do agente para comunicação com o Core
    agent.on('task_completed', (result: TaskResult) => {
      this.taskHistory.push(result);
      this.emit('agent_task_completed', { agent: agentName, result });
    });

    agent.on('task_failed', (result: TaskResult) => {
      this.taskHistory.push(result);
      this.emit('agent_task_failed', { agent: agentName, result });
    });

    agent.on('task_created', ({ target, task }) => {
      this.routeTask(target, task);
    });

    console.log(`🔌 Agente registado: ${agentName} v${agent.getConfig().version}`);
  }

  async start(): Promise<void> {
    this.isRunning = true;
    for (const [name, agent] of this.agents.entries()) {
      try {
        await agent.start();
      } catch (error) {
        console.error(`❌ Erro ao iniciar agente ${name}: ${error}`);
      }
    }
    console.log(`🚀 AgnoS Core iniciado com ${this.agents.size} agentes`);
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    for (const [name, agent] of this.agents.entries()) {
      try {
        await agent.stop();
      } catch (error) {
        console.error(`❌ Erro ao finalizar agente ${name}: ${error}`);
      }
    }
    console.log('⏹️ AgnoS Core finalizado');
  }

  async executeTask(agentName: string, type: string, data: any, priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<TaskResult> {
    if (!this.isRunning) {
      throw new Error('Sistema não está em execução.');
    }
    const agent = this.agents.get(agentName);
    if (!agent) {
      throw new Error(`Agente não encontrado: ${agentName}`);
    }
    const task: TaskData = {
      id: uuidv4(),
      type,
      data,
      sender: 'system',
      timestamp: new Date(),
      priority
    };
    return agent.executeTask(task);
  }

  private routeTask(targetAgentName: string, task: TaskData): void {
    const targetAgent = this.agents.get(targetAgentName);
    if (targetAgent) {
      targetAgent.executeTask(task).catch(error => {
        console.error(`❌ Erro no roteamento de tarefa para ${targetAgentName}: ${error}`);
      });
    } else {
      console.error(`❌ Agente destino não encontrado: ${targetAgentName}`);
    }
  }

  getAgent(name: string): BaseAgent | undefined {
    return this.agents.get(name);
  }

  getAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  getTaskHistory(): TaskResult[] {
    return this.taskHistory;
  }

  getSystemStatus(): any {
    const status: any = {
      isRunning: this.isRunning,
      totalAgents: this.agents.size,
      totalTasksProcessed: this.taskHistory.length,
      agents: {}
    };
    for (const [name, agent] of this.agents.entries()) {
      status.agents[name] = agent.getStatus();
    }
    return status;
  }
}