import { BaseAgent, AgentConfig, TaskData, TaskResult } from '../core/AgnoSCore';
import { Page } from 'playwright';
import { MinIOService } from '../services/MinIOService';
import { AuthDetectionResult } from './interfaces/AuthTypes';

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
  }

  async initialize(): Promise<void> {
    await this.minioService.initialize();
    this.log('LoginAgent inicializado e pronto para autenticação');
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
    const { credentials, page } = task.data;
    this.page = page;
    if (!this.page) throw new Error('Página não fornecida para autenticação');
    this.log(`Iniciando autenticação dinâmica para: ${credentials.loginUrl || 'página atual'}`);
    const stepLog: any[] = [];
    try {
      // 1. Navegar para página de login se especificada
      if (credentials.loginUrl) {
        await this.page.goto(credentials.loginUrl, { waitUntil: 'domcontentloaded' });
        await this.page.waitForTimeout(2000);
        stepLog.push({ action: 'goto', url: credentials.loginUrl, screenshot: await this.captureLoginPage() });
      }

      // 2. Busca ativa de campos de login (inclui campos dinâmicos)
      let usernameField = await this.page.$('input[type="email"], input[type="text"], input[name*="user"], input[name*="login"], input[placeholder*="email"], input[placeholder*="usuário"]');
      let passwordField = await this.page.$('input[type="password"]');
      if (!usernameField || !passwordField) {
        // Tenta clicar em botões que podem exibir campos
        const possibleButtons = await this.page.$$('button, a');
        for (const btn of possibleButtons) {
          const text = (await btn.innerText()).toLowerCase();
          if (text.includes('entrar') || text.includes('login') || text.includes('acessar')) {
            await btn.click();
            await this.page.waitForTimeout(1000);
            usernameField = await this.page.$('input[type="email"], input[type="text"], input[name*="user"], input[name*="login"], input[placeholder*="email"], input[placeholder*="usuário"]');
            passwordField = await this.page.$('input[type="password"]');
            if (usernameField && passwordField) break;
          }
        }
      }
      stepLog.push({ action: 'detect_fields', found: !!usernameField && !!passwordField, screenshot: await this.captureLoginPage() });
      if (!usernameField || !passwordField) throw new Error('Campos de login não encontrados');

      // 3. Preencher credenciais
      await usernameField.fill(credentials.username);
      await this.page.waitForTimeout(500);
      await passwordField.fill(credentials.password);
      await this.page.waitForTimeout(500);
      stepLog.push({ action: 'fill_credentials', screenshot: await this.captureLoginPage() });

      // 4. Submeter formulário (tenta botão, depois Enter)
      let submitButton = await this.page.$('button[type="submit"], input[type="submit"], button[class*="login"], button[class*="submit"], button[class*="signin"]');
      if (!submitButton) {
        // Busca botão visível com texto de login
        const buttons = await this.page.$$('button, input[type="button"]');
        for (const btn of buttons) {
          const text = (await btn.innerText?.() || '').toLowerCase();
          if (text.includes('entrar') || text.includes('login') || text.includes('acessar')) {
            submitButton = btn;
            break;
          }
        }
      }
      if (submitButton) {
        await submitButton.click();
        stepLog.push({ action: 'click_submit', screenshot: await this.captureLoginPage() });
      } else {
        await passwordField.press('Enter');
        stepLog.push({ action: 'press_enter', screenshot: await this.captureLoginPage() });
      }
      await this.page.waitForTimeout(4000);

      // 5. Chamar CrawlerAgent para mapear elementos pós-login (opcional, pode ser expandido)
      this.sendTask('CrawlerAgent', 'crawl_login_flow', {
        url: await this.page.url(),
        stepLog
      }, 'normal');

      // 6. Verificar sucesso do login
      const authSuccess = await this.verifyAuthenticationSuccess();
      stepLog.push({ action: 'verify_success', success: authSuccess, screenshot: await this.capturePostLoginPage() });

      if (authSuccess) {
        this.sessionData = await this.captureSessionData();
        // Notificar próximo agente (CrawlerAgent) para crawling autenticado
        this.sendTask('CrawlerAgent', 'start_authenticated_crawl', {
          sessionData: this.sessionData,
          loginSteps: stepLog,
          credentials: { username: credentials.username, loginUrl: credentials.loginUrl }
        }, 'high');
        return {
          id: task.id,
          taskId: task.id,
          success: true,
          data: {
            authenticated: true,
            sessionId: this.sessionData.sessionId,
            userContext: this.sessionData.userContext,
            loginSteps: stepLog
          },
          timestamp: new Date(),
          processingTime: 0
        };
      } else {
        return {
          id: task.id,
          taskId: task.id,
          success: false,
          error: 'Falha na autenticação - verifique as credenciais',
          data: { loginSteps: stepLog },
          timestamp: new Date(),
          processingTime: 0
        };
      }
    } catch (error) {
      this.log(`Erro na autenticação dinâmica: ${error}`, 'error');
      throw error;
    }
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

  private async detectAuthMethods(): Promise<AuthDetectionResult> {
    if (!this.page) throw new Error('Página não disponível');

    const authMethods = await this.page.evaluate(() => {
      // Detectar autenticação padrão
      const standardAuth = {
        available: false,
        fields: {
          required: [] as string[],
          optional: [] as string[]
        }
      };

      const form = document.querySelector('form');
      if (form) {
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
          const name = input.name || input.id || input.placeholder;
          if (name) {
            if (input.hasAttribute('required')) {
              standardAuth.fields.required.push(name);
            } else {
              standardAuth.fields.optional.push(name);
            }
          }
        });
        standardAuth.available = standardAuth.fields.required.length > 0;
      }

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
        taskResult.data.screenshots.forEach((screenshot: string, index: number) => {
          report += `${index + 1}. ![Screenshot ${index + 1}](${screenshot})\n`;
        });
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

## Ações Recomendadas

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

  async cleanup(): Promise<void> {
    this.page = null;
    this.sessionData = null;
    this.log('LoginAgent finalizado e recursos liberados');
  }
}
