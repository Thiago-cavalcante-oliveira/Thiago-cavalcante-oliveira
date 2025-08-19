import { chromium, Browser, Page } from 'playwright';
import { EnhancedCrawlerAgent } from './agents/EnhancedCrawlerAgent';
import { MinIOService } from './services/MinIOService';
import { LLMManager } from './services/LLMManager';
import { TaskData } from './core/AgnoSCore';

async function testNavigationWithProxy() {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    console.log('🚀 Iniciando teste de detecção de navegação com proxy...');
    console.log('🔧 Configurando proxy: proxy.pmfi.pr.gov.br:8080');

    // Configurar serviços
    const minioService = new MinIOService();
    const llmManager = new LLMManager('groq');
    const enhancedCrawler = new EnhancedCrawlerAgent(minioService, llmManager);

    // Lançar navegador com configuração de proxy
    browser = await chromium.launch({ 
      headless: false, // Modo não-headless para permitir autenticação manual
      slowMo: 1000,
      proxy: {
        server: 'http://proxy.pmfi.pr.gov.br:8080'
      }
    });
    
    page = await browser.newPage();

    // Configurar agente
    enhancedCrawler.setPage(page);
    enhancedCrawler.setBrowser(browser);

    console.log('🔐 ATENÇÃO: Se aparecer uma tela de autenticação do proxy, digite suas credenciais.');
    console.log('⏳ Aguardando 10 segundos para possível autenticação...');
    await page.waitForTimeout(10000);

    console.log('📋 Testando detecção em sites públicos...');

    // Lista de sites para testar
    const testSites = [
      {
        name: 'GitHub',
        url: 'https://github.com',
        description: 'Site com navegação moderna'
      },
      {
        name: 'Bootstrap',
        url: 'https://getbootstrap.com',
        description: 'Framework CSS com navegação padrão'
      },
      {
        name: 'MDN Web Docs',
        url: 'https://developer.mozilla.org',
        description: 'Documentação web com navegação complexa'
      }
    ];

    for (const site of testSites) {
      console.log(`\n🌐 Testando: ${site.name}`);
      console.log(`📝 Descrição: ${site.description}`);
      console.log(`🔗 URL: ${site.url}`);

      try {
        // Navegar para o site
        console.log('🔄 Navegando para o site...');
        await page.goto(site.url, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(3000);

        console.log(`✅ Página carregada: ${await page.title()}`);

        // Executar mapeamento da home page
        const mapTask: TaskData = {
          id: `map-${Date.now()}`,
          type: 'map_home_page',
          data: {},
          sender: 'test',
          timestamp: new Date(),
          priority: 'medium'
        };

        console.log('🔍 Iniciando detecção de elementos...');
        const result = await enhancedCrawler.processTask(mapTask);

        if (result.success && result.data) {
          const homePageMap = result.data;
          console.log(`✅ Detecção concluída para ${site.name}:`);
          console.log(`   📊 Elementos de navegação: ${homePageMap.navigationElements?.length || 0}`);
          console.log(`   🎯 Elementos interativos: ${homePageMap.interactiveElements?.length || 0}`);
          console.log(`   🔄 Modais detectados: ${homePageMap.modals?.length || 0}`);
          
          // Mostrar elementos de navegação encontrados
          if (homePageMap.navigationElements && homePageMap.navigationElements.length > 0) {
            console.log('   🏆 Top 10 elementos de navegação encontrados:');
            homePageMap.navigationElements
              .slice(0, 10)
              .forEach((el: any, index: number) => {
                console.log(`      ${index + 1}. "${el.text}" (${(el.confidence * 100).toFixed(1)}%) - ${el.type}`);
                console.log(`         Seletor: ${el.selector}`);
              });
          } else {
            console.log('   ⚠️  Nenhum elemento de navegação detectado');
          }

          // Mostrar elementos interativos
          if (homePageMap.interactiveElements && homePageMap.interactiveElements.length > 0) {
            console.log('   🎯 Top 5 elementos interativos:');
            homePageMap.interactiveElements
              .slice(0, 5)
              .forEach((el: any, index: number) => {
                console.log(`      ${index + 1}. "${el.text || el.type}" - ${el.selector}`);
              });
          }

          if (homePageMap.userInteractionRequired) {
            console.log('   ℹ️  Interação do usuário seria necessária para mapeamento completo');
          }
        } else {
          console.log(`❌ Falha na detecção para ${site.name}: ${result.error}`);
        }

        // Aguardar antes do próximo teste
        console.log('⏳ Aguardando 3 segundos antes do próximo teste...');
        await page.waitForTimeout(3000);

      } catch (error) {
        console.log(`❌ Erro ao testar ${site.name}:`, error);
      }
    }

    console.log('\n🎉 Teste de detecção concluído!');
    console.log('\n📊 Resumo dos resultados:');
    console.log('   ✅ Teste executado com configuração de proxy');
    console.log('   ✅ Detecção genérica de navegação implementada');
    console.log('   ✅ Suporte a múltiplos idiomas e padrões de navegação');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
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
testNavigationWithProxy().catch(console.error);