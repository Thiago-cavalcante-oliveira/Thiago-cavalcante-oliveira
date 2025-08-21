import 'dotenv/config';
import { AgnoSCore } from './core/AgnoSCore.js';
import { OrchestratorAgent } from './agents/OrchestratorAgent.js';
import { LoginAgent } from './agents/LoginAgent.js';
import { CrawlerAgent } from './agents/CrawlerAgent.js';
import { AnalysisAgent } from './agents/AnalysisAgent.js';
import { ContentAgent } from './agents/ContentAgent.js';
import { GeneratorAgent } from './agents/GeneratorAgent.js';
import { ScreenshotAgent } from './agents/ScreenshotAgent.js';
import { LLMRouter } from './services/LLMRouter.js';
import { PromptInspector } from './services/PromptInspector.js';
import { ArtifactStore } from './services/ArtifactStore.js';
import { Timeline } from './services/Timeline.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Função para processar argumentos da linha de comando
function parseArgs() {
  const args = process.argv.slice(2);
  const config: any = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    
    switch (arg) {
      case '--url':
        config.url = nextArg;
        i++;
        break;
      case '--login':
        config.username = nextArg;
        i++;
        break;
      case '--password':
        config.password = nextArg;
        i++;
        break;
      case '--output-format':
        config.outputFormat = nextArg;
        i++;
        break;
      case '--screenshots':
        config.screenshots = nextArg === 'true';
        i++;
        break;
      case '--max-retries':
        config.maxRetries = parseInt(nextArg);
        i++;
        break;
      case '--help':
         console.log(`
Uso: node dist/main.js [opções]

Opções:
  --url <url>              URL do sistema para gerar manual
  --login <username>       Nome de usuário para login
  --password <password>    Senha para login
  --output-format <format> Formato de saída (markdown, pdf)
  --screenshots <bool>     Capturar screenshots (true/false)
  --max-retries <number>   Número máximo de tentativas
  --help                   Mostrar esta ajuda

Exemplo:
  node dist/main.js --url eb-h1.pmfi.pr.gov.br --login admin --password admin123
`);
         process.exit(0);
    }
  }
  
  return config;
}

