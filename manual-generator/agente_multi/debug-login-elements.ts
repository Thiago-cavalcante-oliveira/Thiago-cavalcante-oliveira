import { chromium } from 'playwright';

async function debugLoginElements() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Navegando para a página de login...');
    await page.goto('https://saeb-h1.pmfi.pr.gov.br/auth/signin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Aguardar carregamento completo
    
    console.log('📊 Analisando elementos iniciais...');
    
    // Verificar se há botão de login para clicar
    const loginButton = await page.locator('button:has-text("Fazer Login"), button:has-text("Login"), [role="button"]:has-text("Login")');
    if (await loginButton.count() > 0) {
      console.log('🔘 Encontrado botão de login, clicando...');
      await loginButton.first().click();
      await page.waitForTimeout(3000); // Aguardar formulário aparecer
    }
    
    // Tentar aguardar por elementos de formulário
    try {
      await page.waitForSelector('input[type="text"], input[type="email"], input[type="password"], input[name*="user"], input[name*="email"], input[name*="login"]', { timeout: 10000 });
      console.log('✅ Elementos de formulário detectados!');
    } catch {
      console.log('⚠️ Nenhum elemento de formulário detectado após aguardar');
    }
    
    const analysis = await page.evaluate(() => {
      const results = {
        forms: [] as any[],
        inputs: [] as any[],
        buttons: [] as any[],
        bodyText: document.body.innerText.substring(0, 1000),
        allElements: [] as any[]
      };
      
      // Analisar formulários
      const forms = document.querySelectorAll('form, [role="form"], .login-form, .signin-form, .auth-form, div[class*="form"], div[class*="login"]');
      forms.forEach((form, index) => {
        results.forms.push({
          index,
          tagName: form.tagName,
          className: form.className,
          id: form.id,
          innerHTML: form.innerHTML.substring(0, 500)
        });
      });
      
      // Analisar todos os inputs
      const inputs = document.querySelectorAll('input, [role="textbox"], [type="text"], [type="email"], [type="password"]');
      inputs.forEach((input, index) => {
        const inputElement = input as HTMLInputElement;
        results.inputs.push({
          index,
          type: inputElement.type,
          name: inputElement.name,
          id: inputElement.id,
          placeholder: inputElement.placeholder,
          className: inputElement.className,
          required: inputElement.required,
          value: inputElement.value,
          role: inputElement.getAttribute('role'),
          ariaLabel: inputElement.getAttribute('aria-label')
        });
      });
      
      // Analisar botões
      const buttons = document.querySelectorAll('button, input[type="submit"], [role="button"], a[class*="button"]');
      buttons.forEach((button, index) => {
        results.buttons.push({
          index,
          tagName: button.tagName,
          type: (button as HTMLInputElement).type,
          className: button.className,
          id: button.id,
          textContent: button.textContent?.trim(),
          innerHTML: button.innerHTML.substring(0, 200)
        });
      });
      
      // Buscar elementos que podem conter formulários (divs, etc.)
      const allDivs = document.querySelectorAll('div[class*="login"], div[class*="auth"], div[class*="signin"], div[class*="form"]');
      allDivs.forEach((div, index) => {
        results.allElements.push({
          index,
          tagName: div.tagName,
          className: div.className,
          id: div.id,
          innerHTML: div.innerHTML.substring(0, 300)
        });
      });
      
      return results;
    });
    
    console.log('\n=== ANÁLISE DOS ELEMENTOS (APÓS INTERAÇÃO) ===');
    console.log('\n📋 Formulários encontrados:', analysis.forms.length);
    analysis.forms.forEach(form => {
      console.log(`  Form ${form.index}:`, {
        tag: form.tagName,
        class: form.className,
        id: form.id
      });
      if (form.innerHTML) {
        console.log(`    HTML: ${form.innerHTML.substring(0, 200)}...`);
      }
    });
    
    console.log('\n📝 Inputs encontrados:', analysis.inputs.length);
    analysis.inputs.forEach(input => {
      console.log(`  Input ${input.index}:`, {
        type: input.type,
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
        class: input.className,
        required: input.required,
        role: input.role,
        ariaLabel: input.ariaLabel
      });
    });
    
    console.log('\n🔘 Botões encontrados:', analysis.buttons.length);
    analysis.buttons.forEach(button => {
      console.log(`  Button ${button.index}:`, {
        tag: button.tagName,
        type: button.type,
        class: button.className,
        text: button.textContent
      });
    });
    
    console.log('\n📦 Elementos relacionados a login:', analysis.allElements.length);
    analysis.allElements.forEach(element => {
      console.log(`  Element ${element.index}:`, {
        tag: element.tagName,
        class: element.className,
        id: element.id
      });
    });
    
    console.log('\n📄 Texto da página (primeiros 1000 chars):');
    console.log(analysis.bodyText);
    
    // Capturar screenshot para análise visual
    await page.screenshot({ path: 'debug-login-after-interaction.png', fullPage: true });
    console.log('\n📸 Screenshot capturado: debug-login-after-interaction.png');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await browser.close();
  }
}

debugLoginElements().catch(console.error);