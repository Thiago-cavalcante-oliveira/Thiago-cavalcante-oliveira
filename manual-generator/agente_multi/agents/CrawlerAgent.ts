import { BaseAgent, AgentConfig, TaskData, TaskResult } from '../core/AgnoSCore';
import { Page, Browser } from 'playwright';
import { MinIOService } from '../services/MinIOService';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  InteractiveElement,
  StaticElement,
  ElementGroup,
  CrawlResult,
  RelatedElement
} from './interfaces/CrawlerTypes.js';

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

export class CrawlerAgent extends BaseAgent {
  private page: Page | null = null;
  private browser: Browser | null = null;
  private minioService: MinIOService;
  private visitedPages: Set<string> = new Set();
  private allPageData: PageData[] = [];

  setPage(page: Page | null): void {
    this.page = page;
    this.log('CrawlerAgent: página definida');
  }

  setBrowser(browser: Browser | null): void {
    this.browser = browser;
    this.log('CrawlerAgent: browser definido');
  }



  constructor() {
    const config: AgentConfig = {
      name: 'CrawlerAgent',
      version: '1.1.0',
      description: 'Agente especializado em navegação web e detecção de elementos interativos e estáticos',
      capabilities: [
        { name: 'web_crawling', description: 'Navegação web inteligente', version: '1.0.0' },
        { name: 'element_detection', description: 'Detecção de elementos', version: '1.1.0' },
        { name: 'interaction_analysis', description: 'Análise de interações', version: '1.0.0' }
      ]
    };

    super(config);
    this.minioService = new MinIOService();
  }

  async initialize(): Promise<void> {
    await this.minioService.initialize();
    this.log('CrawlerAgent inicializado e pronto para navegação');
  }

