#!/usr/bin/env node
import dotenv from 'dotenv';
import { EnhancedManualGenerator } from './src/core/EnhancedManualGenerator.js';

dotenv.config();

async function testEnhancedSAEB() {
  console.log('🚀 TESTE DO SISTEMA APRIMORADO - SAEB');
  console.log('====================================');

  const generator = new EnhancedManualGenerator();
  
  const url = 'https://saeb-h1.pmfi.pr.gov.br/';
  const credentials = {
    username: 'admin',
    password: 'admin123'
  };

  console.log(`\n🌐 URL: ${url}`);
  console.log(`👤 Usuário: ${credentials.username}`);
  console.log(`🎯 Recursos ativados:`);
  console.log(`   ✅ Detecção aprimorada de elementos`);
  console.log(`   ✅ Captura inteligente de screenshots`);
  console.log(`   ✅ Upload automático para MinIO`);
  console.log(`   ✅ Análise com Gemini AI`);
  console.log(`   ✅ Geração automática de HTML + PDF`);

  try {
    console.log('\n⏳ Iniciando geração completa do manual...');
    
    const startTime = Date.now();
    await generator.generateCompleteManual(url, credentials);
    const endTime = Date.now();
    
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log(`⏱️ Tempo total: ${duration} segundos`);
    
    // Mostrar estatísticas
    const screenshots = generator.getScreenshots();
    const interactions = generator.getInteractionResults();
    const successful = generator.getSuccessfulInteractions();
    
    console.log('\n📊 ESTATÍSTICAS:');
    console.log(`   📷 Screenshots capturados: ${screenshots.length}`);
    console.log(`   🖱️ Interações testadas: ${interactions.length}`);
    console.log(`   ✅ Interações bem-sucedidas: ${successful.length}`);
    console.log(`   📄 Taxa de sucesso: ${Math.round((successful.length / interactions.length) * 100)}%`);
    
    console.log('\n📋 ARQUIVOS GERADOS:');
    console.log('   📝 manual_saeb_h1_pmfi_pr_gov_br.md');
    console.log('   🌐 html/manual_saeb_h1_pmfi_pr_gov_br.html');
    console.log('   📄 pdf/manual_saeb_h1_pmfi_pr_gov_br.pdf');
    console.log('   📋 manual_metadata.json');
    
    console.log('\n🎯 MELHORIAS IMPLEMENTADAS:');
    console.log('   ✅ Detecção mais precisa de menus e submenus');
    console.log('   ✅ Estratégias múltiplas de clique');
    console.log('   ✅ Geração automática de PDF e HTML');
    console.log('   ✅ Screenshots organizados automaticamente');
    console.log('   ✅ Metadados completos do processo');
    
  } catch (error) {
    console.log(`\n❌ ERRO: ${error instanceof Error ? error.message : error}`);
    if (error instanceof Error && error.stack) {
      console.log('\n📋 Stack trace:');
      console.log(error.stack);
    }
  }
}

testEnhancedSAEB().catch(console.error);
