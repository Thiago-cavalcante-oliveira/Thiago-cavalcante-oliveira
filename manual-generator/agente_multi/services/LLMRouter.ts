import { GeminiKeyManager } from './GeminiKeyManager';
import { GroqKeyManager } from './GroqKeyManager';
import { logger } from '../utils/logger';
import { Part } from '@google/generative-ai';

export interface LLMConfig {
  provider?: 'gemini' | 'groq';
}

export interface LLMResponse {
  content: string;
  provider: string;
  responseTime: number;
}

export class LLMRouter {
  private geminiManager: GeminiKeyManager;
  private groqManager: GroqKeyManager;
  private log = logger.child({ service: 'LLMRouter' });

  constructor() {
    this.geminiManager = new GeminiKeyManager();
    this.groqManager = new GroqKeyManager();
  }

  async route(prompt: string, config: LLMConfig = {}, image?: Buffer): Promise<LLMResponse> {
    const startTime = Date.now();
    const provider = image ? 'gemini' : config.provider || 'groq';
    
    this.log.info({ provider }, 'Roteando requisição para LLM');

    try {
      let content = '';
      if (provider === 'gemini') {
        content = await this.callGemini(prompt, image);
      } else {
        content = await this.callGroq(prompt);
      }

      const responseTime = Date.now() - startTime;
      this.log.info({ provider, responseTime }, 'Sucesso na chamada à LLM');
      return { content, provider, responseTime };

    } catch (error) {
      this.log.error({ error, provider }, 'Falha na chamada ao provedor LLM');
      if (provider === 'groq' && !image) {
        this.log.warn('Falha no Groq, tentando fallback com Gemini...');
        const content = await this.callGemini(prompt, image);
        const responseTime = Date.now() - startTime;
        return { content, provider: 'gemini', responseTime };
      }
      throw error;
    }
  }

  private async callGemini(prompt: string, image?: Buffer): Promise<string> {
    const modelParts: (string | Part)[] = [prompt];
    if (image) {
      modelParts.push({
        inlineData: { mimeType: 'image/png', data: image.toString('base64') },
      });
    }

    const result = await this.geminiManager.handleApiCall(async (model) =>
      model.generateContent({ contents: [{ role: 'user', parts: modelParts }] })
    );
    return result.response.text();
  }

  private async callGroq(prompt: string): Promise<string> {
    const result = await this.groqManager.handleApiCall(prompt);
    return result?.choices?.[0]?.message?.content || '';
  }
}

export const llmRouter = new LLMRouter();

