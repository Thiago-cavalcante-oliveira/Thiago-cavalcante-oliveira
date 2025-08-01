import { InteractiveElement, InteractionResult } from '../types/index.js';
import { GeminiService } from './gemini.js';
import { MinIOService } from './MinIOService.js';
import { APP_CONFIG } from '../config/index.js';
import * as fs from 'fs';
import * as path from 'path';

export interface AgentInput {
  url: string;
  pageHtml: string;
  mainScreenshot: string;
  domInteractions: Array<{
    selector: string;
    action: string;
    resultHtml?: string;
    screenshot?: string;
    element: InteractiveElement;
    result: InteractionResult;
  }>;
  breadcrumb: string[];
}

export interface AgentOutput {
  markdownManual: string;
  visualAssets: {
    mainScreenshotUrl: string;
    interactionScreenshots: Array<{
      index: number;
      url: string;
      element: InteractiveElement;
    }>;
  };
  metadata: {
    originalUrl: string;
    breadcrumb: string[];
    generatedAt: string;
    targetAudience: string;
  };
}

export class AgentService {
  private geminiService: GeminiService;
  private minioService: MinIOService | null;

  constructor() {
    this.geminiService = new GeminiService();
    this.minioService = MinIOService.createFromEnv();
  }

  async initialize(): Promise<void> {
    if (this.minioService) {
      await this.minioService.initialize();
    }
  }

  async generateUserFriendlyManual(input: AgentInput): Promise<AgentOutput> {
    // 1. Inicializar MinIO se disponível
    await this.initialize();

    // 2. Processar screenshots para URLs (locais ou MinIO)
    const visualAssets = await this.processVisualAssets(input);

    // 3. Construir contexto otimizado para usuários leigos
    const context = this.buildUserFriendlyContext(input, visualAssets);

    // 4. Gerar manual com Gemini
    const response = await this.geminiService.analyzeContent(
      context,
      'Manual do Usuário - Instruções Passo-a-Passo',
      input.url,
      [],
      {
        isMainPage: false,
        type: 'user-manual',
        url: input.url
      }
    );

    // 5. Pós-processamento para garantir qualidade
    const finalContent = this.postProcessContent(response);

    return {
      markdownManual: finalContent,
      visualAssets,
      metadata: {
        originalUrl: input.url,
        breadcrumb: input.breadcrumb,
        generatedAt: new Date().toISOString(),
        targetAudience: 'first-time-users'
      }
    };
  }

  private async processVisualAssets(input: AgentInput): Promise<AgentOutput['visualAssets']> {
    // Tentar upload para MinIO primeiro, fallback para arquivos locais
    let mainScreenshotUrl: string;
    
    if (this.minioService && this.minioService.isAvailable()) {
      console.log('☁️ Processando imagens com MinIO...');
      
      // Upload da screenshot principal
      const mainScreenshotPath = path.join(APP_CONFIG.OUTPUT_DIR, input.mainScreenshot);
      const uploadedMainUrl = await this.minioService.uploadImage(mainScreenshotPath, 'main-screenshots');
      mainScreenshotUrl = uploadedMainUrl || `./${input.mainScreenshot}`;
      
    } else {
      console.log('📁 Usando arquivos locais...');
      mainScreenshotUrl = input.mainScreenshot.startsWith('http') 
        ? input.mainScreenshot 
        : `./${input.mainScreenshot}`;
    }

    // Processar screenshots de interações
    const interactionScreenshots = [];
    
    for (let i = 0; i < input.domInteractions.length; i++) {
      const interaction = input.domInteractions[i];
      
      if (interaction.screenshot) {
        let screenshotUrl: string;
        
        if (this.minioService && this.minioService.isAvailable()) {
          const screenshotPath = path.join(APP_CONFIG.OUTPUT_DIR, interaction.screenshot);
          const uploadedUrl = await this.minioService.uploadImage(screenshotPath, 'interaction-screenshots');
          screenshotUrl = uploadedUrl || `./${interaction.screenshot}`;
        } else {
          screenshotUrl = interaction.screenshot.startsWith('http') 
            ? interaction.screenshot 
            : `./${interaction.screenshot}`;
        }
        
        interactionScreenshots.push({
          index: i,
          url: screenshotUrl,
          element: interaction.element
        });
      }
    }

    return {
      mainScreenshotUrl,
      interactionScreenshots
    };
  }

