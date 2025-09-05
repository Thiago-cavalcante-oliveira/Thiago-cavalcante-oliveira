import { OrchestratorAgent } from './agents/OrchestratorAgent.js';
import { env } from './config/env.js';
import { OrchestrationConfig } from './types.js';

async function main() {
  console.log('🚀 Iniciando Sistema Multi-Agente para Geração de Manuais (v3.0)...');

  // Configuração da tarefa a ser executada
  const config: OrchestrationConfig = {
    targetUrl: env.SAEB_URL || 'https://playwright.dev/', // URL alvo
    outputDir: 'output',
    maxSteps: 20, // Limite de interações para evitar loops infinitos
    enableScreenshots: true,
    outputFormats: ['markdown', 'html', 'pdf'],
    credentials: (env.SAEB_USERNAME && env.SAEB_PASSWORD) ? {
      username: env.SAEB_USERNAME,
      password: env.SAEB_PASSWORD,
    } : undefined,
  };

  try {
    const orchestrator = new OrchestratorAgent();
    await orchestrator.initialize();

    console.log(`🎯 Iniciando exploração para: ${config.targetUrl}`);
    
    const result = await orchestrator.processTask({
        id: 'main_task_01',
        type: 'generate_manual',
        sender: 'main',
        timestamp: new Date(),
        priority: 'high',
        data: config
    });
    
    if (result.success) {
        console.log('\n✅ Pipeline de geração de manual concluído com sucesso!');
    } else {
        console.error('\n❌ Pipeline de geração de manual falhou.');
        if (result.error) {
            console.error('   Motivo:', result.error);
        }
    }

    await orchestrator.cleanup();

  } catch (error) {
    console.error('❌ Erro fatal durante a execução:', error);
    process.exit(1);
  }
}

main();
