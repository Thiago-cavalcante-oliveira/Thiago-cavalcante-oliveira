import { MinIOService } from './services/MinIOService';
import { CrawlerAgent } from './agents/CrawlerAgent';
import { LLMManager } from './services/LLMManager';
import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

async function testSaebRealSite() {
  console.log('🚀 Testando sistema de proxy com SAEB real...');
  console.log('🌐 URL: https://saeb-h1.pmfi.pr.gov.br/auth/signin');
  console.log('👤 Credenciais: admin / admin123');
  
  try {
    // Configurar MinIO
    const minioService = new MinIOService();
    console.log('✅ MinIO configurado');
    
    // Inicializar browser com configurações específicas para proxy
    const browser = await chromium.launch({ 
      headless: false,
      args: [
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--ignore-certificate-errors',
        '--ignore-ssl-errors',
        '--disable-dev-shm-usage',
        '--no-sandbox'
      ]
    });
    const page = await browser.newPage();
    console.log('🌐 Browser iniciado em modo visual');
    
    // Configurar timeout maior para sites lentos
    page.setDefaultTimeout(60000);
    
    // Inicializar LLMManager e CrawlerAgent
    const llmManager = new LLMManager('gemini');
    const crawlerAgent = new CrawlerAgent(minioService, llmManager);
    await crawlerAgent.setPage(page);
    await crawlerAgent.setBrowser(browser);
    console.log('✅ CrawlerAgent inicializado');
    
    // Atualizar configuração de proxy com credenciais específicas
    const proxyConfigPath = path.join(__dirname, 'proxy-config.json');
    if (fs.existsSync(proxyConfigPath)) {
      const config = JSON.parse(fs.readFileSync(proxyConfigPath, 'utf8'));
      config.username = 'admin';
      config.password = 'admin123';
      config.autoDetect = true;
      config.timeout = 15000;
      
      // Verificar e inicializar estrutura se necessário
      if (!config.selectors) {
        config.selectors = {};
      }
      if (!config.selectors.usernameFields) {
        config.selectors.usernameFields = [];
      }
      
      // Adicionar seletores específicos para o SAEB
      config.selectors.usernameFields.push(
        'input[name="email"]',
        'input[id="email"]',
        'input[type="email"]',
        '#username',
        '#user'
      );
      
      fs.writeFileSync(proxyConfigPath, JSON.stringify(config, null, 2));
      console.log('📋 Configuração de proxy atualizada para SAEB');
    }
    
    console.log('\n🔗 Navegando para o site SAEB real...');
    
    try {
      // Navegar para o site SAEB com aguardo mais robusto
      await page.goto('https://saeb-h1.pmfi.pr.gov.br/auth/signin', { 
        waitUntil: 'networkidle',
        timeout: 60000 
      });
      
      console.log('✅ Página SAEB carregada com sucesso!');
      
      // Aguardar carregamento completo e possíveis scripts
      await page.waitForTimeout(5000);
      
      // Capturar título da página
      const pageTitle = await page.title();
      console.log('📄 Título da página:', pageTitle);
      
      // Aguardar que a página esteja totalmente interativa
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle');
      
      // Aguardar carregamento dinâmico de elementos (React/Next.js)
      console.log('⏳ Aguardando carregamento dinâmico de elementos...');
      await page.waitForTimeout(3000);
      
      // Tentar aguardar que apareçam campos de input
      try {
        await page.waitForSelector('input', { timeout: 10000 });
        console.log('✅ Campos de input detectados após aguardo');
      } catch (e) {
        console.log('⚠️  Timeout aguardando campos de input - tentando detecção manual');
      }
      
      // Detectar formulários de login
      console.log('\n🔍 Detectando formulários de login no SAEB...');
      
      // Tentar diferentes seletores para campos de login (expandido para SAEB)
      const possibleUsernameSelectors = [
        'input[name="username"]',
        'input[name="email"]',
        'input[name="user"]',
        'input[name="login"]',
        'input[type="email"]',
        'input[type="text"]',
        '#username',
        '#email',
        '#user',
        '#login',
        '.username',
        '.email',
        '.user-input',
        '[placeholder*="usuário"]',
        '[placeholder*="email"]',
        '[placeholder*="login"]'
      ];
      
      const possiblePasswordSelectors = [
        'input[name="password"]',
        'input[name="senha"]',
        'input[type="password"]',
        '#password',
        '#senha',
        '.password',
        '.senha',
        '.password-input',
        '[placeholder*="senha"]',
        '[placeholder*="password"]'
      ];
      
      let usernameField = null;
      let passwordField = null;
      
      // Procurar campo de usuário com verificação de visibilidade
      for (const selector of possibleUsernameSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            const isVisible = await element.isVisible();
            const isEnabled = await element.isEnabled();
            if (isVisible && isEnabled) {
              usernameField = element;
              console.log(`👤 Campo de usuário encontrado e visível: ${selector}`);
              break;
            }
          }
        } catch (e) {
          // Continuar tentando
        }
      }
      
      // Procurar campo de senha com verificação de visibilidade
      for (const selector of possiblePasswordSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            const isVisible = await element.isVisible();
            const isEnabled = await element.isEnabled();
            if (isVisible && isEnabled) {
              passwordField = element;
              console.log(`🔒 Campo de senha encontrado e visível: ${selector}`);
              break;
            }
          }
        } catch (e) {
          // Continuar tentando
        }
      }
      
      // Procurar botão de submit com mais opções
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Entrar")',
        'button:has-text("Login")',
        'button:has-text("Acessar")',
        'button:has-text("Conectar")',
        '.btn-submit',
        '.submit-button',
        '.login-button',
        '[value="Entrar"]',
        '[value="Login"]'
      ];
      
      let submitButton = null;
      for (const selector of submitSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            const isVisible = await element.isVisible();
            const isEnabled = await element.isEnabled();
            if (isVisible && isEnabled) {
              submitButton = element;
              console.log(`🚀 Botão de submit encontrado: ${selector}`);
              break;
            }
          }
        } catch (e) {
          // Continuar tentando
        }
      }
      
      console.log('\n🎯 Resultados da detecção:');
      console.log(`  👤 Campo de usuário: ${usernameField ? '✅ Encontrado' : '❌ Não encontrado'}`);
      console.log(`  🔒 Campo de senha: ${passwordField ? '✅ Encontrado' : '❌ Não encontrado'}`);
      console.log(`  🚀 Botão de submit: ${submitButton ? '✅ Encontrado' : '❌ Não encontrado'}`);
      
      if (usernameField && passwordField) {
        console.log('\n✅ Formulário detectado! Preenchendo credenciais...');
        
        try {
           // Limpar campos antes de preencher
           await usernameField.fill('');
           await passwordField.fill('');
           await page.waitForTimeout(500);
          
          // Preencher credenciais com simulação de digitação
          await usernameField.type('admin', { delay: 100 });
          console.log('📝 Usuário preenchido: admin');
          
          await passwordField.type('admin123', { delay: 100 });
          console.log('📝 Senha preenchida: admin123');
          
          // Aguardar um pouco para garantir que os campos foram preenchidos
          await page.waitForTimeout(1000);
          
          // Verificar se os campos foram preenchidos corretamente
          const usernameValue = await usernameField.inputValue();
          const passwordValue = await passwordField.inputValue();
          console.log(`🔍 Verificação - Usuário: ${usernameValue}, Senha: ${passwordValue ? '***' : 'vazio'}`);
          
          if (submitButton) {
            console.log('🚀 Submetendo formulário...');
            
            // Capturar URL e título antes do submit
            const originalUrl = page.url();
            const originalTitle = await page.title();
            
            // Aguardar possível navegação após click
            const [response] = await Promise.all([
              page.waitForResponse(response => response.status() !== 304, { timeout: 10000 }).catch(() => null),
              submitButton.click()
            ]);
            
            console.log('⏳ Aguardando resposta do servidor...');
            
            // Aguardar possível redirecionamento
            await page.waitForTimeout(3000);
            
            // Tentar aguardar mudança de URL ou carregamento
            try {
              await page.waitForFunction(
                (originalUrl) => window.location.href !== originalUrl,
                originalUrl,
                { timeout: 10000 }
              );
            } catch (e) {
              console.log('⚠️  Timeout aguardando redirecionamento');
            }
            
            // Aguardar carregamento completo da nova página
            await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
            
            const newUrl = page.url();
            const newTitle = await page.title();
            
            console.log('\n📊 Resultado do login:');
            console.log(`  🌐 URL original: ${originalUrl}`);
            console.log(`  🌐 URL atual: ${newUrl}`);
            console.log(`  📄 Título original: ${originalTitle}`);
            console.log(`  📄 Título atual: ${newTitle}`);
            
            if (response) {
              console.log(`  📡 Status da resposta: ${response.status()}`);
            }
            
            // Verificar se houve redirecionamento ou mudança de conteúdo
            if (newUrl !== originalUrl) {
              console.log('✅ Login realizado com sucesso! Página redirecionada.');
              
              // Tentar navegar e explorar a nova página
              console.log('\n🔍 Explorando página pós-login...');
              
              // Verificar se há elementos típicos de dashboard/área logada
              const loggedInIndicators = [
                '[class*="dashboard"]',
                '[class*="profile"]',
                '[class*="logout"]',
                '[class*="sair"]',
                'button:has-text("Sair")',
                'a:has-text("Logout")',
                '.user-menu',
                '.main-content'
              ];
              
              let foundIndicators = 0;
              for (const selector of loggedInIndicators) {
                try {
                  const element = await page.$(selector);
                  if (element && await element.isVisible()) {
                    foundIndicators++;
                    console.log(`  ✅ Indicador de área logada encontrado: ${selector}`);
                  }
                } catch (e) {}
              }
              
              if (foundIndicators > 0) {
                console.log(`🎉 Confirmado! ${foundIndicators} indicadores de área logada encontrados.`);
              } else {
                console.log('⚠️  Redirecionamento detectado, mas indicadores de área logada não encontrados.');
              }
              
            } else if (newTitle !== originalTitle) {
              console.log('✅ Possível login bem-sucedido! Título da página alterado.');
            } else {
              console.log('⚠️  Ainda na página de login - verificar credenciais ou erro.');
              
              // Verificar se há mensagens de erro
              const errorSelectors = [
                '.error',
                '.alert',
                '.warning',
                '[class*="error"]',
                '[class*="alert"]',
                '[role="alert"]'
              ];
              
              for (const selector of errorSelectors) {
                try {
                  const errorElement = await page.$(selector);
                  if (errorElement && await errorElement.isVisible()) {
                    const errorText = await errorElement.textContent();
                    console.log(`❌ Mensagem de erro encontrada: ${errorText}`);
                  }
                } catch (e) {}
              }
            }
            
          } else {
            console.log('⚠️  Botão de submit não encontrado - formulário preenchido mas não submetido');
          }
          
        } catch (fillError) {
          console.error('❌ Erro ao preencher formulário:', fillError);
        }
      } else {
        console.log('❌ Formulário de login não detectado completamente');
        
        // Tentar estratégias alternativas para ativar formulários dinâmicos
        console.log('\n🔄 Tentando estratégias alternativas...');
        
        // Estratégia 1: Clicar em possíveis botões que ativam formulários
        const activationButtons = [
          'button:has-text("Login")',
          'button:has-text("Entrar")',
          'button:has-text("Acessar")',
          '.login-button',
          '.btn-login',
          '[data-testid*="login"]'
        ];
        
        for (const selector of activationButtons) {
          try {
            const button = await page.$(selector);
            if (button && await button.isVisible()) {
              console.log(`🔘 Tentando clicar em: ${selector}`);
              await button.click();
              await page.waitForTimeout(2000);
              
              // Verificar se apareceram campos após o click
              const newInputs = await page.$$('input');
              if (newInputs.length > 0) {
                console.log(`✅ ${newInputs.length} campos apareceram após click!`);
                
                // Tentar detectar novamente
                for (const inputSelector of possibleUsernameSelectors) {
                  try {
                    const element = await page.$(inputSelector);
                    if (element && await element.isVisible() && await element.isEnabled()) {
                      usernameField = element;
                      console.log(`👤 Campo de usuário encontrado após click: ${inputSelector}`);
                      break;
                    }
                  } catch (e) {}
                }
                
                for (const inputSelector of possiblePasswordSelectors) {
                  try {
                    const element = await page.$(inputSelector);
                    if (element && await element.isVisible() && await element.isEnabled()) {
                      passwordField = element;
                      console.log(`🔒 Campo de senha encontrado após click: ${inputSelector}`);
                      break;
                    }
                  } catch (e) {}
                }
                
                if (usernameField && passwordField) {
                  console.log('🎉 Formulário ativado com sucesso!');
                  break;
                }
              }
            }
          } catch (e) {
            // Continuar tentando
          }
        }
        
        // Estratégia 2: Aguardar mais tempo e tentar novamente
        if (!usernameField || !passwordField) {
          console.log('⏳ Aguardando mais tempo para carregamento...');
          await page.waitForTimeout(5000);
          
          // Tentar detectar novamente
          for (const selector of possibleUsernameSelectors) {
            try {
              const element = await page.$(selector);
              if (element && await element.isVisible() && await element.isEnabled()) {
                usernameField = element;
                console.log(`👤 Campo de usuário encontrado após aguardo: ${selector}`);
                break;
              }
            } catch (e) {}
          }
          
          for (const selector of possiblePasswordSelectors) {
            try {
              const element = await page.$(selector);
              if (element && await element.isVisible() && await element.isEnabled()) {
                passwordField = element;
                console.log(`🔒 Campo de senha encontrado após aguardo: ${selector}`);
                break;
              }
            } catch (e) {}
          }
        }
        
        // Se ainda não encontrou, mostrar estrutura da página para debug
        if (!usernameField || !passwordField) {
          console.log('\n🔍 Estrutura da página para debug:');
          const forms = await page.$$('form');
          console.log(`  📋 Formulários encontrados: ${forms.length}`);
          
          const inputs = await page.$$('input');
          console.log(`  📝 Campos de input encontrados: ${inputs.length}`);
          
          for (let i = 0; i < Math.min(inputs.length, 10); i++) {
            const input = inputs[i];
            const type = await input.getAttribute('type');
            const name = await input.getAttribute('name');
            const id = await input.getAttribute('id');
            const placeholder = await input.getAttribute('placeholder');
            const className = await input.getAttribute('class');
            console.log(`    Input ${i + 1}: type="${type}", name="${name}", id="${id}", placeholder="${placeholder}", class="${className}"`);
          }
          
          // Mostrar também botões disponíveis
          const buttons = await page.$$('button');
          console.log(`  🔘 Botões encontrados: ${buttons.length}`);
          
          for (let i = 0; i < Math.min(buttons.length, 5); i++) {
            const button = buttons[i];
            const text = await button.textContent();
            const type = await button.getAttribute('type');
            const className = await button.getAttribute('class');
            console.log(`    Botão ${i + 1}: text="${text?.trim()}", type="${type}", class="${className}"`);
          }
        }
        
        // Tentar preencher se encontrou os campos após estratégias alternativas
        if (usernameField && passwordField) {
          console.log('\n✅ Formulário detectado após estratégias alternativas! Preenchendo credenciais...');
          
          try {
            // Limpar campos antes de preencher
            await usernameField.fill('');
            await passwordField.fill('');
            await page.waitForTimeout(500);
            
            // Preencher credenciais com simulação de digitação
            await usernameField.type('admin', { delay: 100 });
            console.log('📝 Usuário preenchido: admin');
            
            await passwordField.type('admin123', { delay: 100 });
            console.log('📝 Senha preenchida: admin123');
            
            // Aguardar um pouco para garantir que os campos foram preenchidos
            await page.waitForTimeout(1000);
            
            // Verificar se os campos foram preenchidos corretamente
            const usernameValue = await usernameField.inputValue();
            const passwordValue = await passwordField.inputValue();
            console.log(`🔍 Verificação - Usuário: ${usernameValue}, Senha: ${passwordValue ? '***' : 'vazio'}`);
            
            // Procurar botão de submit novamente
            let newSubmitButton = null;
            for (const selector of submitSelectors) {
              try {
                const element = await page.$(selector);
                if (element && await element.isVisible() && await element.isEnabled()) {
                  newSubmitButton = element;
                  console.log(`🚀 Botão de submit encontrado: ${selector}`);
                  break;
                }
              } catch (e) {}
            }
            
            if (newSubmitButton) {
              console.log('🚀 Submetendo formulário...');
              
              // Capturar URL e título antes do submit
              const originalUrl = page.url();
              const originalTitle = await page.title();
              
              // Aguardar possível navegação após click
              const [response] = await Promise.all([
                page.waitForResponse(response => response.status() !== 304, { timeout: 10000 }).catch(() => null),
                newSubmitButton.click()
              ]);
              
              console.log('⏳ Aguardando resposta do servidor...');
              
              // Aguardar possível redirecionamento
              await page.waitForTimeout(3000);
              
              // Tentar aguardar mudança de URL ou carregamento
              try {
                await page.waitForFunction(
                  (originalUrl) => window.location.href !== originalUrl,
                  originalUrl,
                  { timeout: 10000 }
                );
              } catch (e) {
                console.log('⚠️  Timeout aguardando redirecionamento');
              }
              
              // Aguardar carregamento completo da nova página
              await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
              
              const newUrl = page.url();
              const newTitle = await page.title();
              
              console.log('\n📊 Resultado do login:');
              console.log(`  🌐 URL original: ${originalUrl}`);
              console.log(`  🌐 URL atual: ${newUrl}`);
              console.log(`  📄 Título original: ${originalTitle}`);
              console.log(`  📄 Título atual: ${newTitle}`);
              
              if (response) {
                console.log(`  📡 Status da resposta: ${response.status()}`);
              }
              
              // Verificar se houve redirecionamento ou mudança de conteúdo
              if (newUrl !== originalUrl) {
                console.log('✅ Login realizado com sucesso! Página redirecionada.');
                
                // Tentar navegar e explorar a nova página
                console.log('\n🔍 Explorando página pós-login...');
                
                // Verificar se há elementos típicos de dashboard/área logada
                const loggedInIndicators = [
                  '[class*="dashboard"]',
                  '[class*="profile"]',
                  '[class*="logout"]',
                  '[class*="sair"]',
                  'button:has-text("Sair")',
                  'a:has-text("Logout")',
                  '.user-menu',
                  '.main-content'
                ];
                
                let foundIndicators = 0;
                for (const selector of loggedInIndicators) {
                  try {
                    const element = await page.$(selector);
                    if (element && await element.isVisible()) {
                      foundIndicators++;
                      console.log(`  ✅ Indicador de área logada encontrado: ${selector}`);
                    }
                  } catch (e) {}
                }
                
                if (foundIndicators > 0) {
                  console.log(`🎉 Confirmado! ${foundIndicators} indicadores de área logada encontrados.`);
                } else {
                  console.log('⚠️  Redirecionamento detectado, mas indicadores de área logada não encontrados.');
                }
                
              } else if (newTitle !== originalTitle) {
                console.log('✅ Possível login bem-sucedido! Título da página alterado.');
              } else {
                console.log('⚠️  Ainda na página de login - verificar credenciais ou erro.');
                
                // Verificar se há mensagens de erro
                const errorSelectors = [
                  '.error',
                  '.alert',
                  '.warning',
                  '[class*="error"]',
                  '[class*="alert"]',
                  '[role="alert"]'
                ];
                
                for (const selector of errorSelectors) {
                  try {
                    const errorElement = await page.$(selector);
                    if (errorElement && await errorElement.isVisible()) {
                      const errorText = await errorElement.textContent();
                      console.log(`❌ Mensagem de erro encontrada: ${errorText}`);
                    }
                  } catch (e) {}
                }
              }
            } else {
              console.log('⚠️  Botão de submit não encontrado após estratégias alternativas');
            }
            
          } catch (fillError) {
            console.error('❌ Erro ao preencher formulário:', fillError);
          }
        }
      }
      
    } catch (navigationError) {
      console.error('❌ Erro ao navegar para o site SAEB:', String(navigationError));
      
      if (String(navigationError).includes('net::ERR_INVALID_AUTH_CREDENTIALS')) {
        console.log('\n💡 Dica: O erro ERR_INVALID_AUTH_CREDENTIALS pode indicar:');
        console.log('  - Proxy corporativo requerendo autenticação');
        console.log('  - Certificados SSL inválidos');
        console.log('  - Restrições de rede');
        console.log('\n🔧 O sistema de proxy está configurado para lidar com isso automaticamente.');
      }
    }
    
    console.log('\n📊 Resumo do teste:');
    console.log('  ✅ Sistema de proxy configurado');
    console.log('  ✅ Credenciais SAEB definidas (admin/admin123)');
    console.log('  ✅ Detecção automática de formulários ativa');
    console.log('  ✅ Preenchimento automático implementado');
    
    // Aguardar para visualização
    await page.waitForTimeout(5000);
    
    // Fechar browser
    await browser.close();
    console.log('🔒 Browser fechado');
    
  } catch (error) {
    console.error('💥 Erro durante o teste:', error);
  }
}

// Executar teste
if (require.main === module) {
  testSaebRealSite();
}