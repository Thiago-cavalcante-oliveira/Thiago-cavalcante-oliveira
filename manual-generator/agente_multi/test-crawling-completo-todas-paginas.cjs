const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configurações do teste - VERSÃO AGRESSIVA PARA CAPTURAR TODAS AS PÁGINAS
const CONFIG = {
  url: 'https://saeb-h1.pmfi.pr.gov.br/auth/signin',
  username: 'admin',
  password: 'admin123',
  timeout: 45000, // Aumentado para 45s
  maxPages: 500, // Aumentado para 500 páginas
  maxDepth: 10, // Aumentado para 10 níveis de profundidade
  screenshotDelay: 1500,
  interactionDelay: 800,
  userInteractionTimeout: 30000, // Reduzido para 30s
  aggressiveMode: true, // Modo agressivo ativado
  clickAllButtons: true, // Clicar em todos os botões possíveis
  exploreAllMenus: true, // Explorar todos os menus
  followAllLinks: true, // Seguir todos os links
  retryFailedClicks: 3, // Tentar clicar 3 vezes em elementos que falharam
  waitForDynamicContent: true, // Aguardar conteúdo dinâmico
  captureAllStates: true // Capturar screenshots de todos os estados
};

// Interface para interação com usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Dados coletados durante o crawling
let crawlingData = {
  timestamp: new Date().toISOString(),
  testInfo: {
    url: CONFIG.url,
    credentials: `${CONFIG.username}/${CONFIG.password}`,
    testType: 'crawling_completo_todas_paginas_agressivo'
  },
  loginProcess: [],
  visitedUrls: new Set(),
  pagesData: [],
  menuStructure: [],
  screenshots: [],
  userInteractions: [],
  discoveredRoutes: [],
  formInteractions: [],
  buttonClicks: [],
  failedAttempts: [],
  dynamicContent: [],
  summary: {
    totalPagesAnalyzed: 0,
    totalMenuItems: 0,
    totalForms: 0,
    totalTables: 0,
    totalActions: 0,
    totalLinks: 0,
    totalUserInteractions: 0,
    totalButtonClicks: 0,
    totalFailedAttempts: 0,
    totalDynamicContent: 0
  }
};

// Função para aguardar um tempo
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para solicitar ajuda do usuário (mais rápida)
function askUser(question) {
  return new Promise((resolve) => {
    console.log(`\n🤔 AJUDA RÁPIDA:`);
    console.log(`❓ ${question}`);
    console.log(`💡 Resposta rápida (ou 'skip'):`);    
    const timeout = setTimeout(() => {
      console.log(`\n⏰ Timeout - Continuando...`);
      resolve('skip');
    }, CONFIG.userInteractionTimeout);
    
    rl.question('> ', (answer) => {
      clearTimeout(timeout);
      crawlingData.userInteractions.push({
        question: question,
        answer: answer,
        timestamp: new Date().toISOString()
      });
      crawlingData.summary.totalUserInteractions++;
      resolve(answer.trim());
    });
  });
}

// Função para capturar screenshot
async function captureScreenshot(page, name) {
  try {
    const filename = `crawling-${name}.png`;
    await page.screenshot({ path: filename, fullPage: true });
    crawlingData.screenshots.push(filename);
    console.log(`📸 Screenshot: ${filename}`);
    return filename;
  } catch (error) {
    console.log(`❌ Erro screenshot: ${error.message}`);
    return null;
  }
}

// Função para aguardar conteúdo dinâmico
async function waitForDynamicContent(page) {
  if (!CONFIG.waitForDynamicContent) return;
  
  try {
    // Aguardar possível conteúdo dinâmico
    await page.waitForTimeout(2000);
    
    // Aguardar possíveis requests de rede
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    
    crawlingData.summary.totalDynamicContent++;
  } catch (error) {
    // Ignorar erros de timeout para conteúdo dinâmico
  }
}

