import { GoogleGenerativeAI } from '@google/generative-ai';
import { APP_CONFIG, RETRY_CONFIG } from '../config/index.js';
import type { AnalysisContext } from '../types/index.js';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(APP_CONFIG.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: APP_CONFIG.GEMINI_MODEL,
      generationConfig: APP_CONFIG.GEMINI_CONFIG
    });
  }

  private createPrompt(
    content: string, 
    sectionTitle: string, 
    url: string, 
    interactiveElements: string[] = [],
    elementContext?: AnalysisContext
  ): string {
    return `Você é um especialista em criação de manuais de usuário. Analise o conteúdo abaixo e gere uma seção de manual de usuário em português brasileiro.

${elementContext ? 
  `CONTEXTO: Esta análise é sobre a funcionalidade "${elementContext.text}" (${elementContext.type}) que foi ativada/clicada.` 
  : 'CONTEXTO: Esta é a análise da página principal.'}

Inclua:
- **Finalidade:** Descrição clara da finalidade da tela/funcionalidade
- **Elementos Visíveis:** Lista organizada dos campos/elementos visíveis
- **Ações Possíveis:** Possíveis ações que o usuário pode realizar
- **Instruções Passo-a-Passo:** Quando aplicável, forneça instruções detalhadas

${interactiveElements.length > 0 ? 
  `\n**Elementos Interativos Detectados:** ${interactiveElements.join(', ')}` 
  : ''}

Formate a resposta em Markdown. Seja claro, objetivo e didático.

CONTEÚDO PARA ANÁLISE:
${content}`;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async analyzeContent(
    content: string, 
    sectionTitle: string, 
    url: string, 
    interactiveElements: string[] = [],
    elementContext?: AnalysisContext
  ): Promise<string> {
    const prompt = this.createPrompt(content, sectionTitle, url, interactiveElements, elementContext);
    
    let retryCount = 0;
    const maxRetries = RETRY_CONFIG.maxRetries;
    let geminiSuccess = false;
    let analysisText = '';

    while (retryCount < maxRetries && !geminiSuccess) {
      try {
        console.log(`🔄 Tentativa ${retryCount + 1}/${maxRetries} de análise com Gemini para "${sectionTitle}"...`);
        
        const result = await this.model.generateContent(prompt);
        const response = result.response;
        analysisText = response.text();
        geminiSuccess = true;
        
        console.log(`✅ Análise do Gemini concluída com sucesso!`);
        
      } catch (geminiError: any) {
        retryCount++;
        
        if (geminiError?.status === 503 || geminiError?.message?.includes('overloaded')) {
          const waitTime = Math.min(
            RETRY_CONFIG.baseWaitTime * Math.pow(2, retryCount), 
            RETRY_CONFIG.maxWaitTime
          );
          console.log(`⏳ Gemini sobrecarregado. Aguardando ${waitTime/1000}s antes da próxima tentativa...`);
          await this.delay(waitTime);
          
        } else if (geminiError?.status === 429) {
          const waitTime = Math.min(
            RETRY_CONFIG.rateLimitWaitTime * Math.pow(2, retryCount), 
            RETRY_CONFIG.maxWaitTime * 2
          );
          console.log(`🚦 Rate limit atingido. Aguardando ${waitTime/1000}s antes da próxima tentativa...`);
          await this.delay(waitTime);
          
        } else {
          console.error(`❌ Erro na tentativa ${retryCount}: ${geminiError?.message || geminiError}`);
          if (retryCount < maxRetries) {
            const waitTime = 5000;
            console.log(`⏳ Aguardando ${waitTime/1000}s antes da próxima tentativa...`);
            await this.delay(waitTime);
          }
        }
      }
    }

    if (geminiSuccess) {
      return analysisText;
    } else {
      console.error(`❌ Falha ao processar "${sectionTitle}" com Gemini após ${maxRetries} tentativas`);
      return this.createFallbackAnalysis(sectionTitle, elementContext, url);
    }
  }

  private createFallbackAnalysis(
    sectionTitle: string, 
    elementContext?: AnalysisContext, 
    url?: string
  ): string {
    return `### ⚠️ Análise Automática Indisponível

*A análise automática desta funcionalidade não pôde ser realizada devido à indisponibilidade temporária do serviço de IA.*

**Funcionalidade:** ${elementContext?.text || sectionTitle}
**Tipo:** ${elementContext?.type || 'Página'}
**URL:** ${url || 'N/A'}

**Ações sugeridas:**
- Verifique o screenshot capturado
- Execute novamente o comando em alguns minutos
- Analise manualmente os elementos visíveis na tela`;
  }
}
