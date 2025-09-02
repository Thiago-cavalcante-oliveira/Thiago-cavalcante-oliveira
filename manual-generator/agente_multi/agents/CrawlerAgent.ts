/*
 * src/agents/CrawlerAgent.ts
 * Agente responsável por explorar o DOM, coletar elementos e tirar snapshots por página.
 */

import { Page, Browser } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseAgent, TaskData, TaskResult } from '../core/AgnoSCore.js';
import { discoverRoutes, interactiveDiscovery, RouteInfo } from '../crawler/routeDiscovery.js';

export class CrawlerAgent extends BaseAgent {
  private page!: Page;
  private browser: Browser | null = null;
  private timeline: any;
  private menuModalAgent: any;

  constructor() {
    super({
      name: 'CrawlerAgent',
      version: '1.0.1',
      description: 'Explora o DOM, coleta elementos e tira snapshots por página',
      capabilities: [
        { name: 'dom_crawl', description: 'Coleta de elementos DOM (inclui Shadow DOM e iframes same-origin)', version: '1.0.0' },
        { name: 'spa_hooks', description: 'Detecção de navegação SPA', version: '1.0.0' }
      ]
    });
  }

  setPage(p: Page) { this.page = p; }
  setBrowser(b: Browser | null) { this.browser = b; }
  setTimeline(tl: any) { this.timeline = tl; }
  setMenuModalAgent(m: any) { this.menuModalAgent = m; }

  async initialize() {
    // Adiciona init script para corrigir erro __name is not defined
    if (this.page) {
      await this.page.addInitScript(() => {
        (window as any).__name = (window as any).__name || function(obj: any, name: string) {
          try {
            Object.defineProperty(obj, 'name', { value: name, configurable: true });
          } catch (e) {
            // Ignore errors
          }
          return obj;
        };
      });
    }
  }
  async cleanup() { /* noop */ }

  async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    const { success, data, error, processingTime } = taskResult;
    const stats = data?.stats || {};
    
