#!/usr/bin/env node

import { validateEnvironment } from '../src/config/index.js';
import { ManualGenerator } from '../src/core/ManualGenerator.js';
import { LogUtils, UrlUtils } from '../src/utils/index.js';

async function main() {
  try {
    // Validar variáveis de ambiente
    validateEnvironment();

    // Obter URL da linha de comando
    const inputUrl = process.argv[2];
    if (!inputUrl) {
      LogUtils.logError('Uso: npm run generate:new <URL>');
      LogUtils.logInfo('   Exemplo: npm run generate:new "https://exemplo.com"');
      process.exit(1);
    }

    // Validar URL
    if (!UrlUtils.isValidUrl(inputUrl)) {
      LogUtils.logError(`URL inválida: ${inputUrl}`);
      process.exit(1);
    }

    // Inicializar e executar gerador
    const generator = new ManualGenerator();
    await generator.generateManual(inputUrl);

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
