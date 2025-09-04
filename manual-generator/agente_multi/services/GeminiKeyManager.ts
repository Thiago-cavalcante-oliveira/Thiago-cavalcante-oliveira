import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs/promises';
import * as path from 'path';

interface ApiKeyStatus {
  key: string;
  isActive: boolean;
  lastUsed: Date;
  requestCount: number;
  quotaExhausted: boolean;
  lastError?: string;
  dailyLimit: number;
  resetTime?: Date;
}

interface ApiKeyManager {
  keys: ApiKeyStatus[];
  currentKeyIndex: number;
  rotationStrategy: 'round-robin' | 'least-used' | 'health-based';
}

export class GeminiKeyManager {
  private keyManager: ApiKeyManager;
  private genAI: Map<string, GoogleGenerativeAI> = new Map();
  private statusFile: string;
  private readonly DAILY_LIMIT_FREE_TIER = 50;
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minuto

  constructor() {
    this.statusFile = path.join(process.cwd(), 'gemini-keys-status.json');
    this.keyManager = {
      keys: [],
      currentKeyIndex: 0,
      rotationStrategy: 'health-based'
    };
    
    this.loadApiKeys();
  }

  private loadApiKeys(): void {
    const keys: string[] = [];
    
    // Carregar todas as chaves configuradas no .env
    for (let i = 1; i <= 5; i++) {
      const key = process.env[`GEMINI_API_KEY_${i}`];
      if (key) {
        keys.push(key.trim());
      }
    }

    // Compatibilidade com chave única (versão anterior), se nenhuma chave numerada for encontrada
    if (keys.length === 0 && process.env.GOOGLE_API_KEY) {
      keys.push(process.env.GOOGLE_API_KEY.trim());
    }

    

    if (keys.length === 0) {
      console.warn('⚠️ [GeminiKeyManager] Nenhuma chave API do Gemini encontrada nas variáveis de ambiente (GEMINI_API_KEY_1 a 5 ou GOOGLE_API_KEY)');
      throw new Error('Pelo menos uma chave API do Gemini (GEMINI_API_KEY_N ou GOOGLE_API_KEY) é obrigatória para usar o Gemini API');
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

    // Inicializar clientes GoogleGenerativeAI
    keys.forEach(key => {
      this.genAI.set(key, new GoogleGenerativeAI(key));
    });

    console.log(`🔑 GeminiKeyManager: ${keys.length} chaves API configuradas`);
  }

  private getNextResetTime(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  async loadStatus(): Promise<void> {
    try {
      const data = await fs.readFile(this.statusFile, 'utf-8');
       const saved = JSON.parse(data) as ApiKeyManager;

    const now = new Date();
      
      // Manter apenas chaves que ainda existem na configuração
      const currentKeys = this.keyManager.keys.map(k => k.key);
      saved.keys = saved.keys.filter(k => currentKeys.includes(k.key));
      
      // Garantir que lastUsed e resetTime sejam Dates
      saved.keys = saved.keys.map(key => ({
        ...key,
        lastUsed: new Date(key.lastUsed || now),
        resetTime: new Date(key.resetTime || this.getNextResetTime())
      }));
      
      // Resetar contadores diários se necessário
      saved.keys.forEach(key => {
        if (key.resetTime && now > key.resetTime) {
          key.requestCount = 0;
          key.quotaExhausted = false;
          key.resetTime = this.getNextResetTime();
          key.isActive = true;
        }
      });
      
      this.keyManager = { ...this.keyManager, ...saved };
      console.log('🔄 Status das chaves API carregado do cache');
    } catch (error) {
      console.log('📝 Criando novo arquivo de status das chaves API');
    }
  }

  async saveStatus(): Promise<void> {
    try {
      await fs.writeFile(this.statusFile, JSON.stringify(this.keyManager, null, 2), 'utf-8');
    } catch (error) {
      console.error('❌ Erro ao salvar status das chaves:', error);
    }
  }

  async getActiveModel(): Promise<{ model: any; keyUsed: string } | null> {
    const activeKey = await this.getNextAvailableKey();
    
    if (!activeKey) {
      throw new Error('Nenhuma chave API disponível no momento');
    }

    const genAI = this.genAI.get(activeKey.key);
    if (!genAI) {
      throw new Error('Cliente GoogleGenerativeAI não encontrado');
    }

    return {
      model: genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }),
      keyUsed: activeKey.key
    };
  }

  private async getNextAvailableKey(): Promise<ApiKeyStatus | null> {
    // Resetar contadores diários se necessário
    this.resetDailyCountersIfNeeded();

    switch (this.keyManager.rotationStrategy) {
      case 'health-based':
        return this.getHealthBasedKey();
      case 'least-used':
        return this.getLeastUsedKey();
      case 'round-robin':
      default:
        return this.getRoundRobinKey();
    }
  }

  private resetDailyCountersIfNeeded(): void {
    const now = new Date();
    this.keyManager.keys.forEach(key => {
      if (key.resetTime && now > new Date(key.resetTime)) {
        key.requestCount = 0;
        key.quotaExhausted = false;
        key.resetTime = this.getNextResetTime();
        key.isActive = true;
        console.log(`🔄 Chave resetada: ${key.key.substring(0, 10)}...`);
      }
    });
  }