    return `# Relatório de Crawling

` +
           `**Status:** ${success ? '✅ Sucesso' : '❌ Falha'}\n` +
           `**Tempo de Processamento:** ${processingTime}ms\n` +
           `**Páginas Processadas:** ${stats.pages || 0}\n` +
           `**Total de Elementos:** ${stats.totalElements || 0}\n` +
           (error ? `**Erro:** ${error}\n` : '') +
           `\n**Detalhes:**\n` +
           `- URLs descobertas e analisadas\n` +
           `- Elementos interativos identificados\n` +
           `- Screenshots capturados\n`;
  }

  protected override log(message: string, level: 'info'|'warn'|'error' = 'info') {
    const emoji = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '🕷️';
    console.log(`${emoji} [CrawlerAgent] ${new Date().toISOString()} - ${message}`);
  }

  async processTask(task: TaskData): Promise<TaskResult> {
    const start = Date.now();
    
    switch (task.type) {
      case 'start_authenticated_crawl':
        return await this.handleAuthenticatedCrawl(task, start);
      case 'crawl_site':
        return await this.handleCrawlSite(task, start);
      default:
        return { id: task.id, taskId: task.id, success: false, error: 'Unsupported task', timestamp: new Date(), processingTime: 0 };
    }
  }

  private async handleAuthenticatedCrawl(task: TaskData, start: number): Promise<TaskResult> {

    const outputDir: string | undefined = task.data?.outputDir;

    try {
      await this.installSpaHooks(this.page);

      const visited = new Set<string>();
      const pages: any[] = [];

      let routeInfos: RouteInfo[] = [];
      try {
        routeInfos = await discoverRoutes(this.page);
      } catch { }
      let routes = Array.from(new Set(routeInfos.map((r: RouteInfo) => r.url)));

      // Fallback: se não achou quase nada (SPA sem <a href>), tente cliques guiados:
      if (routes.length < 5) {
        try {
          const inter = await interactiveDiscovery(this.page, { maxInteractions: 8, timeout: 4000 });
          routes = Array.from(new Set([...routes, ...inter.map((r: RouteInfo) => r.url)]));
        } catch { }
      }

      // Fallback extra: se existir o MenuModalAgent, use os hrefs dos menus detectados
      if (routes.length < 5 && this.menuModalAgent?.detectMenus) {
        try {
          const menus = await this.menuModalAgent.detectMenus();
          const origin = new URL(this.page.url()).origin;
          const hrefs = (menus ?? [])
            .flatMap((m: any) => (m.items ?? []).map((i: any) => i.href).filter(Boolean))
            .map((u: string) => (u.startsWith('http') ? u : new URL(u, origin).href));
          routes = Array.from(new Set([...routes, ...hrefs]));
        } catch { }
      }

      const current = this.page.url();
      if (!routes.includes(current)) routes.unshift(current);

      for (const url of routes) {
        if (visited.has(url)) continue;
        visited.add(url);

        try {
          await this.safeGoto(url);
          const snapshot = await this.snapshotPage(outputDir);
          pages.push(snapshot);

          const internal = await this.collectInternalLinks(20);
          for (const href of internal) {
            if (visited.has(href)) continue;
            visited.add(href);
            await this.safeGoto(href);
            pages.push(await this.snapshotPage(outputDir));
          }
        } catch (e: any) {
          this.log(`Falha ao visitar ${url}: ${e}`, 'warn');
          pages.push({ url, error: String(e) });
        }
      }

      const totalElements = pages.reduce((acc, p) => acc + (p.elements?.length || 0), 0);

      const crawlPayload = {
        pages,
        siteMap: pages.map((p: any) => ({ url: p.url, title: p.classification?.title || p.meta?.title })),
        stats: { pages: pages.length, totalElements },
        generatedAt: new Date().toISOString()
      };

      const saved = await this.saveCrawlResult(crawlPayload, outputDir);
      if (saved) this.log(`Crawl salvo em ${saved}`);

      return {
        id: task.id,
        taskId: task.id,
        success: true,
        data: crawlPayload,
        timestamp: new Date(),
        processingTime: Date.now() - start
      };
    } catch (error: any) {
      this.log(`Erro no crawling: ${error}`, 'error');
      return { id: task.id, taskId: task.id, success: false, error: String(error), timestamp: new Date(), processingTime: Date.now() - start };
    }
  }

  private async handleCrawlSite(task: TaskData, start: number): Promise<TaskResult> {
    const { url, maxPages = 10, includeMenuDetection = true, includeInteractiveElements = true, saveResults = true } = task.data;
    
    this.log(`Iniciando crawl do site: ${url}`);
    
    if (!this.page) {
      return {
        id: task.id,
        taskId: task.id,
        success: false,
        error: 'Browser não inicializado',
        timestamp: new Date(),
        processingTime: Date.now() - start
      };
    }

    const visited = new Set<string>();
    const queue: string[] = [url];
    const allElements: any[] = [];
    const workflows: any[] = [];
    let pagesProcessed = 0;

    try {
      await fs.mkdir('./output', { recursive: true });

      while (queue.length && pagesProcessed < maxPages) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        visited.add(current);

        await this.safeGoto(current);
        pagesProcessed++;

        if (includeMenuDetection && this.menuModalAgent?.detectMenus) {
          try {
            const menus = await this.menuModalAgent.detectMenus();
            const origin = new URL(this.page.url()).origin;
            const hrefs = (menus ?? [])
              .flatMap((m: any) => (m.items ?? []).map((i: any) => i.href).filter(Boolean))
              .map((u: string) => (u.startsWith('http') ? u : new URL(u, origin).href));
            for (const u of hrefs) if (!visited.has(u)) queue.push(u);
          } catch {}
        }

        if (includeInteractiveElements) {
          const pageElements = await this.page.$$eval(
            'a,button,input,select,textarea,[role="button"],[role="menuitem"]',
            (els) => (els as Element[]).map(el => {
              const tag = el.tagName.toLowerCase();
              const role = el.getAttribute('role') || '';
              const text = (el.textContent || '').trim().slice(0,120);
              const id = (el as HTMLElement).id;
              const cls = (el as HTMLElement).className?.split?.(' ')?.[0];
              const selector = id ? ('#'+id) : (cls ? ('.'+cls) : tag);
              return { type: tag, role, text, selector };
            })
          );
          allElements.push(...pageElements);
        }
      }

      const duration = Date.now() - start;
      const resultPayload = { stats: { totalElements: allElements.length, pages: pagesProcessed, visited: Array.from(visited), durationMs: duration }, elements: allElements, workflows };

      if (saveResults) {
        const file = path.join('./output', `crawl-results-${new Date().toISOString().replace(/[:.]/g,'-')}.json`);
        await fs.writeFile(file, JSON.stringify(resultPayload, null, 2), 'utf-8');
      }

      return { id: task.id, taskId: task.id, success: true, data: resultPayload, timestamp: new Date(), processingTime: duration };
    } catch (error: any) {
      this.log(`Erro no crawl_site: ${error}`, 'error');
      return { id: task.id, taskId: task.id, success: false, error: String(error), timestamp: new Date(), processingTime: Date.now()-start };
    }
  }

  private async safeGoto(targetUrl: string) {
     try {
       await this.page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
       await this.waitForDomSteady(this.page);
       await Promise.race([
         this.page.waitForLoadState('networkidle', { timeout: 10_000 }),
         this.page.waitForTimeout(800),
       ]);
     } catch (e) {
       if (this.timeline?.add) this.timeline.add('warn', `Falhou goto em ${targetUrl}: ${String(e)}`);
     }
   }

   private async saveCrawlResult(data: any, outputDir?: string) {
     try {
      if (!outputDir) return null;
      await fs.mkdir(outputDir, { recursive: true });
      const file = path.join(outputDir, 'crawl-result.json');
      await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8');
      return file;
    } catch (e) {
      this.log(`Falha ao salvar crawl-result.json: ${e}`, 'warn');
      return null;
    }
  }

  private async installSpaHooks(page: Page) {
    await page.addInitScript(() => {
      const wrap = (type: 'pushState' | 'replaceState') => {
        const orig = history[type] as any;
        (history as any)[type] = function(...args: any[]) {
          const ret = orig.apply(this, args);
          window.dispatchEvent(new Event('spa:navigation'));
          return ret;
        };
      };
      wrap('pushState'); wrap('replaceState');
      window.addEventListener('popstate', () => window.dispatchEvent(new Event('spa:navigation')));
    });
  }



  private async collectInternalLinks(max = 20): Promise<string[]> {
    const origin = new URL(this.page.url()).origin;
    const links = await this.page.evaluate((origin) => {
      const out: string[] = [];
      document.querySelectorAll('a[href]')
        .forEach(a => {
          const href = (a as HTMLAnchorElement).href;
          if (!href) return;
          try {
            const u = new URL(href);
            if (u.origin === origin) out.push(u.toString());
          } catch {}
        });
      return out;
    }, origin);

    return Array.from(new Set(links)).slice(0, max);
  }

  private async snapshotPage(outputDir?: string) {
    const url = this.page.url();

    const meta = await this.page.evaluate(() => {
      const el = document;
      const bcEl = el.querySelector('[aria-label*="breadcrumb" i]') || el.querySelector('.breadcrumb, nav[aria-label="Breadcrumb"]');
      const breadcrumb = bcEl ? (bcEl.textContent || '').replace(/\s+/g, ' ').trim() : '';
      const activeTab = el.querySelector('[role="tab"][aria-selected="true"], .tab.active, .nav-tabs .active');
      const tab = activeTab?.textContent?.trim();
      let section: string | undefined;
      const fieldsetLegend = el.querySelector('fieldset > legend');
      if (fieldsetLegend) section = fieldsetLegend.textContent?.trim() || undefined;
      if (!section) {
        const labelled = el.querySelector('[aria-labelledby]') as HTMLElement | null;
        if (labelled) {
          const id = labelled.getAttribute('aria-labelledby') || '';
          const labelEl = id ? el.getElementById(id) : null;
          if (labelEl) section = labelEl.textContent?.trim() || undefined;
        }
      }
      return { breadcrumb, tab, section, title: document.title };
    });

    const classification = await this.page.evaluate(() => {
      const root = document;
      const hints: string[] = [];
      const hasTable = !!root.querySelector('table, [role="table"], .ag-grid, .MuiDataGrid-root');
      if (hasTable) hints.push('table');
      const hasForm = !!root.querySelector('form, [role="form"], input, select, textarea');
      if (hasForm) hints.push('form');
      const hasWizard = !!root.querySelector('[role="tablist"], .steps, .wizard, [data-step]');
      if (hasWizard) hints.push('wizard');
      const hasDialog = !!root.querySelector('[role="dialog"], .modal, .ant-modal, .MuiDialog-root');
      if (hasDialog) hints.push('dialog');
      const hasCharts = !!root.querySelector('canvas, svg .chart, [class*="chart"]');
      if (hasCharts) hints.push('chart');
      const title = (root.querySelector('h1,h2')?.textContent || document.title || '').trim();
      let kind: any = 'unknown';
      if (hasDialog) kind = 'dialog';
      else if (hasForm && hasTable) kind = 'wizard';
      else if (hasForm) kind = 'form';
      else if (hasTable) kind = 'list';
      else if (hasCharts) kind = 'dashboard';
      return { kind, hints, title };
    });

    let elements: any[] = [];
    try {
      elements = await this.page.evaluate(() => {
        const results: any[] = [];
        
        // Função simples para gerar seletor
        function getSelector(el: Element): string {
          if (el.id) return '#' + el.id;
          const tag = el.tagName.toLowerCase();
          const parent = el.parentElement;
          if (!parent) return tag;
          const siblings = Array.from(parent.children).filter(child => child.tagName === el.tagName);
          const index = siblings.indexOf(el) + 1;
          return `${tag}:nth-of-type(${index})`;
        }
        
        // Coletar elementos interativos
         const interactiveElements = Array.from(document.querySelectorAll('input,select,textarea,button,a,[role="button"],[role="link"],[role="menuitem"],[role="tab"],[role="dialog"]'));
         
         for (const el of interactiveElements) {
          try {
            const htmlEl = el as HTMLElement;
            const label = (htmlEl.getAttribute('aria-label') || htmlEl.getAttribute('title') || htmlEl.textContent || '').trim().slice(0, 200);
            const role = htmlEl.getAttribute('role') || '';
            const type = (htmlEl as HTMLInputElement).type || '';
            
            results.push({
              tag: htmlEl.tagName.toLowerCase(),
              label,
              role,
              type,
              selector: getSelector(htmlEl)
            });
          } catch (err) {
            // Ignorar erros de elementos individuais
          }
        }
        
        return results;
      });
    } catch (error) {
      this.log(`Erro ao extrair elementos: ${error instanceof Error ? error.message : String(error)}`, 'warn');
      elements = [];
    }

    // Screenshot por página dentro do outputDir, se fornecido
    try {
      const safe = url.replace(/[^a-z0-9]/gi, '_').slice(0, 80);
      if (outputDir) {
        await fs.mkdir(outputDir, { recursive: true });
        await this.page.screenshot({ path: path.join(outputDir, `page_${safe}_${Date.now()}.png`), fullPage: true });
      } else {
        await this.page.screenshot({ path: `manual__${Date.now()}.png`, fullPage: true });
      }
    } catch { /* ignore */ }

    return { url, meta, classification, elements };
  }
}

export default CrawlerAgent;
