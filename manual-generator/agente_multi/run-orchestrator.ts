#!/usr/bin/env ts-node

/**
 * Script para executar o OrchestratorAgent usando variáveis de ambiente
 * 
 * Uso:
 *   npm run orchestrator
 *   ou
 *   ts-node run-orchestrator.ts
 * 
 * Configurações via .env:
 *   SAEB_URL=https://saeb-h1.pmfi.pr.gov.br/auth/signin
 *   SAEB_USERNAME=admin
 *   SAEB_PASSWORD=admin123
 */

import { OrchestratorAgent } from './agents/OrchestratorAgent.js';
import * as path from 'path';
import * as fs from 'fs/promises';

async function main() {
  console.log('🚀 Iniciando OrchestratorAgent com configurações do ambiente...');
  
  // Verificar se as variáveis de ambiente estão definidas
  const requiredEnvVars = ['SAEB_URL', 'SAEB_USERNAME', 'SAEB_PASSWORD'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('⚠️  Variáveis de ambiente não encontradas:', missingVars.join(', '));
    console.warn('   Usando valores padrão...');
  }
  
  // Mostrar configurações que serão usadas
  console.log('📋 Configurações:');
  console.log(`   URL: ${process.env.SAEB_URL || 'https://saeb-h1.pmfi.pr.gov.br/auth/signin'}`);
  console.log(`   Usuário: ${process.env.SAEB_USERNAME || 'admin'}`);
  console.log(`   Senha: ${process.env.SAEB_PASSWORD ? '[DEFINIDA]' : '[PADRÃO]'}`);
  
  // Criar diretório de saída
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = path.join(process.cwd(), 'output', `orchestrator-${timestamp}`);
  await fs.mkdir(outputDir, { recursive: true });
  console.log(`📁 Saída: ${outputDir}`);
  
  try {
    // Inicializar orquestrador
    const orchestrator = new OrchestratorAgent();
    await orchestrator.initialize();
    // Executar pipeline com configurações do ambiente
    const config = OrchestratorAgent.createDefaultConfig({
      outputDir,
      enableScreenshots: true,
      outputFormats: ['markdown', 'html'],
      stopAfterPhase: process.argv.includes('--login-only') ? 'login' : undefined
    });

    let result;
    if (process.argv.includes('--explore-page')) {
      const startUrl = process.env.SAEB_URL || 'https://saeb-h1.pmfi.pr.gov.br/auth/signin';
      console.log(`
🧭 Explorando página: ${startUrl}`);
      result = await orchestrator.executePageExplore({
        startUrl,
        outputDir,
        enableScreenshots: config.enableScreenshots,
      });
    } else {
      result = await orchestrator.executeFullPipeline(config);
    }
    
    // Mostrar resultados
    console.log('\n📊 Resultados:');
    console.log(`   Sucesso: ${result.success ? '✅' : '❌'}`);
    console.log(`   Duração: ${result.totalDuration}ms`);
    console.log(`   Agentes executados: ${result.agentsExecuted.join(', ')}`);
    console.log(`   Páginas processadas: ${result.statistics.pagesProcessed}`);
    console.log(`   Elementos analisados: ${result.statistics.elementsAnalyzed}`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Erros:');
      result.errors.forEach((error: any) => console.log(`   - ${error}`));
    }
    
    if (Object.keys(result.documentsGenerated).length > 0) {
      console.log('\n📄 Documentos gerados:');
      Object.entries(result.documentsGenerated).forEach(([format, path]) => {
        if (path) console.log(`   ${format.toUpperCase()}: ${path}`);
      });
    }
    
    // Cleanup
    await orchestrator.cleanup();
    
    console.log('\n✅ Execução concluída!');
    process.exit(result.success ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Erro durante execução:', error);
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

export { main };