import { BaseAgent, AgentConfig, TaskData, TaskResult } from '../core/AgnoSCore.js';
import { Page, Browser } from 'playwright';
import { MinIOService } from '../services/MinIOService.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface InteractiveElement {
  id: string;
  text: string;
  type: string;
  functionality: string;
  selector: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  attributes: Record<string, string>;
  isVisible: boolean;
  importance: number;
}

export interface PageData {
  url: string;
  title: string;
  elements: InteractiveElement[];
  screenshots: string[];
  metadata: {
    timestamp: Date;
    loadTime: number;
    elementCount: number;
  };
}

export class CrawlerAgent extends BaseAgent {
  private page: Page | null = null;
  private browser: Browser | null = null;
  private minioService: MinIOService;
  private visitedPages: Set<string> = new Set();
  private allPageData: PageData[] = [];

  constructor() {
    const config: AgentConfig = {
      name: 'CrawlerAgent',
      version: '1.0.0',
      description: 'Agente especializado em navegação web e captura de dados',
      capabilities: [
        { name: 'web_crawling', description: 'Navegação e crawling de páginas web', version: '1.0.0' },
        { name: 'element_detection', description: 'Detecção de elementos interativos', version: '1.0.0' },
        { name: 'screenshot_capture', description: 'Captura de screenshots hierárquicos', version: '1.0.0' },
        { name: 'page_interaction', description: 'Interação com elementos da página', version: '1.0.0' }
      ]
    };

    super(config);
    this.minioService = new MinIOService();
  }

  async initialize(): Promise<void> {
    await this.minioService.initialize();
    this.log('CrawlerAgent inicializado e pronto para navegação');
  }

