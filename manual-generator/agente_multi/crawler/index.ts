// Barrel exports for crawler module
export * from './routeDiscovery';
export * from './elementHeuristics';
export * from './smartCrawler';

// Named exports for convenience
export { SmartCrawler, quickCrawl } from './smartCrawler';
export { discoverRoutes, interactiveDiscovery } from './routeDiscovery';
export { analyzeCurrentPage, extractPagePurpose, extractMainActions } from './elementHeuristics';

// Type exports
export type { RouteInfo, DiscoveryOptions } from './routeDiscovery';
export type { ElementAction, PageAnalysis } from './elementHeuristics';

import { Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs/promises';

interface ExplorePageOptions {
  startUrl: string;
  outputDir: string;
  enableScreenshots: boolean;
}

export async function explorePage(page: Page, options: ExplorePageOptions) {
  const { startUrl, outputDir, enableScreenshots } = options;

  console.log(`
🚀 Iniciando exploração da página: ${startUrl}`);

  const pageReport: any = {
    url: startUrl,
    title: '',
    attemptedActions: [],
    apiCalls: [],
    consoleErrors: [],
    domMutations: [],
    screenshots: [],
  };

  const initialBefore = Date.now();

  try {
    await page.goto(startUrl, { waitUntil: 'domcontentloaded' });
    await this.waitForDomSteady(page);
    pageReport.title = await page.title();

    // Monitorar chamadas de API
    page.on('request', request => {
      if (request.resourceType() === 'xhr' || request.resourceType() === 'fetch') {
        pageReport.apiCalls.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
        });
      }
    });

    // Monitorar erros do console
    page.on('console', message => {
      if (message.type() === 'error') {
        pageReport.consoleErrors.push({
          type: message.type(),
          text: message.text(),
        });
      }
    });

    // Capturar screenshot inicial
    if (enableScreenshots) {
      const screenshotPath = path.join(outputDir, `screenshot-${Date.now()}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      pageReport.screenshots.push(screenshotPath);
    }

    // Exemplo de interação: clicar em todos os links visíveis
    const links = await page.$$('a[href]');
    for (const link of links) {
      try {
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        console.log(`
🔗 Tentando clicar no link: ${text} (${href})`);
        await link.click();
        pageReport.attemptedActions.push({
          type: 'click',
          selector: `a[href="${href}"]`,
          text,
          status: 'success',
        });
        await page.waitForLoadState('networkidle'); // Esperar a rede estabilizar
        if (enableScreenshots) {
          const screenshotPath = path.join(outputDir, `screenshot-after-click-${Date.now()}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: true });
          pageReport.screenshots.push(screenshotPath);
        }
        await page.goBack(); // Voltar para a página original para continuar a exploração
        await page.waitForLoadState('domcontentloaded');
      } catch (error: any) {
        console.error(`
❌ Erro ao clicar no link: ${error.message}`);
        pageReport.attemptedActions.push({
          type: 'click',
          selector: `a[href="${await link.getAttribute('href')}"]`,
          text: await link.textContent(),
          status: 'failure',
          error: error.message,
        });
      }
    }

    // Salvar relatório
    const reportPath = path.join(outputDir, `page-report-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(pageReport, null, 2), 'utf-8');

    return { pageReport, initialBefore, outputDir };
  } catch (error: any) {
    console.error(`
❌ Erro durante a exploração da página: ${error.message}`);
    pageReport.error = error.message;
    const reportPath = path.join(outputDir, `page-report-error-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(pageReport, null, 2), 'utf-8');
    throw error;
  }
}