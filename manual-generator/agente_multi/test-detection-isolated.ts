import { chromium } from 'playwright';
import { LoginAgent } from './agents/LoginAgent.js';
import dotenv from 'dotenv';

dotenv.config();

async function testDetectionIsolated() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🚀 Navegando para a página de login...');
    await page.goto('https://ideb.pmfi.pr.gov.br/auth/realms/IDEB_APP_REALM/protocol/openid-connect/auth?client_id=ideb-app&redirect_uri=https%3A%2F%2Fideb.pmfi.pr.gov.br%2F&state=b7b7b7b7-b7b7-b7b7-b7b7-b7b7b7b7b7b7&response_mode=fragment&response_type=code&scope=openid&nonce=b7b7b7b7-b7b7-b7b7-b7b7-b7b7b7b7b7b7');
    
    console.log('⏳ Aguardando carregamento...');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verificar se há botão inicial para clicar
    console.log('🔍 Procurando botão inicial de login...');
    const initialButtons = await page.$$eval('button, input[type="button"], input[type="submit"], a', buttons => {
      return buttons.map(btn => ({
        text: btn.textContent?.trim() || '',
        type: btn.tagName,
        visible: (btn as HTMLElement).offsetParent !== null
      })).filter(btn => btn.visible && btn.text);
    });
    
    console.log('🔘 Botões iniciais encontrados:', initialButtons);
    
    // Tentar clicar em botão de login se existir
    const loginButtonSelectors = [
      'button:has-text("Fazer Login")',
      'button:has-text("Login")',
      'button:has-text("Entrar")',
      'a:has-text("Fazer Login")',
      'a:has-text("Login")',
      'a:has-text("Entrar")'
    ];
    
    let buttonClicked = false;
    for (const selector of loginButtonSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          console.log(`✅ Clicando no botão: ${selector}`);
          await button.click();
          await page.waitForTimeout(3000);
          buttonClicked = true;
          break;
        }
      } catch (error) {
        console.log(`❌ Erro ao clicar em ${selector}:`, (error as Error).message);
      }
    }
    
    if (!buttonClicked) {
      console.log('ℹ️ Nenhum botão inicial encontrado, continuando...');
    }
    
    // Criar instância do LoginAgent apenas para usar o método detectAuthMethods
    const loginAgent = new LoginAgent();
    // Definir a página manualmente
    (loginAgent as any).page = page;
    
    console.log('🔍 Executando detectAuthMethods...');
    const authMethods = await (loginAgent as any).detectAuthMethods();
    
    console.log('📊 Resultado da detecção:');
    console.log('- Standard Auth Available:', authMethods.standardAuth.available);
    console.log('- Username Field:', authMethods.standardAuth.usernameField);
    console.log('- Password Field:', authMethods.standardAuth.passwordField);
    console.log('- OAuth Providers:', authMethods.oauthProviders.length);
    console.log('- Additional Features:', authMethods.additionalFeatures);
    
    // Verificar elementos manualmente
    console.log('\n🔍 Verificação manual de elementos:');
    const forms = await page.$$('form');
    console.log('- Formulários encontrados:', forms.length);
    
    const usernameInputs = await page.$$('input[type="text"], input[type="email"], input[name*="user"], input[id*="user"], input[placeholder*="user"], input[placeholder*="email"]');
    console.log('- Campos de usuário encontrados:', usernameInputs.length);
    
    const passwordInputs = await page.$$('input[type="password"]');
    console.log('- Campos de senha encontrados:', passwordInputs.length);
    
    const submitButtons = await page.$$('button[type="submit"], input[type="submit"], button:has-text("Sign In"), button:has-text("Login"), button:has-text("Entrar")');
    console.log('- Botões de submit encontrados:', submitButtons.length);
    
    // Capturar screenshot
    await page.screenshot({ path: 'test-detection-isolated.png', fullPage: true });
    console.log('📸 Screenshot capturado: test-detection-isolated.png');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await browser.close();
  }
}

testDetectionIsolated().catch(console.error);