  private async detectAllElements(): Promise<ElementGroup[]> {
    if (!this.page) return [];

    try {
      const elements = await this.page.evaluate(() => {
        function isElementVisible(element: Element): boolean {
          const rect = element.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) return false;
          
          const style = window.getComputedStyle(element);
          if (style.display === 'none' || style.visibility === 'hidden') return false;
          if (parseFloat(style.opacity) < 0.1) return false;
          
          return true;
        }

        function getInteractivityLevel(element: Element, isStatic: boolean): 'static' | 'interactive' | 'dynamic' {
          if (isStatic) return 'static';
          
          const isDynamic = element.hasAttribute('data-action') ||
                          element.hasAttribute('data-toggle') ||
                          element.hasAttribute('[ng-click]') ||
                          element.hasAttribute('[(ngModel)]') ||
                          element.getAttribute('class')?.includes('dynamic');
          
          return isDynamic ? 'dynamic' : 'interactive';
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

        function getWorkflowContext(element: Element): string {
          const form = element.closest('form');
          if (form) {
            const formId = form.id || 'form';
            const formAction = form.getAttribute('action') || 'submit';
            return `${formId}-${formAction}`;
          }
          
          const modal = element.closest('[role="dialog"], .modal, .popup');
          if (modal) {
            return `modal-${modal.id || 'interaction'}`;
          }
          
          return 'standalone';
        }

        function determineLocation(element: Element): string {
          const rect = element.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const viewportWidth = window.innerWidth;

          if (rect.top < viewportHeight / 3) return 'header';
          if (rect.top > viewportHeight * 2/3) return 'footer';
          if (rect.left < viewportWidth / 4) return 'left-sidebar';
          if (rect.left > viewportWidth * 3/4) return 'right-sidebar';
          return 'main-content';
        }

        function findRelatedElements(element: Element): RelatedElement[] {
          const relatedElements: RelatedElement[] = [];
          
          // Para inputs, procurar labels e mensagens de validação
          if (element.tagName.toLowerCase() === 'input') {
            const inputId = element.getAttribute('id');
            if (inputId) {
              const label = document.querySelector(`label[for="${inputId}"]`);
              if (label) {
                relatedElements.push({
                  type: 'label',
                  relationship: 'describes',
                  dependent: true,
                  selector: `label[for="${inputId}"]`
                });
              }
            }
            
            const validationMessage = element.getAttribute('aria-errormessage');
            if (validationMessage) {
              const messageElement = document.getElementById(validationMessage);
              if (messageElement) {
                relatedElements.push({
                  type: 'validation',
                  relationship: 'validates',
                  dependent: true,
                  selector: `#${validationMessage}`
                });
              }
            }
          }

          // Para botões de submit, relacionar com o formulário
          if (element.getAttribute('type') === 'submit') {
            const form = element.closest('form');
            if (form) {
              const inputs = form.querySelectorAll('input:not([type="submit"]), select, textarea');
              inputs.forEach((input) => {
                relatedElements.push({
                  type: input.tagName.toLowerCase(),
                  relationship: 'submits',
                  dependent: false,
                  selector: generateSelector(input)
                });
              });
            }
          }

          // Para elementos estáticos, identificar elementos aninhados ou relacionados
          if (!element.hasAttribute('type')) {
            const nestedElements = element.querySelectorAll('img, strong, em, code, pre');
            nestedElements.forEach((nested) => {
              relatedElements.push({
                type: nested.tagName.toLowerCase(),
                relationship: 'contains',
                dependent: true,
                selector: generateSelector(nested)
              });
            });
          }

          return relatedElements;
        }

        const elementSelectors = [
          // Elementos de formulário e entrada de dados (Interativos)
          { 
            selector: 'input[type="text"], input[type="email"], input[type="password"]', 
            type: 'input', 
            interactionType: 'input' as const,
            isStatic: false,
            importance: 'primary' as const
          },
          { 
            selector: 'button[type="submit"], input[type="submit"]', 
            type: 'submit',
            interactionType: 'submit' as const,
            isStatic: false,
            importance: 'primary' as const
          },
          { 
            selector: 'textarea', 
            type: 'textarea',
            interactionType: 'input' as const,
            isStatic: false,
            importance: 'primary' as const
          },
          { 
            selector: 'select', 
            type: 'select',
            interactionType: 'select' as const,
            isStatic: false,
            importance: 'primary' as const
          },
          
          // Elementos de interação (Interativos)
          { 
            selector: 'button:not([type="submit"])', 
            type: 'button',
            interactionType: 'click' as const,
            isStatic: false,
            importance: 'primary' as const
          },
          { 
            selector: '[role="button"], [onclick]', 
            type: 'actionable',
            interactionType: 'click' as const,
            isStatic: false,
            importance: 'primary' as const
          },
          { 
            selector: 'a[href]:not([href^="javascript:"]):not([href^="mailto:"])', 
            type: 'link',
            interactionType: 'navigate' as const,
            isStatic: false,
            importance: 'primary' as const
          },
          
          // Elementos de controle (Interativos)
          { 
            selector: 'input[type="checkbox"]', 
            type: 'checkbox',
            interactionType: 'toggle' as const,
            isStatic: false,
            importance: 'secondary' as const
          },
          { 
            selector: 'input[type="radio"]', 
            type: 'radio',
            interactionType: 'select' as const,
            isStatic: false,
            importance: 'secondary' as const
          },
          
          // Elementos dinâmicos
          { 
            selector: '[data-action], [data-toggle], [data-target]', 
            type: 'dynamic',
            interactionType: 'click' as const,
            isStatic: false,
            importance: 'primary' as const
          },

          // Elementos estáticos de conteúdo
          { 
            selector: 'h1, h2, h3, h4, h5, h6', 
            type: 'heading',
            contentType: 'heading' as const,
            isStatic: true,
            importance: 'primary' as const
          },
          { 
            selector: 'p, article, section > div', 
            type: 'text',
            contentType: 'text' as const,
            isStatic: true,
            importance: 'secondary' as const
          },
          { 
            selector: 'img[alt]:not([role="button"])', 
            type: 'image',
            contentType: 'image' as const,
            isStatic: true,
            importance: 'secondary' as const
          },
          { 
            selector: 'label:not([for]), span[aria-label]', 
            type: 'description',
            contentType: 'description' as const,
            isStatic: true,
            importance: 'secondary' as const
          }
        ];

        const groups: ElementGroup[] = [];

        // Processar cada tipo de elemento
        elementSelectors.forEach(({ selector, type, interactionType, contentType, isStatic, importance }) => {
          const elements = document.querySelectorAll(selector);
          
          elements.forEach((element) => {
            if (!isElementVisible(element)) return;

            // Extrair propósito e conteúdo do elemento
            const purpose = element.getAttribute('aria-label') ||
                          element.getAttribute('title') ||
                          element.getAttribute('name') ||
                          element.getAttribute('placeholder') ||
                          element.textContent?.trim() ||
                          type;

            // Identificar elementos relacionados
            const relatedElements = findRelatedElements(element);
            
            // Criar grupo de elementos
            let primary: InteractiveElement | StaticElement;
            
            if (isStatic) {
              primary = {
                type,
                purpose: purpose?.substring(0, 100) || type,
                selector: generateSelector(element),
                content: element.textContent?.trim() || element.getAttribute('alt') || '',
                contentType: contentType!,
                isStatic: true
              };
            } else {
              primary = {
                type,
                purpose: purpose?.substring(0, 100) || type,
                selector: generateSelector(element),
                action: interactionType! || 'click', // Default to click if not specified
                required: element.hasAttribute('required'),
                interactionType: interactionType!,
                isStatic: false
              };
            }

            const elementGroup: ElementGroup = {
              primary,
              related: relatedElements,
              context: {
                workflow: getWorkflowContext(element),
                location: determineLocation(element),
                importance: importance,
                interactivityLevel: getInteractivityLevel(element, isStatic)
              }
            };

            groups.push(elementGroup);
          });
        });

        return groups;
      });

      // Calcular estatísticas
      const stats = {
        staticElements: elements.filter(g => (g.primary as any).isStatic).length,
        interactiveElements: elements.filter(g => !(g.primary as any).isStatic).length,
        totalElements: elements.length
      };

      this.log(`Elementos detectados: ${stats.totalElements} (${stats.staticElements} estáticos, ${stats.interactiveElements} interativos)`);
      return elements;

    } catch (error) {
      this.log(`Erro ao detectar elementos: ${error}`, 'error');
      return [];
    }
  }

