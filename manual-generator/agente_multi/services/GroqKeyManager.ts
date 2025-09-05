import Groq from 'groq-sdk';
import { logger } from '../utils/logger';

export class GroqKeyManager {
  private keys: string[] = [];
  private currentKeyIndex = 0;
  private groqInstances: Map<string, Groq> = new Map();
  private log = logger.child({ service: 'GroqKeyManager' });

  constructor() {
    this.loadApiKeys();
     if (this.keys.length === 0) {
      this.log.warn('Nenhuma chave API do Groq configurada (GROQ_API_KEY_n)');
    }
  }

  private loadApiKeys(): void {
    for (let i = 1; i <= 5; i++) {
      const key = process.env[`GROQ_API_KEY_${i}`];
      if (key) this.keys.push(key.trim());
    }
    this.keys.forEach(key => {
        this.groqInstances.set(key, new Groq({ apiKey: key }));
    });
    if (this.keys.length > 0) {
        this.log.info(`🔑 ${this.keys.length} chaves API do Groq configuradas.`);
    }
  }

  private getNextKey(): string | null {
     if (this.keys.length === 0) return null;
    const key = this.keys[this.currentKeyIndex];
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
    return key;
  }

  async handleApiCall(prompt: string): Promise<Groq.Chat.Completions.ChatCompletion> {
    if (this.keys.length === 0) throw new Error("Nenhuma chave Groq disponível.");

    const maxRetries = this.keys.length;
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
        const key = this.getNextKey();
        if (!key) continue;

        try {
            const groq = this.groqInstances.get(key);
            if (!groq) throw new Error("Instância Groq não encontrada para a chave.");

            this.log.info({ key: key.substring(0, 8) + '...' }, 'Tentando chamada com a chave Groq');
            return await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama3-8b-8192',
            });
        } catch (error) {
            lastError = error as Error;
            this.log.warn({ key: key.substring(0, 8) + '...', error: lastError.message }, 'Falha com a chave Groq, rotacionando...');
        }
    }
    throw lastError || new Error('Todas as chaves Groq falharam.');
  }
}

