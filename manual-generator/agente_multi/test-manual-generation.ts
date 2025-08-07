import 'dotenv/config';
import { AgnoSCore } from './core/AgnoSCore.js';
import { OrchestratorAgent } from './agents/OrchestratorAgent.js';

async function testManualGeneration() {
  console.log('🧪 Iniciando teste de geração de manual...');

  try {
    // Criar o core do sistema
    const core = new AgnoSCore();

    // Criar e registrar o agente orquestrador
    const orchestratorAgent = new OrchestratorAgent();
    core.registerAgent(orchestratorAgent);

    // Iniciar o sistema
    await core.start();

    console.log('✅ Sistema iniciado com sucesso!');

    // Configuração de teste
    const testConfig = {
      targetUrl: 'https://www.google.com',
      enableScreenshots: true,
      outputFormats: ['markdown', 'html', 'pdf'] as const,
      maxRetries: 2,
      timeoutMinutes: 10
    };

    console.log(`🎯 Testando geração de manual para: ${testConfig.targetUrl}`);

    // Executar tarefa de orquestração
    const result = await core.executeTask(
      'OrchestratorAgent',
      'orchestrate_manual_generation',
      testConfig,
      'high'
    );

    if (result.success) {
      console.log('✅ Teste de geração de manual concluído com sucesso!');
      console.log('📊 Resultado:', result);
      
      if (result.markdownReport) {
        console.log('\n📄 Relatório em Markdown:');
        console.log('='.repeat(50));
        console.log(result.markdownReport);
        console.log('='.repeat(50));
      }
    } else {
      console.log('❌ Teste falhou:', result.error);
    }

    // Parar o sistema
    await core.stop();

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    process.exit(1);
  }
}

// Executar o teste
testManualGeneration().catch((error) => {
  console.error('❌ Erro fatal no teste:', error);
  process.exit(1);
});