  async processTask(task: TaskData): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      switch (task.type) {
        case 'start_crawl':
          const result = await this.processPage(task.data.url);
          console.log("CrawlerAgent result:", JSON.stringify(result, null, 2));
          // Sempre retorna crawlResults como array para compatibilidade com AnalysisAgent
          return {
            id: task.id,
            taskId: task.id,
            success: true,
            data: {
              crawlResults: [result],
              pagesProcessed: 1,
              totalElements: result.stats.totalElements,
              staticElements: result.stats.staticElements,
              interactiveElements: result.stats.interactiveElements
            },
            timestamp: new Date(),
            processingTime: Date.now() - startTime
          };
        case 'start_authenticated_crawl':
          const authResult = await this.processPage(task.data.url);
          return {
            id: task.id,
            taskId: task.id,
            success: true,
            data: {
              crawlResults: authResult,
              pagesProcessed: 1,
              totalElements: authResult.elements.length,
              sessionData: task.data.sessionData,
              authContext: task.data.authContext
            },
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

  private async processPage(url: string): Promise<CrawlResult> {
    if (!this.page) throw new Error('Página não disponível');

    try {
      // Navegar para a página
      await this.page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });

      // Aguardar estabilização
      await this.page.waitForTimeout(3000);

      // Capturar título
      const title = await this.page.title();
      
      // Detectar elementos
      const elements = await this.detectAllElements();

      // Calcular estatísticas
      const stats = {
        staticElements: elements.filter(g => (g.primary as StaticElement).isStatic).length,
        interactiveElements: elements.filter(g => !(g.primary as StaticElement).isStatic).length,
        totalElements: elements.length
      };

      // Agrupar elementos por workflow
      const workflows = this.groupElementsByWorkflow(elements);

      return {
        url,
        title,
        elements,
        workflows,
        stats,
        metadata: {
          timestamp: new Date(),
          loadTime: 0,
          elementCount: elements.length
        }
      };

    } catch (error) {
      this.log(`Erro ao processar página ${url}: ${error}`, 'error');
      throw error;
    }
  }

