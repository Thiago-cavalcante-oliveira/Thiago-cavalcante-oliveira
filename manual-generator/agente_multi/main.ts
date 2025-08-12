import 'dotenv/config';
import { AgnoSCore } from './core/AgnoSCore';
import { OrchestratorAgent } from './agents/OrchestratorAgent';
import { LoginAgent } from './agents/LoginAgent';
import { CrawlerAgent } from './agents/CrawlerAgent';
import { AnalysisAgent } from './agents/AnalysisAgent';
import { ContentAgent } from './agents/ContentAgent';
import { GeneratorAgent } from './agents/GeneratorAgent';
import { ScreenshotAgent } from './agents/ScreenshotAgent';
import { readFileSync } from 'fs';
import { join } from 'path';

async function main() {
  console.log('🚀 Iniciando Sistema Multi-Agente para Geração de Manuais...');

  try {
    // Criar o core do sistema
    const core = new AgnoSCore();

    // Carregar prompts externos
    const analysisPrompt = readFileSync(join(__dirname, 'prompts/analysis.prompt.txt'), 'utf-8');
    const contentPrompt = readFileSync(join(__dirname, 'prompts/content.prompt.txt'), 'utf-8');
    const generatorPrompt = readFileSync(join(__dirname, 'prompts/generator.prompt.txt'), 'utf-8');

    // Criar e registrar agentes
    const orchestratorAgent = new OrchestratorAgent();
    const loginAgent = new LoginAgent();
    const crawlerAgent = new CrawlerAgent();
    const analysisAgent = new AnalysisAgent(analysisPrompt);
    const contentAgent = new ContentAgent(contentPrompt);
    const generatorAgent = new GeneratorAgent(generatorPrompt);
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