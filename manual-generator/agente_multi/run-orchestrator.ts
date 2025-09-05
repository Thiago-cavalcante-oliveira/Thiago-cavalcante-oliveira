import 'dotenv/config';
import { OrchestratorAgent } from './agents/OrchestratorAgent';
import { env } from './config/env';
import { OrchestrationConfig } from '../types/types';
import { logger } from './utils/logger';

async function main() {
  logger.info('🚀 Iniciando Sistema Multi-Agente para Geração de Manuais (v3.0)...');

  const config: OrchestrationConfig = {
    targetUrl: env.SAEB_URL || 'https://www.gov.br/pt-br',
    outputDir: 'output',
    maxSteps: 15,
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

    logger.info({ config: { ...config, credentials: '***' } }, `🎯 Iniciando exploração`);
    
    const result = await orchestrator.processTask({
        id: 'main_task_01',
        type: 'generate_manual',
        sender: 'main',
        timestamp: new Date(),
        priority: 'high',
        data: config
    });
    
    if (result.success) {
        logger.info('✅ Pipeline de geração de manual concluído com sucesso!');
    } else {
        logger.error('❌ Pipeline de geração de manual falhou.');
        if (result.error) {
            logger.error(`   Motivo: ${result.error}`);
        }
    }

    await orchestrator.cleanup();

  } catch (error) {
    logger.fatal({ error }, '❌ Erro fatal durante a execução');
    process.exit(1);
  }
}

main();

