import { chromium, Browser, Page } from 'playwright';
import { APP_CONFIG } from '../config/index.js';
import type { InteractiveElement, InteractionResult } from '../types/index.js';

export class EnhancedNavigationService {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private foundElements: Set<string> = new Set();

  async initialize(): Promise<void> {
    console.log('🎭 Iniciando Enhanced Navigation Service...');
    
    this.browser = await chromium.launch({
      ...APP_CONFIG.PLAYWRIGHT_CONFIG,
      headless: false // Para visualização melhor durante desenvolvimento
    });
    this.page = await this.browser.newPage();
    
    await this.page.setExtraHTTPHeaders({
      'User-Agent': APP_CONFIG.USER_AGENT
    });
    await this.page.setViewportSize(APP_CONFIG.VIEWPORT);
  }

  async navigateToPage(url: string): Promise<boolean> {
    if (!this.page) throw new Error('Página não disponível');

    try {
      await this.page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
      await this.waitForPageStabilization();
      console.log(`✅ Navegação bem-sucedida para: ${url}`);
      return true;
    } catch (error) {
      console.log(`❌ Erro na navegação: ${error instanceof Error ? error.message : error}`);
      return false;
    }
  }

  private async waitForPageStabilization(): Promise<void> {
    if (!this.page) return;
    
    console.log('⏳ Aguardando estabilização da página...');
    
    // Aguardar que o DOM carregue
    await this.page.waitForLoadState('domcontentloaded');
    
    // Aguardar que scripts executem
    await this.page.waitForTimeout(2000);
    
    // Aguardar que menus/componentes dinâmicos carreguem
    await this.page.waitForFunction(() => {
      const body = document.body;
      return body && body.children.length > 0;
    }, { timeout: 10000 });

    console.log('✅ Página estabilizada');
  }

