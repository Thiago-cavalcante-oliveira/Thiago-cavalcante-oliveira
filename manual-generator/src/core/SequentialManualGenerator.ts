import { APP_CONFIG } from '../config/index.js';
import { GeminiService } from '../services/gemini.js';
import { SequentialNavigationService, SequentialNavigationResult, PageMapping } from '../services/SequentialNavigationService.js';
import { AutoOutputService } from '../services/AutoOutputService.js';
import { FileUtils, UrlUtils, TimeUtils, LogUtils } from '../utils/index.js';
import type { AuthCredentials, InteractionResult } from '../types/index.js';
import * as fs from 'fs';
import * as path from 'path';

interface ManualSection {
  title: string;
  content: string;
  page: string;
  elements: number;
  screenshots: string[];
  stateChanges: number;
}

export class SequentialManualGenerator {
  private geminiService: GeminiService;
  private navigationService: SequentialNavigationService;
  private outputService: AutoOutputService;
  private sections: ManualSection[] = [];
  private navigationResult: SequentialNavigationResult | null = null;

  constructor(maxPages?: number) {
    this.geminiService = new GeminiService();
    this.navigationService = new SequentialNavigationService(maxPages);
    this.outputService = new AutoOutputService(APP_CONFIG.OUTPUT_DIR);
    
    FileUtils.ensureDirectoryExists(APP_CONFIG.OUTPUT_DIR);
  }

