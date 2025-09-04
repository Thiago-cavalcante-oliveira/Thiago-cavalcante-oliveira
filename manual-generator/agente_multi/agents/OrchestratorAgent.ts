import { BaseAgent, AgentConfig, AgnoSCore, TaskData, TaskResult } from '../core/AgnoSCore.js';
import { MinIOService } from '../services/MinIOService.js';
import { LoginAgent } from './LoginAgent.js';
import { SmartLoginAgent } from './SmartLoginAgent.js';
import { CrawlerAgent } from './CrawlerAgent.js';
import { VisionAgent } from './VisionAgent.js';
import { AnalysisAgent } from './AnalysisAgent.js';
import { ContentAgent } from './ContentAgent.js';
import { GeneratorAgent } from './GeneratorAgent.js';
import { Browser, Page, chromium } from 'playwright';
import { env } from '../config/env.js';
import { Semaphore } from '../core/sem.js';
import { v4 as uuidv4 } from 'uuid';


// As interfaces podem ser movidas para um ficheiro de tipos dedicado (e.g., 'interfaces.ts')
export interface OrchestrationConfig {
  targetUrl: string;
  outputDir: string;
  maxRetries: number;
  timeoutMinutes: number;
  enableScreenshots: boolean;
  outputFormats: ('markdown' | 'html' | 'pdf')[];
  credentials?: {
    username: string;
    password: string;
    loginUrl?: string;
  };
}

export interface OrchestrationResult {
  success: boolean;
  executionId: string;
  startTime: Date;
  endTime: Date;
  totalDuration: number;
  agentsExecuted: string[];
  documentsGenerated: { markdown?: string; html?: string; pdf?: string };
  statistics: { pagesProcessed: number; elementsAnalyzed: number; screenshotsCaptured: number };
  errors: string[];
}

export class OrchestratorAgent extends BaseAgent {
  private minioService: MinIOService;
  private core: AgnoSCore;
  private semaphore: Semaphore;

  constructor() {
    const config: AgentConfig = {
      name: 'OrchestratorAgent',
      version: '2.1.0',
      description: 'Orquestra o pipeline de agentes, incluindo a capacidade de análise visual.',
      capabilities: [
        { name: 'pipeline_management', description: 'Gerencia o fluxo de execução completo.', version: '2.1.0' },
        { name: 'agent_coordination', description: 'Coordena tarefas entre agentes.', version: '2.1.0' },
      ]
    };
    // 1. Chamar super() primeiro
    super(config);

    // 2. Inicializar todas as propriedades
    this.minioService = new MinIOService();
    this.semaphore = new Semaphore(env.MAX_CONCURRENCY);
    this.core = new AgnoSCore();

    // 3. Chamar outros métodos
    this.registerAgents();
  }
  
  // Implementação dos métodos abstratos de BaseAgent
  async initialize(): Promise<void> {
    this.log('Inicializando OrchestratorAgent e seus serviços...');
    await this.minioService.initialize();
    await this.core.start(); // Iniciar o AgnoSCore
    for (const agent of this.core.getAgents()) {
        await agent.initialize();
    }
    this.log('OrchestratorAgent e todos os sub-agentes foram inicializados com sucesso.');
  }

  async cleanup(): Promise<void> {
    this.log('Finalizando OrchestratorAgent e todos os sub-agentes...');
    for (const agent of this.core.getAgents()) {
        await agent.cleanup();
    }
    await this.core.stop(); // Parar o AgnoSCore
    this.log('OrchestratorAgent finalizado.');
  }

  async processTask(task: TaskData): Promise<TaskResult> {
    this.log(`Tarefa recebida: ${task.type}.`);
    if (task.type !== 'execute_full_pipeline' || !task.data) {
        throw new Error('Tipo de tarefa inválido ou dados em falta para o OrchestratorAgent.');
    }
    const result = await this.executeFullPipeline(task.data as OrchestrationConfig);
    return {
      id: uuidv4(),
      taskId: task.id,
      success: result.success,
      data: result,
      timestamp: new Date(),
      processingTime: result.totalDuration
    };
  }

