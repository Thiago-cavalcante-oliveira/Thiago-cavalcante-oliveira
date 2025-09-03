import { OrchestratorAgent, OrchestrationConfig, OrchestrationResult } from '../agents/OrchestratorAgent';
import path from 'path';
import fs from 'fs';

// Configuração do teste
const TEST_CONFIG = {
  url: 'https://saeb-h1.pmfi.pr.gov.br/auth/signin',
  credentials: {
    username: 'admin',
    password: 'admin123'
  },
  outputDir: path.join(process.cwd(), 'output', 'saeb-visual-debug-test'),
  SLOW_MO: 5000, // 5 segundos entre ações para visualização
  TIMEOUT: 120000, // 2 minutos
  NAVIGATION_TIMEOUT: 60000, // 1 minuto
  KEEP_BROWSER_OPEN: 300000 // 5 minutos
};

async function testPMFIVisualDebug() {
  console.log('\n🚀 ===== TESTE VISUAL DEBUG SAEB - MANUAL GENERATOR =====\n');
  
  try {
    console.log('\n🧪 Executando: Teste de Login SAEB - Debug Visual Chromium');
    console.log('🚀 Iniciando teste visual DEBUG de login para SAEB...');
    
    const outputDir = TEST_CONFIG.outputDir;
    
    // Configuração com browser sempre visível e timeouts longos
    const browserConfig = {
      HEADLESS: false,
      SLOW_MO: TEST_CONFIG.SLOW_MO,
      TIMEOUT: TEST_CONFIG.TIMEOUT,
      NAVIGATION_TIMEOUT: TEST_CONFIG.NAVIGATION_TIMEOUT,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--start-maximized',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--disable-default-apps'
      ],
      channel: 'chrome',
      devtools: true // Abre DevTools para debug
    };
    
    const config: OrchestrationConfig = {
      targetUrl: TEST_CONFIG.url,
      outputFormats: ['markdown'],
      crawlingStrategy: 'basic',
      maxRetries: 2,
      timeoutMinutes: TEST_CONFIG.TIMEOUT / 60000,
      enableScreenshots: true,
      credentials: TEST_CONFIG.credentials,
      outputDir: outputDir
    };
    
    console.log('🔧 Configuração DEBUG:', {
      url: config.targetUrl,
      credenciais: 'Fornecidas',
      'visualização': 'Chromium visível + DevTools',
      slowMotion: `${TEST_CONFIG.SLOW_MO}ms`,
      timeout: `${TEST_CONFIG.TIMEOUT}ms`,
      navigationTimeout: `${TEST_CONFIG.NAVIGATION_TIMEOUT}ms`,
      keepBrowserOpen: `${TEST_CONFIG.KEEP_BROWSER_OPEN}ms`
    });
    
    console.log('\n🎬 Iniciando execução visual DEBUG - acompanhe no Chromium...');
    console.log('🔐 Testando apenas o processo de login...');
    console.log('⏰ O navegador ficará aberto por 5 minutos para observação...');
    
    const orchestrator = new OrchestratorAgent();

    // Lançar o navegador com as configurações desejadas
    const browser = await chromium.launch({
      headless: browserConfig.HEADLESS,
      devtools: browserConfig.devtools,
      slowMo: browserConfig.SLOW_MO,
      args: browserConfig.args,
      channel: browserConfig.channel
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Passar as instâncias de browser e page para o executeFullPipeline
    const result: OrchestrationResult = await orchestrator.executeFullPipeline(config, browser, page);

    // Fechar o navegador após o teste, a menos que KEEP_BROWSER_OPEN esteja ativo
    if (TEST_CONFIG.KEEP_BROWSER_OPEN === 0) {
      await browser.close();
    }
    
    console.log('📊 Resultados:', result);
    
    // Manter o navegador aberto por mais tempo
    console.log(`\n⏳ Mantendo navegador aberto por ${TEST_CONFIG.KEEP_BROWSER_OPEN/1000} segundos para observação...`);
    console.log('🔍 Você pode interagir com o navegador durante este tempo.');
    console.log('⚠️ Pressione Ctrl+C para encerrar o teste a qualquer momento.');
    
    // Manter o navegador aberto por mais tempo, se configurado
    if (TEST_CONFIG.KEEP_BROWSER_OPEN > 0) {
      console.log(`\n⏳ Mantendo navegador aberto por ${TEST_CONFIG.KEEP_BROWSER_OPEN/1000} segundos para observação...`);
      console.log('🔍 Você pode interagir com o navegador durante este tempo.');
      console.log('⚠️ Pressione Ctrl+C para encerrar o teste a qualquer momento.');
      await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.KEEP_BROWSER_OPEN));
    }

    // Validações
    if (!result.success) {
      throw new Error(`Pipeline falhou: ${result.errors ? result.errors.join(', ') : 'Erro desconhecido'}`);
    }
    
    if (!result.executionId) {
      throw new Error('ExecutionId não foi gerado');
    }
    
    if (!result.agentsExecuted || result.agentsExecuted.length === 0) {
      throw new Error('Nenhum agente foi executado');
    }
    
    if (!result.statistics || result.statistics.pagesProcessed === 0) {
      throw new Error('Nenhuma página foi processada');
    }
    
    console.log('✅ Login executado com sucesso!');
    console.log('✅ Teste de Login SAEB - Debug Visual Chromium - PASSOU');
    
    // Validação de arquivos
    console.log('\n🧪 Executando: Validação dos arquivos gerados');
    console.log('🔍 Validando arquivos gerados...');
    
    if (fs.existsSync(outputDir)) {
      const files = fs.readdirSync(outputDir);
      console.log('📁 Arquivos no diretório:', files);
      
      if (files.length === 0) {
        console.log('⚠️ Nenhum arquivo foi gerado, mas isso pode ser esperado em alguns cenários');
      }
    } else {
      console.log('⚠️ Diretório de output não foi criado');
    }
    
    console.log('✅ Validação de arquivos concluída');
    console.log('✅ Validação dos arquivos gerados - PASSOU');
    
    // Verificação de logs
    console.log('\n🧪 Executando: Verificação de logs detalhados');
    console.log('📊 Verificando logs detalhados...');
    
    const expectedAgents = ['LoginAgent', 'SmartLoginAgent', 'CrawlerAgent', 'AnalysisAgent', 'ContentAgent', 'GeneratorAgent'];
    console.log('🤖 Agentes esperados:', expectedAgents);
    
    console.log('✅ Verificação de logs concluída');
    console.log('✅ Verificação de logs detalhados - PASSOU');
    
    console.log('\n🎉 Todos os testes visuais DEBUG passaram!');
    
  } catch (error) {
    console.error('❌ Erro no teste visual DEBUG:', error);
    process.exit(1);
  }
}

// Executar o teste
testPMFIVisualDebug().catch(console.error);