import { GeminiKeyManager } from './GeminiKeyManager.js';
import { GroqKeyManager } from './GroqKeyManager.js';
import { logger } from '../utils/logger.js';

export interface LLMConfig {
  provider: 'gemini' | 'groq';
  model?: string;
  maxTokens?: number;
  temperature?: number;
  retryAttempts?: number;
  timeout?: number;
}

export interface LLMResponse {
  content: string;
  provider: string;
  model: string;
  tokensUsed?: number;
  responseTime: number;
}

export interface LLMError {
  provider: string;
  error: string;
  retryable: boolean;
}

export class LLMRouter {
  private geminiManager: GeminiKeyManager;
  private groqManager: GroqKeyManager;
  private defaultConfig: LLMConfig;
  private providerPriority: ('gemini' | 'groq')[];
  private circuitBreaker: Map<string, { failures: number; lastFailure: number; isOpen: boolean }>;
  private readonly maxFailures = 3;
  private readonly resetTimeout = 60000; // 1 minute

  constructor(config?: Partial<LLMConfig>) {
    this.geminiManager = new GeminiKeyManager();
    this.groqManager = new GroqKeyManager();
    this.defaultConfig = {
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      maxTokens: 4000,
      temperature: 0.7,
      retryAttempts: 3,
      timeout: 30000,
      ...config
    };
    this.providerPriority = ['gemini', 'groq'];
    this.circuitBreaker = new Map();
  }

  /**
   * Rota a requisição para o melhor provedor disponível
   */
  async route(prompt: string, config?: Partial<LLMConfig>): Promise<LLMResponse> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();
    
    logger.info(`[LLMRouter] Iniciando roteamento para prompt de ${prompt.length} caracteres`);
    
    // Validar prompt
    this.validatePrompt(prompt);
    
    // Tentar provedores em ordem de prioridade
    const errors: LLMError[] = [];
    
    for (const provider of this.providerPriority) {
      if (this.isCircuitBreakerOpen(provider)) {
        logger.warn(`[LLMRouter] Circuit breaker aberto para ${provider}, pulando`);
        continue;
      }
      
      try {
        const response = await this.callProvider(provider, prompt, finalConfig);
        this.recordSuccess(provider);
        
        const responseTime = Date.now() - startTime;
        logger.info(`[LLMRouter] Sucesso com ${provider} em ${responseTime}ms`);
        
        return {
          ...response,
          responseTime
        };
      } catch (error) {
        const llmError: LLMError = {
          provider,
          error: error instanceof Error ? error.message : String(error),
          retryable: this.isRetryableError(error)
        };
        
        errors.push(llmError);
        this.recordFailure(provider);
        
        logger.warn(`[LLMRouter] Falha com ${provider}: ${llmError.error}`);
        
        // Se não é um erro que vale a pena tentar novamente, pular para próximo provedor
        if (!llmError.retryable) {
          continue;
        }
      }
    }
    
    // Se chegou aqui, todos os provedores falharam
    const totalTime = Date.now() - startTime;
    logger.error(`[LLMRouter] Todos os provedores falharam após ${totalTime}ms`);
    
