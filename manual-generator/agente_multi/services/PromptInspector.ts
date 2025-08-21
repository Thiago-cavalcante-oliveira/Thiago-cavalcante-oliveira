import * as fs from 'fs/promises';
import * as path from 'path';

interface PromptMetrics {
  id: string;
  prompt: string;
  timestamp: Date;
  tokenCount: number;
  responseTime: number;
  success: boolean;
  provider: string;
  model: string;
  errorMessage?: string;
  responseLength: number;
  quality?: number; // 1-10 scale
}

interface PromptAnalysis {
  averageTokens: number;
  averageResponseTime: number;
  successRate: number;
  mostEffectivePrompts: PromptMetrics[];
  commonFailures: string[];
  recommendations: string[];
}

interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  category: string;
  description: string;
  examples: Array<{
    input: Record<string, any>;
    expectedOutput: string;
  }>;
}

export class PromptInspector {
  private metricsFile: string;
  private templatesFile: string;
  private metrics: PromptMetrics[] = [];
  private templates: PromptTemplate[] = [];

  constructor() {
    this.metricsFile = path.join(process.cwd(), 'output', 'prompt-metrics.json');
    this.templatesFile = path.join(process.cwd(), 'prompts', 'templates.json');
    this.loadData();
  }

  /**
   * Registra métricas de uma execução de prompt
   */
  async recordPromptExecution(data: {
    prompt: string;
    responseTime: number;
    success: boolean;
    provider: string;
    model: string;
    errorMessage?: string;
    responseLength: number;
    quality?: number;
  }): Promise<void> {
    const metric: PromptMetrics = {
      id: this.generateId(),
      prompt: data.prompt,
      timestamp: new Date(),
      tokenCount: this.estimateTokenCount(data.prompt),
      responseTime: data.responseTime,
      success: data.success,
      provider: data.provider,
      model: data.model,
      errorMessage: data.errorMessage,
      responseLength: data.responseLength,
      quality: data.quality
    };

    this.metrics.push(metric);
    
    // Manter apenas os últimos 1000 registros
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    await this.saveMetrics();
  }

  /**
   * Analisa as métricas coletadas
   */
  analyzePrompts(): PromptAnalysis {
    if (this.metrics.length === 0) {
      return {
        averageTokens: 0,
        averageResponseTime: 0,
        successRate: 0,
        mostEffectivePrompts: [],
        commonFailures: [],
        recommendations: ['Não há dados suficientes para análise']
      };
    }

    const successfulMetrics = this.metrics.filter(m => m.success);
    const failedMetrics = this.metrics.filter(m => !m.success);

    const analysis: PromptAnalysis = {
      averageTokens: this.calculateAverage(this.metrics.map(m => m.tokenCount)),
      averageResponseTime: this.calculateAverage(this.metrics.map(m => m.responseTime)),
      successRate: (successfulMetrics.length / this.metrics.length) * 100,
      mostEffectivePrompts: this.findMostEffectivePrompts(),
      commonFailures: this.analyzeCommonFailures(failedMetrics),
      recommendations: this.generateRecommendations()
    };

    return analysis;
  }

  /**
   * Otimiza um prompt baseado nas métricas históricas
   */
  optimizePrompt(prompt: string): {
    optimizedPrompt: string;
    suggestions: string[];
    estimatedImprovement: string;
  } {
    const suggestions: string[] = [];
    let optimizedPrompt = prompt;

    // Análise de comprimento
    const tokenCount = this.estimateTokenCount(prompt);
    if (tokenCount > 500) {
      suggestions.push('Considere reduzir o comprimento do prompt para melhor performance');
    }

    // Análise de estrutura
    if (!prompt.includes('Responda em formato JSON') && !prompt.includes('formato estruturado')) {
      suggestions.push('Adicione instruções para formato de resposta estruturado');
      optimizedPrompt += '\n\nPor favor, responda em formato JSON estruturado.';
    }

    // Análise de clareza
    if (prompt.split('\n').length < 3) {
      suggestions.push('Considere quebrar o prompt em seções para maior clareza');
    }

    // Análise de contexto
    if (!prompt.toLowerCase().includes('contexto') && !prompt.toLowerCase().includes('background')) {
      suggestions.push('Adicione mais contexto para melhor compreensão');
    }

    return {
      optimizedPrompt,
      suggestions,
      estimatedImprovement: this.estimateImprovement(suggestions.length)
    };
  }

  /**
   * Cria um template de prompt
   */
  async createTemplate(template: Omit<PromptTemplate, 'id'>): Promise<string> {
    const newTemplate: PromptTemplate = {
      id: this.generateId(),
      ...template
    };

    this.templates.push(newTemplate);
    await this.saveTemplates();
    
    return newTemplate.id;
  }

