import { LoginAgent } from './agents/LoginAgent';
import { CrawlerAgent } from './agents/CrawlerAgent';
import { TaskData, TaskResult } from './core/AgnoSCore';
import { Browser, chromium } from 'playwright';

async function testFullNavigation() {
    console.log('🚀 TESTE DE NAVEGAÇÃO COMPLETA');
    console.log('='.repeat(50));
    
    const loginAgent = new LoginAgent();
    const crawlerAgent = new CrawlerAgent();
    let browser: Browser | null = null;
    
    const testUrl = 'https://saeb-h1.pmfi.pr.gov.br/';
    const credentials = {
        username: 'admin',
        password: 'admin123'
    };
    
    try {
        console.log(`🌐 URL de teste: ${testUrl}`);
        console.log(`👤 Usuário: ${credentials.username}`);
        console.log(`🔑 Senha: ${'*'.repeat(credentials.password.length)}`);
        
        // Inicializar agentes
        await loginAgent.initialize();
        await crawlerAgent.initialize();
        
        // Criar browser visual
        browser = await chromium.launch({ 
            headless: false,
            slowMo: 1500, // Mais lento para melhor visualização
            args: ['--start-maximized']
        });
        const context = await browser.newContext();
        const page = await context.newPage();
        
        console.log('\n🔐 FASE 1: AUTENTICAÇÃO');
        console.log('-'.repeat(30));
        
        // Navegar para a URL
        console.log(`🌐 Navegando para: ${testUrl}`);
        await page.goto(testUrl, { waitUntil: 'networkidle' });
        
        // Executar login usando LoginAgent
        const loginTaskData: TaskData = {
            id: 'login-' + Date.now(),
            type: 'authenticate',
            data: {
                page: page,
                loginUrl: testUrl,
                credentials: credentials
            },
            sender: 'test-runner',
            timestamp: new Date(),
            priority: 'high'
        };
        
        const loginResult: TaskResult = await loginAgent.processTask(loginTaskData);
        
        if (!loginResult.success) {
            throw new Error(`Login falhou: ${loginResult.error}`);
        }
        
        console.log('✅ Login realizado com sucesso!');
        console.log(`⏱️ Tempo de login: ${loginResult.processingTime}ms`);
        
        // Aguardar carregamento completo após login
        await page.waitForTimeout(3000);
        await page.waitForLoadState('networkidle');
        
        console.log('\n🕷️ FASE 2: EXPLORAÇÃO COMPLETA');
        console.log('-'.repeat(35));
        
        // Listar todas as páginas/seções disponíveis
        console.log('🔍 Identificando seções da aplicação...');
        const navigationElements = await page.$$eval('a[href], button, [role="button"], nav a, .menu a, .sidebar a', elements => {
            return elements.map(el => ({
                text: el.textContent?.trim() || '',
                href: el.getAttribute('href') || '',
                tag: el.tagName.toLowerCase(),
                classes: el.className || ''
            })).filter(item => item.text && item.text.length > 0);
        });
        
        console.log(`📋 Encontrados ${navigationElements.length} elementos de navegação:`);
        navigationElements.slice(0, 10).forEach((el, index) => {
            console.log(`  ${index + 1}. ${el.text} (${el.tag})`);
        });
        
        // Configurar CrawlerAgent para exploração profunda
        crawlerAgent.setPage(page);
        
        const crawlTaskData: TaskData = {
            id: 'crawl-' + Date.now(),
            type: 'start_crawl',
            data: {
                url: page.url(), // URL atual após login
                maxDepth: 3,
                enableScreenshots: true,
                followLinks: true,
                analysisMode: 'comprehensive',
                waitTime: 2000,
                exploreAllPages: true,
                captureInteractions: true
            },
            sender: 'test-runner',
            timestamp: new Date(),
            priority: 'high'
        };
        
        console.log('🚀 Iniciando crawling profundo...');
        const crawlResult: TaskResult = await crawlerAgent.processTask(crawlTaskData);
        
        console.log('\n📊 RESULTADOS FINAIS');
        console.log('='.repeat(25));
        
        // Resultados do Login
        console.log('🔐 LOGIN:');
        console.log(`  ✅ Status: ${loginResult.success ? 'SUCESSO' : 'FALHA'}`);
        console.log(`  ⏱️ Tempo: ${loginResult.processingTime}ms`);
        if (loginResult.data?.loginSteps) {
            console.log(`  📸 Screenshots: ${loginResult.data.loginSteps.length}`);
        }
        
        // Resultados do Crawling
        console.log('\n🕷️ CRAWLING:');
        console.log(`  ✅ Status: ${crawlResult.success ? 'SUCESSO' : 'FALHA'}`);
        console.log(`  ⏱️ Tempo: ${crawlResult.processingTime}ms`);
        
        if (crawlResult.data) {
            console.log(`  🌐 URL final: ${crawlResult.data.url || 'N/A'}`);
            console.log(`  📄 Título: ${crawlResult.data.title || 'N/A'}`);
            console.log(`  🔢 Elementos: ${crawlResult.data.elements?.length || 0}`);
            console.log(`  🔄 Workflows: ${crawlResult.data.workflows?.length || 0}`);
            
            if (crawlResult.data.stats) {
                console.log(`  📊 Estáticos: ${crawlResult.data.stats.staticElements || 0}`);
                console.log(`  🖱️ Interativos: ${crawlResult.data.stats.interactiveElements || 0}`);
                console.log(`  📈 Total: ${crawlResult.data.stats.totalElements || 0}`);
            }
        }
        
        // Exploração manual adicional
        console.log('\n🔍 EXPLORAÇÃO MANUAL ADICIONAL');
        console.log('-'.repeat(35));
        
        // Tentar clicar em diferentes seções
        const sectionsToExplore = [
            'dashboard', 'menu', 'configurações', 'relatórios', 'usuários',
            'home', 'início', 'principal', 'admin', 'sistema'
        ];
        
        for (const section of sectionsToExplore) {
            try {
                const element = await page.$(`a:has-text("${section}"), button:has-text("${section}"), [title*="${section}"]`);
                if (element) {
                    console.log(`🔗 Explorando seção: ${section}`);
                    await element.click();
                    await page.waitForTimeout(2000);
                    await page.waitForLoadState('networkidle');
                    
                    const currentUrl = page.url();
                    const title = await page.title();
                    console.log(`  📍 URL: ${currentUrl}`);
                    console.log(`  📄 Título: ${title}`);
                    
                    // Capturar screenshot da seção
                    const screenshot = await page.screenshot({ fullPage: true });
                    console.log(`  📸 Screenshot capturado da seção ${section}`);
                    
                    // Voltar ou continuar navegação
                    await page.waitForTimeout(1000);
                }
            } catch (error) {
                console.log(`  ⚠️ Não foi possível explorar: ${section}`);
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('✅ TESTE DE NAVEGAÇÃO COMPLETA FINALIZADO!');
        console.log('📋 Verifique o navegador para ver todas as páginas exploradas');
        
        // Manter navegador aberto por mais tempo para visualização
        console.log('⏳ Mantendo navegador aberto por 30 segundos para visualização...');
        await page.waitForTimeout(30000);
        
    } catch (error: unknown) {
        console.error('❌ ERRO NO TESTE DE NAVEGAÇÃO:', error);
        if (error instanceof Error) {
            console.log(`Tipo: ${error.constructor.name}`);
            console.log(`Mensagem: ${error.message}`);
        }
    } finally {
        if (browser) {
            await browser.close();
        }
        await loginAgent.cleanup();
        await crawlerAgent.cleanup();
        console.log('\n🧹 Recursos liberados');
    }
}

// Executar o teste
testFullNavigation().catch(console.error);