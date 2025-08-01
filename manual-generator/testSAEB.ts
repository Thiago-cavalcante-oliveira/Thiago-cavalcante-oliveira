#!/usr/bin/env node
import dotenv from 'dotenv';
import { ManualGenerator } from './src/core/ManualGenerator.js';

dotenv.config();

async function testSAEBManual() {
  console.log('🚀 TESTE COMPLETO DO SISTEMA - SAEB');
  console.log('===================================');

  const generator = new ManualGenerator();
  
  const url = 'https://saeb-h1.pmfi.pr.gov.br/';
  const credentials = {
    username: 'admin',
    password: 'admin123'
  };

  console.log(`\n🌐 URL: ${url}`);
  console.log(`👤 Usuário: ${credentials.username}`);
  console.log(`🤖 AgentService: Ativado (MinIO + Gemini)`);

  try {
    console.log('\n⏳ Iniciando geração do manual user-friendly...');
    await generator.generateUserFriendlyManual(url, credentials);
    
    console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log('\n📊 Verificar:');
    console.log('   - Screenshots capturados');
    console.log('   - Upload para MinIO realizado');
    console.log('   - Análise Gemini aplicada');
    console.log('   - Manual user-friendly gerado');
    
  } catch (error) {
    console.log(`\n❌ ERRO: ${error instanceof Error ? error.message : error}`);
    if (error instanceof Error && error.stack) {
      console.log('\n📋 Stack trace:');
      console.log(error.stack);
    }
  }
}

testSAEBManual().catch(console.error);