  private buildUserFriendlyContext(input: AgentInput, visualAssets: AgentOutput['visualAssets']): string {
    const { url, pageHtml, domInteractions, breadcrumb } = input;

    return `
## PERFIL DO USUÁRIO FINAL
Usuário está usando o sistema pela primeira vez. Não conhece termos técnicos. Aprende melhor com exemplos visuais e instruções passo-a-passo.

## REGRAS DE ESCRITA OBRIGATÓRIAS
1. Use linguagem simples e direta no imperativo ("Clique...", "Digite...")
2. Evite jargões técnicos - use equivalentes leigos:
   - "Modal" → "Janela pop-up"
   - "Seletor" → "Elemento"
   - "Hover" → "Passar o mouse sobre"
   - "Dropdown" → "Lista suspensa"
   - "Checkbox" → "Caixa de seleção"
   - "Campo de input" → "Campo de texto"
3. Sempre que mencionar um elemento:
   - Descreva sua aparência ("botão azul", "menu lateral")
   - Mencione sua localização ("no canto superior direito", "na parte inferior da página")
   - Inclua referência visual quando disponível
4. Estruture o conteúdo por tarefas práticas, não por elementos técnicos
5. Para cada grupo de ações, inclua um exemplo prático

## ESTRUTURA DE CADA SEÇÃO
### [Nome da Tarefa Prática]
**Objetivo:** [Explicação clara do que será alcançado]

**Passo-a-passo:**
1. [Ação específica com descrição visual]
2. [Próxima ação com resultado esperado]
3. [Como saber que deu certo]

**Dicas importantes:**
- [Problemas comuns e como resolver]
- [Atalhos úteis, se existirem]

**⚠️ Atenção:** [Alertas sobre ações importantes ou irreversíveis]

## DADOS VISUAIS DISPONÍVEIS

### Tela Principal:
![Página completa](${visualAssets.mainScreenshotUrl})

### Resultados das Ações:
${visualAssets.interactionScreenshots.map(item => 
  `- **${item.element.text}** (${item.element.type}): ![Resultado da ação](${item.url})`
).join('\n') || 'Nenhuma ação capturada'}

## AÇÕES REALIZADAS NO SISTEMA
${domInteractions.map((interaction, index) => `
**Ação ${index + 1}: ${interaction.element.text}**
- Tipo: ${interaction.element.type === 'button' ? 'Botão' : 'Link'}
- Localização: ${interaction.element.context || 'Interface principal'}
- Ação: ${interaction.action}
${interaction.screenshot ? `- Resultado visual: ![Resultado](${interaction.screenshot})` : ''}
`).join('\n')}

## CONTEXTO TÉCNICO
**URL da página:** ${url}
**Caminho de navegação:** ${breadcrumb.join(' → ')}
**Título da página:** ${this.extractTitle(pageHtml)}

## INSTRUÇÕES ESPECÍFICAS
1. Crie um manual que permita a qualquer pessoa usar o sistema sem conhecimento prévio
2. Use linguagem amigável e encorajadora
3. Destaque elementos visuais para facilitar a localização
4. Organize por objetivos práticos do usuário
5. Inclua avisos sobre ações importantes
6. Forneça exemplos concretos de uso
`;
  }

  private extractTitle(html: string): string {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : 'Sistema Web';
  }

  private postProcessContent(content: string): string {
    return content
      // Remove imagens inválidas
      .replace(/!\[\]\(undefined\)/g, '')
      .replace(/\[Imagem relevante\]\(\)/g, '')
      
      // Traduz termos técnicos remanescentes
      .replace(/\b(modal|seletor|DOM|hover|click|input|checkbox|dropdown|submit)\b/gi, (match) => {
        const translations: Record<string, string> = {
          'modal': 'janela pop-up',
          'seletor': 'elemento',
          'DOM': 'estrutura da página',
          'hover': 'passar o mouse sobre',
          'click': 'clicar',
          'input': 'campo de texto',
          'checkbox': 'caixa de seleção',
          'dropdown': 'lista suspensa',
          'submit': 'enviar'
        };
        return translations[match.toLowerCase()] || match;
      })
      
      // Melhora a formatação
      .replace(/^\s*#{1,2}\s*/gm, '## ')
      .replace(/^\s*#{3,}\s*/gm, '### ')
      
      // Adiciona espaçamento entre seções
      .replace(/\n(##[^#])/g, '\n\n$1')
      .replace(/\n(###[^#])/g, '\n\n$1');
  }
}
