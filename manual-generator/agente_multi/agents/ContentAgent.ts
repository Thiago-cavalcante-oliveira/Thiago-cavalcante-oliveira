import { BaseAgent, AgentConfig, TaskData, TaskResult } from '../core/AgnoSCore.js';
import { MinIOService } from '../services/MinIOService.js';
import { GeminiKeyManager } from '../services/GeminiKeyManager.js';
import { LLMManager } from '../services/LLMManager.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface UserGuideSection {
  id: string;
  title: string;
  description: string;
  steps: UserStep[];
  tips: string[];
  troubleshooting: string[];
  relatedSections: string[];
}

export interface UserStep {
  stepNumber: number;
  action: string;
  description: string;
  expectedResult: string;
  screenshot?: string;
  notes?: string[];
}

export interface UserManualContent {
  metadata: {
    title: string;
    subtitle: string;
    version: string;
    dateCreated: string;
    targetAudience: string;
    estimatedReadTime: string;
  };
  introduction: {
    overview: string;
    requirements: string[];
    howToUseManual: string;
  };
  sections: UserGuideSection[];
  appendices: {
    troubleshooting: UserTroubleshootingItem[];
    glossary: UserGlossaryItem[];
    faqs: UserFAQItem[];
  };
  summary: {
    keyTakeaways: string[];
    nextSteps: string[];
    supportContacts: string[];
  };
}

export interface UserTroubleshootingItem {
  problem: string;
  symptoms: string[];
  solutions: string[];
  prevention: string[];
}

export interface UserGlossaryItem {
  term: string;
  definition: string;
  example?: string;
}

export interface UserFAQItem {
  question: string;
  answer: string;
  category: string;
}

export class ContentAgent extends BaseAgent {
  private keyManager: GeminiKeyManager | null;
  private llmManager: LLMManager | null;
  private minioService: MinIOService;
  private currentContent: UserManualContent | null = null;
  private contentCacheFile: string;
  private prompt: string;
  private logDir: string;
  private logFile: string;
  private retryAttempts: number = 5;
  private retryDelay: number = 3000;

  private async logToFile(message: string, stage: string = 'content'): Promise<void> {
    try {
      if (!this.logDir) {
        console.error('Erro: logDir não está definido no ContentAgent.');
        return;
      }
      await fs.mkdir(this.logDir, { recursive: true });
      const logMsg = `[${new Date().toISOString()}][${stage}] ${message}\n`;
      await fs.appendFile(this.logFile, logMsg, 'utf-8');
    } catch (error) {
      console.error(`Erro ao salvar log: ${error}`);
    }
  }

