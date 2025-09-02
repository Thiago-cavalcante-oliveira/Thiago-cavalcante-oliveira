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
    keyPoints: string[];
    nextSteps: string[];
    contactInfo: string;
  };
}

export class ContentAgent extends BaseAgent {
  private retryAttempts: number = 5;
  private retryDelay: number = 3000;
  // private currentContent: UserManualContent | null = null; // Não utilizado no momento

  constructor(
    // private _prompt: string, // Não utilizado no momento
    private minioService: MinIOService,
    private keyManager: GeminiKeyManager | null,
    private llmManager: LLMManager | null,
    // private _contentCacheFile: string, // Não utilizado no momento
    private logDir: string,
    private logFile: string
  ) {
    const config: AgentConfig = {
      name: 'ContentAgent',
      version: '1.0.1',
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
  }

  private async logToFile(logDir: string, logFile: string, message: string, stage: string = 'content'): Promise<void> {
    try {
      if (!logDir) {
        console.error('Erro: logDir não está definido no ContentAgent.');
        return;
      }
      await fs.mkdir(logDir, { recursive: true });
      const logMsg = `[${new Date().toISOString()}][${stage}] ${message}\n`;
      await fs.appendFile(logFile, logMsg, 'utf-8');
    } catch (error) {
      console.error(`Erro ao salvar log: ${error}`);
    }
  }

  private async retryAICall<T>(
    operation: () => Promise<T>,
    operationName: string,
    logToFile?: (logDir: string, logFile: string, message: string, stage?: string) => Promise<void>,
    logDir?: string,
    logFile?: string,
    retryAttempts?: number,
    retryDelay?: number
  ): Promise<T | null> {
    const _logToFile = logToFile ?? this.logToFile.bind(this);
    const _logDir = logDir ?? this.logDir;
    const _logFile = logFile ?? this.logFile;
    const _retryAttempts = retryAttempts ?? this.retryAttempts;
    const _retryDelay = retryDelay ?? this.retryDelay;

    for (let attempt = 1; attempt <= _retryAttempts; attempt++) {
      try {
        await _logToFile(_logDir, _logFile, `Tentativa ${attempt}/${_retryAttempts} para ${operationName}`);
        const result = await operation();
        await _logToFile(_logDir, _logFile, `${operationName} executado com sucesso na tentativa ${attempt}`);
        return result;
      } catch (error) {
        await _logToFile(_logDir, _logFile, `Erro na tentativa ${attempt}/${_retryAttempts} para ${operationName}: ${error}`, 'error');
        if (attempt < _retryAttempts) {
          const delay = (_retryDelay as number) * attempt; // backoff linear
          await _logToFile(_logDir, _logFile, `Aguardando ${delay}ms antes da próxima tentativa`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    await _logToFile(_logDir, _logFile, `Todas as tentativas falharam para ${operationName}, usando fallback`, 'error');
    return null;
  }

  override async initialize(): Promise<void> {
    await this.minioService.initialize();
    if (this.keyManager) {
      await this.keyManager.loadStatus();
    }
    this.log('ContentAgent inicializado para criação de conteúdo user-friendly');
    await this.logToFile(this.logDir, this.logFile, 'ContentAgent inicializado para criação de conteúdo user-friendly', 'init');
  }

  override async processTask(task: TaskData): Promise<TaskResult> {
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
    const { crawlAnalysis, authContext, rawData } = task.data || {};
    // const sessionData = task.data?.sessionData; // Não utilizado no momento

    this.log('Iniciando geração de conteúdo user-friendly');
    await this.logToFile(this.logDir, this.logFile, 'Iniciando geração de conteúdo user-friendly');

    try {
      const userContent = await this.generateUserFriendlyContent(crawlAnalysis, authContext, rawData);
      // this.currentContent = userContent; // Propriedade comentada

      // Enviar para o próximo agente      // Orquestração removida do agente: o orquestrador é quem dispara a próxima tarefa.
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
      await this.logToFile(this.logDir, this.logFile, `Erro na geração de conteúdo: ${error}`, 'error');
      throw error;
    }
  }

  private async handleUserGuideCreation(task: TaskData): Promise<TaskResult> {
    const { analysis, context } = task.data || {};
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
    const { content, feedback } = task.data || {};
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

  private async generateUserFriendlyContent(crawlAnalysis: any, authContext: any, rawData: any[]): Promise<UserManualContent> {
    this.log('Gerando conteúdo estruturado para usuários finais');
    await this.logToFile(this.logDir, this.logFile, 'Gerando conteúdo estruturado para usuários finais');

    const metadata = await this.generateMetadata(crawlAnalysis);
    const introduction = await this.generateIntroduction(crawlAnalysis, authContext);
    const sections = await this.generateUserGuideSections(crawlAnalysis, rawData || []);
    const appendices = await this.generateAppendices(crawlAnalysis);
    const summary = await this.generateSummary(crawlAnalysis);

    const userContent: UserManualContent = {
      metadata,
      introduction,
      sections,
      appendices,
      summary
    };

    this.log(`Conteúdo gerado: ${sections.length} seções principais`);
    await this.logToFile(this.logDir, this.logFile, `Conteúdo gerado: ${sections.length} seções principais`);
    return userContent;
  }

  private async generateMetadata(analysis: any): Promise<UserManualContent['metadata']> {
    await this.logToFile(this.logDir, this.logFile, 'Iniciando geração de metadados', 'metadata');

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

    if (!this.llmManager) {
      await this.logToFile(this.logDir, this.logFile, 'LLMManager indisponível — usando metadados de fallback', 'metadata');
      return this.getFallbackMetadata();
    }

    const result = await this.retryAICall(
      () => this.llmManager!.generateContent(prompt),
      'generateMetadata',
      this.logToFile.bind(this),
      this.logDir,
      this.logFile,
      this.retryAttempts,
      this.retryDelay
    );

    if (result) {
      try {
        const aiText = await result.response.text();
        const aiMetadata = this.parseAIResponse(aiText);
        await this.logToFile(this.logDir, this.logFile, 'Metadados gerados com sucesso via IA', 'metadata');
        return {
          title: aiMetadata.title || 'Manual do Usuário',
          subtitle: aiMetadata.subtitle || 'Guia completo de utilização',
          version: aiMetadata.version || '1.0.0',
          dateCreated: new Date().toLocaleDateString('pt-BR'),
          targetAudience: aiMetadata.targetAudience || 'Usuários finais',
          estimatedReadTime: aiMetadata.estimatedReadTime || '15-20 minutos'
        };
      } catch (parseError) {
        await this.logToFile(this.logDir, this.logFile, `Erro ao parsear resposta da IA: ${parseError}`, 'error');
      }
    }

    await this.logToFile(this.logDir, this.logFile, 'Usando metadados de fallback', 'metadata');
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
      requirements: ['Navegador moderno', 'Acesso à internet'],
      howToUseManual: 'Navegue pelas seções para encontrar informações sobre funcionalidades específicas.'
    };
  }

  private async generateIntroduction(analysis: any, authContext: any): Promise<UserManualContent['introduction']> {
    await this.logToFile(this.logDir, this.logFile, 'Iniciando geração de introdução', 'introduction');

    if (!analysis) {
      this.log('AVISO: analysis está undefined em generateIntroduction. Usando fallback.', 'warn');
      return this.getFallbackIntroduction();
    }

    const prompt = `
Crie uma introdução amigável para um manual do usuário baseado nesta análise:

ANÁLISE:
${analysis?.summary ?? 'N/A'}

FUNCIONALIDADES PRINCIPAIS:
${analysis?.keyFunctionalities?.join(', ') ?? 'N/A'}

CONTEXTO DE AUTENTICAÇÃO:
${authContext?.authType || 'Não requer autenticação'}

Crie uma introdução que inclua:
1. overview: Visão geral da aplicação
2. requirements: Requisitos necessários
3. howToUseManual: Como usar este manual

Use linguagem simples e acolhedora. Responda em JSON.
`;

    if (!this.llmManager) {
      await this.logToFile(this.logDir, this.logFile, 'LLMManager indisponível — usando introdução de fallback', 'introduction');
      return this.getFallbackIntroduction();
    }

    const result = await this.retryAICall(
      () => this.llmManager!.generateContent(prompt),
      'generateIntroduction',
      this.logToFile.bind(this),
      this.logDir,
      this.logFile,
      this.retryAttempts,
      this.retryDelay
    );

    if (result) {
      try {
        {
        const introText = await result.response.text();
        return this.parseAIIntroduction(introText);
      }
      } catch (parseError) {
        await this.logToFile(this.logDir, this.logFile, `Erro ao parsear introdução da IA: ${parseError}`, 'error');
      }
    }

    await this.logToFile(this.logDir, this.logFile, 'Usando introdução de fallback', 'introduction');
    return this.getFallbackIntroduction();
  }

  private async generateUserGuideSections(crawlAnalysis: any, rawData: any[]): Promise<UserManualContent['sections']> {
    await this.logToFile(this.logDir, this.logFile, 'Iniciando geração de seções do guia', 'sections');
    if (!crawlAnalysis || !rawData) {
      this.log('AVISO: crawlAnalysis ou rawData estão undefined em generateUserGuideSections', 'warn');
      return this.getFallbackSections();
    }
    if (!this.llmManager) {
      this.log('LLMManager indisponível — usando seções de fallback', 'warn');
      return this.getFallbackSections();
    }

    const prompt = `
Baseado nesta análise e dados brutos, gere seções para um manual do usuário:

ANÁLISE:
${JSON.stringify(crawlAnalysis, null, 2)}

DADOS BRUTOS (${rawData.length} itens):
${JSON.stringify(rawData.slice(0, 3), null, 2)}

Gere seções organizadas por funcionalidades principais. Responda em JSON válido.
`;

    try {
      const result = await this.retryAICall(
        () => this.llmManager!.generateContent(prompt),
        'generateUserGuideSections',
        this.logToFile.bind(this),
        this.logDir,
        this.logFile,
        this.retryAttempts,
        this.retryDelay
      );
      if (result) {
        {
        const sectionsText = await result.response.text();
        return this.parseAISections(sectionsText);
      }
      }
    } catch (error) {
      this.log(`Erro ao gerar seções: ${error}`, 'error');
    }
    return this.getFallbackSections();
  }

  private getFallbackSections(): UserManualContent['sections'] {
    return [
      {
        id: 'basicos',
        title: 'Funcionalidades Básicas',
        description: 'Guia passo a passo para as funcionalidades básicas da aplicação.',
        steps: [],
        tips: [],
        troubleshooting: [],
        relatedSections: []
      }
    ];
  }

  private async generateAppendices(crawlAnalysis: any): Promise<UserManualContent['appendices']> {
    await this.logToFile(this.logDir, this.logFile, 'Iniciando geração de apêndices', 'appendices');

    if (!crawlAnalysis) {
      this.log('AVISO: crawlAnalysis está undefined em generateAppendices. Usando fallback.', 'warn');
      return this.getFallbackAppendices();
    }

    const [tr, gl, fq] = await Promise.all([
      this.generateTroubleshootingItems(crawlAnalysis),
      this.generateGlossaryItems(crawlAnalysis),
      this.generateFAQItems(crawlAnalysis)
    ]);

    return { troubleshooting: tr, glossary: gl, faqs: fq };
  }

  private getFallbackAppendices(): UserManualContent['appendices'] {
    return {
      troubleshooting: [
        {
          problem: 'Login falha',
          symptoms: ['Mensagem de erro'],
          solutions: ['Verifique credenciais'],
          prevention: ['Guarde as credenciais em local seguro']
        }
      ],
      glossary: [
        { term: 'Login', definition: 'Processo de autenticação', example: 'Inserir usuário e senha' }
      ],
      faqs: [
        { question: 'Como acessar?', answer: 'Via navegador com a URL do sistema.', category: 'Acesso' }
      ]
    };
  }

  private async generateTroubleshootingItems(analysis: any): Promise<UserTroubleshootingItem[]> {
    await this.logToFile(this.logDir, this.logFile, 'Iniciando geração de itens de troubleshooting via IA', 'troubleshooting');
    const prompt = `Com base na análise da aplicação:\n\n${JSON.stringify(analysis, null, 2)}\n\nGere uma lista de itens de troubleshooting em formato JSON, onde cada item deve conter:\n- problem\n- symptoms[]\n- solutions[]\n- prevention[]`;

    if (!this.llmManager) {
      this.log('LLMManager indisponível — usando troubleshooting de fallback', 'warn');
      return [
        {
          problem: 'Página não carrega corretamente',
          symptoms: ['Página em branco', 'Elementos não aparecem', 'Erros no console do navegador'],
          solutions: ['Atualize a página (F5)', 'Limpe o cache', 'Tente outro navegador', 'Verifique a conexão'],
          prevention: ['Use navegadores atualizados', 'Mantenha conexão estável']
        }
      ];
    }

    const result = await this.retryAICall(
      () => this.llmManager!.generateContent(prompt),
      'generateTroubleshootingItems',
      this.logToFile.bind(this),
      this.logDir,
      this.logFile,
      this.retryAttempts,
      this.retryDelay
    );

    if (result) {
      try {
        const trText = await result.response.text();
        const aiTroubleshooting = this.parseAIResponse(trText);
        await this.logToFile(this.logDir, this.logFile, `Itens de troubleshooting gerados: ${aiTroubleshooting.length}`, 'troubleshooting');
        return aiTroubleshooting;
      } catch (parseError) {
        await this.logToFile(this.logDir, this.logFile, `Erro ao parsear itens de troubleshooting: ${parseError}`, 'error');
      }
    }

    await this.logToFile(this.logDir, this.logFile, 'Usando itens de troubleshooting de fallback', 'troubleshooting');
    return [
      {
        problem: 'Página não carrega corretamente',
        symptoms: ['Página em branco', 'Elementos não aparecem', 'Erros no console do navegador'],
        solutions: ['Atualize a página (F5)', 'Limpe o cache', 'Tente outro navegador', 'Verifique a conexão'],
        prevention: ['Use navegadores atualizados', 'Mantenha conexão estável']
      },
      {
        problem: 'Não consigo fazer login',
        symptoms: ['Credenciais rejeitadas', 'Página de login não responde', 'Erro de autenticação'],
        solutions: ['Verifique usuário e senha', 'Desative Caps Lock', 'Use "Esqueci senha"', 'Contate o suporte'],
        prevention: ['Guarde credenciais em local seguro', 'Use senha forte']
      }
    ];
  }

  private async generateGlossaryItems(analysis: any): Promise<UserGlossaryItem[]> {
    await this.logToFile(this.logDir, this.logFile, 'Iniciando geração de itens de glossário via IA', 'glossary');
    const prompt = `Com base na análise:\n\n${JSON.stringify(analysis, null, 2)}\n\nGere itens de glossário (JSON): term, definition, example.`;

    if (!this.llmManager) {
      this.log('LLMManager indisponível — usando glossário de fallback', 'warn');
      return [
        {
          term: 'Login',
          definition: 'Processo de autenticação para acessar uma aplicação usando credenciais (usuário e senha)',
          example: 'Fazer login no sistema para acessar suas informações pessoais'
        }
      ];
    }

    const result = await this.retryAICall(
      () => this.llmManager!.generateContent(prompt),
      'generateGlossaryItems',
      this.logToFile.bind(this),
      this.logDir,
      this.logFile,
      this.retryAttempts,
      this.retryDelay
    );

    if (result) {
      try {
        const glText = await result.response.text();
        const aiGlossary = this.parseAIResponse(glText);
        await this.logToFile(this.logDir, this.logFile, `Itens de glossário gerados: ${aiGlossary.length}`, 'glossary');
        return aiGlossary;
      } catch (parseError) {
        await this.logToFile(this.logDir, this.logFile, `Erro ao parsear itens de glossário: ${parseError}`, 'error');
      }
    }

    await this.logToFile(this.logDir, this.logFile, 'Usando itens de glossário de fallback', 'glossary');
    return [
      {
        term: 'Login',
        definition: 'Processo de autenticação para acessar uma aplicação usando credenciais (usuário e senha)',
        example: 'Fazer login no sistema para acessar suas informações pessoais'
      }
    ];
  }

  private async generateFAQItems(analysis: any): Promise<UserFAQItem[]> {
    await this.logToFile(this.logDir, this.logFile, 'Iniciando geração de itens de FAQ via IA', 'faq');
    const prompt = `Com base na análise:\n\n${JSON.stringify(analysis, null, 2)}\n\nGere FAQ em JSON: question, answer, category.`;

    if (!this.llmManager) {
      this.log('LLMManager indisponível — usando FAQ de fallback', 'warn');
      return [
        {
          question: 'Como posso acessar a aplicação?',
          answer: 'Abra seu navegador e digite a URL da aplicação. Se necessário, faça login com suas credenciais.',
          category: 'Acesso'
        }
      ];
    }

    const result = await this.retryAICall(
      () => this.llmManager!.generateContent(prompt),
      'generateFAQItems',
      this.logToFile.bind(this),
      this.logDir,
      this.logFile,
      this.retryAttempts,
      this.retryDelay
    );

    if (result) {
      try {
        const fqText = await result.response.text();
        const aiFaqs = this.parseAIResponse(fqText);
        await this.logToFile(this.logDir, this.logFile, `Itens de FAQ gerados: ${aiFaqs.length}`, 'faq');
        return aiFaqs;
      } catch (parseError) {
        await this.logToFile(this.logDir, this.logFile, `Erro ao parsear itens de FAQ: ${parseError}`, 'error');
      }
    }

    await this.logToFile(this.logDir, this.logFile, 'Usando itens de FAQ de fallback', 'faq');
    return [
      {
        question: 'Como posso acessar a aplicação?',
        answer: 'Abra seu navegador web e digite o endereço da aplicação. Se necessário, faça login com suas credenciais.',
        category: 'Acesso'
      },
      {
        question: 'O que fazer se esquecer minha senha?',
        answer: 'Use a opção "Esqueci minha senha" na tela de login e siga as instruções.',
        category: 'Acesso'
      }
    ];
  }

  private async generateSummary(crawlAnalysis: any): Promise<UserManualContent['summary']> {
    await this.logToFile(this.logDir, this.logFile, 'Iniciando geração de resumo', 'summary');

    if (!crawlAnalysis) {
      this.log('AVISO: crawlAnalysis está undefined em generateSummary. Usando fallback.', 'warn');
      return this.getFallbackSummary();
    }

    if (!this.llmManager) {
      this.log('LLMManager indisponível — usando resumo de fallback', 'warn');
      return this.getFallbackSummary();
    }

    const prompt = `
Baseado nesta análise de aplicação web, gere um resumo conciso para o manual do usuário:

ANÁLISE:
${JSON.stringify(crawlAnalysis, null, 2)}

O resumo deve incluir:
- keyPoints (3-5 itens)
- nextSteps
- contactInfo
Responda em JSON válido.
`;

    const result = await this.retryAICall(
      () => this.llmManager!.generateContent(prompt),
      'generateSummary',
      this.logToFile.bind(this),
      this.logDir,
      this.logFile,
      this.retryAttempts,
      this.retryDelay
    );

    if (result) {
      try {
        {
        const summaryText = await result.response.text();
        return this.parseAISummary(summaryText);
      }
      } catch (parseError) {
        await this.logToFile(this.logDir, this.logFile, `Erro ao parsear resumo: ${parseError}`, 'error');
        return this.getFallbackSummary();
      }
    }

    await this.logToFile(this.logDir, this.logFile, 'Usando resumo de fallback', 'summary');
    return this.getFallbackSummary();
  }

  private getFallbackSummary(): UserManualContent['summary'] {
    this.logToFile(this.logDir, this.logFile, 'Gerando resumo de fallback', 'summary');
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

  private parseAIResponse(text: string): any {
    try {
      return JSON.parse(text);
    } catch (error) {
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          let jsonText = jsonMatch[0];
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
          if (endIndex > 0) jsonText = jsonText.substring(0, endIndex);
          return JSON.parse(jsonText);
        }
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
      const fallback = this.getFallbackIntroduction();
      return {
        overview: parsed.overview || fallback.overview,
        requirements: Array.isArray(parsed.requirements) ? parsed.requirements : fallback.requirements,
        howToUseManual: parsed.howToUseManual || fallback.howToUseManual
      };
    } catch (error) {
      this.log(`Erro ao parsear introdução da IA: ${error}`, 'warn');
      return this.getFallbackIntroduction();
    }
  }

  private parseAISections(text: string): UserManualContent['sections'] {
    try {
      const parsed = this.parseAIResponse(text);
      if (Array.isArray(parsed)) return parsed as UserGuideSection[];
      return this.getFallbackSections();
    } catch (error) {
      this.log(`Erro ao parsear seções da IA: ${error}`, 'warn');
      return this.getFallbackSections();
    }
  }

  // Método não utilizado no momento
  // private _parseAIAppendices(text: string): UserManualContent['appendices'] {
  //   try {
  //     const parsed = this.parseAIResponse(text);
  //     if (parsed?.troubleshooting || parsed?.glossary || parsed?.faqs) {
  //       return {
  //         troubleshooting: parsed.troubleshooting ?? [],
  //         glossary: parsed.glossary ?? [],
  //         faqs: parsed.faqs ?? []
  //       };
  //     }
  //     return this.getFallbackAppendices();
  //   } catch (error) {
  //     this.log(`Erro ao parsear apêndices da IA: ${error}`, 'warn');
  //     return this.getFallbackAppendices();
  //   }
  // }

  private parseAISummary(text: string): UserManualContent['summary'] {
    try {
      const parsed = this.parseAIResponse(text);
      const fallback = this.getFallbackSummary();
      return {
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : fallback.keyPoints,
        nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : fallback.nextSteps,
        contactInfo: parsed.contactInfo || fallback.contactInfo
      };
    } catch (error) {
      this.log(`Erro ao parsear resumo da IA: ${error}`, 'warn');
      return this.getFallbackSummary();
    }
  }

  private async createSpecificUserGuide(analysis: any, context: any): Promise<UserGuideSection> {
    await this.logToFile(this.logDir, this.logFile, 'Criando guia específico', 'specific-guide');

    // Fallback imediato se não houver análise mínima
    if (!analysis) {
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

    // Se não houver LLM, retorna fallback construído a partir do contexto
    if (!this.llmManager) {
      return {
        id: (analysis?.id || 'specific_guide').toString().replace(/[^a-zA-Z0-9_\-]/g, '_') || 'specific_guide',
        title: analysis?.title || 'Fluxo específico',
        description: context?.goal || 'Como executar um fluxo específico na aplicação',
        steps: [],
        tips: context?.tips || [],
        troubleshooting: [],
        relatedSections: []
      };
    }

    const prompt = `Gere uma seção de guia de usuário (JSON válido) com os campos: id, title, description, steps[], tips[], troubleshooting[], relatedSections[]

ANÁLISE:
${JSON.stringify(analysis, null, 2)}

CONTEXTO:
${JSON.stringify(context, null, 2)}
`;

    const result = await this.retryAICall(
      () => this.llmManager!.generateContent(prompt),
      'createSpecificUserGuide',
      this.logToFile.bind(this),
      this.logDir,
      this.logFile,
      this.retryAttempts,
      this.retryDelay
    );

    if (result) {
      try {
        const sgText = await result.response.text();
        const parsed = this.parseAIResponse(sgText);
        return {
          id: parsed.id || 'specific_guide',
          title: parsed.title || analysis?.title || 'Guia Específico',
          description: parsed.description || context?.goal || 'Como executar um fluxo específico na aplicação',
          steps: Array.isArray(parsed.steps) ? parsed.steps : [],
          tips: Array.isArray(parsed.tips) ? parsed.tips : [],
          troubleshooting: Array.isArray(parsed.troubleshooting) ? parsed.troubleshooting : [],
          relatedSections: Array.isArray(parsed.relatedSections) ? parsed.relatedSections : []
        };
      } catch (e) {
        await this.logToFile(this.logDir, this.logFile, `Falha no parse do guia específico: ${e}`, 'error');
      }
    }

    // Fallback se IA falhar
    return {
      id: 'specific_guide',
      title: analysis?.title || 'Guia Específico',
      description: context?.goal || 'Como executar um fluxo específico na aplicação',
      steps: [],
      tips: [],
      troubleshooting: [],
      relatedSections: []
    };
  }

  private async optimizeContent(content: any, feedback: any): Promise<any> {
    await this.logToFile(this.logDir, this.logFile, 'Otimizando conteúdo', 'optimize-content');

    if (!feedback) return content;

    if (!this.llmManager) {
      // Sem LLM: aplica um merge simples (anexa notas de feedback)
      return {
        ...content,
        meta: {
          ...(content?.meta || {}),
          optimization: { when: new Date().toISOString(), applied: 'basic-merge' }
        },
        feedbackNotes: Array.isArray(feedback) ? feedback : [String(feedback)]
      };
    }

    const prompt = `Otimize o conteúdo abaixo com base no feedback. Responda com JSON válido mantendo a estrutura quando possível.

CONTEÚDO ATUAL:
${JSON.stringify(content, null, 2)}

FEEDBACK:
${JSON.stringify(feedback, null, 2)}
`;

    const result = await this.retryAICall(
      () => this.llmManager!.generateContent(prompt),
      'optimizeContent',
      this.logToFile.bind(this),
      this.logDir,
      this.logFile,
      this.retryAttempts,
      this.retryDelay
    );

    if (result) {
      try {
        const optText = await result.response.text();
        const optimized = this.parseAIResponse(optText);
        return optimized && Object.keys(optimized).length > 0 ? optimized : content;
      } catch (e) {
        await this.logToFile(this.logDir, this.logFile, `Falha no parse da otimização: ${e}`, 'error');
      }
    }

    return content;
  }

  override async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
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
        report += `${index + 1}. **${section.title}**\n   - Passos: ${section.steps.length}\n   - Dicas: ${section.tips.length}\n   - Troubleshooting: ${section.troubleshooting.length}\n\n`;
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
${content.introduction.requirements.map((req) => `- ${req}`).join('\n')}

---
*Manual gerado automaticamente pelo ContentAgent v${this.config.version}*
`;
  }

  override async cleanup(): Promise<void> {
    // this.currentContent = null; // Propriedade comentada
    this.log('ContentAgent cleanup finalizado');
  }
}
