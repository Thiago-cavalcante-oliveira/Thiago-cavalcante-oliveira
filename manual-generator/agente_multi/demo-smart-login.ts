import { chromium } from 'playwright';
import { SmartLoginAgent } from './agents/SmartLoginAgent';

async function demoSmartLogin() {
  console.log('🚀 Demo do SmartLoginAgent');
  console.log('==========================\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Inicializar o agente
    const loginAgent = new SmartLoginAgent();
    await loginAgent.initialize();
    loginAgent.setPage(page);
    
    console.log('✅ SmartLoginAgent inicializado');
    console.log(`📁 Diretório de saída: ${loginAgent.getOutputDir()}\n`);
    
    // Criar tarefa de teste
    const task = {
      id: 'demo-task-001',
      type: 'smart_login',
      data: {
        baseUrl: 'https://saeb-h1.pmfi.pr.gov.br/auth/signin',
        credentials: {
          username: 'admin',
          password: 'admin123'
        }
      },
      sender: 'demo',
      timestamp: new Date(),
      priority: 'medium' as const
    };
    
    console.log('🔍 Iniciando processo de login inteligente...');
    console.log(`📍 URL: ${task.data.baseUrl}`);
    console.log(`👤 Usuário: ${task.data.credentials.username}\n`);
    
    // Executar o login
    const result = await loginAgent.processTask(task);
    
    // Mostrar resultados
    console.log('\n📊 RESULTADOS:');
    console.log('===============');
    console.log(`Status: ${result.success ? '✅ Sucesso' : '❌ Falha'}`);
    console.log(`Task ID: ${result.taskId}`);
    console.log(`Timestamp: ${result.timestamp.toISOString()}`);
    
    if (result.data) {
      if (result.data.skipped) {
        console.log(`Motivo: ${result.data.reason}`);
      } else {
        console.log(`Total de etapas: ${result.data.totalSteps || 0}`);
        console.log(`URL final: ${result.data.finalUrl || 'N/A'}`);
      }
    }
    
    if (result.error) {
      console.log(`Erro: ${result.error}`);
    }
    
    // Mostrar etapas capturadas
    const steps = loginAgent.getSteps();
    if (steps.length > 0) {
      console.log('\n📸 ETAPAS CAPTURADAS:');
      console.log('=====================');
      steps.forEach((step, index) => {
        console.log(`${index + 1}. ${step.stepName}`);
        console.log(`   URL: ${step.url}`);
        console.log(`   Screenshot: ${step.screenshot.split('/').pop()}`);
        console.log(`   Timestamp: ${new Date(step.timestamp).toLocaleString()}\n`);
      });
    }
    
    // Gerar relatório markdown
    const markdownReport = await loginAgent.generateMarkdownReport(result);
    console.log('\n📝 RELATÓRIO MARKDOWN GERADO:');
    console.log('==============================');
    console.log(markdownReport);
    
    // Aguardar para visualizar
    console.log('⏳ Aguardando 5 segundos para visualizar...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('💥 Erro durante o demo:', error);
  } finally {
    await browser.close();
    console.log('\n🧹 Demo finalizado');
  }
}

// Executar demo
demoSmartLogin().catch(console.error);

export { demoSmartLogin };