    throw new Error(`Todos os provedores LLM falharam: ${errors.map(e => `${e.provider}: ${e.error}`).join(', ')}`);
  }

  /**
   * Chama um provedor específico
   */
  private async callProvider(provider: 'gemini' | 'groq', prompt: string, config: LLMConfig): Promise<Omit<LLMResponse, 'responseTime'>> {
    switch (provider) {
      case 'gemini':
        return await this.callGemini(prompt, config);
      case 'groq':
        return await this.callGroq(prompt, config);
      default:
        throw new Error(`Provedor não suportado: ${provider}`);
    }
  }

  /**
   * Chama o Gemini
   */
  private async callGemini(prompt: string, config: LLMConfig): Promise<Omit<LLMResponse, 'responseTime'>> {
    const result = await this.geminiManager.handleApiCall(async (model) => {
      return await model.generateContent(prompt);
    });
    
    return {
      content: result.response.text(),
      provider: 'gemini',
      model: config.model || 'gemini-1.5-flash',
      tokensUsed: result.response.usageMetadata?.totalTokenCount
    };
  }

  /**
   * Chama o Groq
   */
  private async callGroq(prompt: string, config: LLMConfig): Promise<Omit<LLMResponse, 'responseTime'>> {
    const result = await this.groqManager.handleApiCall(prompt);
    
    return {
      content: result.choices[0].message.content || '',
      provider: 'groq',
      model: config.model || 'llama-3.1-70b-versatile',
      tokensUsed: result.usage?.total_tokens
    };
  }

  /**
   * Valida o prompt antes do envio
   */
  private validatePrompt(prompt: string): void {
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt não pode estar vazio');
    }
    
    if (prompt.length > 100000) {
      throw new Error('Prompt muito longo (máximo 100.000 caracteres)');
    }
    
    // Verificar se contém placeholders não resolvidos
    const placeholderPattern = /\{\{[^}]+\}\}/g;
    const placeholders = prompt.match(placeholderPattern);
    if (placeholders) {
      logger.warn(`[LLMRouter] Placeholders não resolvidos encontrados: ${placeholders.join(', ')}`);
    }
  }

  /**
   * Verifica se um erro é passível de retry
   */
  private isRetryableError(error: any): boolean {
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    
    // Erros de rede e temporários são passíveis de retry
    const retryablePatterns = [
      'timeout',
      'network',
      'connection',
      'rate limit',
      'quota exceeded',
      'service unavailable',
      '429',
      '500',
      '502',
      '503',
      '504'
    ];
    
    return retryablePatterns.some(pattern => errorMessage.includes(pattern));
  }

  /**
   * Gerenciamento do Circuit Breaker
   */
  private isCircuitBreakerOpen(provider: string): boolean {
    const breaker = this.circuitBreaker.get(provider);
    if (!breaker) return false;
    
    if (breaker.isOpen) {
      // Verificar se é hora de tentar novamente
      if (Date.now() - breaker.lastFailure > this.resetTimeout) {
        breaker.isOpen = false;
        breaker.failures = 0;
        logger.info(`[LLMRouter] Circuit breaker resetado para ${provider}`);
        return false;
      }
      return true;
    }
    
    return false;
  }

  private recordSuccess(provider: string): void {
    const breaker = this.circuitBreaker.get(provider);
    if (breaker) {
      breaker.failures = 0;
      breaker.isOpen = false;
    }
  }

  private recordFailure(provider: string): void {
    let breaker = this.circuitBreaker.get(provider);
    if (!breaker) {
      breaker = { failures: 0, lastFailure: 0, isOpen: false };
      this.circuitBreaker.set(provider, breaker);
    }
    
    breaker.failures++;
    breaker.lastFailure = Date.now();
    
    if (breaker.failures >= this.maxFailures) {
      breaker.isOpen = true;
      logger.warn(`[LLMRouter] Circuit breaker aberto para ${provider} após ${breaker.failures} falhas`);
    }
  }

  /**
   * Obtém estatísticas dos provedores
   */
  getProviderStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [provider, breaker] of this.circuitBreaker.entries()) {
      stats[provider] = {
        failures: breaker.failures,
        isOpen: breaker.isOpen,
        lastFailure: breaker.lastFailure ? new Date(breaker.lastFailure).toISOString() : null
      };
    }
    
    return stats;
  }

  /**
   * Define a prioridade dos provedores
   */
  setProviderPriority(priority: ('gemini' | 'groq')[]): void {
    this.providerPriority = [...priority];
    logger.info(`[LLMRouter] Prioridade de provedores atualizada: ${priority.join(' -> ')}`);
  }

  /**
   * Força o reset de um circuit breaker
   */
  resetCircuitBreaker(provider: string): void {
    const breaker = this.circuitBreaker.get(provider);
    if (breaker) {
      breaker.failures = 0;
      breaker.isOpen = false;
      breaker.lastFailure = 0;
      logger.info(`[LLMRouter] Circuit breaker resetado manualmente para ${provider}`);
    }
  }
}

// Instância singleton
export const llmRouter = new LLMRouter();