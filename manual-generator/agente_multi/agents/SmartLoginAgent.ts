import { BaseAgent, AgentConfig, TaskData, TaskResult } from '../core/AgnoSCore.js';
import { Page } from 'playwright';
import { MinIOService } from '../services/MinIOService.js';
import { LoginAgent } from './LoginAgent.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface LoginCredentials {
  username: string;
  password: string;
  loginUrl?: string;
}

export interface LoginStep {
  stepName: string;
  url: string;
  screenshot: string;
  timestamp: number;
  action?: string;
  success: boolean;
}

export interface LoginPageData {
  html: string;
  metadata: {
    inputs: Array<{
      name: string;
      id: string;
      type: string;
      placeholder: string;
      required: boolean;
    }>;
    buttons: Array<{
      text: string;
      id: string;
      type: string;
      className: string;
    }>;
    forms: Array<{
      action: string;
      method: string;
      id: string;
    }>;
    links: Array<{
      text: string;
      href: string;
      className: string;
    }>;
    title: string;
    url: string;
  };
}

export class SmartLoginAgent extends BaseAgent {
  private page: Page | null = null;
  private minioService: MinIOService;
  private outputDir: string;
  private steps: LoginStep[] = [];
  private maxNavigationAttempts = 5;
  private currentAttempt = 0;
  private fallbackAgent: LoginAgent | null = null;
  private userInteractionRequired = false;

  constructor() {
    const config: AgentConfig = {
      name: 'SmartLoginAgent',
      version: '2.0.0',
      description: 'Agente inteligente de login com navegação adaptativa e captura completa',
      capabilities: [
        { name: 'adaptive_navigation', description: 'Navegação adaptativa para encontrar telas de login', version: '2.0.0' },
        { name: 'smart_detection', description: 'Detecção inteligente de campos e botões de login', version: '2.0.0' },
        { name: 'complete_capture', description: 'Captura completa de screenshots e dados da página', version: '2.0.0' },
        { name: 'oauth_handling', description: 'Tratamento de fluxos OAuth e SSO', version: '2.0.0' }
      ]
    };
    
    super(config);
    this.minioService = new MinIOService();
    this.outputDir = path.join(process.cwd(), 'logs', `login-session-${Date.now()}`);
  }

  async initialize(): Promise<void> {
    await this.minioService.initialize();
    await fs.mkdir(this.outputDir, { recursive: true });
    this.fallbackAgent = new LoginAgent();
    await this.fallbackAgent.initialize();
    this.log('SmartLoginAgent inicializado com fallback');
  }

  async processTask(task: TaskData): Promise<TaskResult> {
    try {
      if (task.type === 'smart_login') {
        return await this.handleSmartLogin(task);
      }
      
      throw new Error(`Tipo de tarefa não suportado: ${task.type}`);
    } catch (error) {
      this.log(`Erro no processamento: ${error}`, 'error');
      return {
        id: task.id + '_result',
        taskId: task.id,
        success: false,
        data: {
          steps: this.steps,
          outputDir: this.outputDir
        },
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date(),
        processingTime: 0
      };
    }
  }

  private async handleSmartLogin(task: TaskData): Promise<TaskResult> {
    const { baseUrl, credentials } = task.data;
    
    if (!credentials?.username || !credentials?.password) {
      this.log('Sem credenciais - pulando SmartLoginAgent');
      return {
        id: task.id + '_result',
        taskId: task.id,
        success: true,
        data: { skipped: true, reason: 'No credentials provided', outputDir: this.outputDir },
        timestamp: new Date(),
        processingTime: 0
      };
    }

    if (!this.page) {
      throw new Error('Página não disponível');
    }

    this.log('Iniciando login inteligente...');
    
    try {
      // Primeira tentativa: SmartLoginAgent
      const loginSuccess = await this.smartLogin(this.page, {
        baseUrl,
        credentials,
        outputDir: this.outputDir
      });

      if (loginSuccess) {
        await this.saveLoginReport();
        return {
          id: task.id + '_result',
          taskId: task.id,
          success: true,
          data: {
            loginCompleted: true,
            steps: this.steps,
            outputDir: this.outputDir,
            totalSteps: this.steps.length,
            finalUrl: await this.page.url(),
            method: 'smart_login'
          },
          timestamp: new Date(),
          processingTime: 0
        };
      }

      // Segunda tentativa: LoginAgent (fallback)
      this.log('SmartLoginAgent falhou, tentando LoginAgent...');
      if (this.fallbackAgent && this.page) {
        this.fallbackAgent.setPage(this.page);
        const fallbackResult = await this.fallbackAgent.processTask({
          ...task,
          sender: 'SmartLoginAgent-fallback'
        });
        
        if (fallbackResult.success) {
          this.log('LoginAgent (fallback) teve sucesso');
          await this.saveLoginReport();
          return {
            ...fallbackResult,
            data: {
              ...fallbackResult.data,
              method: 'fallback_login',
              smartLoginSteps: this.steps
            }
          };
        }
      }

      // Terceira tentativa: Solicitar interação do usuário
      this.log('Ambos os agentes falharam, solicitando interação do usuário...');
      await this.requestUserInteraction();
      
      await this.saveLoginReport();
      return {
        id: task.id + '_result',
        taskId: task.id,
        success: false,
        data: {
          loginCompleted: false,
          steps: this.steps,
          outputDir: this.outputDir,
          totalSteps: this.steps.length,
          finalUrl: await this.page.url(),
          method: 'user_interaction_required',
          userInteractionRequired: true
        },
        timestamp: new Date(),
        processingTime: 0
      };

    } catch (error) {
      this.log(`Erro no login: ${error}`, 'error');
      await this.saveLoginReport();
      throw error;
    }
  }

