/*
 * src/agents/CrawlerAgent.ts
 * Agente responsável por explorar o DOM, coletar elementos e tirar snapshots por página.
 */

import { Page, Browser } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseAgent, TaskData, TaskResult } from '../core/AgnoSCore';

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

  async initialize() { /* noop */ }
  async cleanup() { /* noop */ }

  protected override log(message: string, level: 'info'|'warn'|'error' = 'info') {
    const emoji = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '🕷️';
    console.log(`${emoji} [CrawlerAgent] ${new Date().toISOString()} - ${message}`);
  }

  async processTask(task: TaskData): Promise<TaskResult> {
    const start = Date.now();
    if (task.type !== 'start_authenticated_crawl') {
      return { id: task.id, taskId: task.id, success: false, error: 'Unsupported task', timestamp: new Date(), processingTime: 0 };
    }

    const outputDir: string | undefined = task.data?.outputDir;

    try {
      await this.installSpaHooks(this.page);

      const visited = new Set<string>();
      const pages: any[] = [];

      let routes: string[] = [];
      try {
        routes = await this.menuModalAgent?.discoverRoutes?.(this.page) || [];
      } catch { }

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

  private async safeGoto(url: string) {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await Promise.race([
      this.page.waitForLoadState('networkidle').catch(()=>{}),
      this.page.waitForEvent('framenavigated').catch(()=>{}),
      this.page.waitForTimeout(800)
    ]);
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

    const elements = await this.page.evaluate(() => {
      function sel(el: Element): string {
        try {
          const id = (el as HTMLElement).id; if (id) return `#${CSS.escape(id)}`;
          const name = (el as HTMLElement).getAttribute('name'); if (name) return `${el.tagName.toLowerCase()}[name="${CSS.escape(name)}"]`;
          const tag = el.tagName.toLowerCase();
          const idx = Array.from(el.parentElement?.children || []).filter(s => s.tagName === el.tagName).indexOf(el) + 1;
          return `${tag}:nth-of-type(${idx})`;
        } catch { return (el as HTMLElement).tagName?.toLowerCase?.() || 'element'; }
      }

      function collectFrom(root: Document | ShadowRoot): any[] {
        const out: any[] = [];
        const doc = (root as any).ownerDocument || document; // <— FIX: ShadowRoot não possui createTreeWalker
        const walker = doc.createTreeWalker(root as any, NodeFilter.SHOW_ELEMENT);
        while (walker.nextNode()) {
          const el = walker.currentNode as HTMLElement;
          if (!el.matches) continue;
          if (el.matches('input,select,textarea,button,a,[role="button"],[role="link"],[role="menuitem"],[role="tab"],[role="dialog"]')) {
            const label = (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '').trim().slice(0, 200);
            const role = el.getAttribute('role') || '';
            const type = (el as HTMLInputElement).type || '';
            out.push({ tag: el.tagName.toLowerCase(), label, role, type, selector: sel(el) });
          }
        }
        return out;
      }

      const results = collectFrom(document);
      const all = Array.from(document.querySelectorAll('*'));
      for (const e of all) {
        const sr = (e as any).shadowRoot as ShadowRoot | undefined;
        if (sr) results.push(...collectFrom(sr));
      }
      const ifr = Array.from(document.querySelectorAll('iframe')) as HTMLIFrameElement[];
      for (const i of ifr) {
        try { const doc = i.contentDocument; if (doc) results.push(...collectFrom(doc)); } catch {}
      }
      return results;
    });

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
