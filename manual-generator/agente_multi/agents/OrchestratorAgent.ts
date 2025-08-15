import { BaseAgent, AgentConfig, TaskData, TaskResult } from '../core/AgnoSCore';
import { MinIOService } from '../services/MinIOService';
import { LoginAgent } from './LoginAgent';
import { CrawlerAgent } from './CrawlerAgent';
import { AnalysisAgent } from './AnalysisAgent';
import { ContentAgent } from './ContentAgent';
import { GeneratorAgent } from './GeneratorAgent';
import { Browser, Page, chromium } from 'playwright';
import { ElementGroup } from './interfaces/CrawlerTypes';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface OrchestrationConfig {
  maxRetries: number;
  timeoutMinutes: number;
  enableScreenshots: boolean;
  outputFormats: ('markdown' | 'html' | 'pdf')[];
  targetUrl: string;
  credentials?: {
    username: string;
    password: string;
    loginUrl?: string;
    customSteps?: Array<{
      type: 'fill' | 'click' | 'wait' | 'waitForSelector';
      selector: string;
      value?: string;
      timeout?: number;
    }>;
  };
  authConfig?: {
    type: 'basic' | 'oauth' | 'custom';
    credentials?: {
      username?: string;
      password?: string;
      customFlow?: any;
    };
  };
}

export interface OrchestrationResult {
  success: boolean;
  executionId: string;
  startTime: Date;
  endTime: Date;
  totalDuration: number;
  agentsExecuted: string[];
  documentsGenerated: {
    markdown?: string;
    html?: string;
    pdf?: string;
  };
  statistics: {
    pagesProcessed: number;
    elementsAnalyzed: number;
    totalElements: number;
    screenshotsCaptured: number;
    wordCount: number;
  };
  reports: {
    [agentName: string]: string;
  };
  errors: string[];
}

export class OrchestratorAgent extends BaseAgent {
  private minioService: MinIOService;
  private agents: Map<string, BaseAgent> = new Map();
  private browser: Browser | null = null;
  private page: Page | null = null;
  private currentExecution: OrchestrationResult | null = null;