  async processTask(task: TaskData): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      switch (task.type) {
        case 'start_crawl':
          return await this.handleCrawl(task);
        
        case 'start_authenticated_crawl':
          return await this.handleAuthenticatedCrawl(task);
        
        case 'crawl_page':
          return await this.handlePageCrawl(task);
          
        case 'capture_elements':
          return await this.handleElementCapture(task);
          
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

  private async handleCrawl(task: TaskData): Promise<TaskResult> {
    const { url, sessionData, authContext, enableScreenshots, page } = task.data;
    
    this.log(`Iniciando crawl de: ${url}`);

    try {
      // Usar página fornecida ou a própria
      const targetPage = page || this.page;
      
      if (!targetPage) {
        throw new Error('Página não disponível para crawling');
      }

      // Navegar para URL se necessário
      if (targetPage.url() !== url) {
        await targetPage.goto(url, { waitUntil: 'domcontentloaded' });
        await targetPage.waitForTimeout(2000);
      }

      // Restaurar sessão se fornecida
      if (sessionData) {
        await this.restoreSession(sessionData);
      }

      // Iniciar processo de descoberta e captura
      const crawlResults = await this.performComprehensiveCrawl(url, 2); // máximo 2 níveis de profundidade

      return {
        id: task.id,
        taskId: task.id,
        success: true,
        data: {
          crawlResults,
          sessionData,
          authContext,
          pagesProcessed: crawlResults.length,
          totalElements: crawlResults.reduce((sum, page) => sum + (page.elements?.length || 0), 0),
          screenshots: crawlResults.flatMap(page => page.screenshots || []).filter(Boolean)
        },
        timestamp: new Date(),
        processingTime: 0 // será calculado pelo BaseAgent
      };

    } catch (error) {
      this.log(`Erro no crawl: ${error}`, 'error');
      throw error;
    }
  }

  private async handleAuthenticatedCrawl(task: TaskData): Promise<TaskResult> {
    const { sessionData, loginScreenshot, postLoginScreenshot, authType } = task.data;
    
    this.log('Iniciando crawl autenticado');

    try {
      if (!this.page) {
        throw new Error('Página não disponível para crawling');
      }

      // Restaurar sessão se necessário
      if (sessionData) {
        await this.restoreSession(sessionData);
      }

      // Iniciar processo de descoberta e captura
      const startUrl = this.page.url();
      const crawlResults = await this.performComprehensiveCrawl(startUrl, 2); // máximo 2 níveis de profundidade

      // 📄 SALVAR DADOS INTERMEDIÁRIOS EM .MD
      await this.saveCrawlerDataMarkdown(crawlResults);

      // Enviar dados para análise
      this.sendTask('AnalysisAgent', 'analyze_crawl_data', {
        crawlResults,
        sessionData,
        authContext: {
          loginScreenshot,
          postLoginScreenshot,
          authType
        }
      }, 'high');

      return {
        id: task.id,
        taskId: task.id,
        success: true,
        data: {
          pagesProcessed: crawlResults.length,
          totalElements: crawlResults.reduce((sum, page) => sum + page.elements.length, 0),
          screenshots: crawlResults.flatMap(page => page.screenshots),
          startUrl
        },
        timestamp: new Date(),
        processingTime: 0
      };

    } catch (error) {
      this.log(`Erro no crawl autenticado: ${error}`, 'error');
      throw error;
    }
  }

  private async handlePageCrawl(task: TaskData): Promise<TaskResult> {
    const { url, options = {} } = task.data;

    try {
      if (!this.page) {
        throw new Error('Página não disponível');
      }

      const pageData = await this.crawlSinglePage(url, options);

      return {
        id: task.id,
        taskId: task.id,
        success: true,
        data: pageData,
        timestamp: new Date(),
        processingTime: 0
      };

    } catch (error) {
      throw error;
    }
  }

  private async handleElementCapture(task: TaskData): Promise<TaskResult> {
    const { elements, pageUrl } = task.data;

    try {
      const screenshots = await this.captureElementScreenshots(elements, pageUrl);

      return {
        id: task.id,
        taskId: task.id,
        success: true,
        data: { screenshots, elementCount: elements.length },
        timestamp: new Date(),
        processingTime: 0
      };

    } catch (error) {
      throw error;
    }
  }

  private async performComprehensiveCrawl(startUrl: string, maxDepth: number): Promise<PageData[]> {
    const results: PageData[] = [];
    const urlQueue: Array<{ url: string; depth: number }> = [{ url: startUrl, depth: 0 }];
    this.visitedPages.clear();

    this.log(`Iniciando crawl abrangente de: ${startUrl} (max depth: ${maxDepth})`);

    while (urlQueue.length > 0) {
      const { url, depth } = urlQueue.shift()!;

      if (this.visitedPages.has(url) || depth > maxDepth) {
        continue;
      }

      this.log(`Processando (depth ${depth}): ${url}`);

      try {
        const pageData = await this.crawlSinglePage(url, { captureElements: true, depth });
        
        if (pageData) {
          results.push(pageData);
          this.visitedPages.add(url);
          this.allPageData.push(pageData);

          // Descobrir novos links se não atingiu profundidade máxima
          if (depth < maxDepth) {
            const newLinks = await this.discoverPageLinks(url);
            for (const link of newLinks.slice(0, 3)) { // Limitar a 3 links por página
              if (!this.visitedPages.has(link)) {
                urlQueue.push({ url: link, depth: depth + 1 });
              }
            }
          }
        }

      } catch (error) {
        this.log(`Erro ao processar ${url}: ${error}`, 'warn');
      }

      // Pausa entre páginas para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    this.log(`Crawl concluído: ${results.length} páginas processadas`);
    return results;
  }

  private async crawlSinglePage(url: string, options: any = {}): Promise<PageData | null> {
    if (!this.page) return null;

    const startTime = Date.now();

    try {
      // Navegar para a página
      await this.page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });

      // Aguardar estabilização
      await this.page.waitForTimeout(3000);

      // Capturar informações básicas
      const title = await this.page.title();
      const loadTime = Date.now() - startTime;

      // Capturar screenshot principal
      const mainScreenshot = await this.captureMainPageScreenshot(url);

      // Detectar elementos interativos
      const elements = await this.detectAllInteractiveElements();
      
      // Capturar screenshots dos elementos se solicitado
      let elementScreenshots: string[] = [];
      if (options.captureElements) {
        elementScreenshots = await this.captureElementScreenshots(elements, url);
      }

      const pageData: PageData = {
        url,
        title,
        elements,
        screenshots: [mainScreenshot, ...elementScreenshots].filter(Boolean),
        metadata: {
          timestamp: new Date(),
          loadTime,
          elementCount: elements.length
        }
      };

      this.log(`Página processada: ${title} (${elements.length} elementos)`);
      return pageData;

    } catch (error) {
      this.log(`Erro ao processar página ${url}: ${error}`, 'error');
      return null;
    }
  }

