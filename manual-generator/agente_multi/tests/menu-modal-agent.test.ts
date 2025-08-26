import 'dotenv/config';
import { OrchestratorAgent, OrchestrationConfig } from '../agents/OrchestratorAgent';
import { Timeline } from '../services/Timeline';
import { logger } from '../utils/logger';

async function testMenuModalAgentOrchestrated() {
  const config: OrchestrationConfig = {
    maxRetries: 2,
    timeoutMinutes: 5,
    enableScreenshots: true,
    outputFormats: ['markdown'],
    targetUrl: 'https://saeb-h1.pmfi.pr.gov.br/',
    credentials: {
      username: 'admin',
      password: 'admin123',
    }
  };

  const timeline = new Timeline();
  const orchestrator = new OrchestratorAgent();
  await orchestrator.initialize();

  // Garante que a mesma instância de page será usada em todo o pipeline
  const page = await orchestrator.getPage();

  // Login via OrchestratorAgent usando a mesma page
  const loginResult = await orchestrator.executeLoginOnly({
    url: config.targetUrl,
    credentials: config.credentials!,
    outputDir: './output',
  });

  if (loginResult.success) {
    logger.info('Login realizado com sucesso, executando MenuModalAgent via Orchestrator...');
    const menuModalAgent = orchestrator.getAgent('MenuModalAgent');
    if (menuModalAgent) {
      const menuAgent = menuModalAgent as any;
      menuAgent.setPage(page); // Usa a mesma instância de page
      menuAgent.setBrowser(await orchestrator.getBrowser());
      
      // Inicia a sessão do Timeline antes de executar o MenuModalAgent
      const timelineInstance = menuAgent.timeline;
      if (timelineInstance) {
        await timelineInstance.startSession({
          url: config.targetUrl,
          timestamp: new Date().toISOString(),
          testMode: true
        });
        logger.info('Sessão do Timeline iniciada para o MenuModalAgent.');
      }
      
      logger.info('Depuração: menuModalAgent.page = ' + (menuAgent.page ? 'definida' : 'nula'));
      logger.info('Depuração: menuModalAgent.browser = ' + (menuAgent.browser ? 'definido' : 'nulo'));
      try {
        const result = await menuAgent.run();
        logger.info('MenuModalAgent executado com sucesso.');
        console.log('Menu Detection Result:', JSON.stringify(result, null, 2));
      } catch (e: any) {
        logger.error('MenuModalAgent falhou: ' + (e instanceof Error ? e.message : String(e)));
      }
    } else {
      logger.error('MenuModalAgent não encontrado no Orchestrator.');
    }
    const browser = await orchestrator.getBrowser();
    if (browser) await browser.close();
  } else {
    logger.error('Login falhou, pulando a execução do MenuModalAgent.');
    const browser = await orchestrator.getBrowser();
    if (browser) await browser.close();
  }
}

testMenuModalAgentOrchestrated().catch(console.error);