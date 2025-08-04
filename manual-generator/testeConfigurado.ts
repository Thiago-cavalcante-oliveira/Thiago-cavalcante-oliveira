import { SequentialManualGenerator } from './src/core/SequentialManualGenerator.js';

function parseArgs() {
  const args = process.argv.slice(2);
  let url = '';
  let maxPages: number | undefined = undefined;
  let username = '';
  let password = '';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--url' && i + 1 < args.length) {
      url = args[i + 1];
      i++;
    } else if (arg === '--max-pages' && i + 1 < args.length) {
      maxPages = parseInt(args[i + 1]);
      i++;
    } else if (arg === '--username' && i + 1 < args.length) {
      username = args[i + 1];
      i++;
    } else if (arg === '--password' && i + 1 < args.length) {
      password = args[i + 1];
      i++;
    } else if (arg === '--help') {
      console.log(`
🎓 GERADOR DE MANUAL SEQUENCIAL
===============================

Uso: npx tsx testeConfigurado.ts [opções]

Opções:
  --url <url>           URL do sistema para mapear (obrigatório)
  --max-pages <numero>  Limite máximo de páginas (opcional, padrão: sem limite)
  --username <usuario>  Nome de usuário para login (opcional)
  --password <senha>    Senha para login (opcional)
  --help               Mostra esta ajuda

Exemplos:
  # Sem limite de páginas
  npx tsx testeConfigurado.ts --url https://example.com

  # Com limite de 3 páginas
  npx tsx testeConfigurado.ts --url https://example.com --max-pages 3

  # Com login
  npx tsx testeConfigurado.ts --url https://saeb-h1.pmfi.pr.gov.br/ --username admin --password admin123

  # SAEB PMFI com limite de 5 páginas
  npx tsx testeConfigurado.ts --url https://saeb-h1.pmfi.pr.gov.br/ --username admin --password admin123 --max-pages 5
      `);
      process.exit(0);
    }
  }

  return { url, maxPages, username, password };
}

async function main() {
  const { url, maxPages, username, password } = parseArgs();

  if (!url) {
    console.error('❌ URL é obrigatória. Use --help para ver as opções.');
    process.exit(1);
  }

  console.log('🎓 GERADOR DE MANUAL SEQUENCIAL CONFIGURÁVEL');
  console.log('=============================================');
  console.log('');
  console.log('⚙️  Configuração:');
  console.log(`   🌐 URL: ${url}`);
  console.log(`   📊 Limite de páginas: ${maxPages ?? 'SEM LIMITE'}`);
  console.log(`   👤 Login: ${username ? `${username}/${password ? '*'.repeat(password.length) : 'sem senha'}` : 'Não configurado'}`);
  console.log('');

  const generator = new SequentialManualGenerator(maxPages);
  
  const credentials = username && password ? { username, password } : undefined;
  
  try {
    const startTime = Date.now();
    
    await generator.generateSequentialManual(url, credentials);
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('');
    console.log('🎉 GERAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('=================================');
    console.log(`⏱️  Tempo total: ${duration} segundos`);
    console.log('📁 Arquivos gerados em: ./output/');
    console.log('✅ Markdown: Estruturado e detalhado');
    console.log('✅ HTML: Responsivo com CSS profissional');  
    console.log('✅ PDF: Com imagens visíveis e formatação correta');
    console.log('');
    console.log('🚀 MANUAL PRONTO PARA USO!');
    
  } catch (error) {
    console.error('❌ ERRO NA GERAÇÃO:', error);
    process.exit(1);
  }
}

main();
