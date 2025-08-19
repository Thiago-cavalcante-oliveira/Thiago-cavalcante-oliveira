const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configurações do teste
const config = {
    url: 'https://saeb-h1.pmfi.pr.gov.br/auth/signin',
    username: 'admin',
    password: 'admin123',
    timeout: 30000,
    maxPages: 50,
    maxDepth: 5,
    waitTime: 2000,
    screenshotDelay: 1000
};

// Dados do crawling
const crawlingData = {
    timestamp: new Date().toISOString(),
    testInfo: {
        url: config.url,
        username: config.username,
        testType: 'Fluxo Normal - Captura Completa',
        maxPages: config.maxPages,
        maxDepth: config.maxDepth
    },
    loginProcess: {
        attempted: false,
        successful: false,
        method: 'automatic',
        errors: []
    },
    visitedUrls: new Set(),
    pagesData: [],
    navigationRoutes: [],
    summary: {
        totalPages: 0,
        totalClicks: 0,
        totalErrors: 0,
        screenshotsCaptured: 0
    }
};

// Função para aguardar
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para capturar screenshot
async function captureScreenshot(page, name, description = '') {
    try {
        const filename = `saeb-fluxo-${name}.png`;
        await page.screenshot({ 
            path: filename, 
            fullPage: true,
            timeout: 10000
        });
        crawlingData.summary.screenshotsCaptured++;
        console.log(`📸 Screenshot capturado: ${filename} - ${description}`);
        return filename;
    } catch (error) {
        console.error(`❌ Erro ao capturar screenshot ${name}:`, error.message);
        return null;
    }
}

// Função para analisar elementos da página
async function analyzePageElements(page) {
    try {
        const elements = await page.evaluate(() => {
            const result = {
                inputs: [],
                buttons: [],
                links: [],
                forms: [],
                menus: [],
                tables: []
            };

            // Inputs
            document.querySelectorAll('input').forEach((input, index) => {
                result.inputs.push({
                    type: input.type,
                    name: input.name || '',
                    id: input.id || '',
                    placeholder: input.placeholder || '',
                    selector: `input:nth-child(${index + 1})`
                });
            });

            // Botões
            document.querySelectorAll('button, input[type="submit"], input[type="button"]').forEach((btn, index) => {
                result.buttons.push({
                    text: btn.textContent?.trim() || btn.value || '',
                    type: btn.type || 'button',
                    id: btn.id || '',
                    className: btn.className || '',
                    selector: btn.tagName === 'BUTTON' ? `button:nth-child(${index + 1})` : `input[type="${btn.type}"]:nth-child(${index + 1})`
                });
            });

            // Links
            document.querySelectorAll('a[href]').forEach((link, index) => {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                    result.links.push({
                        text: link.textContent?.trim() || '',
                        href: href,
                        id: link.id || '',
                        className: link.className || '',
                        selector: `a:nth-child(${index + 1})`
                    });
                }
            });

            // Formulários
            document.querySelectorAll('form').forEach((form, index) => {
                result.forms.push({
                    action: form.action || '',
                    method: form.method || 'get',
                    id: form.id || '',
                    className: form.className || '',
                    selector: `form:nth-child(${index + 1})`
                });
            });

            // Menus (nav, ul com links)
            document.querySelectorAll('nav, ul.menu, .navbar, .nav').forEach((menu, index) => {
                const menuLinks = menu.querySelectorAll('a[href]');
                if (menuLinks.length > 0) {
                    result.menus.push({
                        type: menu.tagName.toLowerCase(),
                        id: menu.id || '',
                        className: menu.className || '',
                        linksCount: menuLinks.length,
                        selector: `${menu.tagName.toLowerCase()}:nth-child(${index + 1})`
                    });
                }
            });

            // Tabelas
            document.querySelectorAll('table').forEach((table, index) => {
                result.tables.push({
                    id: table.id || '',
                    className: table.className || '',
                    rowsCount: table.querySelectorAll('tr').length,
                    columnsCount: table.querySelectorAll('th, td').length,
                    selector: `table:nth-child(${index + 1})`
                });
            });

            return result;
        });

        return elements;
    } catch (error) {
        console.error('❌ Erro ao analisar elementos da página:', error.message);
        return {
            inputs: [],
            buttons: [],
            links: [],
            forms: [],
            menus: [],
            tables: []
        };
    }
}

