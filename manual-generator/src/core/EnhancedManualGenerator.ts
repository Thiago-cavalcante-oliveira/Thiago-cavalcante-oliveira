import { APP_CONFIG } from '../config/index.js';
import { GeminiService } from '../services/gemini.js';
import { AgentService, AgentInput } from '../services/AgentService.js';
import { SimpleNavigationService } from '../services/SimpleNavigationService.js';
import { AutoOutputService } from '../services/AutoOutputService.js';
import { FileUtils, UrlUtils, TimeUtils, LogUtils } from '../utils/index.js';
import type { ManualSection, InteractiveElement, AuthCredentials, InteractionResult } from '../types/index.js';
import * as fs from 'fs';
import * as path from 'path';

export class EnhancedManualGenerator {
  private geminiService: GeminiService;
  private agentService: AgentService;
  private navigationService: SimpleNavigationService;
  private outputService: AutoOutputService;
  private sections: ManualSection[] = [];
  private screenshots: string[] = [];
  private interactionResults: InteractionResult[] = [];
  private successfulInteractions: InteractionResult[] = [];

  constructor() {
    this.geminiService = new GeminiService();
    this.agentService = new AgentService();
    this.navigationService = new SimpleNavigationService();
    this.outputService = new AutoOutputService(APP_CONFIG.OUTPUT_DIR);
    
    // Garantir que o diretório de saída existe
    FileUtils.ensureDirectoryExists(APP_CONFIG.OUTPUT_DIR);
  }

  async generateCompleteManual(url: string, credentials?: AuthCredentials): Promise<void> {
    LogUtils.logStep('🚀', `Iniciando geração completa de manual para: ${url}`);
    
    try {
      // Validar URL
      if (!UrlUtils.isValidUrl(url)) {
        throw new Error(`URL inválida: ${url}`);
      }

      // Inicializar serviços
      await this.navigationService.initialize();
      await this.agentService.initialize();

      // Se credenciais foram fornecidas, realizar login primeiro
      if (credentials && credentials.username && credentials.password) {
        LogUtils.logStep('🔐', 'Realizando login...');
        await this.performEnhancedLogin(url, credentials);
      }

      // Processar página principal com estratégia aprimorada
      await this.processMainPageEnhanced(url);

      // Processar todas as funcionalidades interativas
      await this.processAllInteractiveFunctionalities();

      // Gerar manual usando AgentService
      const agentInput = await this.buildAgentInput(url);
      const agentOutput = await this.agentService.generateUserFriendlyManual(agentInput);

      // Gerar todos os formatos de saída
      await this.generateAllOutputFormats(agentOutput.markdownManual, url);

      LogUtils.logSuccess('Manual completo gerado com sucesso!');
      
    } catch (error) {
      LogUtils.logError('Erro na geração do manual', error);
      throw error;
    } finally {
      await this.navigationService.close();
    }
  }

  private async performEnhancedLogin(url: string, credentials: AuthCredentials): Promise<void> {
    // Navegar para a página principal
    await this.navigationService.navigateToPage(url);
    
    const page = this.navigationService.getPage();
    if (!page) throw new Error('Página não disponível para login');

    try {
      // Estratégia 1: Procurar por formulário de login na página atual
      const loginForm = await page.$('form');
      if (loginForm) {
        console.log('🔍 Formulário de login encontrado na página atual');
        await this.fillLoginForm(page, credentials);
        return;
      }

      // Estratégia 2: Procurar por botão de login e clicar
      const loginButtons = [
        'button:has-text("Login")',
        'button:has-text("Entrar")',
        'a:has-text("Login")',
        'a:has-text("Entrar")',
        '[data-testid*="login"]',
        '.login-button',
        '#login-btn'
      ];

      for (const selector of loginButtons) {
        try {
          const button = await page.$(selector);
          if (button) {
            console.log(`✅ Botão de login encontrado: ${selector}`);
            await button.click();
            await page.waitForTimeout(2000);
            
            // Verificar se formulário apareceu
            const form = await page.$('form');
            if (form) {
              await this.fillLoginForm(page, credentials);
              return;
            }
          }
        } catch (e) {
          // Continuar tentando outros seletores
        }
      }

      console.log('⚠️ Formulário de login não encontrado, continuando sem login');
      
    } catch (error) {
      console.log(`⚠️ Erro no login: ${error instanceof Error ? error.message : error}`);
    }
  }

  private async fillLoginForm(page: any, credentials: AuthCredentials): Promise<void> {
    // Preencher campo de usuário
    const usernameSelectors = [
      'input[name="username"]',
      'input[name="user"]',
      'input[name="email"]',
      'input[type="text"]',
      'input[placeholder*="usuário"]',
      'input[placeholder*="email"]'
    ];

    for (const selector of usernameSelectors) {
      try {
        const field = await page.$(selector);
        if (field) {
          await field.fill(credentials.username);
          console.log(`✅ Campo de usuário preenchido: ${selector}`);
          break;
        }
      } catch (e) {
        // Continuar tentando
      }
    }

    // Preencher campo de senha
    const passwordSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      'input[placeholder*="senha"]'
    ];

    for (const selector of passwordSelectors) {
      try {
        const field = await page.$(selector);
        if (field) {
          await field.fill(credentials.password);
          console.log(`✅ Campo de senha preenchido: ${selector}`);
          break;
        }
      } catch (e) {
        // Continuar tentando
      }
    }

