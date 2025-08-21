import { chromium } from 'playwright';
import { LoginAgent } from './agents/LoginAgent.js';
import { CrawlerAgent } from './agents/CrawlerAgent.js';

async function testSaebLoginWithCrawler() {
  console.log('🚀 Iniciando teste de login SAEB com crawler...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Inicializar agentes
    const loginAgent = new LoginAgent();
    const crawlerAgent = new CrawlerAgent();
    
    await loginAgent.initialize();
    await crawlerAgent.initialize();
    
    console.log('📍 Executando LoginAgent...');
    
    // Executar login através do agente
    const loginResult = await loginAgent.processTask({
      id: `saeb-login-${Date.now()}`,
      type: 'authenticate',
      priority: 'high',
      sender: 'test-saeb-with-crawler',
      data: {
        page: page,
        credentials: {
          username: 'admin',
          password: 'admin123',
          loginUrl: 'https://saeb-h1.pmfi.pr.gov.br/auth/signin'
        }
      },
      timestamp: new Date()
    });
    
    console.log('🔐 Resultado do login:', JSON.stringify({
      success: loginResult.success,
      error: loginResult.error
    }, null, 2));
    
    if (loginResult.success) {
      console.log('✅ Login bem-sucedido! Iniciando crawler...');
      
      // Executar crawler após login bem-sucedido
       const crawlResult = await crawlerAgent.processTask({
          id: `saeb-crawl-${Date.now()}`,
          type: 'crawl_website',
          priority: 'high',
          sender: 'test-saeb-with-crawler',
          data: {
            page: page,
            url: page.url(),
            maxPages: 3,
            maxDepth: 2,
            includeScreenshots: true,
            analyzeElements: true
          },
          timestamp: new Date()
        });
      
      console.log('🕷️ Resultado do crawling:', JSON.stringify({
        success: crawlResult.success,
        pagesProcessed: crawlResult.data?.statistics?.pagesProcessed || 0,
        elementsFound: crawlResult.data?.statistics?.elementsAnalyzed || 0,
        error: crawlResult.error
      }, null, 2));
      
      if (crawlResult.success) {
        console.log('✅ Crawling concluído com sucesso!');
      } else {
        console.log('❌ Crawling falhou:', crawlResult.error);
      }
    } else {
      console.log('❌ Login falhou, não executando crawler:', loginResult.error);
    }
    
    // Cleanup dos agentes
    await loginAgent.cleanup();
    await crawlerAgent.cleanup();
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await browser.close();
    console.log('🏁 Teste finalizado');
  }
}

// Executar o teste
testSaebLoginWithCrawler().catch(console.error);