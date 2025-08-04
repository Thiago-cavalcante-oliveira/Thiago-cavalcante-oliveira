import { Browser, Page, chromium } from 'playwright';
import { InteractiveElement, InteractionResult } from '../types/index';

export interface StateChange {
  elementName: string;
  beforeState: string;
  afterState: string;
  description: string;
  timestamp: Date;
}

export interface PageMapping {
  url: string;
  elements: InteractionResult[];
  screenshots: string[];
  navigationTargets: string[];
  stateChanges: StateChange[];
  completed: boolean;
  pageName: string;
  description: string;
}

export interface SequentialNavigationResult {
  pages: PageMapping[];
  totalPages: number;
  totalElements: number;
  totalInteractions: number;
  successfulInteractions: number;
  navigationHistory: string[];
  baseUrl: string;
}

export class SequentialNavigationService {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private baseUrl: string = '';
  private visitedUrls: Set<string> = new Set();
  private capturedScreens: Map<string, string> = new Map();
  private pages: PageMapping[] = [];
  private currentPageIndex: number = 0;
  private maxAdditionalPages: number = -1; // -1 = sem limite
  private screenshotCounter: number = 0;

  constructor(maxPages?: number) {
    this.maxAdditionalPages = maxPages ?? -1; // Se não especificado, sem limite
  }

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    console.log('🎭 Iniciando Sequential Navigation Service...');
  }

  async processWebsiteSequentially(url: string, outputDir: string, credentials?: { username: string; password: string }): Promise<SequentialNavigationResult> {
    if (!this.page) throw new Error('Página não disponível');

    console.log('🌐 Iniciando mapeamento sequencial completo...');
    
    // Definir URL base
    this.baseUrl = new URL(url).origin;
    console.log(`🏠 URL base: ${this.baseUrl}`);
    
    if (this.maxAdditionalPages === -1) {
      console.log(`📊 Limite: SEM LIMITE - Explorará todas as páginas encontradas`);
    } else {
      console.log(`📊 Limite: ${this.maxAdditionalPages} páginas adicionais`);
    }

    // Navegar para página inicial
    await this.navigateTo(url);
    
    // Tentar login automático se credenciais foram fornecidas
    if (credentials) {
      console.log('🔐 Tentando login automático...');
      await this.attemptAutoLogin(credentials);
    }
    
    // Criar mapeamento da página inicial
    const initialPage: PageMapping = {
      url,
      elements: [],
      screenshots: [],
      navigationTargets: [],
      stateChanges: [],
      completed: false,
      pageName: 'Página Principal',
      description: 'Página inicial do website'
    };
    
    this.pages.push(initialPage);
    
    // Processar páginas sequencialmente
    while (this.currentPageIndex < this.pages.length && 
           (this.maxAdditionalPages === -1 || this.currentPageIndex <= this.maxAdditionalPages)) {
      const currentPage = this.pages[this.currentPageIndex];
      console.log(`\n📋 Processando página ${this.currentPageIndex + 1}: ${currentPage.pageName}`);
      console.log(`🌐 URL: ${currentPage.url}`);
      
      await this.processPageCompletely(currentPage, outputDir, credentials);
      this.currentPageIndex++;
    }

    return this.generateResult();
  }

  private async processPageCompletely(pageMapping: PageMapping, outputDir: string, credentials?: { username: string; password: string }): Promise<void> {
    // Navegar para a página se não estivermos nela
    const currentUrl = this.page?.url() || '';
    if (currentUrl !== pageMapping.url) {
      console.log(`🔄 Retornando para: ${pageMapping.url}`);
      await this.navigateTo(pageMapping.url);
    }

    // 1. Capturar screenshot inicial
    console.log('📷 Capturando screenshot inicial...');
    const screenshotPath = await this.captureScreenshot(outputDir, `page_${this.currentPageIndex + 1}_initial`);
    pageMapping.screenshots.push(screenshotPath);

    // 2. Detectar todos os elementos interativos
    console.log('🔍 Detectando elementos interativos...');
    const elements = await this.detectAllInteractiveElements();
    console.log(`✅ ${elements.length} elementos detectados`);

    // 3. Tentar login automático se estamos numa página de login
    if (credentials) {
      console.log('🔍 🔍 🔍 CHECANDO SE PRECISA FAZER LOGIN AUTOMÁTICO...');
      const currentUrl = this.page?.url() || '';
      console.log(`🌐 URL ATUAL: ${currentUrl}`);
      if (currentUrl.includes('keycloak') || currentUrl.includes('login')) {
        console.log('🔐 🔐 🔐 PÁGINA DE AUTENTICAÇÃO DETECTADA VIA URL - FORÇANDO LOGIN AUTOMÁTICO...');
      }
      await this.attemptAutoLoginOnPage(credentials);
    }

    // 4. Processar cada elemento sequencialmente
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      console.log(`\n🎯 Processando elemento ${i + 1}/${elements.length}: ${element.name}`);
      
      // Capturar estado antes da interação
      const beforeState = await this.capturePageState();
      
      // Interagir com o elemento (com lógica especial para login)
      const interaction = await this.interactWithElement(element, outputDir, credentials);
      pageMapping.elements.push(interaction);

      // Capturar estado após interação
      const afterState = await this.capturePageState();
      
      // Registrar mudança de estado
      if (beforeState !== afterState) {
        const stateChange: StateChange = {
          elementName: element.name,
          beforeState,
          afterState,
          description: this.generateStateChangeDescription(beforeState, afterState, interaction),
          timestamp: new Date()
        };
        pageMapping.stateChanges.push(stateChange);
        console.log(`📝 Mudança de estado registrada: ${stateChange.description}`);
      }

      // Se houve navegação, adicionar como alvo mas continuar mapeando página atual
      if (interaction.navigationOccurred && interaction.finalUrl !== pageMapping.url) {
        console.log(`🎯 Nova página identificada: ${interaction.finalUrl}`);
        pageMapping.navigationTargets.push(interaction.finalUrl);
        
        // Adicionar nova página para processamento futuro (se dentro do limite)
        if ((this.maxAdditionalPages === -1 || this.pages.length <= this.maxAdditionalPages) && 
            !this.visitedUrls.has(interaction.finalUrl)) {
          const newPage: PageMapping = {
            url: interaction.finalUrl,
            elements: [],
            screenshots: [],
            navigationTargets: [],
            stateChanges: [],
            completed: false,
            pageName: interaction.title || `Página ${this.pages.length + 1}`,
            description: `Página acessada através de: ${element.name}`
          };
          this.pages.push(newPage);
          console.log(`➕ Página adicionada à fila: ${newPage.pageName}`);
        }

        // Retornar à página atual para continuar mapeamento
        console.log(`🔙 Retornando à página atual: ${pageMapping.url}`);
        await this.navigateTo(pageMapping.url);
        await this.page?.waitForTimeout(2000); // Aguardar estabilização
      }

      // Capturar screenshot após interação se houve mudança
      if (interaction.success || pageMapping.stateChanges.length > 0) {
        const screenshotPath = await this.captureScreenshot(outputDir, `page_${this.currentPageIndex + 1}_element_${i + 1}`);
        pageMapping.screenshots.push(screenshotPath);
      }
    }

    pageMapping.completed = true;
    console.log(`✅ Página "${pageMapping.pageName}" completamente mapeada!`);
    console.log(`   📊 ${pageMapping.elements.length} elementos processados`);
    console.log(`   📷 ${pageMapping.screenshots.length} screenshots capturados`);
    console.log(`   🔄 ${pageMapping.stateChanges.length} mudanças de estado`);
    console.log(`   🎯 ${pageMapping.navigationTargets.length} alvos de navegação identificados`);
  }

  private async navigateTo(url: string): Promise<boolean> {
    if (!this.page) throw new Error('Página não disponível');

    try {
      await this.page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });

      await this.page.waitForTimeout(2000);
      this.visitedUrls.add(url);
      return true;
    } catch (error) {
      console.error(`❌ Erro na navegação para ${url}: ${error}`);
      return false;
    }
  }

  private async detectAllInteractiveElements(): Promise<InteractiveElement[]> {
    if (!this.page) return [];

    return await this.page.evaluate(() => {
      const elements: InteractiveElement[] = [];

      // Seletores para elementos interativos
      const selectors = [
        'a[href]',
        'button',
        'input[type="submit"]',
        'input[type="button"]',
        '[role="button"]',
        '[onclick]',
        'select',
        'input[type="text"]',
        'input[type="email"]',
        'input[type="password"]',
        'textarea',
        '[tabindex]:not([tabindex="-1"])'
      ];

      selectors.forEach(selector => {
        const nodeList = document.querySelectorAll(selector);
        nodeList.forEach((el, index) => {
          const element = el as HTMLElement;
          const rect = element.getBoundingClientRect();
          
          if (rect.width > 0 && rect.height > 0) {
            const name = element.textContent?.trim() || 
                         element.getAttribute('aria-label') || 
                         element.getAttribute('title') || 
                         element.getAttribute('placeholder') ||
                         element.tagName + '_' + index;

            elements.push({
              selector: `${selector}:nth-of-type(${index + 1})`,
              name: name.substring(0, 50),
              text: name.substring(0, 50),
              type: element.tagName.toLowerCase() as 'button' | 'link' | 'clickable' | 'input' | 'textarea' | 'select',
              coordinates: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
              size: { width: rect.width, height: rect.height },
              isVisible: true,
              score: 10 // Score básico, pode ser refinado
            });
          }
        });
      });

      return elements;
    });
  }

  private async interactWithElement(element: InteractiveElement, outputDir: string, credentials?: { username: string; password: string }): Promise<InteractionResult> {
    if (!this.page) throw new Error('Página não disponível');

    const initialUrl = this.page.url();
    
    try {
      // Verificar se elemento ainda está visível
      const isVisible = await this.page.evaluate((sel) => {
        const el = document.querySelector(sel) as HTMLElement;
        return el && el.offsetParent !== null;
      }, element.selector);

      if (!isVisible) {
        return this.createFailedInteraction(element, initialUrl, 'Elemento não visível');
      }

      console.log(`   🎯 Interagindo com: ${element.type.toUpperCase()} - "${element.name}"`);

      // Fazer hover primeiro
      await this.page.hover(element.selector);
      await this.page.waitForTimeout(500);

      // Interagir baseado no tipo com lógica especial para login
      if (element.type === 'input' || element.type === 'textarea') {
        // Detectar se é campo de login
        const isLoginField = await this.isLoginField(element.selector);
        const isPasswordField = await this.isPasswordField(element.selector);
        
        if (credentials && (isLoginField || isPasswordField)) {
          const valueToFill = isPasswordField ? credentials.password : credentials.username;
          console.log(`   🔐 Preenchendo campo de ${isPasswordField ? 'senha' : 'usuário'}: ${isPasswordField ? '*'.repeat(valueToFill.length) : valueToFill}`);
          
          // Limpar campo e preencher
          await this.page.fill(element.selector, '');
          await this.page.waitForTimeout(200);
          await this.page.fill(element.selector, valueToFill);
          
          // Se preenchemos um campo de senha, tentar fazer login automático completo
          if (isPasswordField) {
            console.log(`   🚀 Campo de senha detectado - tentando login automático completo...`);
            const loginSuccess = await this.fillLoginFieldsImproved(credentials);
            if (loginSuccess) {
              await this.page.waitForTimeout(500);
              await this.clickLoginButton();
            }
          }
        } else {
          await this.page.fill(element.selector, 'Texto de teste automatizado');
        }
      } else {
        // Para botões de login, verificar se devemos preencher campos primeiro
        if (credentials && await this.isLoginButton(element.selector)) {
          console.log(`   🔐 Detectado botão de login - preenchendo campos automaticamente`);
          const loginSuccess = await this.fillLoginFieldsImproved(credentials);
          if (loginSuccess) {
            console.log(`   🎯 Campos preenchidos com sucesso - clicando botão...`);
            await this.page.waitForTimeout(1000);
          } else {
            console.log(`   ⚠️ Não foi possível preencher campos - clicando botão mesmo assim...`);
          }
        }
        
        await this.page.click(element.selector);
      }

      await this.page.waitForTimeout(2000);

      const finalUrl = this.page.url();
      const navigationOccurred = finalUrl !== initialUrl;

      // Capturar título da página
      const title = await this.page.title();

      return {
        success: true,
        navigationOccurred,
        urlChanged: navigationOccurred,
        initialUrl,
        finalUrl,
        element,
        filename: '',
        content: `Interação bem-sucedida com ${element.name}`,
        modalContent: null,
        url: finalUrl,
        title,
        newPageExplored: false,
        newPageElements: []
      };

    } catch (error) {
      return this.createFailedInteraction(element, initialUrl, error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }

  private createFailedInteraction(element: InteractiveElement, url: string, reason: string): InteractionResult {
    return {
      success: false,
      navigationOccurred: false,
      urlChanged: false,
      initialUrl: url,
      finalUrl: url,
      element,
      filename: '',
      content: reason,
      modalContent: null,
      url,
      title: 'Falha na interação',
      error: reason,
      newPageExplored: false,
      newPageElements: []
    };
  }

  private async captureScreenshot(outputDir: string, suffix: string): Promise<string> {
    if (!this.page) return '';

    try {
      this.screenshotCounter++;
      const filename = `screenshot_${this.screenshotCounter}_${suffix}.png`;
      const path = `${outputDir}/${filename}`;
      
      await this.page.screenshot({ 
        path,
        fullPage: true
      });
      
      console.log(`📷 Screenshot capturado: ${filename}`);
      return path;
    } catch (error) {
      console.error(`❌ Erro ao capturar screenshot: ${error}`);
      return '';
    }
  }

  private async capturePageState(): Promise<string> {
    if (!this.page) return '';

    try {
      return await this.page.evaluate(() => {
        const state = {
          url: window.location.href,
          title: document.title,
          activeElement: document.activeElement?.tagName || 'none',
          modals: document.querySelectorAll('[role="dialog"], .modal, .popup').length,
          forms: document.forms.length,
          visibleElements: Array.from(document.querySelectorAll('*')).filter(el => {
            const style = getComputedStyle(el as Element);
            return style.display !== 'none' && style.visibility !== 'hidden';
          }).length
        };
        return JSON.stringify(state);
      });
    } catch (error) {
      return JSON.stringify({ error: 'Erro ao capturar estado' });
    }
  }

  private generateStateChangeDescription(beforeState: string, afterState: string, interaction: InteractionResult): string {
    try {
      const before = JSON.parse(beforeState);
      const after = JSON.parse(afterState);
      
      const changes = [];
      
      if (before.url !== after.url) {
        changes.push(`Navegação de ${before.url} para ${after.url}`);
      }
      
      if (before.title !== after.title) {
        changes.push(`Título alterado de "${before.title}" para "${after.title}"`);
      }
      
      if (before.modals !== after.modals) {
        const diff = after.modals - before.modals;
        changes.push(diff > 0 ? `${diff} modal(s) aberto(s)` : `${Math.abs(diff)} modal(s) fechado(s)`);
      }
      
      if (before.activeElement !== after.activeElement) {
        changes.push(`Foco alterado para ${after.activeElement}`);
      }

      return changes.length > 0 ? changes.join(', ') : `Interação com ${interaction.element.name}`;
      
    } catch (error) {
      return `Mudança de estado após interação com ${interaction.element.name}`;
    }
  }

  private generateResult(): SequentialNavigationResult {
    const totalElements = this.pages.reduce((sum, page) => sum + page.elements.length, 0);
    const totalInteractions = this.pages.reduce((sum, page) => sum + page.elements.length, 0);
    const successfulInteractions = this.pages.reduce((sum, page) => 
      sum + page.elements.filter(el => el.success).length, 0);

    return {
      pages: this.pages,
      totalPages: this.pages.length,
      totalElements,
      totalInteractions,
      successfulInteractions,
      navigationHistory: Array.from(this.visitedUrls),
      baseUrl: this.baseUrl
    };
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      console.log('🔄 Browser fechado');
    }
  }

  // ===== MÉTODOS DE LOGIN AUXILIARES =====

  private async attemptAutoLogin(credentials: { username: string; password: string }): Promise<void> {
    if (!this.page) return;

    try {
      console.log('🔍 Procurando campos de login na página inicial...');
      
      // Aguardar um pouco para página carregar
      await this.page.waitForTimeout(2000);
      
      // Tentar preencher campos de login se existirem
      await this.fillLoginFields(credentials);
      
      // Procurar e clicar em botão de login
      const loginButtonClicked = await this.clickLoginButton();
      
      if (loginButtonClicked) {
        console.log('✅ Login automático realizado');
        await this.page.waitForTimeout(3000); // Aguardar redirecionamento
      } else {
        console.log('ℹ️  Nenhum botão de login encontrado na página inicial');
      }
      
    } catch (error) {
      console.log('⚠️ Erro no login automático:', error instanceof Error ? error.message : error);
    }
  }

  private async attemptAutoLoginOnPage(credentials: { username: string; password: string }): Promise<void> {
    if (!this.page) return;

    try {
      const currentUrl = this.page.url();
      console.log(`🔍 🔍 🔍 TENTANDO LOGIN AUTOMÁTICO: ${currentUrl}`);
      console.log(`👤 Credenciais disponíveis: ${credentials.username}/${credentials.password.length} chars`);
      
      // Verificar se é uma página do Keycloak (onde sabemos que o login funciona)
      if (currentUrl.includes('keycloak')) {
        console.log('🔐 Página Keycloak detectada - iniciando login automático...');
        
        // Aguardar página carregar completamente
        await this.page.waitForTimeout(2000);
        
        // Preencher campo de usuário usando seletor específico do Keycloak
        console.log('👤 Preenchendo campo de usuário...');
        const usernameField = await this.page.$('input[name="username"]');
        if (usernameField && await usernameField.isVisible()) {
          await usernameField.fill(credentials.username);
          console.log(`   ✅ Campo de usuário preenchido: ${credentials.username}`);
        } else {
          console.log('   ❌ Campo de usuário não encontrado');
        }
        
        // Preencher campo de senha usando seletor específico do Keycloak
        console.log('🔐 Preenchendo campo de senha...');
        const passwordField = await this.page.$('input[name="password"]');
        if (passwordField && await passwordField.isVisible()) {
          await passwordField.fill(credentials.password);
          console.log(`   ✅ Campo de senha preenchido: ${'*'.repeat(credentials.password.length)}`);
        } else {
          console.log('   ❌ Campo de senha não encontrado');
        }
        
        // Clicar no botão de login
        console.log('🎯 Procurando botão de login...');
        await this.page.waitForTimeout(1000);
        
        const loginButton = await this.page.$('button[type="submit"]');
        if (loginButton && await loginButton.isVisible()) {
          console.log('🎯 Clicando no botão de login...');
          await loginButton.click();
          
          // Aguardar processamento do login
          await this.page.waitForTimeout(5000);
          
          const finalUrl = this.page.url();
          if (finalUrl !== currentUrl) {
            console.log('🎉 LOGIN REALIZADO COM SUCESSO! Redirecionamento detectado.');
            console.log(`   🌐 Nova URL: ${finalUrl}`);
          } else {
            console.log('⚠️ Não houve redirecionamento após login');
          }
        } else {
          console.log('   ❌ Botão de login não encontrado');
        }
        
      } else {
        // Para outras páginas, usar detecção genérica
        const hasPasswordField = await this.page.$('input[type="password"]') !== null;
        if (hasPasswordField) {
          console.log('🔐 Página com campo de senha detectada - tentando login genérico...');
          const success = await this.fillLoginFieldsImproved(credentials);
          if (success) {
            await this.clickLoginButton();
          }
        } else {
          console.log('ℹ️  Esta não é uma página de login - continuando normalmente');
        }
      }
    } catch (error) {
      console.log('⚠️ Erro ao tentar login na página:', error instanceof Error ? error.message : error);
    }
  }

  private async isLoginField(selector: string): Promise<boolean> {
    if (!this.page) return false;

    return await this.page.evaluate((sel) => {
      const element = document.querySelector(sel) as HTMLInputElement;
      if (!element) return false;

      const type = element.type?.toLowerCase() || '';
      const name = element.name?.toLowerCase() || '';
      const id = element.id?.toLowerCase() || '';
      const placeholder = element.placeholder?.toLowerCase() || '';
      const autocomplete = element.autocomplete?.toLowerCase() || '';

      return type === 'text' || type === 'email' ||
             name.includes('user') || name.includes('login') || name.includes('email') ||
             id.includes('user') || id.includes('login') || id.includes('email') ||
             placeholder.includes('user') || placeholder.includes('login') || placeholder.includes('email') ||
             autocomplete.includes('username') || autocomplete.includes('email');
    }, selector);
  }

  private async isPasswordField(selector: string): Promise<boolean> {
    if (!this.page) return false;

    return await this.page.evaluate((sel) => {
      const element = document.querySelector(sel) as HTMLInputElement;
      if (!element) return false;

      const type = element.type?.toLowerCase() || '';
      const name = element.name?.toLowerCase() || '';
      const id = element.id?.toLowerCase() || '';
      const placeholder = element.placeholder?.toLowerCase() || '';
      const autocomplete = element.autocomplete?.toLowerCase() || '';

      return type === 'password' ||
             name.includes('password') || name.includes('senha') || name.includes('pass') ||
             id.includes('password') || id.includes('senha') || id.includes('pass') ||
             placeholder.includes('password') || placeholder.includes('senha') || placeholder.includes('pass') ||
             autocomplete.includes('password') || autocomplete.includes('current-password');
    }, selector);
  }

  private async isLoginButton(selector: string): Promise<boolean> {
    if (!this.page) return false;

    return await this.page.evaluate((sel) => {
      const element = document.querySelector(sel) as HTMLElement;
      if (!element) return false;

      const text = element.textContent?.toLowerCase() || '';
      const value = (element as HTMLInputElement).value?.toLowerCase() || '';
      const type = (element as HTMLInputElement).type?.toLowerCase() || '';

      return type === 'submit' ||
             text.includes('login') || text.includes('sign in') || text.includes('entrar') ||
             text.includes('fazer login') || text.includes('acessar') ||
             value.includes('login') || value.includes('sign in') || value.includes('entrar');
    }, selector);
  }

  private async fillLoginFields(credentials: { username: string; password: string }): Promise<void> {
    if (!this.page) return;

    try {
      // Seletores comuns para campos de login
      const usernameSelectors = [
        'input[type="text"]',
        'input[type="email"]',
        'input[name*="user"]',
        'input[name*="login"]',
        'input[name*="email"]',
        'input[id*="user"]',
        'input[id*="login"]',
        'input[id*="email"]',
        'input[placeholder*="user"]',
        'input[placeholder*="login"]',
        'input[placeholder*="email"]'
      ];

      const passwordSelectors = [
        'input[type="password"]',
        'input[name*="password"]',
        'input[name*="senha"]',
        'input[name*="pass"]',
        'input[id*="password"]',
        'input[id*="senha"]',
        'input[id*="pass"]'
      ];

      // Tentar preencher campo de usuário
      for (const selector of usernameSelectors) {
        try {
          const elements = await this.page.$$(selector);
          for (const element of elements) {
            const isVisible = await element.isVisible();
            if (isVisible) {
              await element.fill(credentials.username);
              console.log(`   👤 Campo de usuário preenchido: ${credentials.username}`);
              break;
            }
          }
        } catch (error) {
          // Continuar tentando outros seletores
        }
      }

      // Tentar preencher campo de senha
      for (const selector of passwordSelectors) {
        try {
          const elements = await this.page.$$(selector);
          for (const element of elements) {
            const isVisible = await element.isVisible();
            if (isVisible) {
              await element.fill(credentials.password);
              console.log(`   🔐 Campo de senha preenchido: ${'*'.repeat(credentials.password.length)}`);
              break;
            }
          }
        } catch (error) {
          // Continuar tentando outros seletores
        }
      }

    } catch (error) {
      console.log('⚠️ Erro ao preencher campos de login:', error instanceof Error ? error.message : error);
    }
  }

  private async fillLoginFieldsImproved(credentials: { username: string; password: string }): Promise<boolean> {
    if (!this.page) return false;

    try {
      let usernameFilled = false;
      let passwordFilled = false;

      // Seletores específicos para Keycloak e outros sistemas comuns
      const usernameSelectors = [
        'input[name="username"]',         // Keycloak específico
        'input[id="username"]',           // Keycloak específico
        'input[type="text"]:not([type="password"])',
        'input[type="email"]',
        'input[name*="user" i]',
        'input[name*="login" i]',
        'input[name*="email" i]',
        'input[id*="user" i]',
        'input[id*="login" i]',
        'input[id*="email" i]',
        'input[placeholder*="user" i]',
        'input[placeholder*="login" i]',
        'input[placeholder*="email" i]',
        'input[placeholder*="usuário" i]',
        'input[autocomplete="username"]',
        'input[autocomplete="email"]',
        'input:not([type="password"]):not([type="hidden"]):not([type="submit"]):not([type="button"])'
      ];

      const passwordSelectors = [
        'input[name="password"]',         // Keycloak específico
        'input[id="password"]',           // Keycloak específico
        'input[type="password"]',
        'input[name*="password" i]',
        'input[name*="senha" i]',
        'input[name*="pass" i]',
        'input[id*="password" i]',
        'input[id*="senha" i]',
        'input[id*="pass" i]',
        'input[placeholder*="password" i]',
        'input[placeholder*="senha" i]',
        'input[autocomplete="current-password"]',
        'input[autocomplete="password"]'
      ];

      // Preencher campo de usuário
      console.log(`   🔍 Procurando campo de usuário...`);
      for (const selector of usernameSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            const isVisible = await element.isVisible();
            const isEnabled = await element.isEnabled();
            if (isVisible && isEnabled && !usernameFilled) {
              // Limpar campo primeiro
              await element.fill('');
              await this.page.waitForTimeout(200);
              // Preencher com credenciais
              await element.fill(credentials.username);
              console.log(`   ✅ Campo de usuário preenchido: ${credentials.username} (seletor: ${selector})`);
              usernameFilled = true;
              break;
            }
          }
        } catch (error) {
          // Continuar tentando outros seletores
        }
      }

      // Preencher campo de senha
      console.log(`   🔍 Procurando campo de senha...`);
      for (const selector of passwordSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            const isVisible = await element.isVisible();
            const isEnabled = await element.isEnabled();
            if (isVisible && isEnabled && !passwordFilled) {
              // Limpar campo primeiro
              await element.fill('');
              await this.page.waitForTimeout(200);
              // Preencher com credenciais
              await element.fill(credentials.password);
              console.log(`   ✅ Campo de senha preenchido: ${'*'.repeat(credentials.password.length)} (seletor: ${selector})`);
              passwordFilled = true;
              break;
            }
          }
        } catch (error) {
          // Continuar tentando outros seletores
        }
      }

      const success = usernameFilled && passwordFilled;
      console.log(`   📊 Resultado do preenchimento: Usuário=${usernameFilled ? '✅' : '❌'}, Senha=${passwordFilled ? '✅' : '❌'}`);
      return success;

    } catch (error) {
      console.log('⚠️ Erro ao preencher campos de login melhorados:', error instanceof Error ? error.message : error);
      return false;
    }
  }

  private async clickLoginButton(): Promise<boolean> {
    if (!this.page) return false;

    const loginButtonSelectors = [
      'button[type="submit"]',          // Keycloak usa este
      'input[type="submit"]',
      'button:has-text("Sign In")',     // Keycloak específico
      'button:has-text("Login")',
      'button:has-text("Entrar")',
      'button:has-text("Fazer Login")',
      'button:has-text("Acessar")',
      'button:has-text("Continuar")',
      '[role="button"]:has-text("Login")',
      '[role="button"]:has-text("Sign In")',
      '[role="button"]:has-text("Entrar")',
      'button[value*="login" i]',
      'input[value*="login" i]',
      'button[name*="login" i]',
      'input[name*="login" i]',
      // Seletores mais genéricos para forms
      'form button[type="submit"]',
      'form input[type="submit"]',
      'form button:not([type="button"]):not([type="reset"])',
      // Keycloak específico - qualquer botão em form de login
      '#kc-login button',
      '.login-pf-page button[type="submit"]'
    ];

    for (const selector of loginButtonSelectors) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          const isVisible = await element.isVisible();
          const isEnabled = await element.isEnabled();
          if (isVisible && isEnabled) {
            // Verificar se o texto do elemento sugere que é um botão de login
            const text = await element.textContent();
            const value = await element.getAttribute('value');
            const combinedText = `${text || ''} ${value || ''}`.toLowerCase();
            
            if (combinedText.includes('login') || combinedText.includes('sign in') || 
                combinedText.includes('entrar') || combinedText.includes('acessar') ||
                combinedText.includes('submit') || combinedText.includes('continuar') ||
                selector.includes('submit') || selector.includes('Sign In')) {
              
              await element.click();
              console.log(`   🎯 Botão de login clicado: "${text || value || 'Submit'}" (seletor: ${selector})`);
              return true;
            }
          }
        }
      } catch (error) {
        // Continuar tentando outros seletores
      }
    }

    return false;
  }
}
