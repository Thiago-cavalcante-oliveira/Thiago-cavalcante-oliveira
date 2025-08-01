#!/usr/bin/env node
import { ManualGenerator } from './src/core/ManualGenerator.js';
import { AuthService } from './src/services/auth.js';

async function main() {
  const args = process.argv.slice(2);
  const url = args[0];
  const username = args[1];
  const password = args[2];

  if (!url) {
    console.log(`
🤖 Manual Generator - Versão Amigável ao Usuário

Uso: npm run generate:friendly <url> [username] [password]

Recursos especiais:
✅ Linguagem simples e direta
✅ Foco em usuários iniciantes
✅ Instruções passo-a-passo
✅ Tradução de termos técnicos
✅ Alertas e dicas importantes
✅ Exemplos práticos

Exemplo:
npm run generate:friendly "https://example.com" "admin" "password"
`);
    process.exit(1);
  }

  try {
    console.log('🤖 Iniciando geração de manual amigável...');
    console.log(`📋 URL: ${url}`);
    
    const generator = new ManualGenerator();
    
    // Verificar se há credenciais
    let credentials;
    if (username && password) {
      console.log('🔐 Credenciais detectadas - login automático será realizado');
      console.log(`📋 👤 Usuário: ${username}`);
      console.log(`📋 🔑 Senha: ${'*'.repeat(password.length)}`);
      
      credentials = AuthService.parseCredentials(username, password);
    }
    
    // Gerar manual amigável
    await generator.generateUserFriendlyManual(url, credentials);
    
    console.log('\n🎉 Manual amigável gerado com sucesso!');
    console.log('📁 Verifique os arquivos:');
    console.log('   - manual_usuario.md (versão amigável)');
    console.log('   - manual_metadata.json (metadados)');
    console.log('   - screenshots/*.png (capturas de tela)');
    
  } catch (error) {
    console.error('❌ Erro durante a geração:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main().catch(console.error);
