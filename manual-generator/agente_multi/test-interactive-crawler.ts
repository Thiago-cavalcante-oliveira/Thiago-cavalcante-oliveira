import { CrawlerAgent } from './agents/CrawlerAgent';
import { chromium, Browser, Page } from 'playwright';
import { MinIOService } from './services/MinIOService';

async function testInteractiveCrawler() {
  let browser: Browser | null = null;
  let page: Page | null = null;
  
  try {
    console.log('🚀 Iniciando teste do CrawlerAgent Interativo...');
    
    // Configurar MinIO
    const minioService = new MinIOService();
    await minioService.initialize();
    console.log('✅ MinIO configurado e conectado');
    
    // Inicializar browser com modo visual
    browser = await chromium.launch({ 
      headless: false,
      slowMo: 1000, // Slow motion para visualizar as interações
      args: ['--start-maximized']
    });
    
    const context = await browser.newContext({
      viewport: null // Usar viewport completo
    });
    
    page = await context.newPage();
    console.log('🌐 Browser iniciado em modo visual');
    
    // Navegar para um site educacional público
    console.log('🔗 Navegando para site educacional...');
    console.log('📄 Carregando: https://www.todamateria.com.br/saeb/');
    await page.goto('https://www.todamateria.com.br/saeb/', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Aguardar carregamento
    await page.waitForTimeout(3000);
    console.log('✅ Página carregada');
    
    // Usar o CrawlerAgent interativo
    console.log('🤖 Inicializando CrawlerAgent...');
    const { LLMManager } = await import('./services/LLMManager');
    const llmManager = new LLMManager('gemini');
    const crawlerAgent = new CrawlerAgent(minioService, llmManager);
    await crawlerAgent.initialize();
    crawlerAgent.setPage(page);
    crawlerAgent.setBrowser(browser);
    console.log('✅ CrawlerAgent inicializado e pronto para crawling interativo');
    console.log('🔧 Sistema de autenticação de proxy configurado e ativo');
    
    console.log('🕷️ Iniciando crawling interativo...');
    console.log('👆 O CrawlerAgent irá:');
    console.log('   - Detectar todos os elementos clicáveis');
    console.log('   - Clicar em botões e links');
    console.log('   - Abrir modais e menus');
    console.log('   - Capturar screenshots de cada interação');
    console.log('   - Mapear todas as funcionalidades');
    console.log('   - Documentar ações e resultados');
    
    const crawlResult = await crawlerAgent.processTask({
      id: 'interactive-crawl-task',
      type: 'start_crawl',
      sender: 'test-interactive-crawler',
      priority: 'high',
      data: {
        url: page.url(),
        maxDepth: 3,
        waitTime: 2000,
        exploreAllPages: true,
        captureInteractions: true
      },
      timestamp: new Date()
    });
    
    if (crawlResult.success) {
      console.log('\n🎉 Crawling interativo concluído com sucesso!');
      console.log('\n📊 Resultados do Crawling Interativo:');
      
      const data = crawlResult.data;
      
      if (data.pageObjective) {
        console.log('\n🎯 Objetivo Central da Página:');
        console.log(`   Propósito: ${data.pageObjective.centralPurpose}`);
        console.log(`   Funcionalidades: ${data.pageObjective.mainFunctionalities.length}`);
        console.log('   Funcionalidades principais:');
        data.pageObjective.mainFunctionalities.forEach((func: string, index: number) => {
          console.log(`     ${index + 1}. ${func}`);
        });
      }
      
      if (data.interactiveElements) {
        console.log('\n🖱️ Elementos Interativos Testados:');
        console.log(`   Total de elementos: ${data.interactiveElements.length}`);
        
        data.interactiveElements.forEach((element: any, index: number) => {
          console.log(`\n   ${index + 1}. ${element.element.text || element.element.type}`);
          console.log(`      Tipo: ${element.element.type}`);
          console.log(`      Seletor: ${element.element.selector}`);
          console.log(`      Ação: ${element.functionality.action}`);
          console.log(`      Resultado esperado: ${element.functionality.expectedResult}`);
          console.log(`      Foi clicado: ${element.interactionResults.wasClicked ? '✅ Sim' : '❌ Não'}`);
          
          if (element.functionality.destinationUrl) {
            console.log(`      URL de destino: ${element.functionality.destinationUrl}`);
          }
          
          if (element.functionality.opensModal) {
            console.log(`      Abre modal: ✅ Sim`);
          }
          
          if (element.interactionResults.screenshotBefore) {
            console.log(`      📸 Screenshot antes: ${element.interactionResults.screenshotBefore}`);
          }
          
          if (element.interactionResults.screenshotAfter) {
            console.log(`      📸 Screenshot depois: ${element.interactionResults.screenshotAfter}`);
          }
          
          if (element.interactionResults.visualChanges.length > 0) {
            console.log(`      🔄 Mudanças visuais: ${element.interactionResults.visualChanges.join(', ')}`);
          }
          
          if (element.interactionResults.newElementsAppeared.length > 0) {
            console.log(`      ✨ Novos elementos: ${element.interactionResults.newElementsAppeared.join(', ')}`);
          }
        });
      }
      
      if (data.workflows) {
        console.log('\n🔄 Workflows Identificados:');
        data.workflows.forEach((workflow: any, index: number) => {
          console.log(`\n   ${index + 1}. ${workflow.name}`);
          console.log(`      Descrição: ${workflow.description}`);
          console.log(`      Critério de conclusão: ${workflow.completionCriteria}`);
          console.log(`      Passos:`);
          workflow.steps.forEach((step: any) => {
            console.log(`        ${step.stepNumber}. ${step.action} (${step.element})`);
            console.log(`           Resultado: ${step.expectedOutcome}`);
          });
        });
      }
      
      if (data.hiddenFunctionalities && data.hiddenFunctionalities.length > 0) {
        console.log('\n🔍 Funcionalidades Ocultas Descobertas:');
        data.hiddenFunctionalities.forEach((feature: any, index: number) => {
          console.log(`   ${index + 1}. ${feature.type}`);
          console.log(`      Elemento: ${feature.triggerElement}`);
          console.log(`      Descrição: ${feature.description}`);
          console.log(`      Método de acesso: ${feature.accessMethod}`);
        });
      }
      
      if (data.statistics) {
        console.log('\n📈 Estatísticas Finais:');
        console.log(`   📊 Elementos testados: ${data.statistics.totalElementsTested}`);
        console.log(`   ✅ Interações bem-sucedidas: ${data.statistics.successfulInteractions}`);
        console.log(`   🌐 Páginas descobertas: ${data.statistics.pagesDiscovered}`);
        console.log(`   🔄 Workflows identificados: ${data.statistics.workflowsIdentified}`);
        console.log(`   🔍 Funcionalidades ocultas: ${data.statistics.hiddenFeaturesFound}`);
        
        const successRate = data.statistics.totalElementsTested > 0 
          ? ((data.statistics.successfulInteractions / data.statistics.totalElementsTested) * 100).toFixed(1)
          : '0';
        console.log(`   📊 Taxa de sucesso: ${successRate}%`);
      }
      
      // Gerar relatório
      console.log('\n📄 Gerando relatório detalhado...');
      const report = await crawlerAgent.generateMarkdownReport(crawlResult);
      console.log('✅ Relatório gerado com sucesso!');
      
      // Manter o browser aberto por 30 segundos para visualização
      console.log('\n⏰ Mantendo browser aberto por 30 segundos para visualização das interações...');
      console.log('   Você pode ver as mudanças visuais que foram capturadas!');
      await page.waitForTimeout(30000);
      
    } else {
      console.error('❌ Erro no crawling:', crawlResult.error);
    }
    
  } catch (error) {
    console.error('💥 Erro durante o teste:', error);
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 Browser fechado');
    }
  }
}

// Executar o teste
testInteractiveCrawler().catch(console.error);