async function main() {
  console.log('🚀 Iniciando Sistema Multi-Agente para Geração de Manuais...');
  
  // Processar argumentos da linha de comando
  const cmdArgs = parseArgs();

  try {
    // Inicializar serviços avançados
    console.log('🔧 Inicializando serviços avançados...');
    const llmRouter = new LLMRouter();
    const promptInspector = new PromptInspector();
    const artifactStore = new ArtifactStore();
    const timeline = new Timeline();
    
    // Iniciar sessão de timeline
    const sessionId = await timeline.startSession({
      version: '2.0',
      features: ['LLMRouter', 'PromptInspector', 'ArtifactStore', 'Timeline']
    });
    
    console.log(`📊 Timeline iniciada: ${sessionId}`);

    // Criar o core do sistema
    const core = new AgnoSCore();

    // Carregar prompts externos
    const promptsDir = join(__dirname, '../prompts');
    const analysisPrompt = readFileSync(join(promptsDir, 'analysis.prompt.txt'), 'utf-8');
    const contentPrompt = readFileSync(join(promptsDir, 'content.prompt.txt'), 'utf-8');
    const generatorPrompt = readFileSync(join(promptsDir, 'generator.prompt.txt'), 'utf-8');

    // Criar e registrar agentes com serviços avançados
    await timeline.startAgent('OrchestratorAgent');
    const orchestratorAgent = new OrchestratorAgent();
    
    await timeline.startAgent('LoginAgent');
    const loginAgent = new LoginAgent();
    
    await timeline.startAgent('CrawlerAgent');
    const crawlerAgent = new CrawlerAgent();
    
    await timeline.startAgent('AnalysisAgent');
    const analysisAgent = new AnalysisAgent(analysisPrompt);
    
    await timeline.startAgent('ContentAgent');
    const contentAgent = new ContentAgent(contentPrompt);
    
    await timeline.startAgent('GeneratorAgent');
    const generatorAgent = new GeneratorAgent(generatorPrompt);
    
    await timeline.startAgent('ScreenshotAgent');
    const screenshotAgent = new ScreenshotAgent();

    // Registrar todos os agentes
    core.registerAgent(orchestratorAgent);
    core.registerAgent(loginAgent);
    core.registerAgent(crawlerAgent);
    core.registerAgent(analysisAgent);
    core.registerAgent(contentAgent);
    core.registerAgent(generatorAgent);
    core.registerAgent(screenshotAgent);

    // Disponibilizar serviços globalmente
    (global as any).llmRouter = llmRouter;
    (global as any).promptInspector = promptInspector;
    (global as any).artifactStore = artifactStore;
    (global as any).timeline = timeline;

    // Iniciar o sistema
    await timeline.recordMilestone('Iniciando core do sistema');
    await core.start();

    console.log('✅ Sistema Multi-Agente iniciado com sucesso!');
    await timeline.recordMilestone('Sistema iniciado com sucesso');
    console.log('📊 Status do sistema:', core.getSystemStatus());

    console.log('\n🎯 Sistema pronto para receber tarefas!');
    console.log('💡 Use core.executeTask() para executar tarefas específicas');
    
    // Se argumentos foram fornecidos, executar tarefa automaticamente
    if (cmdArgs.url) {
      console.log('\n🚀 Executando tarefa automaticamente com parâmetros fornecidos...');
      console.log('🎯 URL:', cmdArgs.url);
      console.log('👤 Login:', cmdArgs.username || 'não fornecido');
      
      const taskData = {
         targetUrl: cmdArgs.url,
         outputFormats: [cmdArgs.outputFormat || 'markdown'],
         enableScreenshots: cmdArgs.screenshots !== false,
         maxRetries: cmdArgs.maxRetries || 3,
         timeoutMinutes: 5,
         authConfig: {
           type: 'basic' as const,
           credentials: {
             username: cmdArgs.username || '',
             password: cmdArgs.password || ''
           }
         }
       };
      
      try {
        await timeline.recordMilestone('Iniciando geração automática de manual');
        const result = await core.executeTask('OrchestratorAgent', 'generate_manual', taskData, 'high');
        
        if (result.success) {
          console.log('\n✅ Manual gerado com sucesso!');
          console.log('📄 Resultado:', result.data);
          if (result.markdownReport) {
            console.log('📝 Relatório Markdown gerado');
          }
          await timeline.recordMilestone('Manual gerado com sucesso');
        } else {
          console.log('\n❌ Falha na geração do manual:', result.error);
          await timeline.recordError('OrchestratorAgent', new Error(result.error || 'Erro desconhecido'), {
            phase: 'manual_generation'
          });
        }
      } catch (error) {
        console.error('\n❌ Erro durante a execução automática:', error);
        await timeline.recordError('System', error as Error, {
          phase: 'auto_execution'
        });
      }
    }
    
    // Gerar relatórios iniciais
    console.log('\n📈 Gerando relatórios de inicialização...');
    const timelineReport = timeline.generateCurrentReport();
    const artifactReport = artifactStore.generateReport();
    const promptReport = promptInspector.generatePerformanceReport();
    
    // Salvar relatórios como artefatos
    await artifactStore.store({
      type: 'report',
      name: 'timeline-initialization.md',
      content: timelineReport,
      tags: ['initialization', 'timeline'],
      metadata: { sessionId }
    });
    
    await artifactStore.store({
      type: 'report',
      name: 'artifacts-initialization.md',
      content: artifactReport,
      tags: ['initialization', 'artifacts']
    });
    
    await artifactStore.store({
      type: 'report',
      name: 'prompts-initialization.md',
      content: promptReport,
      tags: ['initialization', 'prompts']
    });
    
    console.log('✅ Relatórios de inicialização salvos!');
    
    // Manter o processo ativo
    console.log('🔄 Sistema em execução. Pressione Ctrl+C para finalizar.');

  } catch (error) {
    console.error('❌ Erro ao iniciar o sistema:', error);
    
    // Registrar erro no timeline se disponível
    if ((global as any).timeline) {
      await (global as any).timeline.recordError('System', error as Error, {
        phase: 'initialization'
      });
      await (global as any).timeline.endSession('Sistema falhou durante inicialização');
    }
    
    process.exit(1);
  }
}

// Tratamento de sinais para finalização limpa
process.on('SIGINT', async () => {
  console.log('\n🛑 Recebido sinal de interrupção, finalizando sistema...');
  
  if ((global as any).timeline) {
    await (global as any).timeline.recordMilestone('Sistema sendo finalizado pelo usuário');
    await (global as any).timeline.endSession('Sistema finalizado pelo usuário');
  }
  
  if ((global as any).artifactStore) {
    const cleanupResult = await (global as any).artifactStore.cleanup();
    console.log(`🧹 Limpeza automática: ${cleanupResult.removed} artefatos removidos`);
  }
  
  process.exit(0);
});

// Executar o sistema
main().catch(async (error) => {
  console.error('❌ Erro fatal:', error);
  
  // Registrar erro fatal no timeline se disponível
  if ((global as any).timeline) {
    await (global as any).timeline.recordError('System', error as Error, {
      phase: 'startup',
      fatal: true
    });
    await (global as any).timeline.endSession('Sistema falhou com erro fatal');
  }
  
  process.exit(1);
});