// Função para descobrir rotas de navegação
async function discoverNavigationRoutes(page) {
    try {
        const routes = await page.evaluate(() => {
            const navigationRoutes = [];

            // Links de navegação principal
            document.querySelectorAll('nav a[href], .navbar a[href], .menu a[href], .nav a[href]').forEach(link => {
                const href = link.getAttribute('href');
                const text = link.textContent?.trim();
                if (href && text && !href.startsWith('#') && !href.startsWith('javascript:')) {
                    navigationRoutes.push({
                        type: 'menu_link',
                        text: text,
                        href: href,
                        priority: 'high',
                        selector: `a[href="${href}"]`
                    });
                }
            });

            // Botões de ação principais
            document.querySelectorAll('button, input[type="submit"]').forEach((btn, index) => {
                const text = btn.textContent?.trim() || btn.value || '';
                if (text && !text.toLowerCase().includes('cancel') && !text.toLowerCase().includes('close')) {
                    navigationRoutes.push({
                        type: 'action_button',
                        text: text,
                        priority: 'medium',
                        selector: btn.tagName === 'BUTTON' ? `button:nth-of-type(${index + 1})` : `input[type="submit"]:nth-of-type(${index + 1})`
                    });
                }
            });

            // Links gerais (menor prioridade)
            document.querySelectorAll('a[href]').forEach(link => {
                const href = link.getAttribute('href');
                const text = link.textContent?.trim();
                if (href && text && !href.startsWith('#') && !href.startsWith('javascript:') && 
                    !navigationRoutes.some(route => route.href === href)) {
                    navigationRoutes.push({
                        type: 'general_link',
                        text: text,
                        href: href,
                        priority: 'low',
                        selector: `a[href="${href}"]`
                    });
                }
            });

            return navigationRoutes;
        });

        return routes;
    } catch (error) {
        console.error('❌ Erro ao descobrir rotas:', error.message);
        return [];
    }
}

// Função para realizar login inteligente
async function performSmartLogin(page) {
    try {
        console.log('🔐 Iniciando processo de login...');
        crawlingData.loginProcess.attempted = true;

        // Aguardar a página carregar
        await page.waitForLoadState('networkidle', { timeout: config.timeout });
        await sleep(config.waitTime);

        // Capturar screenshot inicial
        await captureScreenshot(page, '01-inicial', 'Página inicial antes do login');

        // Procurar campos de login
        const loginFields = await page.evaluate(() => {
            const usernameField = document.querySelector('input[type="text"], input[type="email"], input[name*="user"], input[id*="user"], input[placeholder*="user"]');
            const passwordField = document.querySelector('input[type="password"]');
            
            // Procurar botão de submit de forma mais robusta
            let submitButton = document.querySelector('button[type="submit"], input[type="submit"]');
            if (!submitButton) {
                // Procurar por texto nos botões
                const buttons = document.querySelectorAll('button');
                for (const btn of buttons) {
                    const text = btn.textContent?.toLowerCase() || '';
                    if (text.includes('sign') || text.includes('login') || text.includes('entrar') || text.includes('submit')) {
                        submitButton = btn;
                        break;
                    }
                }
            }
            
            return {
                username: usernameField ? true : false,
                password: passwordField ? true : false,
                submit: submitButton ? true : false,
                usernameSelector: usernameField ? 'input[type="text"], input[type="email"], input[name*="user"], input[id*="user"], input[placeholder*="user"]' : null,
                passwordSelector: passwordField ? 'input[type="password"]' : null,
                submitSelector: submitButton ? (submitButton.type === 'submit' ? 'button[type="submit"], input[type="submit"]' : 'button') : null
            };
        });

        if (loginFields.username && loginFields.password) {
            // Preencher campos de login
            await page.fill(loginFields.usernameSelector, config.username);
            await sleep(500);
            await page.fill(loginFields.passwordSelector, config.password);
            await sleep(500);

            // Clicar no botão de login
            if (loginFields.submit && loginFields.submitSelector) {
                await page.click(loginFields.submitSelector);
                console.log('✅ Credenciais preenchidas e botão de login clicado');
            }

            // Aguardar navegação
            await page.waitForLoadState('networkidle', { timeout: config.timeout });
            await sleep(config.waitTime);

            // Verificar se o login foi bem-sucedido
            const currentUrl = page.url();
            if (currentUrl !== config.url && !currentUrl.includes('signin') && !currentUrl.includes('login')) {
                crawlingData.loginProcess.successful = true;
                console.log('✅ Login realizado com sucesso!');
                await captureScreenshot(page, '02-logado', 'Página após login bem-sucedido');
                return true;
            }
        }

        console.log('❌ Não foi possível realizar o login automaticamente');
        return false;
    } catch (error) {
        console.error('❌ Erro durante o login:', error.message);
        crawlingData.loginProcess.errors.push(error.message);
        return false;
    }
}