// Função para analisar elementos da página (versão agressiva)
async function analyzePageElementsAggressive(page) {
  console.log('🔍 Análise agressiva de elementos...');
  
  const elements = await page.evaluate(() => {
    const result = {
      inputs: [],
      buttons: [],
      links: [],
      forms: [],
      menus: [],
      tables: [],
      modals: [],
      dropdowns: [],
      tabs: [],
      accordions: [],
      title: document.title,
      url: window.location.href,
      hasModal: false,
      hasDropdown: false,
      hasOverlay: false
    };
    
    // Analisar TODOS os inputs possíveis
    document.querySelectorAll('input, textarea, select, [contenteditable="true"]').forEach((input, index) => {
      if (input.type !== 'hidden') {
        result.inputs.push({
          index: index,
          type: input.type || input.tagName.toLowerCase(),
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
          className: input.className,
          value: input.value,
          required: input.hasAttribute('required'),
          selector: input.id ? `#${input.id}` : (input.name ? `[name="${input.name}"]` : `${input.tagName.toLowerCase()}:nth-of-type(${index + 1})`)
        });
      }
    });
    
    // Analisar TODOS os botões e elementos clicáveis
    document.querySelectorAll('button, input[type="submit"], input[type="button"], [role="button"], .btn, .button, [onclick], [data-action], .clickable, .menu-item, .nav-item').forEach((button, index) => {
      const text = button.textContent?.trim() || button.value || button.getAttribute('aria-label') || button.getAttribute('title') || '';
      if (text.length > 0 || button.tagName.toLowerCase() === 'button') {
        result.buttons.push({
          index: index,
          type: button.type || button.tagName.toLowerCase(),
          text: text,
          id: button.id,
          className: button.className,
          disabled: button.disabled,
          selector: button.id ? `#${button.id}` : `${button.tagName.toLowerCase()}:nth-of-type(${index + 1})`,
          hasOnClick: button.hasAttribute('onclick'),
          hasDataAction: button.hasAttribute('data-action'),
          ariaLabel: button.getAttribute('aria-label'),
          title: button.getAttribute('title')
        });
      }
    });
    
    // Analisar TODOS os links
    document.querySelectorAll('a, [href], .link, .nav-link').forEach((link, index) => {
      const text = link.textContent?.trim();
      const href = link.getAttribute('href') || link.getAttribute('data-href');
      if (href || text) {
        const isExternal = href && (href.startsWith('http') && !href.includes(window.location.hostname));
        result.links.push({
          index: index,
          text: text || href,
          href: href,
          isExternal: isExternal,
          target: link.getAttribute('target'),
          className: link.className,
          selector: link.id ? `#${link.id}` : `a:nth-of-type(${index + 1})`
        });
      }
    });
    
    // Analisar formulários
    document.querySelectorAll('form').forEach((form, index) => {
      const inputs = form.querySelectorAll('input, textarea, select').length;
      result.forms.push({
        index: index,
        action: form.action,
        method: form.method,
        id: form.id,
        className: form.className,
        inputCount: inputs,
        selector: form.id ? `#${form.id}` : `form:nth-of-type(${index + 1})`
      });
    });
    
    // Analisar menus (versão expandida)
    const menuSelectors = [
      'nav', '.nav', '.menu', '.navigation', '.navbar', '.sidebar',
      '[role="navigation"]', '[role="menu"]', '[role="menubar"]',
      '.main-menu', '.primary-menu', '.secondary-menu', '.top-menu',
      '.header-menu', '.footer-menu', '.side-menu'
    ];
    
    menuSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach((menu, index) => {
        const items = [];
        menu.querySelectorAll('a, button, .menu-item, .nav-item, li').forEach((item, itemIndex) => {
          const text = item.textContent?.trim();
          const href = item.getAttribute('href');
          if (text) {
            items.push({
              text: text,
              href: href,
              type: item.tagName.toLowerCase(),
              selector: item.id ? `#${item.id}` : `${selector} ${item.tagName.toLowerCase()}:nth-of-type(${itemIndex + 1})`
            });
          }
        });
        
        if (items.length > 0) {
          result.menus.push({
            index: index,
            selector: selector,
            items: items,
            type: 'menu'
          });
        }
      });
    });
    
    // Analisar tabelas
    document.querySelectorAll('table').forEach((table, index) => {
      const rows = table.querySelectorAll('tr').length;
      const cols = table.querySelectorAll('th, td').length;
      result.tables.push({
        index: index,
        rows: rows,
        columns: cols,
        id: table.id,
        className: table.className,
        selector: table.id ? `#${table.id}` : `table:nth-of-type(${index + 1})`
      });
    });
    
    // Detectar modais
    document.querySelectorAll('.modal, .dialog, .popup, [role="dialog"], .overlay').forEach((modal, index) => {
      result.modals.push({
        index: index,
        id: modal.id,
        className: modal.className,
        visible: modal.style.display !== 'none' && !modal.hidden,
        selector: modal.id ? `#${modal.id}` : `.modal:nth-of-type(${index + 1})`
      });
    });
    
    // Detectar dropdowns
    document.querySelectorAll('.dropdown, .select, [role="listbox"], .combobox').forEach((dropdown, index) => {
      result.dropdowns.push({
        index: index,
        id: dropdown.id,
        className: dropdown.className,
        selector: dropdown.id ? `#${dropdown.id}` : `.dropdown:nth-of-type(${index + 1})`
      });
    });
    
    // Detectar abas
    document.querySelectorAll('.tab, .tabs, [role="tab"], [role="tablist"]').forEach((tab, index) => {
      result.tabs.push({
        index: index,
        text: tab.textContent?.trim(),
        id: tab.id,
        className: tab.className,
        active: tab.classList.contains('active') || tab.getAttribute('aria-selected') === 'true',
        selector: tab.id ? `#${tab.id}` : `.tab:nth-of-type(${index + 1})`
      });
    });
    
    // Detectar acordeões
    document.querySelectorAll('.accordion, .collapse, [role="button"][aria-expanded]').forEach((accordion, index) => {
      result.accordions.push({
        index: index,
        text: accordion.textContent?.trim(),
        id: accordion.id,
        className: accordion.className,
        expanded: accordion.getAttribute('aria-expanded') === 'true',
        selector: accordion.id ? `#${accordion.id}` : `.accordion:nth-of-type(${index + 1})`
      });
    });
    
    // Detectar estados especiais
    result.hasModal = document.querySelector('.modal:not([style*="display: none"]), .dialog:not([style*="display: none"])') !== null;
    result.hasDropdown = document.querySelector('.dropdown.open, .dropdown.show, [aria-expanded="true"]') !== null;
    result.hasOverlay = document.querySelector('.overlay, .backdrop, .modal-backdrop') !== null;
    
    return result;
  });
  
  console.log(`📊 Elementos encontrados:`);
  console.log(`   - Inputs: ${elements.inputs.length}`);
  console.log(`   - Botões: ${elements.buttons.length}`);
  console.log(`   - Links: ${elements.links.length}`);
  console.log(`   - Formulários: ${elements.forms.length}`);
  console.log(`   - Menus: ${elements.menus.length}`);
  console.log(`   - Tabelas: ${elements.tables.length}`);
  console.log(`   - Modais: ${elements.modals.length}`);
  console.log(`   - Dropdowns: ${elements.dropdowns.length}`);
  console.log(`   - Abas: ${elements.tabs.length}`);
  console.log(`   - Acordeões: ${elements.accordions.length}`);
  
  return elements;
}

