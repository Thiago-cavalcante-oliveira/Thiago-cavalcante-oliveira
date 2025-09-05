import { BaseAgent } from '../core/AgnoSCore.js';
import { AgentConfig, TaskData, TaskResult } from '../../types/types.js';
import { Page } from 'playwright';
import { MinIOService } from '../services/MinIOService.js';
import { LoginAgent } from './LoginAgent.js';
import { promises as fs } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface LoginCredentials {
  username?: string;
  password?: string;
}

interface LoginPageData {
  html: string;
  metadata: any;
}

export class SmartLoginAgent extends BaseAgent {
  private minio?: MinIOService;

  constructor(config: AgentConfig) {
    super(config);
  }

  override async initialize(): Promise<void> {
    this.log.info('SmartLoginAgent inicializado');
  }

  override async processTask(task: TaskData): Promise<TaskResult> {
    const startTime = Date.now();
    const {
      page,
      baseUrl,
      credentials,
      outputDir = 'output/login',
      minioService,
      fallbackAgent
    } = (task.data || {}) as {
      page?: Page;
      baseUrl?: string;
      credentials?: LoginCredentials;
      outputDir?: string;
      minioService?: MinIOService;
      fallbackAgent?: LoginAgent;
    };

    if (!page) throw new Error('Page não fornecida em task.data');
    if (!baseUrl) throw new Error('baseUrl não fornecida em task.data');
    
    if (minioService) this.minio = minioService;

    try {
      await fs.mkdir(outputDir, { recursive: true });

      if (task.type === 'smart_login') {
        if (!credentials?.username || !credentials?.password) {
            throw new Error('Credenciais ausentes em task.data para a tarefa smart_login');
        }
        return await this.handleSmartLogin(task, page, outputDir, credentials, minioService, fallbackAgent);
      }

      return {
        id: uuidv4(),
        taskId: task.id,
        success: false,
        error: `Tipo de tarefa desconhecido: ${task.type}`,
        data: {},
        timestamp: new Date(),
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        id: uuidv4(),
        taskId: task.id,
        success: false,
        error: error.message,
        data: {},
        timestamp: new Date(),
        processingTime: Date.now() - startTime,
      };
    }
  }

  private async handleSmartLogin(
    task: TaskData,
    page: Page,
    outputDir: string,
    credentials: LoginCredentials,
    minioService?: MinIOService,
    fallbackAgent?: LoginAgent
  ): Promise<TaskResult> {
    const startTime = Date.now();
    const { baseUrl } = task.data;

    try {
      const loggedIn = await this.smartLogin(page, minioService, outputDir, { baseUrl, credentials });

      if (loggedIn) {
        return {
          id: uuidv4(),
          taskId: task.id,
          success: true,
          data: { message: 'Login bem-sucedido' },
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
        };
      }

      if (fallbackAgent) {
        this.log.info('SmartLogin falhou, tentando fallback com LoginAgent...');
        const fallbackResult = await fallbackAgent.processTask(task);
        return {
          ...fallbackResult,
          taskId: task.id,
        };
      }

      await this.requestUserInteraction(page, outputDir, minioService);
      const successAfterInteraction = await this.verifyLoginSuccess(page);

      return {
        id: uuidv4(),
        taskId: task.id,
        success: successAfterInteraction,
        data: {
          message: successAfterInteraction ? 'Login realizado com sucesso após interação do usuário.' : 'Falha no login mesmo após interação do usuário.',
          userInteractionRequired: true
        },
        timestamp: new Date(),
        processingTime: Date.now() - startTime,
      };

    } catch (error: any) {
      this.log.error(`Erro no login: ${error.message}`);
      await this.saveLoginReport(outputDir, minioService);
      throw error;
    }
  }

