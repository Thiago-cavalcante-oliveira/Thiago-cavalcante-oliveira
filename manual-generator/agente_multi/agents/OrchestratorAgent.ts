/*
 * src/agents/OrchestratorAgent.ts (fallback Login → SmartLogin)
 * Orquestra login (com fallback automático para SmartLogin), crawl (MenuModalAgent), análise, conteúdo e geração.
 */

import { BaseAgent, AgentConfig, TaskData, TaskResult } from '../core/AgnoSCore';
import { MinIOService } from '../services/MinIOService';
import { LoginAgent } from './LoginAgent';
import { SmartLoginAgent } from './SmartLoginAgent';
import { CrawlerAgent } from './CrawlerAgent';
import { AnalysisAgent } from './AnalysisAgent';
import { ContentAgent } from './ContentAgent';
import { GeneratorAgent } from './GeneratorAgent';
import { MenuModalAgent } from './MenuModalAgent';
import { Timeline } from '../services/Timeline';
import { Browser, Page, chromium } from 'playwright';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

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
  private browser: Browser | null = null;
  private page: Page | null = null;

  private readonly agentConfig: AgentConfig;

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

    // registra agentes
    this.agents.set('LoginAgent', new LoginAgent());
    this.agents.set('SmartLoginAgent', new SmartLoginAgent());
    this.agents.set('CrawlerAgent', new CrawlerAgent());
    this.agents.set('AnalysisAgent', new AnalysisAgent(''));
    this.agents.set('ContentAgent', new ContentAgent(''));
    this.agents.set('GeneratorAgent', new GeneratorAgent(''));
    this.agents.set('MenuModalAgent', new MenuModalAgent({
      maxRetries: 2,
      timeoutMinutes: 5,
      enableScreenshots: true,
      outputFormats: ['markdown'],
      targetUrl: '',
      credentials: { username: '', password: '' }
    }, new Timeline()));
  }

  /**
   * Cria uma configuração padrão usando variáveis de ambiente
   */
  static createDefaultConfig(overrides: Partial<OrchestrationConfig> = {}): OrchestrationConfig {
    return {
      maxRetries: 2,
      timeoutMinutes: 15,
      enableScreenshots: true,
      outputFormats: ['markdown'],
      targetUrl: process.env.SAEB_URL || 'https://saeb-h1.pmfi.pr.gov.br/auth/signin',
      crawlingStrategy: 'advanced',
      credentials: {
        username: process.env.SAEB_USERNAME || 'admin',
        password: process.env.SAEB_PASSWORD || 'admin123',
        loginUrl: process.env.SAEB_URL || 'https://saeb-h1.pmfi.pr.gov.br/auth/signin'
      },
      ...overrides
    };
  }

  /**
   * Executa o pipeline completo usando configurações do ambiente
   */
  async executeWithEnvConfig(overrides: Partial<OrchestrationConfig> = {}): Promise<OrchestrationResult> {
    const config = OrchestratorAgent.createDefaultConfig(overrides);
    return this.executeFullPipeline(config);
  }

  protected override log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const emoji = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
    console.log(`${emoji} [${this.agentConfig.name}] ${timestamp} - ${message}`);
  }

  /**
   * Implementação obrigatória do método abstrato processTask
   */
  async processTask(task: TaskData): Promise<TaskResult> {
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
      
    } catch (error) {
      return {
        id: `result_${Date.now()}`,
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Implementação obrigatória do método abstrato generateMarkdownReport
   */
  async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    const { success, data, error, processingTime } = taskResult;
    
    let report = `# Relatório de Execução - OrchestratorAgent\n\n`;
    report += `**Status:** ${success ? '✅ Sucesso' : '❌ Falha'}\n`;
    report += `**Tempo de Processamento:** ${processingTime}ms\n`;
    report += `**Timestamp:** ${taskResult.timestamp.toISOString()}\n\n`;
    
    if (success && data) {
      report += `## Resultados\n\n`;
      
      if (data.agentsExecuted) {
        report += `**Agentes Executados:** ${data.agentsExecuted.join(', ')}\n`;
      }
      
      if (data.statistics) {
        report += `\n### Estatísticas\n`;
        report += `- Páginas processadas: ${data.statistics.pagesProcessed || 0}\n`;
        report += `- Elementos analisados: ${data.statistics.elementsAnalyzed || 0}\n`;
        report += `- Screenshots capturados: ${data.statistics.screenshotsCaptured || 0}\n`;
      }
      
      if (data.documentsGenerated) {
        report += `\n### Documentos Gerados\n`;
        Object.entries(data.documentsGenerated).forEach(([format, path]) => {
          if (path) report += `- ${format.toUpperCase()}: \`${path}\`\n`;
        });
      }
    }
    
    if (error) {
      report += `## Erro\n\n\`\`\`\n${error}\n\`\`\`\n`;
    }
    
    if (data?.errors && data.errors.length > 0) {
      report += `\n## Erros Adicionais\n\n`;
      data.errors.forEach((err: string, index: number) => {
        report += `${index + 1}. ${err}\n`;
      });
    }
    
    return report;
  }

  async initialize(): Promise<void> {
    await this.minioService.initialize?.();

    this.browser = await chromium.launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const context = await this.browser.newContext({ ignoreHTTPSErrors: true });
    this.page = await context.newPage();

    // propaga page/browser
    (this.agents.get('CrawlerAgent') as CrawlerAgent).setPage(this.page);
    (this.agents.get('CrawlerAgent') as CrawlerAgent).setBrowser(this.browser);
    (this.agents.get('LoginAgent') as any)?.setPage?.(this.page);
    (this.agents.get('SmartLoginAgent') as any)?.setPage?.(this.page);
    (this.agents.get('MenuModalAgent') as any)?.setPage?.(this.page);
    (this.agents.get('MenuModalAgent') as any)?.setBrowser?.(this.browser);

    this.log('OrchestratorAgent inicializado');
  }

  async cleanup(): Promise<void> {
    try { for (const [, agent] of this.agents) await agent.cleanup?.(); } catch { /* noop */ }
    if (this.browser) { await this.browser.close(); this.browser = null; }
    this.page = null;
    this.log('OrchestratorAgent finalizado');
  }

  getPage(): Page | null {
    return this.page;
  }

  getBrowser(): Browser | null {
    return this.browser;
  }

  getAgent(agentName: string): any {
    return this.agents.get(agentName);
  }

  async executeLoginOnly(config: { url: string; credentials: { username: string; password: string }; outputDir?: string }): Promise<{ success: boolean; method?: string; duration?: number; errors?: string[]; screenshots?: string[] }> {
    const orchestrationConfig: OrchestrationConfig = {
      maxRetries: 2,
      timeoutMinutes: 5,
      enableScreenshots: true,
      outputFormats: ['markdown'],
      targetUrl: config.url,
      outputDir: config.outputDir,
      stopAfterPhase: 'login',
      credentials: config.credentials
    };

    const result = await this.executeFullPipeline(orchestrationConfig);
    return {
      success: result.success,
      method: result.agentsExecuted.join(', '),
      duration: result.totalDuration,
      errors: result.errors,
      screenshots: []
    };
  }

  private async executeAgentTask(agentName: string, taskType: string, data: any): Promise<TaskResult> {
    const agent = this.agents.get(agentName);
    if (!agent) throw new Error(`Agente ${agentName} não encontrado`);

    // Integra MenuModalAgent ao Crawler
    if (agentName === 'CrawlerAgent') {
      const crawler = agent as CrawlerAgent;
      const menuModal = this.agents.get('MenuModalAgent');
      crawler.setMenuModalAgent(menuModal);
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

  private async loginWithFallback(config: OrchestrationConfig, result: OrchestrationResult) {
    if (!config.credentials?.username || !config.credentials?.password) {
      this.log('FASE 1: Login (opcional) - credenciais não fornecidas, pulando login');
      return { success: true, method: 'none' } as const;
    }

    this.log(`FASE 1: Login - tentando autenticação com usuário: ${config.credentials.username}`);
    const loginUrl = config.credentials.loginUrl || config.targetUrl;

    // 1) Tenta LoginAgent
    this.log('FASE 1: Login (LoginAgent) - primeira tentativa');
    try {
      const loginRes = await this.executeAgentTask('LoginAgent', 'authenticate', {
        credentials: config.credentials,
        loginUrl,
        page: this.page
      });
      result.agentsExecuted.push('LoginAgent');

      if (loginRes.success) {
        this.log('✅ LoginAgent: sucesso na autenticação');
        return { success: true, method: 'LoginAgent' } as const;
      }
      this.log(`⚠️ LoginAgent falhou: ${loginRes.error}`, 'warn');
    } catch (error) {
      this.log(`❌ LoginAgent erro: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }

    // 2) Fallback: SmartLoginAgent
    this.log('FASE 1: Fallback para SmartLoginAgent - segunda tentativa');
    try {
      const smartRes = await this.executeAgentTask('SmartLoginAgent', 'smart_login', {
        baseUrl: loginUrl,
        credentials: { username: config.credentials.username, password: config.credentials.password },
      });
      result.agentsExecuted.push('SmartLoginAgent');

      if (smartRes.success) {
        this.log('✅ SmartLoginAgent: sucesso na autenticação');
        return { success: true, method: 'SmartLoginAgent' } as const;
      }
      this.log(`⚠️ SmartLoginAgent falhou: ${smartRes.error}`, 'warn');
    } catch (error) {
      this.log(`❌ SmartLoginAgent erro: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }

    this.log('❌ FASE 1: Todos os métodos de login falharam, prosseguindo sem autenticação', 'warn');
    return { success: false, method: 'AllMethodsFailed' } as const;
  }

  async executeFullPipeline(config: OrchestrationConfig): Promise<OrchestrationResult> {
    const executionId = `exec_${Date.now()}`;
    const startTime = new Date();

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

    try {
      // FASE 1: Login com fallback
      const loginOutcome = await this.loginWithFallback(config, result);
      if (config.stopAfterPhase === 'login') {
        result.success = loginOutcome.success;
        result.endTime = new Date();
        result.totalDuration = result.endTime.getTime() - result.startTime.getTime();
        return result;
      }

      // FASE 2: Crawling (usar SEMPRE a targetUrl como start)
      this.log('FASE 2: Crawling');
      const startUrl = config.targetUrl;
      const crawlerRes = await this.executeAgentTask('CrawlerAgent', 'start_authenticated_crawl', {
        url: startUrl,
        enableScreenshots: config.enableScreenshots,
        useCurrentPage: true,
        crawlingStrategy: config.crawlingStrategy || 'basic',
        outputDir: config.outputDir || 'output'
      });

      if (!crawlerRes.success) throw new Error(`CrawlerAgent falhou: ${crawlerRes.error}`);
      result.agentsExecuted.push('CrawlerAgent');

      const payload = crawlerRes.data || {};
      const totalElements = payload.stats?.totalElements
        ?? (Array.isArray(payload.pages) ? payload.pages.reduce((a: number, p: any) => a + (p.elements?.length || 0), 0) : 0);

      result.statistics = {
        pagesProcessed: payload.stats?.pages ?? (payload.pages?.length ?? 1),
        elementsAnalyzed: totalElements,
        totalElements: totalElements,
        screenshotsCaptured: 0,
        wordCount: 0
      };

      if (config.stopAfterPhase === 'crawling') {
        this.log('Parando após crawling conforme solicitado.');
        result.success = true;
        result.endTime = new Date();
        result.totalDuration = result.endTime.getTime() - result.startTime.getTime();
        return result;
      }

      // FASE 3: Analysis
      this.log('FASE 3: Analysis');
      const analysisRes = await this.executeAgentTask('AnalysisAgent', 'analyze_crawl_data', { crawlResults: payload });
      if (!analysisRes.success) this.log(`AnalysisAgent aviso: ${analysisRes.error}`, 'warn');
      result.agentsExecuted.push('AnalysisAgent');

      // FASE 4: Content
      this.log('FASE 4: Content');
      const contentRes = await this.executeAgentTask('ContentAgent', 'generate_user_friendly_content', { crawlAnalysis: analysisRes.data || payload });
      if (!contentRes.success) this.log(`ContentAgent aviso: ${contentRes.error}`, 'warn');
      result.agentsExecuted.push('ContentAgent');

      // FASE 5: Generator
      this.log('FASE 5: Generator');
      const genRes = await this.executeAgentTask('GeneratorAgent', 'generate_final_documents', {
        userContent: contentRes.data || analysisRes.data || payload,
        crawlAnalysis: analysisRes.data || payload
      });
      if (!genRes.success) this.log(`GeneratorAgent aviso: ${genRes.error}`, 'warn');
      result.agentsExecuted.push('GeneratorAgent');

      if (genRes.data?.metadata?.wordCount) result.statistics.wordCount = genRes.data.metadata.wordCount;
      result.documentsGenerated = {
        markdown: genRes.data?.minioUrls?.markdown,
        html: genRes.data?.minioUrls?.html,
        pdf: genRes.data?.minioUrls?.pdf
      };

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
    }
  }
}

export default OrchestratorAgent;
