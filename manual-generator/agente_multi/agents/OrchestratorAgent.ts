import { BaseAgent, AgnoSCore } from '../core/AgnoSCore';
import { Browser, Page, chromium } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

import { LoginAgent } from './LoginAgent';
import { CrawlerAgent } from './CrawlerAgent';
import { VisionAgent } from './VisionAgent';
import { AnalysisAgent } from './AnalysisAgent';
import { ContentAgent } from './ContentAgent';
import { GeneratorAgent } from './GeneratorAgent';

import { env } from '../config/env';
import { AgentConfig, OrchestrationConfig, InteractionTask, ManualStep, VisionElement, TaskData, TaskResult } from '../../types/types';
import { ArtifactStore } from '../services/ArtifactStore';

export class OrchestratorAgent extends BaseAgent {
  private core: AgnoSCore;
  private artifactStore: ArtifactStore;

  constructor() {
    const config: AgentConfig = {
      name: 'OrchestratorAgent',
      version: '3.0.0',
      description: 'Orquestra o pipeline interativo de agentes para exploração visual e geração de manuais.',
      capabilities: [{ name: 'interactive_pipeline_management', description: 'Gerencia o fluxo de execução cíclico.', version: '3.0.0' }],
    };
    super(config);
    this.core = new AgnoSCore();
    this.artifactStore = new ArtifactStore();
    this.registerAgents();
  }

  private registerAgents(): void {
    this.core.registerAgent(new VisionAgent());
    this.core.registerAgent(new CrawlerAgent());
    this.core.registerAgent(new LoginAgent());
    this.core.registerAgent(new AnalysisAgent());
    this.core.registerAgent(new ContentAgent());
    this.core.registerAgent(new GeneratorAgent());
  }

  async initialize(): Promise<void> {
    this.log.info('Inicializando OrchestratorAgent e sub-agentes...');
    await this.artifactStore.initialize();
    await this.core.start();
    this.log.info('OrchestratorAgent pronto.');
  }

  async cleanup(): Promise<void> {
    await this.core.stop();
    this.log.info('OrchestratorAgent finalizado.');
  }

  async processTask(task: TaskData): Promise<TaskResult> {
    if (task.type !== 'generate_manual' || !task.data) {
      throw new Error('Tipo de tarefa inválido ou dados em falta.');
    }
    const resultData = await this.executeFullPipeline(task.data as OrchestrationConfig);
    return {
      id: uuidv4(),
      taskId: task.id,
      success: resultData.success,
      data: resultData,
      timestamp: new Date(),
      processingTime: resultData.totalDuration,
    };
  }

  private async executeFullPipeline(config: OrchestrationConfig) {
    const startTime = Date.now();
    this.log.info({ url: config.targetUrl }, `Iniciando pipeline`);

    const result = { success: false, totalDuration: 0, errors: [] as string[], manualSteps: [] as ManualStep[] };
    let browser: Browser | undefined;

    try {
      browser = await chromium.launch({ headless: env.HEADLESS === 'true' });
      const context = await browser.newContext();
      const page = await context.newPage();
      context.setDefaultTimeout(env.NAV_TIMEOUT_MS);

      if (config.credentials) {
        this.log.info("FASE 1: Autenticação");
        const loginRes = await this.core.executeTask('LoginAgent', 'authenticate', { page, credentials: { ...config.credentials, loginUrl: config.targetUrl } });
        if (!loginRes.success) throw new Error(`Autenticação falhou: ${loginRes.error}`);
      }

      this.log.info('FASE 2: Exploração Interativa Visual');
      const manualSteps = await this.runInteractiveExploration(page, config);
      result.manualSteps = manualSteps;

      this.log.info('FASE 3: Análise Agregada dos Dados');
      const analysisRes = await this.core.executeTask('AnalysisAgent', 'analyze_steps', { steps: manualSteps, config });
      if (!analysisRes.success) throw new Error(`AnalysisAgent falhou: ${analysisRes.error}`);

      this.log.info('FASE 4: Geração de Conteúdo para o Manual');
      const contentRes = await this.core.executeTask('ContentAgent', 'generate_content', { analysis: analysisRes.data, steps: manualSteps });
      if (!contentRes.success) throw new Error(`ContentAgent falhou: ${contentRes.error}`);
      
      this.log.info('FASE 5: Geração de Documentos Finais');
      const generatorRes = await this.core.executeTask('GeneratorAgent', 'generate_documents', { markdownContent: (contentRes.data as {markdownContent: string}).markdownContent });
      if (!generatorRes.success) throw new Error(`GeneratorAgent falhou: ${generatorRes.error}`);

      result.success = true;

    } catch (e: unknown) {
      const error = e as Error;
      result.errors.push(error.message);
      this.log.error({ error: error.stack }, `Pipeline falhou`);
    } finally {
      if (browser) await browser.close();
      result.totalDuration = Date.now() - startTime;
      this.log.info(`Pipeline finalizado em ${result.totalDuration}ms.`);
    }
    return result;
  }

