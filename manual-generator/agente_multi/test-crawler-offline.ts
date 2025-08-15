import { SmartCrawler } from './crawler/smartCrawler.js';
import { chromium } from 'playwright';
import { logger } from './utils/logger.js';

async function testOfflineCrawler() {
  logger.info('🚀 Iniciando teste offline do SmartCrawler...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Criar uma página HTML simples
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Teste SmartCrawler</title>
    </head>
    <body>
        <h1>Página de Teste</h1>
        <nav>
            <a href="#home">Home</a>
            <a href="#about">Sobre</a>
            <a href="#contact">Contato</a>
        </nav>
        <main>
            <p>Esta é uma página de teste para o SmartCrawler.</p>
            <form>
                <label for="name">Nome:</label>
                <input type="text" id="name" name="name" required>
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" required>
                <button type="submit">Enviar</button>
            </form>
        </main>
    </body>
    </html>
    `;
    
    await page.setContent(htmlContent);
    logger.info('✅ Página HTML carregada com sucesso');
    
    // Testar análise de página única
    const result = await SmartCrawler.analyzeSinglePage(browser, 'data:text/html,test', {
      timeout: 5000
    });
    logger.info('✅ Análise de página concluída');
    logger.info(`📊 Título: ${result.title}`);
    logger.info(`📊 Propósito: ${result.purpose}`);
    logger.info(`📊 Ações principais: ${result.mainActions.join(', ')}`);
    logger.info(`📊 Elementos analisados: ${result.actions.length}`);
    
    logger.info('✅ Teste do SmartCrawler concluído com sucesso!');
    
  } catch (error) {
    logger.error(`❌ Erro durante o teste: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    await browser.close();
    logger.info('🔒 Browser fechado');
  }
}

// Executar teste
testOfflineCrawler().catch(error => {
  logger.error(`💥 Erro no teste: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});