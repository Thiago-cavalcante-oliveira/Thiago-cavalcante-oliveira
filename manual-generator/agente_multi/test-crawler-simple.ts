import { SmartCrawler } from './crawler/smartCrawler.js';
import { chromium } from 'playwright';
import { logger } from './utils/logger.js';

async function testSimpleCrawler() {
  logger.info('🚀 Iniciando teste simples do SmartCrawler...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Teste com uma página simples
    await page.goto('https://example.com');
    logger.info('✅ Página carregada com sucesso');
    
    // Testar análise de página única
    const result = await SmartCrawler.analyzeSinglePage(browser, 'https://example.com', {
      timeout: 5000
    });
    logger.info('✅ Análise de página concluída');
    logger.info(`📊 Resultado: ${JSON.stringify(result, null, 2)}`);
    
    // Testar crawler completo
    const crawler = new SmartCrawler(browser, {
      maxDepth: 1,
      timeout: 5000,
      maxPages: 3
    });
    
    const crawlResults = await crawler.crawlSite('https://example.com');
    logger.info('✅ Crawling completo concluído');
    logger.info(`📈 Resultados do crawling: ${crawlResults.length} páginas analisadas`);
    
  } catch (error) {
    logger.error(`❌ Erro durante o teste: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    await browser.close();
    logger.info('🔒 Browser fechado');
  }
}

// Executar teste
testSimpleCrawler().catch(error => {
  logger.error(`💥 Erro no teste: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});