  private async smartLogin(page: Page, { baseUrl, credentials, outputDir }: {
    baseUrl: string;
    credentials: LoginCredentials;
    outputDir: string;
  }): Promise<boolean> {
    
    // 1. Abrir URL inicial
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await this.captureStep(page, 'initial-page', outputDir);
    
    // 2. Procurar campos de login imediatamente visíveis
    let formFound = await this.detectLoginForm(page);
    
    if (!formFound) {
      this.log('Campos de login não visíveis, procurando gatilhos...');
      
      // 3. Buscar e clicar em gatilhos de login
      const triggerClicked = await this.findAndClickLoginTrigger(page, outputDir);
      
      if (triggerClicked) {
        // Aguardar carregamento e verificar novamente
        await page.waitForLoadState('networkidle');
        formFound = await this.detectLoginForm(page);
      }
    }
    
    if (!formFound) {
      this.log('Não foi possível localizar tela de login', 'error');
      return false;
    }
    
    // 4. Capturar tela de login e fazer scraping
    await this.captureStep(page, 'login-page-found', outputDir);
    await this.scrapLoginPage(page, outputDir);
    
    // 5. Preencher e enviar formulário
    await this.fillLoginForm(page, credentials);
    await this.submitLogin(page);
    
    // 6. Verificar sucesso
    const success = await this.verifyLoginSuccess(page);
    
    if (success) {
      await this.captureStep(page, 'login-success', outputDir);
    } else {
      await this.captureStep(page, 'login-failed', outputDir);
    }
    
    return success;
  }

  private async detectLoginForm(page: Page): Promise<boolean> {
    try {
      // Procurar campos de senha (indicador mais confiável)
      const passwordField = await page.$('input[type="password"]');
      
      if (!passwordField) {
        return false;
      }
      
      // Verificar se há campo de usuário próximo
      const userField = await page.$(
        'input[type="text"], input[type="email"], input[name*="user"], input[name*="login"], input[name*="email"]'
      );
      
      return !!userField;
    } catch (error) {
      this.log(`Erro ao detectar formulário: ${error}`, 'error');
      return false;
    }
  }

