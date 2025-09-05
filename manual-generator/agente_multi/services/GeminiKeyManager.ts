import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';

export class GeminiKeyManager {
  private keys: string[] = [];
  private currentKeyIndex = 0;
  private genAIInstances: Map<string, GoogleGenerativeAI> = new Map();
  private log = logger.child({ service: 'GeminiKeyManager' });

  constructor() {
    this.loadApiKeys();
    if (this.keys.length === 0) {
      this.log.warn('Nenhuma chave API do Gemini configurada (GEMINI_API_KEY_n ou GOOGLE_API_KEY)');
    }
  }

  private loadApiKeys(): void {
    for (let i = 1; i <= 5; i++) {
      const key = process.env[`GEMINI_API_KEY_${i}`];
      if (key) this.keys.push(key.trim());
    }
    if (this.keys.length === 0 && process.env.GOOGLE_API_KEY) {
      this.keys.push(process.env.GOOGLE_API_KEY.trim());
    }
    
    this.keys.forEach(key => {
        this.genAIInstances.set(key, new GoogleGenerativeAI(key));
    });

    if (this.keys.length > 0) {
        this.log.info(`🔑 ${this.keys.length} chaves API do Gemini configuradas.`);
    }
  }

  private getNextKey(): string | null {
    if (this.keys.length === 0) return null;
    const key = this.keys[this.currentKeyIndex];
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
    return key;
  }

  async handleApiCall<T>(apiCall: (model: any) => Promise<T>): Promise<T> {
    if (this.keys.length === 0) throw new Error("Nenhuma chave Gemini disponível.");
    
    const maxRetries = this.keys.length;
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
        const key = this.getNextKey();
        if (!key) continue;
        
        try {
            const genAI = this.genAIInstances.get(key);
            if (!genAI) throw new Error("Instância GenAI não encontrada para a chave.");
            
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            this.log.info({ key: key.substring(0, 8) + '...' }, 'Tentando chamada com a chave Gemini');
            return await apiCall(model);
        } catch (error) {
            lastError = error as Error;
            this.log.warn({ key: key.substring(0, 8) + '...', error: lastError.message }, 'Falha com a chave Gemini, rotacionando...');
        }
    }
    throw lastError || new Error('Todas as chaves Gemini falharam.');
  }
}

