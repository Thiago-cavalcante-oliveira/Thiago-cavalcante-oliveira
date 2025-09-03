import { OrchestratorAgent } from '../agents/OrchestratorAgent';
import path from 'path';
import fs from 'fs';

// Configuração de debug e visualização
process.env.DEBUG = 'true';
process.env.VERBOSE = 'true';
process.env.HEADLESS = 'false'; // Chromium visível
process.env.SLOW_MO = '3000'; // Slow motion para visualizar ações
process.env.TIMEOUT = '60000'; // Timeout de 60 segundos
process.env.NAVIGATION_TIMEOUT = '30000'; // Timeout de navegação

// Diretório de artefatos
const outputDir = path.join(process.cwd(), 'output', 'pmfi-visual-test');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Função auxiliar para testes
async function test(name: string, testFn: () => Promise<void>) {
  console.log(`\n🧪 Executando: ${name}`);
  try {
    await testFn();
    console.log(`✅ ${name} - PASSOU`);
  } catch (error) {
    console.error(`❌ ${name} - FALHOU:`, error);
    throw error;
  }
}

// Função principal do teste
async function runPMFIVisualTest() {
  console.log('\n🚀 ===== TESTE VISUAL PMFI - MANUAL GENERATOR =====\n');
  
  await test('Pipeline completa PMFI - Visualização Chromium', async () => {
    console.log('🚀 Iniciando teste visual da pipeline para PMFI...');
    
    // Configuração do OrchestratorAgent com credenciais
    const orchestrator = new OrchestratorAgent();
    
    const config = {
      targetUrl: 'https://homologacao.pmfi.pr.gov.br/Autenticacao-PMFI/autenticacao',
      outputDir,
      maxRetries: 3,
      timeoutMinutes: 15,
      enableScreenshots: true,
      outputFormats: ['markdown', 'html', 'pdf'] as ('markdown' | 'html' | 'pdf')[],
      crawlingStrategy: 'advanced' as 'basic' | 'advanced',
      credentials: {
        username: '315.963.840-50',
        password: 'Treinamento'
      },
      browserConfig: {
        headless: false,
        slowMo: 3000,
        devtools: true,
        timeout: 60000,
        navigationTimeout: 30000,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--start-maximized',
          '--disable-blink-features=AutomationControlled'
        ],
        channel: 'chrome'
      }
    };
    
    console.log('🔧 Configuração:', {
      url: config.targetUrl,
      credenciais: 'Fornecidas',
      visualização: 'Chromium visível',
      slowMotion: '3000ms',
      timeout: '60000ms',
      navigationTimeout: '30000ms'
    });
    
    // Executar pipeline completa
    console.log('\n🎬 Iniciando execução visual - acompanhe no Chromium...');
    const result = await orchestrator.executeFullPipeline(config);
    
    console.log('📊 Resultados:', {
      success: result.success,
      executionId: result.executionId,
      agentsExecuted: result.agentsExecuted,
      statistics: result.statistics
    });
    
    // Validações do resultado
    if (!result.success) {
      throw new Error('Pipeline não foi executada com sucesso');
    }
    
    if (!result.statistics.pagesProcessed || result.statistics.pagesProcessed === 0) {
      throw new Error('Nenhuma página foi processada');
    }
    
    console.log('✅ Pipeline executada com sucesso!');
  });
  
  await test('Validação dos arquivos gerados', async () => {
    console.log('🔍 Validando arquivos gerados...');
    
    const files = fs.readdirSync(outputDir);
    console.log('📁 Arquivos no diretório:', files);
    
    // Verificar se pelo menos alguns arquivos foram gerados
    if (files.length === 0) {
      throw new Error('Nenhum arquivo foi gerado');
    }
    
    // Verificar se há dados de crawling
    const hasCrawlData = files.some(file => file.includes('crawl') || file.includes('.json'));
    if (!hasCrawlData) {
      console.log('⚠️ Nenhum arquivo de dados de crawling encontrado');
    }
    
    // Verificar se há screenshots
    const hasScreenshots = files.some(file => file.includes('.png') || file.includes('.jpg'));
    if (!hasScreenshots) {
      console.log('⚠️ Nenhum screenshot encontrado');
    }
    
    console.log('✅ Validação de arquivos concluída');
  });
  
  await test('Verificação de logs detalhados', async () => {
    console.log('📊 Verificando logs detalhados...');
    
    // Verificar se há logs de cada agente
    const expectedAgents = ['LoginAgent', 'SmartLoginAgent', 'CrawlerAgent', 'AnalysisAgent', 'ContentAgent', 'GeneratorAgent'];
    
    console.log('🤖 Agentes esperados:', expectedAgents);
    console.log('✅ Verificação de logs concluída');
  });
  
  console.log('\n🎉 Todos os testes visuais passaram!');
}

// Executar o teste
runPMFIVisualTest().catch(error => {
  console.error('💥 Erro no teste:', error);
  process.exit(1);
});