import { Page } from 'playwright';
import { NavigationElement, InteractiveElement } from './types';

export async function detectNavigationElements(page: Page): Promise<NavigationElement[]> {
    if (!page) return [];

    const navigationElements = await page.evaluate(() => {
      const generateSelectorForElement = function(element: any) {
        if (element.id) {
          return '#' + element.id;
        }
        
        let selector = element.tagName.toLowerCase();
        
        if (element.className) {
          const classes = element.className.split(' ').filter(function(c: any) { return c.trim(); });
          if (classes.length > 0) {
            selector += '.' + classes.join('.');
          }
        }
        
        const parent = element.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter(function(el: any) {
            return el.tagName === element.tagName && el.className === element.className;
          });
          if (siblings.length > 1) {
            const index = siblings.indexOf(element) + 1;
            selector += ':nth-child(' + index + ')';
          }
        }
        
        return selector;
      };

      const navigationSelectors = [
        'nav', 'nav a', 'nav button', 'nav li', 'nav ul',
        'header nav', 'aside nav', 'main nav',
        '.navbar', '.navbar a', '.navbar button', '.navbar-nav',
        '.menu', '.menu a', '.menu button', '.menu-item', '.menu-list',
        '.navigation', '.nav-link', '.nav-item', '.nav-list',
        '.sidebar', '.sidebar a', '.sidebar button', '.sidebar-nav',
        '[role="navigation"]', '[role="menubar"]', '[role="menu"]',
        '[role="menuitem"]', '[aria-label*="menu"]', '[aria-label*="nav"]',
        '.header-menu', '.main-menu', '.primary-nav', '.secondary-nav',
        '.top-nav', '.side-nav', '.breadcrumb', '.breadcrumbs',
        '.footer-nav', '.mobile-nav', '.desktop-nav',
        '.nav-tabs', '.nav-pills', '.nav-justified', '.nav-stacked',
        '.navbar-brand', '.navbar-toggle', '.navbar-collapse',
        '.dropdown-menu', '.dropdown-toggle',
        'header a', 'header button', 'header ul li',
        'aside a', 'aside button', 'aside ul li',
        '.header a', '.header button', '.header ul li',
        '.footer a[href]', '.footer button',
        '[data-nav]', '[data-menu]', '[data-navigation]',
        '[data-toggle="dropdown"]', '[data-toggle="collapse"]'
      ];

      const elements: any[] = [];

      navigationSelectors.forEach(selector => {
        try {
          const foundElements = document.querySelectorAll(selector);
          foundElements.forEach((element, index) => {
            const rect = element.getBoundingClientRect();
            
            if (rect.width > 0 && rect.height > 0) {
              const style = window.getComputedStyle(element);
              if (style.display !== 'none' && style.visibility !== 'hidden') {
                
                const text = element.textContent?.trim() || '';
                const href = (element as HTMLAnchorElement).href || '';
                
                let confidence = 0;
                
                const navKeywords = [
                  'menu', 'início', 'home', 'principal', 'dashboard', 'painel',
                  'relatórios', 'configurações', 'ajustes', 'perfil', 'conta',
                  'sair', 'logout', 'entrar', 'login', 'cadastro', 'registro',
                  'sobre', 'contato', 'ajuda', 'suporte', 'documentação',
                  'produtos', 'serviços', 'categorias', 'buscar', 'pesquisar',
                  'nav', 'navigation', 'main', 'dashboard', 'panel',
                  'reports', 'settings', 'profile', 'account', 'user',
                  'sign out', 'sign in', 'register', 'signup',
                  'about', 'contact', 'help', 'support', 'docs',
                  'products', 'services', 'categories', 'search',
                  'menú', 'inicio', 'principal', 'tablero', 'panel',
                  'informes', 'configuración', 'perfil', 'cuenta',
                  'salir', 'entrar', 'registro', 'acerca', 'contacto',
                  'ayuda', 'soporte', 'productos', 'servicios', 'buscar'
                ];
                if (navKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
                  confidence += 0.3;
                }
                
                if (rect.top < 200) confidence += 0.2;
                if (rect.left < 300 || rect.right > window.innerWidth - 300) confidence += 0.2;
                
                const tagName = element.tagName.toLowerCase();
                if (tagName === 'nav') confidence += 0.4;
                if (tagName === 'a' && element.closest('nav, .menu, .navbar, header, aside')) confidence += 0.2;
                if (tagName === 'button' && element.closest('nav, .menu, .navbar')) confidence += 0.2;
                
                const navClasses = ['menu', 'nav', 'navbar', 'navigation', 'sidebar', 'breadcrumb'];
                if (navClasses.some(cls => element.classList.contains(cls))) confidence += 0.3;
                
                if (element.getAttribute('role') === 'navigation' || 
                    element.getAttribute('role') === 'menu' ||
                    element.getAttribute('role') === 'menuitem') confidence += 0.3;
                
                if (element.hasAttribute('data-nav') || 
                    element.hasAttribute('data-menu') ||
                    element.hasAttribute('data-navigation')) confidence += 0.2;
                
                if (href && href !== '#') confidence += 0.2;
                
                const hasSubmenu = element.querySelector('ul, .submenu, .dropdown') !== null;
                if (hasSubmenu) confidence += 0.1;

                elements.push({
                  type: element.tagName.toLowerCase() === 'nav' ? 'nav' : 
                        element.tagName.toLowerCase() === 'a' ? 'link' :
                        element.tagName.toLowerCase() === 'button' ? 'button' : 'menu',
                  text: text,
                  selector: generateSelectorForElement(element),
                  href: href || undefined,
                  hasSubmenu: hasSubmenu,
                  routeChange: href && href !== '#' && !href.startsWith('javascript:'),
                  position: {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2
                  },
                  confidence: Math.min(confidence, 1)
                });
              }
            }
          });
        } catch (error) {
          console.error(`Erro ao processar seletor ${selector}:`, error);
        }
      });

      return elements;
    });

    const filteredElements = navigationElements
      .filter(el => el.confidence > 0.3)
      .sort((a, b) => b.confidence - a.confidence);
    
    return filteredElements;
  }

