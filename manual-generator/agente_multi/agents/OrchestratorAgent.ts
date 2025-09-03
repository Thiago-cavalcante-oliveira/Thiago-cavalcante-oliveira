import { BaseAgent, AgentConfig, TaskData, TaskResult } from '../core/AgnoSCore.js';
import { MinIOService } from '../services/MinIOService.js';
import { LoginAgent } from './LoginAgent';
import { SmartLoginAgent } from './SmartLoginAgent';
import { CrawlerAgent } from './CrawlerAgent';
import { AnalysisAgent } from './AnalysisAgent';
import { ContentAgent } from './ContentAgent';
import { GeneratorAgent } from './GeneratorAgent';
import { MenuModalAgent } from './MenuModalAgent';
import { Browser, Page, chromium, BrowserContext } from 'playwright';
import { explorePage } from '../crawler/index.js';
import { env } from '../config/env.js';
import { Semaphore } from '../core/sem.js';
import { BaseAgent, AgentConfig, TaskData, TaskResult } from '../core/AgnoSCore.js';

// Shim global para evitar erro '__name is not defined'
if (typeof (globalThis as any).__name === 'undefined') {
  (globalThis as any).__name = 'OrchestratorAgent';
}

export interface OrchestrationConfig {
  maxRetries: number;
  timeoutMinutes: number;
  enableScreenshots: boolean;
  outputFormats: ('markdown' | 'html' | 'pdf')[];
  targetUrl: string;
  outputDir?: string;
  crawlingStrategy?: 'basic' | 'advanced';
  stopAfterPhase?: 'login' | 'crawling';
  credentials?: {
    username: string;
    password: string;
    loginUrl?: string;
    customSteps?: Array<{ type: 'fill' | 'click' | 'wait' | 'waitForSelector'; selector: string; value?: string; timeout?: number }>;
  };
  authConfig?: { type: 'basic' | 'oauth' | 'custom'; credentials?: { username?: string; password?: string; customFlow?: any } };
}

export interface OrchestrationResult {
  success: boolean;
  executionId: string;
  startTime: Date;
  endTime: Date;
  totalDuration: number;
  agentsExecuted: string[];
  documentsGenerated: { markdown?: string; html?: string; pdf?: string };
  statistics: { pagesProcessed: number; elementsAnalyzed: number; totalElements: number; screenshotsCaptured: number; wordCount: number };
  reports: { [agentName: string]: string };
  errors: string[];
}

export class OrchestratorAgent extends BaseAgent {
  private minioService: MinIOService;
  private agents: Map<string, any> = new Map();
  private semaphore: Semaphore;
  private readonly agentConfig: AgentConfig;
  private orchestrationConfig: OrchestrationConfig;

  constructor() {
    const config: AgentConfig = {
      name: 'OrchestratorAgent',
      version: '1.1.0',
      description: 'Orquestra login com fallback, crawl com MenuModalAgent, análise e geração',
      capabilities: [
        { name: 'agent_coordination', description: 'Coordenação de múltiplos agentes especializados', version: '1.0.0' },
        { name: 'pipeline_management', description: 'Gerenciamento do pipeline de execução', version: '1.0.0' },
        { name: 'execution_monitoring', description: 'Monitoramento da execução', version: '1.0.0' }
      ]
    };
    super(config);
    this.agentConfig = config;
    this.minioService = new MinIOService();
    this.orchestrationConfig = OrchestratorAgent.createDefaultConfig();
    this.semaphore = new Semaphore(env.MAX_CONCURRENCY);

    // registra agentes
    this.agents.set('LoginAgent', new LoginAgent({ name: 'LoginAgent', version: '1.0.0', description: 'Agente de login', capabilities: [] }));
    this.agents.set('SmartLoginAgent', new SmartLoginAgent({ name: 'SmartLoginAgent', version: '1.0.0', description: 'Agente de login inteligente', capabilities: [] }));
    this.agents.set('CrawlerAgent', new CrawlerAgent({ name: 'CrawlerAgent', version: '1.0.0', description: 'Agente de rastreamento', capabilities: [] }));
    this.agents.set('AnalysisAgent', new AnalysisAgent({ name: 'AnalysisAgent', version: '1.0.0', description: 'Análise inteligente de dados de crawling', capabilities: [] }));
    // ContentAgent (7 parâmetros): prompt, minio, keyManager, llmManager, cache, logDir, logFile
    this.agents.set('ContentAgent', new ContentAgent(
      this.minioService,      // MinIOService
      null,                   // GeminiKeyManager (opcional)
      null,                   // LLMManager (opcional) → fallbacks serão usados
      'logs',                 // logDir
      'content.log'           // logFile
    ));
    this.agents.set('GeneratorAgent', new GeneratorAgent({
      name: 'GeneratorAgent',
      version: '1.0.0',
      description: 'Agent responsible for generating final documentation',
      capabilities: []
    }));
    // registra MenuModalAgent (necessário para o crawler)
    this.agents.set('MenuModalAgent', new MenuModalAgent({ name: 'MenuModalAgent', version: '1.0.0', description: 'Agente para interagir com modais de menu', capabilities: [] }));
  }

