import { chromium, Browser, Page } from 'playwright';
import { SmartLoginAgent } from './agents/SmartLoginAgent';
import { EnhancedCrawlerAgent } from './agents/EnhancedCrawlerAgent';
import { MinIOService } from './services/MinIOService';
import { LLMManager } from './services/LLMManager';
import * as fs from 'fs/promises';
import * as path from 'path';

async function testEnhancedCrawler() {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    console.log('🚀 Iniciando teste do Enhanced Crawler Agent...');

    // Inicializar browser
    browser = await chromium.launch({ 
      headless: false,
      slowMo: 1000 // Mais lento para observar melhor
    });
    
    page = await browser.newPage();
    
    // Configurar viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Inicializar serviços
    const minioService = new MinIOService();
    const llmManager = new LLMManager();

    // Inicializar agentes
    const loginAgent = new SmartLoginAgent(llmManager, minioService);
    const enhancedCrawler = new EnhancedCrawlerAgent(minioService, llmManager);

    // Configurar página nos agentes
    loginAgent.setPage(page);
    enhancedCrawler.setPage(page);

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
    console.log('🗺️ Iniciando mapeamento inteligente da home page...');

    // Aguardar um pouco para garantir que a página pós-login carregou
    await page.waitForTimeout(5000);

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
      throw new Error(`Falha no mapeamento: ${mappingResult.error}`);
    }

    console.log('✅ Mapeamento da home page concluído!');
    
    if (mappingResult.data?.needsUserClick) {
      console.log('🖱️ Menu principal não encontrado automaticamente. Solicitando clique do usuário...');
      throw new Error(`Menu não encontrado: ${mappingResult.error}`);
    }

    console.log('📊 Resultado do mapeamento:');
    console.log(`- Sucesso: ${mappingResult.success}`);
    console.log(`- Mensagem: ${mappingResult.message}`);
    
    if (mappingResult.data?.userInteractionRequired) {
      console.log('\n⚠️ INTERAÇÃO DO USUÁRIO NECESSÁRIA!');
      console.log('📍 Instruções:', mappingResult.data.userInstructions);
      
      // Simular aguardo de clique do usuário
      console.log('\n🖱️ Simulando clique do usuário no menu...');
      console.log('(Em um cenário real, o sistema aguardaria o clique real do usuário)');
      
      // Aguardar um pouco para simular o tempo de reação do usuário
      await page.waitForTimeout(3000);
      
      // Tentar encontrar um elemento que pareça ser um menu e simular clique
      const menuElement = await page.locator('nav, .menu, .navbar, [role="navigation"]').first();
      
      if (await menuElement.count() > 0) {
        const boundingBox = await menuElement.boundingBox();
        if (boundingBox) {
          console.log(`🎯 Simulando clique na posição: ${boundingBox.x + boundingBox.width/2}, ${boundingBox.y + boundingBox.height/2}`);
          
          // Processar o clique simulado
          const clickResult = await enhancedCrawler.processTask({
            id: 'user_click_test',
            type: 'process_user_click',
            data: {
              clickPosition: {
                x: boundingBox.x + boundingBox.width/2,
                y: boundingBox.y + boundingBox.height/2
              }
            },
            sender: 'test',
            timestamp: new Date(),
            priority: 'high'
          });
          
          if (clickResult.success) {
            console.log('✅ Clique processado com sucesso!');
            console.log('📋 Mapeamento atualizado após interação do usuário');
          }
        }
      } else {
        console.log('⚠️ Nenhum elemento de menu encontrado para simulação');
      }
    } else {
      console.log('✅ Menu de navegação identificado automaticamente!');
      
      // Executar crawling completo
      console.log('🔍 Executando crawling completo...');
      
      const crawlResult = await enhancedCrawler.processTask({
        id: 'complete_crawl_test',
        type: 'complete_crawl',
        data: {},
        sender: 'test',
        timestamp: new Date(),
        priority: 'high'
      });
      
      if (crawlResult.success) {
        console.log('✅ Crawling completo finalizado!');
        console.log(`📄 Páginas mapeadas: ${crawlResult.data?.pages?.length || 0}`);
      }
    }

    // Verificar se o relatório foi gerado
    const reportPath = path.join(process.cwd(), 'output', 'enhanced-crawl-report.md');
    try {
      await fs.access(reportPath);
      console.log(`📋 Relatório detalhado gerado: ${reportPath}`);
      
      // Ler e exibir parte do relatório
      const reportContent = await fs.readFile(reportPath, 'utf-8');
      console.log('\n📖 Prévia do relatório:');
      console.log('=' .repeat(50));
      console.log(reportContent.substring(0, 500) + '...');
      console.log('=' .repeat(50));
      
    } catch (error) {
      console.log('⚠️ Relatório não encontrado');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    // Cleanup
    if (page) {
      console.log('🧹 Fechando página...');
      await page.close();
    }
    
    if (browser) {
      console.log('🧹 Fechando browser...');
      await browser.close();
    }
    
    console.log('✅ Teste finalizado!');
  }
}

// Executar o teste
testEnhancedCrawler().catch(console.error);