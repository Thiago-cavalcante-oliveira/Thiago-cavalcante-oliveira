import { Page } from "playwright";
import { logger } from "../utils/logger";
import { retry } from "../utils/retry";

const log = logger.child({ module: "routeDiscovery" });

export interface RouteInfo {
  url: string;
  method?: string;
  framework?: string;
  type?: 'static' | 'dynamic' | 'spa';
}

export interface DiscoveryOptions {
  maxInteractions?: number;
  timeout?: number;
  includeExternal?: boolean;
}

export async function discoverRoutes(page: Page): Promise<RouteInfo[]> {
  return retry(async () => {
    log.info('Iniciando descoberta de rotas');
    
    await page.waitForLoadState("domcontentloaded");
    
    // Hook into history to catch SPA route changes
    await page.addInitScript(() => {
      const origPush = history.pushState;
      const origReplace = history.replaceState;
      (window as any).__ROUTES__ = new Set([location.pathname + location.search + location.hash]);
      
      history.pushState = function(...args: any[]) {
        const r = origPush.apply(this, args as any);
        (window as any).__ROUTES__.add(location.pathname + location.search + location.hash);
        return r;
      };
      
      history.replaceState = function(...args: any[]) {
        const r = origReplace.apply(this, args as any);
        (window as any).__ROUTES__.add(location.pathname + location.search + location.hash);
        return r;
      };
    });

    // Extract framework hints & anchors/buttons
    const routes = await page.evaluate(() => {
      const set = new Set<string>();
      const add = (u: string) => {
        try {
          const url = new URL(u, location.origin);
          if (url.origin === location.origin) {
            set.add(url.pathname + url.search + url.hash);
          }
        } catch {}
      };

      // Extract from anchors
      document.querySelectorAll('a[href]').forEach(a => {
        const href = (a as HTMLAnchorElement).getAttribute('href') || "";
        add(href);
      });

      // Extract from buttons with navigation attributes
      document.querySelectorAll('button,[role="button"]').forEach(btn => {
        const href = (btn as HTMLElement).getAttribute("data-href") || 
                    (btn as HTMLElement).getAttribute("href") ||
                    (btn as HTMLElement).getAttribute("data-route");
        if (href) add(href);
      });

      // Try to read framework-specific hints
      // Next.js __NEXT_DATA__
      const nextData = (window as any).__NEXT_DATA__;
      if (nextData?.page) add(nextData.page);
      if (nextData?.buildManifest?.pages) {
        Object.keys(nextData.buildManifest.pages).forEach(page => add(page));
      }

      // Nuxt 3 hints
      const nuxtData = (window as any).__NUXT__;
      if (nuxtData?.ssrContext?.url) add(nuxtData.ssrContext.url);
      
      // Angular router hints
      const ngRouter = (window as any).ng?.getComponent?.(document.body)?.router;
      if (ngRouter?.config) {
        ngRouter.config.forEach((route: any) => {
          if (route.path) add(route.path);
        });
      }

      // Vue Router hints
      const vueRouter = (window as any).__VUE__?.$router;
      if (vueRouter?.options?.routes) {
        vueRouter.options.routes.forEach((route: any) => {
          if (route.path) add(route.path);
        });
      }

      // Extract from data attributes
      document.querySelectorAll('[data-route], [data-path], [data-url]').forEach(el => {
        const route = (el as HTMLElement).getAttribute('data-route') ||
                     (el as HTMLElement).getAttribute('data-path') ||
                     (el as HTMLElement).getAttribute('data-url');
        if (route) add(route);
      });

      // Get routes from history hook
      const historyRoutes = (window as any).__ROUTES__;
      if (historyRoutes) {
        historyRoutes.forEach((route: string) => add(route));
      }

      return Array.from(set);
    });

    // Filter and clean routes
    const cleanRoutes = routes
      .filter(route => route && route !== '#' && !route.startsWith('mailto:') && !route.startsWith('tel:'))
      .filter(route => !route.includes('javascript:'))
      .map(route => route.split('#')[0]) // Remove fragments
      .filter((route, index, arr) => arr.indexOf(route) === index) // Remove duplicates
      .sort();

    log.info(`Descobertas ${cleanRoutes.length} rotas únicas`);
    return cleanRoutes.map(url => ({ url, type: 'static' as const }));
  }, 3, 1000);
}

export async function interactiveDiscovery(page: Page, options: DiscoveryOptions = {}): Promise<RouteInfo[]> {
  const { maxInteractions = 5, timeout = 3000 } = options;
  const initialRoutes = await discoverRoutes(page);
  const allRoutes = new Set(initialRoutes.map(r => r.url));
  
  log.info(`Iniciando descoberta interativa com ${maxInteractions} interações máximas`);
  
  for (let i = 0; i < maxInteractions; i++) {
    try {
      // Click on navigation elements to discover more routes
      const newRoutes = await page.evaluate(() => {
        const navElements = document.querySelectorAll('nav a, .menu a, .navigation a, [role="menuitem"]');
        const routes = new Set<string>();
        
        navElements.forEach(el => {
          const href = (el as HTMLAnchorElement).href;
          if (href && !href.includes('javascript:')) {
            try {
              const url = new URL(href);
              if (url.origin === location.origin) {
                routes.add(url.pathname + url.search);
              }
            } catch {}
          }
        });
        
        return Array.from(routes);
      });
      
      newRoutes.forEach(route => allRoutes.add(route));
      
      // Try to hover over menu items to reveal submenus
      const menuItems = await page.locator('nav [role="menuitem"], .menu > li, .dropdown').all();
      for (const item of menuItems.slice(0, 3)) { // Limit to avoid too many interactions
        try {
          await item.hover({ timeout: 1000 });
          await page.waitForTimeout(500);
          
          const submenuRoutes = await discoverRoutes(page);
          submenuRoutes.forEach(route => allRoutes.add(route.url));
        } catch {
          // Continue if hover fails
        }
      }
    } catch (error) {
      log.warn(`Erro na interação ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  const finalRoutes = Array.from(allRoutes).sort();
  log.info(`Descoberta interativa concluída: ${finalRoutes.length} rotas totais`);
  
  return finalRoutes.map(url => ({ url, type: 'dynamic' as const }));
}