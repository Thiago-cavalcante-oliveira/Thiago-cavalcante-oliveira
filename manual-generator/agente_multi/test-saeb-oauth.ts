import { chromium, Browser, Page } from 'playwright';
import { SmartCrawler } from './crawler/smartCrawler';
import { MinIOService } from './services/MinIOService';
import { logger } from './utils/logger';

async function testSaebOAuthFlow() {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    logger.info('🚀 Iniciando teste do fluxo OAuth do SAEB...');

    // Configurar MinIO
    const minioService = new MinIOService();
    await minioService.initialize();
    logger.info('✅ MinIO configurado');

    // Lançar navegador
    browser = await chromium.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    logger.info('✅ Navegador lançado');

    // Navegar para a página de login
    const loginUrl = 'https://saeb-h1.pmfi.pr.gov.br/auth/signin';
    logger.info(`📍 Navegando para: ${loginUrl}`);
    
    await page.goto(loginUrl, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    logger.info('✅ Página carregada');

    // Aguardar carregamento completo
    await page.waitForTimeout(3000);
    
    // Procurar e clicar no botão "Fazer Login"
    logger.info('🔍 Procurando botão de login...');
    
    const loginButton = await page.locator('button:has-text("Fazer Login")');
    
    if (await loginButton.count() > 0) {
      logger.info('✅ Botão "Fazer Login" encontrado');
      
      // Capturar screenshot antes do clique
      await page.screenshot({ path: './saeb-before-login.png', fullPage: true });
      logger.info('📸 Screenshot antes do login salva');
      
      // Configurar listener para mudanças de URL
      let urlChanges: string[] = [page.url()];
      page.on('framenavigated', (frame) => {
        if (frame === page!.mainFrame()) {
          urlChanges.push(frame.url());
          logger.info(`🔄 Navegação detectada: ${frame.url()}`);
        }
      });
      
      // Clicar no botão de login
      logger.info('🖱️ Clicando no botão "Fazer Login"...');
      await loginButton.click();
      
      // Aguardar redirecionamento
      try {
        await page.waitForNavigation({ timeout: 15000 });
        logger.info('✅ Redirecionamento detectado');
      } catch (e) {
        logger.warn('⚠️ Timeout aguardando navegação, verificando URL atual...');
      }
      
      const currentUrl = page.url();
      logger.info(`📍 URL atual: ${currentUrl}`);
      
      // Aguardar um pouco mais para carregamento completo
      await page.waitForTimeout(5000);
      
      // Capturar screenshot após o clique
      await page.screenshot({ path: './saeb-after-login-click.png', fullPage: true });
      logger.info('📸 Screenshot após clique salva');
      
      // Verificar se chegamos a uma página de autenticação
      const pageContent = await page.content();
      const pageTitle = await page.title();
      
      logger.info(`📄 Título da página atual: ${pageTitle}`);
      logger.info(`🔗 Histórico de URLs: ${JSON.stringify(urlChanges, null, 2)}`);
      
      // Verificar se há campos de login na nova página
      const hasUsernameField = await page.locator('input[name="username"], input[name="email"], input[name="login"], input[type="text"]').count() > 0;
      const hasPasswordField = await page.locator('input[type="password"]').count() > 0;
      
      if (hasUsernameField && hasPasswordField) {
        logger.info('🔐 Campos de autenticação encontrados na nova página!');
        
        // Tentar preencher credenciais
        const usernameField = page.locator('input[name="username"], input[name="email"], input[name="login"], input[type="text"]').first();
        const passwordField = page.locator('input[type="password"]').first();
        
        await usernameField.fill('admin');
        await passwordField.fill('admin123');
        logger.info('✅ Credenciais preenchidas');
        
        // Procurar botão de submit
        const submitButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("Entrar"), button:has-text("Login"), button:has-text("Sign in")');
        
        if (await submitButton.count() > 0) {
          logger.info('🚀 Tentando fazer login...');
          
          // Capturar screenshot antes do submit
          await page.screenshot({ path: './saeb-before-submit.png', fullPage: true });
          
          await submitButton.first().click();
          
          // Aguardar resposta
          try {
            await page.waitForNavigation({ timeout: 15000 });
            logger.info('✅ Login submetido com sucesso!');
          } catch (e) {
            logger.warn('⚠️ Timeout após submit, verificando resultado...');
          }
          
          const finalUrl = page.url();
          const finalTitle = await page.title();
          
          logger.info(`📍 URL final: ${finalUrl}`);
          logger.info(`📄 Título final: ${finalTitle}`);
          
          // Capturar screenshot final
          await page.screenshot({ path: './saeb-final-result.png', fullPage: true });
          logger.info('📸 Screenshot final salva');
          
          // Verificar se o login foi bem-sucedido
          if (finalUrl !== currentUrl && !finalUrl.includes('signin') && !finalUrl.includes('login')) {
            logger.info('🎉 Login aparentemente bem-sucedido!');
            
            // Usar SmartCrawler para analisar a página pós-login
            logger.info('🔍 Analisando página pós-login com SmartCrawler...');
            const analysis = await SmartCrawler.analyzeSinglePage(
              browser, 
              finalUrl, 
              {
                maxPages: 1,
                timeout: 30000
              }
            );
            
            logger.info('📊 Análise da página pós-login:');
            console.log(JSON.stringify(analysis, null, 2));
            
          } else {
            logger.warn('⚠️ Login pode ter falhado - ainda na página de autenticação');
            
            // Verificar se há mensagens de erro
            const errorMessages = await page.locator('text=/erro|error|inválido|invalid|incorreto|incorrect/i').allTextContents();
            if (errorMessages.length > 0) {
              logger.error(`❌ Mensagens de erro encontradas: ${JSON.stringify(errorMessages)}`);
            }
          }
          
        } else {
          logger.warn('⚠️ Botão de submit não encontrado na página de autenticação');
        }
        
      } else {
        logger.info('ℹ️ Não foram encontrados campos de autenticação tradicionais');
        logger.info('🔍 Analisando conteúdo da página atual...');
        
        // Analisar a página atual com SmartCrawler
        const analysis = await SmartCrawler.analyzeSinglePage(
          browser, 
          currentUrl, 
          {
            maxPages: 1,
            timeout: 30000
          }
        );
        
        logger.info('📊 Análise da página atual:');
        console.log(JSON.stringify(analysis, null, 2));
      }
      
    } else {
      logger.error('❌ Botão "Fazer Login" não encontrado');
    }
    
    // Aguardar para observação manual
    logger.info('⏳ Aguardando 10 segundos para observação...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    logger.error(`❌ Erro durante o teste: ${error instanceof Error ? error.message : String(error)}`);
    console.error('Stack trace:', error);
  } finally {
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
    logger.info('🏁 Teste finalizado');
  }
}

// Executar o teste
testSaebOAuthFlow().catch(console.error);