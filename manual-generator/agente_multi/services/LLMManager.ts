import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch';

export class LLMManager {
  private geminiKeyManager: any;
  private groqApiKey: string | undefined;
  private groqModel: string;

  constructor(geminiKeyManager: any) {
    this.geminiKeyManager = geminiKeyManager;
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.groqModel = process.env.GROQ_MODEL || 'mixtral-8x7b-32768';
  }

  async generateContent(prompt: string): Promise<any> {
    // 1. Tenta Groq primeiro
    if (this.groqApiKey) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.groqApiKey}`
          },
          body: JSON.stringify({
            model: this.groqModel,
            messages: [
              { role: 'system', content: 'Você é um assistente de IA para geração de manuais.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 2048,
            temperature: 0.7
          })
        });
        if (!response.ok) throw new Error('Groq API error: ' + response.status);
        const data = await response.json();
        return { response: { text: () => data.choices[0].message.content } };
      } catch (err) {
        console.warn('Groq indisponível, fallback para Gemini:', err);
      }
    }
    // 2. Fallback para Gemini
    return await this.geminiKeyManager.handleApiCall(async (model: any) => {
      return await model.generateContent(prompt);
    });
  }
}