  private async detectAllInteractiveElements(): Promise<InteractiveElement[]> {
    if (!this.page) return [];

    try {
      const elements = await this.page.evaluate(() => {
        const results: any[] = [];
        
        // Seletores organizados por importância
        const elementSelectors = [
          { selector: 'input[type="text"], input[type="email"], input[type="password"]', type: 'input', importance: 5 },
          { selector: 'button[type="submit"], input[type="submit"]', type: 'submit_button', importance: 5 },
          { selector: 'button:not([type="submit"])', type: 'button', importance: 4 },
          { selector: 'a[href]:not([href^="javascript:"]):not([href^="mailto:"])', type: 'link', importance: 3 },
          { selector: 'select', type: 'select', importance: 4 },
          { selector: 'textarea', type: 'textarea', importance: 4 },
          { selector: 'input[type="checkbox"]', type: 'checkbox', importance: 2 },
          { selector: 'input[type="radio"]', type: 'radio', importance: 2 },
          { selector: '[role="button"], [onclick]', type: 'interactive', importance: 3 }
        ];

        elementSelectors.forEach(({ selector, type, importance }) => {
          const elements = document.querySelectorAll(selector);
          
          elements.forEach((element, index) => {
            const rect = element.getBoundingClientRect();
            
            // Verificar visibilidade
            if (rect.width <= 0 || rect.height <= 0) return;
            
            const computedStyle = window.getComputedStyle(element);
            if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') return;
            if (parseFloat(computedStyle.opacity) < 0.1) return;

            // Extrair texto descritivo
            let text = element.textContent?.trim() || 
                      element.getAttribute('placeholder') || 
                      element.getAttribute('aria-label') || 
                      element.getAttribute('title') ||
                      element.getAttribute('alt') ||
                      element.getAttribute('name') ||
                      type;

            if (!text || text.length > 200) {
              text = `${type}_${index}`;
            }

            // Determinar funcionalidade
            let functionality = 'Elemento interativo';
            
            switch (type) {
              case 'input':
                functionality = 'Campo de entrada de dados';
                break;
              case 'submit_button':
                functionality = 'Botão de envio de formulário';
                break;
              case 'button':
                functionality = 'Botão de ação';
                break;
              case 'link':
                functionality = 'Link de navegação';
                break;
              case 'select':
                functionality = 'Lista de seleção';
                break;
              case 'textarea':
                functionality = 'Área de texto';
                break;
              case 'checkbox':
                functionality = 'Caixa de seleção';
                break;
              case 'radio':
                functionality = 'Botão de escolha única';
                break;
            }

            // Gerar seletor único
            const generateSelector = (el: Element): string => {
              if (el.id) return `#${el.id}`;
              
              const tagName = el.tagName.toLowerCase();
              const parent = el.parentElement;
              
              if (parent) {
                const siblings = Array.from(parent.children).filter(child => 
                  child.tagName === el.tagName
                );
                
                if (siblings.length === 1) {
                  return tagName;
                }
                
                const siblingIndex = siblings.indexOf(el) + 1;
                return `${tagName}:nth-of-type(${siblingIndex})`;
              }
              
              return tagName;
            };

            results.push({
              id: `element_${Date.now()}_${index}`,
              text: text.substring(0, 100),
              type,
              functionality,
              selector: generateSelector(element),
              position: {
                x: Math.round(rect.left + rect.width / 2),
                y: Math.round(rect.top + rect.height / 2)
              },
              size: {
                width: Math.round(rect.width),
                height: Math.round(rect.height)
              },
              attributes: {
                href: element.getAttribute('href') || '',
                type: element.getAttribute('type') || '',
                placeholder: element.getAttribute('placeholder') || '',
                'aria-label': element.getAttribute('aria-label') || '',
                title: element.getAttribute('title') || '',
                name: element.getAttribute('name') || '',
                id: element.getAttribute('id') || '',
                className: element.className || ''
              },
              isVisible: true,
              importance
            });
          });
        });

        // Ordenar por importância e posição (top-down, left-right)
        return results.sort((a, b) => {
          if (a.importance !== b.importance) return b.importance - a.importance;
          if (Math.abs(a.position.y - b.position.y) > 50) {
            return a.position.y - b.position.y;
          }
          return a.position.x - b.position.x;
        });
      });

      this.log(`${elements.length} elementos interativos detectados`);
      return elements;

    } catch (error) {
      this.log(`Erro ao detectar elementos: ${error}`, 'error');
      return [];
    }
  }