  static createDefaultConfig(overrides: Partial<OrchestrationConfig> = {}): OrchestrationConfig {
    return {
      maxRetries: env.MAX_RETRIES || 2,
      timeoutMinutes: 15,
      enableScreenshots: true,
      outputFormats: ['markdown'],
      targetUrl: overrides.targetUrl || env.SAEB_URL,
      crawlingStrategy: 'advanced',
      credentials: env.SAEB_USERNAME && env.SAEB_PASSWORD ? {
        username: env.SAEB_USERNAME,
        password: env.SAEB_PASSWORD,
        loginUrl: overrides.loginUrl || env.SAEB_URL
      } : undefined,
      ...overrides
    };
  }

  async executeWithEnvConfig(overrides: Partial<OrchestrationConfig> = {}): Promise<OrchestrationResult> {
    this.orchestrationConfig = OrchestratorAgent.createDefaultConfig(overrides);
    return this.executeFullPipeline(this.orchestrationConfig);
  }

  protected override log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const emoji = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
    console.log(`${emoji} [${this.agentConfig.name}] ${timestamp} - ${message}`);
  }

  async processTask(task: TaskData): Promise<TaskResult> {
    this.orchestrationConfig = task.config as OrchestrationConfig;
    const startTime = Date.now();
    try {
      let result: any;
      switch (task.type) {
        case 'execute_pipeline':
          result = await this.executeFullPipeline(task.data);
          break;
        case 'execute_with_env':
          result = await this.executeWithEnvConfig(task.data);
          break;
        case 'login_only':
          result = await this.executeLoginOnly(task.data);
          break;
        case 'execute_page_explore':
          // Certifique-se de que pageInstance está presente no task.data
          if (!task.data.pageInstance) {
            throw new Error('pageInstance é necessária para execute_page_explore');
          }
          result = await this.executePageExplore(task.data);
          break;
        default:
          throw new Error(`Tipo de tarefa não suportado: ${task.type}`);
      }
      return {
        id: `result_${Date.now()}`,
        taskId: task.id,
        success: true,
        data: result,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };
    } catch (error: any) {
      throw error;
    }
  }

  private async executeAgentTask(agentName: string, taskType: string, data: any): Promise<TaskResult> {
    const agent = this.agents.get(agentName);
    if (!agent) throw new Error(`Agente ${agentName} não encontrado`);

    // Integra MenuModalAgent ao Crawler (se existir)
    if (agentName === 'CrawlerAgent') {
      const crawler = agent as CrawlerAgent;
      const menuModal = this.agents.get('MenuModalAgent');
      crawler?.setMenuModalAgent?.(menuModal);
    }

    const task: TaskData = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type: taskType,
      data,
      priority: 'high',
      timestamp: new Date(),
      sender: 'OrchestratorAgent'
    };
    return await agent.processTask(task);
  }

  async executeFullPipeline(config: OrchestrationConfig, browserInstance?: Browser, pageInstance?: Page, browserContextInstance?: BrowserContext): Promise<OrchestrationResult> {
    this.log(`Configuração de execução: ${JSON.stringify(config)}`);
    const executionId = `exec_${Date.now()}`;
    const startTime = new Date();
    this.log(`Iniciando o pipeline de orquestração para a URL: ${config.targetUrl}`);

    const result: OrchestrationResult = {
      success: false,
      executionId,
      startTime,
      endTime: new Date(),
      totalDuration: 0,
      agentsExecuted: [],
      documentsGenerated: {},
      statistics: { pagesProcessed: 0, elementsAnalyzed: 0, totalElements: 0, screenshotsCaptured: 0, wordCount: 0 },
      reports: {},
      errors: []
    };

     await this.semaphore.acquire();
     let browser: Browser | undefined;
     let context: BrowserContext | undefined;
     let page: Page | undefined;

     if (browserInstance && pageInstance && browserContextInstance) {
       this.log(`Reutilizando navegador e página existentes...`);
       browser = browserInstance;
       context = browserContextInstance;
       page = pageInstance;
     } else {
       this.log(`Lançando novo navegador...`);
       try {
         const launchOptions: any = { headless: env.HEADLESS === 'true', args: ['--no-sandbox', '--disable-setuid-sandbox'] };
         browser = await chromium.launch(launchOptions);
         context = await browser.newContext();
         page = await context.newPage();
         if (env.HEADLESS !== 'true') {
           await page.waitForTimeout(3000); // Pausa para visualização inicial
         }
       } catch (error: any) {
         // Ensure browser is closed if an error occurs during context/page creation
         if (browser) {
           await browser.close();
         }
         throw error; // Re-throw the original error
       }
     }

     // Add defensive checks before setting timeouts, as context/page might theoretically be undefined
     // if an error occurred during their creation, though the 'throw error' would prevent reaching here.
     // This makes the code more robust against unexpected control flows or future refactors.
     if (context) {
       context.setDefaultTimeout(env.NAV_TIMEOUT_MS);
       context.setDefaultNavigationTimeout(env.NAV_TIMEOUT_MS);
     }
     if (page) {
       page.setDefaultTimeout(env.NAV_TIMEOUT_MS);
       page.setDefaultNavigationTimeout(env.NAV_TIMEOUT_MS);
     }
     this.log(`Playwright timeouts set to ${env.NAV_TIMEOUT_MS}ms.`);

      // Passa a instância da página e do navegador para o CrawlerAgent
      const crawlerAgent = this.agents.get('CrawlerAgent') as CrawlerAgent;
      if (page) {
        crawlerAgent.setPage(page);
      }
      if (browser) {
        crawlerAgent.setBrowser(browser);
      }

      const menuModalAgent = this.agents.get('MenuModalAgent') as MenuModalAgent;
      if (menuModalAgent && page) {
        menuModalAgent.setPage(page);
        // Se houver uma timeline global ou se ela for criada aqui, passe-a.
        // Por enquanto, passaremos null, assumindo que a timeline não é estritamente necessária para a inicialização.
        // Ou, se a timeline for um serviço, ela deve ser injetada de forma semelhante ao MinIOService.
        // menuModalAgent.setTimeline(this.timelineService); // Exemplo se timeline for um serviço
      }

      if (config.enableScreenshots) {
        await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
      }

      // FASE 1: Login com fallback
      const loginUrl = config.credentials?.loginUrl || config.targetUrl;
      if (config?.credentials?.username && config?.credentials?.password) {
        this.log('FASE 1: Login (LoginAgent)');
        const loginRes = await this.executeAgentTask('LoginAgent', 'authenticate', { credentials: config.credentials, loginUrl, page });
         if (loginRes.success) {
           this.log('Login bem-sucedido com LoginAgent.');
           if (env.HEADLESS !== 'true') {
             await page?.waitForTimeout(3000); // Pausa para visualização após login
           }
         } else {
           this.log(`LoginAgent falhou: ${loginRes.error}. Fallback SmartLogin.`, 'warn');
           const smartRes = await this.executeAgentTask('SmartLoginAgent', 'smart_login', { baseUrl: loginUrl, credentials: { username: config.credentials.username, password: config.credentials.password }, page, outputDir: config.outputDir });
           if (smartRes.success) {
             this.log('Login bem-sucedido com SmartLoginAgent.');
             if (env.HEADLESS !== 'true') {
               await page?.waitForTimeout(3000); // Pausa para visualização após login
             }
           } else {
             throw new Error('Falha de autenticação (SmartLogin também falhou)');
           }
         }
      } else {
        this.log('FASE 1: Login pulado (sem credenciais)');
      }

      if (config.stopAfterPhase === 'login') {
        result.success = true;
        result.endTime = new Date();
        result.totalDuration = result.endTime.getTime() - result.startTime.getTime();
        return result;
      }

      // FASE 2: Crawling (mesma sessão da page autenticada)
      this.log('FASE 2: Crawling');
      const startUrl = config.targetUrl;
      const crawlerRes = await this.executeAgentTask('CrawlerAgent', 'crawl_site', { baseUrl: startUrl, enableScreenshots: config.enableScreenshots, useCurrentPage: true, crawlingStrategy: config.crawlingStrategy || 'basic', outputDir: config.outputDir || 'output', page, browser });
      if (!crawlerRes.success) throw new Error(`CrawlerAgent falhou: ${crawlerRes.error}`);
      result.agentsExecuted.push('CrawlerAgent');

      const payload = crawlerRes.data || {};
      let totalElements = 0;
      if (Array.isArray(payload.pages)) {
        totalElements = payload.pages.reduce((a: number, p: any) => a + (p.elements?.length || 0), 0);
      }
      result.statistics = { pagesProcessed: payload.stats?.pages ?? (payload.pages?.length ?? 1), elementsAnalyzed: totalElements, totalElements, screenshotsCaptured: 0, wordCount: 0 };

      if (config.stopAfterPhase === 'crawling') {
        result.success = true;
        result.endTime = new Date();
        result.totalDuration = result.endTime.getTime() - result.startTime.getTime();
        return result;
      }

      // FASE 3: Análise (AnalysisAgent)
      this.log('FASE 3: Análise');
      if (!crawlerRes.data) {
        throw new Error('Dados de crawling ausentes para o AnalysisAgent.');
      }
      const analysisRes = await this.executeAgentTask('AnalysisAgent', 'analyze', { crawlResult: crawlerRes.data, outputDir: config.outputDir });
      if (!analysisRes.success) throw new Error(`AnalysisAgent falhou: ${analysisRes.error}`);
      result.agentsExecuted.push('AnalysisAgent');

      // FASE 4: Content (novo ContentAgent)
      this.log('FASE 4: Content');
      const contentRes = await this.executeAgentTask('ContentAgent', 'generate_user_friendly_content', { crawlAnalysis: analysisRes.data || { pages: payload.pages }, rawData: payload.pages });
      if (!contentRes.success) this.log(`ContentAgent aviso: ${contentRes.error}`, 'warn');
      result.agentsExecuted.push('ContentAgent');

      // FASE 5: Generator
      this.log('FASE 5: Generator');
      const userContentForGenerator = contentRes.data || { sections: [], introduction: { requirements: [] } }; // Garante que userContent tenha a estrutura mínima
      const genRes = await this.executeAgentTask('GeneratorAgent', 'generate_final_documents', { userContent: userContentForGenerator, crawlAnalysis: analysisRes.data || payload });
      if (!genRes.success) this.log(`GeneratorAgent aviso: ${genRes.error}`, 'warn');
      result.agentsExecuted.push('GeneratorAgent');

      if (genRes.data?.metadata?.wordCount) result.statistics.wordCount = genRes.data.metadata.wordCount;
      result.documentsGenerated = { markdown: genRes.data?.minioUrls?.markdown, html: genRes.data?.minioUrls?.html, pdf: genRes.data?.minioUrls?.pdf };

      result.success = true;
      result.endTime = new Date();
      result.totalDuration = result.endTime.getTime() - result.startTime.getTime();
      return result;
    } catch (e: any) {
      result.errors.push(e?.message || String(e));
      result.endTime = new Date();
      result.totalDuration = result.endTime.getTime() - result.startTime.getTime();
      this.log(`Pipeline falhou: ${e}`, 'error');
      return result;
    } finally {
      if (browser && !browserInstance) {
        this.log('Fechando navegador Playwright...');
        await browser.close();
      }
      if (browser && !browserInstance) {
        await browser.close();
        this.log('Navegador fechado.');
      }
      this.semaphore.release();
    }
  }

  async executePageExplore(config: any): Promise<any> {
    const startTime = Date.now();
    let success = true;
    let errors: string[] = [];
    let pagesProcessed = 0;
    let elementsAnalyzed = 0;
    let documentsGenerated: { [key: string]: string | undefined } = {};

    try {
      const { pageReport } = await explorePage(config.pageInstance, {
        startUrl: config.startUrl,
        outputDir: config.outputDir,
        enableScreenshots: config.enableScreenshots,
      });

      await (this.agents.get('AnalysisAgent') as AnalysisAgent).processTask({
        id: `analyze_page_${Date.now()}`,
        type: 'analyze_page',
        data: pageReport,
        timestamp: new Date(),
        sender: this.agentConfig.name,
        priority: 'high',
      });

      pagesProcessed = 1;
    } catch (error: any) {
      success = false;
      errors.push(error.message);
      this.log(`Erro durante a exploração da página: ${error.message}`, 'error');
    } finally {
      const totalDuration = Date.now() - startTime;
      this.log(`Exploração de página concluída em ${totalDuration}ms com sucesso: ${success}`);
      return { success, totalDuration, agentsExecuted: ['OrchestratorAgent', 'AnalysisAgent', 'ContentAgent'], statistics: { pagesProcessed, elementsAnalyzed }, errors, documentsGenerated };
    }
  }

  async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    const { success, data, error, processingTime } = taskResult;
    let report = `# Relatório de Execução - OrchestratorAgent\n\n`;
    report += `**Status:** ${success ? '✅ Sucesso' : '❌ Falha'}\n`;
    report += `**Tempo de Processamento:** ${processingTime}ms\n`;
    report += `**Timestamp:** ${taskResult.timestamp.toISOString()}\n\n`;
    if (success && data) {
      report += `## Resultados\n\n`;
      if (data.agentsExecuted) report += `**Agentes Executados:** ${data.agentsExecuted.join(', ')}\n`;
      if (data.statistics) {
        report += `\n### Estatísticas\n`;
        report += `- Páginas processadas: ${data.statistics.pagesProcessed || 0}\n`;
        report += `- Elementos analisados: ${data.statistics.elementsAnalyzed || 0}\n`;
        report += `- Screenshots capturados: ${data.statistics.screenshotsCaptured || 0}\n`;
      }
      if (data.documentsGenerated) {
        report += `\n### Documentos Gerados\n`;
        Object.entries(data.documentsGenerated).forEach(([format, path]) => { if (path) report += `- ${format.toUpperCase()}: \`${path}\`\n`; });
      }
    }
    if (error) report += `## Erro\n\n\`\`\`\n${error}\n\`\`\`\n`;
    if (data?.errors && data.errors.length > 0) {
      report += `\n## Erros Adicionais\n\n`;
      data.errors.forEach((err: string, index: number) => { report += `${index + 1}. ${err}\n`; });
    }
    return report;
  }

  registerAgent(name: string, agent: any): void { this.agents.set(name, agent); }

  async launchBrowser(): Promise<Browser> {
    this.log('Lançando navegador para exploração de página...');
    const launchOptions: any = { headless: env.HEADLESS === 'true', args: ['--no-sandbox', '--disable-setuid-sandbox'] };
    return await chromium.launch(launchOptions);
  }

  async initialize(): Promise<void> {
    this.log('Inicializando OrchestratorAgent...');
    // Inicializa o MinIOService primeiro
    if (this.minioService && !this.minioService.isAvailable) {
      await this.minioService.initialize();
      this.log('MinIOService inicializado');
    }

    // Inicializa os outros agentes
    for (const [name, agent] of this.agents) {
      if (agent.initialize && agent !== this.minioService) { // Evita inicializar MinIOService novamente
        await agent.initialize();
        this.log(`Agente ${name} inicializado`);
      }
    }
    this.log('OrchestratorAgent inicializado com sucesso');
  }

  public async cleanup(): Promise<void> {
    try { for (const [, agent] of this.agents) { await agent.cleanup?.(); } } catch { /* noop */ } 
    this.log('OrchestratorAgent finalizado');
  }

  getAgent(agentName: string): any { return this.agents.get(agentName); }

  async executeLoginOnly(config: { url: string; credentials: { username: string; password: string }; outputDir?: string }): Promise<{ success: boolean; method?: string; duration?: number; errors?: string[]; screenshots?: string[] }> {
    const orchestrationConfig: OrchestrationConfig = { maxRetries: 2, timeoutMinutes: 5, enableScreenshots: true, outputFormats: ['markdown'], targetUrl: config.url, outputDir: config.outputDir, stopAfterPhase: 'login', credentials: config.credentials };
    const result = await this.executeFullPipeline(orchestrationConfig);
    return { success: result.success, method: result.agentsExecuted.join(', '), duration: result.totalDuration, errors: result.errors, screenshots: [] };
  }
}

export default OrchestratorAgent;