  protected override log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const emoji = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
    console.log(`${emoji} [${this.agentConfig.name}] ${timestamp} - ${message}`);
  }

  private async saveAgentLog(agentName: string, type: 'input' | 'output' | 'ai_response', data: any): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const logDir = path.join(process.cwd(), 'output', 'agent_logs');
      await fs.mkdir(logDir, { recursive: true });
      
      const filename = `${agentName}_${type}_${timestamp}.md`;
      const filepath = path.join(logDir, filename);
      
      let content = `# ${agentName} - ${type.toUpperCase()}\n\n`;
      content += `**Timestamp:** ${new Date().toISOString()}\n\n`;
      
      if (type === 'input') {
        content += `## Dados de Entrada\n\n`;
        content += `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n`;
      } else if (type === 'output') {
        content += `## Dados de Saída\n\n`;
        content += `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n`;
      } else if (type === 'ai_response') {
        content += `## Resposta da IA\n\n`;
        if (typeof data === 'string') {
          content += data;
        } else {
          content += `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n`;
        }
      }
      
      await fs.writeFile(filepath, content, 'utf-8');
      this.log(`📝 Log salvo: ${filename}`);
    } catch (error) {
      this.log(`❌ Erro ao salvar log: ${error}`, 'error');
    }
  }

  private readonly agentConfig: AgentConfig;

  constructor() {
    const config: AgentConfig = {
      name: 'OrchestratorAgent',
      version: '1.0.0',
      description: 'Agente orquestrador que coordena todo o pipeline de geração de manuais',
      capabilities: [
        { name: 'agent_coordination', description: 'Coordenação de múltiplos agentes especializados', version: '1.0.0' },
        { name: 'pipeline_management', description: 'Gerenciamento do pipeline de execução', version: '1.0.0' },
        { name: 'error_recovery', description: 'Recuperação de erros e retry automático', version: '1.0.0' },
        { name: 'execution_monitoring', description: 'Monitoramento em tempo real da execução', version: '1.0.0' },
        { name: 'result_aggregation', description: 'Agregação de resultados de múltiplos agentes', version: '1.0.0' }
      ]
    };

    super(config);
    this.agentConfig = config;
    this.minioService = new MinIOService();
    this.initializeAgents();
  }

  async initialize(): Promise<void> {
    await this.minioService.initialize();
    
    // Inicializar browser
    this.browser = await chromium.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Configurar agentes com recursos compartilhados
    if (this.page) {
      (this.agents.get('CrawlerAgent') as CrawlerAgent)?.setPage(this.page);
      (this.agents.get('CrawlerAgent') as CrawlerAgent)?.setBrowser(this.browser);
      (this.agents.get('LoginAgent') as LoginAgent)?.setPage(this.page);
    }

    this.log('OrchestratorAgent inicializado - pronto para orquestrar pipeline completo');
  }

  private async loadPrompt(path: string): Promise<string> {
    const fs = await import('fs/promises');
    try {
      const content = await fs.readFile(path, 'utf-8');
      return content.replace('# Prompt para', '').trim();
    } catch (error) {
      this.log(`Erro ao carregar prompt de ${path}: ${error}`, 'error');
      return '';
    }
  }

  private async initializeAgents(): Promise<void> {
    const path = await import('path');
    
    // Use relative paths from current working directory
    const promptsDir = path.resolve('./prompts');

    // Load prompts
    const analysisPrompt = await this.loadPrompt(`${promptsDir}/analysis.prompt.txt`);
    const contentPrompt = await this.loadPrompt(`${promptsDir}/content.prompt.txt`);
    const generatorPrompt = await this.loadPrompt(`${promptsDir}/generator.prompt.txt`);

    this.agents.set('LoginAgent', new LoginAgent());
    this.agents.set('CrawlerAgent', new CrawlerAgent());
    this.agents.set('AnalysisAgent', new AnalysisAgent(analysisPrompt));
    this.agents.set('ContentAgent', new ContentAgent(contentPrompt));
    this.agents.set('GeneratorAgent', new GeneratorAgent(generatorPrompt));

    // Inicializar todos os agentes
    const agentEntries = Array.from(this.agents.entries());
    for (const [name, agent] of agentEntries) {
      try {
        await agent.initialize();
        this.log(`Agente ${name} inicializado com sucesso`);
      } catch (error: any) {
        this.log(`Erro ao inicializar ${name}: ${error}`, 'error');
      }
    }
  }

  async processTask(task: TaskData): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      switch (task.type) {
        case 'generate_manual':
          return await this.handleManualGeneration(task);
        
        case 'execute_full_pipeline':
          return await this.handleFullPipelineExecution(task);
        
        case 'generation_complete':
          return await this.handleGenerationComplete(task);
          
        case 'execute_partial_pipeline':
          return await this.handlePartialPipelineExecution(task);
          
        default:
          throw new Error(`Tipo de tarefa não suportada: ${task.type}`);
      }

    } catch (error) {
      return {
        id: task.id,
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };
    }
  }

  private async handleManualGeneration(task: TaskData): Promise<TaskResult> {
    const { targetUrl, outputFormats, enableScreenshots, authConfig, maxRetries, timeoutMinutes } = task.data;
    
    this.log(`📖 Iniciando geração de manual: ${targetUrl}`);
    
    const config: OrchestrationConfig = {
      maxRetries: maxRetries || 3,
      timeoutMinutes: timeoutMinutes || 10,
      enableScreenshots: enableScreenshots || true,
      outputFormats: outputFormats || ['markdown'],
      targetUrl: targetUrl,
      authConfig: authConfig
    };
    
    try {
      const result = await this.executeFullPipeline(config);
      
      return {
        id: task.id,
        taskId: task.id,
        success: result.success,
        data: {
          documents: result.documentsGenerated,
          executionId: result.executionId,
          duration: result.totalDuration,
          agentsExecuted: result.agentsExecuted,
          statistics: result.statistics
        },
        timestamp: new Date(),
        processingTime: result.totalDuration
      };
      
    } catch (error) {
      this.log(`❌ Erro na geração de manual: ${error}`, 'error');
      
      return {
        id: task.id,
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        processingTime: 0
      };
    }
  }

  async executeFullPipeline(config: OrchestrationConfig): Promise<OrchestrationResult> {
    const executionId = `exec_${Date.now()}`;
    const startTime = new Date();
    
    this.log(`🚀 Iniciando pipeline completo de geração de manual - ID: ${executionId}`);

    const result: OrchestrationResult = {
      success: false,
      executionId,
      startTime,
      endTime: new Date(),
      totalDuration: 0,
      agentsExecuted: [],
      documentsGenerated: {},
      statistics: {
        pagesProcessed: 0,
        elementsAnalyzed: 0,
        totalElements: 0,
        screenshotsCaptured: 0,
        wordCount: 0
      },
      reports: {},
      errors: []
    };

    this.currentExecution = result;

    try {
      this.log('Início do pipeline', 'info');
      this.log(JSON.stringify(config, null, 2));
      let sessionData = null;
      let authContext = null;

      // FASE 1: Login e Autenticação (apenas se necessário)
      if (config.credentials || config.authConfig) {
        this.log('📋 FASE 1: Executando LoginAgent com credenciais fornecidas');
        const loginCredentials = config.credentials || (config.authConfig?.credentials ? {
          username: config.authConfig.credentials.username || '',
          password: config.authConfig.credentials.password || '',
          loginUrl: config.targetUrl,
          customSteps: [
            { type: 'fill' as const, selector: 'input[type="text"]', value: config.authConfig.credentials.username },
            { type: 'fill' as const, selector: 'input[type="password"]', value: config.authConfig.credentials.password },
            { type: 'click' as const, selector: 'button[type="submit"]' },
            { type: 'wait' as const, selector: '', timeout: 3000 }
          ]
        } : undefined);

        this.log('📋 FASE 1: Executando LoginAgent');
        const loginResult = await this.executeAgentTask('LoginAgent', 'authenticate', {
          credentials: loginCredentials,
          page: this.page
        });

        if (!loginResult.success) {
          throw new Error(`LoginAgent falhou: ${loginResult.error}`);
        }

        result.agentsExecuted.push('LoginAgent');
        result.reports['LoginAgent'] = await this.agents.get('LoginAgent')!.generateMarkdownReport(loginResult);
        sessionData = loginResult.data?.sessionData;
        authContext = {
          loginScreenshot: loginResult.data?.loginScreenshot,
          postLoginScreenshot: loginResult.data?.postLoginScreenshot,
          authType: config.authConfig?.type || 'basic'
        };
      } else {
        this.log('⏭️ FASE 1: Pulando LoginAgent - autenticação não necessária');
      }

      // FASE 2: Crawling e Captura
      this.log('🕷️ FASE 2: Executando CrawlerAgent');
      
      // Capturar URL atual após login (se houve login)
      let crawlUrl = config.targetUrl;
      if (this.page && (config.credentials || config.authConfig)) {
        try {
          // Aguardar um pouco para garantir que a navegação pós-login foi concluída
          await this.page.waitForTimeout(2000);
          crawlUrl = this.page.url();
          this.log(`📍 URL atual após login: ${crawlUrl}`);
          
          // Se ainda estiver na página de login, tentar navegar para dashboard
          if (crawlUrl.includes('signin') || crawlUrl.includes('login')) {
            this.log('⚠️ Ainda na página de login, tentando navegar para dashboard...');
            try {
              // Tentar encontrar e clicar em links de dashboard/home
              const dashboardSelectors = [
                'a[href*="dashboard"]',
                'a[href*="home"]',
                'a[href*="inicio"]',
                '.nav-link[href*="dashboard"]',
                '.menu-item[href*="dashboard"]'
              ];
              
              for (const selector of dashboardSelectors) {
                const element = await this.page.$(selector);
                if (element) {
                  await element.click();
                  await this.page.waitForTimeout(3000);
                  crawlUrl = this.page.url();
                  this.log(`📍 Navegado para: ${crawlUrl}`);
                  break;
                }
              }
            } catch (navError) {
              this.log(`⚠️ Erro ao navegar para dashboard: ${navError}`, 'warn');
            }
          }
        } catch (error) {
          this.log(`⚠️ Erro ao capturar URL pós-login: ${error}`, 'warn');
        }
      }
      
      const crawlerResult = await this.executeAgentTask('CrawlerAgent', 'start_crawl', {
        url: crawlUrl,
        sessionData: sessionData,
        authContext: authContext,
        enableScreenshots: config.enableScreenshots,
        page: this.page
      });

      if (!crawlerResult.success) {
        throw new Error(`CrawlerAgent falhou: ${crawlerResult.error}`);
      }

      result.agentsExecuted.push('CrawlerAgent');
      result.reports['CrawlerAgent'] = await this.agents.get('CrawlerAgent')!.generateMarkdownReport(crawlerResult);
      
      if (!result.statistics) {
        result.statistics = {
          pagesProcessed: 1,
          elementsAnalyzed: 0,
          totalElements: 0,
          screenshotsCaptured: 0,
          wordCount: 0
        };
      }

      try {
        // Processa dados do CrawlerAgent e ajusta estrutura
        if (!crawlerResult.data) {
          this.log('ERRO: crawlerResult.data está undefined!', 'error');
          throw new Error('Crawler result missing data');
        }

        

        // Garantir robustez ao acessar stats
        let totalElements = 0;
        if (crawlerResult.data && typeof crawlerResult.data === 'object') {
          if (crawlerResult.data.stats && typeof crawlerResult.data.stats.totalElements === 'number') {
            totalElements = crawlerResult.data.stats.totalElements;
          } else {
            this.log('AVISO: stats ou totalElements ausente em crawlerResult.data', 'warn');

          }
        } else {
          this.log('AVISO: crawlerResult.data não é um objeto esperado', 'warn');
        }

        const stats = {
          pagesProcessed: 1,
          elementsAnalyzed: totalElements,
          totalElements: totalElements,
          screenshotsCaptured: 0,
          wordCount: 0
        };

        // Atualiza as estatísticas no resultado
        result.statistics = stats;

        this.log(`📊 Estatísticas atualizadas: ${JSON.stringify(stats)}`);

      } catch (error) {
        this.log(`ERRO ao processar dados do crawler: ${error}`, 'error');
        if (error instanceof Error && error.stack) {
          this.log(`STACK: ${error.stack}`, 'error');
        }
        console.error('Error processing crawler data:', error);
        throw error;
      }

      // FASE 3: Análise com IA
  this.log('🧠 FASE 3: Executando AnalysisAgent');
  this.log('Executando análise dos dados coletados', 'info');
  this.log(JSON.stringify(result.statistics));
      
      // Garantir que temos os dados mínimos necessários
      const crawlerData = crawlerResult.data || {};
      
      // Criar objeto com campos padrão
      const elements = crawlerData.elements || [];
      
      // Construir resultado estruturado manualmente
      const structuredResults = {
        url: crawlerData.url,
        title: crawlerData.title,
        elements: elements,
        workflows: crawlerData.workflows || [],
        stats: crawlerData.stats || {
          staticElements: elements.filter((e: ElementGroup) => e.primary.isStatic).length,
          interactiveElements: elements.filter((e: ElementGroup) => !e.primary.isStatic).length,
          totalElements: elements.length
        },
        metadata: crawlerData.metadata || {
          timestamp: new Date().toISOString(),
          loadTime: 0,
          elementCount: elements.length
        }
      };
      
      const analysisResult = await this.executeAgentTask('AnalysisAgent', 'analyze_crawl_data', {
  crawlResults: [structuredResults],
        sessionData: sessionData,
        authContext: authContext
      });

      if (!analysisResult.success) {
        throw new Error(`AnalysisAgent falhou: ${analysisResult.error}`);
      }

      result.agentsExecuted.push('AnalysisAgent');
      result.reports['AnalysisAgent'] = await this.agents.get('AnalysisAgent')!.generateMarkdownReport(analysisResult);

      // FASE 4: Geração de Conteúdo User-Friendly
      this.log('📝 FASE 4: Executando ContentAgent');
      const contentResult = await this.executeAgentTask('ContentAgent', 'generate_user_friendly_content', {
        crawlAnalysis: analysisResult.data,
        sessionData: sessionData,
        authContext: authContext,
        rawData: structuredResults
      });

      if (!contentResult.success) {
        throw new Error(`ContentAgent falhou: ${contentResult.error}`);
      }

      result.agentsExecuted.push('ContentAgent');
      result.reports['ContentAgent'] = await this.agents.get('ContentAgent')!.generateMarkdownReport(contentResult);

      // FASE 5: Geração de Documentos Finais
      this.log('📄 FASE 5: Executando GeneratorAgent');
      const generatorResult = await this.executeAgentTask('GeneratorAgent', 'generate_final_documents', {
        userContent: contentResult.data,
        crawlAnalysis: analysisResult.data,
        sessionData: sessionData,
        authContext: authContext,
        rawData: structuredResults
      });

      if (!generatorResult.success) {
        throw new Error(`GeneratorAgent falhou: ${generatorResult.error}`);
      }

      result.agentsExecuted.push('GeneratorAgent');
      result.reports['GeneratorAgent'] = await this.agents.get('GeneratorAgent')!.generateMarkdownReport(generatorResult);

      // Agregação dos resultados finais
      if (generatorResult.data) {
        result.documentsGenerated = {
          markdown: generatorResult.data.minioUrls?.markdown,
          html: generatorResult.data.minioUrls?.html,
          pdf: generatorResult.data.minioUrls?.pdf
        };
        result.statistics.wordCount = generatorResult.data.metadata?.wordCount || 0;
      }

      result.success = true;
      result.endTime = new Date();
      result.totalDuration = result.endTime.getTime() - result.startTime.getTime();

      this.log(`✅ Pipeline completo executado com SUCESSO em ${result.totalDuration}ms`);
      this.log(`📊 Estatísticas: ${result.statistics.pagesProcessed} páginas, ${result.statistics.elementsAnalyzed} elementos, ${result.statistics.wordCount} palavras`);

      // Gerar relatório final consolidado
      await this.generateFinalReport(result);

    } catch (error) {
      // Captura de erro detalhada do pipeline global
      this.log('❌ [GLOBAL CATCH] Pipeline falhou!', 'error');
      if (error instanceof Error && error.stack) {
        this.log(`STACK TRACE: ${error.stack}`, 'error');
      }
      result.errors.push(error instanceof Error ? error.message : String(error));
      result.endTime = new Date();
      result.totalDuration = result.endTime.getTime() - result.startTime.getTime();
      this.log(`❌ Pipeline falhou: ${error}`, 'error');
      await this.generateErrorReport(result, error);
    }

    this.currentExecution = result;
    return result;
  }

  private async executeAgentTask(agentName: string, taskType: string, data: any): Promise<TaskResult> {
    const agent = this.agents.get(agentName);
    if (!agent) {
      throw new Error(`Agente ${agentName} não encontrado`);
    }

    const taskData: TaskData = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: taskType,
      data,
      priority: 'high',
      timestamp: new Date(),
      sender: 'OrchestratorAgent'
    };

    this.log(`🔄 Executando ${agentName}.${taskType}`);
    
    // Salvar dados de entrada
    await this.saveAgentLog(agentName, 'input', {
      taskType,
      data,
      timestamp: new Date().toISOString()
    });
    
    try {
      const result = await agent.processTask(taskData);
      
      // Salvar dados de saída
      await this.saveAgentLog(agentName, 'output', {
        success: result.success,
        data: result.data,
        error: result.error,
        timestamp: new Date().toISOString()
      });
      
      if (result.success) {
        this.log(`✅ ${agentName} concluído com sucesso`);
      } else {
        this.log(`❌ ${agentName} falhou: ${result.error}`, 'error');
      }
      
      return result;
      
    } catch (error) {
      this.log(`💥 Erro crítico em ${agentName}: ${error}`, 'error');
      return {
        id: taskData.id,
        taskId: taskData.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        processingTime: 0
      };
    }
  }

  private async handleFullPipelineExecution(task: TaskData): Promise<TaskResult> {
    const { config } = task.data;
    const startTime = Date.now();

    try {
      const result = await this.executeFullPipeline(config as OrchestrationConfig);

      return {
        id: task.id,
        taskId: task.id,
        success: result.success,
        data: result,
        timestamp: new Date(),
        processingTime: Date.now() - startTime,
        error: result.errors.length > 0 ? result.errors.join('; ') : undefined
      };

    } catch (error) {
      throw error;
    }
  }

  private async handleGenerationComplete(task: TaskData): Promise<TaskResult> {
    const { documents } = task.data;
    const startTime = Date.now();

    this.log('🎉 Recebida notificação de geração completa');

    // Atualizar execução atual com os documentos gerados
    if (this.currentExecution) {
      this.currentExecution.documentsGenerated = {
        markdown: documents.minioUrls?.markdown,
        html: documents.minioUrls?.html,
        pdf: documents.minioUrls?.pdf
      };
      
      if (documents.metadata) {
        this.currentExecution.statistics.wordCount = documents.metadata.wordCount;
      }
    }

    return {
      id: task.id,
      taskId: task.id,
      success: true,
      data: { acknowledged: true },
      timestamp: new Date(),
      processingTime: Date.now() - startTime
    };
  }

  private async handlePartialPipelineExecution(task: TaskData): Promise<TaskResult> {
    // Para futuras implementações de pipeline parcial
    const startTime = Date.now();
    
    return {
      id: task.id,
      taskId: task.id,
      success: false,
      error: 'Pipeline parcial não implementado ainda',
      timestamp: new Date(),
      processingTime: Date.now() - startTime
    };
  }

  private async generateFinalReport(result: OrchestrationResult): Promise<void> {
    const report = `# 🎉 Relatório Final - Sistema Multi-Agente de Geração de Manuais

## Execução ${result.executionId}

**Status:** ${result.success ? '✅ SUCESSO TOTAL' : '❌ FALHOU'}  
**Início:** ${result.startTime.toLocaleString('pt-BR')}  
**Fim:** ${result.endTime.toLocaleString('pt-BR')}  
**Duração Total:** ${(result.totalDuration / 1000).toFixed(2)}s

## 📊 Estatísticas Finais

- **Páginas Processadas:** ${result.statistics.pagesProcessed}
- **Elementos Analisados:** ${result.statistics.elementsAnalyzed}
- **Screenshots Capturados:** ${result.statistics.screenshotsCaptured}
- **Palavras no Manual:** ${result.statistics.wordCount}

## 🤖 Agentes Executados (${result.agentsExecuted.length}/5)

${result.agentsExecuted.map((agent, index) => `${index + 1}. ✅ ${agent}`).join('\n')}

## 📄 Documentos Gerados

${result.documentsGenerated.markdown ? `- **Markdown:** [Download](${result.documentsGenerated.markdown})` : '- **Markdown:** ❌ Não gerado'}
${result.documentsGenerated.html ? `- **HTML:** [Visualizar](${result.documentsGenerated.html})` : '- **HTML:** ❌ Não gerado'}
${result.documentsGenerated.pdf ? `- **PDF:** [Download](${result.documentsGenerated.pdf})` : '- **PDF:** ❌ Não gerado'}

## 🔗 Relatórios Individuais

${Object.entries(result.reports).map(([agent, url]) => `- **${agent}:** [Ver Relatório](${url})`).join('\n')}

## 🎯 Resumo do Pipeline

1. **LoginAgent** → Autenticação e captura de sessão ✅
2. **CrawlerAgent** → Navegação e captura de elementos ✅
3. **AnalysisAgent** → Análise inteligente com IA ✅
4. **ContentAgent** → Conteúdo user-friendly ✅
5. **GeneratorAgent** → Documentos finais ✅

## 💡 Conclusão

${result.success ? 
  `🎉 **PIPELINE EXECUTADO COM SUCESSO TOTAL!**

O sistema multi-agente funcionou perfeitamente, gerando documentação completa e profissional. Os manuais estão prontos para uso e disponíveis nos links acima.

### Próximos Passos:
- Downloads dos documentos nos formatos desejados
- Revisão do conteúdo gerado
- Feedback para melhorias futuras` :
  `❌ **PIPELINE FALHOU**

Erros encontrados: ${result.errors.join(', ')}

### Ações Recomendadas:
- Verificar logs dos agentes individuais
- Corrigir problemas identificados
- Executar novamente o pipeline`}

---

*Relatório gerado automaticamente pelo OrchestratorAgent em ${new Date().toLocaleString('pt-BR')}*
`;

    await this.minioService.uploadReportMarkdown(report, 'OrchestratorAgent', result.executionId);
    this.log('📋 Relatório final consolidado salvo no MinIO');
  }

  private async generateErrorReport(result: OrchestrationResult, error: any): Promise<void> {
    const report = `# ❌ Relatório de Erro - Pipeline Multi-Agente

## Execução ${result.executionId}

**Status:** FALHOU  
**Erro Principal:** ${error instanceof Error ? error.message : String(error)}  
**Duração até Falha:** ${(result.totalDuration / 1000).toFixed(2)}s

## Agentes Executados Antes da Falha (${result.agentsExecuted.length}/5)

${result.agentsExecuted.map((agent, index) => `${index + 1}. ✅ ${agent}`).join('\n')}

## Erros Detalhados

${result.errors.map((err, index) => `${index + 1}. ${err}`).join('\n')}

## Ações de Recuperação

1. Verificar logs individuais dos agentes
2. Verificar conectividade de rede
3. Verificar configurações das APIs (Gemini, MinIO)
4. Verificar permissões de arquivos
5. Tentar executar pipeline novamente

---

*Relatório de erro gerado em ${new Date().toLocaleString('pt-BR')}*
`;

    await this.minioService.uploadReportMarkdown(report, 'OrchestratorAgent', `${result.executionId}_ERROR`);
  }

  async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    const timestamp = new Date().toISOString();
    
    return `# Relatório do OrchestratorAgent

**Task ID:** ${taskResult.taskId}
**Timestamp:** ${timestamp}
**Status:** ${taskResult.success ? '✅ Sucesso' : '❌ Falha'}

${taskResult.success ? 
  `## ✅ Orquestração Concluída com Sucesso

O pipeline completo foi executado e todos os documentos foram gerados.` :
  `## ❌ Falha na Orquestração

**Erro:** ${taskResult.error}`}

Consulte o relatório final completo para detalhes.
`;
  }

  async cleanup(): Promise<void> {
    // Finalizar todos os agentes
    for (const [name, agent] of Array.from(this.agents.entries())) {
      try {
        if (agent.cleanup) {
          await agent.cleanup();
        }
        this.log(`Agente ${name} finalizado`);
      } catch (error) {
        this.log(`Erro ao finalizar ${name}: ${error}`, 'warn');
      }
    }

    // Fechar browser
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }

    this.agents.clear();
    this.currentExecution = null;
    this.log('OrchestratorAgent finalizado - todos os recursos liberados');
  }
}