  /**
   * Aplica um template com variáveis
   */
  applyTemplate(templateId: string, variables: Record<string, any>): string {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template ${templateId} não encontrado`);
    }

    let result = template.template;
    
    // Substituir variáveis
    template.variables.forEach(variable => {
      const value = variables[variable];
      if (value !== undefined) {
        result = result.replace(new RegExp(`{{${variable}}}`, 'g'), String(value));
      }
    });

    return result;
  }

  /**
   * Lista todos os templates disponíveis
   */
  getTemplates(): PromptTemplate[] {
    return this.templates;
  }

  /**
   * Gera relatório de performance
   */
  generatePerformanceReport(): string {
    const analysis = this.analyzePrompts();
    
    return `
# Relatório de Performance de Prompts

## Métricas Gerais
- **Total de execuções**: ${this.metrics.length}
- **Taxa de sucesso**: ${analysis.successRate.toFixed(2)}%
- **Tempo médio de resposta**: ${analysis.averageResponseTime.toFixed(2)}ms
- **Tokens médios por prompt**: ${analysis.averageTokens.toFixed(0)}

## Prompts Mais Efetivos
${analysis.mostEffectivePrompts.map((p, i) => 
  `${i + 1}. Tempo: ${p.responseTime}ms, Qualidade: ${p.quality || 'N/A'}`
).join('\n')}

## Falhas Comuns
${analysis.commonFailures.map(f => `- ${f}`).join('\n')}

## Recomendações
${analysis.recommendations.map(r => `- ${r}`).join('\n')}

---
*Relatório gerado em ${new Date().toLocaleString()}*
`;
  }

  // Métodos privados
  private async loadData(): Promise<void> {
    try {
      const metricsData = await fs.readFile(this.metricsFile, 'utf-8');
      this.metrics = JSON.parse(metricsData).map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp)
      }));
    } catch (error) {
      this.metrics = [];
    }

    try {
      const templatesData = await fs.readFile(this.templatesFile, 'utf-8');
      this.templates = JSON.parse(templatesData);
    } catch (error) {
      this.templates = [];
    }
  }

  private async saveMetrics(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.metricsFile), { recursive: true });
      await fs.writeFile(this.metricsFile, JSON.stringify(this.metrics, null, 2));
    } catch (error) {
      console.error('Erro ao salvar métricas:', error);
    }
  }

  private async saveTemplates(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.templatesFile), { recursive: true });
      await fs.writeFile(this.templatesFile, JSON.stringify(this.templates, null, 2));
    } catch (error) {
      console.error('Erro ao salvar templates:', error);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private estimateTokenCount(text: string): number {
    // Estimativa simples: ~4 caracteres por token
    return Math.ceil(text.length / 4);
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  private findMostEffectivePrompts(): PromptMetrics[] {
    return this.metrics
      .filter(m => m.success && m.quality)
      .sort((a, b) => (b.quality || 0) - (a.quality || 0))
      .slice(0, 5);
  }

  private analyzeCommonFailures(failedMetrics: PromptMetrics[]): string[] {
    const errorCounts: Record<string, number> = {};
    
    failedMetrics.forEach(metric => {
      if (metric.errorMessage) {
        const errorType = this.categorizeError(metric.errorMessage);
        errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
      }
    });

    return Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => `${error} (${count} ocorrências)`);
  }

  private categorizeError(errorMessage: string): string {
    if (errorMessage.includes('timeout')) return 'Timeout';
    if (errorMessage.includes('rate limit')) return 'Rate Limit';
    if (errorMessage.includes('quota')) return 'Quota Exceeded';
    if (errorMessage.includes('invalid')) return 'Invalid Request';
    return 'Other Error';
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metrics.length === 0) {
      return ['Não há dados suficientes para recomendações'];
    }

    const successfulMetrics = this.metrics.filter(m => m.success);
    const successRate = (successfulMetrics.length / this.metrics.length) * 100;
    const averageResponseTime = this.calculateAverage(this.metrics.map(m => m.responseTime));
    const averageTokens = this.calculateAverage(this.metrics.map(m => m.tokenCount));

    if (successRate < 90) {
      recommendations.push('Taxa de sucesso baixa - revisar estrutura dos prompts');
    }

    if (averageResponseTime > 5000) {
      recommendations.push('Tempo de resposta alto - considerar prompts mais concisos');
    }

    if (averageTokens > 1000) {
      recommendations.push('Prompts muito longos - otimizar para reduzir tokens');
    }

    return recommendations;
  }

  private estimateImprovement(suggestionCount: number): string {
    if (suggestionCount === 0) return 'Nenhuma melhoria identificada';
    if (suggestionCount <= 2) return 'Melhoria pequena esperada (5-10%)';
    if (suggestionCount <= 4) return 'Melhoria moderada esperada (10-20%)';
    return 'Melhoria significativa esperada (20%+)';
  }
}