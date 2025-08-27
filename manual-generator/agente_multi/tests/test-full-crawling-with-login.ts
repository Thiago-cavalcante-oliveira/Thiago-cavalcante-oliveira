import { OrchestratorAgent } from '../agents/OrchestratorAgent';
import { chromium, Browser } from 'playwright';
import * as dotenv from 'dotenv';
import * as fs from 'fs/promises';

// Carregar variáveis de ambiente
dotenv.config();

async function testFullCrawlingWithLogin() {
  console.log('🚀 Iniciando teste completo com login e crawling...');
  
  let browser: Browser | null = null;
  let orchestrator: OrchestratorAgent | null = null;
  
  try {
    // Verificar se as variáveis de ambiente estão configuradas
    const saebUrl = process.env.SAEB_URL;
    const saebUsername = process.env.SAEB_USERNAME;
    const saebPassword = process.env.SAEB_PASSWORD;
    
    if (!saebUrl || !saebUsername || !saebPassword) {
      console.error('❌ Variáveis de ambiente não configuradas:');
      console.error(`   SAEB_URL: ${saebUrl ? '✅' : '❌'}`);
      console.error(`   SAEB_USERNAME: ${saebUsername ? '✅' : '❌'}`);
      console.error(`   SAEB_PASSWORD: ${saebPassword ? '✅' : '❌'}`);
      throw new Error('Configure as variáveis de ambiente no arquivo .env');
    }
    
    console.log('🔧 Configurações carregadas:');
    console.log(`   URL: ${saebUrl}`);
    console.log(`   Username: ${saebUsername}`);
    console.log(`   Password: ${'*'.repeat(saebPassword.length)}`);
    
    // Inicializar browser
    console.log('🌐 Inicializando browser...');
    browser = await chromium.launch({
      headless: false,
      slowMo: 1000,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Criar diretório de saída
    const outputDir = './output/full-crawling-test';
    await fs.mkdir(outputDir, { recursive: true });
    console.log(`📁 Diretório de saída criado: ${outputDir}`);
    
    // Inicializar orquestrador
    console.log('🎭 Inicializando OrchestratorAgent...');
    orchestrator = new OrchestratorAgent();
    await orchestrator.initialize();
    
    // Executar pipeline completo com login
    console.log('🔐 Executando pipeline completo com login...');
    const startTime = Date.now();
    
    const result = await orchestrator.processTask({
      id: `full_crawling_test_${Date.now()}`,
      type: 'execute_with_env_config',
      data: {
        browser,
        outputDir,
        enableScreenshots: true,
        stopAfterPhase: 'crawler' // Para focar no crawling
      },
      priority: 'high',
      timestamp: new Date(),
      sender: 'test'
    });
    
    const duration = Date.now() - startTime;
    
    // Exibir resultados
    console.log('\n📊 Resultados do Teste Completo:');
    console.log(`⏱️  Tempo total: ${duration}ms`);
    console.log(`📄 Status: ${result.success ? '✅ Sucesso' : '❌ Falha'}`);
    
    if (!result.success) {
      console.log(`📝 Erro: ${result.error || 'Erro desconhecido'}`);
    } else {
      console.log('📝 Erro: Nenhum');
      
      if (result.data) {
        const data = result.data as any;
        console.log(`🔐 Login realizado: ${data.loginSuccess ? '✅' : '❌'}`);
        console.log(`📄 Páginas processadas: ${data.pagesProcessed || 0}`);
        console.log(`🔗 Elementos coletados: ${data.elementsCollected || 0}`);
        console.log(`📸 Screenshots capturados: ${data.screenshotsTaken || 0}`);
      }
    }
    
    // Verificar arquivos gerados
    console.log('\n💾 Verificando arquivos gerados...');
    try {
      const files = await fs.readdir(outputDir);
      console.log(`📁 Arquivos no diretório de saída: ${files.length}`);
      files.forEach(file => {
        console.log(`  📄 ${file}`);
      });
    } catch (error) {
      console.log('❌ Erro ao listar arquivos de saída:', error);
    }
    
    // Gerar relatório
    if (result.success && orchestrator) {
      console.log('\n📋 Gerando relatório...');
      const report = await orchestrator.generateMarkdownReport(result);
      const reportPath = `${outputDir}/relatorio-completo.md`;
      await fs.writeFile(reportPath, report, 'utf-8');
      console.log(`📋 Relatório salvo em: ${reportPath}`);
    }
    
    console.log('\n✅ Teste completo com login e crawling finalizado!');
    
  } catch (error: any) {
    console.error('❌ Erro no teste:', error.message || error);
    throw error;
  } finally {
    if (orchestrator) {
      await orchestrator.cleanup();
    }
    if (browser) {
      await browser.close();
    }
  }
}

// Executar o teste
testFullCrawlingWithLogin()
  .then(() => {
    console.log('🎉 Teste concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha no teste:', error);
    process.exit(1);
  });

export { testFullCrawlingWithLogin };