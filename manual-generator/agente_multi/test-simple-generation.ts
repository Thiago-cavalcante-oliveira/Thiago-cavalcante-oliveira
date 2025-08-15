import { OrchestratorAgent } from './agents/OrchestratorAgent';
import { AgnoSCore } from './core/AgnoSCore';

async function testSimpleGeneration() {
  console.log('🚀 Iniciando teste de geração simples...');
  
  const core = new AgnoSCore();
  const orchestrator = new OrchestratorAgent();
  
  try {
    // Registrar e inicializar o agente
    core.registerAgent(orchestrator);
    await orchestrator.initialize();
    
    // Configuração sem login
    const config = {
      maxRetries: 1,
      timeoutMinutes: 2,
      enableScreenshots: true,
      outputFormats: ['markdown', 'html', 'pdf'] as ('markdown' | 'html' | 'pdf')[],
      targetUrl: 'https://httpbin.org/html', // Site simples para teste
    };
    
    console.log('📋 Executando pipeline completo...');
    const result = await orchestrator.executeFullPipeline(config);
    
    console.log('✅ Resultado:', {
      success: result.success,
      documentsGenerated: result.documentsGenerated,
      statistics: result.statistics
    });
    
    // Verificar arquivos gerados
    console.log('📁 Verificando arquivos gerados...');
    const fs = await import('fs');
    const path = await import('path');
    
    const outputDir = path.resolve('./output/final_documents');
    if (fs.existsSync(outputDir)) {
      const files = fs.readdirSync(outputDir);
      console.log('📄 Arquivos encontrados:', files);
      
      // Verificar tipos de arquivo
      const mdFiles = files.filter(f => f.endsWith('.md'));
      const htmlFiles = files.filter(f => f.endsWith('.html'));
      const pdfFiles = files.filter(f => f.endsWith('.pdf'));
      
      console.log('📊 Resumo de arquivos gerados:');
      console.log(`  - Markdown: ${mdFiles.length} arquivo(s)`);
      console.log(`  - HTML: ${htmlFiles.length} arquivo(s)`);
      console.log(`  - PDF: ${pdfFiles.length} arquivo(s)`);
      
      if (mdFiles.length > 0) console.log('✅ Arquivos MD gerados com sucesso!');
      if (htmlFiles.length > 0) console.log('✅ Arquivos HTML gerados com sucesso!');
      if (pdfFiles.length > 0) console.log('✅ Arquivos PDF gerados com sucesso!');
    } else {
      console.log('⚠️ Diretório de saída não encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await core.stop();
    console.log('⏹️ Teste finalizado');
  }
}

// Executar o teste
testSimpleGeneration().catch(console.error);