  private async captureMainPageScreenshot(url: string): Promise<string> {
    if (!this.page) throw new Error('Página não disponível');

    const filename = `main_${this.sanitizeUrl(url)}_${Date.now()}.png`;
    const localPath = `output/screenshots/${filename}`;

    // Garantir que o diretório existe
    await this.ensureDirectoryExists('output/screenshots');

    await this.page.screenshot({
      path: localPath,
      fullPage: true,
      type: 'png'
    });

    // Upload para MinIO
    const minioUrl = await this.minioService.uploadScreenshot(localPath, filename);
    
    this.log(`Screenshot principal capturado: ${filename}`);
    return minioUrl || localPath;
  }

  private async captureElementScreenshots(elements: InteractiveElement[], pageUrl: string): Promise<string[]> {
    if (!this.page) return [];

    const screenshots: string[] = [];
    await this.ensureDirectoryExists('output/screenshots/elements');

    this.log(`Capturando screenshots de ${elements.length} elementos`);

    for (let i = 0; i < Math.min(elements.length, 20); i++) { // Limitar a 20 elementos por página
      const element = elements[i];
      
      try {
        // Tentar scroll até o elemento
        const locator = this.page.locator(element.selector).first();
        
        try {
          await locator.scrollIntoViewIfNeeded({ timeout: 3000 });
          await this.page.waitForTimeout(500);
        } catch (scrollError) {
          this.log(`Erro no scroll para elemento ${i}: ${scrollError}`, 'warn');
        }

        // Destacar elemento temporariamente para melhor visibilidade
        await this.page.evaluate((selector) => {
          const el = document.querySelector(selector) as HTMLElement;
          if (el) {
            el.style.outline = '3px solid #ff4444';
            el.style.outlineOffset = '2px';
          }
        }, element.selector);

        // Capturar screenshot do elemento
        const filename = `element_${i.toString().padStart(2, '0')}_${element.type}_${this.sanitizeText(element.text)}.png`;
        const localPath = `output/screenshots/elements/${filename}`;

        try {
          const elementHandle = await locator.elementHandle({ timeout: 2000 });
          
          if (elementHandle) {
            const box = await elementHandle.boundingBox();
            if (box) {
              // Screenshot com contexto ao redor
              const padding = 30;
              await this.page.screenshot({
                path: localPath,
                clip: {
                  x: Math.max(0, box.x - padding),
                  y: Math.max(0, box.y - padding),
                  width: Math.min(1920, box.width + (padding * 2)),
                  height: Math.min(1080, box.height + (padding * 2))
                },
                type: 'png'
              });
            }
          } else {
            // Fallback: screenshot por coordenadas
            await this.page.screenshot({
              path: localPath,
              clip: {
                x: Math.max(0, element.position.x - element.size.width / 2),
                y: Math.max(0, element.position.y - element.size.height / 2),
                width: element.size.width + 20,
                height: element.size.height + 20
              },
              type: 'png'
            });
          }

          // Upload para MinIO
          const minioUrl = await this.minioService.uploadScreenshot(localPath, `elements/${filename}`);
          screenshots.push(minioUrl || localPath);

        } catch (captureError) {
          this.log(`Erro ao capturar elemento ${i}: ${captureError}`, 'warn');
        }

        // Remover destaque
        await this.page.evaluate((selector) => {
          const el = document.querySelector(selector) as HTMLElement;
          if (el) {
            el.style.outline = '';
            el.style.outlineOffset = '';
          }
        }, element.selector);

      } catch (error) {
        this.log(`Erro geral no elemento ${i}: ${error}`, 'warn');
      }

      // Pequena pausa entre capturas
      await this.page.waitForTimeout(300);
    }

    this.log(`${screenshots.length} screenshots de elementos capturados`);
    return screenshots;
  }