// Função principal de navegação
async function navigateAndCapture(page, depth = 0, visitedUrls = new Set()) {
    if (depth >= config.maxDepth || crawlingData.pagesData.length >= config.maxPages) {
        return;
    }

    try {
        const currentUrl = page.url();
        
        // Evitar URLs já visitadas
        if (visitedUrls.has(currentUrl)) {
            return;
        }
        
        visitedUrls.add(currentUrl);
        crawlingData.visitedUrls.add(currentUrl);
        
        console.log(`📄 Analisando página (profundidade ${depth}): ${currentUrl}`);
        
        // Aguardar carregamento
        await page.waitForLoadState('networkidle', { timeout: config.timeout });
        await sleep(config.screenshotDelay);
        
        // Capturar screenshot
        const screenshotName = `page-${crawlingData.pagesData.length + 1}-depth-${depth}`;
        await captureScreenshot(page, screenshotName, `Página ${crawlingData.pagesData.length + 1}`);
        
        // Analisar elementos da página
        const elements = await analyzePageElements(page);
        
        // Descobrir rotas de navegação
        const routes = await discoverNavigationRoutes(page);
        
        // Salvar dados da página
        const pageData = {
            url: currentUrl,
            title: await page.title(),
            depth: depth,
            timestamp: new Date().toISOString(),
            elements: elements,
            routes: routes,
            screenshot: screenshotName + '.png'
        };
        
        crawlingData.pagesData.push(pageData);
        crawlingData.navigationRoutes.push(...routes);
        
        console.log(`✅ Página analisada: ${elements.links.length} links, ${elements.buttons.length} botões, ${elements.forms.length} formulários`);
        
        // Navegar para próximas páginas (apenas links de menu com alta prioridade)
        const highPriorityRoutes = routes.filter(route => 
            route.type === 'menu_link' && 
            route.priority === 'high' &&
            route.href &&
            !route.href.startsWith('#') &&
            !route.href.startsWith('javascript:') &&
            !visitedUrls.has(new URL(route.href, currentUrl).href)
        );
        
        for (const route of highPriorityRoutes.slice(0, 3)) { // Limitar a 3 links por página
            try {
                console.log(`🔗 Navegando para: ${route.text} (${route.href})`);
                
                // Clicar no link
                await page.locator(route.selector).first().click();
                crawlingData.summary.totalClicks++;
                
                // Aguardar navegação
                await page.waitForLoadState('networkidle', { timeout: config.timeout });
                await sleep(config.waitTime);
                
                // Recursão para analisar a nova página
                await navigateAndCapture(page, depth + 1, visitedUrls);
                
                // Voltar para a página anterior
                await page.goBack();
                await page.waitForLoadState('networkidle', { timeout: config.timeout });
                await sleep(config.waitTime);
                
            } catch (error) {
                console.error(`❌ Erro ao navegar para ${route.text}:`, error.message);
                crawlingData.summary.totalErrors++;
            }
        }
        
    } catch (error) {
        console.error(`❌ Erro ao processar página:`, error.message);
        crawlingData.summary.totalErrors++;
    }
}

