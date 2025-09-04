import fetch from 'node-fetch';
import * as fs from 'fs/promises';
import * as path from 'path';

interface GroqKeyStatus {
  key: string;
  isActive: boolean;
  lastUsed: Date;
  requestCount: number;
  quotaExhausted: boolean;
  dailyLimit: number;
  resetTime: Date;
}

interface GroqKeyManagerData {
  keys: GroqKeyStatus[];
  currentKeyIndex: number;
  lastRotation: Date;
}

export class GroqKeyManager {
  private keyManager: GroqKeyManagerData;
  private readonly DAILY_LIMIT_FREE_TIER = 14400; // Limite diário do Groq
  private readonly RATE_LIMIT_DELAY = 1000; // 1 segundo entre requests
  private readonly MAX_RETRIES = 2;
  private readonly statusFilePath: string;
  private model: string;

  constructor() {
    this.statusFilePath = path.join(process.cwd(), 'groq-keys-status.json');
    
    // Usar modelo padrão se não estiver definido
    this.model = process.env.GROQ_MODEL || 'mixtral-8x7b-32768';
    
    this.keyManager = {
      keys: [],
      currentKeyIndex: 0,
      lastRotation: new Date()
    };
    
    this.loadApiKeys();
  }

  private loadApiKeys(): void {
    const keys: string[] = [];
    
    // Verificar se a chave do Groq está disponível
    if (!process.env.GROQ_API_KEY) {
      console.warn('⚠️ [GroqKeyManager] GROQ_API_KEY não encontrada nas variáveis de ambiente');
      throw new Error('GROQ_API_KEY é obrigatória para usar o Groq API');
    }
    
    // Compatibilidade com chave única
    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== '') {
      keys.push(process.env.GROQ_API_KEY.trim());
    }

    if (keys.length === 0) {
      throw new Error('Nenhuma chave API do Groq configurada');
    }

    const now = new Date();
    // Inicializar status das chaves
    this.keyManager.keys = keys.map(key => ({
      key,
      isActive: true,
      lastUsed: now,
      requestCount: 0,
      quotaExhausted: false,
      dailyLimit: this.DAILY_LIMIT_FREE_TIER,
      resetTime: this.getNextResetTime()
    }));

