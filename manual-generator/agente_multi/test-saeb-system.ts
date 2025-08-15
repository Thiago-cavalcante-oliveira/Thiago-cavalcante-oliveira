import { OrchestratorAgent } from './agents/OrchestratorAgent';
import { LoginAgent } from './agents/LoginAgent';
import { CrawlerAgent } from './agents/CrawlerAgent';
import { AnalysisAgent } from './agents/AnalysisAgent';
import { ContentAgent } from './agents/ContentAgent';
import { GeneratorAgent } from './agents/GeneratorAgent';
import { MinIOService } from './services/MinIOService';
import * as fs from 'fs/promises';
import * as path from 'path';

async function testSAEBSystem() {
  console.log('🚀 Iniciando teste do sistema SAEB...');
  
  // Configuração para o sistema SAEB
  const config = {
    url: 'https://saeb-h1.pmfi.pr.gov.br/auth/signin',
    credentials: {
      username: 'admin',
      password: 'admin123'
    },
    maxPages: 5,
    timeout: 30000
  };

  let orchestrator: OrchestratorAgent | null = null;
  let loginAgent: LoginAgent | null = null;
  let crawlerAgent: CrawlerAgent | null = null;
  let analysisAgent: AnalysisAgent | null = null;
  let contentAgent: ContentAgent | null = null;
  let generatorAgent: GeneratorAgent | null = null;
  let minioService: MinIOService | null = null;

  try {
    // Carregar prompts
    const promptsDir = path.join(process.cwd(), 'prompts');
    const loginPrompt = await fs.readFile(path.join(promptsDir, 'login.prompt.txt'), 'utf-8');
    const crawlerPrompt = await fs.readFile(path.join(promptsDir, 'crawler.prompt.txt'), 'utf-8');
    const analysisPrompt = await fs.readFile(path.join(promptsDir, 'analysis.prompt.txt'), 'utf-8');
    const contentPrompt = await fs.readFile(path.join(promptsDir, 'content.prompt.txt'), 'utf-8');
    const generatorPrompt = await fs.readFile(path.join(promptsDir, 'generator.prompt.txt'), 'utf-8');
    const orchestratorPrompt = await fs.readFile(path.join(promptsDir, 'orchestrator.prompt.txt'), 'utf-8');

    console.log('📋 Prompts carregados com sucesso');

    // Inicializar agentes
    console.log('🔧 Inicializando agentes...');
    
    orchestrator = new OrchestratorAgent();
    loginAgent = new LoginAgent();
    crawlerAgent = new CrawlerAgent();
    analysisAgent = new AnalysisAgent(analysisPrompt);
    contentAgent = new ContentAgent(contentPrompt);
    generatorAgent = new GeneratorAgent(generatorPrompt);
    minioService = new MinIOService();

    // Inicializar todos os agentes
    await Promise.all([
      orchestrator.initialize(),
      loginAgent.initialize(),
      crawlerAgent.initialize(),
      analysisAgent.initialize(),
      contentAgent.initialize(),
      generatorAgent.initialize()
    ]);

    console.log('✅ Todos os agentes inicializados');

    // Iniciar processo de geração de manual
    console.log('🎯 Iniciando geração de manual para SAEB...');
    
    const startTime = Date.now();
    
    const result = await orchestrator.processTask({
      id: `saeb-manual-${Date.now()}`,
      type: 'generate_manual',
      priority: 'high',
      sender: 'test-system',
      data: {
        url: config.url,
        targetUrl: config.url,
        credentials: config.credentials,
        maxPages: config.maxPages,
        timeout: config.timeout,
        systemName: 'SAEB - Sistema de Avaliação da Educação Básica'
      },
      timestamp: new Date()
    });

    const processingTime = Date.now() - startTime;
    
    console.log('\n📊 RESULTADO DO TESTE:');
    console.log('========================');
    console.log(`✅ Sucesso: ${result.success}`);
    console.log(`⏱️  Tempo de processamento: ${processingTime}ms`);
    console.log(`📄 ID da tarefa: ${result.id}`);
    
    if (result.success && result.data) {
      console.log('\n📋 DETALHES DOS DOCUMENTOS GERADOS:');
      console.log('=====================================');
      
      if (result.data.documents) {
        const docs = result.data.documents;
        console.log(`📝 Markdown: ${docs.filePaths?.markdown || 'Não gerado'}`);
        console.log(`🌐 HTML: ${docs.filePaths?.html || 'Não gerado'}`);
        console.log(`📄 PDF: ${docs.filePaths?.pdf || 'Não gerado'}`);
        
        if (docs.metadata) {
          console.log(`\n📊 ESTATÍSTICAS:`);
          console.log(`- Páginas: ${docs.metadata.totalPages || 0}`);
          console.log(`- Palavras: ${docs.metadata.wordCount || 0}`);
          console.log(`- Seções: ${docs.metadata.sectionCount || 0}`);
        }
        
        if (docs.minioUrls) {
          console.log(`\n🔗 URLs MinIO:`);
          console.log(`- Markdown: ${docs.minioUrls.markdown || 'N/A'}`);
          console.log(`- HTML: ${docs.minioUrls.html || 'N/A'}`);
          console.log(`- PDF: ${docs.minioUrls.pdf || 'N/A'}`);
        }
      }
    } else {
      console.log(`❌ Erro: ${result.error || 'Erro desconhecido'}`);
    }

    console.log('\n🎉 Teste do sistema SAEB concluído!');
    return result;

  } catch (error) {
    console.error('💥 Erro durante o teste:', error);
    throw error;
  } finally {
    // Cleanup
    console.log('\n🧹 Limpando recursos...');
    
    try {
      if (orchestrator) await orchestrator.cleanup();
      if (loginAgent) await loginAgent.cleanup();
      if (crawlerAgent) await crawlerAgent.cleanup();
      if (analysisAgent) await analysisAgent.cleanup();
      if (contentAgent) await contentAgent.cleanup();
      if (generatorAgent) await generatorAgent.cleanup();
      
      console.log('✅ Cleanup concluído');
    } catch (cleanupError) {
      console.error('⚠️  Erro durante cleanup:', cleanupError);
    }
  }
}

// Execute the test
testSAEBSystem()
  .then(() => {
    console.log('\n🏁 Teste finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💀 Teste falhou:', error);
    process.exit(1);
  });

export { testSAEBSystem };