import { SequentialManualGenerator } from './src/core/SequentialManualGenerator';

async function testSequentialGeneration() {
  console.log('🚀 TESTE SEQUENCIAL COMPLETO - GOOGLE');
  console.log('=====================================');
  console.log('');
  console.log('🎯 Objetivos:');
  console.log('   ✅ Mapear página principal completamente');
  console.log('   ✅ Identificar navegações possíveis');
  console.log('   ✅ Explorar 2 páginas adicionais');
  console.log('   ✅ Retornar e completar mapeamento');
  console.log('   ✅ Documentar mudanças de estado');
  console.log('   ✅ Gerar manual sequencial completo');
  console.log('');

  const generator = new SequentialManualGenerator();
  
  try {
    await generator.generateSequentialManual('https://www.google.com');
    console.log('');
    console.log('✅ TESTE SEQUENCIAL CONCLUÍDO COM SUCESSO!');
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE SEQUENCIAL:', error);
  }
}

testSequentialGeneration();