  private async findAndClickLoginTrigger(page: Page, outputDir: string): Promise<boolean> {
    const loginTriggers = [
      'login', 'entrar', 'acessar', 'sign in', 'log in', 'autenticar',
      'fazer login', 'conectar', 'iniciar sessão', 'access', 'signin'
    ];
    
    // Termos OAuth/SSO para ignorar
    const oauthTerms = [
      'google', 'facebook', 'twitter', 'linkedin', 'microsoft', 'apple',
      'github', 'oauth', 'sso', 'single sign', 'social login'
    ];
    
    // Termos de recuperação/registro para identificar
    const recoveryTerms = [
      'esqueci', 'forgot', 'recover', 'reset', 'recuperar', 'redefinir',
      'cadastro', 'register', 'sign up', 'criar conta', 'nova conta'
    ];
    
    try {
      // Primeiro, identificar e documentar formulários de recuperação/registro
      await this.identifySpecialForms(page, recoveryTerms, outputDir);
      
      // Buscar botões e links com texto relacionado a login (ignorando OAuth)
      for (const trigger of loginTriggers) {
        const elements = await page.$$eval(
          'button, a, [role="button"], input[type="submit"]',
          (elements: Element[], args: { searchText: string; oauthTerms: string[] }) => {
            return elements
              .map((el: Element, index: number) => ({
                index,
                text: el.textContent?.toLowerCase().trim() || '',
                visible: (el as HTMLElement).offsetParent !== null,
                isOAuth: args.oauthTerms.some((term: string) => 
                  el.textContent?.toLowerCase().includes(term) ||
                  el.className?.toLowerCase().includes(term) ||
                  (el as HTMLElement).getAttribute('data-provider')?.toLowerCase().includes(term)
                )
              }))
              .filter((item: any) => 
                item.visible && 
                item.text.includes(args.searchText.toLowerCase()) &&
                !item.isOAuth // Ignorar métodos OAuth
              );
          },
          { searchText: trigger, oauthTerms }
        );
        
        if (elements.length > 0) {
          this.log(`Encontrado gatilho de login: "${trigger}" (ignorando OAuth)`);
          
          // Clicar no primeiro elemento encontrado
          const selector = `button, a, [role="button"], input[type="submit"]`;
          const allElements = await page.$$(selector);
          
          if (allElements && elements.length > 0 && allElements[elements[0].index]) {
            await this.captureStep(page, `before-click-${trigger}`, outputDir);
            await allElements[elements[0].index].click();
            await page.waitForTimeout(2000); // Aguardar navegação
            await this.captureStep(page, `after-click-${trigger}`, outputDir);
            
            // Verificar se chegamos a uma nova rota e analisar novamente
            const newUrl = await page.url();
            this.log(`Navegou para: ${newUrl}`);
            
            // Tentar detectar campos de login na nova página
            await page.waitForTimeout(1000);
            const formFound = await this.detectLoginForm(page);
            
            if (formFound) {
              await this.captureStep(page, `login-form-found-after-navigation`, outputDir);
              return true;
            }
            
            // Se não encontrou, continuar procurando outros gatilhos
            this.currentAttempt++;
            if (this.currentAttempt < this.maxNavigationAttempts) {
              return await this.findAndClickLoginTrigger(page, outputDir);
            }
          }
        }
      }
      
      return false;
    } catch (error) {
      this.log(`Erro ao procurar gatilhos: ${error}`, 'error');
      return false;
    }
  }

  private async fillLoginForm(page: Page, credentials: LoginCredentials): Promise<void> {
    try {
      // Encontrar campo de usuário
      const userField = await page.$(
        'input[type="text"], input[type="email"], input[name*="user"], input[name*="login"], input[name*="email"]'
      );
      
      // Encontrar campo de senha
      const passwordField = await page.$('input[type="password"]');
      
      if (!userField || !passwordField) {
        throw new Error('Campos de login não encontrados');
      }
      
      this.log('Preenchendo credenciais...');
      
      // Preencher com delays humanos
      await userField.fill('');
      await userField.type(credentials.username, { delay: 100 });
      await page.waitForTimeout(500);
      
      await passwordField.fill('');
      await passwordField.type(credentials.password, { delay: 100 });
      await page.waitForTimeout(500);
      
    } catch (error) {
      this.log(`Erro ao preencher formulário: ${error}`, 'error');
      throw error;
    }
  }

  private async submitLogin(page: Page): Promise<void> {
    try {
      // Tentar encontrar botão de submit
      const submitButton = await page.$(
        'button[type="submit"], input[type="submit"], button[class*="login"], button[class*="submit"], button[class*="signin"]'
      );
      
      if (submitButton) {
        this.log('Clicando no botão de submit...');
        await submitButton.click();
      } else {
        // Fallback: pressionar Enter no campo de senha
        this.log('Botão não encontrado, usando Enter...');
        const passwordField = await page.$('input[type="password"]');
        if (passwordField) {
          await passwordField.press('Enter');
        } else {
          // Último recurso: submit via JavaScript
          await page.evaluate(() => {
            const form = document.querySelector('form');
            if (form) {
              form.submit();
            }
          });
        }
      }
      
      // Aguardar resposta
      await page.waitForTimeout(3000);
      
    } catch (error) {
      this.log(`Erro ao submeter login: ${error}`, 'error');
      throw error;
    }
  }