  async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    const result = taskResult.data as OrchestrationResult;
    if (!result) return "## Relatório de Orquestração\n\nNenhum resultado para reportar.";
    
    let report = `# Relatório de Orquestração\n\n- **ID da Execução:** ${result.executionId}\n- **Status:** ${result.success ? '✅ Sucesso' : '❌ Falha'}\n- **Duração:** ${result.totalDuration}ms\n`;
    if (result.agentsExecuted.length > 0) {
        report += `- **Agentes Executados:** ${result.agentsExecuted.join(', ')}\n`;
    }
    if (result.errors.length > 0) {
        report += `- **Erros:** ${result.errors.join(', ')}\n`;
    }
    return report;
  }
  
  private registerAgents(): void {
    const visionAgent = new VisionAgent();
    this.core.registerAgent(visionAgent);
    this.core.registerAgent(new CrawlerAgent(visionAgent));
    this.core.registerAgent(new LoginAgent({ name: 'LoginAgent', version: '1.0.0', description: 'Agente de login', capabilities: [{ name: 'login', description: 'Autenticação padrão', version: '1.0.0' }] }));
    this.core.registerAgent(new SmartLoginAgent({ name: 'SmartLoginAgent', version: '1.0.0', description: 'Agente de login inteligente', capabilities: [{ name: 'smart_login', description: 'Autenticação avançada', version: '1.0.0' }] }));
    this.core.registerAgent(new AnalysisAgent({ name: 'AnalysisAgent', version: '1.0.0', description: 'Análise de dados de crawling', capabilities: [{ name: 'data_analysis', description: 'Síntese de dados', version: '1.0.0' }] }));
    this.core.registerAgent(new ContentAgent(
      { name: 'ContentAgent', version: '1.0.0', description: 'Transforma dados técnicos em conteúdo user-friendly.', capabilities: [{ name: 'content_generation', description: 'Criação de conteúdo didático', version: '1.0.0' }] },
      this.minioService
    ));
this.core.registerAgent(new GeneratorAgent({ 
    name: 'GeneratorAgent', 
    version: '1.0.0', 
    description: 'Gerador de documentos', 
    capabilities: [{ name: 'document_generation', description: 'Criação de PDF/HTML', version: '1.0.0' }] 
}));  }

  static createDefaultConfig(overrides: Partial<OrchestrationConfig> = {}): OrchestrationConfig {
    const defaultConfig: OrchestrationConfig = {
      maxRetries: env.MAX_RETRIES,
      timeoutMinutes: 15,
      enableScreenshots: true,
      outputFormats: ['markdown'],
      targetUrl: env.SAEB_URL || '',
      outputDir: 'output',
      credentials: (env.SAEB_USERNAME && env.SAEB_PASSWORD) ? {
        username: env.SAEB_USERNAME,
        password: env.SAEB_PASSWORD,
      } : undefined,
    };
    return { ...defaultConfig, ...overrides };
  }

  public async executeFullPipeline(config: OrchestrationConfig): Promise<OrchestrationResult> {
    const executionId = `exec_${uuidv4()}`;
    const startTime = new Date();
    this.log(`Iniciando pipeline [${executionId}] para a URL: ${config.targetUrl}`);

    const result: OrchestrationResult = {
      success: false, executionId, startTime, endTime: new Date(), totalDuration: 0,
      agentsExecuted: [], documentsGenerated: {},
      statistics: { pagesProcessed: 0, elementsAnalyzed: 0, screenshotsCaptured: 0 },
      errors: []
    };
    
    await this.semaphore.acquire();
    let browser: Browser | undefined;
    try {
      this.log(`Lançando navegador...`);
      browser = await chromium.launch({ headless: env.HEADLESS === 'true' });
      const context = await browser.newContext();
      const page = await context.newPage();
      context.setDefaultTimeout(env.NAV_TIMEOUT_MS);
      
      // FASE 1: Login (se houver credenciais)
      if (config.credentials) {
        this.log("FASE 1: Autenticação");
        const loginRes = await this.core.executeTask('LoginAgent', 'authenticate', { page, credentials: { ...config.credentials, loginUrl: config.targetUrl } });
        if (!loginRes.success) {
            this.log("Login padrão falhou, a tentar SmartLogin...", "warn");
            const smartLoginRes = await this.core.executeTask('SmartLoginAgent', 'smart_login', { page, credentials: config.credentials, baseUrl: config.targetUrl });
            if (!smartLoginRes.success) throw new Error(`Autenticação falhou: ${smartLoginRes.error}`);
            result.agentsExecuted.push('SmartLoginAgent');
        } else {
            result.agentsExecuted.push('LoginAgent');
        }
      }

      // FASE 2: Crawling Visual
      this.log('FASE 2: Crawling Visual');
      const crawlerRes = await this.core.executeTask('CrawlerAgent', 'crawl_site', { targetUrl: config.targetUrl, page });
      if (!crawlerRes.success) throw new Error(`CrawlerAgent falhou: ${crawlerRes.error}`);
      result.agentsExecuted.push('CrawlerAgent');
      result.statistics.pagesProcessed = crawlerRes.data?.visitedPages?.length || 0;
      const crawlData = crawlerRes.data;

      // FASE 3: Análise
      this.log('FASE 3: Análise de Conteúdo');
      const analysisRes = await this.core.executeTask('AnalysisAgent', 'analyze_crawl_data', { crawlData });
      if(!analysisRes.success) throw new Error(`AnalysisAgent falhou: ${analysisRes.error}`);
      result.agentsExecuted.push('AnalysisAgent');
      const analysisData = analysisRes.data;

      // FASE 4: Geração de Conteúdo
      this.log('FASE 4: Geração de Conteúdo');
      const contentRes = await this.core.executeTask('ContentAgent', 'generate_content', { analysisData: analysisRes.data, crawlData });
      if (!contentRes.success) throw new Error(`ContentAgent falhou: ${contentRes.error}`);
      result.agentsExecuted.push('ContentAgent');
      const { markdownContent, analysisData: contentAnalysisData } = contentRes.data;

      // FASE 5: Geração de Documentos
      this.log('FASE 5: Geração de Documentos');
      const generatorRes = await this.core.executeTask('GeneratorAgent', 'generate_documents', { markdownContent, analysisData: contentAnalysisData });
      if(!generatorRes.success) throw new Error(`GeneratorAgent falhou: ${generatorRes.error}`);
      result.agentsExecuted.push('GeneratorAgent');
      result.documentsGenerated = generatorRes.data.filePaths;

      result.success = true;
    } catch (e: any) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      result.errors.push(errorMessage);
      this.log(`Pipeline falhou: ${errorMessage}`, 'error');
    } finally {
      if (browser) {
        this.log('Fechando o navegador...');
        await browser.close();
      }
      this.semaphore.release();
      result.endTime = new Date();
      result.totalDuration = result.endTime.getTime() - result.startTime.getTime();
      this.log(`Pipeline [${executionId}] finalizado em ${result.totalDuration}ms.`);
    }
    return result;
  }

  public async launchBrowser(): Promise<Browser> {
    this.log('Lançando navegador para exploração de página...');
    return await chromium.launch({ headless: env.HEADLESS === 'true' });
  }

  public async executePageExplore(config: { startUrl: string, outputDir: string, enableScreenshots: boolean, pageInstance: Page }): Promise<Partial<OrchestrationResult>> {
    this.log(`Iniciando exploração de página única: ${config.startUrl}`);
    const startTime = new Date();
    
    const crawlerResult = await this.core.executeTask('CrawlerAgent', 'crawl_site', {
      targetUrl: config.startUrl,
      page: config.pageInstance
    });

    const endTime = new Date();
    return {
      success: crawlerResult.success,
      startTime: startTime,
      endTime: endTime,
      totalDuration: endTime.getTime() - startTime.getTime(),
      agentsExecuted: ['CrawlerAgent'],
      statistics: {
        pagesProcessed: crawlerResult.data?.visitedPages?.length || 0,
        elementsAnalyzed: crawlerResult.data?.discoveredData?.[0]?.elements?.length || 0,
        screenshotsCaptured: crawlerResult.data?.discoveredData?.length || 0,
      },
      errors: crawlerResult.error ? [crawlerResult.error] : [],
    };
  }
}