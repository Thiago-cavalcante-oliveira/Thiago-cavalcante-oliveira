import { CrawlerAgent } from '../agents/CrawlerAgent';
import { Timeline } from '../services/Timeline';
import { logger } from '../utils/logger';
import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';

async function testCrawlerComplete() {
  console.log('🚀 Iniciando teste do CrawlerAgent completo...');
  
  const timeline = new Timeline();
  let browser: Browser | null = null;
  let page: Page | null = null;
  let crawler: CrawlerAgent | null = null;
  
  // Iniciar sessão do timeline
  await timeline.startSession();
  
  try {
    // Inicializar browser
    console.log('🌐 Inicializando browser...');
    browser = await chromium.launch({
      headless: false,
      slowMo: 500,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
      ignoreHTTPSErrors: true
    });
    
    page = await context.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });
    
    crawler = new CrawlerAgent();
    crawler.setTimeline(timeline);
    crawler.setBrowser(browser);
    crawler.setPage(page);
    
    console.log('🔧 Inicializando CrawlerAgent...');
    await crawler.initialize();
    
    console.log('🌐 Executando crawling completo...');
    const startTime = Date.now();
    
    const result = await crawler.processTask({
      id: `test_${Date.now()}`,
      type: 'crawl_site',
      data: {
        url: 'http://localhost:3000',
        options: {
          includeMenuDetection: true,
          includeInteractiveElements: true,
          saveResults: true
        }
      },
      priority: 'high',
      timestamp: new Date(),
      sender: 'test'
    });
    
    const duration = Date.now() - startTime;
    
    console.log('\n📊 Resultados do Crawling:');
    console.log(`⏱️  Tempo total: ${duration}ms`);
    console.log(`📄 Status: ${result.success ? '✅ Sucesso' : '❌ Falha'}`);
    console.log(`📝 Erro: ${result.success ? 'Nenhum' : (result as any).error || 'Erro desconhecido'}`);
    
    if (result.data) {
      console.log(`🎯 Total de elementos: ${(result.data as any).stats?.totalElements || 0}`);
      console.log(`📄 Páginas processadas: ${(result.data as any).stats?.pages || 0}`);
      
      // Mostrar dados básicos se disponíveis
      if ((result.data as any).elements) {
        console.log(`🔗 Elementos encontrados: ${(result.data as any).elements.length}`);
      }
      
      if ((result.data as any).workflows) {
        console.log(`⚡ Workflows: ${(result.data as any).workflows.length}`);
      }
    }
    
    // Verificar se os arquivos foram salvos
    const outputDir = './output';
    const files = await fs.readdir(outputDir).catch(() => []);
    const crawlFiles = files.filter(f => f.includes('crawl-results'));
    
    console.log(`\n💾 Arquivos salvos: ${crawlFiles.length}`);
    crawlFiles.forEach(file => {
      console.log(`  📄 ${file}`);
    });
    
    // Mostrar timeline
    const timelineReport = timeline.generateCurrentReport();
    console.log('\n📈 Timeline do Processo:');
    console.log(timelineReport);
    
    console.log('\n✅ Teste do CrawlerAgent completo finalizado com sucesso!');
    
  } catch (error: any) {
    console.error('❌ Erro no teste:', error);
    throw error;
  } finally {
    await timeline.endSession('Teste do CrawlerAgent completo finalizado');
    if (crawler) {
      await crawler.cleanup();
    }
    if (browser) {
      await browser.close();
    }
  }
}

// Executar o teste
testCrawlerComplete()
  .then(() => {
    console.log('🎉 Teste concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha no teste:', error);
    process.exit(1);
  });

export { testCrawlerComplete };