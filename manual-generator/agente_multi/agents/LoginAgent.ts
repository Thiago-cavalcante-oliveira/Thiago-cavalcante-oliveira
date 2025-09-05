import { BaseAgent  } from '../core/AgnoSCore';
import { Page } from 'playwright';
import { v4 as uuidv4 } from 'uuid';
import {AgentConfig, TaskData, TaskResult} from '../../types/types'

export interface LoginCredentials {
  username: string;
  password: string;
  loginUrl?: string;
}

export class LoginAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      name: 'LoginAgent',
      version: '1.0.0',
      description: 'Realiza autenticação padrão em formulários web.',
      capabilities: [{ name: 'standard_login', description: 'Autenticação com usuário e senha.', version: '1.0.0' }],
    };
    super(config);
  }

  async initialize(): Promise<void> { this.log.info('LoginAgent inicializado.'); }
  async cleanup(): Promise<void> {}

  async processTask(task: TaskData): Promise<TaskResult> {
    if (task.type !== 'authenticate') {
      throw new Error('Tipo de tarefa não suportado.');
    }
    const { page, credentials } = task.data as { page: Page; credentials: LoginCredentials };
    
    if (credentials.loginUrl) {
        await page.goto(credentials.loginUrl, { waitUntil: 'domcontentloaded' });
    }

    const success = await this.performBasicAuth(credentials, page);

    if (!success) {
        throw new Error('Falha na autenticação. Verifique os seletores e credenciais.');
    }

    return {
      id: uuidv4(),
      taskId: task.id,
      success: true,
      data: { authenticated: true },
      timestamp: new Date(),
      processingTime: 0,
    };
  }

  private async performBasicAuth(credentials: LoginCredentials, page: Page): Promise<boolean> {
    try {
      this.log.info('Tentando autenticação básica...');

      const userField = page.locator('input[type="email"], input[type="text"][name*="user"], input[type="text"][name*="login"], input[id*="user"], input[id*="email"]').first();
      const passField = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button[type="submit"], input[type="submit"], button:has-text(/entrar|login|submit|sign in/i)').first();
      
      await userField.waitFor({ state: 'visible', timeout: 7000 });
      await passField.waitFor({ state: 'visible', timeout: 7000 });

      await userField.fill(credentials.username);
      await passField.fill(credentials.password);
      await submitButton.click();

      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 });
      
      const finalUrl = page.url().toLowerCase();
      const hasError = await page.locator('[class*="error"], [class*="alert"]').count() > 0;
      
      const success = !finalUrl.includes('login') && !finalUrl.includes('signin') && !hasError;
      this.log.info({ success, finalUrl }, `Verificação de login`);
      
      return success;

    } catch (error) {
      this.log.error({ error }, 'Autenticação básica falhou');
      return false;
    }
  }

  async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    if (taskResult.success) {
      return `## Relatório do LoginAgent\n\n- **Status:** Sucesso\n- **Resultado:** Autenticação realizada com sucesso.`;
    }
    return `## Relatório do LoginAgent\n\n- **Status:** Falha\n- **Erro:** ${taskResult.error}`;
  }
}

