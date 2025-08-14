import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch';
import { GroqKeyManager } from './GroqKeyManager';

export class LLMManager {
  private geminiKeyManager: any;
  private groqKeyManager: GroqKeyManager;

  constructor(geminiKeyManager: any) {
    this.geminiKeyManager = geminiKeyManager;
    this.groqKeyManager = new GroqKeyManager();
  }

  async generateContent(prompt: string): Promise<any> {
    // 1. Tenta Groq primeiro (API padrão)
    try {
      console.log('🚀 Tentando Groq como API principal...');
      return await this.groqKeyManager.handleApiCall(prompt);
    } catch (groqError) {
      const errorMessage = groqError instanceof Error ? groqError.message : String(groqError);
      console.warn('⚠️ Groq indisponível, fallback para Gemini:', errorMessage);
      
      // 2. Fallback para Gemini
      try {
        console.log('🔄 Usando Gemini como fallback...');
        return await this.geminiKeyManager.handleApiCall(async (model: any) => {
          return await model.generateContent(prompt);
        });
      } catch (geminiError) {
        const geminiErrorMessage = geminiError instanceof Error ? geminiError.message : String(geminiError);
        throw new Error(`Falha em ambas as APIs - Groq: ${errorMessage}, Gemini: ${geminiErrorMessage}`);
      }
    }
  }
}
