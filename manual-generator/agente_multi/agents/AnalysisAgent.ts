import { BaseAgent, AgentConfig, TaskData, TaskResult, AgentCapability } from '../core/AgnoSCore.js';
import { MinIOService } from '../services/MinIOService.js';
import { GeminiKeyManager } from '../services/GeminiKeyManager.js';
import { LLMRouter } from '../services/LLMRouter.js';
import { LLMManager } from '@services/LLMManager';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface ElementAnalysis {
  id: string;
  description: string;
  functionality: string;
  userBenefit: string;
  importance: number;
  usageInstructions: string;
  category: string;
  interactions: string[];
}

export interface PageAnalysis {
  url: string;
  title: string;
  purpose: string;
  userJourney: string[];
  keyFeatures: string[];
  elementAnalyses: ElementAnalysis[];
  navigationFlow: string[];
  accessibility: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
}

export interface CrawlAnalysis {
  summary: string;
  totalPages: number;
  totalElements: number;
  keyFunctionalities: string[];
  userWorkflows: string[];
  recommendations: string[];
  pageAnalyses: PageAnalysis[];
  technicalInsights: {
    technologies: string[];
    patterns: string[];
    complexity: 'low' | 'medium' | 'high';
  };
}

export class AnalysisAgent extends BaseAgent {
  private keyManager: GeminiKeyManager | null;
  private llmRouter: LLMRouter | null; // Permitir que seja nulo
  private llmManager: LLMManager | null; // Adicionado
  private minioService: MinIOService;
  private currentAnalysis: CrawlAnalysis | null = null; // Adicionar declaração da propriedade

  private componentCache = new Map<string, ElementAnalysis>();
  private cacheFile: string;


  constructor(config: AgentConfig) {
    super(config);

    try {
      this.keyManager = new GeminiKeyManager();
      this.llmRouter = new LLMRouter();
      this.llmManager = new LLMManager(); // Inicializado
    } catch (error) {
      this.log('Não foi possível inicializar o GeminiKeyManager/LLMRouter. O agente de análise continuará sem as capacidades de IA.', 'warn');
      this.keyManager = null;
      this.llmRouter = null;
      this.llmManager = null; // Definir como nulo em caso de erro
    }
    this.minioService = new MinIOService();
    this.cacheFile = path.join(process.cwd(), 'output', 'component-analysis-cache.json');
  }

  async initialize(): Promise<void> {
    await this.minioService.initialize();
    if (this.keyManager) {
      await this.keyManager.loadStatus();
      await this.loadComponentCache();
    }
    this.log('AnalysisAgent inicializado com IA Gemini');
  }

