"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMManager = void 0;
const GroqKeyManager_1 = require("./GroqKeyManager");
class LLMManager {
    constructor(geminiKeyManager) {
        this.geminiKeyManager = geminiKeyManager;
        this.groqKeyManager = new GroqKeyManager_1.GroqKeyManager();
    }
    async generateContent(prompt) {
        // 1. Tenta Groq primeiro (API padrão)
        try {
            console.log('🚀 Tentando Groq como API principal...');
            return await this.groqKeyManager.handleApiCall(prompt);
        }
        catch (groqError) {
            const errorMessage = groqError instanceof Error ? groqError.message : String(groqError);
            console.warn('⚠️ Groq indisponível, fallback para Gemini:', errorMessage);
            // 2. Fallback para Gemini
            try {
                console.log('🔄 Usando Gemini como fallback...');
                return await this.geminiKeyManager.handleApiCall(async (model) => {
                    return await model.generateContent(prompt);
                });
            }
            catch (geminiError) {
                const geminiErrorMessage = geminiError instanceof Error ? geminiError.message : String(geminiError);
                throw new Error(`Falha em ambas as APIs - Groq: ${errorMessage}, Gemini: ${geminiErrorMessage}`);
            }
        }
    }
}
exports.LLMManager = LLMManager;
