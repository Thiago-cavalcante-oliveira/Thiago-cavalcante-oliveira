import { chromium } from 'playwright';

async function testSaebLogin() {
  console.log('🚀 Iniciando teste simples de login SAEB...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navegar para a página de login
    console.log('📍 Navegando para:', 'https://saeb-h1.pmfi.pr.gov.br/auth/signin');
    await page.goto('https://saeb-h1.pmfi.pr.gov.br/auth/signin', { waitUntil: 'networkidle' });
    
    // Aguardar a página carregar completamente (Next.js pode demorar)
    await page.waitForTimeout(8000);
    
    // Verificar se há conteúdo na página
    const bodyContent = await page.textContent('body');
    console.log('📝 Conteúdo da página (primeiros 200 chars):', bodyContent?.substring(0, 200));
    
    // Verificar se há elementos carregando
    const loadingElements = await page.$$('[class*="loading"], [class*="spinner"]');
    if (loadingElements.length > 0) {
      console.log('⏳ Elementos de loading encontrados, aguardando mais...');
      await page.waitForTimeout(5000);
    }
    
    // Capturar screenshot da página inicial
    await page.screenshot({ path: 'login-page-initial.png', fullPage: true });
    console.log('📸 Screenshot capturado: login-page-initial.png');
    
    // Verificar se a página carregou corretamente
    const title = await page.title();
    console.log('📄 Título da página:', title);
    
    // Aguardar elementos aparecerem (aplicação React/Next.js)
    console.log('⏳ Aguardando elementos da aplicação carregarem...');
    
    try {
      // Aguardar qualquer input aparecer
      await page.waitForSelector('input', { timeout: 10000 });
      console.log('✅ Inputs detectados!');
    } catch (error) {
      console.log('❌ Timeout aguardando inputs. Verificando se há divs ou outros elementos...');
      
      // Verificar se há divs com conteúdo
      const allDivs = await page.$$eval('div', divs => 
        divs.map(div => ({
          className: div.className,
          id: div.id,
          textContent: div.textContent?.substring(0, 50)
        })).filter(div => div.textContent && div.textContent.trim().length > 0)
      );
      
      console.log('📋 Divs com conteúdo encontradas:', JSON.stringify(allDivs.slice(0, 5), null, 2));
    }
    
    // Procurar campos de login
    const usernameField = await page.$('input[type="text"], input[type="email"], input[name*="user"], input[name*="login"]');
    const passwordField = await page.$('input[type="password"]');
    
    if (!usernameField) {
      console.log('❌ Campo de usuário não encontrado');
      // Listar todos os inputs disponíveis
      const inputs = await page.$$eval('input', inputs => 
        inputs.map(input => ({
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
          className: input.className
        }))
      );
      console.log('📋 Inputs encontrados:', JSON.stringify(inputs, null, 2));
    } else {
      console.log('✅ Campo de usuário encontrado');
    }
    
    if (!passwordField) {
      console.log('❌ Campo de senha não encontrado');
    } else {
      console.log('✅ Campo de senha encontrado');
    }
    
    if (usernameField && passwordField) {
      console.log('🔐 Tentando fazer login com admin/admin123...');
      
      // Preencher credenciais
      await usernameField.fill('admin');
      await page.waitForTimeout(500);
      
      await passwordField.fill('admin123');
      await page.waitForTimeout(500);
      
      // Procurar botão de submit
      const submitButton = await page.$('button[type="submit"], input[type="submit"], button');
      
      if (submitButton) {
        console.log('🔘 Botão de submit encontrado, clicando...');
        await submitButton.click();
      } else {
        console.log('🔘 Botão não encontrado, pressionando Enter...');
        await passwordField.press('Enter');
      }
      
      // Aguardar resposta
      await page.waitForTimeout(5000);
      
      // Capturar screenshot após login
      await page.screenshot({ path: 'login-page-after.png', fullPage: true });
      console.log('📸 Screenshot pós-login capturado: login-page-after.png');
      
      // Verificar URL atual
      const currentUrl = page.url();
      console.log('🌐 URL atual:', currentUrl);
      
      // Verificar se ainda há campos de senha (indicativo de falha)
      const stillHasPassword = await page.$('input[type="password"]');
      
      if (stillHasPassword) {
        console.log('❌ Login falhou - ainda na página de login');
        
        // Procurar mensagens de erro
        const errorMessages = await page.$$eval(
          '[class*="error"], [class*="invalid"], [class*="fail"], .alert-danger, .alert',
          elements => elements.map(el => el.textContent?.trim()).filter(text => text)
        );
        
        if (errorMessages.length > 0) {
          console.log('🚨 Mensagens de erro encontradas:', errorMessages);
        }
      } else {
        console.log('✅ Login bem-sucedido - redirecionado para área logada');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await browser.close();
    console.log('🏁 Teste finalizado');
  }
}

// Executar o teste
testSaebLogin().catch(console.error);