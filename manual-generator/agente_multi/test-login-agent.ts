import { LoginAgent } from './agents/LoginAgent';
import { TaskData, TaskResult } from './core/AgnoSCore';
import { Browser, chromium } from 'playwright';

async function testLoginAgent() {
    console.log('🔐 TESTE DO LOGIN AGENT');
    console.log('='.repeat(50));
    
    const loginAgent = new LoginAgent();
    let browser: Browser | null = null;
    
    const testUrl = 'https://saeb-h1.pmfi.pr.gov.br/';
    const credentials = {
        username: 'admin',
        password: 'admin123'
    };
    
    try {
        console.log(`🌐 Testando login em: ${testUrl}`);
        console.log(`👤 Usuário: ${credentials.username}`);
        console.log(`🔑 Senha: ${'*'.repeat(credentials.password.length)}`);
        
        // Inicializar o agente
        await loginAgent.initialize();
        
        // Criar browser e página (modo visual para acompanhar as ações)
        browser = await chromium.launch({ 
            headless: false,
            slowMo: 1000, // Adiciona delay entre ações para melhor visualização
            args: ['--start-maximized'] // Inicia maximizado
        });
        const context = await browser.newContext();
        const page = await context.newPage();
        
        // Navegar para a URL de teste
        console.log(`🌐 Navegando para: ${testUrl}`);
        await page.goto(testUrl, { waitUntil: 'networkidle' });
        
        // Configurar página no agente
        loginAgent.setPage(page);
        
        const startTime = Date.now();
        
        // Criar task data para o agente
        const taskData: TaskData = {
            id: 'test-login-' + Date.now(),
            type: 'authenticate',
            data: {
                page: page, // Incluir a página no data
                credentials: {
                    ...credentials,
                    loginUrl: testUrl // Incluir a URL de login
                },
                targetUrl: testUrl,
                authConfig: {
                    type: 'basic',
                    credentials: credentials
                }
            },
            sender: 'test-runner',
            timestamp: new Date(),
            priority: 'high'
        };
        
        const result: TaskResult = await loginAgent.processTask(taskData);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('\n📊 RESULTADO DO LOGIN:');
        console.log('-'.repeat(30));
        console.log(`✅ Status: ${result.success ? 'SUCESSO' : 'FALHA'}`);
        console.log(`⏱️ Tempo: ${duration}ms`);
        console.log(`📝 Erro: ${result.error || 'N/A'}`);
        console.log(`⏱️ Tempo de processamento: ${result.processingTime}ms`);
        
        if (result.data) {
            console.log('\n📋 DADOS RETORNADOS:');
            console.log('-'.repeat(20));
            console.log(JSON.stringify(result.data, null, 2));
        }
        
        if (result.markdownReport) {
            console.log('\n📄 RELATÓRIO MARKDOWN GERADO:');
            console.log('-'.repeat(30));
            console.log(result.markdownReport.substring(0, 500) + '...');
        }
        
        console.log('\n' + '='.repeat(50));
        console.log(result.success ? '✅ LOGIN AGENT TESTE CONCLUÍDO COM SUCESSO!' : '❌ LOGIN AGENT TESTE FALHOU!');
        
    } catch (error: unknown) {
        console.error('❌ ERRO NO TESTE DO LOGIN AGENT:', error);
        console.log('\n📋 DETALHES DO ERRO:');
        console.log('-'.repeat(20));
        if (error instanceof Error) {
            console.log(`Tipo: ${error.constructor.name}`);
            console.log(`Mensagem: ${error.message}`);
            if (error.stack) {
                console.log(`Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
            }
        } else {
            console.log(`Erro desconhecido: ${String(error)}`);
        }
    } finally {
        if (browser) {
            await browser.close();
        }
        await loginAgent.cleanup();
        console.log('\n🧹 Recursos do LoginAgent liberados');
    }
}

// Executar o teste
testLoginAgent().catch(console.error);