  private async verifyLoginSuccess(page: Page): Promise<boolean> {
    try {
      // Aguardar possível redirecionamento
      await page.waitForLoadState('networkidle');
      
      const result = await page.evaluate(() => {
        // Verificar ausência de campos de senha
        const passwordFields = document.querySelectorAll('input[type="password"]');
        
        // Verificar indicadores de sucesso
        const successIndicators = document.querySelectorAll(
          '[class*="dashboard"], [class*="profile"], [class*="logout"], [class*="welcome"], [class*="menu"], nav, header, [class*="user"]'
        );
        
        // Verificar indicadores de erro
        const errorIndicators = document.querySelectorAll(
          '[class*="error"], [class*="invalid"], [class*="wrong"], .alert-danger, .error-message'
        );
        
        return {
          noPasswordFields: passwordFields.length === 0,
          hasSuccessIndicators: successIndicators.length > 0,
          hasErrorIndicators: errorIndicators.length > 0,
          url: window.location.href,
          title: document.title
        };
      });
      
      this.log(`Verificação de login: ${JSON.stringify(result)}`);
      
      // Login bem-sucedido se:
      // - Não há campos de senha OU
      // - Há indicadores de sucesso E não há indicadores de erro
      const success = result.noPasswordFields || 
                     (result.hasSuccessIndicators && !result.hasErrorIndicators);
      
      return success;
      
    } catch (error) {
      this.log(`Erro na verificação: ${error}`, 'error');
      return false;
    }
  }

  private async captureStep(page: Page, stepName: string, outputDir: string): Promise<void> {
    try {
      const timestamp = Date.now();
      const screenshotPath = path.join(outputDir, `${timestamp}-${stepName}.png`);
      
      await page.screenshot({ 
        path: screenshotPath, 
        fullPage: true 
      });
      
      const step: LoginStep = {
        stepName,
        url: page.url(),
        screenshot: screenshotPath,
        timestamp,
        success: true
      };
      
      this.steps.push(step);
      this.log(`Screenshot capturado: ${stepName}`);
      
    } catch (error) {
      this.log(`Erro ao capturar screenshot: ${error}`, 'error');
    }
  }

