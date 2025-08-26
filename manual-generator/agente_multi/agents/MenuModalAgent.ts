import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';
import { Timeline } from '../services/Timeline.js';
import { OrchestrationConfig } from './OrchestratorAgent.js';
import { Page, Browser } from 'playwright';

class Logger {
  private agent: string;
  
  constructor(config: { agent: string }) {
    this.agent = config.agent;
  }
  
  info(message: string) {
    logger.info(`[${this.agent}] ${message}`);
  }
  
  warn(message: string) {
    logger.warn(`[${this.agent}] ${message}`);
  }
  
  error(message: string, error?: any) {
    logger.error(`[${this.agent}] ${message}`, error);
  }
}

export interface MenuDetectionResult {
  menus: Array<{
    selector: string;
    items: Array<{
      selector: string;
      label: string;
      href?: string;
    }>;
  }>;
  modals: Array<{
    selector: string;
    title: string;
    buttons: string[];
  }>;
  interactiveElements: Array<{
    selector: string;
    type: string;
    text: string;
    isVisible: boolean;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
}

export class MenuModalAgent {
  private page: Page | null = null;
  private browser: Browser | null = null;
  
  constructor(
    private cfg: OrchestrationConfig,
    private timeline: Timeline,
    private log = new Logger({ agent: 'MenuModal' })
  ) {}

  setPage(page: Page | null): void {
    this.page = page;
  }

  setBrowser(browser: Browser | null): void {
    this.browser = browser;
  }

  async run(): Promise<MenuDetectionResult> {
    const startTime = Date.now();
    this.log.info(`⏰ [${new Date().toISOString()}] Iniciando execução do MenuModalAgent`);
    
    if (!this.page) {
      throw new Error('Page não foi definida. Use setPage() antes de executar.');
    }
    if (this.page.isClosed()) {
      throw new Error('A instância de page está fechada. Não há sessão ativa.');
    }
    
    // LOG DETALHADO DO ESTADO DA PÁGINA
    try {
      this.log.info(`⏰ [${new Date().toISOString()}] Estado da página: isClosed=${this.page.isClosed()}, url=${this.page.url()}`);
    } catch (e) {
      this.log.error('[DEBUG] Falha ao acessar estado da página', e);
    }

    const outDir = path.resolve('agente_multi/output');
    
    this.log.info(`⏰ [${new Date().toISOString()}] 🔍 Iniciando detecção avançada de menus e modais...`);

    const networkIdleStart = Date.now();
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      this.log.warn(`⏰ [${new Date().toISOString()}] Timeout aguardando networkidle após ${Date.now() - networkIdleStart}ms, continuando...`);
    });
    this.log.info(`⏰ [${new Date().toISOString()}] NetworkIdle concluído em ${Date.now() - networkIdleStart}ms`);

    const menuDetectionStart = Date.now();
    this.log.info(`⏰ [${new Date().toISOString()}] 📋 Iniciando detecção de menus...`);
    const menus = await this.detectMenus();
    this.log.info(`⏰ [${new Date().toISOString()}] ✅ Detecção de menus concluída em ${Date.now() - menuDetectionStart}ms - ${menus.length} menus encontrados`);
    
    const modalDetectionStart = Date.now();
    this.log.info(`⏰ [${new Date().toISOString()}] 🪟 Iniciando detecção de modais...`);
    const modals = await this.detectModals();
    this.log.info(`⏰ [${new Date().toISOString()}] ✅ Detecção de modais concluída em ${Date.now() - modalDetectionStart}ms - ${modals.length} modais encontrados`);
    
    const interactiveDetectionStart = Date.now();
    this.log.info(`⏰ [${new Date().toISOString()}] 🖱️ Iniciando detecção de elementos interativos...`);
    const interactiveElements = await this.detectInteractiveElements();
    this.log.info(`⏰ [${new Date().toISOString()}] ✅ Detecção de elementos interativos concluída em ${Date.now() - interactiveDetectionStart}ms - ${interactiveElements.length} elementos encontrados`);

