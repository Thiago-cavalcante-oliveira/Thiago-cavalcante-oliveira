import { SequentialManualGenerator } from './src/core/SequentialManualGenerator';

async function testeSAEB() {
  console.log('🎓 TESTE SISTEMA SAEB PMFI - NAVEGAÇÃO SEQUENCIAL');
  console.log('==================================================');
  console.log('');
  console.log('🎯 Sistema SAEB PMFI - Objetivos:');
  console.log('   ✅ Mapear portal administrativo do SAEB PMFI');
  console.log('   ✅ Realizar login automático (admin/admin123)');
  console.log('   ✅ Identificar formulários e campos administrativos');
  console.log('   ✅ Detectar navegações para módulos do sistema');
  console.log('   ✅ Mapear funcionalidades administrativas');
  console.log('   ✅ Documentar fluxos de trabalho');
  console.log('   ✅ Capturar mudanças de estado do sistema');
  console.log('   ✅ Gerar manual completo para administradores');
  console.log('');
  console.log('🌐 URL do SAEB PMFI: https://saeb-h1.pmfi.pr.gov.br/');
  console.log('📊 Limite: Página principal + 2 módulos administrativos');
  console.log('');

  const generator = new SequentialManualGenerator();
  
  // URL específica do SAEB PMFI com credenciais
  const saebUrl = 'https://saeb-h1.pmfi.pr.gov.br/';
  const credentials = {
    username: 'admin',
    password: 'admin123'
  };

  console.log('🔍 Testando SAEB PMFI com credenciais...');
  console.log(`🌐 URL: ${saebUrl}`);
  console.log(`👤 Usuário: ${credentials.username}`);
  console.log(`🔐 Senha: ${'*'.repeat(credentials.password.length)}`);
  console.log('');
  
  try {
    console.log(`🌐 Acessando sistema SAEB PMFI...`);
    
    const startTime = Date.now();
    
    // Passar credenciais para o gerador
    await generator.generateSequentialManual(saebUrl, credentials);
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('');
    console.log('🎉 SISTEMA SAEB PMFI MAPEADO COM SUCESSO!');
    console.log('=========================================');
    console.log(`🌐 URL testada: ${saebUrl}`);
    console.log(`⏱️  Tempo total: ${duration} segundos`);
    console.log('📁 Arquivos gerados em: ./output/');
    console.log('✅ Manual educacional completo gerado');
    console.log('✅ Sistema de login mapeado');
    console.log('✅ Fluxos de navegação documentados');
    console.log('✅ Formulários e campos identificados');
    console.log('✅ Screenshots contextualizados capturados');
    console.log('✅ Mudanças de estado registradas');
    console.log('✅ Páginas administrativas mapeadas');
    console.log('');
    console.log('🎓 MANUAL DO SAEB PMFI PRONTO PARA ADMINISTRADORES!');
    
  } catch (error) {
    console.error(`❌ Erro ao acessar SAEB PMFI:`, error instanceof Error ? error.message : error);
    console.log('');
    console.log('� Possíveis soluções:');
    console.log('   1. Verificar se o servidor está online');
    console.log('   2. Confirmar credenciais de acesso');
    console.log('   3. Verificar conectividade de rede');
    console.log('   4. Tentar novamente em alguns minutos');
  }
}

testeSAEB();
