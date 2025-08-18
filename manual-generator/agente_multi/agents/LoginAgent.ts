import { BaseAgent, AgentConfig, TaskData, TaskResult } from '../core/AgnoSCore';
import { Page } from 'playwright';
import { MinIOService } from '../services/MinIOService';
import { AuthDetectionResult } from './interfaces/AuthTypes';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface LoginCredentials {
  username: string;
  password: string;
  loginUrl?: string;
  customSteps?: LoginStep[];
}

export interface LoginStep {
  type: 'fill' | 'click' | 'wait' | 'waitForSelector';
  selector: string;
  value?: string;
  timeout?: number;
}

export class LoginAgent extends BaseAgent {
  private page: Page | null = null;
  private minioService: MinIOService;
  private sessionData: any = null;
  private logDir: string;
  private logFile: string;

  private async logToFile(message: string, stage: string = 'login'): Promise<void> {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
      const logMsg = `[${new Date().toISOString()}][${stage}] ${message}\n`;
      await fs.appendFile(this.logFile, logMsg, 'utf-8');
    } catch (error) {
      console.error(`Erro ao salvar log: ${error}`);
    }
  }

  constructor() {
    const config: AgentConfig = {
      name: 'LoginAgent',
      version: '1.0.0',
      description: 'Agente especializado em autenticação e gerenciamento de sessões',
      capabilities: [
        { name: 'basic_auth', description: 'Autenticação básica com usuário e senha', version: '1.0.0' },
        { name: 'oauth_auth', description: 'Autenticação OAuth 2.0', version: '1.0.0' },
        { name: 'session_management', description: 'Gerenciamento de sessões', version: '1.0.0' },
        { name: 'custom_auth', description: 'Fluxos de autenticação customizados', version: '1.0.0' }
      ]
    };

    super(config);
    this.minioService = new MinIOService();
    this.logDir = path.join(process.cwd(), 'output', 'agent_logs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = path.join(this.logDir, `LoginAgent_output_${timestamp}.md`);
  }

  async initialize(): Promise<void> {
    await this.minioService.initialize();
    this.log('LoginAgent inicializado e pronto para autenticação');
    await this.logToFile('LoginAgent inicializado e pronto para autenticação', 'init');
  }

  async processTask(task: TaskData): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      switch (task.type) {
        case 'authenticate':
          return await this.handleAuthentication(task);
        
        case 'check_session':
          return await this.handleSessionCheck(task);
          
        case 'logout':
          return await this.handleLogout(task);
          
        default:
          throw new Error(`Tipo de tarefa não suportada: ${task.type}`);
      }

    } catch (error) {
      return {
        id: task.id,
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };
    }
  }

  private async handleAuthentication(task: TaskData): Promise<TaskResult> {
    const startTime = Date.now();
    const { url, credentials, authType, customSteps, page } = task.data;
    
    // Verificar se a página foi fornecida
    if (page) {
      this.page = page;
    }
    
    if (!this.page) throw new Error('Página não fornecida para autenticação');
    if (!credentials || !credentials.username || !credentials.password) {
      throw new Error('Credenciais inválidas ou incompletas');
    }
    
    const loginUrl = url || credentials.loginUrl;
    this.log(`🔐 Iniciando autenticação genérica para: ${loginUrl}`);
    this.log(`📋 Tipo de autenticação: ${authType || 'basic'}`);
    
    const stepLog: any[] = [];
    const screenshots: Record<string, string | null> = {};
    
    try {
      // FASE 1: Navegação e preparação (se URL fornecida)
      if (loginUrl && this.page.url() !== loginUrl) {
        await this.navigateToLoginPage(loginUrl, stepLog);
      } else {
        // Garantir que a página atual esteja completamente carregada
        await this.ensurePageFullyLoaded();
      }
      
      // FASE 2: Análise da página e detecção de elementos
      const pageAnalysis = await this.analyzeLoginPage(screenshots, stepLog);
      
      // FASE 3: Execução da autenticação
      const authResult = await this.executeAuthentication(credentials, pageAnalysis, customSteps, stepLog, screenshots);
      
      // FASE 4: Verificação de sucesso
      const success = await this.verifyAuthenticationSuccess();
      
      if (!success) {
        throw new Error('Autenticação falhou - verificação de sucesso negativa');
      }
      
      // FASE 5: Captura de dados de sessão
      const sessionData = await this.captureSessionData();
      screenshots['post_login_page'] = await this.capturePostLoginPage();
      
      this.log('✅ Autenticação concluída com sucesso');
      
      return {
        id: task.id,
        taskId: task.id,
        success: true,
        data: {
          authenticated: true,
          authType: authType || 'basic',
          sessionData,
          sessionId: sessionData?.sessionId,
          userContext: sessionData?.userInfo,
          loginSteps: stepLog,
          screenshots,
          pageAnalysis
        },
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };
      
    } catch (error) {
      this.log(`❌ Erro na autenticação: ${error}`, 'error');
      
      // Capturar screenshot de erro para diagnóstico
      try {
        screenshots['error_page'] = await this.captureLoginPage();
      } catch (screenshotError) {
        this.log(`⚠️ Erro ao capturar screenshot de erro: ${screenshotError}`, 'warn');
      }
      
      return {
        id: task.id,
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        data: {
          authenticated: false,
          loginSteps: stepLog,
          screenshots,
          errorDetails: error
        },
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Navega para a página de login
   */
  private async navigateToLoginPage(loginUrl: string, stepLog: any[]): Promise<void> {
    if (!this.page) throw new Error('Página não disponível');
    
    this.log(`🌐 Navegando para: ${loginUrl}`);
    
    try {
      // Navegar para a página com aguarda completa
      await this.page.goto(loginUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      
      // Aguardar que todos os recursos sejam carregados
      await this.page.waitForLoadState('networkidle', { timeout: 15000 });
      
      // Aguardar que o DOM esteja completamente renderizado
      await this.page.waitForFunction(() => {
        return document.readyState === 'complete' && 
               document.body && 
               document.body.children.length > 0;
      }, { timeout: 10000 });
      
      // Aguardar um pouco para carregamento de SPAs
      await this.page.waitForTimeout(3000);
      
      // Tentar detectar e clicar em botões de login que revelam formulários
      await this.handleInitialLoginButtons();
      
      // Aguardar elementos básicos de formulário aparecerem
      try {
        await this.page.waitForSelector('input, form, button', { timeout: 10000 });
        this.log('✅ Elementos de formulário detectados');
      } catch (e) {
        this.log('⚠️ Nenhum elemento de formulário detectado imediatamente', 'warn');
      }
      
      // Tratar redirecionamentos e modais
      await this.handleRedirectsAndModals();
      
      stepLog.push({ 
        action: 'navigate', 
        url: loginUrl, 
        finalUrl: this.page.url(),
        timestamp: new Date().toISOString()
      });
      
      this.log(`✅ Navegação concluída: ${this.page.url()}`);
      
    } catch (error) {
      this.log(`❌ Erro na navegação: ${error}`, 'error');
      throw new Error(`Falha ao navegar para página de login: ${error}`);
    }
  }

  /**
   * Garante que a página esteja completamente carregada para qualquer aplicação web
   */
  private async ensurePageFullyLoaded(): Promise<void> {
    if (!this.page) throw new Error('Página não disponível');
    
    try {
      this.log('⏳ Aguardando carregamento completo da página...');
      
      // Aguardar que todos os recursos de rede sejam carregados
      await this.page.waitForLoadState('networkidle', { timeout: 15000 });
      
      // Aguardar que o DOM esteja completamente renderizado
      await this.page.waitForFunction(() => {
        return document.readyState === 'complete' && 
               document.body && 
               document.body.children.length > 0;
      }, { timeout: 10000 });
      
      // Aguardar elementos básicos de formulário aparecerem (genérico para qualquer app)
      try {
        await this.page.waitForSelector('input, form, button, [type="submit"], [role="button"]', { timeout: 5000 });
      } catch (e) {
        this.log('⚠️ Nenhum elemento de formulário detectado imediatamente - pode ser SPA', 'warn');
      }
      
      // Aguardar estabilização adicional para SPAs e aplicações dinâmicas
      await this.page.waitForTimeout(1500);
      
      this.log('✅ Página completamente carregada e estabilizada');
      
    } catch (error) {
      this.log(`⚠️ Aviso no carregamento da página: ${error}`, 'warn');
      // Não falhar - apenas logar o aviso para manter compatibilidade genérica
    }
  }

  /**
   * Analisa a página de login e detecta elementos
   */
  private async analyzeLoginPage(screenshots: Record<string, string | null>, stepLog: any[]): Promise<any> {
    if (!this.page) throw new Error('Página não disponível');
    
    this.log('🔍 Analisando página de login...');
    
    try {
      // Capturar screenshot inicial
      screenshots['login_page'] = await this.captureLoginPage();
      
      // Garantir que botões iniciais de login sejam clicados antes da detecção
      await this.handleInitialLoginButtons();
      
      // Detectar métodos de autenticação disponíveis
      const authMethods = await this.detectAuthMethods();
      
      // Detectar e capturar elementos individuais
      await this.detectAndCaptureLoginElements(screenshots);
      
      // Detectar logins alternativos
      const alternativeLogins = await this.detectAlternativeLogins();
      
      const analysis = {
        authMethods,
        alternativeLogins,
        hasStandardLogin: authMethods.standardAuth.available,
        hasOAuthOptions: authMethods.oauthProviders.length > 0,
        pageUrl: this.page.url(),
        pageTitle: await this.page.title()
      };
      
      stepLog.push({ 
        action: 'analyze_page', 
        analysis,
        timestamp: new Date().toISOString()
      });
      
      this.log(`📊 Análise concluída: ${analysis.hasStandardLogin ? 'Login padrão' : 'Sem login padrão'}, ${analysis.alternativeLogins.length} opções alternativas`);
      
      return analysis;
      
    } catch (error) {
      this.log(`❌ Erro na análise da página: ${error}`, 'error');
      throw new Error(`Falha ao analisar página de login: ${error}`);
    }
  }

  /**
   * Executa o processo de autenticação
   */
  private async executeAuthentication(
    credentials: any, 
    pageAnalysis: any, 
    customSteps: any[] | undefined, 
    stepLog: any[], 
    screenshots: Record<string, string | null>
  ): Promise<boolean> {
    if (!this.page) throw new Error('Página não disponível');
    
    this.log('⚡ Executando processo de autenticação...');
    
    try {
      // Se há passos customizados, executá-los
      if (customSteps && customSteps.length > 0) {
        this.log('🔧 Executando passos customizados de autenticação');
        return await this.performCustomAuth(credentials);
      }
      
      // Caso contrário, usar detecção automática
      if (pageAnalysis.hasStandardLogin) {
        this.log('🔑 Executando autenticação padrão');
        return await this.executeStandardAuthentication(credentials, stepLog, screenshots);
      }
      
      // Se há opções OAuth, tentar usar a primeira disponível
      if (pageAnalysis.hasOAuthOptions && pageAnalysis.alternativeLogins.length > 0) {
        this.log('🔗 Tentando autenticação OAuth');
        // OAuth genérico não implementado - usar autenticação customizada se necessário
        throw new Error('Autenticação OAuth detectada mas não implementada. Use customSteps para OAuth específico.');
      }
      
      throw new Error('Nenhum método de autenticação compatível encontrado');
      
    } catch (error) {
      this.log(`❌ Erro na execução da autenticação: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Executa autenticação padrão (campos de usuário e senha)
   */
  private async executeStandardAuthentication(
    credentials: any, 
    stepLog: any[], 
    screenshots: Record<string, string | null>
  ): Promise<boolean> {
    if (!this.page) throw new Error('Página não disponível');
    
    try {
      // Buscar campos de login com seletores mais abrangentes
      const usernameField = await this.findUsernameField();
      const passwordField = await this.findPasswordField();
      
      if (!usernameField || !passwordField) {
        throw new Error('Campos de usuário ou senha não encontrados');
      }
      
      this.log('📝 Preenchendo credenciais...');
      await this.logToFile('📝 Preenchendo credenciais...');
      
      // Preencher campo de usuário
      await usernameField.evaluate((el: HTMLElement) => el.scrollIntoView());
      await usernameField.click();
      await usernameField.fill(''); // Limpar campo
      await usernameField.type(credentials.username, { delay: 100 });
      await this.page.waitForTimeout(500);
      await this.logToFile(`✅ Campo de usuário preenchido: ${credentials.username}`);
      
      // Preencher campo de senha
      await passwordField.evaluate((el: HTMLElement) => el.scrollIntoView());
      await passwordField.click();
      await passwordField.fill(''); // Limpar campo
      await passwordField.type(credentials.password, { delay: 100 });
      await this.page.waitForTimeout(500);
      await this.logToFile('✅ Campo de senha preenchido');
      
      stepLog.push({ 
        action: 'fill_credentials', 
        username: credentials.username,
        timestamp: new Date().toISOString()
      });
      
      // Capturar screenshot antes do submit
      screenshots['before_submit'] = await this.captureLoginPage();
      
      // Submeter formulário
      const submitButton = await this.page.$('button[type="submit"], input[type="submit"], button[class*="login"], button[class*="submit"], button[class*="signin"]');
      if (submitButton) {
        await this.logToFile('🎯 Clicando no botão de submit');
        await submitButton.click();
        stepLog.push({ action: 'click_submit', timestamp: new Date().toISOString() });
      } else {
        await this.logToFile('⌨️ Pressionando Enter para submeter');
        await passwordField.press('Enter');
        stepLog.push({ action: 'press_enter', timestamp: new Date().toISOString() });
      }
      await this.page.waitForLoadState('networkidle');
      await this.logToFile('✅ Formulário submetido, aguardando resposta...');
      
      return true;
      
    } catch (error) {
      this.log(`❌ Erro na autenticação padrão: ${error}`, 'error');
      await this.logToFile(`❌ Erro na autenticação padrão: ${error}`);
      throw error;
    }
  }

  /**
   * Encontra campo de usuário/email
   */
  private async findUsernameField(): Promise<any> {
    if (!this.page) return null;
    
    // Buscar usando seletores diretos primeiro
    const selectors = [
      'input[type="email"]',
      'input[name*="user"]',
      'input[name*="email"]',
      'input[name*="login"]',
      'input[id*="user"]',
      'input[id*="email"]',
      'input[id*="login"]',
      'input[placeholder*="user"]',
      'input[placeholder*="email"]',
      'input[placeholder*="login"]',
      'input[class*="user"]',
      'input[class*="email"]',
      'input[class*="login"]',
      'input[type="text"]'
    ];
    
    for (const selector of selectors) {
      const field = await this.page.$(selector);
      if (field) {
        const isVisible = await field.isVisible();
        if (isVisible) {
          return field;
        }
      }
    }
    
    return null;
  }

  /**
   * Encontra campo de senha
   */
  private async findPasswordField(): Promise<any> {
    if (!this.page) return null;
    
    // Buscar usando seletores diretos
    const selectors = [
      'input[type="password"]',
      'input[name*="password"]',
      'input[name*="senha"]',
      'input[name*="pass"]',
      'input[id*="password"]',
      'input[id*="senha"]',
      'input[id*="pass"]',
      'input[placeholder*="password"]',
      'input[placeholder*="senha"]',
      'input[placeholder*="pass"]',
      'input[class*="password"]',
      'input[class*="senha"]',
      'input[class*="pass"]'
    ];
    
    for (const selector of selectors) {
      const field = await this.page.$(selector);
      if (field) {
        const isVisible = await field.isVisible();
        if (isVisible) {
          return field;
        }
      }
    }
    
    return null;
  }

  /**
   * Encontra campo por placeholder
   */
  private async findFieldByPlaceholder(placeholders: string[]): Promise<any> {
    if (!this.page) return null;
    
    for (const placeholder of placeholders) {
      const field = await this.page.$(`input[placeholder*="${placeholder}"], input[aria-label*="${placeholder}"]`);
      if (field) return field;
    }
    return null;
  }

  private async handleSessionCheck(task: TaskData): Promise<TaskResult> {
    const { page } = task.data;
    this.page = page;

    try {
      const isValid = await this.validateSession();
      
      return {
        id: task.id,
        taskId: task.id,
        success: true,
        data: { sessionValid: isValid },
        timestamp: new Date(),
        processingTime: 0
      };

    } catch (error) {
      throw error;
    }
  }

  private async handleLogout(task: TaskData): Promise<TaskResult> {
    const { page } = task.data;
    this.page = page;

    try {
      await this.performLogout();
      this.sessionData = null;
      
      return {
        id: task.id,
        taskId: task.id,
        success: true,
        data: { loggedOut: true },
        timestamp: new Date(),
        processingTime: 0
      };

    } catch (error) {
      throw error;
    }
  }

  /**
    * Detecta e clica em botões iniciais de login que podem revelar formulários
    */
   private async handleInitialLoginButtons(): Promise<void> {
     if (!this.page) return;
     
     try {
       await this.logToFile('🔍 Procurando por botões de login iniciais...');
       
       // Seletores para botões que podem revelar formulários de login
       const loginButtonSelectors = [
         'button:has-text("Fazer Login")',
         'button:has-text("Login")',
         'button:has-text("Entrar")',
         'button:has-text("Sign In")',
         'a:has-text("Fazer Login")',
         'a:has-text("Login")',
         'a:has-text("Entrar")',
         'a:has-text("Sign In")',
         '[data-testid*="login"]',
         '[class*="login-button"]',
         '[class*="signin-button"]',
         '[id*="login-btn"]',
         '[id*="signin-btn"]'
       ];
       
       for (const selector of loginButtonSelectors) {
         try {
           const button = await this.page.$(selector);
           if (button) {
             const isVisible = await button.isVisible();
             if (isVisible) {
               await this.logToFile(`🎯 Encontrado botão de login: ${selector}`);
               await button.click();
               await this.page.waitForTimeout(3000);
               
               // Verificar se formulário apareceu após o clique
               const formAppeared = await this.page.$('input[type="password"], input[name*="password"]');
               if (formAppeared) {
                 await this.logToFile('✅ Formulário de login revelado após clique');
                 return;
               }
             }
           }
         } catch (e) {
           // Continuar tentando outros seletores
           continue;
         }
       }
       
       await this.logToFile('ℹ️ Nenhum botão inicial de login encontrado ou necessário');
       
     } catch (error) {
       await this.logToFile(`⚠️ Erro ao procurar botões iniciais: ${error}`);
     }
   }

  private async handleRedirectsAndModals(): Promise<void> {
    if (!this.page) return;
    
    try {
      // Aguardar possíveis redirecionamentos
      await this.page.waitForTimeout(2000);
      
      // Verificar e fechar modais/popups que podem interferir
      const modalSelectors = [
        '[class*="modal"]',
        '[class*="popup"]',
        '[class*="overlay"]',
        '.cookie-banner',
        '[data-testid="cookie-banner"]'
      ];
      
      for (const selector of modalSelectors) {
        const modal = await this.page.$(selector);
        if (modal) {
          const closeButton = await modal.$('button[class*="close"], .close, [aria-label="close"], [aria-label="Close"]');
          if (closeButton) {
            await closeButton.click();
            await this.page.waitForTimeout(500);
          }
        }
      }
    } catch (error) {
      this.log(`Erro ao lidar com redirecionamentos/modais: ${error}`, 'warn');
    }
  }

  private async detectAndCaptureLoginElements(screenshots: Record<string, string | null>): Promise<void> {
    if (!this.page) return;
    
    try {
      // Capturar elementos individuais de login
      const usernameField = await this.page.$('input[type="email"], input[type="text"], input[name*="user"], input[name*="login"]');
      const passwordField = await this.page.$('input[type="password"]');
      
      if (usernameField) {
        await usernameField.evaluate((el: HTMLElement) => el.scrollIntoView());
        screenshots['campo_usuario'] = await this.captureElementScreenshot(usernameField, 'campo_usuario');
      }
      
      if (passwordField) {
        await passwordField.evaluate((el: HTMLElement) => el.scrollIntoView());
        screenshots['campo_senha'] = await this.captureElementScreenshot(passwordField, 'campo_senha');
      }
      
      // Capturar botão de submit se existir
      const submitButton = await this.page.$('button[type="submit"], input[type="submit"], button[class*="login"]');
      if (submitButton) {
        await submitButton.evaluate((el: HTMLElement) => el.scrollIntoView());
        screenshots['botao_login'] = await this.captureElementScreenshot(submitButton, 'botao_login');
      }
    } catch (error) {
      this.log(`Erro ao capturar elementos de login: ${error}`, 'warn');
    }
  }

  private async detectAlternativeLogins(): Promise<Array<{type: string, selector: string, text: string}>> {
    if (!this.page) return [];
    
    try {
      const altLogins = await this.page.evaluate(() => {
        const alternatives: Array<{type: string, selector: string, text: string}> = [];
        
        // Detectar logins sociais
        const socialSelectors = [
          { type: 'Google', patterns: ['.google', '[data-provider="google"]', '[class*="google-login"]'] },
          { type: 'Facebook', patterns: ['.facebook', '[data-provider="facebook"]', '[class*="facebook-login"]'] },
          { type: 'GitHub', patterns: ['.github', '[data-provider="github"]', '[class*="github-login"]'] },
          { type: 'Microsoft', patterns: ['.microsoft', '[data-provider="microsoft"]', '[class*="microsoft-login"]'] }
        ];
        
        socialSelectors.forEach(social => {
          social.patterns.forEach(pattern => {
            const element = document.querySelector(pattern);
            if (element) {
              alternatives.push({
                type: social.type,
                selector: pattern,
                text: element.textContent?.trim() || ''
              });
            }
          });
        });
        
        return alternatives;
      });
      
      return altLogins;
    } catch (error) {
      this.log(`Erro ao detectar logins alternativos: ${error}`, 'warn');
      return [];
    }
  }

  private async captureElementScreenshot(element: any, name: string): Promise<string | null> {
    try {
      const filename = `${name}_${Date.now()}.png`;
      const localPath = `output/screenshots/${filename}`;
      
      await element.screenshot({ path: localPath, type: 'png' });
      
      // Upload para MinIO
      const minioUrl = await this.minioService.uploadScreenshot(localPath, filename);
      
      this.log(`Screenshot do elemento ${name} capturado: ${filename}`);
      return minioUrl || localPath;
    } catch (error) {
      this.log(`Erro ao capturar screenshot do elemento ${name}: ${error}`, 'warn');
      return null;
    }
  }

  private async detectAuthMethods(): Promise<AuthDetectionResult> {
    if (!this.page) throw new Error('Página não disponível');

    await this.logToFile('🔍 Iniciando detecção de métodos de autenticação...');

    // Capturar logs do console do browser
    const consoleLogs: string[] = [];
    this.page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });

    const authMethods = await this.page.evaluate(() => {
      // Detectar autenticação padrão
      const standardAuth = {
        available: false,
        fields: {
          required: [] as string[],
          optional: [] as string[]
        }
      };

      // Buscar formulários de login de forma mais abrangente
      const forms = document.querySelectorAll('form, [role="form"], .login-form, .signin-form, .auth-form');
      console.log(`📋 Encontrados ${forms.length} formulários`);
      
      let hasUsernameField = false;
      let hasPasswordField = false;
      
      // Se não encontrar formulários, buscar inputs diretamente
      const allInputs = forms.length > 0 ? 
        Array.from(forms).flatMap(form => Array.from(form.querySelectorAll('input'))) :
        Array.from(document.querySelectorAll('input'));
      
      console.log(`📝 Encontrados ${allInputs.length} inputs ${forms.length > 0 ? 'dentro dos formulários' : 'diretamente na página'}`);

      allInputs.forEach((input, index) => {
        const inputElement = input as HTMLInputElement;
        const name = inputElement.name || inputElement.id || inputElement.placeholder || '';
        const type = inputElement.type?.toLowerCase() || '';
        const className = inputElement.className?.toLowerCase() || '';
        const placeholder = inputElement.placeholder?.toLowerCase() || '';
        
        console.log(`Input ${index + 1}: type="${type}", name="${name}", placeholder="${placeholder}", class="${className}"`);
        
        // Detectar campos de usuário/email com seletores mais específicos
        if (type === 'email' || type === 'text' || 
            name.toLowerCase().includes('user') || name.toLowerCase().includes('email') ||
            name.toLowerCase().includes('login') || placeholder.includes('email') ||
            placeholder.includes('user') || placeholder.includes('login') ||
            className.includes('user') || className.includes('email') ||
            className.includes('login') || name === 'username' || inputElement.id === 'username') {
          hasUsernameField = true;
          console.log(`👤 Campo de usuário detectado: name="${name}", id="${inputElement.id}", type="${type}"`);
          if (inputElement.hasAttribute('required') || inputElement.required) {
            standardAuth.fields.required.push(name || 'username');
          } else {
            standardAuth.fields.optional.push(name || 'username');
          }
        }
        
        // Detectar campos de senha com seletores mais específicos
        if (type === 'password' || 
            name.toLowerCase().includes('pass') || placeholder.includes('pass') ||
            className.includes('pass') || name === 'password' || inputElement.id === 'password') {
          hasPasswordField = true;
          console.log(`🔒 Campo de senha detectado: name="${name}", id="${inputElement.id}", type="${type}"`);
          if (inputElement.hasAttribute('required') || inputElement.required) {
            standardAuth.fields.required.push(name || 'password');
          } else {
            standardAuth.fields.optional.push(name || 'password');
          }
        }
      });
      
      console.log(`Resultado da detecção: hasUsernameField=${hasUsernameField}, hasPasswordField=${hasPasswordField}`);
      
      // Considerar disponível se tiver pelo menos um campo de usuário e um de senha
      standardAuth.available = hasUsernameField && hasPasswordField;

      // Detectar provedores OAuth
      const oauthProviders = [] as Array<{ name: string; buttonSelector: string; location: string }>;
      const oauthSelectors = [
        { name: 'Google', patterns: ['.google', '[data-provider="google"]', '[class*="google-login"]'] },
        { name: 'Facebook', patterns: ['.facebook', '[data-provider="facebook"]', '[class*="facebook-login"]'] },
        { name: 'GitHub', patterns: ['.github', '[data-provider="github"]', '[class*="github-login"]'] },
        { name: 'Microsoft', patterns: ['.microsoft', '[data-provider="microsoft"]', '[class*="microsoft-login"]'] },
        { name: 'LinkedIn', patterns: ['.linkedin', '[data-provider="linkedin"]', '[class*="linkedin-login"]'] }
      ];

      oauthSelectors.forEach(provider => {
        provider.patterns.forEach(pattern => {
          const button = document.querySelector(pattern);
          if (button) {
            const rect = button.getBoundingClientRect();
            oauthProviders.push({
              name: provider.name,
              buttonSelector: pattern,
              location: `x: ${rect.x}, y: ${rect.y}`
            });
          }
        });
      });

      // Detectar recursos adicionais
      const additionalFeatures = {
        passwordRecovery: {
          available: false,
          link: undefined as string | undefined
        },
        registration: {
          available: false,
          link: undefined as string | undefined
        },
        twoFactor: false
      };

      // Buscar links de recuperação de senha
      const recoveryLinks = document.querySelectorAll('a[href*="forgot"], a[href*="reset"], a[href*="recovery"]');
      if (recoveryLinks.length > 0) {
        additionalFeatures.passwordRecovery.available = true;
        additionalFeatures.passwordRecovery.link = recoveryLinks[0].getAttribute('href') || undefined;
      }

      // Buscar links de registro
      const registrationLinks = document.querySelectorAll('a[href*="register"], a[href*="signup"], a[href*="sign-up"]');
      if (registrationLinks.length > 0) {
        additionalFeatures.registration.available = true;
        additionalFeatures.registration.link = registrationLinks[0].getAttribute('href') || undefined;
      }

      // Verificar indicadores de 2FA
      additionalFeatures.twoFactor = document.body.innerHTML.toLowerCase().includes('2fa') ||
                                   document.body.innerHTML.toLowerCase().includes('two factor') ||
                                   document.body.innerHTML.toLowerCase().includes('authenticator');

      return {
        standardAuth,
        oauthProviders,
        additionalFeatures
      };
    });

    // Registrar logs do console do browser
    for (const log of consoleLogs) {
      await this.logToFile(`[BROWSER] ${log}`);
    }

    // Log dos resultados da detecção
    await this.logToFile(`👤 Campo de usuário encontrado: ${authMethods.standardAuth.available ? 'SIM' : 'NÃO'}`);
    await this.logToFile(`🔒 Campo de senha encontrado: ${authMethods.standardAuth.available ? 'SIM' : 'NÃO'}`);
    await this.logToFile(`✅ Autenticação padrão disponível: ${authMethods.standardAuth.available ? 'SIM' : 'NÃO'}`);
    await this.logToFile(`🔗 Provedores OAuth encontrados: ${authMethods.oauthProviders.length}`);

    return authMethods;
  }

  private async performBasicAuth(credentials: LoginCredentials): Promise<boolean> {
    if (!this.page) throw new Error('Página não disponível');

    try {
      this.log('Executando autenticação básica');

      // Localizar campos de login
      const usernameField = await this.page.$(
        'input[type="email"], input[type="text"], input[name*="user"], input[name*="login"], input[placeholder*="email"], input[placeholder*="usuário"]'
      );
      
      const passwordField = await this.page.$('input[type="password"]');

      if (!usernameField || !passwordField) {
        throw new Error('Campos de login não encontrados');
      }

      // Preencher credenciais
      await usernameField.fill(credentials.username);
      await this.page.waitForTimeout(500);
      
      await passwordField.fill(credentials.password);
      await this.page.waitForTimeout(500);

      // Submeter formulário
      const submitButton = await this.page.$(
        'button[type="submit"], input[type="submit"], button[class*="login"], button[class*="submit"], button[class*="signin"]'
      );

      if (submitButton) {
        await submitButton.click();
      } else {
        // Fallback: pressionar Enter
        await passwordField.press('Enter');
      }

      // Aguardar resposta
      await this.page.waitForTimeout(4000);

      // Verificar sucesso
      return await this.verifyAuthenticationSuccess();

    } catch (error) {
      this.log(`Erro na autenticação básica: ${error}`, 'error');
      return false;
    }
  }

  private async performOAuthAuth(credentials: LoginCredentials): Promise<boolean> {
    this.log('OAuth ainda não implementado', 'warn');
    return false;
  }

  private async performCustomAuth(credentials: LoginCredentials): Promise<boolean> {
    if (!credentials.customSteps) {
      this.log('Steps customizados não fornecidos', 'error');
      return false;
    }

    try {
      this.log('Executando autenticação customizada');

      for (const step of credentials.customSteps) {
        await this.executeCustomStep(step);
      }

      return await this.verifyAuthenticationSuccess();

    } catch (error) {
      this.log(`Erro na autenticação customizada: ${error}`, 'error');
      return false;
    }
  }

  private async executeCustomStep(step: LoginStep): Promise<void> {
    if (!this.page) throw new Error('Página não disponível');

    switch (step.type) {
      case 'fill':
        await this.page.fill(step.selector, step.value || '');
        break;
      
      case 'click':
        await this.page.click(step.selector);
        break;
        
      case 'wait':
        await this.page.waitForTimeout(step.timeout || 1000);
        break;
        
      case 'waitForSelector':
        await this.page.waitForSelector(step.selector, { timeout: step.timeout || 10000 });
        break;
    }
  }

  private async verifyAuthenticationSuccess(): Promise<boolean> {
    if (!this.page) return false;

    try {
      const authResult = await this.page.evaluate(() => {
        // Verificar se não há mais campos de senha (indicativo de sucesso)
        const passwordFields = document.querySelectorAll('input[type="password"]');
        
        // Verificar indicadores positivos de sucesso
        const successIndicators = document.querySelectorAll(
          '[class*="dashboard"], [class*="profile"], [class*="logout"], [class*="welcome"], [class*="menu"], nav, header'
        );

        // Verificar se URL mudou (não contém mais "login")
        const currentUrl = window.location.href.toLowerCase();
        const hasLoginInUrl = currentUrl.includes('login') || currentUrl.includes('signin') || currentUrl.includes('auth');

        // Verificar se há mensagens de erro
        const errorMessages = document.querySelectorAll(
          '[class*="error"], [class*="invalid"], [class*="fail"], .alert-danger'
        );

        return {
          noPasswordFields: passwordFields.length === 0,
          hasSuccessIndicators: successIndicators.length > 0,
          urlChanged: !hasLoginInUrl,
          noErrors: errorMessages.length === 0,
          currentUrl
        };
      });

      this.log(`Verificação de autenticação: ${JSON.stringify(authResult)}`);

      // Considerar sucesso se pelo menos 2 indicadores são positivos
      const successCount = [
        authResult.noPasswordFields,
        authResult.hasSuccessIndicators,
        authResult.urlChanged,
        authResult.noErrors
      ].filter(Boolean).length;

      return successCount >= 2;

    } catch (error) {
      this.log(`Erro na verificação: ${error}`, 'error');
      return false;
    }
  }

  private async captureSessionData(): Promise<any> {
    if (!this.page) return null;

    const sessionData = await this.page.evaluate(() => {
      const userInfo = {
        name: document.querySelector('[class*="user-name"], [class*="username"], [class*="display-name"]')?.textContent?.trim(),
        email: document.querySelector('[class*="user-email"], [class*="email"]')?.textContent?.trim(),
        avatar: document.querySelector('[class*="avatar"], [class*="profile-img"]')?.getAttribute('src')
      };

      return {
        cookies: document.cookie,
        localStorage: JSON.stringify(localStorage),
        sessionStorage: JSON.stringify(sessionStorage),
        url: window.location.href,
        userInfo,
        timestamp: new Date().toISOString()
      };
    });

    return {
      ...sessionData,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userContext: sessionData.userInfo
    };
  }

  private async captureLoginPage(): Promise<string> {
    if (!this.page) throw new Error('Página não disponível');

    const filename = `login_page_${Date.now()}.png`;
    const localPath = `output/screenshots/${filename}`;

    await this.page.screenshot({
      path: localPath,
      fullPage: true,
      type: 'png'
    });

    // Upload para MinIO
    const minioUrl = await this.minioService.uploadScreenshot(localPath, filename);
    
    this.log(`Screenshot da página de login capturado: ${filename}`);
    return minioUrl || localPath;
  }

  private async capturePostLoginPage(): Promise<string> {
    if (!this.page) throw new Error('Página não disponível');

    const filename = `post_login_page_${Date.now()}.png`;
    const localPath = `output/screenshots/${filename}`;

    await this.page.screenshot({
      path: localPath,
      fullPage: true,
      type: 'png'
    });

    // Upload para MinIO
    const minioUrl = await this.minioService.uploadScreenshot(localPath, filename);
    
    this.log(`Screenshot pós-login capturado: ${filename}`);
    return minioUrl || localPath;
  }

  private determineAuthType(authMethods: AuthDetectionResult): 'basic' | 'oauth' | 'custom' {
    if (authMethods.standardAuth.available) {
      return 'basic';
    } else if (authMethods.oauthProviders.length > 0) {
      return 'oauth';
    }
    return 'custom';
  }

  private async validateSession(): Promise<boolean> {
    return await this.verifyAuthenticationSuccess();
  }

  private async performLogout(): Promise<void> {
    if (!this.page) return;

    try {
      const logoutButton = await this.page.$(
        'a[href*="logout"], button[class*="logout"], a[class*="signout"], button[class*="sign-out"]'
      );

      if (logoutButton) {
        await logoutButton.click();
        await this.page.waitForTimeout(2000);
        this.log('Logout realizado com sucesso');
      } else {
        this.log('Botão de logout não encontrado', 'warn');
      }
    } catch (error) {
      this.log(`Erro no logout: ${error}`, 'error');
    }
  }

  async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    const timestamp = new Date().toISOString();
    
    let report = `# Relatório do LoginAgent

**Task ID:** ${taskResult.taskId}
**Timestamp:** ${timestamp}
**Status:** ${taskResult.success ? '✅ Sucesso' : '❌ Falha'}
**Tempo de Processamento:** ${taskResult.processingTime}ms

`;

    if (taskResult.success && taskResult.data) {
      report += `## Resultado da Autenticação

- **Autenticado:** ${taskResult.data.authenticated ? 'Sim' : 'Não'}
- **Tipo de Autenticação:** ${taskResult.data.authType}
- **Session ID:** ${taskResult.data.sessionId}
- **Usuário:** ${taskResult.data.userContext?.name || 'N/A'}
- **Email:** ${taskResult.data.userContext?.email || 'N/A'}

## Screenshots Capturados

`;
      
      if (taskResult.data.screenshots) {
        Object.entries(taskResult.data.screenshots).forEach(([key, url]) => {
          if (url) {
            report += `### ${key.replace('_', ' ').toUpperCase()}
![${key}](${url})

`;
          }
        });
      }

      if (taskResult.data.loginSteps) {
        report += `## Passos da Autenticação

`;
        taskResult.data.loginSteps.forEach((step: any, index: number) => {
          report += `${index + 1}. **${step.action}**: ${JSON.stringify(step, null, 2)}
`;
        });
        report += `
`;
      }

      report += `
## Próximas Etapas

✅ Sessão estabelecida com sucesso
🔄 Dados encaminhados para CrawlerAgent
📋 Aguardando início do processo de crawling

`;
    } else {
      report += `## Erro na Autenticação

**Erro:** ${taskResult.error}

`;
      
      if (taskResult.data?.screenshots) {
        report += `## Screenshots de Diagnóstico

`;
        Object.entries(taskResult.data.screenshots).forEach(([key, url]) => {
          if (url) {
            report += `### ${key.replace('_', ' ').toUpperCase()}
![${key}](${url})

`;
          }
        });
      }
      
      report += `## Ações Recomendadas

- Verificar credenciais fornecidas
- Verificar se a URL de login está correta
- Verificar se o site está acessível
- Tentar novamente com credenciais válidas

`;
    }

    // Salvar relatório no MinIO
    await this.minioService.uploadReportMarkdown(report, this.config.name, taskResult.taskId);

    return report;
  }

  setPage(page: Page): void {
    this.page = page;
  }

  getSessionData(): any {
    return this.sessionData;
  }

  async cleanup(): Promise<void> {
    this.page = null;
    this.sessionData = null;
    this.log('LoginAgent finalizado e recursos liberados');
  }
}