  private async smartLogin(
    page: Page,
    minioService: MinIOService | undefined,
    outputDir: string,
    { baseUrl, credentials }: { baseUrl: string; credentials: LoginCredentials; }
  ): Promise<boolean> {
    this.log.info('Iniciando processo de SmartLogin...');
    await this.captureStep(page, 'smartlogin-start', outputDir, minioService);

    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await this.waitForDomSteady(page);
    await this.captureStep(page, 'initial-page', outputDir, minioService);

    let formFound = await this.detectLoginForm(page);

    if (!formFound) {
      this.log.info('Campos de login não visíveis, procurando gatilhos...');
      const triggerClicked = await this.findAndClickLoginTrigger(page, outputDir, minioService, 0, 5);

      if (triggerClicked) {
        await page.waitForLoadState('networkidle');
        formFound = await this.detectLoginForm(page);
      }
    }

    if (!formFound) {
      this.log.error('Não foi possível localizar tela de login');
      return false;
    }

    await this.captureStep(page, 'login-page-found', outputDir, minioService);
    await this.scrapLoginPage(page, outputDir);

    if (credentials.username && credentials.password) {
        await this.fillLoginForm(page, credentials as { username: string; password: string });
    }

    await this.submitLogin(page);

    const success = await this.verifyLoginSuccess(page);

    if (success) {
      await this.captureStep(page, 'login-success', outputDir, minioService);
    } else {
      await this.captureStep(page, 'login-failed', outputDir, minioService);
    }

    return success;
  }

  private async detectLoginForm(page: Page): Promise<boolean> {
    try {
      const passwordField = await page.locator('input[type="password"]').first();
      if (!await passwordField.isVisible()) {
        return false;
      }
      const userField = await page.locator('input[type="text"], input[type="email"], input[name*="user"], input[name*="login"], input[name*="email"]').first();
      return await userField.isVisible();
    } catch (error) {
      this.log.error(`Erro ao detectar formulário: ${error}`);
      return false;
    }
  }

  private async findAndClickLoginTrigger(page: Page, outputDir: string, minioService: MinIOService | undefined, currentAttempt: number, maxNavigationAttempts: number): Promise<boolean> {
    const loginTriggers = [
      'login', 'entrar', 'acessar', 'sign in', 'log in', 'autenticar',
      'fazer login', 'conectar', 'iniciar sessão', 'access', 'signin'
    ];
    const oauthTerms = [
      'google', 'facebook', 'twitter', 'linkedin', 'microsoft', 'apple',
      'github', 'oauth', 'sso', 'single sign', 'social login'
    ];
    const recoveryTerms = [
      'esqueci', 'forgot', 'recover', 'reset', 'recuperar', 'redefinir',
      'cadastro', 'register', 'sign up', 'criar conta', 'nova conta'
    ];

    try {
      await this.identifySpecialForms(page, recoveryTerms, outputDir);

      for (const trigger of loginTriggers) {
        const elements = await page.locator('button, a, [role="button"], input[type="submit"]');
        const count = await elements.count();
        for (let i = 0; i < count; i++) {
            const element = elements.nth(i);
            const text = (await element.textContent() || '').toLowerCase().trim();
            const classAttribute = await element.getAttribute('class') || '';
            const isOAuth = oauthTerms.some(term => text.includes(term) || classAttribute.toLowerCase().includes(term));
            
            if (text.includes(trigger) && !isOAuth && await element.isVisible()) {
                this.log.info(`Encontrado gatilho de login: "${trigger}" (ignorando OAuth)`);
                await this.captureStep(page, `before-click-${trigger}`, outputDir, minioService);
                await element.click();
                await page.waitForLoadState('networkidle');
                await this.captureStep(page, `after-click-${trigger}`, outputDir, minioService);

                const newUrl = await page.url();
                this.log.info(`Navegou para: ${newUrl}`);

                const formFound = await this.detectLoginForm(page);
                if (formFound) {
                    await this.captureStep(page, 'login-form-found-after-navigation', outputDir, minioService);
                    return true;
                }

                if (currentAttempt < maxNavigationAttempts) {
                    return await this.findAndClickLoginTrigger(page, outputDir, minioService, currentAttempt + 1, maxNavigationAttempts);
                }
            }
        }
      }
      return false;
    } catch (error) {
      this.log.error(`Erro ao procurar gatilhos: ${error}`);
      return false;
    }
  }

  private async fillLoginForm(page: Page, credentials: { username: string; password: string }): Promise<void> {
    try {
      const userField = page.locator('input[type="text"], input[type="email"], input[name*="user"], input[name*="login"], input[name*="email"]').first();
      const passwordField = page.locator('input[type="password"]').first();

      if (!await userField.isVisible() || !await passwordField.isVisible()) {
        throw new Error('Campos de login não encontrados');
      }

      this.log.info('Preenchendo credenciais...');
      await userField.fill('');
      await userField.type(credentials.username, { delay: 100 });
      await passwordField.fill('');
      await passwordField.type(credentials.password, { delay: 100 });
    } catch (error) {
      this.log.error(`Erro ao preencher formulário: ${error}`);
      throw error;
    }
  }

