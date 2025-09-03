import { BaseAgent, AgentConfig, TaskData, TaskResult } from '../core/AgnoSCore.js';
import { v4 as uuidv4 } from 'uuid';
import { Page } from 'playwright';
import { MinIOService } from '../services/MinIOService.js';
import { AuthDetectionResult } from './interfaces/AuthTypes';
import { mkdir } from 'node:fs/promises';

export interface LoginCredentials {
  username: string;
  password: string;
  loginUrl?: string;
  customSteps?: LoginStep[];
}

export interface LoginStep {
  type: 'fill' | 'click' | 'waitForSelector' | 'waitForLoadState' | 'waitForURL' | 'waitForNavigation';
  selector?: string;              // não é necessário para alguns waits
  value?: string;
  timeout?: number;
  urlPattern?: string;            // para waitForURL
  state?: 'load' | 'domcontentloaded' | 'networkidle'; // para waitForLoadState
}

export class LoginAgent extends BaseAgent {
  private minio?: MinIOService;

  constructor(config: AgentConfig) {
    super(config);
  }



  async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    return `## Relatório do LoginAgent\n\n- Status: ${taskResult.success ? 'Sucesso' : 'Falha'}`;
  }

  async initialize(): Promise<void> {
    this.log('LoginAgent inicializado e pronto para autenticação');
  }

  async processTask(task: TaskData): Promise<TaskResult> {
    const startTime = Date.now();

    // opcional: permite injetar MinIO via task.data sem quebrar a assinatura da BaseAgent
    const maybe = (task.data as any)?.minioService;
    if (maybe) this.minio = maybe;

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
    const { credentials, page } = task.data as { credentials: LoginCredentials; page: Page };

    if (!page) {
      throw new Error('Página não fornecida para autenticação');
    }

    this.log(`Iniciando autenticação para: ${credentials.loginUrl || 'página atual'}`);

    try {
      // Navegar para página de login se especificada
      if (credentials.loginUrl) {
        await page.goto(credentials.loginUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('domcontentloaded');
      }

      // Capturar screenshot da página de login
      const loginScreenshot = await this.captureLoginPage(page);

      // Detectar métodos de autenticação disponíveis
      const authMethods = await this.detectAuthMethods(page);
      this.log(`Métodos de autenticação detectados: ${JSON.stringify(authMethods)}`);

      // Determinar o tipo de autenticação a ser usado
      const authType = this.determineAuthType(authMethods);

      // Realizar autenticação
      let authResult = false;
      
      switch (authType) {
        case 'basic':
          authResult = await this.performBasicAuth(credentials, page);
          break;
        case 'oauth':
          authResult = await this.performOAuthAuth(credentials);
          break;
        case 'custom':
          authResult = await this.performCustomAuth(credentials, page);
          break;
        default:
          throw new Error(`Tipo de autenticação não suportado: ${authType}`);
      }

      if (authResult) {
        // Capturar dados da sessão
        const sessionData = await this.captureSessionData(page);

        // Capturar screenshot pós-login
        const postLoginScreenshot = await this.capturePostLoginPage(page);

        // Notificar próximo agente (CrawlerAgent)
        this.sendTask('CrawlerAgent', 'start_authenticated_crawl', {
          sessionData,
          loginScreenshot,
          postLoginScreenshot,
          authType,
          authMethods: {
            standard: {
              available: authMethods.standardAuth.available,
              requiredFields: authMethods.standardAuth.fields.required,
              optionalFields: authMethods.standardAuth.fields.optional
            },
            oauth: {
              providers: authMethods.oauthProviders.map(p => p.name),
              location: authMethods.oauthProviders.map(p => p.location).join(', ')
            },
            additional: authMethods.additionalFeatures
          },
          credentials: {
            username: credentials.username,
            loginUrl: credentials.loginUrl
          }
        }, 'high');

        return {
          id: task.id,
          taskId: task.id,
          success: true,
          data: {
            authenticated: true,
            authType,
            sessionId: sessionData.sessionId,
            userContext: sessionData.userContext,
            screenshots: [loginScreenshot, postLoginScreenshot]
          },
          timestamp: new Date(),
          processingTime: 0 // será calculado pelo BaseAgent
        };

      } else {
        return {
          id: task.id,
          taskId: task.id,
          success: false,
          error: 'Falha na autenticação - verifique as credenciais',
          timestamp: new Date(),
          processingTime: 0
        };
      }

    } catch (error) {
      this.log(`Erro na autenticação: ${error}`, 'error');
      throw error;
    }
  }

  private async handleSessionCheck(task: TaskData): Promise<TaskResult> {
    const { page } = task.data;

    try {
      const isValid = await this.validateSession(page);
      
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
    const { page } = task.data as { page: Page };
    this.log(`[MONITOR] Recebendo page em handleLogout: ${!!page}`);

    try {
      await this.performLogout(page);
      
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

  private async detectAuthMethods(page: Page): Promise<AuthDetectionResult> {
    this.log('Detectando métodos de autenticação na página...');

    const authMethods = await page.evaluate(() => {
      // Detectar autenticação padrão
      const standardAuth = {
        available: false,
        fields: {
          required: [] as string[],
          optional: [] as string[]
        }
      };

      // Procurar por campos de login em toda a página, não apenas em formulários
      const allInputs = document.querySelectorAll('input');
      const loginInputs: HTMLInputElement[] = [];
      const passwordInputs: HTMLInputElement[] = [];
      
      allInputs.forEach(input => {
        const inputElement = input as HTMLInputElement;
        const type = inputElement.type?.toLowerCase();
        const name = inputElement.name?.toLowerCase() || '';
        const id = inputElement.id?.toLowerCase() || '';
        const placeholder = inputElement.placeholder?.toLowerCase() || '';
        const className = inputElement.className?.toLowerCase() || '';
        
        // Detectar campos de senha
        if (type === 'password') {
          passwordInputs.push(inputElement);
        }
        // Detectar campos de usuário/email
        else if (
          type === 'email' ||
          type === 'text' ||
          name.includes('user') ||
          name.includes('login') ||
          name.includes('email') ||
          id.includes('user') ||
          id.includes('login') ||
          id.includes('email') ||
          placeholder.includes('user') ||
          placeholder.includes('login') ||
          placeholder.includes('email') ||
          placeholder.includes('usuário') ||
          className.includes('user') ||
          className.includes('login') ||
          className.includes('email')
        ) {
          loginInputs.push(inputElement);
        }
      });
      
      // Considerar disponível se encontrou pelo menos um campo de cada tipo
      if (loginInputs.length > 0 && passwordInputs.length > 0) {
        standardAuth.available = true;
        
        loginInputs.forEach(input => {
          const identifier = input.name || input.id || input.placeholder || 'username';
          if (input.hasAttribute('required')) {
            standardAuth.fields.required.push(identifier);
          } else {
            standardAuth.fields.optional.push(identifier);
          }
        });
        
        passwordInputs.forEach(input => {
          const identifier = input.name || input.id || input.placeholder || 'password';
          if (input.hasAttribute('required')) {
            standardAuth.fields.required.push(identifier);
          } else {
            standardAuth.fields.optional.push(identifier);
          }
        });
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

  /**
   * Performs basic authentication.
   * @param credentials Login credentials.
   * @param page The Playwright Page object.
   */
  private async performBasicAuth(credentials: LoginCredentials, page: Page): Promise<boolean> {

    try {
      this.log('Executando autenticação básica');

      const usernameField = page.getByRole('textbox', { name: /usuário|username|e-mail|email/i })
        .or(page.getByPlaceholder(/usuário|username|e-mail|email/i))
        .or(page.locator('input[name*="user"], input[name*="login"], input[name*="email"], input[id*="user"], input[id*="login"], input[id*="email"]'));
      
      const passwordField = page.getByRole('textbox', { name: /senha|password/i, exact: true })
        .or(page.getByPlaceholder(/senha|password/i))
        .or(page.locator('input[type="password"], input[name*="senha"], input[name*="password"], input[id*="senha"], input[id*="password"]'));

      await usernameField.waitFor({ state: 'visible', timeout: 7000 });
      await passwordField.waitFor({ state: 'visible', timeout: 7000 });

      if (!usernameField || !passwordField) {
        // Log adicional para debug
        const allInputs = await page.$$eval('input', inputs => 
          inputs.map(input => ({
            type: input.type,
            name: input.name,
            id: input.id,
            placeholder: input.placeholder,
            className: input.className
          }))
        );
        this.log(`Inputs encontrados na página: ${JSON.stringify(allInputs)}`, 'error');
        throw new Error('Campos de login não encontrados');
      }
      
      this.log('Campos de login localizados com sucesso');

      // Preencher credenciais
      await usernameField.fill(credentials.username);

      
      await passwordField.fill(credentials.password);


      // Submeter formulário
      const submitButton = page.getByRole('button', { name: /entrar|login|submit|sign in/i })
        .or(page.locator('button[type="submit"], input[type="submit"], button[class*="login"], button[class*="submit"], button[class*="signin"]'));

      if (submitButton) {
        await submitButton.click();
      } else {
        // Fallback: pressionar Enter
        await passwordField.press('Enter');
      }

      // Aguardar resposta
      await this.waitForDomSteady(page);

      // Verificar sucesso
      return await this.verifyAuthenticationSuccess(page);

    } catch (error) {
      this.log(`Erro na autenticação básica: ${error}`, 'error');
      return false;
    }
  }

  private async performOAuthAuth(credentials: LoginCredentials): Promise<boolean> {
    this.log('OAuth ainda não implementado', 'warn');
    return false;
  }

  /**
   * Performs custom authentication steps.
   * @param credentials Login credentials including custom steps.
   * @param page The Playwright Page object.
   */
  private async performCustomAuth(credentials: LoginCredentials, page: Page): Promise<boolean> {
    if (!credentials.customSteps) {
      this.log('Steps customizados não fornecidos', 'error');
      return false;
    }

    try {
      this.log('Executando autenticação customizada');

      for (const step of credentials.customSteps) {
        await this.executeCustomStep(step, page);
      }

      return await this.verifyAuthenticationSuccess(page);

    } catch (error) {
      this.log(`Erro na autenticação customizada: ${error}`, 'error');
      return false;
    }
  }

  private async executeCustomStep(step: LoginStep, page: Page): Promise<void> {

    switch (step.type) {
      case 'fill':
        if (step.selector) {
          await page.fill(step.selector, step.value || '');
        }
        break;
      
      case 'click':
        if (step.selector) {
          await page.click(step.selector);
        }
        break;
        
      case 'waitForLoadState':
        await page.waitForLoadState(step.state, { timeout: step.timeout || 30000 });
        break;

      case 'waitForURL':
        if (step.urlPattern) {
          await page.waitForURL(step.urlPattern, { timeout: step.timeout || 30000 });
        }
        break;

      case 'waitForNavigation':
        await page.waitForNavigation({ timeout: step.timeout || 30000 });
        break;
        
      case 'waitForSelector':
        if (step.selector) {
          await page.waitForSelector(step.selector, { timeout: step.timeout || 10000 });
        }
        break;
    }
  }

  private async verifyAuthenticationSuccess(page: Page): Promise<boolean> {

    try {
      const authResult = await page.evaluate(() => {
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

  private async captureSessionData(page: Page): Promise<any> {

    const sessionData = await page.evaluate(() => {
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

  private async captureLoginPage(page: Page): Promise<string> {

    const filename = `login_page_${Date.now()}.png`;
    const localPath = `output/screenshots/${filename}`;
    await mkdir('output/screenshots', { recursive: true });

    await page.screenshot({ path: localPath, fullPage: true, type: 'png' });

    // Upload para MinIO
    const minioUrl = this.minio ? await this.minio.uploadScreenshot(localPath, filename) : undefined;

    this.log(`Screenshot da página de login capturado: ${filename}`);
    return minioUrl || localPath;
  }

  private async capturePostLoginPage(page: Page): Promise<string> {

    const filename = `post_login_page_${Date.now()}.png`;
    const localPath = `output/screenshots/${filename}`;
    await mkdir('output/screenshots', { recursive: true });

    await page.screenshot({ path: localPath, fullPage: true, type: 'png' });

    // Upload para MinIO
    const minioUrl = this.minio ? await this.minio.uploadScreenshot(localPath, filename) : undefined;

    this.log(`Screenshot pós-login capturado: ${filename}`);
    return minioUrl || localPath;
  }

  private determineAuthType(authMethods: AuthDetectionResult): 'basic' | 'oauth' | 'custom' | 'fallback' {
    if (authMethods.standardAuth.available) {
      return 'basic';
    } else if (authMethods.oauthProviders.length > 0) {
      // Ignorar métodos de login alternativos (Google, Facebook, etc.)
      this.log('Métodos OAuth detectados mas serão ignorados conforme configuração');
    }
    // Para SPAs que carregam campos dinamicamente, sempre tentar basic primeiro
    // O performBasicAuth agora aguarda os campos aparecerem
    return 'basic';
  }

  private async validateSession(page: Page): Promise<boolean> {
    return await this.verifyAuthenticationSuccess(page);
  }

  private async performLogout(page: Page): Promise<void> {

    try {
      const logoutButton = await page.$(
        'a[href*="logout"], button[class*="logout"], a[class*="signout"], button[class*="sign-out"]'
      );

      if (logoutButton) {
        await logoutButton.click();
        await page.waitForTimeout(2000);
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

    // Salvar relatório no MinIO (se disponível)
    if (this.minio) {
      await this.minio.uploadReportMarkdown(report, this.config.name, taskResult.taskId);
    } else {
      this.log('MinIOService não configurado em generateMarkdownReport', 'warn');
    }

    return report;
  }



  async cleanup(): Promise<void> {
    this.log('LoginAgent finalizado e recursos liberados');
  }
}
