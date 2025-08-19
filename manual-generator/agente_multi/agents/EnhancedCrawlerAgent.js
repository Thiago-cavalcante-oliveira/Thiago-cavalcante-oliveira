"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedCrawlerAgent = void 0;
const AgnoSCore_1 = require("../core/AgnoSCore");
const MinIOService_1 = require("../services/MinIOService");
const LLMManager_1 = require("../services/LLMManager");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class EnhancedCrawlerAgent extends AgnoSCore_1.BaseAgent {
    constructor(minioService, llmManager) {
        super({
            name: 'EnhancedCrawlerAgent',
            description: 'Agente de crawling melhorado com mapeamento inteligente de navegação',
            version: '2.0.0',
            capabilities: [
                {
                    name: 'navigation-mapping',
                    description: 'Mapeamento inteligente de elementos de navegação',
                    version: '1.0.0'
                },
                {
                    name: 'interactive-detection',
                    description: 'Detecção de elementos interativos',
                    version: '1.0.0'
                }
            ]
        });
        this.page = null;
        this.browser = null;
        this.homePageMap = null;
        this.userClickRequest = null;
        this.minioService = minioService || new MinIOService_1.MinIOService();
        this.llmManager = llmManager || new LLMManager_1.LLMManager();
        this.logDir = path.join(process.cwd(), 'output', 'agent_logs');
        this.logFile = path.join(this.logDir, 'enhanced-crawler-agent.log');
    }
    setPage(page) {
        this.page = page;
    }
    setBrowser(browser) {
        this.browser = browser;
    }
    async logToFile(message, stage = 'crawler') {
        try {
            await fs.mkdir(this.logDir, { recursive: true });
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] [${stage.toUpperCase()}] ${message}\n`;
            await fs.appendFile(this.logFile, logMessage);
        }
        catch (error) {
            console.error('Erro ao escrever no log:', error);
        }
    }
    async captureScreenshot(filename) {
        if (!this.page)
            return '';
        try {
            const screenshotDir = path.join(process.cwd(), 'output', 'screenshots');
            await fs.mkdir(screenshotDir, { recursive: true });
            const screenshotPath = path.join(screenshotDir, `${filename}-${Date.now()}.png`);
            await this.page.screenshot({ path: screenshotPath, fullPage: true });
            return screenshotPath;
        }
        catch (error) {
            await this.logToFile(`Erro ao capturar screenshot: ${error}`, 'error');
            return '';
        }
    }
    /**
     * Mapeia a página home após login bem-sucedido
     */
    async mapHomePage() {
        if (!this.page) {
            throw new Error('Página não disponível para mapeamento');
        }
        await this.logToFile('Iniciando mapeamento da página home');
        // Aguardar carregamento completo da página
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(3000);
        const url = this.page.url();
        const title = await this.page.title();
        await this.logToFile(`Mapeando página: ${title} (${url})`);
        // Capturar screenshot inicial
        const initialScreenshot = await this.captureScreenshot('home-page-initial');
        // 1. Detectar elementos de navegação
        const navigationElements = await this.detectNavigationElements();
        // 2. Detectar todos os elementos interativos
        const interactiveElements = await this.detectAllInteractiveElements();
        // 3. Detectar modais potenciais
        const modals = await this.detectPotentialModals();
        // 4. Analisar rotas de navegação
        const routes = await this.analyzeNavigationRoutes(navigationElements);
        // 5. Verificar se conseguimos identificar um menu principal
        const hasMainNavigation = navigationElements.some(nav => nav.confidence > 0.7);
        this.homePageMap = {
            url,
            title,
            navigationElements,
            interactiveElements,
            modals,
            routes,
            userInteractionRequired: !hasMainNavigation,
            userInstructions: !hasMainNavigation ?
                'Não foi possível identificar o menu principal automaticamente. Por favor, clique no menu de navegação principal para auxiliar na localização.' :
                undefined
        };
        await this.logToFile(`Mapeamento concluído. Navegação encontrada: ${hasMainNavigation ? 'SIM' : 'NÃO'}`);
        return this.homePageMap;
    }
    /**
     * Detecta elementos de navegação com alta precisão
     */
    async detectNavigationElements() {
        if (!this.page)
            return [];
        await this.logToFile('Detectando elementos de navegação');
        const navigationElements = await this.page.evaluate(() => {
            // Função auxiliar para gerar seletor CSS (definida como expressão para evitar problemas de transpilação)
            const generateSelectorForElement = function (element) {
                if (element.id) {
                    return '#' + element.id;
                }
                let selector = element.tagName.toLowerCase();
                if (element.className) {
                    const classes = element.className.split(' ').filter(function (c) { return c.trim(); });
                    if (classes.length > 0) {
                        selector += '.' + classes.join('.');
                    }
                }
                // Se ainda não é único, adicionar nth-child
                const parent = element.parentElement;
                if (parent) {
                    const siblings = Array.from(parent.children).filter(function (el) {
                        return el.tagName === element.tagName && el.className === element.className;
                    });
                    if (siblings.length > 1) {
                        const index = siblings.indexOf(element) + 1;
                        selector += ':nth-child(' + index + ')';
                    }
                }
                return selector;
            };
            // Seletores genéricos para elementos de navegação
            const navigationSelectors = [
                // Elementos semânticos HTML5
                'nav', 'nav a', 'nav button', 'nav li', 'nav ul',
                'header nav', 'aside nav', 'main nav',
                // Classes comuns de navegação
                '.navbar', '.navbar a', '.navbar button', '.navbar-nav',
                '.menu', '.menu a', '.menu button', '.menu-item', '.menu-list',
                '.navigation', '.nav-link', '.nav-item', '.nav-list',
                '.sidebar', '.sidebar a', '.sidebar button', '.sidebar-nav',
                // Atributos ARIA e roles
                '[role="navigation"]', '[role="menubar"]', '[role="menu"]',
                '[role="menuitem"]', '[aria-label*="menu"]', '[aria-label*="nav"]',
                // Padrões comuns de posicionamento
                '.header-menu', '.main-menu', '.primary-nav', '.secondary-nav',
                '.top-nav', '.side-nav', '.breadcrumb', '.breadcrumbs',
                '.footer-nav', '.mobile-nav', '.desktop-nav',
                // Padrões de frameworks populares
                '.nav-tabs', '.nav-pills', '.nav-justified', '.nav-stacked',
                '.navbar-brand', '.navbar-toggle', '.navbar-collapse',
                '.dropdown-menu', '.dropdown-toggle',
                // Seletores por posição e contexto
                'header a', 'header button', 'header ul li',
                'aside a', 'aside button', 'aside ul li',
                '.header a', '.header button', '.header ul li',
                '.footer a[href]', '.footer button',
                // Seletores por conteúdo comum (data attributes)
                '[data-nav]', '[data-menu]', '[data-navigation]',
                '[data-toggle="dropdown"]', '[data-toggle="collapse"]'
            ];
            const elements = [];
            navigationSelectors.forEach(selector => {
                try {
                    const foundElements = document.querySelectorAll(selector);
                    foundElements.forEach((element, index) => {
                        const rect = element.getBoundingClientRect();
                        // Verificar se o elemento é visível
                        if (rect.width > 0 && rect.height > 0) {
                            const style = window.getComputedStyle(element);
                            if (style.display !== 'none' && style.visibility !== 'hidden') {
                                const text = element.textContent?.trim() || '';
                                const href = element.href || '';
                                // Calcular score de confiança baseado em características
                                let confidence = 0;
                                // Texto indica navegação (multilíngue e genérico)
                                const navKeywords = [
                                    // Português
                                    'menu', 'início', 'home', 'principal', 'dashboard', 'painel',
                                    'relatórios', 'configurações', 'ajustes', 'perfil', 'conta',
                                    'sair', 'logout', 'entrar', 'login', 'cadastro', 'registro',
                                    'sobre', 'contato', 'ajuda', 'suporte', 'documentação',
                                    'produtos', 'serviços', 'categorias', 'buscar', 'pesquisar',
                                    // Inglês
                                    'nav', 'navigation', 'main', 'dashboard', 'panel',
                                    'reports', 'settings', 'profile', 'account', 'user',
                                    'sign out', 'sign in', 'register', 'signup',
                                    'about', 'contact', 'help', 'support', 'docs',
                                    'products', 'services', 'categories', 'search',
                                    // Espanhol
                                    'menú', 'inicio', 'principal', 'tablero', 'panel',
                                    'informes', 'configuración', 'perfil', 'cuenta',
                                    'salir', 'entrar', 'registro', 'acerca', 'contacto',
                                    'ayuda', 'soporte', 'productos', 'servicios', 'buscar'
                                ];
                                if (navKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
                                    confidence += 0.3;
                                }
                                // Posição na página (elementos no topo/lateral têm maior chance)
                                if (rect.top < 200)
                                    confidence += 0.2;
                                if (rect.left < 300 || rect.right > window.innerWidth - 300)
                                    confidence += 0.2;
                                // Tipo de elemento e contexto semântico
                                const tagName = element.tagName.toLowerCase();
                                if (tagName === 'nav')
                                    confidence += 0.4;
                                if (tagName === 'a' && element.closest('nav, .menu, .navbar, header, aside'))
                                    confidence += 0.2;
                                if (tagName === 'button' && element.closest('nav, .menu, .navbar'))
                                    confidence += 0.2;
                                // Classes indicativas de navegação
                                const navClasses = ['menu', 'nav', 'navbar', 'navigation', 'sidebar', 'breadcrumb'];
                                if (navClasses.some(cls => element.classList.contains(cls)))
                                    confidence += 0.3;
                                // Atributos ARIA
                                if (element.getAttribute('role') === 'navigation' ||
                                    element.getAttribute('role') === 'menu' ||
                                    element.getAttribute('role') === 'menuitem')
                                    confidence += 0.3;
                                // Data attributes
                                if (element.hasAttribute('data-nav') ||
                                    element.hasAttribute('data-menu') ||
                                    element.hasAttribute('data-navigation'))
                                    confidence += 0.2;
                                // Tem href (link)
                                if (href && href !== '#')
                                    confidence += 0.2;
                                // Verificar se tem submenu
                                const hasSubmenu = element.querySelector('ul, .submenu, .dropdown') !== null;
                                if (hasSubmenu)
                                    confidence += 0.1;
                                elements.push({
                                    type: element.tagName.toLowerCase() === 'nav' ? 'nav' :
                                        element.tagName.toLowerCase() === 'a' ? 'link' :
                                            element.tagName.toLowerCase() === 'button' ? 'button' : 'menu',
                                    text: text,
                                    selector: generateSelectorForElement(element),
                                    href: href || undefined,
                                    hasSubmenu: hasSubmenu,
                                    routeChange: href && href !== '#' && !href.startsWith('javascript:'),
                                    position: {
                                        x: rect.left + rect.width / 2,
                                        y: rect.top + rect.height / 2
                                    },
                                    confidence: Math.min(confidence, 1)
                                });
                            }
                        }
                    });
                }
                catch (error) {
                    console.error(`Erro ao processar seletor ${selector}:`, error);
                }
            });
            return elements;
        });
        // Filtrar elementos com confiança mínima e remover duplicatas
        const filteredElements = navigationElements
            .filter(el => el.confidence > 0.3)
            .sort((a, b) => b.confidence - a.confidence);
        await this.logToFile(`Detectados ${filteredElements.length} elementos de navegação`);
        return filteredElements;
    }
    /**
     * Detecta todos os elementos interativos da página
     */
    async detectAllInteractiveElements() {
        if (!this.page)
            return [];
        await this.logToFile('Detectando elementos interativos');
        const elements = await this.page.evaluate(() => {
            // Função auxiliar para gerar seletor CSS (definida como expressão para evitar problemas de transpilação)
            const generateSelectorForElement = function (element) {
                if (element.id) {
                    return '#' + element.id;
                }
                let selector = element.tagName.toLowerCase();
                if (element.className) {
                    const classes = element.className.split(' ').filter(function (c) { return c.trim(); });
                    if (classes.length > 0) {
                        selector += '.' + classes.join('.');
                    }
                }
                // Se ainda não é único, adicionar nth-child
                const parent = element.parentElement;
                if (parent) {
                    const siblings = Array.from(parent.children).filter(function (el) {
                        return el.tagName === element.tagName && el.className === element.className;
                    });
                    if (siblings.length > 1) {
                        const index = siblings.indexOf(element) + 1;
                        selector += ':nth-child(' + index + ')';
                    }
                }
                return selector;
            };
            const interactiveSelectors = [
                'button', 'a[href]', 'input[type="button"]', 'input[type="submit"]',
                '[onclick]', '[role="button"]', '.btn', '.button', '[data-action]',
                'select', 'input[type="checkbox"]', 'input[type="radio"]',
                'input[type="text"]', 'input[type="email"]', 'input[type="password"]',
                'textarea', 'form', '[tabindex]', '.clickable',
                '[data-testid]', '[aria-label]'
            ];
            const elements = [];
            interactiveSelectors.forEach(selector => {
                const foundElements = document.querySelectorAll(selector);
                foundElements.forEach((element) => {
                    const rect = element.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        const style = window.getComputedStyle(element);
                        if (style.display !== 'none' && style.visibility !== 'hidden') {
                            elements.push({
                                type: element.tagName.toLowerCase(),
                                text: element.textContent?.trim() || '',
                                selector: generateSelectorForElement(element),
                                attributes: {
                                    id: element.id || null,
                                    className: element.className || null,
                                    name: element.getAttribute('name') || null,
                                    href: element.href || null,
                                    onclick: element.getAttribute('onclick') || null,
                                    dataAction: element.getAttribute('data-action') || null
                                },
                                position: {
                                    x: rect.left + rect.width / 2,
                                    y: rect.top + rect.height / 2,
                                    width: rect.width,
                                    height: rect.height
                                },
                                isVisible: true
                            });
                        }
                    }
                });
            });
            return elements;
        });
        await this.logToFile(`Detectados ${elements.length} elementos interativos`);
        return elements;
    }
    /**
     * Detecta modais potenciais na página
     */
    async detectPotentialModals() {
        if (!this.page)
            return [];
        await this.logToFile('Detectando modais potenciais');
        const modals = await this.page.evaluate(() => {
            const modalTriggers = document.querySelectorAll('[data-toggle="modal"], [data-target*="modal"], .modal-trigger');
            const existingModals = document.querySelectorAll('.modal, [role="dialog"], .popup, .overlay');
            const results = [];
            // Modais já existentes
            existingModals.forEach(modal => {
                results.push({
                    trigger: 'existing',
                    content: modal.textContent?.trim().substring(0, 100) || '',
                    type: 'existing-modal'
                });
            });
            // Triggers de modais
            modalTriggers.forEach(trigger => {
                results.push({
                    trigger: trigger.textContent?.trim() || 'unknown',
                    content: trigger.getAttribute('data-target') || trigger.getAttribute('data-toggle') || '',
                    type: 'modal-trigger'
                });
            });
            return results;
        });
        await this.logToFile(`Detectados ${modals.length} modais potenciais`);
        return modals;
    }
    /**
     * Analisa rotas de navegação baseadas nos elementos encontrados
     */
    async analyzeNavigationRoutes(navigationElements) {
        const routes = [];
        navigationElements.forEach(element => {
            if (element.href && element.routeChange) {
                try {
                    const url = new URL(element.href);
                    routes.push({
                        path: url.pathname,
                        method: 'GET',
                        description: element.text || 'Navegação sem texto'
                    });
                }
                catch (error) {
                    // URL relativa ou inválida
                    if (element.href.startsWith('/')) {
                        routes.push({
                            path: element.href,
                            method: 'GET',
                            description: element.text || 'Navegação sem texto'
                        });
                    }
                }
            }
        });
        await this.logToFile(`Analisadas ${routes.length} rotas de navegação`);
        return routes;
    }
    /**
     * Solicita ao usuário para clicar no menu quando não consegue identificar automaticamente
     */
    async requestUserMenuClick() {
        if (!this.page) {
            throw new Error('Página não disponível');
        }
        await this.logToFile('Solicitando clique do usuário no menu');
        const screenshot = await this.captureScreenshot('request-user-click');
        this.userClickRequest = {
            message: `
🔍 **ASSISTÊNCIA NECESSÁRIA**

O sistema não conseguiu identificar automaticamente o menu principal de navegação da aplicação.

**Por favor, clique no menu principal** para que possamos:
- Mapear corretamente a estrutura de navegação
- Identificar todas as funcionalidades disponíveis
- Gerar um manual completo da aplicação

**Instruções:**
1. Localize o menu principal da aplicação (geralmente no topo ou lateral)
2. Clique uma vez no menu
3. Aguarde o sistema processar a interação

O sistema está aguardando sua interação...
      `,
            screenshot: screenshot,
            waitingForClick: true
        };
        return this.userClickRequest;
    }
    /**
     * Processa o clique do usuário e continua o mapeamento
     */
    async processUserClick(clickPosition) {
        if (!this.page || !this.userClickRequest) {
            throw new Error('Não há solicitação de clique pendente');
        }
        await this.logToFile(`Processando clique do usuário na posição: ${clickPosition.x}, ${clickPosition.y}`);
        try {
            // Simular clique na posição fornecida
            await this.page.mouse.click(clickPosition.x, clickPosition.y);
            await this.page.waitForTimeout(2000);
            // Capturar screenshot após o clique
            const afterClickScreenshot = await this.captureScreenshot('after-user-click');
            // Re-analisar a página após o clique
            await this.page.waitForTimeout(1000);
            const newNavigationElements = await this.detectNavigationElements();
            // Atualizar o mapa da página
            if (this.homePageMap) {
                this.homePageMap.navigationElements = [...this.homePageMap.navigationElements, ...newNavigationElements];
                this.homePageMap.userInteractionRequired = false;
                this.homePageMap.userInstructions = undefined;
            }
            this.userClickRequest.waitingForClick = false;
            this.userClickRequest.clickPosition = clickPosition;
            await this.logToFile('Clique do usuário processado com sucesso');
        }
        catch (error) {
            await this.logToFile(`Erro ao processar clique do usuário: ${error}`, 'error');
            throw error;
        }
    }
    /**
     * Executa crawling completo após mapeamento da home
     */
    async executeCompleteCrawl() {
        if (!this.homePageMap) {
            throw new Error('Mapeamento da home page deve ser executado primeiro');
        }
        await this.logToFile('Iniciando crawling completo baseado no mapeamento');
        const crawlResult = {
            pages: [],
            interactions: [],
            workflows: [],
            errors: []
        };
        // Navegar por cada rota identificada
        for (const route of this.homePageMap.routes) {
            try {
                await this.logToFile(`Navegando para rota: ${route.path}`);
                if (this.page) {
                    await this.page.goto(route.path, { waitUntil: 'networkidle' });
                    await this.page.waitForTimeout(2000);
                    // Mapear a nova página
                    const pageElements = await this.detectAllInteractiveElements();
                    const pageScreenshot = await this.captureScreenshot(`page-${route.path.replace(/[^a-zA-Z0-9]/g, '-')}`);
                    crawlResult.pages.push({
                        url: this.page.url(),
                        title: await this.page.title(),
                        elements: pageElements,
                        screenshots: [pageScreenshot],
                        metadata: {
                            timestamp: new Date(),
                            loadTime: 0,
                            elementCount: pageElements.length
                        }
                    });
                }
            }
            catch (error) {
                await this.logToFile(`Erro ao navegar para ${route.path}: ${error}`, 'error');
                crawlResult.errors.push(`Erro na rota ${route.path}: ${error}`);
            }
        }
        await this.logToFile(`Crawling completo finalizado. ${crawlResult.pages.length} páginas mapeadas`);
        return crawlResult;
    }
    /**
     * Gera relatório detalhado do mapeamento
     */
    async generateDetailedReport() {
        if (!this.homePageMap) {
            throw new Error('Nenhum mapeamento disponível para gerar relatório');
        }
        const reportPath = path.join(process.cwd(), 'output', 'enhanced-crawl-report.md');
        const report = `# Relatório de Mapeamento Inteligente da Aplicação

## Informações Gerais
- **URL:** ${this.homePageMap.url}
- **Título:** ${this.homePageMap.title}
- **Data/Hora:** ${new Date().toLocaleString('pt-BR')}
- **Interação do Usuário Necessária:** ${this.homePageMap.userInteractionRequired ? 'SIM' : 'NÃO'}

## Elementos de Navegação Identificados
${this.homePageMap.navigationElements.length > 0 ?
            this.homePageMap.navigationElements.map(nav => `- **${nav.type.toUpperCase()}:** "${nav.text}" (Confiança: ${(nav.confidence * 100).toFixed(1)}%)\n  - Seletor: \`${nav.selector}\`\n  - ${nav.href ? `Link: ${nav.href}` : 'Sem link'}\n  - ${nav.hasSubmenu ? 'Possui submenu' : 'Sem submenu'}`).join('\n\n') :
            'Nenhum elemento de navegação identificado automaticamente.'}

## Rotas de Navegação Descobertas
${this.homePageMap.routes.length > 0 ?
            this.homePageMap.routes.map(route => `- **${route.method}** \`${route.path}\` - ${route.description}`).join('\n') :
            'Nenhuma rota de navegação identificada.'}

## Elementos Interativos
- **Total de elementos:** ${this.homePageMap.interactiveElements.length}
- **Tipos encontrados:** ${[...new Set(this.homePageMap.interactiveElements.map(el => el.type))].join(', ')}

## Modais Detectados
${this.homePageMap.modals.length > 0 ?
            this.homePageMap.modals.map(modal => `- **Tipo:** ${modal.type}\n  - **Trigger:** ${modal.trigger}\n  - **Conteúdo:** ${modal.content.substring(0, 100)}...`).join('\n\n') :
            'Nenhum modal detectado.'}

${this.homePageMap.userInteractionRequired ? `
## ⚠️ Ação Necessária do Usuário
${this.homePageMap.userInstructions}

O sistema aguarda interação do usuário para completar o mapeamento da navegação.
` : ''}

## Próximos Passos
1. ${this.homePageMap.userInteractionRequired ? 'Aguardar clique do usuário no menu principal' : 'Executar crawling completo das rotas identificadas'}
2. Mapear páginas individuais
3. Documentar workflows de usuário
4. Gerar manual completo da aplicação

---
*Relatório gerado pelo Enhanced Crawler Agent v2.0*
`;
        await fs.writeFile(reportPath, report, 'utf-8');
        await this.logToFile(`Relatório detalhado salvo em: ${reportPath}`);
        return reportPath;
    }
    async processTask(task) {
        try {
            await this.logToFile(`Processando tarefa: ${task.type}`);
            switch (task.type) {
                case 'map_home':
                    const homeMap = await this.mapHomePage();
                    const reportPath = await this.generateDetailedReport();
                    return {
                        success: true,
                        data: {
                            homePageMap: homeMap,
                            reportPath: reportPath,
                            userInteractionRequired: homeMap.userInteractionRequired,
                            userInstructions: homeMap.userInstructions
                        },
                        markdownReport: homeMap.userInteractionRequired ?
                            'Mapeamento parcial concluído. Interação do usuário necessária.' :
                            'Mapeamento da home page concluído com sucesso.'
                    };
                case 'process_user_click':
                    if (task.data?.clickPosition) {
                        await this.processUserClick(task.data.clickPosition);
                        const updatedReportPath = await this.generateDetailedReport();
                        return {
                            success: true,
                            data: {
                                homePageMap: this.homePageMap,
                                reportPath: updatedReportPath
                            },
                            markdownReport: 'Clique do usuário processado. Mapeamento atualizado.'
                        };
                    }
                    throw new Error('Posição do clique não fornecida');
                case 'complete_crawl':
                    const crawlResult = await this.executeCompleteCrawl();
                    return {
                        success: true,
                        data: crawlResult,
                        markdownReport: `Crawling completo finalizado. ${crawlResult.pages.length} páginas mapeadas.`
                    };
                default:
                    throw new Error(`Tipo de tarefa não suportado: ${task.type}`);
            }
        }
        catch (error) {
            await this.logToFile(`Erro ao processar tarefa: ${error}`, 'error');
            return {
                success: false,
                data: null,
                error: `Erro: ${error}`
            };
        }
    }
    async initialize() {
        await this.logToFile('Enhanced Crawler Agent inicializado');
    }
    async cleanup() {
        await this.logToFile('Limpeza do Enhanced Crawler Agent');
        this.homePageMap = null;
        this.userClickRequest = null;
    }
    async generateMarkdownReport(taskResult) {
        if (!this.homePageMap) {
            return '# Enhanced Crawler Agent\n\nNenhum mapeamento disponível.';
        }
        return `# Enhanced Crawler Agent Report

## Home Page Mapping
- **URL:** ${this.homePageMap.url}
- **Title:** ${this.homePageMap.title}
- **Navigation Elements:** ${this.homePageMap.navigationElements.length}
- **Interactive Elements:** ${this.homePageMap.interactiveElements.length}
- **Routes Found:** ${this.homePageMap.routes.length}
- **User Interaction Required:** ${this.homePageMap.userInteractionRequired ? 'Yes' : 'No'}

## Navigation Elements
${this.homePageMap.navigationElements.map(nav => `- **${nav.type}:** "${nav.text}" (Confidence: ${(nav.confidence * 100).toFixed(1)}%)`).join('\n')}

## Routes
${this.homePageMap.routes.map(route => `- **${route.method}** \`${route.path}\` - ${route.description}`).join('\n')}
`;
    }
}
exports.EnhancedCrawlerAgent = EnhancedCrawlerAgent;
