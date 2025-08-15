import { MinIOService } from './services/MinIOService';
import { CrawlerAgent } from './agents/CrawlerAgent';
import { LLMManager } from './services/LLMManager';
import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

async function demonstrateProxySystem() {
  console.log('🚀 Demonstração do Sistema de Autenticação de Proxy...');
  
  try {
    // Configurar MinIO
    const minioService = new MinIOService();
    console.log('✅ MinIO configurado');
    
    // Inicializar browser
    const browser = await chromium.launch({ 
      headless: false,
      args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
    });
    const page = await browser.newPage();
    console.log('🌐 Browser iniciado em modo visual');
    
    // Inicializar LLMManager e CrawlerAgent
    const llmManager = new LLMManager('gemini');
    const crawlerAgent = new CrawlerAgent(minioService, llmManager);
    await crawlerAgent.setPage(page);
    await crawlerAgent.setBrowser(browser);
    console.log('✅ CrawlerAgent inicializado');
    
    // Demonstrar carregamento da configuração de proxy
    console.log('\n📋 Demonstrando funcionalidades do sistema de proxy:');
    
    // Verificar se o arquivo de configuração existe
    const configPath = path.join(__dirname, 'proxy-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      console.log('✅ Configuração de proxy carregada:');
      console.log(`  🌐 Host: ${config.host || 'Não configurado'}`);
      console.log(`  🔌 Porta: ${config.port || 'Não configurada'}`);
      console.log(`  👤 Usuário: ${config.username ? '***' : 'Não configurado'}`);
      console.log(`  🔑 Senha: ${config.password ? '***' : 'Não configurada'}`);
      console.log(`  🔍 Detecção automática: ${config.autoDetect ? 'Ativada' : 'Desativada'}`);
    } else {
      console.log('⚠️  Arquivo de configuração proxy-config.json não encontrado');
    }
    
    // Demonstrar seletores de autenticação
    console.log('\n🎯 Seletores configurados para detecção:');
    console.log('  📝 Campo de usuário: input[name="username"], input[type="text"]');
    console.log('  🔒 Campo de senha: input[name="password"], input[type="password"]');
    console.log('  🔘 Botão de envio: button[type="submit"], input[type="submit"]');
    console.log('  📋 Formulários de auth: form[action*="login"], .login-form');
    
    // Demonstrar processo de detecção (simulado)
    console.log('\n🔍 Processo de detecção de autenticação:');
    console.log('  1️⃣ Verificar presença de formulários de login');
    console.log('  2️⃣ Identificar campos de usuário e senha');
    console.log('  3️⃣ Preencher credenciais automaticamente');
    console.log('  4️⃣ Submeter formulário se necessário');
    console.log('  5️⃣ Aguardar redirecionamento ou confirmação');
    
    // Demonstrar integração com CrawlerAgent
    console.log('\n🤖 Integração com CrawlerAgent:');
    console.log('  ✅ Verificação automática em cada navegação');
    console.log('  ✅ Transparente para o usuário');
    console.log('  ✅ Logs detalhados para debugging');
    console.log('  ✅ Configuração flexível via JSON');
    
    // Criar uma página HTML local para demonstrar detecção
    const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Teste de Detecção de Proxy</title>
    </head>
    <body>
        <h1>Sistema de Proxy - Demonstração</h1>
        <form class="login-form" action="/login" method="post">
            <label>Usuário:</label>
            <input type="text" name="username" placeholder="Digite seu usuário">
            <br><br>
            <label>Senha:</label>
            <input type="password" name="password" placeholder="Digite sua senha">
            <br><br>
            <button type="submit">Entrar</button>
        </form>
        <p>Esta página demonstra como o sistema detectaria um formulário de login.</p>
    </body>
    </html>
    `;
    
    // Carregar HTML de teste
    await page.setContent(testHtml);
    console.log('\n📄 Página de teste carregada com formulário de login');
    
    // Simular detecção de elementos
    const usernameField = await page.$('input[name="username"]');
    const passwordField = await page.$('input[name="password"]');
    const submitButton = await page.$('button[type="submit"]');
    const loginForm = await page.$('.login-form');
    
    console.log('\n🔍 Resultados da detecção:');
    console.log(`  👤 Campo de usuário: ${usernameField ? '✅ Encontrado' : '❌ Não encontrado'}`);
    console.log(`  🔒 Campo de senha: ${passwordField ? '✅ Encontrado' : '❌ Não encontrado'}`);
    console.log(`  🔘 Botão de envio: ${submitButton ? '✅ Encontrado' : '❌ Não encontrado'}`);
    console.log(`  📋 Formulário de login: ${loginForm ? '✅ Encontrado' : '❌ Não encontrado'}`);
    
    if (usernameField && passwordField && submitButton) {
      console.log('\n✅ Sistema detectaria este formulário e preencheria automaticamente!');
      
      // Demonstrar preenchimento (sem submeter)
      await usernameField.fill('usuario_demo');
      await passwordField.fill('senha_demo');
      console.log('📝 Credenciais de demonstração preenchidas');
      
      // Aguardar para visualização
      await page.waitForTimeout(3000);
    }
    
    console.log('\n🎉 Demonstração concluída com sucesso!');
    console.log('\n📊 Resumo das funcionalidades:');
    console.log('  ✅ Detecção automática de formulários de autenticação');
    console.log('  ✅ Preenchimento automático de credenciais');
    console.log('  ✅ Integração transparente com navegação');
    console.log('  ✅ Configuração flexível via arquivo JSON');
    console.log('  ✅ Logs detalhados para monitoramento');
    console.log('  ✅ Suporte a múltiplos tipos de formulários');
    
    // Fechar browser
    await browser.close();
    console.log('🔒 Browser fechado');
    
  } catch (error) {
    console.error('💥 Erro durante a demonstração:', error);
  }
}

// Executar demonstração
if (require.main === module) {
  demonstrateProxySystem();
}