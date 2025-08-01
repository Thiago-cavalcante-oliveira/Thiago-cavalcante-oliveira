import { chromium, Browser, Page } from 'playwright';
import { APP_CONFIG, NAVIGATION_STRATEGIES, SELECTORS, LINK_FILTERS } from '../config/index.js';
import type { InteractiveElement, InteractionResult, NavigationStrategy } from '../types/index.js';

export class PlaywrightService {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async initialize(): Promise<void> {
    console.log('🎭 Iniciando Playwright...');
    
    this.browser = await chromium.launch(APP_CONFIG.PLAYWRIGHT_CONFIG);
    this.page = await this.browser.newPage();
    
    // Configurar User-Agent e viewport
    await this.page.setExtraHTTPHeaders({
      'User-Agent': APP_CONFIG.USER_AGENT
    });
    await this.page.setViewportSize(APP_CONFIG.VIEWPORT);
  }

  async navigateToPage(url: string): Promise<boolean> {
    if (!this.page) {
      throw new Error('Página não está disponível');
    }

    let navigationSuccess = false;
    
    for (let i = 0; i < NAVIGATION_STRATEGIES.length && !navigationSuccess; i++) {
      try {
        console.log(`🔄 Tentativa de navegação ${i + 1}/${NAVIGATION_STRATEGIES.length}...`);
        
        // Aguardar navegação e carregamento usando Promise.race para timeout robusto
        await Promise.race([
          this.page.goto(url, NAVIGATION_STRATEGIES[i]),
          this.page.waitForTimeout(30000) // Fallback timeout
        ]);
        
        // Aguardar que a página esteja completamente carregada
        await this.waitForPageLoad();
        
        navigationSuccess = true;
        console.log(`✅ Navegação bem-sucedida com estratégia ${i + 1}`);
      } catch (navError) {
        console.log(`⚠️ Falha na estratégia ${i + 1}: ${navError instanceof Error ? navError.message : navError}`);
        if (i === NAVIGATION_STRATEGIES.length - 1) {
          throw navError;
        }
      }
    }
    
    // Verificar se a página carregou corretamente
    await this.logPageInfo();
    
    return navigationSuccess;
  }

  private async waitForPageLoad(): Promise<void> {
    if (!this.page) return;
    
    console.log('⏳ Aguardando carregamento completo da página...');
    
    try {
      // Aguardar que o DOM esteja carregado
      await this.page.waitForLoadState('domcontentloaded');
      
      // Aguardar que todos os recursos (imagens, CSS, JS) sejam carregados
      await this.page.waitForLoadState('networkidle');
      
      // Aguardar que o body esteja visível e tenha conteúdo
      await this.page.waitForSelector('body', { state: 'visible' });
      
      // Aguardar que pelo menos algum conteúdo texto esteja presente
      await this.page.waitForFunction(() => {
        return document.body && document.body.innerText.trim().length > 0;
      }, { timeout: 10000 });
      
      console.log('✅ Página completamente carregada');
      
    } catch (error) {
      console.log('⚠️ Timeout no carregamento, mas continuando...');
      // Continuar execução mesmo se houver timeout
    }
  }

  private async logPageInfo(): Promise<void> {
    if (!this.page) return;
    
    const currentUrl = this.page.url();
    const title = await this.page.title();
    console.log(`📄 URL atual: ${currentUrl}`);
    console.log(`📋 Título da página: ${title}`);
    
    // Verificar se há conteúdo visível
    const bodyText = await this.page.evaluate(() => {
      return document.body?.innerText?.substring(0, 500) || 'Sem conteúdo detectado'; // Using hardcoded value instead of APP_CONFIG
    });
    console.log(`📝 Prévia do conteúdo: ${bodyText}...`);
  }

  async scrollAndLoadContent(): Promise<void> {
    if (!this.page) return;
    
    console.log('📜 Fazendo scroll para carregar conteúdo dinâmico...');
    
    try {
      // Primeira tentativa: aguardar que elementos comuns estejam carregados
      await this.page.waitForSelector('body', { state: 'visible', timeout: 5000 });
      
      // Scroll inteligente usando Playwright
      const initialHeight = await this.page.evaluate(() => document.body.scrollHeight);
      
      await this.page.evaluate(async () => {
        // Scroll suave até o final da página para carregar conteúdo lazy-load
        await new Promise<void>((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;
            
            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }, 100);
        });
      });
      
      // Aguardar que possível conteúdo dinâmico seja carregado
      const finalHeight = await this.page.evaluate(() => document.body.scrollHeight);
      
