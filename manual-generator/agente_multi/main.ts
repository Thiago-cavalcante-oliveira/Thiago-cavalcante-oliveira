import 'dotenv/config';
import { AgnoSCore } from './core/AgnoSCore.js';
import { OrchestratorAgent } from './agents/OrchestratorAgent.js';
import { LoginAgent } from './agents/LoginAgent.js';
import { CrawlerAgent } from './agents/CrawlerAgent.js';
import { AnalysisAgent } from './agents/AnalysisAgent.js';
import { ContentAgent } from './agents/ContentAgent.js';
import { GeneratorAgent } from './agents/GeneratorAgent.js';
import { ScreenshotAgent } from './agents/ScreenshotAgent.js';

async function main() {
  console.log('🚀 Iniciando Sistema Multi-Agente para Geração de Manuais...');

  try {
    // Criar o core do sistema
    const core = new AgnoSCore();

    // Criar e registrar agentes
    const orchestratorAgent = new OrchestratorAgent();
    const loginAgent = new LoginAgent();
    const crawlerAgent = new CrawlerAgent();
    const analysisAgent = new AnalysisAgent();
    const contentAgent = new ContentAgent();
    const generatorAgent = new GeneratorAgent();
    const screenshotAgent = new ScreenshotAgent();

    // Registrar todos os agentes
    core.registerAgent(orchestratorAgent);
    core.registerAgent(loginAgent);
    core.registerAgent(crawlerAgent);
    core.registerAgent(analysisAgent);
    core.registerAgent(contentAgent);
    core.registerAgent(generatorAgent);
    core.registerAgent(screenshotAgent);

    // Iniciar o sistema
    await core.start();

    console.log('✅ Sistema Multi-Agente iniciado com sucesso!');
    console.log('📊 Status do sistema:', core.getSystemStatus());

    // Aguardar por interrupção do usuário
    process.on('SIGINT', async () => {
      console.log('\n🛑 Recebido sinal de interrupção, finalizando sistema...');
      await core.stop();
      process.exit(0);
    });

    // Manter o processo ativo
    console.log('🔄 Sistema em execução. Pressione Ctrl+C para finalizar.');

  } catch (error) {
    console.error('❌ Erro ao iniciar o sistema:', error);
    process.exit(1);
  }
}

// Executar o sistema
main().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});