  private async submitLogin(page: Page): Promise<void> {
    try {
      const submitButton = page.locator('button[type="submit"], input[type="submit"], button[class*="login"], button[class*="submit"], button[class*="signin"]').first();

      if (await submitButton.isVisible()) {
        this.log.info('Clicando no botão de submit...');
        await submitButton.click();
      } else {
        this.log.info('Botão não encontrado, usando Enter...');
        const passwordField = page.locator('input[type="password"]').first();
        if (await passwordField.isVisible()) {
          await passwordField.press('Enter');
        } else {
          await page.evaluate(() => {
            const form = document.querySelector('form');
            if (form) form.submit();
          });
        }
      }
      await page.waitForLoadState('networkidle');
    } catch (error) {
      this.log.error(`Erro ao submeter login: ${error}`);
      throw error;
    }
  }

  private async verifyLoginSuccess(page: Page): Promise<boolean> {
    try {
      await page.waitForLoadState('networkidle');
      const result = await page.evaluate(() => {
        const passwordFields = document.querySelectorAll('input[type="password"]');
        const successIndicators = document.querySelectorAll('[class*="dashboard"], [class*="profile"], [class*="logout"], [class*="welcome"], [class*="menu"], nav, header, [class*="user"]');
        const errorIndicators = document.querySelectorAll('[class*="error"], [class*="invalid"], [class*="wrong"], .alert-danger, .error-message');
        return {
          noPasswordFields: passwordFields.length === 0,
          hasSuccessIndicators: successIndicators.length > 0,
          hasErrorIndicators: errorIndicators.length > 0,
          url: window.location.href,
          title: document.title
        };
      });
      this.log.info(`Verificação de login: ${JSON.stringify(result)}`);
      return result.noPasswordFields || (result.hasSuccessIndicators && !result.hasErrorIndicators);
    } catch (error) {
      this.log.error(`Erro na verificação: ${error}`);
      return false;
    }
  }

  private async captureStep(page: Page, stepName: string, outputDir: string, minioService?: MinIOService): Promise<void> {
     const screenshotPath = path.join(outputDir, `${stepName}-${Date.now()}.png`);
     await page.screenshot({ path: screenshotPath, fullPage: true });
     this.log.info(`Screenshot capturado: ${screenshotPath}`);
     if (minioService) {
       try {
        await minioService.uploadFile(screenshotPath, `screenshots/${path.basename(screenshotPath)}`);
       } catch (error) {
        this.log.warn(`Falha ao fazer upload do screenshot para o MinIO: ${error}`);
       }
     }
  }