// Função para gerar relatório
function generateReport() {
    const report = `# Relatório de Crawling - Fluxo Normal SAEB

## Informações do Teste
- **URL Base:** ${crawlingData.testInfo.url}
- **Tipo de Teste:** ${crawlingData.testInfo.testType}
- **Data/Hora:** ${crawlingData.timestamp}
- **Usuário:** ${crawlingData.testInfo.username}
- **Páginas Máximas:** ${crawlingData.testInfo.maxPages}
- **Profundidade Máxima:** ${crawlingData.testInfo.maxDepth}

## Processo de Login
- **Tentativa de Login:** ${crawlingData.loginProcess.attempted ? 'Sim' : 'Não'}
- **Login Bem-sucedido:** ${crawlingData.loginProcess.successful ? 'Sim' : 'Não'}
- **Método:** ${crawlingData.loginProcess.method}
- **Erros:** ${crawlingData.loginProcess.errors.length > 0 ? crawlingData.loginProcess.errors.join(', ') : 'Nenhum'}

## Resumo da Navegação
- **Total de Páginas Analisadas:** ${crawlingData.pagesData.length}
- **URLs Visitadas:** ${crawlingData.visitedUrls.size}
- **Total de Cliques:** ${crawlingData.summary.totalClicks}
- **Total de Erros:** ${crawlingData.summary.totalErrors}
- **Screenshots Capturados:** ${crawlingData.summary.screenshotsCaptured}

## URLs Visitadas
${Array.from(crawlingData.visitedUrls).map(url => `- ${url}`).join('\n')}

## Análise Detalhada das Páginas

${crawlingData.pagesData.map((page, index) => `
### Página ${index + 1}: ${page.title}
- **URL:** ${page.url}
- **Profundidade:** ${page.depth}
- **Screenshot:** ${page.screenshot}
- **Elementos Encontrados:**
  - Links: ${page.elements.links.length}
  - Botões: ${page.elements.buttons.length}
  - Formulários: ${page.elements.forms.length}
  - Inputs: ${page.elements.inputs.length}
  - Menus: ${page.elements.menus.length}
  - Tabelas: ${page.elements.tables.length}

#### Links Encontrados:
${page.elements.links.map(link => `- [${link.text}](${link.href})`).join('\n')}

#### Botões Encontrados:
${page.elements.buttons.map(btn => `- ${btn.text} (${btn.type})`).join('\n')}

#### Formulários Encontrados:
${page.elements.forms.map(form => `- Ação: ${form.action}, Método: ${form.method}`).join('\n')}
`).join('\n')}

## Rotas de Navegação Descobertas
${crawlingData.navigationRoutes.map(route => `- **${route.type}:** ${route.text} (Prioridade: ${route.priority})`).join('\n')}

## Conclusões
- **Complexidade do Sistema:** ${crawlingData.pagesData.length < 10 ? 'Baixa' : crawlingData.pagesData.length < 25 ? 'Média' : 'Alta'}
- **Navegabilidade:** ${crawlingData.summary.totalErrors < 3 ? 'Boa' : 'Problemática'}
- **Cobertura:** ${crawlingData.pagesData.length} páginas mapeadas

---
*Relatório gerado automaticamente em ${new Date().toLocaleString('pt-BR')}*
`;

    return report;
}

// Função principal
async function main() {
    console.log('🚀 Iniciando teste de crawling - Fluxo Normal SAEB');
    console.log(`📋 Configurações: URL=${config.url}, Max Páginas=${config.maxPages}, Max Profundidade=${config.maxDepth}`);
    
    const browser = await chromium.launch({ 
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
        viewport: { width: 1366, height: 768 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    
    const page = await context.newPage();
    
    try {
        // Navegar para a página inicial
        console.log(`🌐 Navegando para: ${config.url}`);
        await page.goto(config.url, { waitUntil: 'networkidle', timeout: config.timeout });
        
        // Realizar login
        const loginSuccess = await performSmartLogin(page);
        
        if (loginSuccess) {
            // Iniciar navegação e captura
            console.log('🔍 Iniciando navegação e captura de páginas...');
            await navigateAndCapture(page, 0, new Set());
        } else {
            console.log('⚠️ Continuando sem login...');
            await navigateAndCapture(page, 0, new Set());
        }
        
        // Atualizar estatísticas finais
        crawlingData.summary.totalPages = crawlingData.pagesData.length;
        
        // Gerar e salvar relatório
        const report = generateReport();
        const reportFilename = 'saeb-fluxo-normal-relatorio.md';
        fs.writeFileSync(reportFilename, report, 'utf8');
        console.log(`📄 Relatório salvo: ${reportFilename}`);
        
        // Salvar dados JSON
        const jsonData = {
            ...crawlingData,
            visitedUrls: Array.from(crawlingData.visitedUrls)
        };
        const jsonFilename = 'saeb-fluxo-normal-dados.json';
        fs.writeFileSync(jsonFilename, JSON.stringify(jsonData, null, 2), 'utf8');
        console.log(`💾 Dados salvos: ${jsonFilename}`);
        
        console.log('\n✅ Teste de crawling concluído!');
        console.log(`📊 Estatísticas finais:`);
        console.log(`   - Páginas analisadas: ${crawlingData.summary.totalPages}`);
        console.log(`   - URLs visitadas: ${crawlingData.visitedUrls.size}`);
        console.log(`   - Cliques realizados: ${crawlingData.summary.totalClicks}`);
        console.log(`   - Screenshots capturados: ${crawlingData.summary.screenshotsCaptured}`);
        console.log(`   - Erros encontrados: ${crawlingData.summary.totalErrors}`);
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
    } finally {
        await browser.close();
    }
}

// Executar o teste
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main, config, crawlingData };