  private async scrapLoginPage(page: Page, outputDir: string): Promise<void> {
    try {
      this.log('Fazendo scraping da página de login...');
      
      // Capturar HTML completo
      const html = await page.content();
      
      // Capturar metadados estruturados
      const metadata = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input')).map(input => ({
          name: input.name || '',
          id: input.id || '',
          type: input.type || '',
          placeholder: input.placeholder || '',
          required: input.required
        }));
        
        const buttons = Array.from(document.querySelectorAll('button')).map(btn => ({
          text: btn.textContent?.trim() || '',
          id: btn.id || '',
          type: btn.type || '',
          className: btn.className || ''
        }));
        
        const forms = Array.from(document.querySelectorAll('form')).map(form => ({
          action: form.action || '',
          method: form.method || '',
          id: form.id || ''
        }));
        
        const links = Array.from(document.querySelectorAll('a')).map(link => ({
          text: link.textContent?.trim() || '',
          href: link.href || '',
          className: link.className || ''
        }));
        
        return {
          inputs,
          buttons,
          forms,
          links,
          title: document.title,
          url: window.location.href
        };
      });
      
      const loginPageData: LoginPageData = {
        html,
        metadata
      };
      
      // Salvar arquivos
      await fs.writeFile(
        path.join(outputDir, 'login-page.html'), 
        html, 
        'utf-8'
      );
      
      await fs.writeFile(
        path.join(outputDir, 'login-page.json'), 
        JSON.stringify(loginPageData.metadata, null, 2), 
        'utf-8'
      );
      
      this.log('Scraping da página de login concluído');
      
    } catch (error) {
      this.log(`Erro no scraping: ${error}`, 'error');
    }
  }

  private async saveLoginReport(): Promise<void> {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        totalSteps: this.steps.length,
        steps: this.steps,
        outputDirectory: this.outputDir,
        success: this.steps.some(step => step.stepName.includes('success'))
      };
      
      await fs.writeFile(
        path.join(this.outputDir, 'login-report.json'),
        JSON.stringify(report, null, 2),
        'utf-8'
      );
      
      this.log('Relatório de login salvo');
      
    } catch (error) {
      this.log(`Erro ao salvar relatório: ${error}`, 'error');
    }
  }

  setPage(page: Page): void {
    this.page = page;
  }

  getSteps(): LoginStep[] {
    return this.steps;
  }

  getOutputDir(): string {
    return this.outputDir;
  }

  private async identifySpecialForms(page: Page, recoveryTerms: string[], outputDir: string): Promise<void> {
    try {
      const specialForms = await page.$$eval(
        'form, button, a, [role="button"]',
        (elements: Element[], terms: string[]) => {
          return elements
            .map((el: Element, index: number) => ({
              index,
              text: el.textContent?.toLowerCase().trim() || '',
              type: el.tagName.toLowerCase(),
              action: (el as HTMLFormElement).action || '',
              href: (el as HTMLAnchorElement).href || '',
              className: el.className || '',
              isSpecial: terms.some((term: string) => 
                el.textContent?.toLowerCase().includes(term) ||
                el.className?.toLowerCase().includes(term)
              )
            }))
            .filter((item: any) => item.isSpecial);
        },
        recoveryTerms
      );
      
      if (specialForms.length > 0) {
        this.log(`Identificados ${specialForms.length} formulários especiais (recuperação/registro)`);
        
        // Documentar sem interagir
        const specialFormsData = {
          timestamp: new Date().toISOString(),
          url: await page.url(),
          forms: specialForms,
          description: 'Formulários de recuperação de senha e registro identificados para processamento futuro'
        };
        
        await fs.writeFile(
          path.join(outputDir, 'special-forms.json'),
          JSON.stringify(specialFormsData, null, 2),
          'utf-8'
        );
        
        await this.captureStep(page, 'special-forms-identified', outputDir);
      }
    } catch (error) {
      this.log(`Erro ao identificar formulários especiais: ${error}`, 'error');
    }
  }
  
  private async requestUserInteraction(): Promise<void> {
    this.userInteractionRequired = true;
    this.log('=== INTERAÇÃO DO USUÁRIO NECESSÁRIA ===', 'warn');
    this.log('Os agentes automáticos não conseguiram completar o login.', 'warn');
    this.log('Por favor, complete o login manualmente no navegador.', 'warn');
    this.log('O sistema aguardará 30 segundos para interação manual...', 'warn');
    
    if (this.page) {
      // Capturar screenshot do estado atual
      await this.captureStep(this.page, 'user-interaction-required', this.outputDir);
      
      // Aguardar tempo para interação manual
      await this.page.waitForTimeout(30000);
      
      // Capturar screenshot após possível interação
      await this.captureStep(this.page, 'after-user-interaction', this.outputDir);
      
      // Verificar se o login foi bem-sucedido após interação
      const success = await this.verifyLoginSuccess(this.page);
      if (success) {
        this.log('Login completado com sucesso após interação do usuário!');
      } else {
        this.log('Login ainda não foi completado. Verifique manualmente.', 'warn');
      }
    }
  }

  async cleanup(): Promise<void> {
    this.page = null;
    this.steps = [];
    this.userInteractionRequired = false;
    this.currentAttempt = 0;
    if (this.fallbackAgent) {
      await this.fallbackAgent.cleanup();
    }
    this.log('SmartLoginAgent limpo');
  }

  async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    const data = taskResult.data || {};
    const steps = data.steps || [];
    
    let report = `# Relatório de Login Inteligente\n\n`;
    report += `**Status:** ${taskResult.success ? '✅ Sucesso' : '❌ Falha'}\n`;
    report += `**Timestamp:** ${taskResult.timestamp.toISOString()}\n`;
    report += `**Tempo de Processamento:** ${taskResult.processingTime}ms\n\n`;
    
    if (data.skipped) {
      report += `## Login Pulado\n\n`;
      report += `Motivo: ${data.reason}\n\n`;
      return report;
    }
    
    if (taskResult.error) {
      report += `## Erro\n\n`;
      report += `${taskResult.error}\n\n`;
    }
    
    if (steps.length > 0) {
      report += `## Etapas do Processo (${steps.length} total)\n\n`;
      steps.forEach((step: any, index: number) => {
        report += `### ${index + 1}. ${step.stepName}\n`;
        report += `- **URL:** ${step.url}\n`;
        report += `- **Timestamp:** ${new Date(step.timestamp).toLocaleString()}\n`;
        report += `- **Screenshot:** ${step.screenshot}\n\n`;
      });
    }
    
    if (data.outputDir) {
      report += `## Arquivos Gerados\n\n`;
      report += `Diretório de saída: \`${data.outputDir}\`\n\n`;
      report += `- Screenshots de cada etapa\n`;
      report += `- \`login-page.html\` - HTML completo da página de login\n`;
      report += `- \`login-page.json\` - Metadados estruturados\n`;
      report += `- \`login-report.json\` - Relatório detalhado\n\n`;
    }
    
    if (data.finalUrl) {
      report += `## Resultado Final\n\n`;
      report += `URL final após login: ${data.finalUrl}\n\n`;
    }
    
    return report;
  }
}