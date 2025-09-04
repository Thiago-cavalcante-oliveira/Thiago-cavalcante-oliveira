import { GeminiKeyManager } from './GeminiKeyManager.js';
import { GroqKeyManager } from './GroqKeyManager.js';
import { logger } from '../utils/logger.js';
import { Part } from '@google/generative-ai';

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
    // Prioridade padrão: Gemini para tarefas de visão, Groq para texto rápido
    this.providerPriority = ['groq', 'gemini'];
    this.circuitBreaker = new Map();
  }

  /**
   * Rota a requisição para o melhor provedor disponível.
   * Suporta tanto texto-puro quanto multimodal (texto + imagem).
   */
  async route(prompt: string, config: Partial<LLMConfig> = {}, image?: Buffer): Promise<LLMResponse> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();
    
    // Se uma imagem for fornecida, a tarefa é visual e deve usar o Gemini.
    const providersToTry: ('gemini' | 'groq')[] = image ? ['gemini'] : this.providerPriority;
    
    logger.info(`[LLMRouter] Roteando para: ${providersToTry.join(', ')}.`);
    
    const errors: LLMError[] = [];
    
    for (const provider of providersToTry) {
      if (this.isCircuitBreakerOpen(provider)) {
        logger.warn(`[LLMRouter] Circuit breaker aberto para ${provider}, pulando.`);
        continue;
      }
      
      try {
        const response = await this.callProvider(provider, prompt, finalConfig, image);
        this.recordSuccess(provider);
        const responseTime = Date.now() - startTime;
        logger.info(`[LLMRouter] Sucesso com ${provider} em ${responseTime}ms`);
        return { ...response, responseTime };
      } catch (error) {
        const llmError: LLMError = {
          provider,
          error: error instanceof Error ? error.message : String(error),
          retryable: this.isRetryableError(error)
        };
        errors.push(llmError);
        this.recordFailure(provider);
        logger.warn(`[LLMRouter] Falha com ${provider}: ${llmError.error}`);
      }
    }
    
    const totalTime = Date.now() - startTime;
    logger.error(`[LLMRouter] Todos os provedores falharam após ${totalTime}ms`);
    throw new Error(`Todos os provedores LLM falharam: ${errors.map(e => `${e.provider}: ${e.error}`).join(', ')}`);
  }

  private async callProvider(provider: 'gemini' | 'groq', prompt: string, config: LLMConfig, image?: Buffer): Promise<Omit<LLMResponse, 'responseTime'>> {
    switch (provider) {
      case 'gemini':
        return this.callGemini(prompt, config, image);
      case 'groq':
        if (image) throw new Error('Groq não suporta input de imagem nesta implementação.');
        return this.callGroq(prompt, config);
      default:
        throw new Error(`Provedor não suportado: ${provider}`);
    }
  }

  private async callGemini(prompt: string, config: LLMConfig, image?: Buffer): Promise<Omit<LLMResponse, 'responseTime'>> {
    const modelParts: (string | Part)[] = [prompt];
    if (image) {
      modelParts.push({
        inlineData: { mimeType: 'image/png', data: image.toString('base64') },
      });
    }
    
    const result = await this.geminiManager.handleApiCall(async (model) => {
      // O SDK do Gemini usa um objeto de conteúdo para chamadas multimodais
      return model.generateContent({ contents: [{ role: 'user', parts: modelParts }] });
    });
    
    return {
      content: result.response.text(),
      provider: 'gemini',
      model: config.model || 'gemini-1.5-flash',
      tokensUsed: result.response.usageMetadata?.totalTokenCount
    };
  }

  private async callGroq(prompt: string, config: LLMConfig): Promise<Omit<LLMResponse, 'responseTime'>> {
    const result = await this.groqManager.handleApiCall(prompt);
    const content = result?.response?.text ? result.response.text() : (result?.choices?.[0]?.message?.content || '');

    return {
      content: content,
      provider: 'groq',
      model: config.model || 'mixtral-8x7b-32768',
      tokensUsed: result.usage?.total_tokens
    };
  }

  
  private isRetryableError(error: any): boolean {
    // Implemente a lógica para determinar se o erro é retentável
    // Ex: Erros de rede, timeouts, limites de taxa
    const errorMessage = String(error).toLowerCase();
    return errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('rate limit');
  }

  private isCircuitBreakerOpen(provider: string): boolean {
    const state = this.circuitBreaker.get(provider);
    if (!state) return false;

    if (state.isOpen && (Date.now() - state.lastFailure > this.resetTimeout)) {
      // Tempo de reset passou, tentar fechar o circuit breaker
      state.isOpen = false;
      state.failures = 0;
      this.circuitBreaker.set(provider, state);
      return false;
    }
    return state.isOpen;
  }

  private recordFailure(provider: string): void {
    const state = this.circuitBreaker.get(provider) || { failures: 0, lastFailure: 0, isOpen: false };
    state.failures++;
    state.lastFailure = Date.now();
    if (state.failures >= this.maxFailures) {
      state.isOpen = true;
      logger.error(`[LLMRouter] Circuit breaker aberto para ${provider} após ${state.failures} falhas.`);
    }
    this.circuitBreaker.set(provider, state);
  }

  private recordSuccess(provider: string): void {
    const state = this.circuitBreaker.get(provider);
    if (state) {
      state.failures = 0;
      state.isOpen = false;
      this.circuitBreaker.set(provider, state);
    }
  }
}

export const llmRouter = new LLMRouter();