  private async scrapLoginPage(page: Page, outputDir: string): Promise<void> {
    try {
      this.log.info('Fazendo scraping da página de login...');
      const html = await page.content();
      const metadata = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input')).map(input => ({ name: input.name || '', id: input.id || '', type: input.type || '', placeholder: input.placeholder || '', required: input.required }));
        const buttons = Array.from(document.querySelectorAll('button')).map(btn => ({ text: btn.textContent?.trim() || '', id: btn.id || '', type: btn.type || '', className: btn.className || '' }));
        const forms = Array.from(document.querySelectorAll('form')).map(form => ({ action: form.action || '', method: form.method || '', id: form.id || '' }));
        const links = Array.from(document.querySelectorAll('a')).map(link => ({ text: link.textContent?.trim() || '', href: link.href || '', className: link.className || '' }));
        return { inputs, buttons, forms, links, title: document.title, url: window.location.href };
      });
      const loginPageData: LoginPageData = { html, metadata };
      await fs.writeFile(path.join(outputDir, 'login-page.html'), html, 'utf-8');
      await fs.writeFile(path.join(outputDir, 'login-page.json'), JSON.stringify(loginPageData.metadata, null, 2), 'utf-8');
      this.log.info('Scraping da página de login concluído');
    } catch (error) {
      this.log.error(`Erro no scraping: ${error}`);
    }
  }

  private async saveLoginReport(outputDir: string, minioService?: MinIOService): Promise<void> {
    const reportPath = path.join(outputDir, 'login_report.md');
    let reportContent = `# Relatório de Login - ${new Date().toLocaleString()}\n\n`;
    await fs.writeFile(reportPath, reportContent);
    this.log.info(`Relatório de login salvo em: ${reportPath}`);
  }

  private async identifySpecialForms(page: Page, recoveryTerms: string[], outputDir: string): Promise<void> {
    try {
      const specialForms = await page.evaluate((terms) => {
        return Array.from(document.querySelectorAll('form, button, a, [role="button"]'))
            .map(el => ({
                text: el.textContent?.toLowerCase().trim() || '',
                type: el.tagName.toLowerCase(),
                action: (el as HTMLFormElement).action || '',
                href: (el as HTMLAnchorElement).href || '',
                className: el.className || '',
                isSpecial: terms.some(term => (el.textContent?.toLowerCase() || '').includes(term) || (el.className || '').toLowerCase().includes(term))
            }))
            .filter(item => item.isSpecial);
      }, recoveryTerms);

      if (specialForms.length > 0) {
        this.log.info(`Identificados ${specialForms.length} formulários especiais (recuperação/registro)`);
        const specialFormsData = {
          timestamp: new Date().toISOString(),
          url: await page.url(),
          forms: specialForms,
          description: 'Formulários de recuperação de senha e registro identificados para processamento futuro'
        };
        await fs.writeFile(path.join(outputDir, 'special-forms.json'), JSON.stringify(specialFormsData, null, 2), 'utf-8');
        await this.captureStep(page, 'special-forms-identified', outputDir, this.minio);
      }
    } catch (error) {
      this.log.error(`Erro ao identificar formulários especiais: ${error}`);
    }
  }

  private async requestUserInteraction(page: Page, outputDir: string, minioService?: MinIOService): Promise<void> {
    this.log.warn('=== INTERAÇÃO DO USUÁRIO NECESSÁRIA ===');
    this.log.warn('Os agentes automáticos não conseguiram completar o login.');
    this.log.warn('Por favor, complete o login manualmente no navegador.');
    this.log.warn('O sistema aguardará 30 segundos para interação manual...');
    await this.captureStep(page, 'user-interaction-required', outputDir, minioService);
    try {
      await page.waitForNavigation({ timeout: 30000 });
    } catch (e) {
      this.log.warn('Nenhuma navegação detectada, aguardando inatividade da rede.');
      await page.waitForLoadState('networkidle');
    }
    await this.captureStep(page, 'after-user-interaction', outputDir, minioService);
    const success = await this.verifyLoginSuccess(page);
    if (success) {
      this.log.info('Login completado com sucesso após interação do usuário!');
    } else {
      this.log.warn('Login ainda não foi completado. Verifique manualmente.');
    }
  }

  override async cleanup(): Promise<void> {
    this.log.info('SmartLoginAgent finalizado.');
  }

  override async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    const { success, error, processingTime, timestamp } = taskResult;
    let report = `# Relatório de Login Inteligente\n\n`;
    report += `**Status:** ${success ? '✅ Sucesso' : '❌ Falha'}\n`;
    report += `**Timestamp:** ${timestamp.toISOString()}\n`;
    report += `**Tempo de Processamento:** ${processingTime}ms\n\n`;

    if (taskResult.data?.skipped) {
      report += `## Login Pulado\n\n`;
      report += `Motivo: ${taskResult.data.reason}\n\n`;
      return report;
    }

    if (error) {
      report += `## Erro\n\n`;
      report += `${error}\n\n`;
    }

    if (taskResult.data?.outputDir) {
      report += `## Arquivos Gerados\n\n`;
      report += `Diretório de saída: \`${taskResult.data.outputDir}\`\n\n`;
    }

    if (taskResult.data?.finalUrl) {
      report += `## Resultado Final\n\n`;
      report += `URL final após login: ${taskResult.data.finalUrl}\n\n`;
    }

    return report;
  }

  protected  async waitForDomSteady(page: Page, maxRetries = 3, delay = 500) {
    for (let i = 0; i < maxRetries; i++) {
        const initialHtml = await page.content();
        await new Promise(resolve => setTimeout(resolve, delay));
        const finalHtml = await page.content();
        if (initialHtml === finalHtml) {
            this.log.info('DOM está estável.');
            return;
        }
    }
    this.log.warn('DOM não estabilizou após várias tentativas.');
  }
}
