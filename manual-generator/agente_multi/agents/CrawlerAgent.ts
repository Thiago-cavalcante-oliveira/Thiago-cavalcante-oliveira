import { BaseAgent } from '../core/AgnoSCore';
import { Page } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import { InteractionTask, AgentConfig, TaskData, TaskResult } from '../../types/types';

export class CrawlerAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      name: 'CrawlerAgent',
      version: '3.0.0',
      description: 'Executa ações de navegação atômicas a comando do orquestrador.',
      capabilities: [{ name: 'atomic_web_actions', description: 'Executa interações web simples.', version: '3.0.0' }],
    };
    super(config);
  }

  async initialize(): Promise<void> { this.log.info('CrawlerAgent (Executor de Ações) inicializado.'); }
  async cleanup(): Promise<void> {}

  async processTask(task: TaskData): Promise<TaskResult> {
    // Este agente não processa tarefas complexas, apenas executa ações diretas.
    return {
        id: uuidv4(),
        taskId: task.id,
        success: true,
        timestamp: new Date(),
        processingTime: 0,
    };
  }
  
  public async executeAction(page: Page, task: InteractionTask): Promise<void> {
    this.log.info({ action: task.action, url: task.url }, `Executando ação`);
    if (task.action === 'navigate') {
      await page.goto(task.url, { waitUntil: 'domcontentloaded' });
    } else if (task.action === 'click' && task.element) {
      const { bounds, purpose } = task.element;
      this.log.info({ purpose, bounds }, `Clicando em elemento`);
      await page.mouse.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    }
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => this.log.warn('Timeout de network idle, continuando...'));
  }

  public async takeScreenshot(page: Page): Promise<Buffer> {
      this.log.info('Capturando screenshot da página inteira...');
      return await page.screenshot({ fullPage: true });
  }

  async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    return `## Relatório do CrawlerAgent\n\n- Ação executada com sucesso.`;
  }
}

