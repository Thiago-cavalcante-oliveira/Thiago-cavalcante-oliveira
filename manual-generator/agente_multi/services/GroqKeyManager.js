"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroqKeyManager = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class GroqKeyManager {
    constructor() {
        this.DAILY_LIMIT_FREE_TIER = 14400; // Limite diário do Groq
        this.RATE_LIMIT_DELAY = 1000; // 1 segundo entre requests
        this.MAX_RETRIES = 2;
        this.statusFilePath = path.join(process.cwd(), 'groq-keys-status.json');
        this.model = process.env.GROQ_MODEL || 'mixtral-8x7b-32768';
        this.keyManager = {
            keys: [],
            currentKeyIndex: 0,
            lastRotation: new Date()
        };
        this.loadApiKeys();
    }
    loadApiKeys() {
        const keys = [];
        // Carregar todas as chaves configuradas no .env
        for (let i = 1; i <= 10; i++) {
            const key = process.env[`GROQ_API_KEY_${i}`];
            if (key && key.trim() !== '') {
                keys.push(key.trim());
            }
        }
        // Compatibilidade com chave única (versão anterior)
        const singleKey = process.env.GROQ_API_KEY;
        if (singleKey && singleKey.trim() !== '' && !keys.includes(singleKey.trim())) {
            keys.push(singleKey.trim());
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
    getNextResetTime() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow;
    }
    async loadKeyStatus() {
        try {
            const data = await fs.readFile(this.statusFilePath, 'utf-8');
            const savedStatus = JSON.parse(data);
            // Mesclar status salvos com chaves atuais
            this.keyManager.keys.forEach(keyStatus => {
                const saved = savedStatus.keys?.find((s) => s.key === keyStatus.key);
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
        }
        catch (error) {
            console.log('📝 Criando novo arquivo de status das chaves Groq');
        }
    }
    async saveKeyStatus() {
        try {
            await fs.writeFile(this.statusFilePath, JSON.stringify(this.keyManager, null, 2));
        }
        catch (error) {
            console.warn('⚠️ Erro ao salvar status das chaves Groq:', error);
        }
    }
    getNextAvailableKey() {
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
    async makeGroqRequest(prompt, keyStatus) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
        try {
            const response = await (0, node_fetch_1.default)('https://api.groq.com/openai/v1/chat/completions', {
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
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Timeout na requisição Groq (30s)');
            }
            throw error;
        }
    }
    async handleApiCall(prompt) {
        let lastError = null;
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
            }
            catch (error) {
                lastError = error;
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
    getStatus() {
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
exports.GroqKeyManager = GroqKeyManager;