  private getHealthBasedKey(): ApiKeyStatus | null {
    // Preferir chaves ativas com menor uso
    const availableKeys = this.keyManager.keys
      .filter(key => key.isActive && !key.quotaExhausted && key.requestCount < key.dailyLimit)
      .sort((a, b) => a.requestCount - b.requestCount);

    return availableKeys.length > 0 ? availableKeys[0] : null;
  }

  private getLeastUsedKey(): ApiKeyStatus | null {
    const availableKeys = this.keyManager.keys
      .filter(key => key.isActive && !key.quotaExhausted && key.requestCount < key.dailyLimit)
      .sort((a, b) => a.requestCount - b.requestCount);

    return availableKeys.length > 0 ? availableKeys[0] : null;
  }

  private getRoundRobinKey(): ApiKeyStatus | null {
    const maxAttempts = this.keyManager.keys.length;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const key = this.keyManager.keys[this.keyManager.currentKeyIndex];
      this.keyManager.currentKeyIndex = (this.keyManager.currentKeyIndex + 1) % this.keyManager.keys.length;

      if (key.isActive && !key.quotaExhausted && key.requestCount < key.dailyLimit) {
        return key;
      }

      attempts++;
    }

    return null;
  }

  async handleApiCall<T>(apiCall: (model: any) => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    const maxRetries = 3;

    for (let retry = 0; retry < maxRetries; retry++) {
      try {
        const activeModel = await this.getActiveModel();
        if (!activeModel) {
          throw new Error('Nenhum modelo disponível');
        }
        
        const { model, keyUsed } = activeModel;
        const keyStatus = this.keyManager.keys.find(k => k.key === keyUsed);

        if (!keyStatus) {
          throw new Error('Status da chave não encontrado');
        }

        // Executar chamada da API
        const result = await apiCall(model);

        // Atualizar contadores de sucesso
        keyStatus.requestCount++;
        keyStatus.lastUsed = new Date();
        keyStatus.lastError = undefined;

        await this.saveStatus();
        
        console.log(`✅ API call successful with key: ${keyUsed.substring(0, 10)}... (${keyStatus.requestCount}/${keyStatus.dailyLimit})`);
        
        return result;

      } catch (error) {
        lastError = error as Error;
        await this.handleApiError(error as Error);
        
        // Se não há mais chaves disponíveis, não tentar novamente
        const availableKeys = this.keyManager.keys.filter(k => 
          k.isActive && !k.quotaExhausted && k.requestCount < k.dailyLimit
        );
        
        if (availableKeys.length === 0) {
          break;
        }

        // Aguardar antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1)));
      }
    }

    throw lastError || new Error('Todas as tentativas de API falharam');
  }

  private async handleApiError(error: Error): Promise<void> {
    const errorMsg = error.message.toLowerCase();

    // Identificar tipo de erro e chave problemática
    if (errorMsg.includes('quota') || errorMsg.includes('exceeded') || errorMsg.includes('429')) {
      await this.markKeyAsExhausted(error);
    } else if (errorMsg.includes('403') || errorMsg.includes('invalid')) {
      await this.markKeyAsInactive(error);
    } else if (errorMsg.includes('503') || errorMsg.includes('overloaded')) {
      // Erro temporário, não marcar chave como inativa
      console.log('⚠️ Serviço temporariamente sobrecarregado, tentando próxima chave');
    }

    await this.saveStatus();
  }

  private async markKeyAsExhausted(error: Error): Promise<void> {
    // Tentar identificar qual chave causou o erro
    // Por simplicidade, marcar a última chave usada
    const recentKeys = this.keyManager.keys
      .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime());

    if (recentKeys.length > 0) {
      recentKeys[0].quotaExhausted = true;
      recentKeys[0].lastError = error.message;
      console.log(`⛔ Quota esgotada: ${recentKeys[0].key.substring(0, 10)}...`);
    }
  }

  private async markKeyAsInactive(error: Error): Promise<void> {
    const recentKeys = this.keyManager.keys
      .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime());

    if (recentKeys.length > 0) {
      recentKeys[0].isActive = false;
      recentKeys[0].lastError = error.message;
      console.log(`❌ Chave inativa: ${recentKeys[0].key.substring(0, 10)}...`);
    }
  }

  getStatus(): { totalKeys: number; activeKeys: number; availableKeys: number; keyStatuses: ApiKeyStatus[] } {
    const activeKeys = this.keyManager.keys.filter(k => k.isActive).length;
    const availableKeys = this.keyManager.keys.filter(k => 
      k.isActive && !k.quotaExhausted && k.requestCount < k.dailyLimit
    ).length;

    return {
      totalKeys: this.keyManager.keys.length,
      activeKeys,
      availableKeys,
      keyStatuses: this.keyManager.keys.map(k => ({
        ...k,
        key: k.key.substring(0, 10) + '...' // Mascarar chave para logs
      }))
    };
  }

  async resetAllKeys(): Promise<void> {
    this.keyManager.keys.forEach(key => {
      key.requestCount = 0;
      key.quotaExhausted = false;
      key.isActive = true;
      key.resetTime = this.getNextResetTime();
      key.lastError = undefined;
    });

    await this.saveStatus();
    console.log('🔄 Todas as chaves foram resetadas');
  }
}