  private async retryAICall<T>(operation: () => Promise<T>, operationName: string): Promise<T | null> {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        await this.logToFile(`Tentativa ${attempt}/${this.retryAttempts} para ${operationName}`);
        const result = await operation();
        await this.logToFile(`${operationName} executado com sucesso na tentativa ${attempt}`);
        return result;
      } catch (error) {
        await this.logToFile(`Erro na tentativa ${attempt}/${this.retryAttempts} para ${operationName}: ${error}`, 'error');
        if (attempt < this.retryAttempts) {
          const delay = this.retryDelay * attempt; // Backoff exponencial
          await this.logToFile(`Aguardando ${delay}ms antes da próxima tentativa`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    await this.logToFile(`Todas as tentativas falharam para ${operationName}, usando fallback`, 'error');
    return null;
  }

  constructor(prompt: string) {
    const config: AgentConfig = {
      name: 'ContentAgent',
      version: '1.0.0',
      description: 'Agente especializado na criação de conteúdo amigável para usuários',
      capabilities: [
        { name: 'content_generation', description: 'Geração de conteúdo user-friendly', version: '1.0.0' },
        { name: 'step_by_step_guides', description: 'Criação de guias passo a passo', version: '1.0.0' },
        { name: 'troubleshooting_guides', description: 'Criação de guias de solução de problemas', version: '1.0.0' },
        { name: 'user_experience_writing', description: 'Escrita focada na experiência do usuário', version: '1.0.0' },
        { name: 'content_organization', description: 'Organização lógica de conteúdo', version: '1.0.0' }
      ]
    };

    super(config);
    this.prompt = prompt;
    try {
      this.keyManager = new GeminiKeyManager();
      this.llmManager = new LLMManager(this.keyManager);
    } catch (error) {
      this.log('Não foi possível inicializar o GeminiKeyManager/LLMManager. O agente de conteúdo continuará sem as capacidades de IA.', 'warn');
      this.keyManager = null;
      this.llmManager = null;
    }
    this.minioService = new MinIOService();
    this.contentCacheFile = path.join(process.cwd(), 'output', 'content-draft.md');
    this.logDir = path.join(process.cwd(), 'output', 'logs');
    this.logFile = path.join(this.logDir, 'content-agent.log');
  }

  async initialize(): Promise<void> {
    await this.minioService.initialize();
    if (this.keyManager) {
      await this.keyManager.loadStatus();
    }
    this.log('ContentAgent inicializado para criação de conteúdo user-friendly');
    await this.logToFile('ContentAgent inicializado para criação de conteúdo user-friendly', 'init');
  }

  async processTask(task: TaskData): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      switch (task.type) {
        case 'generate_user_friendly_content':
          return await this.handleContentGeneration(task);
        
        case 'create_user_guide':
          return await this.handleUserGuideCreation(task);
          
        case 'optimize_content':
          return await this.handleContentOptimization(task);
          
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

  private async handleContentGeneration(task: TaskData): Promise<TaskResult> {
    const startTime = Date.now();
    const { crawlAnalysis, sessionData, authContext, rawData } = task.data;
    
    this.log('Iniciando geração de conteúdo user-friendly');

    try {
      // Criar conteúdo amigável baseado na análise
      const userContent = await this.generateUserFriendlyContent(crawlAnalysis, authContext, rawData);
      this.currentContent = userContent;

      // Enviar para o próximo agente
      this.sendTask('GeneratorAgent', 'generate_final_documents', {
        userContent,
        crawlAnalysis,
        sessionData,
        authContext,
        rawData
      }, 'high');

      return {
        id: task.id,
        taskId: task.id,
        success: true,
        data: userContent,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      this.log(`Erro na geração de conteúdo: ${error}`, 'error');
      throw error;
    }
  }

  private async handleUserGuideCreation(task: TaskData): Promise<TaskResult> {
    const { analysis, context } = task.data;
    const startTime = Date.now();

    try {
      const guide = await this.createSpecificUserGuide(analysis, context);

      return {
        id: task.id,
        taskId: task.id,
        success: true,
        data: guide,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      throw error;
    }
  }

  private async handleContentOptimization(task: TaskData): Promise<TaskResult> {
    const { content, feedback } = task.data;
    const startTime = Date.now();

    try {
      const optimized = await this.optimizeContent(content, feedback);

      return {
        id: task.id,
        taskId: task.id,
        success: true,
        data: optimized,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      throw error;
    }
  }

  private async generateUserGuideSections(crawlAnalysis: any, rawData: any[]): Promise<UserManualContent['sections']> {
    await this.logToFile('Iniciando geração de seções do guia', 'sections');
    
    if (!crawlAnalysis || !rawData) {
      this.log('AVISO: crawlAnalysis ou rawData estão undefined em generateUserGuideSections', 'warn');
      return this.getFallbackSections();
    }

    try {
      const prompt = `
Baseado nesta análise e dados brutos, gere seções para um manual do usuário:

ANÁLISE:
${JSON.stringify(crawlAnalysis, null, 2)}

DADOS BRUTOS (${rawData.length} itens):
${JSON.stringify(rawData.slice(0, 3), null, 2)}

Gere seções organizadas por funcionalidades principais.
`;

      const result = await this.retryAICall(
        () => this.llmManager.generateContent(prompt),
        'generateUserGuideSections'
      );

      if (result) {
        return this.parseAISections(result.response.text());
      }
    } catch (error) {
      this.log(`Erro ao gerar seções: ${error}`, 'error');
    }

    return this.getFallbackSections();
  }

  private getFallbackSections(): UserManualContent['sections'] {
    return [
      {
        title: 'Funcionalidades Básicas',
        content: 'Guia passo a passo para as funcionalidades básicas da aplicação.'
      }
    ];
  }

  private async generateAppendices(crawlAnalysis: any): Promise<UserManualContent['appendices']> {
    await this.logToFile('Iniciando geração de apêndices', 'appendices');
    
    if (!crawlAnalysis) {
      this.log('AVISO: crawlAnalysis está undefined em generateAppendices', 'warn');
      return this.getFallbackAppendices();
    }

    try {
      const prompt = `
Baseado nesta análise, gere apêndices úteis para um manual do usuário:

ANÁLISE:
${JSON.stringify(crawlAnalysis, null, 2)}

Gere apêndices como glossário, FAQ e informações técnicas.
`;

      const result = await this.retryAICall(
        () => this.llmManager.generateContent(prompt),
        'generateAppendices'
      );

      if (result) {
        return this.parseAIAppendices(result.response.text());
      }
    } catch (error) {
      this.log(`Erro ao gerar apêndices: ${error}`, 'error');
    }

    return this.getFallbackAppendices();
  }

  private getFallbackAppendices(): UserManualContent['appendices'] {
    return [
      {
        title: 'Glossário',
        content: 'Termos técnicos e suas definições.'
      }
    ];
  }

  private async generateSummary(crawlAnalysis: any): Promise<UserManualContent['summary']> {
    await this.logToFile('Iniciando geração de resumo', 'summary');
    
    if (!crawlAnalysis) {
      this.log('AVISO: crawlAnalysis está undefined em generateSummary', 'warn');
      return this.getFallbackSummary();
    }

    try {
      const prompt = `
Baseado nesta análise, gere um resumo conciso para o manual do usuário:

ANÁLISE:
${JSON.stringify(crawlAnalysis, null, 2)}

Gere um resumo que destaque os pontos principais.
`;

      const result = await this.retryAICall(
        () => this.llmManager.generateContent(prompt),
        'generateSummary'
      );

      if (result) {
        return {
          keyPoints: this.parseAISummary(result.response.text())
        };
      }
    } catch (error) {
      this.log(`Erro ao gerar resumo: ${error}`, 'error');
    }

    return this.getFallbackSummary();
  }

  private getFallbackSummary(): UserManualContent['summary'] {
    return {
      keyPoints: ['Este manual fornece orientações para utilizar a aplicação web.']
    };
  }

  private async generateUserFriendlyContent(crawlAnalysis: any, authContext: any, rawData: any[]): Promise<UserManualContent> {
    this.log('Gerando conteúdo estruturado para usuários finais');

    // Gerar metadados
    const metadata = await this.generateMetadata(crawlAnalysis);
    
    // Gerar introdução
    const introduction = await this.generateIntroduction(crawlAnalysis, authContext);
    
    // Gerar seções principais
    const sections = await this.generateUserGuideSections(crawlAnalysis, rawData);
    
    // Gerar apêndices
    const appendices = await this.generateAppendices(crawlAnalysis);
    
    // Gerar resumo
    const summary = await this.generateSummary(crawlAnalysis);

    const userContent: UserManualContent = {
      metadata,
      introduction,
      sections,
      appendices,
      summary
    };

    this.log(`Conteúdo gerado: ${sections.length} seções principais`);
    return userContent;
  }

  private async generateMetadata(analysis: any): Promise<UserManualContent['metadata']> {
    await this.logToFile('Iniciando geração de metadados', 'metadata');
    
    // Proteção extra e log
    if (!analysis) {
      this.log('AVISO: analysis está undefined em generateMetadata', 'warn');
    }
    if (typeof analysis?.totalElements !== 'number') {
      this.log('AVISO: analysis.totalElements não é um número em generateMetadata', 'warn');
      
    }
    const prompt = `
Baseado nesta análise de aplicação web, gere metadados para um manual do usuário:

ANÁLISE:
- Total de Páginas: ${analysis?.totalPages ?? 'N/A'}
- Total de Elementos: ${typeof analysis?.totalElements === 'number' ? analysis.totalElements : 0}
- Resumo: ${analysis?.summary ?? 'N/A'}
- Complexidade: ${analysis?.technicalInsights?.complexity ?? 'N/A'}

Gere metadados apropriados em formato JSON:
- title: Título atraente do manual
- subtitle: Subtítulo descritivo
- version: Versão (1.0.0)
- targetAudience: Público-alvo
- estimatedReadTime: Tempo estimado de leitura

Foque em linguagem clara e acessível para usuários finais.
`;

    const result = await this.retryAICall(
      () => {
        if (!this.llmManager) {
          this.llmManager = new LLMManager(this.keyManager);
        }
        return this.llmManager.generateContent(prompt);
      },
      'generateMetadata'
    );
    
    if (result) {
      try {
        const aiMetadata = this.parseAIResponse(result.response.text());
        await this.logToFile('Metadados gerados com sucesso via IA', 'metadata');
        return {
          title: aiMetadata.title || 'Manual do Usuário',
          subtitle: aiMetadata.subtitle || 'Guia completo de utilização',
          version: aiMetadata.version || '1.0.0',
          dateCreated: new Date().toLocaleDateString('pt-BR'),
          targetAudience: aiMetadata.targetAudience || 'Usuários finais',
          estimatedReadTime: aiMetadata.estimatedReadTime || '15-20 minutos'
        };
      } catch (parseError) {
        await this.logToFile(`Erro ao parsear resposta da IA: ${parseError}`, 'error');
      }
    }
    
    // Fallback
    await this.logToFile('Usando metadados de fallback', 'metadata');
    return this.getFallbackMetadata();
  }

  private getFallbackMetadata(): UserManualContent['metadata'] {
    return {
      title: 'Manual do Usuário - Aplicação Web',
      subtitle: 'Guia completo para utilização da aplicação',
      version: '1.0.0',
      dateCreated: new Date().toLocaleDateString('pt-BR'),
      targetAudience: 'Usuários finais da aplicação web',
      estimatedReadTime: '15-20 minutos'
    };
  }

  private getFallbackIntroduction(): UserManualContent['introduction'] {
    return {
      overview: 'Este manual fornece um guia completo para a utilização da aplicação web.',
      requirements: 'Nenhum requisito especial. Acesso à internet e um navegador web moderno são suficientes.',
      howToUseManual: 'Navegue pelas seções para encontrar informações sobre funcionalidades específicas.'
    };
  }

  private async generateIntroduction(analysis: any, authContext: any): Promise<UserManualContent['introduction']> {
    await this.logToFile('Iniciando geração de introdução', 'introduction');
    
    if (!analysis) {
      this.log('AVISO: analysis está undefined em generateIntroduction. Usando fallback.', 'warn');
      return this.getFallbackIntroduction();
    }

    const prompt = `
Crie uma introdução amigável para um manual do usuário baseado nesta análise:

ANÁLISE:
${analysis.summary ?? 'N/A'}

FUNCIONALIDADES PRINCIPAIS:
${analysis.keyFunctionalities?.join(', ') ?? 'N/A'}

CONTEXTO DE AUTENTICAÇÃO:
${authContext?.authType || 'Não requer autenticação'}

Crie uma introdução que inclua:
1. overview: Visão geral da aplicação
2. requirements: Requisitos necessários
3. howToUseManual: Como usar este manual

Use linguagem simples e acolhedora. Responda em JSON.
`;

    const result = await this.retryAICall(
      () => {
        if (!this.llmManager) {
          this.llmManager = new LLMManager(this.keyManager);
        }
        return this.llmManager.generateContent(prompt);
      },
      'generateIntroduction'
    );
    
    if (result) {
      try {
        const aiIntro = this.parseAIResponse(result.response.text());
        await this.logToFile('Introdução gerada com sucesso via IA', 'introduction');
        return {
          overview: aiIntro.overview || 'Esta aplicação web oferece diversas funcionalidades para melhorar sua experiência digital.',
          requirements: aiIntro.requirements || ['Navegador web atualizado', 'Conexão com internet', 'Dados de acesso (se necessário)'],
          howToUseManual: aiIntro.howToUseManual || 'Este manual está organizado em seções que cobrem desde o acesso inicial até as funcionalidades avançadas. Cada seção inclui instruções passo a passo com capturas de tela.'
        };
      } catch (parseError) {
        await this.logToFile(`Erro ao parsear resposta da IA: ${parseError}`, 'error');
      }
    }
    
    // Fallback
    await this.logToFile('Usando introdução de fallback', 'introduction');
    return {
      overview: 'Esta aplicação web foi projetada para oferecer uma experiência intuitiva e eficiente. Este manual irá guiá-lo através de todas as funcionalidades disponíveis.',
      requirements: ['Navegador web moderno (Chrome, Firefox, Safari, Edge)', 'Conexão estável com a internet', 'Credenciais de acesso quando aplicável'],
      howToUseManual: 'Este manual está dividido em seções temáticas. Cada seção contém instruções detalhadas, screenshots e dicas úteis. Você pode navegar diretamente para a seção de seu interesse ou seguir sequencialmente.'
    };
  }

  private async generateUserGuideSections(crawlAnalysis: any, rawData: any[]): Promise<UserManualContent['sections']> {
    await this.logToFile('Iniciando geração de seções do guia', 'sections');
    
    if (!crawlAnalysis) {
      this.log('AVISO: crawlAnalysis está undefined em generateUserGuideSections. Usando fallback.', 'warn');
      return this.getFallbackSections();
    }

    const prompt = `
Baseado nesta análise de aplicação web, gere seções detalhadas para um manual do usuário:

ANÁLISE:
${crawlAnalysis.summary ?? 'N/A'}

DADOS CRUS:
${rawData?.length ? JSON.stringify(rawData.slice(0, 5), null, 2) : 'N/A'}

Gere seções em formato JSON com:
- title: Título da seção
- content: Conteúdo detalhado
- examples: Exemplos de uso (se aplicável)
- warnings: Avisos importantes (se aplicável)

Foque em explicar funcionalidades principais de forma clara e passo a passo.
`;

    const result = await this.retryAICall(
      () => {
        if (!this.llmManager) {
          this.llmManager = new LLMManager(this.keyManager);
        }
        return this.llmManager.generateContent(prompt);
      },
      'generateSections'
    );
    
    if (result) {
      try {
        const aiSections = this.parseAIResponse(result.response.text());
        await this.logToFile(`Seções geradas: ${aiSections.length}`, 'sections');
        return aiSections;
      } catch (parseError) {
        await this.logToFile(`Erro ao parsear seções: ${parseError}`, 'error');
        return this.getFallbackSections();
      }
    }
    
    // Fallback
    await this.logToFile('Usando seções de fallback', 'sections');
    return this.getFallbackSections();
  }

  private getFallbackSections(): UserManualContent['sections'] {
    return [
      {
        title: 'Funcionalidade Principal',
        content: 'Esta seção descreve como usar a funcionalidade principal da aplicação.',
        examples: ['Exemplo 1', 'Exemplo 2'],
        warnings: ['Aviso importante sobre uso']
      }
    ];
  }

  private async generateLoginSection(analysis: any): Promise<UserGuideSection> {
    return {
      id: 'login_access',
      title: 'Acessando a Aplicação',
      description: 'Como fazer login e acessar a aplicação pela primeira vez',
      steps: [
        {
          stepNumber: 1,
          action: 'Abrir o navegador',
          description: 'Abra seu navegador web preferido (Chrome, Firefox, Safari ou Edge)',
          expectedResult: 'O navegador deve estar funcionando normalmente'
        },
        {
          stepNumber: 2,
          action: 'Navegar para a aplicação',
          description: 'Digite o endereço da aplicação na barra de endereços',
          expectedResult: 'A página de login deve aparecer'
        },
        {
          stepNumber: 3,
          action: 'Inserir credenciais',
          description: 'Digite seu usuário e senha nos campos apropriados',
          expectedResult: 'Os campos devem ser preenchidos com suas informações'
        },
        {
          stepNumber: 4,
          action: 'Fazer login',
          description: 'Clique no botão de login para acessar a aplicação',
          expectedResult: 'Você deve ser redirecionado para a página principal'
        }
      ],
      tips: [
        'Mantenha suas credenciais seguras',
        'Use uma senha forte e única',
        'Se esquecer a senha, procure a opção "Esqueci minha senha"'
      ],
      troubleshooting: [
        'Se não conseguir fazer login, verifique se as credenciais estão corretas',
        'Certifique-se de que a tecla Caps Lock não está ativada',
        'Tente limpar o cache do navegador se houver problemas'
      ],
      relatedSections: ['navigation_basics', 'user_account']
    };
  }

  private async generatePageSection(pageAnalysis: any, rawData: any[]): Promise<UserGuideSection | null> {
    if (!pageAnalysis.elementAnalyses || pageAnalysis.elementAnalyses.length === 0) {
      return null;
    }

    const prompt = `
Crie uma seção do manual do usuário baseada nesta página:

PÁGINA: ${pageAnalysis.title}
PROPÓSITO: ${pageAnalysis.purpose}
ELEMENTOS: ${pageAnalysis.elementAnalyses.length}

ELEMENTOS PRINCIPAIS:
${pageAnalysis.elementAnalyses.slice(0, 10).map((el: any, i: number) => `
${i + 1}. ${el.description}
   Categoria: ${el.category}
   Benefício: ${el.userBenefit}
   Como usar: ${el.usageInstructions}
`).join('')}

JORNADA DO USUÁRIO:
${pageAnalysis.userJourney.join(' → ')}

Crie um objeto JSON com:
- title: Título da seção
- description: Descrição do que o usuário aprenderá
- steps: Array de passos detalhados
- tips: Dicas úteis
- troubleshooting: Problemas comuns e soluções

Foque em linguagem clara e instruções práticas.
`;

    try {
  if (!this.llmManager) {
      this.llmManager = new LLMManager(this.keyManager);
    }
    if (!this.llmManager) {
      this.log('LLMManager não inicializado. Não é possível gerar conteúdo.', 'error');
      throw new Error('LLMManager não inicializado.');
    }
    if (!this.llmManager) {
    this.log('LLMManager não inicializado. Não é possível gerar conteúdo.', 'error');
    throw new Error('LLMManager não inicializado.');
  }
  if (!this.llmManager) {
    this.log('LLMManager não inicializado. Não é possível gerar conteúdo.', 'error');
    throw new Error('LLMManager não inicializado.');
  }
  if (!this.llmManager) {
    this.log('LLMManager não inicializado. Não é possível gerar conteúdo.', 'error');
    throw new Error('LLMManager não inicializado.');
  }
  const response = await this.llmManager.generateContent(prompt);
  const aiSection = this.parseAIResponse(response.response.text());
      
      const sectionId = pageAnalysis.url.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      
      return {
        id: sectionId,
        title: aiSection.title || pageAnalysis.title,
        description: aiSection.description || `Como usar ${pageAnalysis.title}`,
        steps: aiSection.steps || this.generateStepsFromElements(pageAnalysis.elementAnalyses),
        tips: aiSection.tips || ['Explore cada funcionalidade com calma'],
        troubleshooting: aiSection.troubleshooting || ['Se houver problemas, atualize a página'],
        relatedSections: []
      };

    } catch (error) {
      this.log(`Erro na geração da seção: ${error}`, 'warn');
      return this.generateFallbackPageSection(pageAnalysis);
    }
  }

  private async generateWorkflowSection(analysis: any): Promise<UserGuideSection | null> {
    if (!analysis.userWorkflows || analysis.userWorkflows.length === 0) {
      return null;
    }

    const prompt = `
Crie uma seção sobre fluxos de trabalho principais baseada nesta análise:

FLUXOS IDENTIFICADOS:
${analysis.userWorkflows.join('\n')}

FUNCIONALIDADES PRINCIPAIS:
${analysis.keyFunctionalities.join('\n')}

Crie uma seção JSON que explique os principais fluxos de trabalho de forma sequencial e didática.
Inclua title, description, steps detalhados, tips e troubleshooting.
`;

    try {
  if (!this.llmManager) {
    this.log('LLMManager não inicializado. Não é possível gerar conteúdo.', 'error');
    throw new Error('LLMManager não inicializado.');
  }
  const response = await this.llmManager.generateContent(prompt);
  const aiSection = this.parseAIResponse(response.response.text());
      
      return {
        id: 'main_workflows',
        title: aiSection.title || 'Fluxos de Trabalho Principais',
        description: aiSection.description || 'Como executar as principais tarefas na aplicação',
        steps: aiSection.steps || [],
        tips: aiSection.tips || ['Siga os fluxos na ordem sugerida'],
        troubleshooting: aiSection.troubleshooting || ['Se algum passo falhar, retorne ao anterior'],
        relatedSections: []
      };

    } catch (error) {
      this.log(`Erro na geração da seção de workflows: ${error}`, 'warn');
      return null;
    }
  }

  private async generateAppendices(crawlAnalysis: any): Promise<UserManualContent['appendices']> {
    await this.logToFile('Iniciando geração de apêndices', 'appendices');
    
    if (!crawlAnalysis) {
      this.log('AVISO: crawlAnalysis está undefined em generateAppendices. Usando fallback.', 'warn');
      return this.getFallbackAppendices();
    }

    const prompt = `
Baseado nesta análise de aplicação web, gere apêndices úteis para um manual do usuário:

ANÁLISE:
${crawlAnalysis.summary ?? 'N/A'}

Gere apêndices em formato JSON com:
- title: Título do apêndice
- content: Conteúdo detalhado

Foque em informações de referência rápida, troubleshooting e perguntas frequentes.
`;

    const result = await this.retryAICall(
      () => {
        if (!this.llmManager) {
          this.llmManager = new LLMManager(this.keyManager);
        }
        return this.llmManager.generateContent(prompt);
      },
      'generateAppendices'
    );
    
    if (result) {
      try {
        const aiAppendices = this.parseAIResponse(result.response.text());
        await this.logToFile(`Apêndices gerados: ${aiAppendices.length}`, 'appendices');
        return aiAppendices;
      } catch (parseError) {
        await this.logToFile(`Erro ao parsear apêndices: ${parseError}`, 'error');
        return this.getFallbackAppendices();
      }
    }
    
    // Fallback
    await this.logToFile('Usando apêndices de fallback', 'appendices');
    return this.getFallbackAppendices();
  }

  private getFallbackAppendices(): UserManualContent['appendices'] {
    return [
      {
        title: 'Perguntas Frequentes',
        content: 'Respostas para perguntas comuns sobre o uso da aplicação.'
      },
      {
        title: 'Troubleshooting',
        content: 'Soluções para problemas comuns encontrados pelos usuários.'
      }
    ];
  }

  private async generateTroubleshootingItems(analysis: any): Promise<UserTroubleshootingItem[]> {
    const commonIssues = [
      {
        problem: 'Página não carrega corretamente',
        symptoms: ['Página em branco', 'Elementos não aparecem', 'Erros no navegador'],
        solutions: ['Atualize a página (F5)', 'Limpe o cache do navegador', 'Tente outro navegador', 'Verifique a conexão de internet'],
        prevention: ['Use navegadores atualizados', 'Mantenha conexão estável']
      },
      {
        problem: 'Não consigo fazer login',
        symptoms: ['Credenciais rejeitadas', 'Página de login não responde', 'Erro de autenticação'],
        solutions: ['Verifique usuário e senha', 'Desative Caps Lock', 'Use a opção "Esqueci senha"', 'Entre em contato com suporte'],
        prevention: ['Anote suas credenciais em local seguro', 'Use senha forte']
      },
      {
        problem: 'Funcionalidade não funciona como esperado',
        symptoms: ['Botões não respondem', 'Formulários não enviam', 'Dados não salvam'],
        solutions: ['Atualize a página', 'Tente novamente em alguns minutos', 'Use outro navegador', 'Verifique se todos os campos obrigatórios estão preenchidos'],
        prevention: ['Preencha todos os campos necessários', 'Aguarde o carregamento completo da página']
      }
    ];

    return commonIssues;
  }

  private async generateGlossaryItems(analysis: any): Promise<UserGlossaryItem[]> {
    const terms = [
      {
        term: 'Login',
        definition: 'Processo de autenticação para acessar uma aplicação usando credenciais (usuário e senha)',
        example: 'Fazer login no sistema para acessar suas informações pessoais'
      },
      {
        term: 'Navegador',
        definition: 'Software usado para acessar e navegar em sites na internet',
        example: 'Chrome, Firefox, Safari e Edge são navegadores populares'
      },
      {
        term: 'URL',
        definition: 'Endereço web que identifica uma página específica na internet',
        example: 'https://exemplo.com.br'
      },
      {
        term: 'Cache',
        definition: 'Armazenamento temporário de dados pelo navegador para acelerar o carregamento de páginas',
        example: 'Limpar o cache pode resolver problemas de carregamento'
      }
    ];

    return terms;
  }

  private async generateFAQItems(analysis: any): Promise<UserFAQItem[]> {
    const faqs = [
      {
        question: 'Como posso acessar a aplicação?',
        answer: 'Abra seu navegador web e digite o endereço da aplicação. Se necessário, faça login com suas credenciais.',
        category: 'Acesso'
      },
      {
        question: 'O que fazer se esquecer minha senha?',
        answer: 'Procure pela opção "Esqueci minha senha" na tela de login. Siga as instruções enviadas para seu email.',
        category: 'Acesso'
      },
      {
        question: 'A aplicação funciona em dispositivos móveis?',
        answer: 'A maioria das funcionalidades deve funcionar em dispositivos móveis através do navegador.',
        category: 'Compatibilidade'
      },
      {
        question: 'Posso usar qualquer navegador?',
        answer: 'Recomendamos usar navegadores modernos como Chrome, Firefox, Safari ou Edge para melhor experiência.',
        category: 'Compatibilidade'
      }
    ];

    return faqs;
  }

  private async generateSummary(crawlAnalysis: any): Promise<UserManualContent['summary']> {
    await this.logToFile('Iniciando geração de resumo', 'summary');
    
    if (!crawlAnalysis) {
      this.log('AVISO: crawlAnalysis está undefined em generateSummary. Usando fallback.', 'warn');
      return this.getFallbackSummary();
    }

    const prompt = `
Baseado nesta análise de aplicação web, gere um resumo conciso para o manual do usuário:

ANÁLISE:
${crawlAnalysis.summary ?? 'N/A'}

O resumo deve incluir:
- keyPoints: Lista de pontos-chave (3-5 itens)
- nextSteps: Próximos passos recomendados para o usuário
- contactInfo: Informações de contato para suporte

Seja breve e direto ao ponto.
`;

    const result = await this.retryAICall(
      () => {
        if (!this.llmManager) {
          this.llmManager = new LLMManager(this.keyManager);
        }
        return this.llmManager.generateContent(prompt);
      },
      'generateSummary'
    );
    
    if (result) {
      try {
        const aiSummary = this.parseAIResponse(result.response.text());
        await this.logToFile('Resumo gerado com sucesso via IA', 'summary');
        return aiSummary;
      } catch (parseError) {
        await this.logToFile(`Erro ao parsear resumo: ${parseError}`, 'error');
        return this.getFallbackSummary();
      }
    }
    
    // Fallback
    await this.logToFile('Usando resumo de fallback', 'summary');
    return this.getFallbackSummary();
  }

  private getFallbackSummary(): UserManualContent['summary'] {
    return {
      keyPoints: [
        'A aplicação fornece funcionalidades principais para [descrever propósito]',
        'Interface intuitiva e fácil de usar',
        'Suporte disponível através de [contato]'
      ],
      nextSteps: [
        'Revise as seções principais para aprender a usar as funcionalidades',
        'Consulte os apêndices para troubleshooting e perguntas frequentes'
      ],
      contactInfo: 'Entre em contato com suporte@exemplo.com para assistência.'
    };
  }

  private generateStepsFromElements(elements: any[]): UserStep[] {
    return elements.slice(0, 5).map((element, index) => ({
      stepNumber: index + 1,
      action: element.usageInstructions || `Interagir com ${element.description}`,
      description: element.description,
      expectedResult: element.userBenefit,
      notes: element.interactions ? [`Interações disponíveis: ${element.interactions.join(', ')}`] : []
    }));
  }

  private generateFallbackPageSection(pageAnalysis: any): UserGuideSection {
    return {
      id: pageAnalysis.url.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
      title: pageAnalysis.title,
      description: `Como utilizar a página ${pageAnalysis.title}`,
      steps: this.generateStepsFromElements(pageAnalysis.elementAnalyses),
      tips: ['Leia cada instrução cuidadosamente', 'Teste cada funcionalidade'],
      troubleshooting: ['Se houver problemas, atualize a página', 'Verifique sua conexão de internet'],
      relatedSections: []
    };
  }

  private async createSpecificUserGuide(analysis: any, context: any): Promise<UserGuideSection> {
    // Implementação para criação de guias específicos
    return {
      id: 'specific_guide',
      title: 'Guia Específico',
      description: 'Guia criado para necessidade específica',
      steps: [],
      tips: [],
      troubleshooting: [],
      relatedSections: []
    };
  }

  private async optimizeContent(content: any, feedback: any): Promise<any> {
    // Implementação para otimização de conteúdo baseado em feedback
    return content;
  }

  private parseAIResponse(text: string): any {
    try {
      // Primeiro, tenta parsear o texto diretamente como JSON
      return JSON.parse(text);
    } catch (error) {
      try {
        // Se falhar, procura por um bloco JSON válido no texto
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          // Tenta encontrar o JSON mais completo possível
          let jsonText = jsonMatch[0];
          
          // Remove possíveis caracteres extras no final
          let braceCount = 0;
          let endIndex = 0;
          
          for (let i = 0; i < jsonText.length; i++) {
            if (jsonText[i] === '{') braceCount++;
            if (jsonText[i] === '}') {
              braceCount--;
              if (braceCount === 0) {
                endIndex = i + 1;
                break;
              }
            }
          }
          
          if (endIndex > 0) {
            jsonText = jsonText.substring(0, endIndex);
          }
          
          return JSON.parse(jsonText);
        }
        
        // Se não encontrar JSON, retorna objeto vazio
        this.log(`Não foi possível extrair JSON da resposta da IA: ${text.substring(0, 200)}...`, 'warn');
        return {};
      } catch (parseError) {
        this.log(`Erro ao parsear resposta da IA: ${parseError}`, 'warn');
        return {};
      }
    }
  }

  private parseAIIntroduction(text: string): UserManualContent['introduction'] {
    try {
      const parsed = this.parseAIResponse(text);
      return {
        overview: parsed.overview || this.getFallbackIntroduction().overview,
        requirements: parsed.requirements || this.getFallbackIntroduction().requirements,
        howToUseManual: parsed.howToUseManual || this.getFallbackIntroduction().howToUseManual,
      };
    } catch (error) {
      this.log(`Erro ao parsear introdução da IA: ${error}`, 'warn');
      return this.getFallbackIntroduction();
    }
  }

  private parseAISections(text: string): UserManualContent['sections'] {
    try {
      const parsed = this.parseAIResponse(text);
      return Array.isArray(parsed) ? parsed : [this.getFallbackSections()[0]];
    } catch (error) {
      this.log(`Erro ao parsear seções da IA: ${error}`, 'warn');
      return this.getFallbackSections();
    }
  }

  private parseAIAppendices(text: string): UserManualContent['appendices'] {
    try {
      const parsed = this.parseAIResponse(text);
      return Array.isArray(parsed) ? parsed : [this.getFallbackAppendices()[0]];
    } catch (error) {
      this.log(`Erro ao parsear apêndices da IA: ${error}`, 'warn');
      return this.getFallbackAppendices();
    }
  }

  private parseAISummary(text: string): UserManualContent['summary'] {
    try {
      const parsed = this.parseAIResponse(text);
      return {
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : this.getFallbackSummary().keyPoints,
        nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : this.getFallbackSummary().nextSteps,
        contactInfo: parsed.contactInfo || this.getFallbackSummary().contactInfo,
      };
    } catch (error) {
      this.log(`Erro ao parsear resumo da IA: ${error}`, 'warn');
      return this.getFallbackSummary();
    }
  }

  async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    const timestamp = new Date().toISOString();
    
    let report = `# Relatório do ContentAgent

**Task ID:** ${taskResult.taskId}
**Timestamp:** ${timestamp}
**Status:** ${taskResult.success ? '✅ Sucesso' : '❌ Falha'}
**Tempo de Processamento:** ${taskResult.processingTime}ms

`;

    if (taskResult.success && taskResult.data) {
      const content = taskResult.data as UserManualContent;
      
      report += `## 📝 Conteúdo User-Friendly Gerado

### Metadados do Manual

- **Título:** ${content.metadata.title}
- **Subtítulo:** ${content.metadata.subtitle}
- **Versão:** ${content.metadata.version}
- **Público-Alvo:** ${content.metadata.targetAudience}
- **Tempo de Leitura:** ${content.metadata.estimatedReadTime}

### Estrutura do Conteúdo

**Seções Principais:** ${content.sections.length}

`;

      content.sections.forEach((section, index) => {
        report += `${index + 1}. **${section.title}**
   - Passos: ${section.steps.length}
   - Dicas: ${section.tips.length}
   - Troubleshooting: ${section.troubleshooting.length}

`;
      });

      report += `
### Recursos Adicionais

- **Itens de Troubleshooting:** ${content.appendices.troubleshooting.length}
- **Glossário:** ${content.appendices.glossary.length}  
- **FAQs:** ${content.appendices.faqs.length}

### Introdução

${content.introduction.overview}

### Requisitos

`;

      content.introduction.requirements.forEach((req, index) => {
        report += `${index + 1}. ${req}\n`;
      });

      report += `
## Próximas Etapas

✅ Conteúdo user-friendly criado com sucesso
🔄 Dados encaminhados para GeneratorAgent  
📄 Aguardando geração dos documentos finais (MD, PDF, HTML)

`;
    } else {
      report += `## ❌ Erro na Geração de Conteúdo

**Erro:** ${taskResult.error}

## Ações Recomendadas

- Verificar configuração da API Gemini
- Verificar qualidade dos dados de análise
- Revisar prompts de geração de conteúdo

`;
    }

    // Salvar relatório no MinIO
    await this.minioService.uploadReportMarkdown(report, this.config.name, taskResult.taskId);

    return report;
  }

  // 🔧 MÉTODOS DE PERSISTÊNCIA E CACHE

  async saveContentDraft(content: UserManualContent, filename?: string): Promise<string> {
    const outputDir = path.join(process.cwd(), 'output', 'final_documents');
    await fs.mkdir(outputDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const draftFile = filename || `content-draft-${timestamp}.md`;
    const filePath = path.join(outputDir, draftFile);
    
    const markdownContent = this.generateContentMarkdown(content);
    await fs.writeFile(filePath, markdownContent, 'utf-8');
    
    this.log(`📄 Rascunho de conteúdo salvo em: ${draftFile}`);
    return filePath;
  }

  private generateContentMarkdown(content: UserManualContent): string {
    return `# ${content.metadata.title}
${content.metadata.subtitle}

**Versão**: ${content.metadata.version}
**Data de Criação**: ${content.metadata.dateCreated}
**Público-Alvo**: ${content.metadata.targetAudience}
**Tempo de Leitura**: ${content.metadata.estimatedReadTime}

---

## Introdução
${content.introduction.overview}

### Requisitos
${content.introduction.requirements.map(req => `- ${req}`).join('\n')}

---
*Manual gerado automaticamente pelo ContentAgent v${this.config.version}*
`;
  }

  async finalize(): Promise<void> {
    if (this.currentContent) {
      await this.saveContentDraft(this.currentContent, 'content-final-draft.md');
    }
    this.log('ContentAgent finalizado');
  }

  async cleanup(): Promise<void> {
    this.currentContent = null;
    this.log('ContentAgent cleanup finalizado');
  }

}
