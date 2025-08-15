import { Page, Browser } from "playwright";
import { logger } from "../utils/logger";
import { retry } from "../utils/retry";
import { discoverRoutes, interactiveDiscovery } from "./routeDiscovery";
import { analyzeCurrentPage, extractPagePurpose, extractMainActions } from "./elementHeuristics";
import type { RouteInfo } from "./routeDiscovery";
import type { PageAnalysis, ElementAction } from "./elementHeuristics";
import { CrawlerResultSchema } from "../schemas";
import { z } from "zod";

const log = logger.child({ module: "smartCrawler" });

export interface CrawlResult {
  url: string;
  title: string;
  purpose: string;
  analysis: PageAnalysis;
  actions: ElementAction[];
  mainActions: string[];
  routes: RouteInfo[];
  timestamp: Date;
  error?: string;
}

export interface CrawlOptions {
  maxPages?: number;
  maxDepth?: number;
  allowDanger?: boolean;
  includeInteractive?: boolean;
  timeout?: number;
  waitForSelector?: string;
  excludePatterns?: string[];
  includePatterns?: string[];
}

export class SmartCrawler {
  private browser: Browser;
  private visitedUrls = new Set<string>();
  private results: CrawlResult[] = [];
  private options: Required<CrawlOptions>;

  constructor(browser: Browser, options: CrawlOptions = {}) {
    this.browser = browser;
    this.options = {
      maxPages: options.maxPages || 10,
      maxDepth: options.maxDepth || 3,
      allowDanger: options.allowDanger || false,
      includeInteractive: options.includeInteractive || true,
      timeout: options.timeout || 30000,
      waitForSelector: options.waitForSelector || '',
      excludePatterns: options.excludePatterns || [],
      includePatterns: options.includePatterns || []
    };
  }

  async crawlSite(startUrl: string): Promise<CrawlResult[]> {
    log.info(`Iniciando crawl inteligente de ${startUrl}`);
    
    const page = await this.browser.newPage();
    
    try {
      await this.crawlPage(page, startUrl, 0);
      log.info(`Crawl concluído: ${this.results.length} páginas analisadas`);
      return this.results;
    } finally {
      await page.close();
    }
  }