  private async restoreSession(sessionData: any): Promise<void> {
    if (!this.page || !sessionData) return;

    try {
      // Restaurar localStorage
      if (sessionData.localStorage) {
        const localStorageData = JSON.parse(sessionData.localStorage);
        await this.page.evaluate((data) => {
          for (const [key, value] of Object.entries(data)) {
            localStorage.setItem(key, value as string);
          }
        }, localStorageData);
      }

      // Restaurar sessionStorage
      if (sessionData.sessionStorage) {
        const sessionStorageData = JSON.parse(sessionData.sessionStorage);
        await this.page.evaluate((data) => {
          for (const [key, value] of Object.entries(data)) {
            sessionStorage.setItem(key, value as string);
          }
        }, sessionStorageData);
      }

      this.log('Sessão restaurada com sucesso');

    } catch (error) {
      this.log(`Erro ao restaurar sessão: ${error}`, 'warn');
    }
  }

  private async discoverPageLinks(baseUrl: string): Promise<string[]> {
    if (!this.page) return [];

    try {
      const links = await this.page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        return anchors
          .map(a => (a as HTMLAnchorElement).href)
          .filter(href => 
            href && 
            !href.startsWith('javascript:') && 
            !href.startsWith('mailto:') &&
            !href.startsWith('tel:') &&
            !href.includes('#') &&
            href.length < 200
          );
      }) as string[];

      // Filtrar apenas links do mesmo domínio
      const baseHost = new URL(baseUrl).hostname;
      const filteredLinks = links.filter(link => {
        try {
          const linkHost = new URL(link).hostname;
          return linkHost === baseHost;
        } catch {
          return false;
        }
      });

      const uniqueLinks = Array.from(new Set(filteredLinks));
      this.log(`${uniqueLinks.length} links únicos descobertos em ${baseUrl}`);

