import { chromium, Browser, Page } from 'playwright';
import { SmartCrawler } from './crawler/smartCrawler';
import { MinIOService } from './services/MinIOService';
import { logger } from './utils/logger';

async function testSaebLogin() {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    logger.info('🚀 Iniciando teste do SAEB com login...');

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

    // Aguardar elementos de login
    await page.waitForTimeout(3000);
    
    // Tentar localizar campos de login
    const usernameSelectors = [
      'input[name="username"]',
      'input[name="email"]',
      'input[name="login"]',
      'input[type="text"]',
      'input[id*="user"]',
      'input[id*="login"]'
    ];
    
    const passwordSelectors = [
      'input[name="password"]',
      'input[type="password"]',
      'input[id*="pass"]'
    ];

    let usernameField = null;
    let passwordField = null;

    // Encontrar campo de usuário
    for (const selector of usernameSelectors) {
      try {
        usernameField = await page.$(selector);
        if (usernameField) {
          logger.info(`✅ Campo de usuário encontrado: ${selector}`);
          break;
        }
      } catch (e) {
        // Continuar tentando
      }
    }

    // Encontrar campo de senha
    for (const selector of passwordSelectors) {
      try {
        passwordField = await page.$(selector);
        if (passwordField) {
          logger.info(`✅ Campo de senha encontrado: ${selector}`);
          break;
        }
      } catch (e) {
        // Continuar tentando
      }
    }

    if (!usernameField || !passwordField) {
      logger.warn('⚠️ Campos de login não encontrados automaticamente');
      logger.info('📋 Elementos disponíveis na página:');
      
      // Listar todos os inputs
      const inputs = await page.$$eval('input', elements => 
        elements.map(el => ({
          type: el.type,
          name: el.name,
          id: el.id,
          placeholder: el.placeholder,
          className: el.className
        }))
      );
      
      console.log('Inputs encontrados:', JSON.stringify(inputs, null, 2));
      
      // Tentar usar os primeiros campos de texto e senha
      const textInputs = await page.$$('input[type="text"], input:not([type])');
      const passwordInputs = await page.$$('input[type="password"]');
      
      if (textInputs.length > 0) usernameField = textInputs[0];
      if (passwordInputs.length > 0) passwordField = passwordInputs[0];
    }

    if (usernameField && passwordField) {
      logger.info('🔐 Preenchendo credenciais...');
      
      // Preencher credenciais
      await usernameField.fill('admin');
      await passwordField.fill('admin123');
      
      logger.info('✅ Credenciais preenchidas');
      
      // Procurar botão de submit
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Entrar")',
        'button:has-text("Login")',
        'button:has-text("Acessar")',
        '.btn-primary',
        '.login-btn'
      ];
      
      let submitButton = null;
      for (const selector of submitSelectors) {
        try {
          submitButton = await page.$(selector);
          if (submitButton) {
            logger.info(`✅ Botão de submit encontrado: ${selector}`);
            break;
          }
        } catch (e) {
          // Continuar tentando
        }
      }
      
      if (submitButton) {
        logger.info('🚀 Fazendo login...');
        await submitButton.click();
        
        // Aguardar navegação ou resposta
        try {
          await page.waitForNavigation({ timeout: 10000 });
          logger.info('✅ Login realizado com sucesso!');
        } catch (e) {
          logger.warn('⚠️ Navegação não detectada, verificando URL atual...');
        }
        
        const currentUrl = page.url();
        logger.info(`📍 URL atual: ${currentUrl}`);
        
        // Verificar se houve redirecionamento (indicativo de login bem-sucedido)
        if (currentUrl !== loginUrl) {
          logger.info('✅ Redirecionamento detectado - Login provavelmente bem-sucedido');
          
          logger.info('🔍 Analisando página pós-login...');
          const analysis = await SmartCrawler.analyzeSinglePage(
            browser, 
            currentUrl, 
            {
              maxPages: 5,
              timeout: 30000
            }
          );
          
          logger.info('📊 Análise da página pós-login:');
          console.log(JSON.stringify(analysis, null, 2));
          
        } else {
          logger.warn('⚠️ Nenhum redirecionamento detectado - Login pode ter falhado');
        }
        
      } else {
        logger.error('❌ Botão de submit não encontrado');
      }
      
    } else {
      logger.error('❌ Campos de login não encontrados');
    }

    // Aguardar um pouco para observar o resultado
    await page.waitForTimeout(5000);
    
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
testSaebLogin().catch(console.error);