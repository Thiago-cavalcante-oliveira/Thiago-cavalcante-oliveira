import { BaseAgent, AgentConfig, TaskData, TaskResult } from '../core/AgnoSCore.js';
import { Page, Browser } from 'playwright';
import { MinIOService } from '../services/MinIOService.js';
import { LLMManager } from '../services/LLMManager.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  InteractiveElement,
  StaticElement,
  ElementGroup,
  CrawlResult,
  RelatedElement
} from './interfaces/CrawlerTypes';

export interface PageData {
  url: string;
  title: string;
  elements: (InteractiveElement | StaticElement)[];
  screenshots: string[];
  metadata: {
    timestamp: Date;
    loadTime: number;
    elementCount: number;
  };
}

export interface InteractionResult {
  element: {
    type: string;
    text: string;
    selector: string;
    location: string;
  };
  functionality: {
    action: string;
    expectedResult: string;
    triggersWhat: string;
    destinationUrl: string | null;
    opensModal: boolean;
    changesPageContent: boolean;
  };
  interactionResults: {
    wasClicked: boolean;
    visualChanges: string[];
    newElementsAppeared: string[];
    navigationOccurred: boolean;
    screenshotBefore: string;
    screenshotAfter: string;
  };
}

export interface ProxyConfig {
  proxy: {
    enabled: boolean;
    host: string;
    port: string;
    username: string;
    password: string;
    protocol: string;
  };
  authentication: {
    autoDetect: boolean;
    timeout: number;
    retryAttempts: number;
  };
  selectors: {
    usernameField: string;
    passwordField: string;
    submitButton: string;
    authDialog: string;
    authForm: string;
  };
}

export interface ProxyAuthResult {
  detected: boolean;
  authenticated: boolean;
  error?: string;
}

export class CrawlerAgent extends BaseAgent {
  private page: Page | null = null;
  private browser: Browser | null = null;
  private minioService: MinIOService;
  private llmManager: LLMManager;
  private screenshots: string[] = [];
  private proxyConfig: ProxyConfig | null = null;
  private visitedPages: Set<string> = new Set();
  private allPageData: PageData[] = [];
  private discoveredPages: Array<{
    url: string;
    title: string;
    accessMethod: string;
    functionality: string;
  }> = [];
  private logDir: string;
  private logFile: string;
  private retryAttempts: number = 3;
  private retryDelay: number = 2000;