  async processTask(task: TaskData): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      switch (task.type) {
        case 'analyze_crawl_data':
          return await this.handleCrawlAnalysis(task);
        
        case 'analyze_page':
          return await this.handlePageAnalysis(task);
          
        case 'analyze_elements':
          return await this.handleElementAnalysis(task);
          
        default:
          throw new Error(`Tipo de tarefa não suportada: ${task.type}`);
      }

    } catch (error) {
      return {
        id: uuidv4(), // Usar uuidv4 para o ID da tarefa
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };
    }
  }




  private async handleCrawlAnalysis(task: TaskData): Promise<TaskResult> {
    const startTime = Date.now();
    const { crawlResults, sessionData, authContext } = task.data;
    
    this.log('Iniciando análise completa dos dados de crawling');

    try {
      // Verificar se crawlResults tem a estrutura esperada
      const pages = crawlResults?.pages || [];
      
      // Analisar cada página
      const pageAnalyses: PageAnalysis[] = [];
      
      for (const pageData of pages) {
        this.log(`Analisando página: ${pageData.meta?.title || pageData.url}`);
        const pageAnalysis = await this.analyzePageData(pageData);
        pageAnalyses.push(pageAnalysis);
      }

      // Análise geral do crawling
      const crawlAnalysis = await this.generateCrawlAnalysis(pages, pageAnalyses, authContext);
      this.currentAnalysis = crawlAnalysis;

      // Enviar para o próximo agente
      this.sendTask('ContentAgent', 'generate_user_friendly_content', {
        crawlAnalysis,
        sessionData,
        authContext,
        rawData: crawlResults
      }, 'high');

      return {
        id: task.id,
        taskId: task.id,
        success: true,
        data: crawlAnalysis,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      this.log(`Erro na análise do crawling: ${error}`, 'error');
      throw error;
    }
  }

  private async handlePageAnalysis(task: TaskData): Promise<TaskResult> {
    const { pageData } = task.data;
    const startTime = Date.now();

    try {
      const analysis = await this.analyzePageData(pageData);

      return {
        id: task.id,
        taskId: task.id,
        success: true,
        data: analysis,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      throw error;
    }
  }

  private async handleElementAnalysis(task: TaskData): Promise<TaskResult> {
    const { elements, context } = task.data;
    const startTime = Date.now();

    try {
      const analyses = await this.analyzeElements(elements, context);

      return {
        id: task.id,
        taskId: task.id,
        success: true,
        data: analyses,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      throw error;
    }
  }

  private async analyzePageData(pageData: any): Promise<PageAnalysis> {
    const elements = pageData.elements || [];
    
    // Análise com IA da página
    const pagePrompt = `
Analise esta página web e forneça insights detalhados:

PÁGINA:
- URL: ${pageData.url}
- Título: ${pageData.title}
- Total de Elementos: ${elements.length}

ELEMENTOS DETECTADOS:
${elements.map((el: any, i: number) => `
${i + 1}. ${el.type} - "${el.text}"
   Funcionalidade: ${el.functionality}
   Posição: x:${el.position.x}, y:${el.position.y}
   Importância: ${el.importance}
`).join('')}

Por favor, forneça:

1. PROPÓSITO DA PÁGINA: Qual é o objetivo principal desta página?

2. JORNADA DO USUÁRIO: Quais são os passos típicos que um usuário seguiria nesta página?

3. RECURSOS PRINCIPAIS: Quais são as funcionalidades mais importantes?

4. FLUXO DE NAVEGAÇÃO: Como os elementos se conectam para formar um fluxo lógico?

5. ACESSIBILIDADE: Que problemas de acessibilidade você identifica?

Responda em formato JSON estruturado.
`;

    try {
      if (!this.keyManager || !this.llmManager) {
        throw new Error('KeyManager or LLMManager not initialized.');
      }
      const response = await this.keyManager.handleApiCall(async (model) => {
        return await model.generateContent(pagePrompt);
      });
      const aiAnalysis = this.parseAIResponse(response.response.text());
      
      // Analisar elementos individualmente
      const elementAnalyses = await this.analyzeElements(elements, {
        pageUrl: pageData.url,
        pageTitle: pageData.title,
        pagePurpose: aiAnalysis.purpose || 'Página web'
      });

      // Análise de acessibilidade
      const accessibility = await this.analyzeAccessibility(elements);

      const pageAnalysis: PageAnalysis = {
        url: pageData.url,
        title: pageData.title,
        purpose: aiAnalysis.purpose || 'Propósito não identificado',
        userJourney: aiAnalysis.userJourney || ['Acessar página', 'Interagir com elementos'],
        keyFeatures: aiAnalysis.keyFeatures || elements.slice(0, 5).map((el: any) => el.text),
        elementAnalyses,
        navigationFlow: aiAnalysis.navigationFlow || ['Navegação sequencial'],
        accessibility
      };

      this.log(`Página analisada: ${pageData.title} (${elementAnalyses.length} elementos)`);
      return pageAnalysis;

    } catch (error) {
      this.log(`Erro na análise com IA da página: ${error}`, 'warn');
      
      // Fallback sem IA
      return this.createFallbackPageAnalysis(pageData, elements);
    }
  }

  private async analyzeElements(elements: any[], context: any): Promise<ElementAnalysis[]> {
    const analyses: ElementAnalysis[] = [];
    const batchSize = 5; // Processar em lotes para evitar sobrecarga

    for (let i = 0; i < elements.length; i += batchSize) {
      const batch = elements.slice(i, i + batchSize);
      
      const batchPrompt = `
Analise estes elementos web e forneça descrições detalhadas para um manual do usuário:

CONTEXTO:
- Página: ${context.pageTitle}
- URL: ${context.pageUrl}
- Propósito: ${context.pagePurpose}

ELEMENTOS:
${batch.map((el: any, idx: number) => `
ELEMENTO ${i + idx + 1}:
- Tipo: ${el.type}
- Texto: "${el.text}"
- Funcionalidade: ${el.functionality}
- Atributos: ${JSON.stringify(el.attributes)}
- Importância: ${el.importance}
- Visível: ${el.isVisible}
`).join('')}

Para cada elemento, forneça:
1. DESCRIÇÃO: Descrição clara e amigável para usuários leigos
2. BENEFÍCIO: Como este elemento beneficia o usuário
3. INSTRUÇÕES: Como usar este elemento passo a passo
4. CATEGORIA: Categorize (navegação, entrada, ação, informação, etc.)
5. INTERAÇÕES: Que outras interações são possíveis

Responda em formato JSON com array de objetos.
`;

      try {
        if (!this.keyManager || !this.llmManager) {
          throw new Error('KeyManager or LLMManager not initialized.');
        }
        const response = await this.keyManager.handleApiCall(async (model) => {
          return await model.generateContent(batchPrompt);
        });
        const aiAnalyses = this.parseAIResponse(response.response.text());
        
        if (Array.isArray(aiAnalyses)) {
          batch.forEach((element, idx) => {
            const analysis = aiAnalyses[idx] || {};
            
            analyses.push({
              id: element.id,
              description: analysis.description || `${element.type} com texto "${element.text}"`,
              functionality: analysis.functionality || element.functionality,
              userBenefit: analysis.userBenefit || 'Permite interação com a página',
              importance: element.importance,
              usageInstructions: analysis.usageInstructions || 'Clique para interagir',
              category: analysis.category || this.categorizeElement(element.type),
              interactions: analysis.interactions || ['click']
            });
          });
        }

      } catch (error) {
        this.log(`Erro na análise de elementos com IA: ${error}`, 'warn');
        
        // Fallback sem IA
        batch.forEach(element => {
          analyses.push(this.createFallbackElementAnalysis(element));
        });
      }

      // Pausa entre lotes
      if (i + batchSize < elements.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    this.log(`${analyses.length} elementos analisados`);
    return analyses;
  }

  private async generateCrawlAnalysis(crawlResults: any[], pageAnalyses: PageAnalysis[], authContext: any): Promise<CrawlAnalysis> {
    const totalElements = crawlResults.reduce((sum, page) => sum + (page.elements?.length || 0), 0);
    
    // CORREÇÃO DO BUG: Validar se authContext existe antes de acessar propriedades
    const authType = authContext && authContext.authType ? authContext.authType : 'public';
    
    const analysisPrompt = `
Analise este crawling completo de aplicação web e gere insights abrangentes:

DADOS GERAIS:
- Total de Páginas: ${crawlResults.length}
- Total de Elementos: ${totalElements}
- Contexto de Autenticação: ${authType}

PÁGINAS ANALISADAS:
${pageAnalyses.map((page, i) => `
PÁGINA ${i + 1}: ${page.title}
- URL: ${page.url}
- Propósito: ${page.purpose}
- Elementos: ${page.elementAnalyses.length}
- Recursos Principais: ${page.keyFeatures.join(', ')}
- Jornada do Usuário: ${page.userJourney.join(' → ')}
`).join('')}

Por favor, forneça uma análise completa:

1. RESUMO EXECUTIVO: Resumo geral da aplicação
2. FUNCIONALIDADES PRINCIPAIS: Liste as funcionalidades mais importantes
3. FLUXOS DE TRABALHO: Identifique os principais fluxos de trabalho do usuário
4. RECOMENDAÇÕES: Sugestões de melhoria
5. INSIGHTS TÉCNICOS: Tecnologias e padrões identificados
6. COMPLEXIDADE: Avalie a complexidade geral (low/medium/high)

Responda em formato JSON estruturado.
`;

    try {
      if (!this.keyManager || !this.llmManager) {
        throw new Error('KeyManager or LLMManager not initialized.');
      }
      const response = await this.keyManager.handleApiCall(async (model) => {
        return await model.generateContent(analysisPrompt);
      });
      const aiAnalysis = this.parseAIResponse(response.response.text());
      
      const crawlAnalysis: CrawlAnalysis = {
        summary: aiAnalysis.summary || 'Aplicação web com múltiplas funcionalidades',
        totalPages: crawlResults.length,
        totalElements,
        keyFunctionalities: aiAnalysis.keyFunctionalities || ['Navegação', 'Interação'],
        userWorkflows: aiAnalysis.userWorkflows || ['Acesso → Navegação → Interação'],
        recommendations: aiAnalysis.recommendations || ['Melhorar acessibilidade'],
        pageAnalyses,
        technicalInsights: {
          technologies: aiAnalysis.technologies || ['HTML', 'JavaScript'],
          patterns: aiAnalysis.patterns || ['SPA'],
          complexity: aiAnalysis.complexity || 'medium'
        }
      };

      this.log('Análise completa do crawling gerada');
      return crawlAnalysis;

    } catch (error) {
      this.log(`Erro na análise geral: ${error}`, 'warn');
      return this.createFallbackCrawlAnalysis(crawlResults, pageAnalyses);
    }
  }

  private async analyzeAccessibility(elements: any[]): Promise<any> {
    let score = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];

    elements.forEach(element => {
      // Verificar labels
      if (['input', 'select', 'textarea'].includes(element.type)) {
        if (!element.attributes['aria-label'] && !element.attributes.placeholder) {
          issues.push(`Campo ${element.text} sem label acessível`);
          recommendations.push('Adicionar aria-label ou placeholder');
          score -= 5;
        }
      }

      // Verificar contraste (simulado)
      if (element.importance > 3 && !element.text) {
        issues.push(`Elemento importante sem texto descritivo`);
        recommendations.push('Adicionar texto descritivo ou aria-label');
        score -= 3;
      }
    });

    return {
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }

  private parseAIResponse(text: string): any {
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Se não houver JSON válido, tentar parse direto
      return JSON.parse(text);
      
    } catch (error) {
      this.log(`Erro ao parsear resposta da IA: ${error}`, 'warn');
      return {};
    }
  }

  private categorizeElement(type: string): string {
    const categoryMap: Record<string, string> = {
      'input': 'entrada',
      'button': 'ação',
      'submit_button': 'ação',
      'link': 'navegação',
      'select': 'entrada',
      'textarea': 'entrada',
      'checkbox': 'seleção',
      'radio': 'seleção',
      'interactive': 'interação'
    };
    
    return categoryMap[type] || 'geral';
  }

  private createFallbackElementAnalysis(element: any): ElementAnalysis {
    return {
      id: element.id,
      description: `${element.functionality} com o texto "${element.text}"`,
      functionality: element.functionality,
      userBenefit: 'Permite interação com a aplicação',
      importance: element.importance,
      usageInstructions: element.type.includes('button') ? 'Clique para executar a ação' : 'Interaja conforme necessário',
      category: this.categorizeElement(element.type),
      interactions: ['click', 'focus']
    };
  }

  private createFallbackPageAnalysis(pageData: any, elements: any[]): PageAnalysis {
    return {
      url: pageData.url,
      title: pageData.title,
      purpose: 'Página da aplicação web',
      userJourney: ['Acessar página', 'Visualizar conteúdo', 'Interagir com elementos'],
      keyFeatures: elements.slice(0, 5).map((el: any) => el.text || el.type),
      elementAnalyses: elements.map(el => this.createFallbackElementAnalysis(el)),
      navigationFlow: ['Entrada na página', 'Navegação entre elementos', 'Execução de ações'],
      accessibility: {
        score: 75,
        issues: ['Análise detalhada não disponível'],
        recommendations: ['Verificar acessibilidade manualmente']
      }
    };
  }

  private createFallbackCrawlAnalysis(crawlResults: any[], pageAnalyses: PageAnalysis[]): CrawlAnalysis {
    const totalElements = crawlResults.reduce((sum, page) => sum + (page.elements?.length || 0), 0);
    
    return {
      summary: 'Aplicação web com múltiplas páginas e funcionalidades interativas',
      totalPages: crawlResults.length,
      totalElements,
      keyFunctionalities: ['Navegação web', 'Interação com formulários', 'Acesso a informações'],
      userWorkflows: ['Login → Navegação → Interação', 'Busca → Resultados → Seleção'],
      recommendations: ['Melhorar acessibilidade', 'Otimizar navegação', 'Adicionar mais feedback visual'],
      pageAnalyses,
      technicalInsights: {
        technologies: ['HTML', 'CSS', 'JavaScript'],
        patterns: ['Single Page Application', 'Responsive Design'],
        complexity: 'medium'
      }
    };
  }



  // 🔧 MÉTODOS ADICIONAIS PARA CACHE E PERSISTÊNCIA

  private async loadComponentCache(): Promise<void> {
    try {
      const data = await fs.readFile(this.cacheFile, 'utf-8');
      const cache = JSON.parse(data);
      
      Object.entries(cache).forEach(([key, value]) => {
        this.componentCache.set(key, value as ElementAnalysis);
      });
      
      this.log(`📋 Cache de componentes carregado: ${this.componentCache.size} entradas`);
    } catch (error) {
      this.log('📝 Criando novo cache de componentes');
    }
  }

  private async saveComponentCache(): Promise<void> {
    try {
      const cache: Record<string, ElementAnalysis> = {};
      this.componentCache.forEach((value, key) => {
        cache[key] = value;
      });
      
      await fs.writeFile(this.cacheFile, JSON.stringify(cache, null, 2), 'utf-8');
      this.log(`💾 Cache de componentes salvo: ${this.componentCache.size} entradas`);
    } catch (error) {
      this.log(`❌ Erro ao salvar cache: ${error}`, 'error');
    }
  }

  private generateElementHash(element: any): string {
    const crypto = require('crypto');
    const elementKey = `${element.type}-${element.text}-${element.selector}`;
    return crypto.createHash('md5').update(elementKey).digest('hex');
  }

  private getCachedAnalysis(element: any): ElementAnalysis | null {
    const hash = this.generateElementHash(element);
    return this.componentCache.get(hash) || null;
  }

  private async cacheAnalysis(element: any, analysis: ElementAnalysis): Promise<void> {
    const hash = this.generateElementHash(element);
    this.componentCache.set(hash, analysis);
    if (this.componentCache.size % 10 === 0) {
      await this.saveComponentCache();
    }
  }


  async saveAnalysisResults(analysis: CrawlAnalysis, filename?: string): Promise<string> {
    const outputDir = path.join(process.cwd(), 'output', 'final_documents');
    await fs.mkdir(outputDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const analysisFile = filename || `analysis-results-${timestamp}.md`;
    const filePath = path.join(outputDir, analysisFile);
    
    const markdownContent = this.generateAnalysisMarkdown(analysis);
    await fs.writeFile(filePath, markdownContent, 'utf-8');
    
    this.log(`📄 Resultados de análise salvos em: ${analysisFile}`);
    return filePath;
  }

  private generateAnalysisMarkdown(analysis: CrawlAnalysis): string {
    const functionalitiesList = analysis.keyFunctionalities.map(func => `- ${func}`).join('\n');
    const workflowsList = analysis.userWorkflows.map((workflow, idx) => `${idx + 1}. ${workflow}`).join('\n');
    const recommendationsList = analysis.recommendations.map(rec => `- ${rec}`).join('\n');
    const technologiesList = analysis.technicalInsights.technologies.map(tech => `- ${tech}`).join('\n');
    const patternsList = analysis.technicalInsights.patterns.map(pattern => `- ${pattern}`).join('\n');
    
    const pagesContent = analysis.pageAnalyses.map((page, idx) => {
      const userJourneySteps = page.userJourney.map(step => `1. ${step}`).join('\n');
      const navigationSteps = page.navigationFlow.map(nav => `- ${nav}`).join('\n');
      const accessibilityIssues = page.accessibility.issues.length > 0 ? 
        page.accessibility.issues.map(issue => `- ❌ ${issue}`).join('\n') : 
        '- ✅ Nenhum problema crítico encontrado';
      const accessibilityRecs = page.accessibility.recommendations.length > 0 ? 
        `**Recomendações de Acessibilidade**:\n${page.accessibility.recommendations.map(rec => `- ${rec}`).join('\n')}` : '';
        
      return `
### ${idx + 1}. ${page.title}
- **URL**: ${page.url}
- **Propósito**: ${page.purpose}
- **Elementos Analisados**: ${page.elementAnalyses.length}
- **Recursos Principais**: ${page.keyFeatures.join(', ')}

**Jornada do Usuário**:
${userJourneySteps}

**Navegação**:
${navigationSteps}

**Acessibilidade** (Pontuação: ${page.accessibility.score}/10):
${accessibilityIssues}

${accessibilityRecs}
`;
    }).join('\n');

    return `# Relatório de Análise - ${new Date().toLocaleString()}

## 📋 Resumo Executivo
${analysis.summary}


## 📊 Estatísticas Gerais
- **Total de Páginas Analisadas**: ${typeof analysis?.totalPages === 'number' ? analysis.totalPages : 'N/A'}
- **Total de Elementos Interativos**: ${typeof analysis?.totalElements === 'number' ? analysis.totalElements : 0}
- **Complexidade do Sistema**: ${analysis?.technicalInsights?.complexity ? String(analysis.technicalInsights.complexity).toUpperCase() : 'N/A'}

## 🎯 Funcionalidades Principais
${functionalitiesList}

## 👤 Fluxos de Usuário Identificados
${workflowsList}

## 💡 Recomendações
${recommendationsList}

## 🔧 Insights Técnicos

### Tecnologias Identificadas
${technologiesList}

### Padrões de Design
${patternsList}

## 📑 Análise Detalhada por Página
${pagesContent}

---
*Relatório gerado automaticamente pelo AnalysisAgent v${this.config.version}*
`;
  }

  async finalize(): Promise<void> {
    await this.saveComponentCache();
    this.log('AnalysisAgent finalizado');
  }

  async cleanup(): Promise<void> {
    this.currentAnalysis = null;
    await this.saveComponentCache();
    this.log('AnalysisAgent cleanup finalizado');
  }

  async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    if (!taskResult.success) {
      return `## Relatório de Análise\n\n**Falha:** ${taskResult.error}`;
    }
    return `## Relatório de Análise\n\n- **Status:** Sucesso\n- **Sumário:** ${taskResult.data?.summary}`;
  }

}