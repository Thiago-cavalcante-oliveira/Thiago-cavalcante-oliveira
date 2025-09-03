// Barrel exports for crawler module
export * from './routeDiscovery';

// Named exports for convenience
export { discoverRoutes, interactiveDiscovery } from './routeDiscovery';

// Type exports
export type { RouteInfo, DiscoveryOptions } from './routeDiscovery';

import { Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs/promises';

interface ExplorePageOptions {
  startUrl: string;
  outputDir: string;
  enableScreenshots: boolean;
}

// Helper function to wait for DOM to be steady
async function waitForDomSteady(page: Page, timeout = 3000): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500); // Small delay to ensure stability
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
    await waitForDomSteady(page);
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

    // Coletar todos os links visíveis primeiro
    const links = await page.$$('a[href]');
    const linkData: { href: string | null; text: string | null; selector: string }[] = [];
    for (const link of links) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      if (href) {
          linkData.push({ href, text, selector: `a[href="${href}"]` });
        }
      }

    // Iterar sobre os links coletados e interagir
    for (const { href, text, selector } of linkData) {
      try {
        console.log(`
🔗 Tentando clicar no link: ${text} (${href})`);
        // Navegar para o link
        await page.goto(href!, { waitUntil: 'domcontentloaded' });
        await waitForDomSteady(page);

        pageReport.attemptedActions.push({
          type: 'navigate',
          selector,
          text,
          status: 'success',
        });

        if (enableScreenshots) {
          const screenshotPath = path.join(outputDir, `screenshot-after-navigation-${Date.now()}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: true });
          pageReport.screenshots.push(screenshotPath);
        }

        // Voltar para a página original para continuar a exploração
        await page.goBack();
        await page.waitForLoadState('domcontentloaded');
        await waitForDomSteady(page);
      } catch (error: any) {
        console.error(`
❌ Erro ao navegar para o link: ${error.message}`);
        pageReport.attemptedActions.push({
          type: 'navigate',
          selector,
          text,
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