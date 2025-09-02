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

  const processFrame = async (frame: Frame) => {
    const frameUrl = frame.url();
    const pageUrl = page.url();

    // Verifica se a origem do frame é a mesma da página principal
    if (new URL(frameUrl).origin !== new URL(pageUrl).origin) {
      return;
    }

    // Clicks reais em elementos interativos para revelar subrotas dentro do frame
    const items = frame.getByRole('link').or(frame.getByRole('button')).or(frame.getByRole('menuitem'));
    for (const item of await items.all()) {
      if (!(await item.isVisible())) continue;

      const prevUrl = page.url(); // Usar page.url() para verificar a URL da página principal
      try {
        await Promise.all([
          item.click().catch(() => {}),
          page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {}),
          page.waitForURL(u => u.toString() !== prevUrl, { timeout: 5000 }).catch(() => {}),
        ]);
        all.add(page.url()); // Adiciona a nova URL após o clique
      } catch (e) {
        // Ignora erros de clique ou navegação para continuar a descoberta
        console.warn(`Erro ao interagir com elemento no frame ${frameUrl}: ${e}`);
      }
      await page.waitForTimeout(500); // Pequena pausa para estabilidade
    }

    // Adiciona URLs de links estáticos que podem não ter sido clicados dentro do frame
    const staticLinks = await frame.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'))
        .map(a => (a as HTMLAnchorElement).href)
        .filter(href => href.startsWith(location.origin));
      return Array.from(new Set(links));
    });
    staticLinks.forEach(link => all.add(new URL(link).pathname + new URL(link).search));
  };

  // Processa a página principal
  await processFrame(page.mainFrame());

  // Percorre todos os iframes na página
  for (const frame of page.frames()) {
    await processFrame(frame);
  }

  return Array.from(all).sort().map(url => ({ url, type: 'dynamic' as const }));
}