  private groupElementsByWorkflow(elements: ElementGroup[]): Array<{
    name: string;
    steps: string[];
    elements: string[];
  }> {
    const workflowMap = new Map<string, {
      elements: string[];
      steps: Set<string>;
    }>();

    elements.forEach(group => {
      const workflow = group.context.workflow;
      if (!workflowMap.has(workflow)) {
        workflowMap.set(workflow, {
          elements: [],
          steps: new Set()
        });
      }

      const current = workflowMap.get(workflow)!;
      current.elements.push(group.primary.selector);

      if (!('isStatic' in group.primary) || !group.primary.isStatic) {
        const interactive = group.primary as InteractiveElement;
        current.steps.add(`${interactive.action} ${interactive.type}`);
      }
    });

    return Array.from(workflowMap.entries()).map(([name, data]) => ({
      name,
      steps: Array.from(data.steps),
      elements: data.elements
    }));
  }

  async cleanup(): Promise<void> {
    this.visitedPages.clear();
    this.allPageData = [];
    this.page = null;
    this.browser = null;
    this.log('CrawlerAgent finalizado e recursos liberados');
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
      // Suporte a dois formatos: CrawlResult (com .stats) e stats simples
      const data: any = taskResult.data;
      let totalElements, staticElements, interactiveElements, url, title, workflows, elements;
      if (data.stats && data.elements && data.workflows) {
        // Formato CrawlResult
        totalElements = data.stats.totalElements;
        staticElements = data.stats.staticElements;
        interactiveElements = data.stats.interactiveElements;
        url = data.url;
        title = data.title;
        workflows = data.workflows;
        elements = data.elements;
      } else {
        // Formato simples
        totalElements = data.totalElements;
        staticElements = data.staticElements;
        interactiveElements = data.interactiveElements;
        url = data.url || '-';
        title = data.title || '-';
        workflows = [];
        elements = [];
      }

      report += `## Análise da Página

- **URL:** ${url}
- **Título:** ${title}
- **Elementos Totais:** ${totalElements}
  - Elementos Estáticos: ${staticElements}
  - Elementos Interativos: ${interactiveElements}

## Workflows Detectados

${workflows && workflows.length > 0 ? workflows.map((wf: any, idx: number) => `
### ${idx + 1}. ${wf.name}

- **Passos:** ${wf.steps.join(' → ')}
- **Elementos:** ${wf.elements.length}
`).join('\n') : 'Nenhum workflow detectado.'}

## Elementos por Tipo

${elements && elements.length > 0 ? JSON.stringify(elements.reduce((acc: any, el: any) => {
  const type = el.primary.type;
  if (!acc[type]) acc[type] = 0;
  acc[type]++;
  return acc;
}, {}), null, 2) : 'Sem elementos detalhados.'}

---
*Relatório gerado em: ${new Date().toLocaleString()}*
`;
    } else {
      report += `## Erro no Processamento

**Erro:** ${taskResult.error}

## Ações Recomendadas

- Verificar conectividade de rede
- Verificar se a página está acessível
- Verificar permissões de acesso
- Tentar novamente em alguns minutos
`;
    }

    return report;
  }
}