const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configurações do teste
const CONFIG = {
  url: 'https://saeb-h1.pmfi.pr.gov.br/auth/signin',
  username: 'admin',
  password: 'admin123',
  timeout: 30000,
  maxPages: 100,
  maxDepth: 5,
  screenshotDelay: 2000,
  interactionDelay: 1000,
  userInteractionTimeout: 60000
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
    testType: 'crawling_generico_completo_automatico'
  },
  loginProcess: [],
  visitedUrls: new Set(),
  pagesData: [],
  menuStructure: [],
  screenshots: [],
  userInteractions: [],
  discoveredRoutes: [],
  formInteractions: [],
  summary: {
    totalPagesAnalyzed: 0,
    totalMenuItems: 0,
    totalForms: 0,
    totalTables: 0,
    totalActions: 0,
    totalLinks: 0,
    totalUserInteractions: 0
  }
};

// Função para aguardar um tempo
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para solicitar ajuda do usuário
function askUser(question) {
  return new Promise((resolve) => {
    console.log(`\n🤔 SOLICITAÇÃO DE AJUDA DO USUÁRIO:`);
    console.log(`❓ ${question}`);
    console.log(`💡 Digite sua resposta (ou 'skip' para pular, 'stop' para parar):`);
    
    const timeout = setTimeout(() => {
      console.log(`\n⏰ Timeout - Continuando automaticamente...`);
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
    console.log(`📸 Screenshot capturado: ${filename}`);
    return filename;
  } catch (error) {
    console.log(`❌ Erro ao capturar screenshot: ${error.message}`);
    return null;
  }
}

// Função para analisar elementos da página
async function analyzePageElements(page) {
  console.log('🔍 Analisando elementos da página...');
  
  const elements = await page.evaluate(() => {
    const result = {
      inputs: [],
      buttons: [],
      links: [],
      forms: [],
      menus: [],
      tables: [],
      title: document.title,
      url: window.location.href,
      hasModal: false,
      hasDropdown: false
    };
    
    // Analisar inputs
    document.querySelectorAll('input, textarea, select').forEach((input, index) => {
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
    
    // Analisar botões
    document.querySelectorAll('button, input[type="submit"], input[type="button"], [role="button"]').forEach((button, index) => {
      const text = button.textContent?.trim() || button.value || button.getAttribute('aria-label') || '';
      if (text.length > 0) {
        result.buttons.push({
          index: index,
          type: button.type || button.tagName.toLowerCase(),
          text: text,
          id: button.id,
          className: button.className,
          disabled: button.disabled,
          selector: button.id ? `#${button.id}` : `button:nth-of-type(${index + 1})`
        });
      }
    });
    
    // Analisar links
    document.querySelectorAll('a[href]').forEach((link, index) => {
      const text = link.textContent?.trim();
      const href = link.getAttribute('href');
      if (text && href && text.length > 0 && text.length < 200) {
        result.links.push({
          index: index,
          text: text,
          href: href,
          id: link.id,
          className: link.className,
          isExternal: href.startsWith('http') && !href.includes(window.location.hostname),
          selector: link.id ? `#${link.id}` : `a:nth-of-type(${index + 1})`
        });
      }
    });
    
    // Analisar formulários
    document.querySelectorAll('form').forEach((form, index) => {
      const formData = {
        index: index,
        action: form.getAttribute('action') || '',
        method: form.getAttribute('method') || 'GET',
        id: form.id,
        className: form.className,
        fields: [],
        selector: form.id ? `#${form.id}` : `form:nth-of-type(${index + 1})`
      };
      
      form.querySelectorAll('input, select, textarea').forEach(field => {
        if (field.type !== 'hidden') {
          formData.fields.push({
            name: field.getAttribute('name') || '',
            type: field.type || field.tagName.toLowerCase(),
            placeholder: field.getAttribute('placeholder') || '',
            required: field.hasAttribute('required'),
            value: field.value || '',
            selector: field.id ? `#${field.id}` : `[name="${field.name}"]`
          });
        }
      });
      
      result.forms.push(formData);
    });
    
    // Analisar menus e navegação
    const menuSelectors = [
      'nav', '.nav', '.navbar', '.menu', '.navigation', '.sidebar',
      '[role="navigation"]', '.header-menu', '.main-menu', 'ul.menu',
      '.dropdown-menu', '.nav-menu'
    ];
    
    menuSelectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach((menu, index) => {
          const menuItems = [];
          menu.querySelectorAll('a, button, [role="menuitem"]').forEach(item => {
            const text = item.textContent?.trim();
            const href = item.getAttribute('href');
            if (text && text.length > 0 && text.length < 100) {
              menuItems.push({
                text: text,
                href: href,
                type: item.tagName.toLowerCase(),
                selector: item.id ? `#${item.id}` : `${selector} ${item.tagName.toLowerCase()}:nth-of-type(${Array.from(menu.querySelectorAll(item.tagName)).indexOf(item) + 1})`
              });
            }
          });
          
          if (menuItems.length > 0) {
            result.menus.push({
              selector: selector,
              index: index,
              items: menuItems,
              type: 'menu'
            });
          }
        });
      } catch (e) {}
    });
    
    // Analisar tabelas
    document.querySelectorAll('table').forEach((table, index) => {
      const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent?.trim());
      const rowCount = table.querySelectorAll('tbody tr, tr').length;
      
      result.tables.push({
        index: index,
        headers: headers,
        rowCount: rowCount,
        hasHeaders: headers.length > 0,
        selector: table.id ? `#${table.id}` : `table:nth-of-type(${index + 1})`
      });
    });
    
    // Detectar modais e dropdowns
    result.hasModal = !!document.querySelector('.modal, .popup, .dialog, [role="dialog"]');
    result.hasDropdown = !!document.querySelector('.dropdown, .select-dropdown, .autocomplete');
    
    return result;
  });
  
  console.log(`📊 Elementos encontrados:`);
  console.log(`   - Inputs: ${elements.inputs.length}`);
  console.log(`   - Botões: ${elements.buttons.length}`);
  console.log(`   - Links: ${elements.links.length}`);
  console.log(`   - Formulários: ${elements.forms.length}`);
  console.log(`   - Menus: ${elements.menus.length}`);
  console.log(`   - Tabelas: ${elements.tables.length}`);
  
  return elements;
}

// Função para tentar login inteligente
async function attemptSmartLogin(page) {
  console.log('🧠 Tentando login inteligente...');
  
  const elements = await analyzePageElements(page);
  
  if (elements.inputs.length === 0) {
    console.log('⚠️ Nenhum input encontrado na página');
    
    // Verificar se há botão de login
    const loginButton = elements.buttons.find(button => 
      button.text && (button.text.toLowerCase().includes('login') || 
                     button.text.toLowerCase().includes('entrar') || 
                     button.text.toLowerCase().includes('acessar') ||
                     button.text.toLowerCase().includes('sign in'))
    );
    
    if (loginButton) {
      console.log(`🔘 Encontrado botão de login: "${loginButton.text}" - Clicando...`);
      try {
        await page.click(loginButton.selector, { timeout: 5000 });
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        await sleep(3000);
        return await attemptSmartLogin(page);
      } catch (error) {
        console.log(`❌ Erro ao clicar no botão de login: ${error.message}`);
      }
    }
    
    // Solicitar ajuda do usuário
    const userHelp = await askUser(`Não foi possível encontrar campos de login automaticamente. Como devo proceder? (Opções: 'continue' para prosseguir sem login, 'manual' para instruções manuais, 'skip' para pular)`);
    
    if (userHelp === 'manual') {
      const loginInstructions = await askUser(`Por favor, descreva como fazer login nesta página (ex: 'clique no botão X, depois preencha campo Y')`);
      console.log(`📝 Instruções do usuário: ${loginInstructions}`);
      // Aqui poderia implementar parsing das instruções do usuário
    }
    
    if (userHelp === 'stop') {
      throw new Error('Teste interrompido pelo usuário');
    }
    
    return userHelp === 'continue';
  }
  
  // Estratégias de login baseadas na análise
  const strategies = [];
  
  // Estratégia 1: Por nome específico
  const usernameInput = elements.inputs.find(input => 
    input.name && (input.name.toLowerCase().includes('username') || 
                   input.name.toLowerCase().includes('email') || 
                   input.name.toLowerCase().includes('login') ||
                   input.name.toLowerCase().includes('user'))
  );
  const passwordInput = elements.inputs.find(input => 
    input.type === 'password' || 
    (input.name && input.name.toLowerCase().includes('password'))
  );
  
  if (usernameInput && passwordInput) {
    strategies.push({
      name: 'Por nome específico',
      usernameSelector: usernameInput.selector,
      passwordSelector: passwordInput.selector
    });
  }
  
  // Estratégia 2: Por tipo
  const firstTextInput = elements.inputs.find(input => 
    input.type === 'text' || input.type === 'email' || !input.type
  );
  const firstPasswordInput = elements.inputs.find(input => input.type === 'password');
  
  if (firstTextInput && firstPasswordInput) {
    strategies.push({
      name: 'Por tipo (texto + password)',
      usernameSelector: firstTextInput.selector,
      passwordSelector: firstPasswordInput.selector
    });
  }
  
  // Estratégia 3: Dois primeiros inputs
  if (elements.inputs.length >= 2) {
    strategies.push({
      name: 'Dois primeiros inputs',
      usernameSelector: elements.inputs[0].selector,
      passwordSelector: elements.inputs[1].selector
    });
  }
  
  // Tentar cada estratégia
  for (const strategy of strategies) {
    try {
      console.log(`🔄 Tentando: ${strategy.name}...`);
      
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      await sleep(2000);
      
      await page.fill(strategy.usernameSelector, CONFIG.username, { timeout: 10000 });
      await sleep(500);
      await page.fill(strategy.passwordSelector, CONFIG.password, { timeout: 10000 });
      await sleep(500);
      
      console.log(`✅ Campos preenchidos com sucesso!`);
      
      // Tentar submeter
      let submitted = false;
      
      // Primeiro tentar botões específicos
      for (const button of elements.buttons) {
        if (button.text && (button.text.toLowerCase().includes('login') || 
                           button.text.toLowerCase().includes('entrar') || 
                           button.text.toLowerCase().includes('acessar') ||
                           button.text.toLowerCase().includes('sign in') ||
                           button.type === 'submit')) {
          try {
            await page.click(button.selector, { timeout: 3000 });
            console.log(`🔘 Submetendo via botão: "${button.text}"`);
            submitted = true;
            break;
          } catch (e) {
            continue;
          }
        }
      }
      
      if (!submitted && elements.buttons.length > 0) {
        try {
          await page.click(elements.buttons[0].selector, { timeout: 3000 });
          console.log(`🔘 Submetendo via primeiro botão`);
          submitted = true;
        } catch (e) {}
      }
      
      if (!submitted) {
        try {
          await page.press(strategy.passwordSelector, 'Enter');
          console.log(`🔘 Submetendo via Enter`);
          submitted = true;
        } catch (e) {}
      }
      
      if (submitted) {
        console.log('⏳ Aguardando redirecionamento...');
        try {
          await page.waitForLoadState('networkidle', { timeout: 15000 });
          await sleep(3000);
        } catch (e) {
          console.log('⚠️ Timeout no redirecionamento, mas continuando...');
        }
        return true;
      }
      
    } catch (error) {
      console.log(`❌ ${strategy.name} falhou: ${error.message}`);
      continue;
    }
  }
  
  return false;
}

// Função para descobrir rotas automaticamente
async function discoverRoutes(page, baseUrl, currentDepth = 0) {
  if (currentDepth >= CONFIG.maxDepth) {
    console.log(`🛑 Profundidade máxima atingida (${CONFIG.maxDepth})`);
    return [];
  }
  
  console.log(`🔍 Descobrindo rotas (profundidade ${currentDepth})...`);
  
  const elements = await analyzePageElements(page);
  const discoveredRoutes = [];
  
  // Coletar links de navegação
  const navigationLinks = [];
  
  // Links de menus
  elements.menus.forEach(menu => {
    menu.items.forEach(item => {
      if (item.href && !item.href.startsWith('#') && !item.href.startsWith('javascript:')) {
        navigationLinks.push({
          text: item.text,
          href: item.href,
          selector: item.selector,
          type: 'menu',
          priority: 10
        });
      }
    });
  });
  
  // Links gerais (com prioridade menor)
  elements.links.forEach(link => {
    if (!link.isExternal && !link.href.startsWith('#') && !link.href.startsWith('javascript:')) {
      navigationLinks.push({
        text: link.text,
        href: link.href,
        selector: link.selector,
        type: 'link',
        priority: 5
      });
    }
  });
  
  // Botões que podem ser navegação
  elements.buttons.forEach(button => {
    if (button.text && !button.text.toLowerCase().includes('submit') && 
        !button.text.toLowerCase().includes('save') &&
        !button.text.toLowerCase().includes('delete')) {
      navigationLinks.push({
        text: button.text,
        href: null,
        selector: button.selector,
        type: 'button',
        priority: 3
      });
    }
  });
  
  // Ordenar por prioridade
  navigationLinks.sort((a, b) => b.priority - a.priority);
  
  console.log(`🔗 Encontrados ${navigationLinks.length} links de navegação`);
  
  return navigationLinks;
}

// Função para interagir com formulários
async function interactWithForms(page, elements) {
  console.log(`📝 Analisando ${elements.forms.length} formulários...`);
  
  for (const form of elements.forms) {
    if (form.fields.length === 0) continue;
    
    console.log(`\n📋 Formulário encontrado: ${form.selector}`);
    console.log(`   - Action: ${form.action}`);
    console.log(`   - Method: ${form.method}`);
    console.log(`   - Campos: ${form.fields.length}`);
    
    // Verificar se é um formulário de busca ou filtro
    const isSearchForm = form.fields.some(field => 
      field.name && (field.name.toLowerCase().includes('search') ||
                     field.name.toLowerCase().includes('query') ||
                     field.name.toLowerCase().includes('filter'))
    );
    
    if (isSearchForm) {
      console.log(`🔍 Formulário de busca detectado`);
      
      const userChoice = await askUser(`Encontrei um formulário de busca. Devo preenchê-lo para descobrir mais conteúdo? (yes/no/skip)`);
      
      if (userChoice === 'yes') {
        const searchTerm = await askUser(`Que termo devo usar para busca? (ou 'test' para termo padrão)`);
        const term = searchTerm === 'test' ? 'test' : searchTerm;
        
        try {
          const searchField = form.fields.find(field => 
            field.type === 'text' || field.type === 'search'
          );
          
          if (searchField) {
            await page.fill(searchField.selector, term, { timeout: 5000 });
            await sleep(500);
            
            // Tentar submeter
            const submitButton = elements.buttons.find(button => 
              button.text && (button.text.toLowerCase().includes('search') ||
                             button.text.toLowerCase().includes('buscar') ||
                             button.type === 'submit')
            );
            
            if (submitButton) {
              await page.click(submitButton.selector, { timeout: 5000 });
              await page.waitForLoadState('networkidle', { timeout: 10000 });
              
              crawlingData.formInteractions.push({
                form: form.selector,
                action: 'search',
                term: term,
                timestamp: new Date().toISOString()
              });
              
              console.log(`✅ Busca realizada com termo: ${term}`);
            }
          }
        } catch (error) {
          console.log(`❌ Erro ao interagir com formulário de busca: ${error.message}`);
        }
      }
    } else {
      // Formulário regular - apenas documentar
      console.log(`📄 Formulário regular documentado`);
    }
  }
}

// Função para analisar página completa
async function analyzePage(page, url, depth = 0) {
  console.log(`\n🌐 ANALISANDO PÁGINA (Profundidade ${depth}): ${url}`);
  console.log('------------------------------------------------------------');
  
  try {
    const title = await page.title();
    
    // Capturar screenshot
    const screenshotName = `page-${crawlingData.pagesData.length + 1}-depth-${depth}`;
    await captureScreenshot(page, screenshotName);
    
    // Analisar elementos
    const elements = await analyzePageElements(page);
    
    // Interagir com formulários se necessário
    await interactWithForms(page, elements);
    
    // Descobrir rotas
    const routes = await discoverRoutes(page, url, depth);
    crawlingData.discoveredRoutes.push(...routes);
    
    // Compilar dados da página
    const pageData = {
      url: url,
      title: title,
      depth: depth,
      timestamp: new Date().toISOString(),
      elements: elements,
      routes: routes,
      screenshot: `crawling-${screenshotName}.png`,
      summary: {
        totalMenuItems: elements.menus.reduce((sum, menu) => sum + menu.items.length, 0),
        totalLinks: elements.links.length,
        totalForms: elements.forms.length,
        totalTables: elements.tables.length,
        totalActions: elements.buttons.length,
        totalRoutes: routes.length
      }
    };
    
    crawlingData.pagesData.push(pageData);
    
    // Atualizar estatísticas globais
    crawlingData.summary.totalPagesAnalyzed++;
    crawlingData.summary.totalMenuItems += pageData.summary.totalMenuItems;
    crawlingData.summary.totalLinks += pageData.summary.totalLinks;
    crawlingData.summary.totalForms += pageData.summary.totalForms;
    crawlingData.summary.totalTables += pageData.summary.totalTables;
    crawlingData.summary.totalActions += pageData.summary.totalActions;
    
    console.log(`📊 Análise da página:`);
    console.log(`   - Título: ${title}`);
    console.log(`   - Menus: ${pageData.summary.totalMenuItems}`);
    console.log(`   - Links: ${pageData.summary.totalLinks}`);
    console.log(`   - Formulários: ${pageData.summary.totalForms}`);
    console.log(`   - Tabelas: ${pageData.summary.totalTables}`);
    console.log(`   - Ações: ${pageData.summary.totalActions}`);
    console.log(`   - Rotas descobertas: ${pageData.summary.totalRoutes}`);
    
    return pageData;
    
  } catch (error) {
    console.log(`❌ Erro ao analisar página: ${error.message}`);
    return null;
  }
}

// Função para navegação inteligente
async function intelligentNavigation(page, baseUrl) {
  console.log(`\n🗺️ INICIANDO NAVEGAÇÃO INTELIGENTE`);
  console.log('======================================================================');
  
  const visitedUrls = new Set();
  const urlQueue = [{ url: baseUrl, depth: 0, source: 'initial' }];
  
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
      const pageData = await analyzePage(page, currentUrl, depth);
      
      if (pageData && pageData.routes) {
        // Adicionar novas rotas à fila
        for (const route of pageData.routes) {
          let fullUrl;
          
          if (route.href) {
            try {
              if (route.href.startsWith('http')) {
                fullUrl = route.href;
              } else if (route.href.startsWith('/')) {
                const baseUrlObj = new URL(baseUrl);
                fullUrl = `${baseUrlObj.protocol}//${baseUrlObj.host}${route.href}`;
              } else {
                fullUrl = new URL(route.href, currentUrl).href;
              }
              
              // Verificar se é do mesmo domínio e não visitado
              const urlObj = new URL(fullUrl);
              const baseUrlObj = new URL(baseUrl);
              
              if (urlObj.hostname === baseUrlObj.hostname && 
                  !visitedUrls.has(fullUrl) && 
                  !fullUrl.includes('logout') && 
                  !fullUrl.includes('signout') &&
                  !fullUrl.includes('exit')) {
                
                urlQueue.push({
                  url: fullUrl,
                  depth: depth + 1,
                  source: `${route.type}:${route.text}`
                });
                
                console.log(`🔗 Nova rota adicionada: ${fullUrl} (${route.type}: ${route.text})`);
              }
            } catch (e) {
              // URL inválida, ignorar
            }
          } else if (route.type === 'button') {
            // Para botões, tentar clicar e ver se navega
            try {
              console.log(`🔘 Testando botão: ${route.text}`);
              
              const currentUrlBefore = page.url();
              await page.click(route.selector, { timeout: 5000 });
              await sleep(2000);
              
              const currentUrlAfter = page.url();
              
              if (currentUrlAfter !== currentUrlBefore && !visitedUrls.has(currentUrlAfter)) {
                console.log(`✅ Botão navegou para: ${currentUrlAfter}`);
                
                urlQueue.push({
                  url: currentUrlAfter,
                  depth: depth + 1,
                  source: `button:${route.text}`
                });
              } else {
                // Voltar para a página original se não navegou
                if (currentUrlAfter !== currentUrlBefore) {
                  await page.goto(currentUrl, { waitUntil: 'networkidle', timeout: CONFIG.timeout });
                }
              }
            } catch (e) {
              console.log(`❌ Erro ao testar botão: ${e.message}`);
            }
          }
        }
      }
      
      // Verificar se deve solicitar ajuda do usuário
      if (pageData && pageData.routes.length === 0 && depth === 0) {
        const userHelp = await askUser(`Esta página não tem rotas de navegação óbvias. Há alguma área específica que devo explorar? (Descreva ou 'skip' para continuar)`);
        
        if (userHelp !== 'skip' && userHelp !== 'stop') {
          console.log(`📝 Sugestão do usuário: ${userHelp}`);
          // Aqui poderia implementar parsing das sugestões do usuário
        }
      }
      
    } catch (error) {
      console.log(`❌ Erro ao navegar para ${currentUrl}: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Navegação inteligente finalizada!`);
  console.log(`📊 Total de páginas visitadas: ${visitedUrls.size}`);
  console.log(`📊 Total de rotas descobertas: ${crawlingData.discoveredRoutes.length}`);
}

// Função para gerar relatório markdown completo
function generateComprehensiveReport() {
  console.log(`\n📝 GERANDO RELATÓRIO COMPLETO...`);
  
  let markdown = `# Relatório Completo de Crawling Genérico\n\n`;
  
  // Informações gerais
  markdown += `## 📋 Informações Gerais\n\n`;
  markdown += `- **Data/Hora**: ${crawlingData.timestamp}\n`;
  markdown += `- **URL Base**: ${crawlingData.testInfo.url}\n`;
  markdown += `- **Credenciais**: ${crawlingData.testInfo.credentials}\n`;
  markdown += `- **Tipo de Teste**: ${crawlingData.testInfo.testType}\n`;
  markdown += `- **Configurações**:\n`;
  markdown += `  - Máximo de páginas: ${CONFIG.maxPages}\n`;
  markdown += `  - Profundidade máxima: ${CONFIG.maxDepth}\n`;
  markdown += `  - Timeout: ${CONFIG.timeout}ms\n\n`;
  
  // Resumo executivo
  markdown += `## 📊 Resumo Executivo\n\n`;
  markdown += `- **Total de Páginas Analisadas**: ${crawlingData.summary.totalPagesAnalyzed}\n`;
  markdown += `- **Total de URLs Visitadas**: ${crawlingData.visitedUrls.size}\n`;
  markdown += `- **Total de Itens de Menu**: ${crawlingData.summary.totalMenuItems}\n`;
  markdown += `- **Total de Links**: ${crawlingData.summary.totalLinks}\n`;
  markdown += `- **Total de Formulários**: ${crawlingData.summary.totalForms}\n`;
  markdown += `- **Total de Tabelas**: ${crawlingData.summary.totalTables}\n`;
  markdown += `- **Total de Elementos de Ação**: ${crawlingData.summary.totalActions}\n`;
  markdown += `- **Total de Rotas Descobertas**: ${crawlingData.discoveredRoutes.length}\n`;
  markdown += `- **Screenshots Capturados**: ${crawlingData.screenshots.length}\n`;
  markdown += `- **Interações do Usuário**: ${crawlingData.summary.totalUserInteractions}\n\n`;
  
  // Processo de login
  if (crawlingData.loginProcess.length > 0) {
    markdown += `## 🔑 Processo de Login\n\n`;
    crawlingData.loginProcess.forEach((attempt, index) => {
      markdown += `### Tentativa ${attempt.attempt}\n\n`;
      markdown += `- **URL**: [${attempt.url}](${attempt.url})\n`;
      markdown += `- **Título**: ${attempt.title}\n`;
      markdown += `- **Tipo de Página**: ${attempt.pageType}\n`;
      markdown += `- **Timestamp**: ${attempt.timestamp}\n\n`;
    });
  }
  
  // Interações do usuário
  if (crawlingData.userInteractions.length > 0) {
    markdown += `## 🤝 Interações do Usuário\n\n`;
    crawlingData.userInteractions.forEach((interaction, index) => {
      markdown += `${index + 1}. **Pergunta**: ${interaction.question}\n`;
      markdown += `   **Resposta**: ${interaction.answer}\n`;
      markdown += `   **Timestamp**: ${interaction.timestamp}\n\n`;
    });
  }
  
  // URLs visitadas
  markdown += `## 🌐 URLs Visitadas\n\n`;
  Array.from(crawlingData.visitedUrls).forEach((url, index) => {
    markdown += `${index + 1}. [${url}](${url})\n`;
  });
  markdown += `\n`;
  
  // Rotas descobertas
  if (crawlingData.discoveredRoutes.length > 0) {
    markdown += `## 🗺️ Rotas Descobertas\n\n`;
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
  markdown += `## 📄 Análise Detalhada das Páginas\n\n`;
  
  crawlingData.pagesData.forEach((page, index) => {
    markdown += `### ${index + 1}. ${page.title} (Profundidade ${page.depth})\n\n`;
    markdown += `- **URL**: [${page.url}](${page.url})\n`;
    markdown += `- **Screenshot**: ${page.screenshot}\n`;
    markdown += `- **Timestamp**: ${page.timestamp}\n\n`;
    
    // Menus
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
    
    // Links
    if (page.elements.links && page.elements.links.length > 0) {
      markdown += `#### 🔗 Links (${page.elements.links.length} encontrados)\n\n`;
      page.elements.links.slice(0, 10).forEach((link, idx) => {
        markdown += `${idx + 1}. **${link.text}** → \`${link.href}\`\n`;
      });
      if (page.elements.links.length > 10) {
        markdown += `\n*... e mais ${page.elements.links.length - 10} links*\n`;
      }
      markdown += `\n`;
    }
    
    // Formulários
    if (page.elements.forms && page.elements.forms.length > 0) {
      markdown += `#### 📝 Formulários (${page.elements.forms.length} encontrados)\n\n`;
      page.elements.forms.forEach((form, idx) => {
        markdown += `${idx + 1}. **Formulário ${idx + 1}**\n`;
        markdown += `   - Action: \`${form.action}\`\n`;
        markdown += `   - Method: \`${form.method}\`\n`;
        markdown += `   - Campos (${form.fields.length}):\n`;
        form.fields.forEach((field, fieldIdx) => {
          markdown += `     ${fieldIdx + 1}. **${field.name || 'Campo sem nome'}** (${field.type})\n`;
          if (field.placeholder) markdown += `        - Placeholder: "${field.placeholder}"\n`;
          markdown += `        - Obrigatório: ${field.required ? 'Sim' : 'Não'}\n`;
        });
        markdown += `\n`;
      });
    }
    
    // Tabelas
    if (page.elements.tables && page.elements.tables.length > 0) {
      markdown += `#### 📊 Tabelas (${page.elements.tables.length} encontradas)\n\n`;
      page.elements.tables.forEach((table, idx) => {
        markdown += `${idx + 1}. **Tabela ${idx + 1}**\n`;
        markdown += `   - Linhas: ${table.rowCount}\n`;
        markdown += `   - Possui Cabeçalhos: ${table.hasHeaders ? 'Sim' : 'Não'}\n`;
        if (table.headers.length > 0) {
          markdown += `   - Cabeçalhos: ${table.headers.join(', ')}\n`;
        }
        markdown += `\n`;
      });
    }
    
    // Botões/Ações
    if (page.elements.buttons && page.elements.buttons.length > 0) {
      markdown += `#### 🎯 Elementos de Ação (${page.elements.buttons.length} encontrados)\n\n`;
      page.elements.buttons.forEach((button, idx) => {
        markdown += `${idx + 1}. **${button.text}**\n`;
        markdown += `   - Tipo: \`${button.type}\`\n`;
        markdown += `   - Desabilitado: ${button.disabled ? 'Sim' : 'Não'}\n`;
        markdown += `   - Seletor: \`${button.selector}\`\n\n`;
      });
    }
    
    markdown += `---\n\n`;
  });
  
  // Interações com formulários
  if (crawlingData.formInteractions.length > 0) {
    markdown += `## 📝 Interações com Formulários\n\n`;
    crawlingData.formInteractions.forEach((interaction, index) => {
      markdown += `${index + 1}. **${interaction.action}** em \`${interaction.form}\`\n`;
      if (interaction.term) markdown += `   - Termo usado: "${interaction.term}"\n`;
      markdown += `   - Timestamp: ${interaction.timestamp}\n\n`;
    });
  }
  
  // Screenshots
  markdown += `## 📸 Screenshots Capturados\n\n`;
  crawlingData.screenshots.forEach((screenshot, index) => {
    markdown += `${index + 1}. ${screenshot}\n`;
  });
  markdown += `\n`;
  
  // Conclusões e recomendações
  markdown += `## 🎯 Conclusões e Recomendações\n\n`;
  
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
  
  if (crawlingData.summary.totalUserInteractions > 0) {
    markdown += `- **Interação Humana**: ${crawlingData.summary.totalUserInteractions} interações com usuário foram necessárias\n`;
  }
  
  markdown += `\n### 🔧 Recomendações Técnicas\n\n`;
  markdown += `1. **Documentação**: Este relatório serve como base para documentação técnica completa\n`;
  markdown += `2. **Automação**: Os seletores identificados podem ser utilizados para automação de testes\n`;
  markdown += `3. **Manutenção**: A estrutura mapeada facilita futuras manutenções e atualizações\n`;
  markdown += `4. **Integração**: APIs e formulários identificados podem ser integrados com outros sistemas\n`;
  markdown += `5. **Monitoramento**: As rotas descobertas podem ser monitoradas para mudanças\n\n`;
  
  if (crawlingData.discoveredRoutes.length > 20) {
    markdown += `### ⚠️ Observações\n\n`;
    markdown += `- **Sistema Complexo**: Foram descobertas ${crawlingData.discoveredRoutes.length} rotas, indicando alta complexidade\n`;
    markdown += `- **Análise Parcial**: Devido ao limite de páginas (${CONFIG.maxPages}), pode haver áreas não exploradas\n`;
    markdown += `- **Recomendação**: Considere executar análises específicas em áreas de interesse\n\n`;
  }
  
  markdown += `---\n\n`;
  markdown += `*Relatório gerado automaticamente em ${new Date().toLocaleString('pt-BR')}*\n`;
  markdown += `*Ferramenta: Crawler Genérico Inteligente v2.0*\n`;
  
  return markdown;
}

// Função principal
async function main() {
  console.log('🔧 Iniciando teste completo de crawling genérico...');
  console.log('🚀 CRAWLING GENÉRICO COMPLETO - VERSÃO INTELIGENTE');
  console.log('======================================================================');
  console.log(`📋 URL: ${CONFIG.url}`);
  console.log(`🔑 Credenciais: ${CONFIG.username} / ${CONFIG.password}`);
  console.log(`🎯 Objetivo: Crawling completo e inteligente de qualquer aplicação`);
  console.log(`⚙️ Configurações:`);
  console.log(`   - Máximo de páginas: ${CONFIG.maxPages}`);
  console.log(`   - Profundidade máxima: ${CONFIG.maxDepth}`);
  console.log(`   - Timeout: ${CONFIG.timeout}ms`);
  
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
      
      const attemptSuccess = await attemptSmartLogin(page);
      
      if (attemptSuccess) {
        await sleep(3000);
        const newUrl = page.url();
        const newTitle = await page.title();
        
        console.log(`📍 Nova URL: ${newUrl}`);
        console.log(`📄 Novo título: ${newTitle}`);
        
        // Verificar se o login foi bem-sucedido
        if (!newUrl.includes('signin') && !newUrl.includes('login') && 
            (newUrl !== currentUrl || newTitle !== currentTitle)) {
          console.log('✅ LOGIN COMPLETADO COM SUCESSO!');
          loginSuccess = true;
          await captureScreenshot(page, '02-logado');
        } else {
          console.log(`❌ Login não completado na tentativa ${attempts}`);
        }
      } else {
        console.log(`❌ Falha na tentativa ${attempts}`);
      }
    }
    
    if (!loginSuccess) {
      const userChoice = await askUser('Não foi possível completar o login automaticamente. Deseja continuar sem login? (yes/no)');
      if (userChoice === 'no' || userChoice === 'stop') {
        throw new Error('Teste interrompido - login necessário');
      }
      console.log('⚠️ Continuando sem login...');
    }
    
    // ETAPA 3: Crawling inteligente da aplicação
    console.log(`\n🗺️ ETAPA 3: CRAWLING INTELIGENTE DA APLICAÇÃO`);
    console.log('======================================================================');
    
    const currentUrl = page.url();
    await intelligentNavigation(page, currentUrl);
    
    // ETAPA 4: Geração do relatório completo
    console.log(`\n📝 ETAPA 4: GERAÇÃO DO RELATÓRIO COMPLETO`);
    console.log('======================================================================');
    
    const markdownContent = generateComprehensiveReport();
    const markdownFilename = 'crawling-generico-relatorio-completo.md';
    fs.writeFileSync(markdownFilename, markdownContent, 'utf8');
    
    // Salvar dados JSON também
    const jsonData = {
      ...crawlingData,
      visitedUrls: Array.from(crawlingData.visitedUrls)
    };
    const jsonFilename = 'crawling-generico-dados-completos.json';
    fs.writeFileSync(jsonFilename, JSON.stringify(jsonData, null, 2), 'utf8');
    
    console.log(`\n📊 RELATÓRIO FINAL DO CRAWLING GENÉRICO COMPLETO`);
    console.log('======================================================================');
    console.log(`🌐 Total de páginas analisadas: ${crawlingData.summary.totalPagesAnalyzed}`);
    console.log(`🔗 URLs visitadas: ${crawlingData.visitedUrls.size}`);
    console.log(`📋 Total de menus encontrados: ${crawlingData.summary.totalMenuItems}`);
    console.log(`🔗 Total de links: ${crawlingData.summary.totalLinks}`);
    console.log(`📝 Total de formulários: ${crawlingData.summary.totalForms}`);
    console.log(`📊 Total de tabelas: ${crawlingData.summary.totalTables}`);
    console.log(`🎯 Total de ações: ${crawlingData.summary.totalActions}`);
    console.log(`🗺️ Total de rotas descobertas: ${crawlingData.discoveredRoutes.length}`);
    console.log(`🤝 Interações com usuário: ${crawlingData.summary.totalUserInteractions}`);
    console.log(`\n💾 ARQUIVOS GERADOS:`);
    console.log(`   - Relatório Markdown: ${markdownFilename}`);
    console.log(`   - Dados JSON: ${jsonFilename}`);
    console.log(`   - Screenshots: ${crawlingData.screenshots.length} arquivos`);
    
    console.log(`\n🎯 CRAWLING GENÉRICO COMPLETO FINALIZADO COM SUCESSO!`);
    console.log('============================================================');
    console.log('✅ Login inteligente (com suporte a interação humana)');
    console.log('✅ Descoberta automática de rotas e navegação');
    console.log('✅ Análise detalhada de todas as páginas encontradas');
    console.log('✅ Interação inteligente com formulários');
    console.log('✅ Extração completa de menus, links, tabelas e ações');
    console.log('✅ Captura de screenshots de todas as páginas');
    console.log('✅ Geração de relatório markdown abrangente');
    console.log('✅ Dados estruturados salvos em JSON');
    console.log('✅ Suporte a interação humana quando necessário');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    await captureScreenshot(page, 'erro-final');
  } finally {
    rl.close();
    console.log('\n⏳ Aguardando 5 segundos antes de fechar...');
    await sleep(5000);
    await browser.close();
  }
}

// Executar o teste
main().catch(console.error);