import { OrchestratorAgent } from './agents/OrchestratorAgent.ts';
import { SmartLoginAgent } from './agents/SmartLoginAgent.ts';
import { EnhancedCrawlerAgent } from './agents/EnhancedCrawlerAgent.ts';
import { AnalysisAgent } from './agents/AnalysisAgent.ts';
import { ContentAgent } from './agents/ContentAgent.ts';
import { GeneratorAgent } from './agents/GeneratorAgent.ts';
import { Timeline } from './services/Timeline.ts';
import { LLMManager } from './services/LLMManager.ts';
import { PromptInspector } from './services/PromptInspector.ts';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function testSaebRealLogin() {
  console.log('🚀 Iniciando teste real do sistema SAEB...');
  console.log('URL:', 'https://saeb-h1.pmfi.pr.gov.br/auth/signin');
  console.log('Usuário: admin');
  console.log('Senha: admin123');
  console.log('=' .repeat(60));

  const timeline = new Timeline();
  const sessionId = await timeline.startSession({
    url: 'https://saeb-h1.pmfi.pr.gov.br/auth/signin',
    credentials: { username: 'admin', password: 'admin123' },
    testType: 'real-saeb-login-crawl'
  });

  try {
    // Inicializar agentes
    console.log('\n🤖 Inicializando agentes...');
    
    const loginAgent = new SmartLoginAgent();
    await loginAgent.initialize();
    
    const crawlerAgent = new EnhancedCrawlerAgent();
    await crawlerAgent.initialize();
    
    const analysisAgent = new AnalysisAgent();
    await analysisAgent.initialize();
    
    const contentAgent = new ContentAgent();
    await contentAgent.initialize();
    
    const generatorAgent = new GeneratorAgent('Gerar manual completo do sistema SAEB');
    await generatorAgent.initialize();

    const orchestrator = new OrchestratorAgent();
    await orchestrator.initialize();

    console.log('✅ Todos os agentes inicializados com sucesso!');

    // Executar pipeline completo
    console.log('\n🎯 Executando pipeline completo...');
    
    const result = await orchestrator.processTask({
      id: `saeb-real-test-${Date.now()}`,
      type: 'execute_full_pipeline',
      priority: 'high',
      data: {
        config: {
          url: 'https://saeb-h1.pmfi.pr.gov.br/auth/signin',
          credentials: {
            username: 'admin',
            password: 'admin123'
          },
          crawlOptions: {
            maxPages: 5,
            maxDepth: 2,
            includeScreenshots: true,
            analyzeElements: true
          },
          generationOptions: {
            formats: ['markdown', 'html', 'pdf'],
            includeScreenshots: true,
            detailedSteps: true
          }
        }
      },
      timestamp: new Date()
    });

    await timeline.endSession(sessionId, {
      success: result.success,
      error: result.error,
      documentsGenerated: result.data?.documents || null
    });

    if (result.success) {
      console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
      console.log('=' .repeat(60));
      
      if (result.data?.documents) {
        const docs = result.data.documents;
        console.log('\n📄 Documentos gerados:');
        console.log(`- Markdown: ${docs.filePaths.markdown}`);
        console.log(`- HTML: ${docs.filePaths.html}`);
        if (docs.filePaths.pdf) {
          console.log(`- PDF: ${docs.filePaths.pdf}`);
        }
        
        console.log('\n📊 Estatísticas:');
        console.log(`- Páginas analisadas: ${docs.metadata.totalPages}`);
        console.log(`- Palavras no manual: ${docs.metadata.wordCount}`);
        console.log(`- Seções criadas: ${docs.metadata.sectionCount}`);
        console.log(`- Data de geração: ${docs.metadata.generatedAt.toLocaleString('pt-BR')}`);
        
        console.log('\n🔗 URLs MinIO:');
        console.log(`- Markdown: ${docs.minioUrls.markdown}`);
        console.log(`- HTML: ${docs.minioUrls.html}`);
        if (docs.minioUrls.pdf) {
          console.log(`- PDF: ${docs.minioUrls.pdf}`);
        }
      }
      
      console.log('\n✅ Pipeline executado com sucesso total!');
      console.log('✅ Login realizado com sucesso!');
      console.log('✅ Crawling completado!');
      console.log('✅ Análise de elementos concluída!');
      console.log('✅ Conteúdo gerado!');
      console.log('✅ Documentos finais criados!');
      
    } else {
      console.log('\n❌ TESTE FALHOU!');
      console.log('Erro:', result.error);
      
      if (result.data?.reports) {
        console.log('\n📋 Relatórios disponíveis:');
        Object.entries(result.data.reports).forEach(([agent, url]) => {
          console.log(`- ${agent}: ${url}`);
        });
      }
    }

    // Métricas finais
    console.log('\n📈 Métricas de Performance:');
    console.log(`Tempo total: ${result.processingTime}ms`);

    // Cleanup
    await orchestrator.cleanup();
    await loginAgent.cleanup();
    await crawlerAgent.cleanup();
    await analysisAgent.cleanup();
    await contentAgent.cleanup();
    await generatorAgent.cleanup();
    
    console.log('\n🧹 Cleanup concluído!');
    
  } catch (error) {
    console.error('\n💥 Erro durante o teste:', error);
    
    await timeline.endSession(sessionId, {
      success: false,
      error: error.message
    });
    
    throw error;
  }
}

// Executar teste
if (import.meta.url === `file://${process.argv[1]}`) {
  testSaebRealLogin()
    .then(() => {
      console.log('\n🎯 Teste finalizado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Teste falhou:', error);
      process.exit(1);
    });
}

export { testSaebRealLogin };