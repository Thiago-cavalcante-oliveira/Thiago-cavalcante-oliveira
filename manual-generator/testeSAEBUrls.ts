import { SequentialManualGenerator } from './src/core/SequentialManualGenerator';

async function testeSAEBAlternativo() {
  console.log('🎓 TESTE SAEB - URLS ALTERNATIVAS');
  console.log('=================================');
  console.log('');

  const generator = new SequentialManualGenerator();
  
  // URLs alternativas do SAEB
  const saebUrls = [
    'https://provabrasil.inep.gov.br/',
    'https://sistemasaeb.inep.gov.br/',
    'https://saeb.inep.gov.br/',
    'https://www.inep.gov.br/educacao-basica/saeb'
  ];

  for (const url of saebUrls) {
    try {
      console.log(`\n🌐 Testando: ${url}`);
      
      const startTime = Date.now();
      
      await generator.generateSequentialManual(url);
      
      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);
      
      console.log('');
      console.log('🎉 SAEB MAPEADO COM SUCESSO!');
      console.log(`🌐 URL funcional: ${url}`);
      console.log(`⏱️  Tempo: ${duration}s`);
      console.log('🎓 Manual do SAEB gerado!');
      
      break; // Parar no primeiro que funcionar
      
    } catch (error) {
      console.error(`❌ Erro em ${url}:`, error instanceof Error ? error.message : 'Erro desconhecido');
      console.log('🔄 Tentando próxima URL...');
    }
  }
}

testeSAEBAlternativo();
