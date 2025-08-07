import { BaseAgent, AgentConfig, TaskData, TaskResult } from '../core/AgnoSCore.js';
import { Page } from 'playwright';
import { MinIOService } from '../services/MinIOService.js';

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

    if (!this.page) {
      throw new Error('Página não fornecida para autenticação');
    }

    this.log(`Iniciando autenticação para: ${credentials.loginUrl || 'página atual'}`);

    try {
      // Navegar para página de login se especificada
      if (credentials.loginUrl) {
        await this.page.goto(credentials.loginUrl, { waitUntil: 'domcontentloaded' });
        await this.page.waitForTimeout(2000);
      }

      // Capturar screenshot da página de login
      const loginScreenshot = await this.captureLoginPage();

      // Detectar tipo de autenticação
      const authType = await this.detectAuthenticationType();
      this.log(`Tipo de autenticação detectado: ${authType}`);

      // Realizar autenticação
      let authResult = false;
      
      switch (authType) {
        case 'basic':
          authResult = await this.performBasicAuth(credentials);
          break;
        case 'oauth':
          authResult = await this.performOAuthAuth(credentials);
          break;
        case 'custom':
          authResult = await this.performCustomAuth(credentials);
          break;
        default:
          throw new Error(`Tipo de autenticação não suportado: ${authType}`);
      }

      if (authResult) {
        // Capturar dados da sessão
        this.sessionData = await this.captureSessionData();
        
        // Capturar screenshot pós-login
        const postLoginScreenshot = await this.capturePostLoginPage();

        // Notificar próximo agente (CrawlerAgent)
        this.sendTask('CrawlerAgent', 'start_authenticated_crawl', {
          sessionData: this.sessionData,
          loginScreenshot,
          postLoginScreenshot,
          authType,
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
            sessionId: this.sessionData.sessionId,
            userContext: this.sessionData.userContext,
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

  private async detectAuthenticationType(): Promise<'basic' | 'oauth' | 'custom'> {
    if (!this.page) throw new Error('Página não disponível');

    const authIndicators = await this.page.evaluate(() => {
      return {
        hasBasicForm: !!(
          document.querySelector('input[type="password"]') && 
          document.querySelector('input[type="email"], input[type="text"], input[name*="user"], input[name*="login"]')
        ),
        hasOAuth: !!document.querySelector(
          '[class*="oauth"], [href*="oauth"], [class*="google"], [class*="facebook"], [class*="microsoft"]'
        ),
        hasCustomForm: !!document.querySelector('form')
      };
    });

    if (authIndicators.hasBasicForm) return 'basic';
    if (authIndicators.hasOAuth) return 'oauth';
    return 'custom';
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
