import { chromium, Browser, Page } from 'playwright';
import { SmartLoginAgent } from './agents/SmartLoginAgent';
import { EnhancedCrawlerAgent } from './agents/EnhancedCrawlerAgent';
import { MinIOService } from './services/MinIOService';
import { LLMManager } from './services/LLMManager';

async function testSimpleEnhanced() {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    console.log('🚀 Iniciando teste simplificado do Enhanced Crawler...');

    // Configurar serviços
    const minioService = new MinIOService();
    const llmManager = new LLMManager();

    // Inicializar browser
    browser = await chromium.launch({ 
      headless: false,
      slowMo: 1000
    });
    page = await browser.newPage();

    // Criar agentes
    const loginAgent = new SmartLoginAgent();
    const enhancedCrawler = new EnhancedCrawlerAgent(minioService, llmManager);

    console.log('📋 Executando login...');
    
    // Configurar a página no agente
    loginAgent.setPage(page);
    
    const loginResult = await loginAgent.processTask({
      id: 'login_test',
      type: 'smart_login',
      data: {
        baseUrl: 'https://saeb.pmfi.pr.gov.br/login',
        credentials: {
          username: 'thiago.cavalcante@pmfi.pr.gov.br',
          password: 'Thiago@2024'
        }
      },
      sender: 'test',
      timestamp: new Date(),
      priority: 'high'
    });

    if (!loginResult.success) {
      throw new Error(`Falha no login: ${loginResult.error}`);
    }

    console.log('✅ Login realizado com sucesso!');
    console.log('🗺️ Iniciando mapeamento da home page...');

    // Aguardar um pouco para garantir que a página pós-login carregou
    await page.waitForTimeout(5000);

    // Configurar a página no crawler
    enhancedCrawler.setPage(page);

    // Executar mapeamento da home page
    const mappingResult = await enhancedCrawler.processTask({
      id: 'map_home_page_test',
      type: 'map_home_page',
      data: {},
      sender: 'test',
      timestamp: new Date(),
      priority: 'high'
    });

    if (!mappingResult.success) {
      console.log(`⚠️ Mapeamento falhou: ${mappingResult.error}`);
    } else {
      console.log('✅ Mapeamento da home page concluído!');
      console.log('📊 Elementos encontrados:', mappingResult.data?.elementsFound || 0);
      console.log('🧭 Elementos de navegação:', mappingResult.data?.navigationElements?.length || 0);
    }

    // Aguardar para visualizar
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    console.log('🧹 Fechando página...');
    if (page) await page.close();
    
    console.log('🧹 Fechando browser...');
    if (browser) await browser.close();
    
    console.log('✅ Teste finalizado!');
  }
}

testSimpleEnhanced().catch(console.error);