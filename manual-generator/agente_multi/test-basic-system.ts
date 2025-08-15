#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config();

import { AgnoSCore } from './core/AgnoSCore';

async function testBasicSystem() {
  console.log('🧪 TESTE BÁSICO DO SISTEMA');
  console.log('='.repeat(30));

  try {
    // 1. Teste de inicialização do core
    console.log('\n1️⃣ Testando inicialização do AgnoSCore...');
    const core = new AgnoSCore();
    
    // 2. Verificar se o sistema está operacional
    const status = core.getSystemStatus();
    console.log('✅ Sistema inicializado');
    console.log(`📊 Status: ${JSON.stringify(status, null, 2)}`);

    // 3. Teste básico de agentes (sem API calls)
    console.log('\n2️⃣ Testando importação de agentes...');
    
    try {
      const { OrchestratorAgent } = await import('./agents/OrchestratorAgent');
const { CrawlerAgent } = await import('./agents/CrawlerAgent');
const { AnalysisAgent } = await import('./agents/AnalysisAgent');
const { ContentAgent } = await import('./agents/ContentAgent');
const { GeneratorAgent } = await import('./agents/GeneratorAgent');
const { ScreenshotAgent } = await import('./agents/ScreenshotAgent');
const { LoginAgent } = await import('./agents/LoginAgent');
      
      console.log('✅ Todos os agentes importados com sucesso');
      
      // 4. Carregar prompts e registrar agentes (teste de compatibilidade)
      const fs = await import('fs/promises');
      const baseDir = new URL('.', import.meta.url).pathname;
      
      const analysisPrompt = await fs.readFile(`${baseDir}/prompts/analysis.prompt.txt`, 'utf-8');
      const contentPrompt = await fs.readFile(`${baseDir}/prompts/content.prompt.txt`, 'utf-8');
      const generatorPrompt = await fs.readFile(`${baseDir}/prompts/generator.prompt.txt`, 'utf-8');
      
      const agents = [
        new OrchestratorAgent(),
        new CrawlerAgent(),
        new AnalysisAgent(analysisPrompt.replace('# Prompt para AnalysisAgent', '').trim()),
        new ContentAgent(contentPrompt.replace('# Prompt para ContentAgent', '').trim()),
        new GeneratorAgent(generatorPrompt.replace('# Prompt para GeneratorAgent', '').trim()),
        new ScreenshotAgent(),
        new LoginAgent()
      ];

      console.log('\n3️⃣ Registrando agentes...');
      for (const agent of agents) {
        core.registerAgent(agent);
        console.log(`✅ ${agent.constructor.name} registrado`);
      }

      // 5. Verificar status final
      const finalStatus = core.getSystemStatus();
      console.log('\n4️⃣ Status final do sistema:');
      console.log(`📊 Agentes registrados: ${finalStatus.totalAgents}`);
      console.log(`🚀 Sistema operacional: ${finalStatus.isRunning}`);

      // 6. Cleanup
      await core.stop();
      console.log('✅ Sistema finalizado com segurança');

    } catch (importError) {
      console.error('❌ Erro ao importar agentes:', importError);
      return false;
    }

    console.log('\n🎉 TESTE BÁSICO CONCLUÍDO COM SUCESSO!');
    return true;

  } catch (error) {
    console.error('❌ ERRO NO TESTE BÁSICO:', error);
    return false;
  }
}

// Executar teste
testBasicSystem()
  .then(success => {
    if (success) {
      console.log('\n✅ Sistema está funcionando corretamente!');
      process.exit(0);
    } else {
      console.log('\n❌ Sistema apresentou problemas!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 FALHA CRÍTICA:', error);
    process.exit(1);
  });