      return uniqueLinks;

    } catch (error) {
      this.log(`Erro ao descobrir links: ${error}`, 'error');
      return [];
    }
  }

  private sanitizeUrl(url: string): string {
    return url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
  }

  private sanitizeText(text: string): string {
    return text
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30);
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Diretório já existe ou erro de permissão
    }
  }

  async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    const timestamp = new Date().toISOString();
    
    let report = `# Relatório do CrawlerAgent

**Task ID:** ${taskResult.taskId}
**Timestamp:** ${timestamp}
**Status:** ${taskResult.success ? '✅ Sucesso' : '❌ Falha'}
**Tempo de Processamento:** ${taskResult.processingTime}ms

`;

    if (taskResult.success && taskResult.data) {
      const data = taskResult.data;
      
      report += `## Resultado do Crawling

- **Páginas Processadas:** ${data.pagesProcessed}
- **Total de Elementos:** ${data.totalElements}
- **Screenshots Capturados:** ${data.screenshots?.length || 0}
- **URL Inicial:** ${data.startUrl}

## Páginas Descobertas

`;

      this.allPageData.forEach((page, index) => {
        report += `### ${index + 1}. ${page.title}

- **URL:** ${page.url}
- **Elementos:** ${page.elements.length}
- **Screenshots:** ${page.screenshots.length}
- **Tempo de Carregamento:** ${page.metadata.loadTime}ms

`;
      });

      report += `
## Screenshots Principais

`;
      
      if (data.screenshots) {
        data.screenshots.slice(0, 10).forEach((screenshot: string, index: number) => {
          report += `${index + 1}. ![Screenshot ${index + 1}](${screenshot})\n`;
        });
      }

      report += `
## Próximas Etapas

✅ Dados de crawling coletados com sucesso
🔄 Dados encaminhados para AnalysisAgent
📊 Aguardando análise com IA dos elementos capturados

`;
    } else {
      report += `## Erro no Crawling

**Erro:** ${taskResult.error}

## Ações Recomendadas

- Verificar conectividade de rede
- Verificar se as páginas estão acessíveis
- Verificar se a sessão ainda está válida
- Tentar novamente

`;
    }

    // Salvar relatório no MinIO
    await this.minioService.uploadReportMarkdown(report, this.config.name, taskResult.taskId);

    return report;
  }

  setPage(page: Page): void {
    this.page = page;
  }

  setBrowser(browser: Browser): void {
    this.browser = browser;
  }

  // 📄 MÉTODOS DE PERSISTÊNCIA DE DADOS

  async saveCrawlerDataMarkdown(crawlResults: any[]): Promise<string> {
    const outputDir = path.join(process.cwd(), 'output', 'final_documents');
    await fs.mkdir(outputDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const crawlerFile = `crawler-data-${timestamp}.md`;
    const filePath = path.join(outputDir, crawlerFile);
    
    const markdownContent = this.generateCrawlerMarkdown(crawlResults);
    await fs.writeFile(filePath, markdownContent, 'utf-8');
    
    this.log(`📄 Dados do crawler salvos em: ${crawlerFile}`);
    return filePath;
  }

  private generateCrawlerMarkdown(crawlResults: any[]): string {
    const totalElements = crawlResults.reduce((sum, page) => sum + (page.elements?.length || 0), 0);
    const totalScreenshots = crawlResults.reduce((sum, page) => sum + (page.screenshots?.length || 0), 0);
    
    const pagesContent = crawlResults.map((page, idx) => {
      const elementsContent = page.elements?.map((element: any, elemIdx: number) => `
${elemIdx + 1}. **${element.type}** - "${element.text}"
   - Seletor: \`${element.selector}\`
   - Funcionalidade: ${element.functionality}
   - Importância: ${element.importance}/10
   ${element.screenshot ? `- Screenshot: ${element.screenshot}` : ''}
`).join('\n') || 'Nenhum elemento interativo encontrado';

      const screenshotsContent = page.screenshots?.map((screenshot: string, scrIdx: number) => 
        `${scrIdx + 1}. ${screenshot.split('/').pop()}`
      ).join('\n') || 'Nenhum screenshot capturado';

      return `
## ${idx + 1}. ${page.title}

- **URL**: ${page.url}
- **Elementos Encontrados**: ${page.elements?.length || 0}
- **Screenshots**: ${page.screenshots?.length || 0}
- **Tempo de Processamento**: ${page.processingTime || 'N/A'}ms

### Elementos Interativos
${elementsContent}

### Screenshots Capturados
${screenshotsContent}

### Links Descobertos
${page.links?.map((link: string, linkIdx: number) => `${linkIdx + 1}. ${link}`).join('\n') || 'Nenhum link encontrado'}
`;
    }).join('\n');

    return `# Relatório de Crawling - ${new Date().toLocaleString()}

## 📊 Estatísticas Gerais

- **Total de Páginas Processadas**: ${crawlResults.length}
- **Total de Elementos Interativos**: ${totalElements}
- **Total de Screenshots**: ${totalScreenshots}
- **Tempo de Execução**: ${Date.now()}ms

## 🌐 Páginas Analisadas
${pagesContent}

---
*Relatório gerado automaticamente pelo CrawlerAgent v${this.config.version}*
`;
  }

  async cleanup(): Promise<void> {
    this.visitedPages.clear();
    this.allPageData = [];
    this.page = null;
    this.browser = null;
    this.log('CrawlerAgent finalizado e recursos liberados');
  }
}