    this.loadKeyStatus();
    console.log(`✅ GroqKeyManager inicializado com ${keys.length} chaves`);
  }

  private getNextResetTime(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  private async loadKeyStatus(): Promise<void> {
    try {
      const data = await fs.readFile(this.statusFilePath, 'utf-8');
      const savedStatus = JSON.parse(data);
      
      // Mesclar status salvos com chaves atuais
      this.keyManager.keys.forEach(keyStatus => {
        const saved = savedStatus.keys?.find((s: any) => s.key === keyStatus.key);
        if (saved) {
          keyStatus.requestCount = saved.requestCount || 0;
          keyStatus.quotaExhausted = saved.quotaExhausted || false;
          keyStatus.lastUsed = new Date(saved.lastUsed || Date.now());
          keyStatus.resetTime = new Date(saved.resetTime || this.getNextResetTime());
          
          // Reset diário
          if (new Date() > keyStatus.resetTime) {
            keyStatus.requestCount = 0;
            keyStatus.quotaExhausted = false;
            keyStatus.resetTime = this.getNextResetTime();
          }
        }
      });
    } catch (error) {
      console.log('📝 Criando novo arquivo de status das chaves Groq');
    }
  }

  private async saveKeyStatus(): Promise<void> {
    try {
      await fs.writeFile(this.statusFilePath, JSON.stringify(this.keyManager, null, 2));
    } catch (error) {
      console.warn('⚠️ Erro ao salvar status das chaves Groq:', error);
    }
  }

  private getNextAvailableKey(): GroqKeyStatus | null {
    const activeKeys = this.keyManager.keys.filter(k => k.isActive && !k.quotaExhausted);
    
    if (activeKeys.length === 0) {
      return null;
    }

    // Encontrar o índice atual na lista filtrada
    const currentKey = this.keyManager.keys[this.keyManager.currentKeyIndex];
    let currentIndexInActiveKeys = activeKeys.findIndex(k => k.key === currentKey?.key);
    
    // Se a chave atual não está na lista ativa, começar do início
    if (currentIndexInActiveKeys === -1) {
      currentIndexInActiveKeys = -1;
    }
    
    // Rotacionar para próxima chave disponível
    const nextIndexInActiveKeys = (currentIndexInActiveKeys + 1) % activeKeys.length;
    const nextKey = activeKeys[nextIndexInActiveKeys];
    
    // Atualizar o índice global
    this.keyManager.currentKeyIndex = this.keyManager.keys.findIndex(k => k.key === nextKey.key);
    
    return nextKey;
  }

  private async makeGroqRequest(prompt: string, keyStatus: GroqKeyStatus): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
    
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keyStatus.key}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: 'Você é um assistente de IA para geração de manuais.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 2048,
          temperature: 0.7
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        
        if (response.status === 429) {
          keyStatus.quotaExhausted = true;
          throw new Error(`Rate limit atingido para chave Groq`);
        }
        
        if (response.status === 401) {
          keyStatus.isActive = false;
          throw new Error(`Chave Groq inválida`);
        }
        
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Atualizar estatísticas da chave
      keyStatus.lastUsed = new Date();
      keyStatus.requestCount++;
      
      // Verificar se está próximo do limite
      if (keyStatus.requestCount >= keyStatus.dailyLimit * 0.9) {
        console.warn(`⚠️ Chave Groq próxima do limite: ${keyStatus.requestCount}/${keyStatus.dailyLimit}`);
      }
      
      await this.saveKeyStatus();
      
      const keyPreview = keyStatus.key.substring(0, 12) + '...';
      console.log(`✅ API call successful with Groq key: ${keyPreview} (${keyStatus.requestCount}/${keyStatus.dailyLimit})`);
      
      return data;
      
    } catch (error) {
       clearTimeout(timeoutId);
       
       if (error instanceof Error && error.name === 'AbortError') {
         throw new Error('Timeout na requisição Groq (30s)');
       }
       
       throw error;
     }
  }

  async handleApiCall(prompt: string): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      const keyStatus = this.getNextAvailableKey();
      
      if (!keyStatus) {
        throw new Error('Todas as chaves Groq estão esgotadas ou inativas');
      }
      
      try {
        if (attempt > 0) {
          console.log(`⚠️ Tentativa ${attempt + 1} com nova chave Groq`);
          await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY * attempt));
        }
        
        const data = await this.makeGroqRequest(prompt, keyStatus);
        return { response: { text: () => data.choices[0].message.content } };
        
      } catch (error) {
        lastError = error as Error;
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`⚠️ Erro com chave Groq, tentando próxima:`, errorMessage);
        
        // Se for erro de quota, tenta próxima chave imediatamente
        if (errorMessage.includes('Rate limit')) {
          continue;
        }
        
        // Para outros erros, aguarda antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY));
      }
    }
    
    throw lastError || new Error('Falha em todas as tentativas com chaves Groq');
  }

  getStatus(): any {
    const activeKeys = this.keyManager.keys.filter(k => k.isActive).length;
    const availableKeys = this.keyManager.keys.filter(k => k.isActive && !k.quotaExhausted).length;
    
    return {
      totalKeys: this.keyManager.keys.length,
      activeKeys,
      availableKeys,
      currentModel: this.model,
      keys: this.keyManager.keys.map(k => ({
        preview: k.key.substring(0, 12) + '...',
        isActive: k.isActive,
        quotaExhausted: k.quotaExhausted,
        requestCount: k.requestCount,
        dailyLimit: k.dailyLimit,
        lastUsed: k.lastUsed,
        resetTime: k.resetTime
      }))
    };
  }
}