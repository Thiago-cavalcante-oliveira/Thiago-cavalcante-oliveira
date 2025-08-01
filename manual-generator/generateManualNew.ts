#!/usr/bin/env node

import { validateEnvironment } from './src/config/index.js';
import { ManualGenerator } from './src/core/ManualGenerator.js';
import { LogUtils, UrlUtils } from './src/utils/index.js';

async function main() {
  try {
    // Validar variáveis de ambiente
    validateEnvironment();

    // Obter parâmetros da linha de comando
    const args = process.argv.slice(2);
    if (args.length === 0) {
      LogUtils.logError('Uso: npm run generate:new <URL> [username] [password]');
      LogUtils.logInfo('   Exemplo: npm run generate:new "https://exemplo.com"');
      LogUtils.logInfo('   Com login: npm run generate:new "https://site.com" "usuario" "senha"');
      process.exit(1);
    }

    const inputUrl = args[0];
    const username = args[1];
    const password = args[2];

    // Validar URL
    if (!UrlUtils.isValidUrl(inputUrl)) {
      LogUtils.logError(`URL inválida: ${inputUrl}`);
      process.exit(1);
    }

    // Validar credenciais se fornecidas
    if ((username && !password) || (!username && password)) {
      LogUtils.logError('Se fornecidas credenciais, tanto usuário quanto senha são obrigatórios');
      process.exit(1);
    }

    // Inicializar gerador
    const generator = new ManualGenerator();

    // Informar sobre autenticação se credenciais foram fornecidas
    if (username && password) {
      LogUtils.logInfo(`🔐 Credenciais detectadas - login automático será realizado`);
      LogUtils.logInfo(`👤 Usuário: ${username}`);
      LogUtils.logInfo(`🔑 Senha: ${'*'.repeat(password.length)}`);
    }

    // Gerar manual
    await generator.generateManual(inputUrl, { username, password });

    // Exibir estatísticas finais
    const stats = generator.getStats();
    LogUtils.logInfo(`📊 Estatísticas finais:`);
    LogUtils.logInfo(`   - Total de seções: ${stats.totalSections}`);
    LogUtils.logInfo(`   - Screenshots capturados: ${stats.totalScreenshots}`);
    LogUtils.logInfo(`   - Concluído em: ${stats.timestamp}`);

  } catch (error) {
    LogUtils.logError('Falha na execução', error);
    process.exit(1);
  }
}

main();