    const result: MenuDetectionResult = {
      menus,
      modals,
      interactiveElements
    };

    const fileWriteStart = Date.now();
    this.log.info(`⏰ [${new Date().toISOString()}] 💾 Salvando resultados em arquivo...`);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, 'menu-detection-result.json'),
      JSON.stringify(result, null, 2),
      'utf-8'
    );
    this.log.info(`⏰ [${new Date().toISOString()}] ✅ Arquivo salvo em ${Date.now() - fileWriteStart}ms`);

    const timelineStart = Date.now();
    this.log.info(`⏰ [${new Date().toISOString()}] 📝 Registrando evento no timeline...`);
    await this.timeline.recordEvent({
      type: 'milestone',
      description: 'menus.modals.detected',
      metadata: {
        menus: menus.length,
        modals: modals.length,
        interactiveElements: interactiveElements.length,
        executionTime: Date.now() - startTime
      },
      status: 'success',
      tags: ['menu-detection']
    });
    this.log.info(`⏰ [${new Date().toISOString()}] ✅ Timeline atualizado em ${Date.now() - timelineStart}ms`);

    const totalTime = Date.now() - startTime;
    this.log.info(`⏰ [${new Date().toISOString()}] 🎉 Detecção concluída em ${totalTime}ms: ${menus.length} menus, ${modals.length} modais, ${interactiveElements.length} elementos interativos`);

    return result;
  }

  private async detectMenus(): Promise<MenuDetectionResult['menus']> {
    if (!this.page) return [];

    this.log.info(`⏰ [${new Date().toISOString()}] 🔍 Executando script de detecção de menus no browser...`);
    const scriptStart = Date.now();
    
    const menuDetectionFunc = `
      (() => {
        function pickSelector(el) {
          if (!el) return '';
          const id = el.getAttribute('id');
          if (id) return '#' + id;
          
          const cls = (el.getAttribute('class') || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 3)
            .join('.');
          
          return el.tagName.toLowerCase() + (cls ? '.' + cls : '');
        }

        const out = [];
        const menuSelectors = [
          'nav', 'aside', '[role="navigation"]', '[role="menubar"]', '.navbar', '.menu',
          '.navigation', '.sidebar', '.nav-menu', '.main-menu', '.header-menu', '.top-menu',
          '.side-menu', '.dropdown-menu', '[class*="menu"]', '[class*="nav"]', '[id*="menu"]', '[id*="nav"]'
        ];

        menuSelectors.forEach(selector => {
          try {
            document.querySelectorAll(selector).forEach(m => {
              const rect = m.getBoundingClientRect();
              if (rect.width === 0 && rect.height === 0) return;

              const items = Array.from(
                m.querySelectorAll('a, [role="menuitem"], [role="button"], button, .menu-item, .nav-item, li > a, li > button')
              ).map(i => {
                const label = (i.textContent || i.getAttribute('aria-label') || i.getAttribute('title') || i.getAttribute('alt') || '').trim();
                return {
                  selector: pickSelector(i),
                  label,
                  href: i.href || i.getAttribute('data-href') || i.getAttribute('data-url')
                };
              }).filter(item => item.label.length > 0);

              if (items.length > 0) {
                out.push({
                  selector: pickSelector(m),
                  items
                });
              }
            });
          } catch (e) {
            console.warn('Erro ao processar seletor ' + selector + ':', e);
          }
        });

        return out;
      })()
    `;
    
    const result = await this.page.evaluate(menuDetectionFunc) as MenuDetectionResult['menus'];
    this.log.info(`⏰ [${new Date().toISOString()}] ✅ Script de detecção de menus executado em ${Date.now() - scriptStart}ms`);
    return result;
  }

  private async detectModals(): Promise<MenuDetectionResult['modals']> {
    if (!this.page) return [];

    this.log.info(`⏰ [${new Date().toISOString()}] 🔍 Executando script de detecção de modais no browser...`);
    const scriptStart = Date.now();
    
    const modalDetectionFunc = `
      (() => {
        function pickSelector(el) {
          if (!el) return '';
          const id = el.getAttribute('id');
          if (id) return '#' + id;
          
          const cls = (el.getAttribute('class') || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 3)
            .join('.');
          
          return el.tagName.toLowerCase() + (cls ? '.' + cls : '');
        }

        const out = [];
        const modalSelectors = [
          '[role="dialog"]', '[aria-modal="true"]', '.modal.show', '.modal.open',
          '.ant-modal', '.MuiDialog-root', '.dialog', '.popup', '.overlay',
          '[class*="modal"]', '[class*="dialog"]', '[class*="popup"]'
        ];

        modalSelectors.forEach(selector => {
          try {
            document.querySelectorAll(selector).forEach(d => {
              const rect = d.getBoundingClientRect();
              if (rect.width === 0 && rect.height === 0) return;

              const title = (
                d.querySelector('[role="heading"], h1, h2, h3, .modal-title, .dialog-title')?.innerText ||
                d.getAttribute('aria-label') ||
                d.getAttribute('title') ||
                ''
              ).trim();
              
              const buttons = Array.from(
                d.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]')
              ).map(b => (b.innerText || b.value || b.getAttribute('aria-label') || '').trim())
               .filter(Boolean);

              out.push({
                selector: pickSelector(d),
                title,
                buttons
              });
            });
          } catch (e) {
            console.warn('Erro ao processar seletor de modal ' + selector + ':', e);
          }
        });

        return out;
      })()
    `;
    
    const result = await this.page.evaluate(modalDetectionFunc) as MenuDetectionResult['modals'];
    this.log.info(`⏰ [${new Date().toISOString()}] ✅ Script de detecção de modais executado em ${Date.now() - scriptStart}ms`);
    return result;
  }

  private async detectInteractiveElements(): Promise<MenuDetectionResult['interactiveElements']> {
    if (!this.page) return [];

    this.log.info(`⏰ [${new Date().toISOString()}] 🔍 Executando script de detecção de elementos interativos no browser...`);
    const scriptStart = Date.now();
    
    const interactiveDetectionFunc = `
      (() => {
        function pickSelector(el) {
          if (!el) return '';
          const id = el.getAttribute('id');
          if (id) return '#' + id;
          
          const cls = (el.getAttribute('class') || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 3)
            .join('.');
          
          return el.tagName.toLowerCase() + (cls ? '.' + cls : '');
        }

        const out = [];
        const interactiveSelectors = [
          'button', 'a', 'input[type="button"]', 'input[type="submit"]',
          '[role="button"]', '[role="menuitem"]', '[role="tab"]', '[role="link"]',
          '.btn', '.button', '[onclick]', '[data-toggle]', '[data-action]',
          '.clickable', '[class*="btn"]', '[class*="button"]'
        ];

        interactiveSelectors.forEach(selector => {
          try {
            document.querySelectorAll(selector).forEach(el => {
              const rect = el.getBoundingClientRect();
              const isVisible = rect.width > 0 && rect.height > 0 && 
                              window.getComputedStyle(el).visibility !== 'hidden' &&
                              window.getComputedStyle(el).display !== 'none';

              if (!isVisible) return;

              const text = (
                el.textContent ||
                el.getAttribute('aria-label') ||
                el.getAttribute('title') ||
                el.getAttribute('alt') ||
                el.value ||
                ''
              ).trim();

              if (text.length === 0) return;

              out.push({
                selector: pickSelector(el),
                type: el.tagName.toLowerCase(),
                text,
                isVisible,
                boundingBox: {
                  x: rect.x,
                  y: rect.y,
                  width: rect.width,
                  height: rect.height
                }
              });
            });
          } catch (e) {
            console.warn('Erro ao processar seletor interativo ' + selector + ':', e);
          }
        });

        return out;
      })()
    `;
    
    const result = await this.page.evaluate(interactiveDetectionFunc) as MenuDetectionResult['interactiveElements'];
    this.log.info(`⏰ [${new Date().toISOString()}] ✅ Script de detecção de elementos interativos executado em ${Date.now() - scriptStart}ms`);
    return result;
  }

  async requestUserInteraction(): Promise<{
    clickedElement?: {
      selector: string;
      text: string;
      type: string;
    };
    userCancelled: boolean;
  }> {
    if (!this.page) {
      throw new Error('Page não foi definida.');
    }

    this.log.info('🤝 Solicitando interação do usuário para identificar menu principal...');
    
    const screenshotPath = path.join('agente_multi/output', `user-interaction-${Date.now()}.png`);
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    
    this.log.info(`📸 Screenshot salvo em: ${screenshotPath}`);
    this.log.info('👆 Por favor, clique no menu principal ou elemento de navegação desejado...');
    this.log.info('⏱️  Aguardando interação do usuário (timeout: 30s)...');

    try {
      const clickedElement = await this.page.evaluate(() => {
        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            resolve({ userCancelled: true });
          }, 30000);

          const clickHandler = (event: MouseEvent) => {
            clearTimeout(timeout);
            document.removeEventListener('click', clickHandler);
            
            const target = event.target as Element;
            if (!target) {
              resolve({ userCancelled: true });
              return;
            }

            const selector = target.id ? `#${target.id}` : 
                           target.className ? `.${target.className.split(' ')[0]}` :
                           target.tagName.toLowerCase();
            
            const text = (
              target.textContent ||
              target.getAttribute('aria-label') ||
              target.getAttribute('title') ||
              ''
            ).trim();

            resolve({
              selector,
              text,
              type: target.tagName.toLowerCase(),
              userCancelled: false
            });
          };

          document.addEventListener('click', clickHandler);
        });
      });

      return clickedElement as any;
    } catch (error) {
      this.log.error('Erro durante interação do usuário:', error);
      return { userCancelled: true };
    }
  }

  async analyzeClickedElement(selector: string): Promise<{
    relatedElements: Array<{
      selector: string;
      text: string;
      relationship: string;
    }>;
    domStructure: any;
  }> {
    if (!this.page) {
      throw new Error('Page não foi definida.');
    }

    return await this.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) {
        return { relatedElements: [], domStructure: null };
      }

      const relatedElements: any[] = [];
      
      let parent = element.parentElement;
      while (parent && parent !== document.body) {
        const parentSelector = parent.id ? `#${parent.id}` : 
                              parent.className ? `.${parent.className.split(' ')[0]}` :
                              parent.tagName.toLowerCase();
        
        relatedElements.push({
          selector: parentSelector,
          text: (parent.textContent || '').trim().substring(0, 100),
          relationship: 'parent'
        });
        
        parent = parent.parentElement;
      }

      if (element.parentElement) {
        Array.from(element.parentElement.children).forEach((sibling) => {
          if (sibling !== element) {
            const siblingSelector = sibling.id ? `#${sibling.id}` : 
                                   sibling.className ? `.${sibling.className.split(' ')[0]}` :
                                   sibling.tagName.toLowerCase();
            
            relatedElements.push({
              selector: siblingSelector,
              text: (sibling.textContent || '').trim().substring(0, 100),
              relationship: 'sibling'
            });
          }
        });
      }

      Array.from(element.children).forEach((child) => {
        const childSelector = child.id ? `#${child.id}` : 
                             child.className ? `.${child.className.split(' ')[0]}` :
                             child.tagName.toLowerCase();
        
        relatedElements.push({
          selector: childSelector,
          text: (child.textContent || '').trim().substring(0, 100),
          relationship: 'child'
        });
      });

      return {
        relatedElements,
        domStructure: {
          tagName: element.tagName,
          id: element.id,
          className: element.className,
          attributes: Array.from(element.attributes).map(attr => ({
            name: attr.name,
            value: attr.value
          }))
        }
      };
    }, selector);
  }
}