  private async runInteractiveExploration(page: Page, config: OrchestrationConfig): Promise<ManualStep[]> {
    const taskQueue: InteractionTask[] = [{ action: 'navigate', url: config.targetUrl }];
    const visitedStates = new Set<string>();
    const manualSteps: ManualStep[] = [];
    let stepCounter = 0;

    const crawlerAgent = this.core.getAgent('CrawlerAgent') as CrawlerAgent;
    const visionAgent = this.core.getAgent('VisionAgent') as VisionAgent;

    while (taskQueue.length > 0 && stepCounter < config.maxSteps) {
      const currentTask = taskQueue.shift()!;
      
      try {
        await crawlerAgent.executeAction(page, currentTask);
        
        const pageStateHash = await this.getPageStableHash(page);
        if (visitedStates.has(pageStateHash)) {
            this.log.info({ hash: pageStateHash.substring(0,8) },`Estado da página já visitado, pulando.`);
            continue;
        }
        visitedStates.add(pageStateHash);

        const screenshotBuffer = await crawlerAgent.takeScreenshot(page);
        const screenshotPath = await this.artifactStore.store({
            type: 'screenshot',
            name: `step_${stepCounter + 1}_${this.describeTask(currentTask, true)}.png`,
            content: screenshotBuffer,
        });

        const visionResult = await visionAgent.processTask({
            id: uuidv4(), type: 'analyze_screenshot', sender: this.config.name,
            timestamp: new Date(), priority: 'high', data: { screenshotBuffer }
        });

        if (!visionResult.success || !visionResult.data?.interactiveElements) continue;
        
        const elements = visionResult.data.interactiveElements as VisionElement[];
        
        stepCounter++;
        manualSteps.push({
            step: stepCounter,
            url: page.url(),
            actionDescription: this.describeTask(currentTask),
            screenshotPath,
            analysis: { elementsOnPage: elements }
        });

        elements.forEach(element => {
            if (this.shouldClickElement(element)) {
                taskQueue.push({ action: 'click', url: page.url(), element: element });
            }
        });

      } catch (error) {
        this.log.warn({ error }, `Erro ao processar tarefa de interação [${this.describeTask(currentTask)}]`);
      }
    }

    if (stepCounter >= config.maxSteps) {
        this.log.warn(`Limite máximo de ${config.maxSteps} passos atingido.`);
    }

    return manualSteps;
  }

  private async getPageStableHash(page: Page): Promise<string> {
    const structure = await page.evaluate(() => 
        Array.from(document.querySelectorAll('body *'))
             .map(el => el.tagName + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').join('.') : ''))
             .join('')
    );
    return crypto.createHash('sha256').update(page.url() + structure).digest('hex');
  }

  private describeTask(task: InteractionTask, forFilename: boolean = false): string {
    if (task.action === 'navigate') {
        return forFilename ? 'navigate_initial' : `Navegar para a página inicial: ${task.url}`;
    }
    const cleanPurpose = (task.element?.purpose || 'unknown_element').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    return forFilename ? `click_${cleanPurpose}` : `Clicar no elemento: "${task.element?.purpose}"`;
  }

  private shouldClickElement(element: VisionElement): boolean {
    const purpose = element.purpose.toLowerCase();
    const text = (element.text || '').toLowerCase();
    
    const blockList = ['logout', 'sair', 'log off', 'sign out', 'campo de texto', 'input', 'pesquisa', 'search'];
    return !blockList.some(keyword => purpose.includes(keyword) || text.includes(keyword));
  }

  async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    return `## Relatório do OrchestratorAgent\n\n- Status: ${taskResult.success ? 'Sucesso' : 'Falha'}`;
  }
}