  async detectAllInteractiveElements(): Promise<InteractiveElement[]> {
    if (!this.page) throw new Error('Página não disponível');

    console.log('🔍 Iniciando detecção avançada de elementos...');

    const elements = await this.page.evaluate(() => {
      const results: any[] = [];
      const processedElements = new Set<Element>();

      // Função para obter texto limpo do elemento
      function getElementText(element: Element): string {
        // Priorizar texto direto do elemento
        let text = element.textContent?.trim() || '';
        
        // Se não tiver texto, tentar atributos
        if (!text) {
          text = element.getAttribute('aria-label') ||
                 element.getAttribute('title') ||
                 element.getAttribute('data-title') ||
                 element.getAttribute('placeholder') ||
                 element.getAttribute('alt') || '';
        }
        
        return text.replace(/\s+/g, ' ').trim();
      }

      // Função para verificar visibilidade
      function isVisible(element: Element): boolean {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        
        return rect.width > 0 && 
               rect.height > 0 && 
               rect.top >= 0 && 
               rect.left >= 0 &&
               style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               parseFloat(style.opacity) > 0;
      }

      // Função para gerar seletor específico
      function generateSpecificSelector(element: Element): string {
        // 1. Priorizar ID único
        if (element.id) {
          const idSelector = `#${element.id}`;
          try {
            if (document.querySelectorAll(idSelector).length === 1) {
              return idSelector;
            }
          } catch (e) {
            // Ignorar se ID inválido
          }
        }

        // 2. Usar data attributes se disponíveis
        const dataAttrs = ['data-testid', 'data-cy', 'data-test', 'data-id'];
        for (const attr of dataAttrs) {
          const value = element.getAttribute(attr);
          if (value) {
            const dataSelector = `[${attr}="${value}"]`;
            try {
              if (document.querySelectorAll(dataSelector).length <= 2) {
                return dataSelector;
              }
            } catch (e) {
              // Ignorar se atributo inválido
            }
          }
        }

        // 3. Usar classes significativas
        if (element.className && typeof element.className === 'string') {
          const meaningfulClasses = element.className.split(' ')
            .filter(cls => 
              cls && 
              cls.length > 2 && 
              cls.length < 20 &&
              !cls.startsWith('css-') &&
              !cls.startsWith('_') &&
              !cls.includes('mantine-') &&
              !cls.match(/^[a-z]+\d+$/)
            );
          
          if (meaningfulClasses.length > 0) {
            const selector = `.${CSS.escape(meaningfulClasses[0])}`;
            try {
              if (document.querySelectorAll(selector).length <= 3) {
                return selector;
              }
            } catch (e) {
              // Ignorar se classe inválida
            }
          }
        }

        // 4. Criar seletor baseado na posição dentro do pai
        const parent = element.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children);
          const index = siblings.indexOf(element) + 1;
          const tagName = element.tagName.toLowerCase();
          
          // Tentar seletor mais específico com o contexto do pai
          let parentSelector = '';
          if (parent.id) {
            parentSelector = `#${parent.id}`;
          } else if (parent.className && typeof parent.className === 'string') {
            const parentClasses = parent.className.split(' ')
              .filter(cls => cls && cls.length > 2 && cls.length < 20);
            if (parentClasses.length > 0) {
              try {
                parentSelector = `.${CSS.escape(parentClasses[0])}`;
              } catch (e) {
                // Ignorar se classe inválida
              }
            }
          }
          
          if (parentSelector) {
            return `${parentSelector} > ${tagName}:nth-child(${index})`;
          } else {
            return `${parent.tagName.toLowerCase()} > ${tagName}:nth-child(${index})`;
          }
        }
        
        // 5. Último recurso: usar posição global
        const tagName = element.tagName.toLowerCase();
        const allSimilar = Array.from(document.querySelectorAll(tagName));
        const globalIndex = allSimilar.indexOf(element) + 1;
        
        return `${tagName}:nth-of-type(${globalIndex})`;
      }

      // Função para determinar o contexto do elemento
      function getElementContext(element: Element): string {
        const parent = element.closest('nav, [role="navigation"], .nav, .menu, .sidebar, header, footer');
        if (parent) return 'navigation';
        
        if (element.closest('form')) return 'form';
        if (element.closest('.modal, .dialog, [role="dialog"]')) return 'modal';
        if (element.closest('.dropdown, .menu')) return 'menu';
        
        return 'content';
      }

      // ESTRATÉGIA 1: Detectar todos os menus e estruturas de navegação
      console.log('🧭 Detectando estruturas de navegação...');
      const navigationContainers = document.querySelectorAll(`
        nav, [role="navigation"], .nav, .menu, .navbar, .sidebar,
        [class*="nav"], [class*="menu"], [class*="sidebar"],
        header nav, aside nav, .navigation
      `);

      navigationContainers.forEach(container => {
        if (!isVisible(container)) return;
        
        // Buscar todos os elementos clicáveis dentro da navegação
        const clickableElements = container.querySelectorAll(`
          a, button, 
          [role="menuitem"], [role="button"], [role="link"],
          [onclick], [data-action], [data-target], [data-toggle],
          li a, li button, .menu-item, .nav-item
        `);
        
        clickableElements.forEach(element => {
          if (processedElements.has(element) || !isVisible(element)) return;
          
          const text = getElementText(element);
          if (!text || text.length < 1) return;
          
          processedElements.add(element);
          
          results.push({
            selector: generateSpecificSelector(element),
            text: text,
            type: element.tagName.toLowerCase() === 'button' ? 'button' : 'link',
            context: 'navigation',
            id: element.id || '',
            className: element.className || '',
            href: element.getAttribute('href') || '',
            boundingBox: element.getBoundingClientRect()
          });
        });
      });

      // ESTRATÉGIA 2: Detectar botões de ação principais
      console.log('🔘 Detectando botões de ação...');
      const buttons = document.querySelectorAll(`
        button, input[type="button"], input[type="submit"],
        [role="button"], .btn, .button
      `);
      
      buttons.forEach(button => {
        if (processedElements.has(button) || !isVisible(button)) return;
        
        const text = getElementText(button);
        if (!text || text.length < 1) return;
        
        processedElements.add(button);
        
        results.push({
          selector: generateSpecificSelector(button),
          text: text,
          type: 'button',
          context: getElementContext(button),
          id: button.id || '',
          className: button.className || '',
          boundingBox: button.getBoundingClientRect()
        });
      });

      // ESTRATÉGIA 3: Detectar links importantes
      console.log('🔗 Detectando links...');
      const links = document.querySelectorAll('a[href]');
      
      links.forEach(link => {
        if (processedElements.has(link) || !isVisible(link)) return;
        
        const text = getElementText(link);
        const href = link.getAttribute('href') || '';
        
        // Filtrar links irrelevantes
        if (!text || 
            text.length < 2 || 
            href.startsWith('mailto:') || 
            href.startsWith('tel:') ||
            href.startsWith('#') ||
            href === '/' ||
            text.toLowerCase().includes('home') ||
            text.toLowerCase().includes('início')) return;
        
        processedElements.add(link);
        
        results.push({
          selector: generateSpecificSelector(link),
          text: text,
          type: 'link',
          context: getElementContext(link),
          id: link.id || '',
          className: link.className || '',
          href: href,
          boundingBox: link.getBoundingClientRect()
        });
      });

      console.log(`🎯 Total de elementos detectados: ${results.length}`);
      return results;
    });

    // Filtrar e ordenar elementos por importância
    const filteredElements = elements
      .filter(el => el.text && el.text.length > 0)
      // Remover duplicatas baseadas no texto e posição
      .filter((el, index, arr) => {
        const isDuplicate = arr.findIndex(other => 
          other.text === el.text && 
          Math.abs(other.boundingBox.top - el.boundingBox.top) < 5 &&
          Math.abs(other.boundingBox.left - el.boundingBox.left) < 5
        ) !== index;
        return !isDuplicate;
      })
      .sort((a, b) => {
        // Priorizar navegação
        if (a.context === 'navigation' && b.context !== 'navigation') return -1;
        if (b.context === 'navigation' && a.context !== 'navigation') return 1;
        
        // Priorizar elementos na parte superior da tela
        return a.boundingBox.top - b.boundingBox.top;
      });

    console.log(`✅ ${filteredElements.length} elementos interativos detectados e filtrados`);
    
    return filteredElements;
  }

  async interactWithElement(element: InteractiveElement): Promise<InteractionResult> {
    if (!this.page) throw new Error('Página não disponível');

    const elementKey = `${element.selector}|${element.text}`;
    
    // Evitar interações duplicadas
    if (this.foundElements.has(elementKey)) {
      console.log(`⏭️ Elemento já testado: ${element.text}`);
      return {
        success: false,
        navigationOccurred: false,
        urlChanged: false,
        initialUrl: this.page.url(),
        finalUrl: this.page.url(),
        element: element,
        error: 'Elemento já testado',
        filename: '',
        content: '',
        modalContent: null,
        url: this.page.url(),
        title: await this.page.title()
      };
    }

    console.log(`🔍 Interagindo com: ${element.text} (${element.type}) [${element.context}]`);
    
    const initialUrl = this.page.url();
    
    try {
      // Aguardar estabilização antes da interação
      await this.waitForPageStabilization();
      
      // Tentar múltiplas estratégias de clique
      const clickStrategies = [
        async () => await this.page!.click(element.selector, { timeout: 5000 }),
        async () => await this.page!.click(element.selector, { force: true, timeout: 5000 }),
        async () => await this.page!.locator(element.selector).first().click({ timeout: 5000 }),
        async () => await this.page!.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (el && el instanceof HTMLElement) {
            el.click();
            return true;
          }
          return false;
        }, element.selector)
      ];

      let clickSuccess = false;
      
      for (const strategy of clickStrategies) {
        try {
          await strategy();
          clickSuccess = true;
          break;
        } catch (clickError) {
          console.log(`⚠️ Estratégia de clique falhou: ${clickError instanceof Error ? clickError.message : clickError}`);
        }
      }

      if (!clickSuccess) {
        throw new Error('Todas as estratégias de clique falharam');
      }

      console.log(`✅ Clique realizado em: ${element.text}`);
      
      // Aguardar possíveis mudanças
      await this.page.waitForTimeout(2000);
      
      // Verificar se houve mudança de URL
      const finalUrl = this.page.url();
      const urlChanged = initialUrl !== finalUrl;
      
      // Aguardar estabilização após interação
      await this.waitForPageStabilization();
      
      this.foundElements.add(elementKey);
      
      return {
        success: true,
        navigationOccurred: urlChanged,
        urlChanged: urlChanged,
        initialUrl: initialUrl,
        finalUrl: finalUrl,
        element: element,
        filename: '',
        content: '',
        modalContent: null,
        url: finalUrl,
        title: await this.page.title()
      };
      
    } catch (error) {
      console.log(`❌ Erro na interação: ${error instanceof Error ? error.message : error}`);
      
      return {
        success: false,
        navigationOccurred: false,
        urlChanged: false,
        initialUrl: initialUrl,
        finalUrl: this.page.url(),
        element: element,
        error: error instanceof Error ? error.message : String(error),
        filename: '',
        content: '',
        modalContent: null,
        url: this.page.url(),
        title: await this.page.title()
      };
    }
  }

  async takeScreenshot(filename: string): Promise<string> {
    if (!this.page) throw new Error('Página não disponível');

    try {
      await this.page.screenshot({
        path: filename,
        fullPage: true,
        type: 'png'
      });
      
      console.log(`📷 Screenshot salvo: ${filename}`);
      return filename;
    } catch (error) {
      console.log(`❌ Erro ao capturar screenshot: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      console.log('🔄 Browser fechado com sucesso');
    }
  }

  getPage(): Page | null {
    return this.page;
  }
}