  private async logToFile(message: string, stage: string = 'crawler'): Promise<void> {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
      const logMsg = `[${new Date().toISOString()}][${stage}] ${message}\n`;
      await fs.appendFile(this.logFile, logMsg, 'utf-8');
    } catch (error) {
      console.error(`Erro ao salvar log: ${error}`);
    }
  }

  private async retryWithFallback<T>(operation: () => Promise<T>, operationName: string): Promise<T | null> {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        await this.logToFile(`Tentativa ${attempt}/${this.retryAttempts} para ${operationName}`);
        const result = await operation();
        await this.logToFile(`${operationName} executado com sucesso na tentativa ${attempt}`);
        return result;
      } catch (error) {
        await this.logToFile(`Erro na tentativa ${attempt}/${this.retryAttempts} para ${operationName}: ${error}`, 'error');
        if (attempt < this.retryAttempts) {
          await this.logToFile(`Aguardando ${this.retryDelay}ms antes da próxima tentativa`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }
    await this.logToFile(`Todas as tentativas falharam para ${operationName}`, 'error');
    return null;
  }

  private createFailedInteractionResult(element: any, screenshotBefore: string): InteractionResult {
    return {
      element: {
        type: element.type,
        text: element.text,
        selector: element.selector,
        location: 'main-content'
      },
      functionality: {
        action: `attempted click on ${element.type}`,
        expectedResult: 'failed to interact',
        triggersWhat: 'error',
        destinationUrl: element.href,
        opensModal: false,
        changesPageContent: false
      },
      interactionResults: {
        wasClicked: false,
        visualChanges: [],
        newElementsAppeared: [],
        navigationOccurred: false,
        screenshotBefore: screenshotBefore,
        screenshotAfter: ''
      }
    };
  }

  setPage(page: Page | null): void {
    this.page = page;
    this.log('CrawlerAgent: página definida');
  }

  private async loadProxyConfig(): Promise<void> {
    try {
      const configPath = path.join(__dirname, '..', 'proxy-config.json');
      const configData = await fs.readFile(configPath, 'utf-8');
      this.proxyConfig = JSON.parse(configData) as ProxyConfig;
      console.log('📋 Configuração de proxy carregada');
    } catch (error) {
      console.warn('⚠️ Arquivo de configuração de proxy não encontrado, usando configuração padrão');
      this.proxyConfig = null;
    }
  }

  private async detectProxyAuth(): Promise<boolean> {
    if (!this.page || !this.proxyConfig?.authentication.autoDetect) {
      return false;
    }

    try {
      // Verificar se há diálogos de autenticação visíveis
      const authDialog = await this.page.$(this.proxyConfig.selectors.authDialog);
      if (authDialog) {
        console.log('🔐 Diálogo de autenticação de proxy detectado');
        return true;
      }

      // Verificar se há formulários de autenticação
      const authForm = await this.page.$(this.proxyConfig.selectors.authForm);
      if (authForm) {
        console.log('🔐 Formulário de autenticação de proxy detectado');
        return true;
      }

      // Verificar se há campos de usuário e senha visíveis
      const usernameField = await this.page.$(this.proxyConfig.selectors.usernameField);
      const passwordField = await this.page.$(this.proxyConfig.selectors.passwordField);
      
      if (usernameField && passwordField) {
        const usernameVisible = await usernameField.isVisible();
        const passwordVisible = await passwordField.isVisible();
        
        if (usernameVisible && passwordVisible) {
          console.log('🔐 Campos de autenticação de proxy detectados');
          return true;
        }
      }

      return false;
    } catch (error) {
      console.warn('⚠️ Erro ao detectar autenticação de proxy:', error);
      return false;
    }
  }

  private async handleProxyAuth(): Promise<ProxyAuthResult> {
    if (!this.page || !this.proxyConfig) {
      return { detected: false, authenticated: false, error: 'Configuração de proxy não disponível' };
    }

    const { proxy, authentication, selectors } = this.proxyConfig;

    if (!proxy.enabled || !proxy.username || !proxy.password) {
      return { detected: false, authenticated: false, error: 'Credenciais de proxy não configuradas' };
    }

    try {
      console.log('🔐 Iniciando autenticação de proxy...');

      // Aguardar um pouco para garantir que os elementos estejam carregados
      await this.page.waitForTimeout(2000);

      // Tentar preencher campo de usuário
      const usernameField = await this.page.$(selectors.usernameField);
      if (usernameField) {
        await usernameField.fill(proxy.username);
        console.log('✅ Campo de usuário preenchido');
      } else {
        console.warn('⚠️ Campo de usuário não encontrado');
      }

      // Tentar preencher campo de senha
      const passwordField = await this.page.$(selectors.passwordField);
      if (passwordField) {
        await passwordField.fill(proxy.password);
        console.log('✅ Campo de senha preenchido');
      } else {
        console.warn('⚠️ Campo de senha não encontrado');
      }

      // Tentar clicar no botão de submit
      const submitButton = await this.page.$(selectors.submitButton);
      if (submitButton) {
        await submitButton.click();
        console.log('✅ Botão de autenticação clicado');
        
        // Aguardar processamento da autenticação
        await this.page.waitForTimeout(authentication.timeout);
        
        // Verificar se ainda há campos de autenticação (indicando falha)
        const stillNeedsAuth = await this.detectProxyAuth();
        
        if (!stillNeedsAuth) {
          console.log('✅ Autenticação de proxy bem-sucedida');
          return { detected: true, authenticated: true };
        } else {
          console.warn('❌ Autenticação de proxy falhou');
          return { detected: true, authenticated: false, error: 'Credenciais inválidas' };
        }
      } else {
        console.warn('⚠️ Botão de submit não encontrado');
        return { detected: true, authenticated: false, error: 'Botão de submit não encontrado' };
      }
    } catch (error) {
       console.error('❌ Erro durante autenticação de proxy:', error);
       return { detected: true, authenticated: false, error: String(error) };
     }
  }

  private async checkAndHandleProxyAuth(): Promise<void> {
    if (!this.proxyConfig?.authentication.autoDetect) {
      return;
    }

    const maxRetries = this.proxyConfig.authentication.retryAttempts;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      const needsAuth = await this.detectProxyAuth();
      
      if (!needsAuth) {
        break;
      }

      console.log(`🔄 Tentativa de autenticação de proxy ${retryCount + 1}/${maxRetries}`);
      const authResult = await this.handleProxyAuth();
      
      if (authResult.authenticated) {
        console.log('✅ Autenticação de proxy concluída com sucesso');
        break;
      }

      retryCount++;
      
      if (retryCount < maxRetries) {
        console.log(`⏳ Aguardando antes da próxima tentativa...`);
        await this.page?.waitForTimeout(2000);
      }
    }

    if (retryCount >= maxRetries) {
      console.warn('⚠️ Máximo de tentativas de autenticação de proxy atingido');
    }
  }

  setBrowser(browser: Browser | null): void {
    this.browser = browser;
    this.log('CrawlerAgent: browser definido');
  }

  constructor(minioService?: MinIOService, llmManager?: LLMManager) {
    const config: AgentConfig = {
      name: 'CrawlerAgent',
      version: '2.0.0',
      description: 'Agente especializado em navegação web interativa e análise completa de funcionalidades',
      capabilities: [
        { name: 'interactive_crawling', description: 'Navegação web com interações reais', version: '2.0.0' },
        { name: 'visual_interaction', description: 'Cliques e interações visuais', version: '2.0.0' },
        { name: 'functionality_mapping', description: 'Mapeamento completo de funcionalidades', version: '2.0.0' },
        { name: 'workflow_analysis', description: 'Análise de workflows completos', version: '2.0.0' }
      ]
    };

    super(config);
    this.minioService = minioService || new MinIOService();
     this.llmManager = llmManager || new LLMManager('gemini');
     this.logDir = path.join(process.cwd(), 'output', 'logs');
     this.logFile = path.join(this.logDir, 'crawler-agent.log');
     this.loadProxyConfig();
  }

  private async captureScreenshot(filename: string): Promise<string> {
    if (!this.page) return '';
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = `/tmp/screenshot-${filename}-${timestamp}.png`;
      
      await this.page.screenshot({ 
        path: screenshotPath, 
        fullPage: true 
      });
      
      // Upload para MinIO
      const buffer = await fs.readFile(screenshotPath);
      const minioPath = `screenshots/${filename}-${timestamp}.png`;
      await this.minioService.uploadFile(minioPath, buffer.toString('base64'));
      
      // Limpar arquivo temporário
      await fs.unlink(screenshotPath).catch(() => {});
      
      this.screenshots.push(minioPath);
      return minioPath;
    } catch (error) {
      this.log(`Erro ao capturar screenshot: ${error}`, 'error');
      return '';
    }
  }

  async initialize(): Promise<void> {
    await this.minioService.initialize();
    this.log('CrawlerAgent inicializado e pronto para navegação interativa');
    await this.logToFile('CrawlerAgent inicializado e pronto para navegação interativa', 'init');
  }

  private async detectAndInteractWithElements(): Promise<InteractionResult[]> {
    if (!this.page) {
      await this.logToFile('Página não disponível para detecção de elementos', 'error');
      return [];
    }

    try {
      await this.logToFile('Iniciando detecção e interação com elementos');
      
      // Primeiro, capturar screenshot inicial
      const initialScreenshot = await this.retryWithFallback(
        () => this.captureScreenshot('initial-page-state'),
        'captura de screenshot inicial'
      );
      
      if (!initialScreenshot) {
        await this.logToFile('Falha ao capturar screenshot inicial, continuando sem screenshot', 'warning');
      }
      
      // Detectar todos os elementos interativos com retry
      const elementData = await this.retryWithFallback(
        () => this.page!.evaluate(() => {
        function isElementVisible(element: Element): boolean {
          const rect = element.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) return false;
          
          const style = window.getComputedStyle(element);
          if (style.display === 'none' || style.visibility === 'hidden') return false;
          if (parseFloat(style.opacity) < 0.1) return false;
          
          return true;
        }

        function generateSelector(element: Element): string {
          if (element.id) return `#${element.id}`;
          
          const tagName = element.tagName.toLowerCase();
          const parent = element.parentElement;
          
          if (parent) {
            const siblings = Array.from(parent.children).filter(child => 
              child.tagName === element.tagName
            );
            
            if (siblings.length === 1) {
              return tagName;
            }
            
            const siblingIndex = siblings.indexOf(element as Element) + 1;
            return `${tagName}:nth-of-type(${siblingIndex})`;
          }
          
          return tagName;
        }

        // Encontrar todos os elementos interativos
        const interactiveSelectors = [
          'button', 'a[href]', 'input[type="button"]', 'input[type="submit"]',
          '[onclick]', '[role="button"]', '.btn', '.button', '[data-action]',
          'select', 'input[type="checkbox"]', 'input[type="radio"]',
          'input[type="text"]', 'input[type="email"]', 'input[type="password"]',
          'input[name*="user"]', 'input[name*="login"]', 'input[name*="email"]',
          'input[name*="pass"]', 'input[id*="user"]', 'input[id*="login"]',
          'input[id*="email"]', 'input[id*="pass"]', 'textarea', 'form',
          '[tabindex]', '.clickable', '.menu-item', '.nav-link', '.form-control',
          '.input-field', '[data-testid]', '[aria-label]'
        ];

        const elements: any[] = [];
        
        interactiveSelectors.forEach(selector => {
          const foundElements = document.querySelectorAll(selector);
          foundElements.forEach((element, index) => {
            if (isElementVisible(element)) {
              const rect = element.getBoundingClientRect();
              elements.push({
                type: element.tagName.toLowerCase(),
                text: element.textContent?.trim() || '',
                selector: generateSelector(element),
                href: (element as HTMLAnchorElement).href || null,
                onclick: element.getAttribute('onclick') || null,
                dataAction: element.getAttribute('data-action') || null,
                name: element.getAttribute('name') || null,
                id: element.getAttribute('id') || null,
                placeholder: element.getAttribute('placeholder') || null,
                ariaLabel: element.getAttribute('aria-label') || null,
                className: element.className || null,
                inputType: (element as HTMLInputElement).type || null,
                value: (element as HTMLInputElement).value || null,
                position: {
                  x: rect.left + rect.width / 2,
                  y: rect.top + rect.height / 2
                },
                index: index
              });
            }
          });
        });

        return elements;
        }),
        'detecção de elementos interativos'
      );
      
      if (!elementData) {
        await this.logToFile('Falha na detecção de elementos, retornando lista vazia', 'error');
        return [];
      }
      
      await this.logToFile(`Detectados ${elementData.length} elementos interativos`);

      // Agora interagir com cada elemento
      const interactionResults: InteractionResult[] = [];
      const maxElements = Math.min(elementData.length, 10);
      
      await this.logToFile(`Iniciando interação com ${maxElements} elementos`);
      
      for (let i = 0; i < maxElements; i++) {
        const element = elementData[i];
        
        await this.logToFile(`Processando elemento ${i + 1}/${maxElements}: ${element.type} - "${element.text}"`);
        
        try {
          // Capturar screenshot antes da interação com retry
          const screenshotBefore = await this.retryWithFallback(
            () => this.captureScreenshot(`before-interaction-${i}`),
            `screenshot antes da interação ${i}`
          ) || '';
          
          // Tentar clicar no elemento com retry
          const clickResult = await this.retryWithFallback(
            async () => {
              await this.page!.click(element.selector, { timeout: 5000 });
              await this.page!.waitForTimeout(2000);
              return true;
            },
            `clique no elemento ${i}: ${element.text}`
          );
          
          if (!clickResult) {
            await this.logToFile(`Falha ao clicar no elemento ${i}, registrando como falha`, 'warning');
            interactionResults.push(this.createFailedInteractionResult(element, screenshotBefore));
            continue;
          }
          
          // Capturar screenshot depois da interação
          const screenshotAfter = await this.retryWithFallback(
            () => this.captureScreenshot(`after-interaction-${i}`),
            `screenshot após interação ${i}`
          ) || '';
          
          // Verificar se houve navegação
          const currentUrl = this.page.url();
          
          // Verificar se apareceram novos elementos
          const newElements = await this.retryWithFallback(
            () => this.page!.evaluate(() => {
              const modals = document.querySelectorAll('.modal, [role="dialog"], .popup');
              const dropdowns = document.querySelectorAll('.dropdown-menu, .menu-open');
              return {
                modals: modals.length,
                dropdowns: dropdowns.length
              };
            }),
            `verificação de novos elementos ${i}`
          ) || { modals: 0, dropdowns: 0 };
          
          const interactionResult = {
            element: {
              type: element.type,
              text: element.text,
              selector: element.selector,
              location: 'main-content'
            },
            functionality: {
              action: `click on ${element.type}`,
              expectedResult: element.href ? `navigate to ${element.href}` : 'trigger action',
              triggersWhat: element.onclick || element.dataAction || 'unknown',
              destinationUrl: element.href,
              opensModal: newElements.modals > 0,
              changesPageContent: true
            },
            interactionResults: {
              wasClicked: true,
              visualChanges: ['element clicked', 'possible state change'],
              newElementsAppeared: newElements.modals > 0 ? ['modal'] : [],
              navigationOccurred: currentUrl !== this.page.url(),
              screenshotBefore: screenshotBefore,
              screenshotAfter: screenshotAfter
            }
          };
          
          interactionResults.push(interactionResult);
          
          await this.logToFile(`Interação ${i + 1} bem-sucedida: ${element.text || element.type}`);
          
        } catch (error) {
          await this.logToFile(`Erro ao interagir com elemento ${i}: ${error}`, 'error');
          
          interactionResults.push({
            element: {
              type: element.type,
              text: element.text,
              selector: element.selector,
              location: 'main-content'
            },
            functionality: {
              action: `attempted click on ${element.type}`,
              expectedResult: 'failed to interact',
              triggersWhat: 'error',
              destinationUrl: element.href,
              opensModal: false,
              changesPageContent: false
            },
            interactionResults: {
              wasClicked: false,
              visualChanges: [],
              newElementsAppeared: [],
              navigationOccurred: false,
              screenshotBefore: '',
              screenshotAfter: ''
            }
          });
        }
      }
      
      return interactionResults;
      
    } catch (error) {
      this.log(`Erro na detecção e interação com elementos: ${error}`, 'error');
      return [];
    }
  }

  private async analyzePageObjective(): Promise<{
    centralPurpose: string;
    mainFunctionalities: string[];
    userGoals: string[];
  }> {
    if (!this.page) {
      return {
        centralPurpose: 'Unknown',
        mainFunctionalities: [],
        userGoals: []
      };
    }

    try {
      const pageAnalysis = await this.page.evaluate(() => {
        const title = document.title;
        const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent?.trim()).filter(Boolean);
        const buttons = Array.from(document.querySelectorAll('button, .btn')).map(b => b.textContent?.trim()).filter(Boolean);
        const links = Array.from(document.querySelectorAll('a[href]')).map(a => a.textContent?.trim()).filter(Boolean);
        
        return {
          title,
          headings,
          buttons,
          links
        };
      });

      return {
        centralPurpose: pageAnalysis.title || 'Web Application',
        mainFunctionalities: [...pageAnalysis.buttons.slice(0, 5), ...pageAnalysis.links.slice(0, 5)].filter((func): func is string => func !== undefined),
        userGoals: pageAnalysis.headings.slice(0, 3).filter((goal): goal is string => goal !== undefined)
      };
    } catch (error) {
      this.log(`Erro ao analisar objetivo da página: ${error}`, 'error');
      return {
        centralPurpose: 'Unknown',
        mainFunctionalities: [],
        userGoals: []
      };
    }
  }

  async processTask(task: TaskData): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      switch (task.type) {
        case 'start_crawl':
        case 'start_authenticated_crawl':
          const result = await this.processPageWithInteractions(task.data.url);
          return {
            id: task.id,
            taskId: task.id,
            success: true,
            data: result,
            timestamp: new Date(),
            processingTime: Date.now() - startTime
          };
          
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

  async crawlPage(url: string): Promise<any> {
    const startTime = Date.now();
    this.log(`Iniciando crawling recursivo da página: ${url}`);

    try {
      if (!this.page) {
        throw new Error('Página do Playwright não inicializada');
      }

      // Processar a página com interações recursivas (profundidade máxima 3)
      const result = await this.processPageWithInteractions(url, 3, 0);
      
      const processingTime = Date.now() - startTime;
      result.statistics.processingTime = processingTime;
      
      this.log(`Crawling recursivo concluído em ${processingTime}ms`);
      this.log(`Elementos interativos encontrados: ${result.interactiveElements.length}`);
      this.log(`Páginas descobertas: ${result.discoveredPages.length}`);
      this.log(`Workflows identificados: ${result.workflows.length}`);
      
      return result;
    } catch (error) {
      this.log(`Erro durante o crawling: ${error}`, 'error');
      throw error;
    }
  }

  private async processPageWithInteractions(url: string, maxDepth: number = 3, currentDepth: number = 0): Promise<any> {
    if (!this.page) throw new Error('Página não disponível');
    if (currentDepth >= maxDepth) {
      this.log(`Profundidade máxima atingida (${maxDepth}) para ${url}`);
      return this.createEmptyResult();
    }
    if (this.visitedPages.has(url)) {
      this.log(`Página já visitada: ${url}`);
      return this.createEmptyResult();
    }

    this.visitedPages.add(url);
    const screenshots: Record<string, string | null> = {};
    const startTime = Date.now();
    const allInteractiveElements: any[] = [];
    const allWorkflows: any[] = [];
    const allHiddenFunctionalities: any[] = [];

    try {
      this.log(`Processando página (profundidade ${currentDepth}): ${url}`);
      
      // Navegar para a página com networkidle
      await this.page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Verificar e lidar com autenticação de proxy
      await this.checkAndHandleProxyAuth();

      // Lidar com redirecionamentos e modais
      await this.handleRedirectsAndModals();

      // Capturar screenshot da página inicial
      screenshots[`pagina_${currentDepth}_inicial`] = await this.captureScreenshot(`pagina_${currentDepth}_inicial`);

      // Aguardar estabilização adicional
      await this.page.waitForTimeout(2000);

      // Capturar título
      const title = await this.page.title();
      
      // Analisar objetivo da página
      const pageObjective = await this.analyzePageObjective();
      
      // Detectar e interagir com elementos da página atual
      const interactiveElements = await this.detectAndInteractWithElements();
      allInteractiveElements.push(...interactiveElements);

      // Descobrir links para outras páginas
      const navigationLinks = await this.discoverNavigationLinks();
      
      // Adicionar páginas descobertas à lista
      navigationLinks.forEach(link => {
        if (!this.discoveredPages.find(p => p.url === link.url)) {
          this.discoveredPages.push({
            url: link.url,
            title: link.text || 'Página sem título',
            accessMethod: 'navigation_link',
            functionality: link.functionality || 'Funcionalidade não identificada'
          });
        }
      });

      // Criar workflows baseados nas interações
      const workflows = this.createWorkflowsFromInteractions(interactiveElements);
      allWorkflows.push(...workflows);

      // Identificar funcionalidades ocultas
      const hiddenFunctionalities = await this.discoverHiddenFunctionalities();
      allHiddenFunctionalities.push(...hiddenFunctionalities);

      // Navegar recursivamente para páginas descobertas (limitado a 5 páginas por nível)
      const linksToExplore = navigationLinks.slice(0, 5);
      for (const link of linksToExplore) {
        if (!this.visitedPages.has(link.url) && this.isValidSaebUrl(link.url)) {
          try {
            this.log(`Explorando link descoberto: ${link.url}`);
            const subPageResult = await this.processPageWithInteractions(link.url, maxDepth, currentDepth + 1);
            
            // Agregar resultados das subpáginas
            if (subPageResult.interactiveElements) {
              allInteractiveElements.push(...subPageResult.interactiveElements);
            }
            if (subPageResult.workflows) {
              allWorkflows.push(...subPageResult.workflows);
            }
            if (subPageResult.hiddenFunctionalities) {
              allHiddenFunctionalities.push(...subPageResult.hiddenFunctionalities);
            }
            
            // Voltar para a página original
            await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
            await this.page.waitForTimeout(1000);
            
          } catch (error) {
            this.log(`Erro ao explorar ${link.url}: ${error}`, 'warn');
            // Continuar com outras páginas mesmo se uma falhar
          }
        }
      }

      return {
        pageObjective,
        interactiveElements: allInteractiveElements,
        discoveredPages: this.discoveredPages,
        workflows: allWorkflows,
        hiddenFunctionalities: allHiddenFunctionalities,
        screenshots,
        statistics: {
          totalElementsTested: allInteractiveElements.length,
          successfulInteractions: allInteractiveElements.filter(e => e.interactionResults?.wasClicked).length,
          pagesDiscovered: this.discoveredPages.length,
          workflowsIdentified: allWorkflows.length,
          hiddenFeaturesFound: allHiddenFunctionalities.length,
          processingTime: Date.now() - startTime,
          currentDepth,
          visitedPagesCount: this.visitedPages.size
        }
      };

    } catch (error) {
      this.log(`Erro ao processar página ${url}: ${error}`, 'error');
      throw error;
    }
  }

  private createWorkflowsFromInteractions(interactions: InteractionResult[]): Array<{
    name: string;
    description: string;
    steps: Array<{
      stepNumber: number;
      action: string;
      element: string;
      expectedOutcome: string;
    }>;
    completionCriteria: string;
  }> {
    const workflows: Array<{
      name: string;
      description: string;
      steps: Array<{
        stepNumber: number;
        action: string;
        element: string;
        expectedOutcome: string;
      }>;
      completionCriteria: string;
    }> = [];
    
    // Agrupar interações por tipo de funcionalidade
    const loginElements = interactions.filter(i => 
      i.element.text.toLowerCase().includes('login') || 
      i.element.text.toLowerCase().includes('entrar')
    );
    
    const navigationElements = interactions.filter(i => 
      i.functionality.destinationUrl && 
      i.interactionResults.navigationOccurred
    );
    
    if (loginElements.length > 0) {
      workflows.push({
        name: 'Login Workflow',
        description: 'Processo de autenticação do usuário',
        steps: loginElements.map((element, index) => ({
          stepNumber: index + 1,
          action: element.functionality.action,
          element: element.element.text || element.element.selector,
          expectedOutcome: element.functionality.expectedResult
        })),
        completionCriteria: 'Usuário autenticado com sucesso'
      });
    }
    
    if (navigationElements.length > 0) {
      workflows.push({
        name: 'Navigation Workflow',
        description: 'Navegação entre páginas da aplicação',
        steps: navigationElements.map((element, index) => ({
          stepNumber: index + 1,
          action: element.functionality.action,
          element: element.element.text || element.element.selector,
          expectedOutcome: element.functionality.expectedResult
        })),
        completionCriteria: 'Navegação bem-sucedida'
      });
    }
    
    return workflows;
  }

  private async discoverHiddenFunctionalities(): Promise<Array<{
    type: string;
    triggerElement: string;
    description: string;
    accessMethod: string;
  }>> {
    if (!this.page) return [];
    
    try {
      const hiddenFeatures = await this.page.evaluate(() => {
        const features: Array<{
          type: string;
          triggerElement: string;
          description: string;
          accessMethod: string;
        }> = [];
        
        // Procurar por elementos com data attributes
        const dataElements = document.querySelectorAll('[data-toggle], [data-action], [data-target]');
        dataElements.forEach(element => {
          features.push({
            type: 'data-driven-functionality',
            triggerElement: element.tagName.toLowerCase(),
            description: `Element with data attributes: ${element.getAttribute('data-toggle') || element.getAttribute('data-action') || element.getAttribute('data-target')}`,
            accessMethod: 'click or hover'
          });
        });
        
        // Procurar por elementos com eventos JavaScript
        const jsElements = document.querySelectorAll('[onclick], [onmouseover], [onchange]');
        jsElements.forEach(element => {
          features.push({
            type: 'javascript-functionality',
            triggerElement: element.tagName.toLowerCase(),
            description: 'Element with JavaScript event handlers',
            accessMethod: 'user interaction'
          });
        });
        
        return features;
      });
      
      return hiddenFeatures;
    } catch (error) {
      this.log(`Erro ao descobrir funcionalidades ocultas: ${error}`, 'error');
      return [];
    }
  }

  private async discoverNavigationLinks(): Promise<Array<{
    url: string;
    text: string;
    functionality: string;
  }>> {
    if (!this.page) return [];

    try {
      const links = await this.page.evaluate(() => {
        const navigationLinks: Array<{
          url: string;
          text: string;
          functionality: string;
        }> = [];

        // Buscar links de navegação específicos do SAEB
        const linkSelectors = [
          'a[href]',
          'button[onclick*="location"]',
          '[data-href]',
          '.menu-item a',
          '.nav-link',
          '.sidebar a',
          '.navigation a',
          '[role="menuitem"]',
          '.btn[href]'
        ];

        linkSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            let url = '';
            let text = element.textContent?.trim() || '';
            
            if (element.tagName.toLowerCase() === 'a') {
              url = (element as HTMLAnchorElement).href;
            } else if (element.hasAttribute('data-href')) {
              url = element.getAttribute('data-href') || '';
            } else if (element.hasAttribute('onclick')) {
              const onclick = element.getAttribute('onclick') || '';
              const urlMatch = onclick.match(/location[\s]*=[\s]*['"]([^'"]+)['"]/); 
              if (urlMatch) {
                url = urlMatch[1];
              }
            }

            if (url && text && url !== '#' && url !== 'javascript:void(0)') {
              // Determinar funcionalidade baseada no texto e contexto
              let functionality = 'Navegação geral';
              const lowerText = text.toLowerCase();
              
              if (lowerText.includes('prova') || lowerText.includes('gerador')) {
                functionality = 'Geração de provas';
              } else if (lowerText.includes('relatório') || lowerText.includes('report')) {
                functionality = 'Relatórios e análises';
              } else if (lowerText.includes('usuário') || lowerText.includes('perfil')) {
                functionality = 'Gerenciamento de usuários';
              } else if (lowerText.includes('configuração') || lowerText.includes('config')) {
                functionality = 'Configurações do sistema';
              } else if (lowerText.includes('dashboard') || lowerText.includes('início')) {
                functionality = 'Dashboard principal';
              } else if (lowerText.includes('logout') || lowerText.includes('sair')) {
                functionality = 'Logout do sistema';
              }

              navigationLinks.push({
                url: url,
                text: text,
                functionality: functionality
              });
            }
          });
        });

        return navigationLinks;
      });

      // Filtrar links únicos
      const uniqueLinks = links.filter((link, index, self) => 
        index === self.findIndex(l => l.url === link.url)
      );

      this.log(`Descobertos ${uniqueLinks.length} links de navegação`);
      return uniqueLinks;

    } catch (error) {
      this.log(`Erro ao descobrir links de navegação: ${error}`, 'error');
      return [];
    }
  }

  private isValidSaebUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      // Verificar se é uma URL do domínio SAEB
      return urlObj.hostname.includes('saeb') || 
             urlObj.hostname.includes('pmfi.pr.gov.br') ||
             url.includes('/saeb') ||
             // Permitir URLs relativas
             !url.startsWith('http');
    } catch {
      // Se não conseguir fazer parse da URL, assumir que é relativa e válida
      return !url.startsWith('http') && !url.startsWith('mailto:') && !url.startsWith('tel:');
    }
  }

  private createEmptyResult(): any {
    return {
      pageObjective: {
        centralPurpose: '',
        mainFunctionalities: [],
        userGoals: []
      },
      interactiveElements: [],
      discoveredPages: [],
      workflows: [],
      hiddenFunctionalities: [],
      screenshots: {},
      statistics: {
        totalElementsTested: 0,
        successfulInteractions: 0,
        pagesDiscovered: 0,
        workflowsIdentified: 0,
        hiddenFeaturesFound: 0,
        processingTime: 0
      }
    };
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
        '[data-testid="cookie-banner"]',
        '.alert',
        '.notification'
      ];
      
      for (const selector of modalSelectors) {
        const modal = await this.page.$(selector);
        if (modal) {
          const closeButton = await modal.$('button[class*="close"], .close, [aria-label="close"], [aria-label="Close"], .btn-close');
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

  async cleanup(): Promise<void> {
    this.visitedPages.clear();
    this.allPageData = [];
    this.discoveredPages = [];
    this.log('CrawlerAgent: limpeza concluída');
  }

  async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    const data = taskResult.data;
    
    let report = `# Relatório de Crawling Interativo\n\n`;
    report += `**Data:** ${new Date().toLocaleString()}\n`;
    report += `**Tempo de Processamento:** ${taskResult.processingTime}ms\n\n`;
    
    if (data.pageObjective) {
      report += `## Objetivo Central da Página\n`;
      report += `**Propósito:** ${data.pageObjective.centralPurpose}\n\n`;
      report += `**Funcionalidades Principais:**\n`;
      data.pageObjective.mainFunctionalities.forEach((func: string) => {
        report += `- ${func}\n`;
      });
      report += `\n`;
    }
    
    if (data.interactiveElements && data.interactiveElements.length > 0) {
      report += `## Elementos Interativos Testados\n\n`;
      data.interactiveElements.forEach((element: any, index: number) => {
        report += `### ${index + 1}. ${element.element.text || element.element.type}\n`;
        report += `- **Ação:** ${element.functionality.action}\n`;
        report += `- **Resultado Esperado:** ${element.functionality.expectedResult}\n`;
        report += `- **Foi Clicado:** ${element.interactionResults.wasClicked ? 'Sim' : 'Não'}\n`;
        if (element.functionality.destinationUrl) {
          report += `- **URL de Destino:** ${element.functionality.destinationUrl}\n`;
        }
        report += `\n`;
      });
    }
    
    if (data.workflows && data.workflows.length > 0) {
      report += `## Workflows Identificados\n\n`;
      data.workflows.forEach((workflow: any) => {
        report += `### ${workflow.name}\n`;
        report += `${workflow.description}\n\n`;
        workflow.steps.forEach((step: any) => {
          report += `${step.stepNumber}. ${step.action} - ${step.expectedOutcome}\n`;
        });
        report += `\n`;
      });
    }
    
    if (data.statistics) {
      report += `## Estatísticas\n\n`;
      report += `- **Elementos Testados:** ${data.statistics.totalElementsTested}\n`;
      report += `- **Interações Bem-sucedidas:** ${data.statistics.successfulInteractions}\n`;
      report += `- **Páginas Descobertas:** ${data.statistics.pagesDiscovered}\n`;
      report += `- **Workflows Identificados:** ${data.statistics.workflowsIdentified}\n`;
      report += `- **Funcionalidades Ocultas:** ${data.statistics.hiddenFeaturesFound}\n`;
    }
    
    return report;
  }
}