  private async crawlPage(page: Page, url: string, depth: number): Promise<void> {
    if (this.visitedUrls.has(url) || 
        depth > this.options.maxDepth || 
        this.results.length >= this.options.maxPages) {
      return;
    }

    if (!this.shouldCrawlUrl(url)) {
      log.debug(`URL excluída pelos filtros: ${url}`);
      return;
    }

    this.visitedUrls.add(url);
    log.info(`Analisando página (profundidade ${depth}): ${url}`);

    try {
      const result = await this.analyzePage(page, url);
      this.results.push(result);

      // Discover and crawl child routes if not at max depth
      if (depth < this.options.maxDepth && this.results.length < this.options.maxPages) {
        await this.crawlChildRoutes(page, result.routes, depth + 1);
      }
    } catch (error) {
      log.error(`Erro ao analisar ${url}: ${error instanceof Error ? error.message : String(error)}`);
      this.results.push({
        url,
        title: '',
        purpose: '',
        analysis: {
          title: '',
          url,
          breadcrumb: [],
          inputs: [],
          tables: [],
          actions: []
        },
        actions: [],
        mainActions: [],
        routes: [],
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async analyzePage(page: Page, url: string): Promise<CrawlResult> {
    return retry(async () => {
      // Navigate to page
      await page.goto(url, { 
        waitUntil: 'networkidle', 
        timeout: this.options.timeout 
      });

      // Wait for custom selector if provided
      if (this.options.waitForSelector) {
        await page.waitForSelector(this.options.waitForSelector, { 
          timeout: 5000 
        }).catch(() => {
          log.warn(`Seletor de espera não encontrado: ${this.options.waitForSelector}`);
        });
      }

      // Extract page information in parallel
      const [pageAnalysisResult, purpose, mainActions, routes] = await Promise.all([
        analyzeCurrentPage(page, this.options.allowDanger),
        extractPagePurpose(page),
        extractMainActions(page),
        discoverRoutes(page)
      ]);

      // Interactive discovery if enabled
      let interactiveRoutes: RouteInfo[] = [];
      if (this.options.includeInteractive) {
        try {
          interactiveRoutes = await interactiveDiscovery(page, {
            maxInteractions: 5,
            timeout: 3000
          });
        } catch (error) {
          log.warn(`Descoberta interativa falhou para ${url}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      const allRoutes = [...routes, ...interactiveRoutes];
      const uniqueRoutes = this.deduplicateRoutes(allRoutes);

      const result: CrawlResult = {
        url,
        title: pageAnalysisResult.analysis.title,
        purpose,
        analysis: pageAnalysisResult.analysis,
        actions: pageAnalysisResult.actions,
        mainActions,
        routes: uniqueRoutes,
        timestamp: new Date()
      };

      // Validate result with schema
      try {
        CrawlerResultSchema.parse({
          url: result.url,
          title: result.title,
          content: result.purpose,
          elements: result.actions.map(action => ({
            type: action.type || 'unknown',
            text: action.text || '',
            selector: action.selector,
            attributes: {
              href: action.href,
              role: action.role,
              danger: action.danger?.toString()
            }
          })),
          links: uniqueRoutes.map(route => route.url),
          timestamp: result.timestamp.toISOString()
        });
      } catch (validationError) {
        log.warn(`Resultado não passou na validação do schema: ${validationError instanceof Error ? validationError.message : String(validationError)}`);
      }

      return result;
    }, 3, 2000);
  }

  private async crawlChildRoutes(page: Page, routes: RouteInfo[], depth: number): Promise<void> {
    const filteredRoutes = routes
      .filter(route => this.shouldCrawlUrl(route.url))
      .filter(route => !this.visitedUrls.has(route.url))
      .slice(0, Math.max(1, Math.floor((this.options.maxPages - this.results.length) / depth)));

    for (const route of filteredRoutes) {
      if (this.results.length >= this.options.maxPages) break;
      await this.crawlPage(page, route.url, depth);
    }
  }

  private shouldCrawlUrl(url: string): boolean {
    // Check include patterns first
    if (this.options.includePatterns.length > 0) {
      const included = this.options.includePatterns.some(pattern => 
        new RegExp(pattern).test(url)
      );
      if (!included) return false;
    }

    // Check exclude patterns
    if (this.options.excludePatterns.length > 0) {
      const excluded = this.options.excludePatterns.some(pattern => 
        new RegExp(pattern).test(url)
      );
      if (excluded) return false;
    }

    // Default exclusions
    const defaultExclusions = [
      /\.(pdf|doc|docx|xls|xlsx|zip|rar|exe|dmg)$/i,
      /\/api\//,
      /\/admin\//,
      /\/(login|logout|signin|signout)$/i,
      /#/,
      /javascript:/,
      /mailto:/,
      /tel:/
    ];

    return !defaultExclusions.some(pattern => pattern.test(url));
  }

  private deduplicateRoutes(routes: RouteInfo[]): RouteInfo[] {
    const seen = new Set<string>();
    return routes.filter(route => {
      if (seen.has(route.url)) return false;
      seen.add(route.url);
      return true;
    });
  }

  // Static method for quick single-page analysis
  static async analyzeSinglePage(
    browser: Browser, 
    url: string, 
    options: Partial<CrawlOptions> = {}
  ): Promise<CrawlResult> {
    const crawler = new SmartCrawler(browser, { ...options, maxPages: 1, maxDepth: 0 });
    const results = await crawler.crawlSite(url);
    return results[0];
  }

  // Get crawl statistics
  getStats() {
    return {
      totalPages: this.results.length,
      successfulPages: this.results.filter(r => !r.error).length,
      errorPages: this.results.filter(r => r.error).length,
      totalInputs: this.results.reduce((sum, r) => sum + r.analysis.inputs.length, 0),
      totalTables: this.results.reduce((sum, r) => sum + r.analysis.tables.length, 0),
      totalActions: this.results.reduce((sum, r) => sum + r.actions.length, 0),
      visitedUrls: Array.from(this.visitedUrls)
    };
  }

  // Export results in different formats
  exportResults(format: 'json' | 'summary' = 'json') {
    if (format === 'summary') {
      return this.results.map(result => ({
        url: result.url,
        title: result.title,
        purpose: result.purpose,
        inputCount: result.analysis.inputs.length,
        tableCount: result.analysis.tables.length,
        actionCount: result.actions.length,
        routeCount: result.routes.length,
        error: result.error
      }));
    }
    return this.results;
  }
}

// Utility function for quick crawling
export async function quickCrawl(
  browser: Browser,
  startUrl: string,
  options: CrawlOptions = {}
): Promise<CrawlResult[]> {
  const crawler = new SmartCrawler(browser, options);
  return crawler.crawlSite(startUrl);
}