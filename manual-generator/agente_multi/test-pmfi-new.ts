import { OrchestratorAgent } from './agents/OrchestratorAgent';
import { TaskData } from './core/AgnoSCore';
import { logger } from './utils/logger';

/**
 * Test script for PMFI training system
 * URL: http://rptreinamentos.pmfi.pr.gov.br/
 * Credentials: admin / 12345@
 */
async function testPmfiTrainingSystem(): Promise<void> {
  try {
    logger.info('🚀 Iniciando teste do sistema PMFI de treinamentos');
    
    // Initialize orchestrator
    const orchestrator = new OrchestratorAgent();
    await orchestrator.initialize();
    logger.info('🤖 OrchestratorAgent inicializado com sucesso');
    
    // Prepare task data
    const taskData: TaskData = {
      id: `pmfi-test-${Date.now()}`,
      type: 'generate_manual',
      data: {
        targetUrl: 'http://rptreinamentos.pmfi.pr.gov.br/',
        outputFormats: ['markdown', 'html', 'pdf'],
        enableScreenshots: true,
        maxRetries: 3,
        timeoutMinutes: 10,
        authConfig: {
          type: 'basic',
          credentials: {
            username: 'admin',
            password: '12345@'
          }
        }
      },
      sender: 'test-script',
      timestamp: new Date(),
      priority: 'medium'
    };
    
    logger.info('📋 Dados da tarefa preparados');
    logger.info(`🌐 URL: ${taskData.data.targetUrl}`);
    logger.info(`👤 Usuário: ${taskData.data.authConfig.credentials.username}`);
    logger.info(`📄 Formatos: ${taskData.data.outputFormats.join(', ')}`);
    
    // Process the task
    logger.info('⚡ Processando tarefa...');
    const result = await orchestrator.processTask(taskData);
    
    if (result.success) {
      logger.info('✅ Teste concluído com sucesso!');
      if (result.data?.statistics) {
        logger.info('📊 Estatísticas encontradas');
      }
      
      if (result.data?.statistics) {
        const stats = result.data.statistics;
        console.log('\n=== ESTATÍSTICAS DO TESTE ===');
        console.log(`⏱️  Tempo total: ${stats.totalTime}ms`);
        console.log(`🔐 Login detectado: ${stats.loginDetected ? 'Sim' : 'Não'}`);
        console.log(`📄 Páginas processadas: ${stats.pagesProcessed}`);
        console.log(`🧩 Componentes analisados: ${stats.componentsAnalyzed}`);
        console.log(`📝 Documentos gerados: ${stats.documentsGenerated}`);
      }
    } else {
      logger.error('❌ Teste falhou: ' + (result.error || 'Erro desconhecido'));
    }
    
  } catch (error) {
    logger.error('💥 Erro durante o teste: ' + String(error));
    throw error;
  }
}

// Execute the test
testPmfiTrainingSystem()
  .then(() => {
    logger.info('🎯 Teste do sistema PMFI finalizado');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('🚨 Falha no teste: ' + String(error));
    process.exit(1);
  });