      if (finalHeight > initialHeight) {
        console.log(`📏 Conteúdo dinâmico detectado: altura inicial ${initialHeight}px → ${finalHeight}px`);
        // Aguardar estabilização da página após carregamento dinâmico
        await this.page.waitForLoadState('networkidle', { timeout: 5000 });
      }
      
      // Voltar ao topo da página
      await this.page.evaluate(() => window.scrollTo(0, 0));
      
      // Aguardar que a página estabilize após o scroll
      await this.page.waitForTimeout(1000);
      
    } catch (error) {
      console.log('⚠️ Erro durante scroll, continuando...', error instanceof Error ? error.message : error);
    }
  }

  async captureScreenshot(filename: string, outputDir: string): Promise<string> {
    if (!this.page) {
      throw new Error('Página não está disponível para screenshot');
    }
    
    const filepath = `${outputDir}/${filename}`;
    await this.page.screenshot({ 
      path: filepath, 
      fullPage: true 
    });
    console.log(`📷 Screenshot salvo: ${filename}`);
    
    return filename;
  }

  async detectInteractiveElements(): Promise<InteractiveElement[]> {
    if (!this.page) {
      throw new Error('Página não está disponível para detecção de elementos');
    }
    
    console.log('🔍 Detectando elementos interativos...');
    
    const config = {
      SELECTORS,
      LINK_FILTERS,
      MAX_ELEMENTS: APP_CONFIG.LIMITS.MAX_INTERACTIVE_ELEMENTS
    };
    
    return await this.page.evaluate((config) => {
      const interactiveElements: any[] = [];
      
      // Função auxiliar para extrair texto limpo
      function getCleanText(element: Element): string {
        const text = element.textContent?.trim() || 
                    element.getAttribute('aria-label') || 
                    element.getAttribute('title') || 
                    element.getAttribute('placeholder') || 
                    element.getAttribute('data-title') || '';
        return text.replace(/\s+/g, ' ').trim();
      }
      
      // Função para verificar se elemento está visível
      function isElementVisible(element: Element): boolean {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               rect.width > 0 && 
               rect.height > 0;
      }
      
      // Função para gerar seletor único e específico
      function generateSelector(element: Element, type: string, index: number): string {
        // Tentar ID primeiro
        if (element.id) return `#${element.id}`;
        
        // Criar um seletor específico para o elemento
        const tagName = element.tagName.toLowerCase();
        
        // Para links com texto específico
        if (tagName === 'a') {
          const text = element.textContent?.trim();
          if (text && text.length < 50) {
            // Escapar aspas no texto para evitar problemas no seletor
            const escapedText = text.replace(/"/g, '\\"');
            return `a:has-text("${escapedText}")`;
          }
        }
        
        // Para botões com texto específico
        if (tagName === 'button') {
          const text = element.textContent?.trim();
          if (text && text.length < 50) {
            const escapedText = text.replace(/"/g, '\\"');
            return `button:has-text("${escapedText}")`;
          }
        }
        
        // Tentar classes específicas (não todas as classes)
        if (element.className) {
          const classes = element.className.split(' ')
            .filter(c => c.length > 0 && 
                        !c.includes('mantine') && 
                        !c.includes('css-') && 
                        !c.startsWith('_') &&
                        c.length < 20);
          if (classes.length > 0) {
            return `.${classes[0]}`;
          }
        }
        
        // Usar xpath como alternativa mais precisa
        let xpath = '';
        let currentElement: Element | null = element;
        const pathParts = [];
        
        while (currentElement && currentElement !== document.documentElement) {
          let part = currentElement.tagName.toLowerCase();
          
          if (currentElement.id) {
            pathParts.unshift(`${part}[@id="${currentElement.id}"]`);
            break;
          } else {
            const parent = currentElement.parentElement;
            if (parent) {
              const siblings = Array.from(parent.children)
                .filter(sibling => sibling.tagName === currentElement!.tagName);
              
              if (siblings.length > 1) {
                const position = siblings.indexOf(currentElement) + 1;
                part += `[${position}]`;
              }
            }
            
            pathParts.unshift(part);
          }
          
          currentElement = currentElement.parentElement;
        }
        
        // Retornar xpath simplificado ou fallback
        if (pathParts.length > 0 && pathParts.length < 5) {
          return `//${pathParts.join('/')}`;
        }
        
        // Último recurso: seletor por posição com tagname correto
        return `${tagName}:nth-of-type(${index + 1})`;
      }
      
      // 1. DETECTAR MENUS E NAVEGAÇÃO PRINCIPAL
      console.log('🧭 Detectando menus de navegação...');
      const navigationSelectors = config.SELECTORS.NAVIGATION.split(',').map(s => s.trim());
      navigationSelectors.forEach(selector => {
        try {
          const navElements = document.querySelectorAll(selector);
          navElements.forEach((nav, navIndex) => {
            if (!isElementVisible(nav)) return;
            
            // Encontrar itens clicáveis dentro da navegação
            const menuItems = nav.querySelectorAll('a, button, li, [role="menuitem"], [data-action]');
            menuItems.forEach((item, itemIndex) => {
              if (!isElementVisible(item)) return;
              
              const text = getCleanText(item);
              if (text && text.length >= 2 && text.length <= 50) {
                // Criar seletor mais específico baseado no texto do elemento
                let specificSelector = '';
                const text = getCleanText(item);
                const tagName = item.tagName.toLowerCase();
                
                if (item.id) {
                  specificSelector = `#${item.id}`;
                } else if (tagName === 'a' && text) {
                  specificSelector = `a:has-text("${text.replace(/"/g, '\\"')}")`;
                } else if (tagName === 'button' && text) {
                  specificSelector = `button:has-text("${text.replace(/"/g, '\\"')}")`;
                } else {
                  // Usar um seletor mais específico com contexto de navegação
                  specificSelector = `nav a:has-text("${text.replace(/"/g, '\\"')}")`;
                }
                
                interactiveElements.push({
                  selector: specificSelector,
                  text: text,
                  type: item.tagName.toLowerCase() === 'button' ? 'button' : 'link',
                  id: item.id || '',
                  className: item.className || '',
                  context: 'navigation'
                });
              }
            });
          });
        } catch (e) {
          // Continuar se o seletor falhar
        }
      });
      
      // 2. DETECTAR BOTÕES ESPECÍFICOS
      console.log('🔘 Detectando botões...');
      const buttons = document.querySelectorAll(config.SELECTORS.BUTTONS);
      buttons.forEach((btn, index) => {
        if (!isElementVisible(btn)) return;
        
        const text = getCleanText(btn);
        if (text && text.length > 0 && text.length < 100) {
          let selector = '';
          if (btn.id) {
            selector = `#${btn.id}`;
          } else {
            selector = `button:has-text("${text.replace(/"/g, '\\"')}")`;
          }
          
          interactiveElements.push({
            selector: selector,
            text: text,
            type: 'button',
            id: btn.id,
            className: btn.className,
            context: 'action'
          });
        }
      });
      
      // 3. DETECTAR ELEMENTOS EXPANSÍVEIS (dropdowns, acordeões)
      console.log('📋 Detectando elementos expansíveis...');
      const expandableSelectors = config.SELECTORS.EXPANDABLE.split(',').map(s => s.trim());
      expandableSelectors.forEach(selector => {
        try {
          const expandables = document.querySelectorAll(selector);
          expandables.forEach((elem, index) => {
            if (!isElementVisible(elem)) return;
            
            const text = getCleanText(elem);
            if (text && text.length >= 2 && text.length <= 50) {
              interactiveElements.push({
                selector: generateSelector(elem, 'expandable', index),
                text: text,
                type: elem.tagName.toLowerCase() === 'button' ? 'button' : 'clickable',
                id: elem.id,
                className: elem.className,
                context: 'expandable'
              });
            }
          });
        } catch (e) {
          // Continuar se o seletor falhar
        }
      });
      
      // 4. DETECTAR CARDS E PAINÉIS INTERATIVOS
      console.log('🃏 Detectando cards e painéis...');
      const cardSelectors = config.SELECTORS.CARDS.split(',').map(s => s.trim());
      cardSelectors.forEach(selector => {
        try {
          const cards = document.querySelectorAll(selector);
          cards.forEach((card, index) => {
            if (!isElementVisible(card)) return;
            
            // Procurar elementos clicáveis dentro do card
            const clickables = card.querySelectorAll('a, button, [onclick], [data-action]');
            if (clickables.length > 0) {
              clickables.forEach((clickable, clickIndex) => {
                if (!isElementVisible(clickable)) return;
                
                const text = getCleanText(clickable);
                if (text && text.length >= 2 && text.length <= 50) {
                  interactiveElements.push({
                    selector: generateSelector(clickable, 'card-item', clickIndex),
                    text: text,
                    type: clickable.tagName.toLowerCase() === 'button' ? 'button' : 'link',
                    id: clickable.id,
                    className: clickable.className,
                    context: 'card'
                  });
                }
              });
            } else if ((card as any).onclick || card.getAttribute('data-action')) {
              // O próprio card é clicável
              const text = getCleanText(card);
              if (text && text.length >= 2 && text.length <= 100) {
                interactiveElements.push({
                  selector: generateSelector(card, 'card', index),
                  text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
                  type: 'clickable',
                  id: card.id,
                  className: card.className,
                  context: 'card'
                });
              }
            }
          });
        } catch (e) {
          // Continuar se o seletor falhar
        }
      });
      
      // 5. DETECTAR LINKS IMPORTANTES
      console.log('🔗 Detectando links importantes...');
      const links = document.querySelectorAll(config.SELECTORS.LINKS);
      links.forEach((link, index) => {
        if (!isElementVisible(link)) return;
        
        const text = getCleanText(link);
        const href = link.getAttribute('href') || '';
        
        // Filtrar links relevantes - mais permissivo para capturar navegação
        if (text && 
            text.length >= 2 && 
            text.length <= 50 && 
            !config.LINK_FILTERS.EXCLUDED_PROTOCOLS.some((protocol: string) => href.startsWith(protocol)) &&
            !href.startsWith('javascript:void') &&
            text.toLowerCase() !== 'home' &&
            text.toLowerCase() !== 'voltar') {
          
          interactiveElements.push({
            selector: generateSelector(link, 'link', index),
            text: text,
            type: 'link',
            id: link.id,
            className: link.className,
            context: 'link'
          });
        }
      });
      
      // 6. DETECTAR ELEMENTOS COM TEXTO CLICÁVEL
      console.log('📝 Detectando texto clicável...');
      const textClickableSelectors = config.SELECTORS.TEXT_CLICKABLE.split(',').map(s => s.trim());
      textClickableSelectors.forEach(selector => {
        try {
          const textClickables = document.querySelectorAll(selector);
          textClickables.forEach((elem, index) => {
            if (!isElementVisible(elem)) return;
            
            const text = getCleanText(elem);
            if (text && text.length >= 2 && text.length <= 50) {
              interactiveElements.push({
                selector: generateSelector(elem, 'text-clickable', index),
                text: text,
                type: 'clickable',
                id: elem.id,
                className: elem.className,
                context: 'text'
              });
            }
          });
        } catch (e) {
          // Continuar se o seletor falhar
        }
      });
      
      // Remover duplicatas baseado no texto e posição
      const uniqueElements = interactiveElements.reduce((acc: any[], current: any) => {
        const exists = acc.find((item: any) => 
          item.text === current.text && 
          item.type === current.type &&
          Math.abs(acc.indexOf(item) - interactiveElements.indexOf(current)) < 3
        );
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      console.log(`🎯 Encontrados ${uniqueElements.length} elementos interativos únicos`);
      
      return uniqueElements.slice(0, config.MAX_ELEMENTS);
    }, config);
  }

  async waitForPageChanges(): Promise<void> {
    if (!this.page) return;
    
    try {
      console.log('⏳ Aguardando mudanças na página...');
      
      // Aguardar possíveis modals, popups ou mudanças na URL
      await Promise.race([
        // Aguardar modal aparecer
        this.page.waitForSelector(SELECTORS.MODALS, { state: 'visible', timeout: 2000 }).then(() => {
          console.log('📱 Modal detectado');
        }),
        
        // Aguardar mudança na URL para SPAs (verificação mais robusta)
        this.page.waitForFunction((startUrl) => {
          return window.location.href !== startUrl;
        }, this.page.url(), { timeout: 3000 }).then(() => {
          console.log('🔄 Mudança de rota detectada');
        }),
        
        // Aguardar mudanças significativas no conteúdo da página
        this.page.waitForFunction(() => {
          // Detectar modais visíveis
          const modals = document.querySelectorAll('[role="dialog"], .modal, .popup, .overlay, [data-modal], .MuiDialog-root');
          const hasVisibleModal = Array.from(modals).some(modal => {
            const style = window.getComputedStyle(modal);
            return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
          });
          
          if (hasVisibleModal) return true;
          
          // Detectar mudanças no conteúdo principal (mais sensível)
          const mainContent = document.querySelector('main, .main, #main, .content, .page-content, [role="main"], body') || document.body;
          if (mainContent) {
            const currentContentLength = mainContent.innerHTML.length;
            const currentTextLength = mainContent.textContent?.length || 0;
            
            // Armazenar comprimentos iniciais se não existirem
            if (!(window as any).initialContentState) {
              (window as any).initialContentState = {
                htmlLength: currentContentLength,
                textLength: currentTextLength,
                timestamp: Date.now()
              };
              return false;
            }
            
            // Calcular mudanças percentuais
            const htmlDiff = Math.abs(currentContentLength - (window as any).initialContentState.htmlLength);
            const textDiff = Math.abs(currentTextLength - (window as any).initialContentState.textLength);
            
            const htmlChangePercent = (window as any).initialContentState.htmlLength > 0 ? htmlDiff / (window as any).initialContentState.htmlLength : 0;
            const textChangePercent = (window as any).initialContentState.textLength > 0 ? textDiff / (window as any).initialContentState.textLength : 0;
            
            // Detectar mudança significativa (mais que 3% de diferença no HTML ou 5% no texto)
            if (htmlChangePercent > 0.03 || textChangePercent > 0.05) {
              console.log(`🔄 Mudança de conteúdo: HTML ${(htmlChangePercent * 100).toFixed(1)}%, Texto ${(textChangePercent * 100).toFixed(1)}%`);
              return true;
            }
            
            // Detectar novos elementos importantes
            const importantSelectors = ['table', 'form', '.card', '.panel', '.list-item', 'ul li', '.row', '.col', '.grid-item'];
            let hasNewImportantElements = false;
            
            for (const selector of importantSelectors) {
              const elements = mainContent.querySelectorAll(selector);
              const storageKey = `count_${selector.replace(/[^a-zA-Z0-9]/g, '_')}`;
              const previousCount = (window as any).initialContentState[storageKey] || 0;
              const currentCount = elements.length;
              
              if (currentCount !== previousCount) {
                console.log(`� Novos elementos ${selector}: ${currentCount} vs ${previousCount}`);
                hasNewImportantElements = true;
                (window as any).initialContentState[storageKey] = currentCount;
              }
            }
            
            return hasNewImportantElements;
          }
          
          return false;
        }, { timeout: 5000 }).then(() => {
          console.log('🎭 Mudança significativa no conteúdo detectada');
        }),
        
        // Aguardar que a rede estabilize (para SPAs)
        this.page.waitForLoadState('networkidle', { timeout: 3000 }).then(() => {
          console.log('🌐 Rede estabilizada');
        }),
        
        // Timeout padrão
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
      
      // Pequena pausa adicional para garantir que mudanças sejam completadas
      await this.page.waitForTimeout(500);
      
    } catch (error) {
      // Timeout é esperado se não houver mudanças significativas
      console.log('⚡ Nenhuma mudança significativa detectada');
    }
  }

  async interactWithElement(element: InteractiveElement, screenshotIndex: number, outputDir: string): Promise<InteractionResult | null> {
    if (!this.page) {
      throw new Error('Página não está disponível para interação');
    }
    
    console.log(`🔍 Interagindo com: ${element.text} (${element.type}) [${element.context || 'geral'}]`);
    
    // Capturar URL inicial antes da interação
    const initialUrl = this.page.url();
    console.log(`📍 URL inicial: ${initialUrl}`);
    
    try {
      // Aguardar que a página esteja completamente carregada antes da interação
      await this.waitForContentStability();
      
      let locator: any = null;
      
      // Estratégias de busca melhoradas por contexto
      const strategies = [
        // 1. Por ID se disponível (mais confiável)
        element.id ? this.page.locator(`#${element.id}`) : null,
        
        // 2. Por seletor direto se disponível
        element.selector ? this.page.locator(element.selector) : null,
        
        // 3. Por texto exato primeiro (mais preciso)
        this.page.getByText(element.text, { exact: true }),
        
        // 4. Por texto específico baseado no tipo e contexto
        element.type === 'button' ? 
          this.page.locator('button').filter({ hasText: new RegExp(element.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }) : null,
        element.type === 'link' ? 
          this.page.locator('a').filter({ hasText: new RegExp(element.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }) : null,
        
        // 5. Para elementos de navegação específicos
        element.context === 'navigation' ? this.page.locator('nav a, .nav a, .menu a, .sidebar a').filter({ hasText: new RegExp(element.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }) : null,
        element.context === 'navigation' ? this.page.locator('nav button, .nav button, .menu button, .sidebar button').filter({ hasText: new RegExp(element.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }) : null,
        
        // 6. Por classe específica se disponível (não vazias)
        (element.className && element.className.trim()) ? 
          this.page.locator(`.${element.className.split(' ')[0]}`).filter({ hasText: new RegExp(element.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }) : null,
        
        // 7. Por atributos ARIA e acessibilidade
        this.page.locator(`[aria-label*="${element.text}"]`),
        this.page.locator(`[title*="${element.text}"]`),
        
        // 8. Busca mais ampla por texto (fallback)
        this.page.getByText(element.text, { exact: false }),
        
        // 9. Busca por texto parcial com :has-text
        this.page.locator(`*:has-text("${element.text}")`).first()
      ].filter(Boolean);

      // Tentar cada estratégia até encontrar um elemento visível
      for (const strategy of strategies) {
        if (!strategy) continue; // Pular estratégias nulas
        
        try {
          await strategy.waitFor({ state: 'visible', timeout: 1000 });
          if (await strategy.isVisible()) {
            locator = strategy.first(); // Pegar o primeiro se houver múltiplos
            break;
          }
        } catch (e) {
          continue; // Tentar próxima estratégia
        }
      }

      if (!locator) {
        console.log(`⚠️ Elemento não visível: ${element.text}`);
        return null;
      }

      // Aguardar que o elemento esteja pronto para interação
      await locator.waitFor({ state: 'visible' });
      
      // Destacar o elemento que será clicado para melhor visualização
      await locator.evaluate((el: any) => {
        el.style.outline = '3px solid red';
        el.style.outlineOffset = '2px';
        el.style.backgroundColor = 'yellow';
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      
      // Aguardar para visualização do destaque
      await this.page.waitForTimeout(2000);
      
      // Scroll até o elemento se necessário
      await locator.scrollIntoViewIfNeeded();
      
      // Aguardar que seja clicável
      await locator.waitFor({ state: 'attached' });
      
      // Aguardar um momento para garantir que animações completem
      await this.page.waitForTimeout(500);

      // Capturar informações do elemento antes do clique
      const elementInfo = await locator.evaluate((el: any) => ({
        tagName: el.tagName,
        href: el.getAttribute('href'),
        onclick: el.getAttribute('onclick'),
        type: el.getAttribute('type'),
        role: el.getAttribute('role'),
        classList: Array.from(el.classList),
        dataset: Object.fromEntries(Object.entries(el.dataset)),
        disabled: el.hasAttribute('disabled'),
        hasJSClick: el.onclick !== null || el.addEventListener !== undefined
      }));
      
      console.log(`🔍 Info do elemento:`, elementInfo);
      
      // Realizar a interação
      await locator.click({ timeout: 5000 });
      console.log(`✅ Clique realizado em: ${element.text}`);

      // Remover destaque após o clique
      await locator.evaluate((el: any) => {
        el.style.outline = '';
        el.style.outlineOffset = '';
        el.style.backgroundColor = '';
      }).catch(() => {}); // Ignorar erro se elemento não existir mais

      // Aguardar mais tempo para visualizar o resultado do clique
      await this.page.waitForTimeout(2000);

      // Para links com href="#" ou sem href, aguardar mais tempo para mudanças JS
      if (elementInfo.tagName === 'A' && (!elementInfo.href || elementInfo.href === '#' || elementInfo.href.includes('#'))) {
        console.log(`🔍 Link suspeito detectado (href: ${elementInfo.href}), aguardando mudanças JS...`);
        await this.page.waitForTimeout(2000); // Aguardar mais tempo para SPAs
      }

      // Aguardar mudanças na página
      await this.waitForPageChanges();
      
      // Verificar se houve mudança de URL
      const finalUrl = this.page.url();
      const urlChanged = initialUrl !== finalUrl;
      if (urlChanged) {
        console.log(`🔀 URL mudou de: ${initialUrl}`);
        console.log(`🔀 URL nova: ${finalUrl}`);
      } else {
        console.log(`📍 URL mantida: ${finalUrl}`);
      }

      // Aguardar que o conteúdo estabilize após a interação
      await this.waitForContentStability();

      // Capturar screenshot do novo estado
      const filename = `screenshot_${screenshotIndex}.png`;
      await this.captureScreenshot(filename, outputDir);

      // Extrair conteúdo da página/modal
      const content = await this.page.content();
      
      // Verificar se há modal aberto
      const modalContent = await this.extractModalContent();

      return {
        element,
        filename,
        content: content.substring(0, 10000), // Using hardcoded value instead of APP_CONFIG
        modalContent,
        url: this.page.url(),
        title: await this.page.title(),
        success: true,
        navigationOccurred: false,
        urlChanged: false,
        initialUrl: this.page.url(),
        finalUrl: this.page.url()
      };

    } catch (error) {
      console.log(`❌ Erro ao interagir com ${element.text}:`, error);
      return null;
    }
  }

  private async tryFindByText(element: InteractiveElement): Promise<any> {
    if (!this.page) return null;
    
    try {
      if (element.type === 'button') {
        const locator = this.page.locator(`button:has-text("${element.text}")`).first();
        if (await locator.count() > 0) {
          return locator;
        }
      } else if (element.type === 'link') {
        const locator = this.page.locator(`a:has-text("${element.text}")`).first();
        if (await locator.count() > 0) {
          return locator;
        }
      }
    } catch (e) {
      return null;
    }
    
    return null;
  }

  private async extractModalContent(): Promise<string | null> {
    if (!this.page) return null;
    
    return await this.page.evaluate(() => {
      const modals = document.querySelectorAll('[role="dialog"], .modal, .popup, .overlay');
      let modalText = '';
      
      modals.forEach(modal => {
        const style = window.getComputedStyle(modal);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          modalText += modal.textContent || '';
        }
      });
      
      return modalText.trim() || null;
    });
  }

  async closeModal(): Promise<void> {
    if (!this.page) return;
    
    try {
      const closeButton = await this.page.$(SELECTORS.CLOSE_BUTTONS);
      if (closeButton && await closeButton.isVisible()) {
        await closeButton.click();
        await this.page.waitForTimeout(1000);
      }
    } catch (e) {
      // Pressionar ESC para fechar modal
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(1000);
    }
  }

  async getPageContent(): Promise<string> {
    if (!this.page) {
      throw new Error('Página não está disponível');
    }
    
    const html = await this.page.content();
    return html.substring(0, APP_CONFIG.LIMITS.MAX_CONTENT_LENGTH);
  }

  async returnToMainPage(url: string): Promise<void> {
    if (!this.page) return;
    
    const currentUrl = this.page.url();
    if (currentUrl !== url) {
      console.log(`🔄 Retornando à página principal: ${url}`);
      
      try {
        // Tentar navegação com aguardo de carregamento completo
        await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Aguardar que a página esteja completamente carregada
        await this.waitForPageLoad();
        
        console.log('✅ Retorno à página principal concluído');
        
      } catch (error) {
        console.log('⚠️ Erro ao retornar à página principal, continuando...', error);
        // Tentar um reload simples como fallback
        try {
          await this.page.reload({ waitUntil: 'domcontentloaded' });
          await this.page.waitForTimeout(1000);
        } catch (reloadError) {
          console.log('⚠️ Erro no reload, continuando...');
        }
      }
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
        console.log('🔄 Browser fechado com sucesso');
      } catch (closeError) {
        console.error('⚠️ Erro ao fechar browser:', closeError);
      }
    }
  }

  private async waitForContentStability(): Promise<void> {
    if (!this.page) return;
    
    try {
      console.log('⏳ Aguardando estabilização do conteúdo...');
      
      // Aguardar que a rede estabilize (não há mais requisições ativas)
      await this.page.waitForLoadState('networkidle', { timeout: 3000 });
      
      // Aguardar que não haja mudanças no DOM por um período
      await this.page.waitForFunction(() => {
        return new Promise(resolve => {
          const observer = new MutationObserver(() => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
              observer.disconnect();
              resolve(true);
            }, 500); // 500ms sem mudanças no DOM
          });
          
          let timeoutId = setTimeout(() => {
            observer.disconnect();
            resolve(true);
          }, 500);
          
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true
          });
        });
      }, { timeout: 5000 });
      
      console.log('✅ Conteúdo estabilizado');
      
    } catch (error) {
      console.log('⏱️ Timeout na estabilização, continuando...');
      // Fallback para timeout simples se não conseguir detectar estabilidade
      await this.page.waitForTimeout(1000);
    }
  }

  async detectLoginForm(): Promise<boolean> {
    if (!this.page) {
      throw new Error('Página não está disponível');
    }

    try {
      // Aguardar carregamento dinâmico antes de detectar
      await this.waitForContentStability();

      // Detectar campos de login comuns
      const usernameSelectors = [
        'input[name="username"]',
        'input[name="user"]',
        'input[name="login"]',
        'input[name="email"]',
        'input[type="email"]',
        'input[id*="username" i]',
        'input[id*="user" i]',
        'input[id*="login" i]',
        'input[placeholder*="usuário" i]',
        'input[placeholder*="login" i]',
        'input[placeholder*="email" i]',
        'input[placeholder*="username" i]'
      ];

      const passwordSelectors = [
        'input[type="password"]',
        'input[name="password"]',
        'input[name="passwd"]',
        'input[name="pwd"]',
        'input[id*="password" i]',
        'input[id*="senha" i]'
      ];

      // Aguardar um pouco mais para elementos dinâmicos
      await this.page.waitForTimeout(2000);

      // Verificar se existe pelo menos um campo de usuário e um de senha
      for (const userSelector of usernameSelectors) {
        try {
          const userField = await this.page.$(userSelector);
          if (userField && await userField.isVisible()) {
            for (const passSelector of passwordSelectors) {
              try {
                const passField = await this.page.$(passSelector);
                if (passField && await passField.isVisible()) {
                  console.log(`🔍 Formulário de login detectado: ${userSelector} + ${passSelector}`);
                  return true;
                }
              } catch (error) {
                continue;
              }
            }
          }
        } catch (error) {
          continue;
        }
      }

      console.log('🔍 Nenhum formulário de login detectado na página atual');
      return false;
    } catch (error) {
      console.log('❌ Erro ao detectar formulário de login:', error);
      return false;
    }
  }

  async fillLoginForm(username: string, password: string): Promise<void> {
    if (!this.page) {
      throw new Error('Página não está disponível');
    }

    try {
      // Detectar e preencher campo de usuário
      const usernameSelectors = [
        'input[name="username"]',
        'input[name="user"]',
        'input[name="login"]',
        'input[name="email"]',
        'input[type="email"]',
        'input[id*="username"]',
        'input[id*="user"]',
        'input[id*="login"]',
        'input[placeholder*="usuário"]',
        'input[placeholder*="login"]',
        'input[placeholder*="email"]'
      ];

      let userFieldFilled = false;
      for (const selector of usernameSelectors) {
        try {
          const field = await this.page.$(selector);
          if (field && await field.isVisible()) {
            await field.fill(''); // Limpar campo
            await field.fill(username);
            console.log(`✅ Campo de usuário preenchido: ${selector}`);
            userFieldFilled = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (!userFieldFilled) {
        throw new Error('Campo de usuário não encontrado');
      }

      // Detectar e preencher campo de senha
      const passwordSelectors = [
        'input[type="password"]',
        'input[name="password"]',
        'input[name="passwd"]',
        'input[name="pwd"]',
        'input[id*="password"]',
        'input[id*="senha"]'
      ];

      let passwordFieldFilled = false;
      for (const selector of passwordSelectors) {
        try {
          const field = await this.page.$(selector);
          if (field && await field.isVisible()) {
            await field.fill(''); // Limpar campo
            await field.fill(password);
            console.log(`✅ Campo de senha preenchido: ${selector}`);
            passwordFieldFilled = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (!passwordFieldFilled) {
        throw new Error('Campo de senha não encontrado');
      }

      // Procurar e clicar no botão de login
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Entrar")',
        'button:has-text("Login")',
        'button:has-text("Acessar")',
        'input[value*="Entrar"]',
        'input[value*="Login"]',
        'button[name="login"]',
        'button[id*="login"]',
        '.btn-login',
        '#login-button'
      ];

      let submitClicked = false;
      for (const selector of submitSelectors) {
        try {
          const button = await this.page.$(selector);
          if (button && await button.isVisible()) {
            await button.click();
            console.log(`✅ Botão de login clicado: ${selector}`);
            submitClicked = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }

      if (!submitClicked) {
        // Tentar pressionar Enter no campo de senha como fallback
        const passwordField = await this.page.$('input[type="password"]');
        if (passwordField) {
          await passwordField.press('Enter');
          console.log('✅ Enter pressionado no campo de senha');
        } else {
          throw new Error('Botão de login não encontrado');
        }
      }

      // Aguardar possível redirecionamento
      await this.page.waitForTimeout(2000);

    } catch (error) {
      console.log('❌ Erro ao preencher formulário de login:', error);
      throw error;
    }
  }

  // Tornar waitForPageLoad público para uso no ManualGenerator
  async waitForPageLoadPublic(): Promise<void> {
    await this.waitForPageLoad();
  }

  async tryClickLoginButton(): Promise<boolean> {
    if (!this.page) {
      throw new Error('Página não está disponível');
    }

    try {
      // Seletores comuns para botões de login
      const loginButtonSelectors = [
        'button:has-text("Login")',
        'button:has-text("Entrar")',
        'button:has-text("Acessar")',
        'button:has-text("Sign In")',
        'button:has-text("Fazer Login")',
        'a:has-text("Login")',
        'a:has-text("Entrar")',
        'a:has-text("Acessar")',
        'a:has-text("Sign In")',
        'a:has-text("Fazer Login")',
        'button[class*="login"]',
        'a[class*="login"]',
        'button[id*="login"]',
        'a[id*="login"]',
        '.login-button',
        '.btn-login',
        '#login-btn',
        '#login-button'
      ];

      for (const selector of loginButtonSelectors) {
        try {
          const button = await this.page.$(selector);
          if (button && await button.isVisible()) {
            await button.click();
            console.log(`✅ Botão de login clicado: ${selector}`);
            
            // Aguardar um pouco para a página carregar
            await this.page.waitForTimeout(2000);
            
            return true;
          }
        } catch (error) {
          continue;
        }
      }

      console.log('⚠️ Nenhum botão de login encontrado');
      return false;
    } catch (error) {
      console.log('❌ Erro ao tentar clicar no botão de login:', error);
      return false;
    }
  }
}
