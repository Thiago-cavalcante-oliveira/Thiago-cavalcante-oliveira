import { SimpleNavigationService } from './src/services/SimpleNavigationService';

async function testSimple() {
  console.log('🚀 TESTE SIMPLES COM GOOGLE');
  console.log('==============================');

  const service = new SimpleNavigationService();
  
  try {
    await service.init();
    
    // Navegar para Google
    const success = await service.navigateTo('https://www.google.com');
    if (!success) {
      throw new Error('Falha ao navegar para Google');
    }

    // Capturar screenshot
    await service.takeScreenshot('simple_google.png');

    // Detectar elementos
    const elements = await service.detectAllInteractiveElements();
    
    console.log('\n📊 RESULTADOS:');
    console.log(`   🔍 Elementos encontrados: ${elements.length}`);
    console.log(`   🏠 URL base: ${service.getBaseUrl()}`);
    console.log(`   🌐 URLs visitadas: ${service.getVisitedUrls().length}`);
    
    if (elements.length > 0) {
      console.log('\n🎯 ALGUNS ELEMENTOS ENCONTRADOS:');
      elements.slice(0, 5).forEach((el, i) => {
        console.log(`   ${i + 1}. ${el.type.toUpperCase()}: "${el.text.substring(0, 50)}..."`);
      });
    }

    console.log('\n✅ TESTE SIMPLES CONCLUÍDO COM SUCESSO!');
    
  } catch (error) {
    console.log(`\n❌ ERRO: ${error instanceof Error ? error.message : error}`);
    console.log('\n📋 Stack trace:');
    console.log(error instanceof Error ? error.stack : 'Erro desconhecido');
  } finally {
    await service.close();
  }
}

testSimple();
