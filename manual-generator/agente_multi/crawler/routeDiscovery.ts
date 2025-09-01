import { Page } from 'playwright';

export interface RouteInfo { url: string; method?: string; framework?: string; type?: 'static'|'dynamic'|'spa' }
export interface DiscoveryOptions { maxInteractions?: number; timeout?: number; includeExternal?: boolean }

export async function discoverRoutes(page: Page): Promise<RouteInfo[]> {
  await page.waitForLoadState('domcontentloaded');

  // Hook simples de histórico
  await page.addInitScript(() => {
    const origPush = history.pushState; const origReplace = history.replaceState;
    (window as any).__ROUTES__ = new Set([location.pathname + location.search + location.hash]);
    history.pushState = function(this: History, ...args: any[]) { const r = origPush.apply(this, args as any); (window as any).__ROUTES__.add(location.pathname + location.search + location.hash); return r; } as any;
    history.replaceState = function(this: History, ...args: any[]) { const r = origReplace.apply(this, args as any); (window as any).__ROUTES__.add(location.pathname + location.search + location.hash); return r; } as any;
  });

  const routes = await page.evaluate(() => {
    const set = new Set<string>();
    const add = (u: string) => { try { const url = new URL(u, location.origin); if (url.origin === location.origin) set.add(url.pathname + url.search + url.hash); } catch {} };

    document.querySelectorAll('a[href]').forEach(a => add((a as HTMLAnchorElement).getAttribute('href') || ''));
    document.querySelectorAll('[data-route],[data-path],[data-url]').forEach(el => {
      const v = (el as HTMLElement).getAttribute('data-route') || (el as HTMLElement).getAttribute('data-path') || (el as HTMLElement).getAttribute('data-url');
      if (v) add(v);
    });
    const historyRoutes = (window as any).__ROUTES__; if (historyRoutes) historyRoutes.forEach((r: string) => add(r));
    return Array.from(set);
  });

  const clean = Array.from(new Set(routes
    .filter(r => r && r !== '#' && !r.startsWith('mailto:') && !r.startsWith('tel:'))
    .map(r => r.split('#')[0])
  )).sort();

  return clean.map(url => ({ url, type: 'static' as const }));
}

export async function interactiveDiscovery(page: Page, opt: DiscoveryOptions = {}): Promise<RouteInfo[]> {
  const { maxInteractions = 5 } = opt;
  const initial = await discoverRoutes(page);
  const all = new Set(initial.map(r => r.url));

  // Hover/click leve em menus para revelar subrotas
  const menuItems = await page.locator('nav a, [role="menuitem"], .menu a').all();
  for (const item of menuItems.slice(0, Math.min(menuItems.length, maxInteractions))) {
    try {
      await item.hover({ timeout: 800 }).catch(() => {});
      const href = await item.getAttribute('href');
      if (href) {
        try { const u = new URL(href, await page.evaluate(() => location.origin)); all.add(u.pathname + u.search); } catch {}
      }
    } catch {}
  }

  return Array.from(all).sort().map(url => ({ url, type: 'dynamic' as const }));
}