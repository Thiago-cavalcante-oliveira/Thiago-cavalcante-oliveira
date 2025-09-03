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
  const args = process.argv.slice(2);
  const getArg = (name: string) => {
    const index = args.indexOf(`--${name}`);
    return index > -1 && args[index + 1] ? args[index + 1] : undefined;
  };

  const url = getArg('url') || process.env.SAEB_URL || 'https://saeb-h1.pmfi.pr.gov.br/auth/signin';
  const username = getArg('username') || process.env.SAEB_USERNAME || 'admin';
  const password = getArg('password') || process.env.SAEB_PASSWORD || 'admin123';
  const loginUrl = getArg('login-url') || process.env.SAEB_URL || 'https://saeb-h1.pmfi.pr.gov.br/auth/signin';

  // Mostrar configurações que serão usadas
  console.log('📋 Configurações:');
  console.log(`   URL: ${url}`);
  console.log(`   Usuário: ${username}`);
  console.log(`   Senha: ${password ? '[DEFINIDA]' : '[PADRÃO]'}`);
  
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
      targetUrl: url,
      outputDir,
      enableScreenshots: true,
      outputFormats: ['markdown', 'html'],
      stopAfterPhase: process.argv.includes('--login-only') ? 'login' : undefined,
      credentials: {
        username: username,
        password: password,
        loginUrl: loginUrl
      }
    });

    let result;
    let browser;
    let page;
    let context;

    try {
      if (args.includes('--explore-page')) {
        console.log(`\n🧭 Explorando página: ${url}`);
        // Lançar navegador e criar página para explorePage
        browser = await orchestrator.launchBrowser(); // Supondo que OrchestratorAgent tenha um método launchBrowser
        context = await browser.newContext();
        page = await context.newPage();

        result = await orchestrator.executePageExplore({
          startUrl: url,
          outputDir,
          enableScreenshots: config.enableScreenshots,
          pageInstance: page, // Passa a instância da página
        });
      } else {
        result = await orchestrator.executeFullPipeline(config);
      }
    } finally {
      if (browser) {
        await browser.close();
        console.log('Navegador fechado após exploração de página.');
      }
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
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main };