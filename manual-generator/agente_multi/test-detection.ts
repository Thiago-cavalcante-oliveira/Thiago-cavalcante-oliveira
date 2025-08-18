import { chromium } from 'playwright';

async function testDetection() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🌐 Navegando para a página de login...');
    await page.goto('https://saeb-h1.pmfi.pr.gov.br/auth/signin');
    await page.waitForLoadState('networkidle');
    
    // Aguardar um pouco para garantir que a página carregou
    await page.waitForTimeout(2000);
    
    // Clicar no botão "Fazer Login" se existir
    try {
      const loginButton = await page.$('button:has-text("Fazer Login")');
      if (loginButton) {
        console.log('🎯 Clicando no botão "Fazer Login"...');
        await loginButton.click();
        await page.waitForTimeout(3000);
      }
    } catch (e) {
      console.log('ℹ️ Botão "Fazer Login" não encontrado ou não necessário');
    }
    
    console.log('🔍 Executando detecção de métodos de autenticação...');
    
    const authMethods = await page.evaluate(() => {
      // Detectar autenticação padrão
      const standardAuth = {
        available: false,
        fields: {
          required: [] as string[],
          optional: [] as string[]
        }
      };

      // Buscar formulários de login de forma mais abrangente
      const forms = document.querySelectorAll('form, [role="form"], .login-form, .signin-form, .auth-form');
      console.log(`📋 Encontrados ${forms.length} formulários`);
      
      let hasUsernameField = false;
      let hasPasswordField = false;
      
      // Se não encontrar formulários, buscar inputs diretamente
      const allInputs = forms.length > 0 ? 
        Array.from(forms).flatMap(form => Array.from(form.querySelectorAll('input'))) :
        Array.from(document.querySelectorAll('input'));
      
      console.log(`📝 Encontrados ${allInputs.length} inputs ${forms.length > 0 ? 'dentro dos formulários' : 'diretamente na página'}`);

      allInputs.forEach((input, index) => {
        const inputElement = input as HTMLInputElement;
        const name = inputElement.name || inputElement.id || inputElement.placeholder || '';
        const type = inputElement.type?.toLowerCase() || '';
        const className = inputElement.className?.toLowerCase() || '';
        const placeholder = inputElement.placeholder?.toLowerCase() || '';
        
        console.log(`Input ${index + 1}: type="${type}", name="${name}", placeholder="${placeholder}", class="${className}"`);
        
        // Detectar campos de usuário/email
        if (type === 'email' || type === 'text' || 
            name.toLowerCase().includes('user') || name.toLowerCase().includes('email') ||
            name.toLowerCase().includes('login') || placeholder.includes('email') ||
            placeholder.includes('user') || placeholder.includes('login') ||
            className.includes('user') || className.includes('email') ||
            className.includes('login')) {
          hasUsernameField = true;
          console.log(`👤 Campo de usuário detectado: ${name || type}`);
          if (inputElement.hasAttribute('required') || inputElement.required) {
            standardAuth.fields.required.push(name || 'username');
          } else {
            standardAuth.fields.optional.push(name || 'username');
          }
        }
        
        // Detectar campos de senha
        if (type === 'password' || 
            name.toLowerCase().includes('pass') || placeholder.includes('pass') ||
            className.includes('pass')) {
          hasPasswordField = true;
          console.log(`🔒 Campo de senha detectado: ${name || type}`);
          if (inputElement.hasAttribute('required') || inputElement.required) {
            standardAuth.fields.required.push(name || 'password');
          } else {
            standardAuth.fields.optional.push(name || 'password');
          }
        }
      });
      
      console.log(`Resultado da detecção: hasUsernameField=${hasUsernameField}, hasPasswordField=${hasPasswordField}`);
      
      // Considerar disponível se tiver pelo menos um campo de usuário e um de senha
      standardAuth.available = hasUsernameField && hasPasswordField;

      return {
        standardAuth,
        hasUsernameField,
        hasPasswordField,
        totalInputs: allInputs.length,
        totalForms: forms.length
      };
    });
    
    console.log('\n📊 Resultado da detecção:');
    console.log('- Formulários encontrados:', authMethods.totalForms);
    console.log('- Inputs encontrados:', authMethods.totalInputs);
    console.log('- Campo de usuário detectado:', authMethods.hasUsernameField);
    console.log('- Campo de senha detectado:', authMethods.hasPasswordField);
    console.log('- Autenticação padrão disponível:', authMethods.standardAuth.available);
    console.log('- Campos obrigatórios:', authMethods.standardAuth.fields.required);
    console.log('- Campos opcionais:', authMethods.standardAuth.fields.optional);
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await browser.close();
  }
}

testDetection();