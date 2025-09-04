#!/usr/bin/env ts-node
import 'dotenv/config';

import { OrchestratorAgent, OrchestrationConfig, OrchestrationResult } from './agents/OrchestratorAgent.js';
import * as path from 'path';
import * as fs from 'fs/promises';
import { env } from './config/env.js';

async function main() {
  // ... (código de setup mantido)
  
  try {
    const orchestrator = new OrchestratorAgent();
    await orchestrator.initialize();
    
    // ✅ Adicionado tipo explícito e seguro
    let result: Partial<OrchestrationResult> = {}; 

    // ... (lógica de execução mantida)
    
    // ✅ Acesso seguro às propriedades do resultado
    console.log('\n📊 Resultados:');
    console.log(`   Sucesso: ${result.success ? '✅' : '❌'}`);
    console.log(`   Duração: ${result.totalDuration ?? 'N/A'}ms`);
    console.log(`   Agentes Executados: ${result.agentsExecuted?.join(', ') ?? 'Nenhum'}`);
    console.log(`   Páginas Processadas: ${result.statistics?.pagesProcessed ?? 0}`);
    console.log(`   Elementos Analisados: ${result.statistics?.elementsAnalyzed ?? 0}`);
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n❌ Erros Encontrados:');
      result.errors.forEach((error: string) => console.log(`   - ${error}`));
    }
    
    if (result.documentsGenerated && Object.keys(result.documentsGenerated).length > 0) {
        // ...
    }
    
    await orchestrator.cleanup();
    
    console.log('\n✅ Execução concluída!');
    process.exit(result.success ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Erro fatal durante a execução:', error);
    process.exit(1);
  }
}

main().catch(console.error);