  async generateSequentialManual(url: string, credentials?: AuthCredentials): Promise<void> {
    LogUtils.logStep('🚀', `Iniciando geração sequencial de manual para: ${url}`);
    
    try {
      // Validar URL
      if (!UrlUtils.isValidUrl(url)) {
        throw new Error(`URL inválida: ${url}`);
      }

      // Inicializar serviços
      await this.navigationService.initialize();

      // Processar website sequencialmente
      console.log('🔄 Processando website com mapeamento sequencial...');
      this.navigationResult = await this.navigationService.processWebsiteSequentially(url, APP_CONFIG.OUTPUT_DIR);

      // Gerar seções do manual
      await this.generateManualSections();

      // Criar conteúdo final com IA
      const finalContent = await this.generateFinalContent(url);

      // Gerar outputs
      await this.generateAllOutputs(finalContent, url);

      console.log('✅ Manual sequencial gerado com sucesso!');
      this.printFinalStats();

    } catch (error) {
      console.error('❌ Erro na geração do manual:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  private async generateManualSections(): Promise<void> {
    if (!this.navigationResult) return;

    console.log('📝 Gerando seções do manual...');

    for (let i = 0; i < this.navigationResult.pages.length; i++) {
      const page = this.navigationResult.pages[i];
      console.log(`📄 Processando página ${i + 1}: ${page.pageName}`);

      // Criar seção para cada página
      const section: ManualSection = {
        title: page.pageName,
        content: await this.generatePageContent(page),
        page: page.url,
        elements: page.elements.length,
        screenshots: page.screenshots,
        stateChanges: page.stateChanges.length
      };

      this.sections.push(section);
    }
  }

  private async generatePageContent(page: PageMapping): Promise<string> {
    let content = `## ${page.pageName}\n\n`;
    content += `**URL:** ${page.url}\n\n`;
    content += `**Descrição:** ${page.description}\n\n`;

    // Estatísticas da página
    content += `### 📊 Resumo da Página\n\n`;
    content += `- **Elementos interativos:** ${page.elements.length}\n`;
    content += `- **Screenshots capturados:** ${page.screenshots.length}\n`;
    content += `- **Mudanças de estado:** ${page.stateChanges.length}\n`;
    content += `- **Navegações identificadas:** ${page.navigationTargets.length}\n\n`;

    // Screenshots iniciais
    if (page.screenshots.length > 0) {
      content += `### 📷 Aparência Inicial\n\n`;
      content += `![Página ${page.pageName}](${page.screenshots[0]})\n\n`;
    }

    // Elementos interativos
    if (page.elements.length > 0) {
      content += `### 🎯 Elementos Interativos\n\n`;
      
      const successfulElements = page.elements.filter(el => el.success);
      const failedElements = page.elements.filter(el => !el.success);

      if (successfulElements.length > 0) {
        content += `#### ✅ Elementos Funcionais (${successfulElements.length})\n\n`;
        
        for (let i = 0; i < successfulElements.length; i++) {
          const element = successfulElements[i];
          content += await this.generateElementContent(element, i + 1, page);
        }
      }

      if (failedElements.length > 0) {
        content += `#### ⚠️ Elementos com Problemas (${failedElements.length})\n\n`;
        
        for (const element of failedElements) {
          content += `- **${element.element.name || element.element.text}** (${element.element.type}): ${element.error || 'Não interativo'}\n`;
        }
        content += '\n';
      }
    }

    // Mudanças de estado
    if (page.stateChanges.length > 0) {
      content += `### 🔄 Mudanças de Estado Observadas\n\n`;
      
      for (const change of page.stateChanges) {
        content += `#### ${change.elementName}\n\n`;
        content += `**Mudança observada:** ${change.description}\n\n`;
        content += `**Timestamp:** ${change.timestamp.toLocaleString('pt-BR')}\n\n`;
        content += `**Estado anterior:** ${this.formatState(change.beforeState)}\n\n`;
        content += `**Estado posterior:** ${this.formatState(change.afterState)}\n\n`;
        content += `---\n\n`;
      }
    }

    // Navegações possíveis
    if (page.navigationTargets.length > 0) {
      content += `### 🎯 Navegações Identificadas\n\n`;
      content += `Esta página permite navegar para:\n\n`;
      
      for (const target of page.navigationTargets) {
        content += `- [${target}](${target})\n`;
      }
      content += '\n';
    }

    return content;
  }

  private async generateElementContent(element: InteractionResult, index: number, page: PageMapping): Promise<string> {
    let content = `##### ${index}. ${element.element.name}\n\n`;
    
    // Informações básicas
    content += `**Tipo:** ${element.element.type.toUpperCase()}\n\n`;
    content += `**Localização:** ${element.element.coordinates ? `x:${element.element.coordinates.x}, y:${element.element.coordinates.y}` : 'N/A'}\n\n`;

    // Resultado da interação
    if (element.success) {
      content += `**✅ Status:** Interação bem-sucedida\n\n`;
      
      if (element.navigationOccurred) {
        content += `**🌐 Navegação:** Sim - de ${element.initialUrl} para ${element.finalUrl}\n\n`;
        content += `**📄 Nova página:** ${element.title}\n\n`;
        
        // Instruções de uso
        content += `**Como usar:**\n\n`;
        content += `1. Localize o elemento "${element.element.name}" na página\n`;
        content += `2. Clique no elemento\n`;
        content += `3. Você será redirecionado para: ${element.finalUrl}\n`;
        content += `4. A nova página terá o título: "${element.title}"\n\n`;
        
        if (page.stateChanges.some(change => change.elementName === element.element.name)) {
          const relatedChange = page.stateChanges.find(change => change.elementName === element.element.name);
          if (relatedChange) {
            content += `**🔄 Mudança observada:** ${relatedChange.description}\n\n`;
          }
        }
        
      } else {
        content += `**🔄 Ação:** Interação local (sem navegação)\n\n`;
        
        // Instruções para elementos locais
        content += `**Como usar:**\n\n`;
        content += `1. Localize o elemento "${element.element.name}" na página\n`;
        
        if (element.element.type === 'input' || element.element.type === 'textarea') {
          content += `2. Clique no campo para ativá-lo\n`;
          content += `3. Digite o texto desejado\n`;
          content += `4. Pressione Tab ou clique fora para confirmar\n\n`;
        } else {
          content += `2. Clique no elemento para ativá-lo\n`;
          content += `3. Observe as mudanças na página\n\n`;
        }
      }
    } else {
      content += `**❌ Status:** Falha na interação\n\n`;
      content += `**Motivo:** ${element.error || 'Elemento não acessível'}\n\n`;
    }

    // Screenshot específico se disponível
    const screenshotIndex = index; // Assuming screenshots are captured per element
    if (page.screenshots[screenshotIndex]) {
      content += `**📷 Screenshot após interação:**\n\n`;
      content += `![Elemento ${element.element.name}](${page.screenshots[screenshotIndex]})\n\n`;
    }

    content += `---\n\n`;
    return content;
  }

  private formatState(stateString: string): string {
    try {
      const state = JSON.parse(stateString);
      return `URL: ${state.url}, Título: ${state.title}, Modais: ${state.modals}, Elemento ativo: ${state.activeElement}`;
    } catch {
      return stateString;
    }
  }

  private async generateFinalContent(url: string): Promise<string> {
    if (!this.navigationResult) return '';

    console.log('🤖 Gerando conteúdo final com IA...');

    // Preparar dados para a IA
    const websiteSummary = {
      url: url,
      baseUrl: this.navigationResult.baseUrl,
      totalPages: this.navigationResult.totalPages,
      totalElements: this.navigationResult.totalElements,
      successRate: Math.round((this.navigationResult.successfulInteractions / this.navigationResult.totalInteractions) * 100),
      pages: this.navigationResult.pages.map(page => ({
        name: page.pageName,
        url: page.url,
        elements: page.elements.length,
        stateChanges: page.stateChanges.length,
        navigationTargets: page.navigationTargets.length
      }))
    };

    // Criar prompt para IA
    const prompt = `
Você é um especialista em documentação técnica. Analise este website que foi mapeado automaticamente:

${JSON.stringify(websiteSummary, null, 2)}

Seções do manual:
${this.sections.map(section => `
Página: ${section.title}
URL: ${section.page}
Elementos: ${section.elements}
Mudanças de estado: ${section.stateChanges}
`).join('\n')}

Crie um manual completo em português brasileiro com:

1. **Introdução geral** explicando o sistema
2. **Visão geral da navegação** entre páginas
3. **Guia passo-a-passo** para cada funcionalidade
4. **Dicas importantes** para uso eficiente
5. **Solução de problemas** comuns

Use linguagem clara e acessível. Inclua avisos de segurança quando apropriado.
Organize o conteúdo de forma lógica e fácil de seguir.
`;

    try {
      const aiContent = await this.geminiService.analyzeContent(
        JSON.stringify(websiteSummary, null, 2),
        'Manual Completo do Sistema',
        url,
        [],
        { text: 'Sistema Completo', type: 'website', url: url }
      );
      console.log('✅ Conteúdo gerado pela IA!');
      
      // Combinar conteúdo da IA com seções detalhadas
      let finalContent = aiContent + '\n\n---\n\n# Detalhamento Técnico Completo\n\n';
      finalContent += this.sections.map(section => section.content).join('\n');
      
      return finalContent;
      
    } catch (error) {
      console.warn('⚠️ Erro na análise da IA, usando conteúdo básico');
      return this.generateBasicContent(url);
    }
  }

  private generateBasicContent(url: string): string {
    if (!this.navigationResult) return '';

    let content = `# Manual do Usuário - ${url}\n\n`;
    content += `Gerado automaticamente em ${new Date().toLocaleDateString('pt-BR')}\n\n`;
    
    content += `## Resumo do Sistema\n\n`;
    content += `- **URL base:** ${this.navigationResult.baseUrl}\n`;
    content += `- **Páginas mapeadas:** ${this.navigationResult.totalPages}\n`;
    content += `- **Total de elementos:** ${this.navigationResult.totalElements}\n`;
    content += `- **Interações bem-sucedidas:** ${this.navigationResult.successfulInteractions}/${this.navigationResult.totalInteractions}\n\n`;

    content += this.sections.map(section => section.content).join('\n');
    
    return content;
  }

  private async generateAllOutputs(content: string, url: string): Promise<void> {
    console.log('📄 Gerando arquivos de saída...');
    
    const baseFilename = UrlUtils.sanitizeForFilename(url);
    
    try {
      await this.outputService.generateAllFormats(content, baseFilename);
      console.log('✅ Todos os formatos gerados!');
    } catch (error) {
      console.error('❌ Erro na geração de outputs:', error);
    }
  }

  private printFinalStats(): void {
    if (!this.navigationResult) return;

    console.log('\n🎉 ESTATÍSTICAS FINAIS:');
    console.log('========================');
    console.log(`📊 Páginas processadas: ${this.navigationResult.totalPages}`);
    console.log(`🎯 Total de elementos: ${this.navigationResult.totalElements}`);
    console.log(`✅ Interações bem-sucedidas: ${this.navigationResult.successfulInteractions}`);
    console.log(`📷 Screenshots capturados: ${this.navigationResult.pages.reduce((sum, page) => sum + page.screenshots.length, 0)}`);
    console.log(`🔄 Mudanças de estado: ${this.navigationResult.pages.reduce((sum, page) => sum + page.stateChanges.length, 0)}`);
    console.log(`🌐 Navegações identificadas: ${this.navigationResult.pages.reduce((sum, page) => sum + page.navigationTargets.length, 0)}`);
    
    const successRate = Math.round((this.navigationResult.successfulInteractions / this.navigationResult.totalInteractions) * 100);
    console.log(`📈 Taxa de sucesso: ${successRate}%`);
    
    console.log('\n📋 PÁGINAS PROCESSADAS:');
    this.navigationResult.pages.forEach((page, index) => {
      console.log(`   ${index + 1}. ${page.pageName} (${page.elements.length} elementos)`);
    });
  }

  private async cleanup(): Promise<void> {
    await this.navigationService.close();
  }
}
