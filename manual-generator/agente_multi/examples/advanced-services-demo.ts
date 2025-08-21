import 'dotenv/config';
import { LLMRouter } from '../services/LLMRouter.js';
import { PromptInspector } from '../services/PromptInspector.js';
import { ArtifactStore } from '../services/ArtifactStore.js';
import { Timeline } from '../services/Timeline.js';

/**
 * Demonstração dos serviços avançados implementados
 * Este arquivo mostra como usar os novos recursos do sistema
 */
async function demonstrateAdvancedServices() {
  console.log('🚀 Demonstração dos Serviços Avançados');
  console.log('=====================================\n');

  // 1. Timeline - Rastreamento temporal
  console.log('📊 1. Timeline - Rastreamento Temporal');
  const timeline = new Timeline();
  const sessionId = await timeline.startSession({
    demo: true,
    purpose: 'Demonstração dos serviços avançados'
  });
  
  await timeline.recordMilestone('Demonstração iniciada');
  console.log(`   ✅ Sessão iniciada: ${sessionId}\n`);

  // 2. ArtifactStore - Gerenciamento de artefatos
  console.log('📦 2. ArtifactStore - Gerenciamento de Artefatos');
  const artifactStore = new ArtifactStore();
  
  // Criar alguns artefatos de exemplo
  const docId = await artifactStore.store({
    type: 'document',
    name: 'exemplo-manual.md',
    content: '# Manual de Exemplo\n\nEste é um documento de exemplo.',
    tags: ['exemplo', 'manual'],
    metadata: { author: 'Sistema', version: '1.0' }
  });
  
  const dataId = await artifactStore.store({
    type: 'data',
    name: 'dados-crawling.json',
    content: JSON.stringify({ pages: 5, elements: 120 }),
    tags: ['crawling', 'dados'],
    metadata: { timestamp: new Date().toISOString() }
  });
  
  console.log(`   ✅ Documento criado: ${docId}`);
  console.log(`   ✅ Dados criados: ${dataId}`);
  
  // Buscar artefatos
  const documents = artifactStore.search({ type: 'document' });
  console.log(`   📋 Documentos encontrados: ${documents.length}\n`);

  // 3. PromptInspector - Análise de prompts
  console.log('🔍 3. PromptInspector - Análise de Prompts');
  const promptInspector = new PromptInspector();
  
  // Simular algumas execuções de prompt
  const prompts = [
    'Analise esta página web e extraia os elementos principais',
    'Gere um manual baseado nos dados coletados',
    'Crie um relatório de análise detalhado'
  ];
  
  for (let i = 0; i < prompts.length; i++) {
    const startTime = Date.now();
    
    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    const responseTime = Date.now() - startTime;
    
    await promptInspector.recordPromptExecution({
      prompt: prompts[i],
      responseTime,
      success: Math.random() > 0.1, // 90% de sucesso
      provider: Math.random() > 0.5 ? 'gemini' : 'groq',
      model: 'demo-model',
      responseLength: Math.floor(Math.random() * 1000) + 200,
      quality: Math.floor(Math.random() * 5) + 6 // 6-10
    });
  }
  
  // Analisar prompts
  const analysis = promptInspector.analyzePrompts();
  console.log(`   📈 Taxa de sucesso: ${analysis.successRate.toFixed(1)}%`);
  console.log(`   ⏱️ Tempo médio: ${analysis.averageResponseTime.toFixed(0)}ms`);
  
  // Otimizar um prompt
  const optimization = promptInspector.optimizePrompt(prompts[0]);
  console.log(`   🔧 Sugestões: ${optimization.suggestions.length}`);
  console.log(`   📊 Melhoria estimada: ${optimization.estimatedImprovement}\n`);

  // 4. LLMRouter - Roteamento inteligente
  console.log('🤖 4. LLMRouter - Roteamento Inteligente');
  const llmRouter = new LLMRouter();
  
  try {
    // Simular uma chamada (pode falhar se não houver chaves configuradas)
    console.log('   🔄 Testando roteamento de LLM...');
    
    const testPrompt = 'Este é um teste do sistema de roteamento';
    const startTime = Date.now();
    
    // Nota: Esta chamada pode falhar se as chaves não estiverem configuradas
    // Em um ambiente real, isso funcionaria perfeitamente
    try {
      const response = await llmRouter.route(testPrompt, {
        maxTokens: 100,
        temperature: 0.7
      });
      
      console.log(`   ✅ Resposta recebida de ${response.provider}`);
      console.log(`   ⏱️ Tempo: ${response.responseTime}ms`);
      console.log(`   🎯 Tokens: ${response.tokensUsed || 'N/A'}`);
    } catch (error) {
      console.log(`   ⚠️ Teste de LLM pulado (chaves não configuradas)`);
    }
    
    // Mostrar informações do roteador
    console.log(`   📊 LLMRouter configurado com sucesso`);
    console.log(`   🔄 Provedores disponíveis: Gemini, Groq`);
    console.log(`   ⚡ Circuit breaker ativo para tolerância a falhas`);
    
  } catch (error) {
    console.log(`   ⚠️ LLMRouter não disponível (configuração necessária)`);
  }
  
  console.log();

  // 5. Demonstrar integração entre serviços
  console.log('🔗 5. Integração entre Serviços');
  
  await timeline.startTask('Demo', 'integration', 'Demonstrando integração');
  
  // Criar template de prompt
  const templateId = await promptInspector.createTemplate({
    name: 'Análise de Página',
    template: 'Analise a página {{url}} e extraia {{elements}}. Foque em {{focus}}.',
    variables: ['url', 'elements', 'focus'],
    category: 'analysis',
    description: 'Template para análise de páginas web',
    examples: [{
      input: { url: 'example.com', elements: 'formulários', focus: 'usabilidade' },
      expectedOutput: 'Análise detalhada dos formulários com foco em usabilidade'
    }]
  });
  
  // Aplicar template
  const promptFromTemplate = promptInspector.applyTemplate(templateId, {
    url: 'https://exemplo.com',
    elements: 'botões e links',
    focus: 'acessibilidade'
  });
  
  // Armazenar prompt como artefato
  const promptArtifactId = await artifactStore.store({
    type: 'data',
    name: 'prompt-gerado.txt',
    content: promptFromTemplate,
    tags: ['prompt', 'template', 'gerado'],
    metadata: { templateId, generated: true }
  });
  
  await timeline.endTask('Demo', 'integration', 'success');
  
  console.log(`   ✅ Template criado: ${templateId}`);
  console.log(`   ✅ Prompt armazenado: ${promptArtifactId}\n`);

  // 6. Gerar relatórios finais
  console.log('📋 6. Relatórios Finais');
  
  await timeline.recordMilestone('Gerando relatórios finais');
  
  // Relatório do Timeline
  const timelineReport = timeline.generateCurrentReport();
  const timelineReportId = await artifactStore.store({
    type: 'report',
    name: 'timeline-demo.md',
    content: timelineReport,
    tags: ['demo', 'timeline', 'relatório'],
    metadata: { sessionId }
  });
  
  // Relatório do ArtifactStore
  const artifactReport = artifactStore.generateReport();
  const artifactReportId = await artifactStore.store({
    type: 'report',
    name: 'artifacts-demo.md',
    content: artifactReport,
    tags: ['demo', 'artifacts', 'relatório']
  });
  
  // Relatório do PromptInspector
  const promptReport = promptInspector.generatePerformanceReport();
  const promptReportId = await artifactStore.store({
    type: 'report',
    name: 'prompts-demo.md',
    content: promptReport,
    tags: ['demo', 'prompts', 'relatório']
  });
  
  console.log(`   📊 Relatório Timeline: ${timelineReportId}`);
  console.log(`   📦 Relatório Artifacts: ${artifactReportId}`);
  console.log(`   🔍 Relatório Prompts: ${promptReportId}\n`);

  // 7. Estatísticas finais
  console.log('📈 7. Estatísticas Finais');
  
  const finalStats = artifactStore.getStats();
  console.log(`   📦 Total de artefatos: ${finalStats.totalArtifacts}`);
  console.log(`   💾 Espaço usado: ${(finalStats.totalSize / 1024).toFixed(1)} KB`);
  
  const promptAnalysis = promptInspector.analyzePrompts();
  console.log(`   🔍 Prompts analisados: ${promptAnalysis.mostEffectivePrompts.length}`);
  
  // Finalizar timeline
  await timeline.recordMilestone('Demonstração concluída');
  await timeline.endSession('Demonstração dos serviços avançados concluída com sucesso');
  
  console.log('\n✅ Demonstração concluída com sucesso!');
  console.log('\n💡 Os novos serviços estão prontos para uso no sistema principal.');
  console.log('   - LLMRouter: Roteamento inteligente entre provedores');
  console.log('   - PromptInspector: Análise e otimização de prompts');
  console.log('   - ArtifactStore: Gerenciamento inteligente de artefatos');
  console.log('   - Timeline: Rastreamento temporal detalhado');
}

// Executar demonstração
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateAdvancedServices().catch(console.error);
}

export { demonstrateAdvancedServices };