    // Submeter formulário
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Login")',
      'button:has-text("Entrar")',
      'form button'
    ];

    for (const selector of submitSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          console.log(`✅ Formulário submetido: ${selector}`);
          await page.waitForTimeout(3000); // Aguardar processamento
          break;
        }
      } catch (e) {
        // Continuar tentando
      }
    }
  }

  private async processMainPageEnhanced(url: string): Promise<void> {
    LogUtils.logStep('📊', 'Processando página principal...');
    
    // Navegar para a página se ainda não estivermos lá
    await this.navigationService.navigateToPage(url);
    
    // Capturar screenshot da página principal
    const mainScreenshot = path.join(APP_CONFIG.OUTPUT_DIR, 'screenshot_main.png');
    await this.navigationService.takeScreenshot(mainScreenshot);
    this.screenshots.push(mainScreenshot);
    
    console.log('📷 Screenshot principal capturado');
  }

  private async processAllInteractiveFunctionalities(): Promise<void> {
    LogUtils.logStep('🔍', 'Processando funcionalidades interativas...');
    
    // Detectar todos os elementos interativos
    const elements = await this.navigationService.detectAllInteractiveElements();
    
    console.log(`🎯 Encontrados ${elements.length} elementos interativos para testar`);
    
    let screenshotCounter = 1;
    
    for (const element of elements) {
      try {
        console.log(`🔄 Testando elemento ${screenshotCounter}/${elements.length}: ${element.text}`);
        
        // Interagir com o elemento
        const result = await this.navigationService.interactWithElement(element);
        this.interactionResults.push(result);
        
        if (result.success) {
          this.successfulInteractions.push(result);
          
          // Screenshot já capturado pela NavigationService se necessário
          if (result.filename) {
            this.screenshots.push(result.filename);
            console.log(`📷 Screenshot capturado: ${result.filename}`);
          }

          // Se uma nova página foi explorada, adicionar ao manual
          if (result.newPageExplored && result.content) {
            console.log(`📄 Nova página explorada, adicionando conteúdo ao manual`);
            
            this.sections.push({
              title: `Página: ${result.finalUrl}`,
              content: result.content,
              screenshot: result.filename || '',
              url: result.finalUrl
            });
            
            if (result.newPageElements && result.newPageElements.length > 0) {
              console.log(`📊 Nova página tem ${result.newPageElements.length} elementos interativos`);
            }
          }

          if (result.modalContent) {
            console.log(`� Modal: ${result.modalContent.substring(0, 100)}...`);
          }
          
          if (result.urlChanged) {
            console.log(`🌐 Navegação: ${result.initialUrl} → ${result.finalUrl}`);
          }
          
          console.log(`✅ Sucesso: ${element.text}`);
        } else {
          console.log(`⚠️ Falhou: ${result.error || 'Erro desconhecido'}`);
        }
        
        // Pequena pausa entre interações
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`⚠️ Erro ao processar elemento "${element.text}": ${error instanceof Error ? error.message : error}`);
      }
    }
    
    console.log(`✅ Processamento concluído: ${this.screenshots.length} screenshots capturados`);
  }

  private async buildAgentInput(url: string): Promise<AgentInput> {
    const page = this.navigationService.getPage();
    if (!page) throw new Error('Página não disponível');

    // Obter informações da página
    const pageTitle = await page.title();
    const pageContent = await page.content();
    
    // Mapear screenshots para interações
    const domInteractions = this.interactionResults
      .filter(result => result.success)
      .map((result, index) => ({
        selector: result.element.selector,
        action: 'click',
        screenshot: this.screenshots[index + 1] || '', // +1 porque o primeiro é main
        element: result.element,
        result: result
      }));

    return {
      url: url,
      pageHtml: pageContent,
      mainScreenshot: this.screenshots[0] || 'screenshot_main.png',
      domInteractions: domInteractions,
      breadcrumb: [pageTitle]
    };
  }

  private async generateAllOutputFormats(manualContent: string, url: string): Promise<void> {
    LogUtils.logStep('📄', 'Gerando formatos de saída...');
    
    try {
      // Extrair nome base da URL
      const urlObj = new URL(url);
      const baseFilename = urlObj.hostname.replace(/[^a-zA-Z0-9]/g, '_');
      
      // Gerar todos os formatos
      const outputPaths = await this.outputService.generateAllFormats(
        manualContent, 
        `manual_${baseFilename}`
      );
      
      // Copiar screenshots para pasta de assets
      await this.outputService.copyAssets(APP_CONFIG.OUTPUT_DIR);
      
      // Salvar metadados
      const metadata = {
        url: url,
        generatedAt: new Date().toISOString(),
        screenshotsCount: this.screenshots.length,
        interactionsCount: this.interactionResults.length,
        successfulInteractions: this.interactionResults.filter(r => r.success).length,
        outputFormats: outputPaths
      };
      
      const metadataPath = path.join(APP_CONFIG.OUTPUT_DIR, 'manual_metadata.json');
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
      
      console.log('✅ Todos os formatos gerados:');
      console.log(`   📝 Markdown: ${outputPaths.markdown}`);
      console.log(`   🌐 HTML: ${outputPaths.html}`);
      console.log(`   📄 PDF: ${outputPaths.pdf}`);
      console.log(`   📋 Metadados: ${metadataPath}`);
      
    } catch (error) {
      console.error(`❌ Erro na geração de formatos: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  // Método de compatibilidade com o sistema existente
  async generateUserFriendlyManual(url: string, credentials?: AuthCredentials): Promise<void> {
    return this.generateCompleteManual(url, credentials);
  }

  // Getters para informações úteis
  getScreenshots(): string[] {
    return [...this.screenshots];
  }

  getInteractionResults(): InteractionResult[] {
    return [...this.interactionResults];
  }

  getSuccessfulInteractions(): InteractionResult[] {
    return this.interactionResults.filter(result => result.success);
  }
}