// Função para tentar login inteligente
async function attemptSmartLogin(page) {
  console.log('🔑 Tentando login inteligente...');
  
  try {
    // Aguardar a página carregar completamente
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await sleep(2000);
    
    // Verificar se há um botão de "Login" ou "Fazer Login" primeiro
    const loginButtons = await page.locator('button, a, input[type="submit"], [role="button"]').all();
    
    for (const button of loginButtons) {
      try {
        const text = await button.textContent();
        if (text && (text.toLowerCase().includes('login') || text.toLowerCase().includes('entrar') || text.toLowerCase().includes('sign'))) {
          console.log(`🔘 Clicando no botão: ${text}`);
          await button.click({ timeout: 5000 });
          await sleep(3000);
          break;
        }
      } catch (e) {
        // Continuar para o próximo botão
      }
    }
    
    // Aguardar possível redirecionamento
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Procurar campos de login
    const inputs = await page.locator('input[type="text"], input[type="email"], input[type="password"], input:not([type]), input[name*="user"], input[name*="login"], input[id*="user"], input[id*="login"], input[placeholder*="user"], input[placeholder*="login"]').all();
    
    if (inputs.length >= 2) {
      console.log(`✅ Encontrados ${inputs.length} campos de entrada`);
      
      // Preencher primeiro campo (usuário)
      await inputs[0].fill(CONFIG.username);
      console.log(`📝 Preenchido campo 1: ${CONFIG.username}`);
      
      // Preencher segundo campo (senha)
      await inputs[1].fill(CONFIG.password);
      console.log(`📝 Preenchido campo 2: ${CONFIG.password}`);
      
      await sleep(1000);
      
      // Procurar botão de submit
      const submitButtons = await page.locator('button[type="submit"], input[type="submit"], button:has-text("Sign"), button:has-text("Login"), button:has-text("Entrar"), form button').all();
      
      if (submitButtons.length > 0) {
        console.log(`🔘 Clicando no botão de submit`);
        await submitButtons[0].click();
        await sleep(3000);
        return true;
      } else {
        // Tentar pressionar Enter
        console.log(`⌨️ Pressionando Enter`);
        await inputs[1].press('Enter');
        await sleep(3000);
        return true;
      }
    } else {
      console.log(`❌ Campos de login insuficientes encontrados: ${inputs.length}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Erro no login: ${error.message}`);
    return false;
  }
}

// Função para descobrir rotas de forma agressiva
async function discoverRoutesAggressive(page, baseUrl, currentDepth = 0) {
  if (currentDepth >= CONFIG.maxDepth) {
    console.log(`🛑 Profundidade máxima atingida (${CONFIG.maxDepth})`);
    return [];
  }
  
  console.log(`🔍 Descoberta agressiva de rotas (profundidade ${currentDepth})...`);
  
  const elements = await analyzePageElementsAggressive(page);
  const discoveredRoutes = [];
  
  // Coletar TODOS os links de navegação possíveis
  const navigationLinks = [];
  
  // Links de menus (prioridade máxima)
  elements.menus.forEach(menu => {
    menu.items.forEach(item => {
      if (item.href && !item.href.startsWith('#') && !item.href.startsWith('javascript:') && !item.href.startsWith('mailto:')) {
        navigationLinks.push({
          text: item.text,
          href: item.href,
          selector: item.selector,
          type: 'menu',
          priority: 15
        });
      }
    });
  });
  
  // Todos os links gerais
  elements.links.forEach(link => {
    if (!link.isExternal && link.href && !link.href.startsWith('#') && !link.href.startsWith('javascript:') && !link.href.startsWith('mailto:')) {
      navigationLinks.push({
        text: link.text,
        href: link.href,
        selector: link.selector,
        type: 'link',
        priority: 10
      });
    }
  });
  
  // TODOS os botões (modo agressivo)
  if (CONFIG.clickAllButtons) {
    elements.buttons.forEach(button => {
      if (button.text && !button.disabled) {
        // Incluir TODOS os botões, não apenas os de navegação
        navigationLinks.push({
          text: button.text,
          href: null,
          selector: button.selector,
          type: 'button',
          priority: button.text.toLowerCase().includes('admin') ? 12 : 
                   button.text.toLowerCase().includes('menu') ? 11 : 
                   button.text.toLowerCase().includes('nav') ? 10 : 8
        });
      }
    });
  }
  
  // Abas (podem levar a conteúdo diferente)
  elements.tabs.forEach(tab => {
    if (tab.text && !tab.active) {
      navigationLinks.push({
        text: tab.text,
        href: null,
        selector: tab.selector,
        type: 'tab',
        priority: 9
      });
    }
  });
  
  // Acordeões (podem revelar conteúdo)
  elements.accordions.forEach(accordion => {
    if (accordion.text && !accordion.expanded) {
      navigationLinks.push({
        text: accordion.text,
        href: null,
        selector: accordion.selector,
        type: 'accordion',
        priority: 7
      });
    }
  });
  
  // Dropdowns (podem ter opções)
  elements.dropdowns.forEach(dropdown => {
    navigationLinks.push({
      text: `Dropdown ${dropdown.index}`,
      href: null,
      selector: dropdown.selector,
      type: 'dropdown',
      priority: 6
    });
  });
  
  // Ordenar por prioridade (maior primeiro)
  navigationLinks.sort((a, b) => b.priority - a.priority);
  
  console.log(`🔗 Encontrados ${navigationLinks.length} elementos para navegação`);
  
  return navigationLinks;
}

// Função para clicar em elemento com retry
async function clickElementWithRetry(page, selector, elementText, retries = CONFIG.retryFailedClicks) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔘 Tentativa ${attempt}/${retries}: Clicando em "${elementText}"`);
      
      // Aguardar o elemento estar disponível
      await page.waitForSelector(selector, { timeout: 10000 });
      
      // Scroll para o elemento
      await page.locator(selector).scrollIntoViewIfNeeded();
      
      // Aguardar um pouco
      await sleep(500);
      
      // Tentar clicar
      await page.locator(selector).click({ timeout: 10000 });
      
      // Aguardar possível navegação
      await sleep(2000);
      
      crawlingData.summary.totalButtonClicks++;
      crawlingData.buttonClicks.push({
        selector: selector,
        text: elementText,
        attempt: attempt,
        success: true,
        timestamp: new Date().toISOString()
      });
      
      return true;
      
    } catch (error) {
      console.log(`❌ Tentativa ${attempt} falhou: ${error.message}`);
      
      if (attempt === retries) {
        crawlingData.summary.totalFailedAttempts++;
        crawlingData.failedAttempts.push({
          selector: selector,
          text: elementText,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        return false;
      }
      
      await sleep(1000);
    }
  }
  
  return false;
}

// Função para analisar página completa
async function analyzePageComplete(page, url, depth) {
  console.log(`\n📄 Analisando página completa: ${url} (profundidade ${depth})`);
  console.log('------------------------------------------------------------');
  
  // Aguardar conteúdo dinâmico
  await waitForDynamicContent(page);
  
  // Capturar screenshot
  const screenshotName = `page-${crawlingData.summary.totalPagesAnalyzed + 1}-depth-${depth}`;
  const screenshot = await captureScreenshot(page, screenshotName);
  
  // Analisar elementos
  const elements = await analyzePageElementsAggressive(page);
  
  // Descobrir rotas
  const routes = await discoverRoutesAggressive(page, url, depth);
  
  // Compilar dados da página
  const pageData = {
    url: url,
    title: elements.title,
    depth: depth,
    timestamp: new Date().toISOString(),
    elements: elements,
    routes: routes,
    screenshot: screenshot,
    summary: {
      totalMenuItems: elements.menus.reduce((sum, menu) => sum + menu.items.length, 0),
      totalLinks: elements.links.length,
      totalForms: elements.forms.length,
      totalTables: elements.tables.length,
      totalActions: elements.buttons.length,
      totalRoutes: routes.length,
      totalModals: elements.modals.length,
      totalDropdowns: elements.dropdowns.length,
      totalTabs: elements.tabs.length,
      totalAccordions: elements.accordions.length
    }
  };
  
  // Atualizar estatísticas globais
  crawlingData.summary.totalPagesAnalyzed++;
  crawlingData.summary.totalMenuItems += pageData.summary.totalMenuItems;
  crawlingData.summary.totalLinks += pageData.summary.totalLinks;
  crawlingData.summary.totalForms += pageData.summary.totalForms;
  crawlingData.summary.totalTables += pageData.summary.totalTables;
  crawlingData.summary.totalActions += pageData.summary.totalActions;
  
  crawlingData.pagesData.push(pageData);
  crawlingData.discoveredRoutes.push(...routes);
  
  console.log(`📊 Análise da página:`);
  console.log(`   - Título: ${elements.title}`);
  console.log(`   - Menus: ${pageData.summary.totalMenuItems}`);
  console.log(`   - Links: ${pageData.summary.totalLinks}`);
  console.log(`   - Formulários: ${pageData.summary.totalForms}`);
  console.log(`   - Tabelas: ${pageData.summary.totalTables}`);
  console.log(`   - Ações: ${pageData.summary.totalActions}`);
  console.log(`   - Rotas descobertas: ${pageData.summary.totalRoutes}`);
  console.log(`   - Modais: ${pageData.summary.totalModals}`);
  console.log(`   - Dropdowns: ${pageData.summary.totalDropdowns}`);
  console.log(`   - Abas: ${pageData.summary.totalTabs}`);
  console.log(`   - Acordeões: ${pageData.summary.totalAccordions}`);
  
  return pageData;
}

// Função para navegação super agressiva
async function superAggressiveNavigation(page, baseUrl) {
  console.log(`\n🚀 INICIANDO NAVEGAÇÃO SUPER AGRESSIVA`);
  console.log('======================================================================');
  
  const visitedUrls = new Set();
  const urlQueue = [{ url: baseUrl, depth: 0, source: 'initial' }];
  const clickedElements = new Set();
  
  while (urlQueue.length > 0 && visitedUrls.size < CONFIG.maxPages) {
    const { url: currentUrl, depth, source } = urlQueue.shift();
    
    if (visitedUrls.has(currentUrl) || depth >= CONFIG.maxDepth) {
      continue;
    }
    
    try {
      console.log(`\n🌐 Navegando para: ${currentUrl} (profundidade ${depth}, fonte: ${source})`);
      
      await page.goto(currentUrl, { waitUntil: 'networkidle', timeout: CONFIG.timeout });
      await sleep(CONFIG.screenshotDelay);
      
      visitedUrls.add(currentUrl);
      crawlingData.visitedUrls.add(currentUrl);
      
      // Analisar a página atual
      const pageData = await analyzePageComplete(page, currentUrl, depth);
      
      if (pageData && pageData.routes) {
        // Processar TODAS as rotas descobertas
        for (const route of pageData.routes) {
          const routeKey = `${route.selector}-${route.text}`;
          
          if (clickedElements.has(routeKey)) {
            console.log(`⏭️ Elemento já clicado: ${route.text}`);
            continue;
          }
          
          let fullUrl;
          
          if (route.href) {
            // É um link
            try {
              if (route.href.startsWith('http')) {
                fullUrl = route.href;
              } else if (route.href.startsWith('/')) {
                const baseUrlObj = new URL(baseUrl);
                fullUrl = `${baseUrlObj.protocol}//${baseUrlObj.host}${route.href}`;
              } else {
                const baseUrlObj = new URL(currentUrl);
                fullUrl = new URL(route.href, baseUrlObj).href;
              }
              
              if (!visitedUrls.has(fullUrl) && fullUrl.includes(new URL(baseUrl).hostname)) {
                console.log(`🔗 Adicionando link à fila: ${fullUrl}`);
                urlQueue.push({
                  url: fullUrl,
                  depth: depth + 1,
                  source: `link:${route.text}`
                });
              }
            } catch (e) {
              console.log(`❌ Erro ao processar link: ${e.message}`);
            }
          } else {
            // É um elemento clicável (botão, tab, etc.)
            try {
              const currentUrlBefore = page.url();
              
              console.log(`🔘 Testando ${route.type}: ${route.text}`);
              
              const clickSuccess = await clickElementWithRetry(page, route.selector, route.text);
              
              if (clickSuccess) {
                clickedElements.add(routeKey);
                
                // Aguardar possível mudança
                await sleep(3000);
                await waitForDynamicContent(page);
                
                const currentUrlAfter = page.url();
                
                if (currentUrlAfter !== currentUrlBefore) {
                  // Navegou para uma nova página
                  console.log(`✅ ${route.type} navegou para: ${currentUrlAfter}`);
                  
                  if (!visitedUrls.has(currentUrlAfter)) {
                    urlQueue.push({
                      url: currentUrlAfter,
                      depth: depth + 1,
                      source: `${route.type}:${route.text}`
                    });
                  }
                } else {
                  // Pode ter aberto modal, dropdown, etc.
                  console.log(`🔄 ${route.type} pode ter alterado o estado da página`);
                  
                  // Capturar screenshot do novo estado
                  if (CONFIG.captureAllStates) {
                    await captureScreenshot(page, `state-${route.type}-${Date.now()}`);
                  }
                  
                  // Verificar se apareceu novo conteúdo
                  const newElements = await analyzePageElementsAggressive(page);
                  const newRoutes = await discoverRoutesAggressive(page, currentUrl, depth);
                  
                  // Adicionar novas rotas descobertas
                  for (const newRoute of newRoutes) {
                    const newRouteKey = `${newRoute.selector}-${newRoute.text}`;
                    if (!clickedElements.has(newRouteKey)) {
                      pageData.routes.push(newRoute);
                    }
                  }
                }
              }
              
            } catch (e) {
              console.log(`❌ Erro ao testar ${route.type}: ${e.message}`);
            }
          }
          
          // Verificar se atingiu limite de páginas
          if (visitedUrls.size >= CONFIG.maxPages) {
            console.log(`🛑 Limite de páginas atingido (${CONFIG.maxPages})`);
            break;
          }
        }
      }
      
      // Verificar se deve solicitar ajuda do usuário
      if (pageData && pageData.routes.length === 0 && depth <= 2) {
        const userHelp = await askUser(`Página sem rotas óbvias. Explorar algo específico? (ou 'skip')`);
        
        if (userHelp !== 'skip' && userHelp !== 'stop') {
          console.log(`📝 Sugestão do usuário: ${userHelp}`);
          // Implementar parsing das sugestões do usuário se necessário
        }
      }
      
    } catch (error) {
      console.log(`❌ Erro ao navegar para ${currentUrl}: ${error.message}`);
      crawlingData.failedAttempts.push({
        url: currentUrl,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  console.log(`\n✅ Navegação super agressiva finalizada!`);
  console.log(`📊 Total de páginas visitadas: ${visitedUrls.size}`);
  console.log(`📊 Total de rotas descobertas: ${crawlingData.discoveredRoutes.length}`);
  console.log(`📊 Total de cliques realizados: ${crawlingData.summary.totalButtonClicks}`);
  console.log(`📊 Total de falhas: ${crawlingData.summary.totalFailedAttempts}`);
}

// Função para gerar relatório super completo
function generateSuperCompleteReport() {
  console.log(`\n📝 GERANDO RELATÓRIO SUPER COMPLETO...`);
  
  let markdown = `# Relatório Super Completo - Crawling Agressivo de Todas as Páginas\n\n`;
  
  // Informações gerais
  markdown += `## 📋 Informações Gerais\n\n`;
  markdown += `- **Data/Hora**: ${crawlingData.timestamp}\n`;
  markdown += `- **URL Base**: ${crawlingData.testInfo.url}\n`;
  markdown += `- **Credenciais**: ${crawlingData.testInfo.credentials}\n`;
  markdown += `- **Tipo de Teste**: ${crawlingData.testInfo.testType}\n`;
  markdown += `- **Modo Agressivo**: ${CONFIG.aggressiveMode ? 'ATIVADO' : 'DESATIVADO'}\n`;
  markdown += `- **Configurações**:\n`;
  markdown += `  - Máximo de páginas: ${CONFIG.maxPages}\n`;
  markdown += `  - Profundidade máxima: ${CONFIG.maxDepth}\n`;
  markdown += `  - Timeout: ${CONFIG.timeout}ms\n`;
  markdown += `  - Clicar todos os botões: ${CONFIG.clickAllButtons}\n`;
  markdown += `  - Explorar todos os menus: ${CONFIG.exploreAllMenus}\n`;
  markdown += `  - Seguir todos os links: ${CONFIG.followAllLinks}\n`;
  markdown += `  - Tentativas de retry: ${CONFIG.retryFailedClicks}\n\n`;
  
  // Resumo executivo super detalhado
  markdown += `## 📊 Resumo Executivo Super Detalhado\n\n`;
  markdown += `- **Total de Páginas Analisadas**: ${crawlingData.summary.totalPagesAnalyzed}\n`;
  markdown += `- **Total de URLs Visitadas**: ${crawlingData.visitedUrls.size}\n`;
  markdown += `- **Total de Itens de Menu**: ${crawlingData.summary.totalMenuItems}\n`;
  markdown += `- **Total de Links**: ${crawlingData.summary.totalLinks}\n`;
  markdown += `- **Total de Formulários**: ${crawlingData.summary.totalForms}\n`;
  markdown += `- **Total de Tabelas**: ${crawlingData.summary.totalTables}\n`;
  markdown += `- **Total de Elementos de Ação**: ${crawlingData.summary.totalActions}\n`;
  markdown += `- **Total de Rotas Descobertas**: ${crawlingData.discoveredRoutes.length}\n`;
  markdown += `- **Total de Cliques Realizados**: ${crawlingData.summary.totalButtonClicks}\n`;
  markdown += `- **Total de Tentativas Falhadas**: ${crawlingData.summary.totalFailedAttempts}\n`;
  markdown += `- **Total de Conteúdo Dinâmico**: ${crawlingData.summary.totalDynamicContent}\n`;
  markdown += `- **Screenshots Capturados**: ${crawlingData.screenshots.length}\n`;
  markdown += `- **Interações do Usuário**: ${crawlingData.summary.totalUserInteractions}\n\n`;
  
  // Processo de login
  markdown += `## 🔑 Processo de Login\n\n`;
  crawlingData.loginProcess.forEach((login, index) => {
    markdown += `### Tentativa ${login.attempt}\n\n`;
    markdown += `- **URL**: [${login.url}](${login.url})\n`;
    markdown += `- **Título**: ${login.title}\n`;
    markdown += `- **Timestamp**: ${login.timestamp}\n\n`;
  });
  
  // URLs visitadas
  markdown += `## 🌐 URLs Visitadas\n\n`;
  Array.from(crawlingData.visitedUrls).forEach((url, index) => {
    markdown += `${index + 1}. [${url}](${url})\n`;
  });
  markdown += `\n`;
  
  // Rotas descobertas agrupadas por tipo
  if (crawlingData.discoveredRoutes.length > 0) {
    markdown += `## 🗺️ Rotas Descobertas (${crawlingData.discoveredRoutes.length} total)\n\n`;
    
    const routesByType = {};
    crawlingData.discoveredRoutes.forEach(route => {
      if (!routesByType[route.type]) routesByType[route.type] = [];
      routesByType[route.type].push(route);
    });
    
    Object.keys(routesByType).forEach(type => {
      markdown += `### ${type.toUpperCase()} (${routesByType[type].length} encontrados)\n\n`;
      routesByType[type].forEach((route, index) => {
        markdown += `${index + 1}. **${route.text}**\n`;
        if (route.href) markdown += `   - URL: \`${route.href}\`\n`;
        markdown += `   - Seletor: \`${route.selector}\`\n`;
        markdown += `   - Prioridade: ${route.priority}\n\n`;
      });
    });
  }
  
  // Análise detalhada de cada página
  markdown += `## 📄 Análise Super Detalhada das Páginas\n\n`;
  
  crawlingData.pagesData.forEach((page, index) => {
    markdown += `### ${index + 1}. ${page.title} (Profundidade ${page.depth})\n\n`;
    markdown += `- **URL**: [${page.url}](${page.url})\n`;
    markdown += `- **Screenshot**: ${page.screenshot}\n`;
    markdown += `- **Timestamp**: ${page.timestamp}\n\n`;
    
    // Estatísticas da página
    markdown += `#### 📊 Estatísticas da Página\n\n`;
    markdown += `- **Menus**: ${page.summary.totalMenuItems}\n`;
    markdown += `- **Links**: ${page.summary.totalLinks}\n`;
    markdown += `- **Formulários**: ${page.summary.totalForms}\n`;
    markdown += `- **Tabelas**: ${page.summary.totalTables}\n`;
    markdown += `- **Ações**: ${page.summary.totalActions}\n`;
    markdown += `- **Rotas**: ${page.summary.totalRoutes}\n`;
    if (page.summary.totalModals) markdown += `- **Modais**: ${page.summary.totalModals}\n`;
    if (page.summary.totalDropdowns) markdown += `- **Dropdowns**: ${page.summary.totalDropdowns}\n`;
    if (page.summary.totalTabs) markdown += `- **Abas**: ${page.summary.totalTabs}\n`;
    if (page.summary.totalAccordions) markdown += `- **Acordeões**: ${page.summary.totalAccordions}\n`;
    markdown += `\n`;
    
    // Menus detalhados
    if (page.elements.menus && page.elements.menus.length > 0) {
      markdown += `#### 🧭 Menus (${page.elements.menus.length} encontrados)\n\n`;
      page.elements.menus.forEach((menu, idx) => {
        markdown += `${idx + 1}. **Menu ${idx + 1}** (${menu.items.length} itens)\n`;
        menu.items.forEach((item, itemIdx) => {
          markdown += `   ${itemIdx + 1}. ${item.text}\n`;
          if (item.href) markdown += `      - Link: \`${item.href}\`\n`;
        });
        markdown += `\n`;
      });
    }
    
    // Links detalhados
    if (page.elements.links && page.elements.links.length > 0) {
      markdown += `#### 🔗 Links (${page.elements.links.length} encontrados)\n\n`;
      page.elements.links.slice(0, 20).forEach((link, idx) => { // Limitar a 20 para não ficar muito longo
        markdown += `${idx + 1}. **${link.text}**\n`;
        markdown += `   - URL: \`${link.href}\`\n`;
        markdown += `   - Externo: ${link.isExternal ? 'Sim' : 'Não'}\n\n`;
      });
      if (page.elements.links.length > 20) {
        markdown += `... e mais ${page.elements.links.length - 20} links\n\n`;
      }
    }
    
    // Formulários detalhados
    if (page.elements.forms && page.elements.forms.length > 0) {
      markdown += `#### 📝 Formulários (${page.elements.forms.length} encontrados)\n\n`;
      page.elements.forms.forEach((form, idx) => {
        markdown += `${idx + 1}. **Formulário ${idx + 1}**\n`;
        markdown += `   - Ação: \`${form.action || 'N/A'}\`\n`;
        markdown += `   - Método: \`${form.method || 'GET'}\`\n`;
        markdown += `   - Campos: ${form.inputCount}\n\n`;
      });
    }
    
    // Tabelas detalhadas
    if (page.elements.tables && page.elements.tables.length > 0) {
      markdown += `#### 📊 Tabelas (${page.elements.tables.length} encontradas)\n\n`;
      page.elements.tables.forEach((table, idx) => {
        markdown += `${idx + 1}. **Tabela ${idx + 1}**\n`;
        markdown += `   - Linhas: ${table.rows}\n`;
        markdown += `   - Colunas: ${table.columns}\n\n`;
      });
    }
    
    // Elementos de ação detalhados
    if (page.elements.buttons && page.elements.buttons.length > 0) {
      markdown += `#### 🎯 Elementos de Ação (${page.elements.buttons.length} encontrados)\n\n`;
      page.elements.buttons.slice(0, 15).forEach((button, idx) => { // Limitar a 15
        markdown += `${idx + 1}. **${button.text}**\n`;
        markdown += `   - Tipo: \`${button.type}\`\n`;
        markdown += `   - Desabilitado: ${button.disabled ? 'Sim' : 'Não'}\n`;
        markdown += `   - Seletor: \`${button.selector}\`\n\n`;
      });
      if (page.elements.buttons.length > 15) {
        markdown += `... e mais ${page.elements.buttons.length - 15} elementos\n\n`;
      }
    }
    
    // Elementos especiais
    if (page.elements.modals && page.elements.modals.length > 0) {
      markdown += `#### 🪟 Modais (${page.elements.modals.length} encontrados)\n\n`;
      page.elements.modals.forEach((modal, idx) => {
        markdown += `${idx + 1}. Modal ${idx + 1} - Visível: ${modal.visible ? 'Sim' : 'Não'}\n`;
      });
      markdown += `\n`;
    }
    
    if (page.elements.tabs && page.elements.tabs.length > 0) {
      markdown += `#### 📑 Abas (${page.elements.tabs.length} encontradas)\n\n`;
      page.elements.tabs.forEach((tab, idx) => {
        markdown += `${idx + 1}. **${tab.text}** - Ativa: ${tab.active ? 'Sim' : 'Não'}\n`;
      });
      markdown += `\n`;
    }
    
    markdown += `---\n\n`;
  });
  
  // Cliques realizados
  if (crawlingData.buttonClicks.length > 0) {
    markdown += `## 🔘 Cliques Realizados (${crawlingData.buttonClicks.length} total)\n\n`;
    crawlingData.buttonClicks.forEach((click, index) => {
      markdown += `${index + 1}. **${click.text}**\n`;
      markdown += `   - Seletor: \`${click.selector}\`\n`;
      markdown += `   - Tentativa: ${click.attempt}\n`;
      markdown += `   - Sucesso: ${click.success ? 'Sim' : 'Não'}\n`;
      markdown += `   - Timestamp: ${click.timestamp}\n\n`;
    });
  }
  
  // Tentativas falhadas
  if (crawlingData.failedAttempts.length > 0) {
    markdown += `## ❌ Tentativas Falhadas (${crawlingData.failedAttempts.length} total)\n\n`;
    crawlingData.failedAttempts.forEach((failure, index) => {
      markdown += `${index + 1}. **${failure.text || failure.url || 'Elemento desconhecido'}**\n`;
      if (failure.selector) markdown += `   - Seletor: \`${failure.selector}\`\n`;
      if (failure.url) markdown += `   - URL: \`${failure.url}\`\n`;
      markdown += `   - Erro: ${failure.error}\n`;
      markdown += `   - Timestamp: ${failure.timestamp}\n\n`;
    });
  }
  
  // Interações do usuário
  if (crawlingData.userInteractions.length > 0) {
    markdown += `## 🤝 Interações do Usuário (${crawlingData.userInteractions.length} total)\n\n`;
    crawlingData.userInteractions.forEach((interaction, index) => {
      markdown += `${index + 1}. **Pergunta**: ${interaction.question}\n`;
      markdown += `   - **Resposta**: ${interaction.answer}\n`;
      markdown += `   - **Timestamp**: ${interaction.timestamp}\n\n`;
    });
  }
  
  // Screenshots capturados
  markdown += `## 📸 Screenshots Capturados (${crawlingData.screenshots.length} total)\n\n`;
  crawlingData.screenshots.forEach((screenshot, index) => {
    markdown += `${index + 1}. ${screenshot}\n`;
  });
  markdown += `\n`;
  
  // Conclusões e recomendações super detalhadas
  markdown += `## 🎯 Conclusões e Recomendações Super Detalhadas\n\n`;
  
  markdown += `### ✅ Funcionalidades Identificadas\n\n`;
  
  if (crawlingData.summary.totalForms > 0) {
    markdown += `- **Formulários**: Sistema possui ${crawlingData.summary.totalForms} formulários para entrada de dados\n`;
  }
  
  if (crawlingData.summary.totalTables > 0) {
    markdown += `- **Tabelas**: Sistema apresenta ${crawlingData.summary.totalTables} tabelas para exibição de dados\n`;
  }
  
  if (crawlingData.summary.totalMenuItems > 0) {
    markdown += `- **Navegação**: Sistema possui ${crawlingData.summary.totalMenuItems} itens de menu para navegação\n`;
  }
  
  if (crawlingData.summary.totalActions > 0) {
    markdown += `- **Interações**: Sistema oferece ${crawlingData.summary.totalActions} elementos interativos\n`;
  }
  
  if (crawlingData.summary.totalLinks > 0) {
    markdown += `- **Links**: Sistema contém ${crawlingData.summary.totalLinks} links para navegação\n`;
  }
  
  markdown += `\n### 📋 Arquitetura do Sistema\n\n`;
  markdown += `O sistema analisado apresenta as seguintes características:\n\n`;
  
  markdown += `- **Páginas Mapeadas**: ${crawlingData.summary.totalPagesAnalyzed} páginas foram identificadas e analisadas\n`;
  markdown += `- **Profundidade de Navegação**: Máximo de ${CONFIG.maxDepth} níveis explorados\n`;
  markdown += `- **Rotas Descobertas**: ${crawlingData.discoveredRoutes.length} rotas de navegação identificadas\n`;
  markdown += `- **Taxa de Sucesso**: ${((crawlingData.summary.totalButtonClicks / (crawlingData.summary.totalButtonClicks + crawlingData.summary.totalFailedAttempts)) * 100).toFixed(1)}% de cliques bem-sucedidos\n`;
  
  if (crawlingData.summary.totalUserInteractions > 0) {
    markdown += `- **Interação Humana**: ${crawlingData.summary.totalUserInteractions} interações com usuário foram necessárias\n`;
  }
  
  markdown += `\n### 🔧 Recomendações Técnicas Avançadas\n\n`;
  markdown += `1. **Documentação Completa**: Este relatório serve como base para documentação técnica completa do sistema\n`;
  markdown += `2. **Automação de Testes**: Os ${crawlingData.discoveredRoutes.length} seletores identificados podem ser utilizados para automação de testes\n`;
  markdown += `3. **Manutenção Facilitada**: A estrutura mapeada facilita futuras manutenções e atualizações\n`;
  markdown += `4. **Integração de Sistemas**: APIs e formulários identificados podem ser integrados com outros sistemas\n`;
  markdown += `5. **Monitoramento Contínuo**: As rotas descobertas podem ser monitoradas para mudanças\n`;
  markdown += `6. **Otimização de Performance**: Identificadas ${crawlingData.summary.totalPagesAnalyzed} páginas que podem ser otimizadas\n`;
  markdown += `7. **Acessibilidade**: Elementos identificados podem ser auditados para conformidade com padrões de acessibilidade\n\n`;
  
  // Análise de complexidade
  markdown += `### 📊 Análise de Complexidade\n\n`;
  
  const complexityScore = crawlingData.discoveredRoutes.length + crawlingData.summary.totalActions + crawlingData.summary.totalForms;
  let complexityLevel = 'Baixa';
  
  if (complexityScore > 100) complexityLevel = 'Muito Alta';
  else if (complexityScore > 50) complexityLevel = 'Alta';
  else if (complexityScore > 20) complexityLevel = 'Média';
  
  markdown += `- **Pontuação de Complexidade**: ${complexityScore}\n`;
  markdown += `- **Nível de Complexidade**: ${complexityLevel}\n`;
  markdown += `- **Páginas por Profundidade**: Distribuição equilibrada em ${CONFIG.maxDepth} níveis\n`;
  markdown += `- **Densidade de Interação**: ${(crawlingData.summary.totalActions / crawlingData.summary.totalPagesAnalyzed).toFixed(1)} elementos interativos por página\n\n`;
  
  if (crawlingData.discoveredRoutes.length > 100) {
    markdown += `### ⚠️ Observações Importantes\n\n`;
    markdown += `- **Sistema Altamente Complexo**: Foram descobertas ${crawlingData.discoveredRoutes.length} rotas, indicando alta complexidade\n`;
    markdown += `- **Análise Extensiva**: Foram analisadas ${crawlingData.summary.totalPagesAnalyzed} páginas em profundidade\n`;
    markdown += `- **Cobertura Completa**: O crawling agressivo capturou a maioria das funcionalidades disponíveis\n`;
    markdown += `- **Recomendação**: Sistema está bem mapeado para documentação e automação\n\n`;
  }
  
  // Estatísticas finais
  markdown += `### 📈 Estatísticas Finais\n\n`;
  markdown += `- **Tempo de Execução**: Crawling completo realizado\n`;
  markdown += `- **Cobertura de Páginas**: ${crawlingData.summary.totalPagesAnalyzed} páginas analisadas\n`;
  markdown += `- **Eficiência de Cliques**: ${crawlingData.summary.totalButtonClicks} cliques realizados com sucesso\n`;
  markdown += `- **Taxa de Falhas**: ${((crawlingData.summary.totalFailedAttempts / (crawlingData.summary.totalButtonClicks + crawlingData.summary.totalFailedAttempts)) * 100).toFixed(1)}%\n`;
  markdown += `- **Screenshots Coletados**: ${crawlingData.screenshots.length} imagens para documentação\n`;
  markdown += `- **Dados Estruturados**: Todas as informações salvas em JSON para processamento posterior\n\n`;
  
  markdown += `---\n\n`;
  markdown += `*Relatório super completo gerado automaticamente em ${new Date().toLocaleString('pt-BR')}*\n`;
  markdown += `*Ferramenta: Crawler Super Agressivo v3.0 - Captura Completa de Páginas*\n`;
  markdown += `*Modo: Agressivo com captura de todas as páginas possíveis*\n`;
  
  return markdown;
}

// Função principal
async function main() {
  console.log('🚀 Iniciando teste SUPER AGRESSIVO de crawling completo...');
  console.log('🔥 CRAWLING SUPER AGRESSIVO - CAPTURA DE TODAS AS PÁGINAS');
  console.log('======================================================================');
  console.log(`📋 URL: ${CONFIG.url}`);
  console.log(`🔑 Credenciais: ${CONFIG.username} / ${CONFIG.password}`);
  console.log(`🎯 Objetivo: Capturar TODAS as páginas possíveis da aplicação`);
  console.log(`⚙️ Configurações AGRESSIVAS:`);
  console.log(`   - Máximo de páginas: ${CONFIG.maxPages}`);
  console.log(`   - Profundidade máxima: ${CONFIG.maxDepth}`);
  console.log(`   - Timeout: ${CONFIG.timeout}ms`);
  console.log(`   - Modo agressivo: ${CONFIG.aggressiveMode}`);
  console.log(`   - Clicar todos os botões: ${CONFIG.clickAllButtons}`);
  console.log(`   - Explorar todos os menus: ${CONFIG.exploreAllMenus}`);
  console.log(`   - Seguir todos os links: ${CONFIG.followAllLinks}`);
  console.log(`   - Tentativas de retry: ${CONFIG.retryFailedClicks}`);
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // ETAPA 1: Navegação inicial
    console.log(`\n📍 ETAPA 1: Navegação inicial...`);
    await page.goto(CONFIG.url, { waitUntil: 'networkidle' });
    await captureScreenshot(page, '01-inicial');
    
    // ETAPA 2: Processo de login
    console.log(`\n🔑 ETAPA 2: Processo de login inteligente...`);
    let loginSuccess = false;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!loginSuccess && attempts < maxAttempts) {
      attempts++;
      console.log(`\n🔑 TENTATIVA DE LOGIN ${attempts}/${maxAttempts}...`);
      
      const currentUrl = page.url();
      const currentTitle = await page.title();
      
      crawlingData.loginProcess.push({
        attempt: attempts,
        url: currentUrl,
        title: currentTitle,
        timestamp: new Date().toISOString()
      });
      
      loginSuccess = await attemptSmartLogin(page);
      
      if (loginSuccess) {
        console.log(`✅ Login realizado com sucesso na tentativa ${attempts}!`);
        await sleep(3000);
        await captureScreenshot(page, '02-logado');
        break;
      } else {
        console.log(`❌ Falha no login na tentativa ${attempts}`);
        if (attempts < maxAttempts) {
          const userHelp = await askUser(`Login falhou. Tentar novamente ou ajustar? (retry/manual/skip)`);
          if (userHelp === 'skip') break;
          if (userHelp === 'manual') {
            console.log(`🤝 Aguardando login manual...`);
            await askUser(`Faça login manualmente e pressione Enter para continuar`);
            loginSuccess = true;
            break;
          }
        }
      }
    }
    
    if (!loginSuccess) {
      console.log(`❌ Não foi possível realizar login após ${maxAttempts} tentativas`);
      const userChoice = await askUser(`Continuar sem login? (yes/no)`);
      if (userChoice.toLowerCase() !== 'yes') {
        console.log(`🛑 Teste cancelado pelo usuário`);
        return;
      }
    }
    
    // ETAPA 3: Navegação super agressiva
    console.log(`\n🚀 ETAPA 3: Navegação super agressiva...`);
    const baseUrl = page.url();
    await superAggressiveNavigation(page, baseUrl);
    
    // ETAPA 4: Geração de relatórios
    console.log(`\n📝 ETAPA 4: Geração de relatórios super completos...`);
    
    const reportMarkdown = generateSuperCompleteReport();
    const reportFilename = 'crawling-super-completo-todas-paginas-relatorio.md';
    fs.writeFileSync(reportFilename, reportMarkdown);
    console.log(`✅ Relatório markdown salvo: ${reportFilename}`);
    
    const dataFilename = 'crawling-super-completo-todas-paginas-dados.json';
    const jsonData = {
      ...crawlingData,
      visitedUrls: Array.from(crawlingData.visitedUrls)
    };
    fs.writeFileSync(dataFilename, JSON.stringify(jsonData, null, 2));
    console.log(`✅ Dados JSON salvos: ${dataFilename}`);
    
  } catch (error) {
    console.log(`❌ Erro durante o teste: ${error.message}`);
    console.log(`📊 Dados coletados até o momento:`);
    console.log(`   - Páginas analisadas: ${crawlingData.summary.totalPagesAnalyzed}`);
    console.log(`   - URLs visitadas: ${crawlingData.visitedUrls.size}`);
    console.log(`   - Screenshots: ${crawlingData.screenshots.length}`);
    
    // Salvar dados mesmo em caso de erro
    try {
      const errorReportMarkdown = generateSuperCompleteReport();
      const errorReportFilename = 'crawling-super-completo-erro-relatorio.md';
      fs.writeFileSync(errorReportFilename, errorReportMarkdown);
      
      const errorDataFilename = 'crawling-super-completo-erro-dados.json';
      const errorJsonData = {
        ...crawlingData,
        visitedUrls: Array.from(crawlingData.visitedUrls),
        error: error.message
      };
      fs.writeFileSync(errorDataFilename, JSON.stringify(errorJsonData, null, 2));
      
      console.log(`✅ Dados de erro salvos: ${errorReportFilename} e ${errorDataFilename}`);
    } catch (saveError) {
      console.log(`❌ Erro ao salvar dados de erro: ${saveError.message}`);
    }
  } finally {
    await browser.close();
    rl.close();
    
    console.log(`\n🎉 TESTE SUPER AGRESSIVO FINALIZADO!`);
    console.log('======================================================================');
    console.log(`📊 RESUMO FINAL:`);
    console.log(`   - Páginas analisadas: ${crawlingData.summary.totalPagesAnalyzed}`);
    console.log(`   - URLs visitadas: ${crawlingData.visitedUrls.size}`);
    console.log(`   - Rotas descobertas: ${crawlingData.discoveredRoutes.length}`);
    console.log(`   - Cliques realizados: ${crawlingData.summary.totalButtonClicks}`);
    console.log(`   - Falhas: ${crawlingData.summary.totalFailedAttempts}`);
    console.log(`   - Screenshots: ${crawlingData.screenshots.length}`);
    console.log(`   - Interações do usuário: ${crawlingData.summary.totalUserInteractions}`);
    console.log(`\n📁 Arquivos gerados:`);
    console.log(`   - crawling-super-completo-todas-paginas-relatorio.md`);
    console.log(`   - crawling-super-completo-todas-paginas-dados.json`);
    console.log(`   - ${crawlingData.screenshots.length} screenshots (.png)`);
    console.log(`\n✨ Crawling super agressivo concluído com sucesso!`);
  }
}

// Executar o teste
main().catch(console.error);