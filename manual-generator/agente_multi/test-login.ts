import { LoginAgent } from './agents/LoginAgent';
import { chromium } from 'playwright';

async function testLogin() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const loginAgent = new LoginAgent();
  
  try {
    console.log('🚀 Iniciando teste de login...');
    console.log('URL:', 'https://saeb-h1.pmfi.pr.gov.br/auth/signin');
    console.log('Usuário:', 'admin');
    console.log('Senha:', 'admin123');
    
    // Navegar para a página de login
    await page.goto('https://saeb-h1.pmfi.pr.gov.br/auth/signin');
    
    // Aguardar a página carregar
    await page.waitForLoadState('networkidle');
    
    // Configurar página no agente
    loginAgent.setPage(page);
    
    // Executar login usando processTask
    const taskData = {
      id: 'test-login-' + Date.now(),
      type: 'authenticate',
      data: {
        url: 'https://saeb-h1.pmfi.pr.gov.br/auth/signin',
        credentials: {
          username: 'admin',
          password: 'admin123'
        }
      },
      sender: 'test-script',
      timestamp: new Date(),
      priority: 'high' as const
    };
    
    const result = await loginAgent.processTask(taskData);
    
    console.log('✅ Resultado do login:', result);
    
    if (result.success) {
      console.log('🎉 Login realizado com sucesso!');
      console.log('URL após login:', await page.url());
    } else {
      console.log('❌ Falha no login:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Erro durante o teste:', error);
  } finally {
    await browser.close();
  }
}

// Executar o teste
testLogin().catch(console.error);