export async function detectAllInteractiveElements(page: Page): Promise<InteractiveElement[]> {
    if (!page) return [];

    const elements = await page.evaluate(() => {
      const generateSelectorForElement = function(element: any) {
        if (element.id) {
          return '#' + element.id;
        }
        
        let selector = element.tagName.toLowerCase();
        
        if (element.className) {
          const classes = element.className.split(' ').filter(function(c: any) { return c.trim(); });
          if (classes.length > 0) {
            selector += '.' + classes.join('.');
          }
        }
        
        const parent = element.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter(function(el: any) {
            return el.tagName === element.tagName && el.className === element.className;
          });
          if (siblings.length > 1) {
            const index = siblings.indexOf(element) + 1;
            selector += ':nth-child(' + index + ')';
          }
        }
        
        return selector;
      };

      const interactiveSelectors = [
        'a[href]', 'button', 'input[type="submit"]', 'input[type="button"]', 'input[type="checkbox"]', 'input[type="radio"]',
        'select', 'textarea', '[role="button"]', '[role="link"]', '[role="menuitem"]', '[role="tab"]', '[role="option"]',
        '[data-toggle]', '[data-bs-toggle]', '[onclick]'
      ];

      const interactiveElements: any[] = [];

      interactiveSelectors.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              const style = window.getComputedStyle(element);
              if (style.display !== 'none' && style.visibility !== 'hidden') {
                interactiveElements.push({
                  type: element.tagName.toLowerCase(),
                  selector: generateSelectorForElement(element),
                  text: element.textContent?.trim() || '',
                  href: (element as HTMLAnchorElement).href || undefined,
                });
              }
            }
          });
        } catch (error) {
          console.error(`Erro ao processar seletor de elementos interativos ${selector}:`, error);
        }
      });

      return interactiveElements;
    });

    return elements;
}

export async function extractElementsFromPage(page: Page, detectionConfig: any): Promise<any[]> {
  return page.evaluate((config) => {
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

    const interactiveSelectors = [
       ...config.selectors.common,
       ...config.selectors.administrative,
       ...config.selectors.educational,
       ...config.selectors.custom,
       'select', 'input[type="checkbox"]', 'input[type="radio"]',
       'input[type="text"]', 'input[type="email"]', 'input[type="password"]'
     ];

    const elements: any[] = [];
    
    interactiveSelectors.forEach(selector => {
      try {
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
              dataToggle: element.getAttribute('data-toggle') || null,
              dataTarget: element.getAttribute('data-target') || null,
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
              index: index,
              detectionMethod: 'standard'
            });
          }
        });
      } catch (error) {
        console.warn(`Erro ao processar seletor ${selector}:`, error);
      }
    });

    return elements;
  }, detectionConfig);
}

export async function detectPotentialModals(page: Page): Promise<any[]> {
    if (!page) return [];

    const modals = await page.evaluate(() => {
      const modalSelectors = [
        '.modal', '.dialog', '.popup', '[role="dialog"]', '[role="alertdialog"]',
        '[data-modal]', '[data-dialog]', '[data-popup]'
      ];

      const potentialModals: any[] = [];

      modalSelectors.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(element => {
            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);
            
            const isPotentialModal = (style.position === 'fixed' || style.position === 'absolute') && 
                                     parseInt(style.zIndex, 10) > 100;

            if (isPotentialModal) {
              potentialModals.push({
                selector: element.id ? `#${element.id}` : `.${element.className.split(' ').join('.')}`,
                content: element.textContent?.trim().substring(0, 200) || 'N/A',
                type: 'selector-based'
              });
            }
          });
        } catch (error) {
          console.error(`Erro ao processar seletor de modal ${selector}:`, error);
        }
      });

      return potentialModals;
    });

    return modals;
  }

export function detectSystemType(url: string): string {
    if (url.includes('saeb') || url.includes('inep')) {
      return 'saeb-system';
    }
    if (url.includes('admin') || url.includes('dashboard')) {
      return 'administrative-system';
    }
    if (url.includes('spa') || url.includes('app')) {
      return 'spa-system';
    }
    return 'default';
  }