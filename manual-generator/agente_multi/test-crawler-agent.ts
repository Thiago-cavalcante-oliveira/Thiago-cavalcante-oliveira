import { CrawlerAgent } from './agents/CrawlerAgent';
import { TaskData, TaskResult } from './core/AgnoSCore';
import { Browser, chromium } from 'playwright';

async function testCrawlerAgent() {
    console.log('🕷️ TESTE DO CRAWLER AGENT');
    console.log('='.repeat(50));
    
    const crawlerAgent = new CrawlerAgent();
    let browser: Browser | null = null;
    
    const testUrl = 'https://saeb-h1.pmfi.pr.gov.br/';
    const credentials = {
        username: 'admin',
        password: 'admin123'
    };
    
    try {
        console.log(`🌐 Testando crawling em: ${testUrl}`);
        console.log(`👤 Usuário: ${credentials.username}`);
        
        // Inicializar o agente
        await crawlerAgent.initialize();
        
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
        
        // Fazer login primeiro (simulando o que o LoginAgent faria)
        console.log('🔐 Realizando login...');
        try {
            const usernameField = await page.$('input[type="email"], input[type="text"], input[name*="user"], input[name*="login"]');
            const passwordField = await page.$('input[type="password"]');
            
            if (usernameField && passwordField) {
                await usernameField.fill(credentials.username);
                await passwordField.fill(credentials.password);
                
                const submitButton = await page.$('button[type="submit"], input[type="submit"], button:has-text("Entrar"), button:has-text("Login")');
                if (submitButton) {
                    await submitButton.click();
                    await page.waitForTimeout(5000); // Aguardar login mais tempo
                    console.log('✅ Login realizado, explorando aplicação...');
                    
                    // Aguardar carregamento completo da página pós-login
                    await page.waitForLoadState('networkidle');
                    
                    // Tentar navegar por diferentes seções da aplicação
                    console.log('🔍 Explorando seções da aplicação...');
                    const links = await page.$$('a[href], button, [role="button"]');
                    console.log(`📋 Encontrados ${links.length} elementos navegáveis`);
                }
            }
        } catch (loginError) {
            console.log('⚠️ Login automático falhou, continuando com crawling...');
        }
        
        // Configurar página no agente
        crawlerAgent.setPage(page);
        
        const startTime = Date.now();
        
        // Criar task data para o agente com crawling mais profundo
        const taskData: TaskData = {
            id: 'test-crawler-' + Date.now(),
            type: 'start_crawl',
            data: {
                url: testUrl,
                maxDepth: 5, // Aumentar profundidade para explorar mais páginas
                enableScreenshots: true,
                followLinks: true,
                analysisMode: 'comprehensive',
                waitTime: 2000, // Aguardar mais tempo entre navegações
                exploreAllPages: true, // Explorar todas as páginas encontradas
                captureInteractions: true // Capturar interações em cada página
            },
            sender: 'test-runner',
            timestamp: new Date(),
            priority: 'high'
        };
        
        const result: TaskResult = await crawlerAgent.processTask(taskData);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log('\n📊 RESULTADO DO CRAWLING:');
        console.log('-'.repeat(30));
        console.log(`✅ Status: ${result.success ? 'SUCESSO' : 'FALHA'}`);
        console.log(`⏱️ Tempo: ${duration}ms`);
        console.log(`📝 Erro: ${result.error || 'N/A'}`);
        console.log(`⏱️ Tempo de processamento: ${result.processingTime}ms`);
        
        if (result.data) {
            console.log('\n📋 DADOS COLETADOS:');
            console.log('-'.repeat(20));
            console.log(`🌐 URL: ${result.data.url || 'N/A'}`);
            console.log(`📄 Título: ${result.data.title || 'N/A'}`);
            console.log(`🔢 Elementos encontrados: ${result.data.elements?.length || 0}`);
            console.log(`🔄 Workflows detectados: ${result.data.workflows?.length || 0}`);
            
            if (result.data.stats) {
                console.log('\n📊 ESTATÍSTICAS:');
                console.log('-'.repeat(15));
                console.log(`📱 Elementos estáticos: ${result.data.stats.staticElements || 0}`);
                console.log(`🖱️ Elementos interativos: ${result.data.stats.interactiveElements || 0}`);
                console.log(`📊 Total de elementos: ${result.data.stats.totalElements || 0}`);
            }
            
            if (result.data.elements && result.data.elements.length > 0) {
                console.log('\n🔍 PRIMEIROS 5 ELEMENTOS:');
                console.log('-'.repeat(25));
                result.data.elements.slice(0, 5).forEach((element: any, index: number) => {
                    console.log(`  ${index + 1}. ${element.type || 'unknown'}: ${element.selector || element.text?.substring(0, 50) || 'N/A'}`);
                });
            }
        }
        
        if (result.markdownReport) {
            console.log('\n📄 RELATÓRIO MARKDOWN GERADO:');
            console.log('-'.repeat(30));
            console.log(result.markdownReport.substring(0, 500) + '...');
        }
        
        console.log('\n' + '='.repeat(50));
        console.log(result.success ? '✅ CRAWLER AGENT TESTE CONCLUÍDO COM SUCESSO!' : '❌ CRAWLER AGENT TESTE FALHOU!');
        
    } catch (error: unknown) {
        console.error('❌ ERRO NO TESTE DO CRAWLER AGENT:', error);
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
        await crawlerAgent.cleanup();
        console.log('\n🧹 Recursos do CrawlerAgent liberados');
    }
}

// Executar o teste
testCrawlerAgent().catch(console.error);