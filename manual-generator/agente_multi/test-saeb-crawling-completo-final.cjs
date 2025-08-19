const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configurações do teste
const CONFIG = {
  url: 'https://saeb-h1.pmfi.pr.gov.br/auth/signin',
  username: 'admin',
  password: 'admin123',
  timeout: 30000,
  maxPages: 50,
  screenshotDelay: 2000
};

// Dados coletados durante o crawling
let crawlingData = {
  timestamp: new Date().toISOString(),
  testInfo: {
    url: CONFIG.url,
    credentials: `${CONFIG.username}/${CONFIG.password}`,
    testType: 'crawling_completo_com_markdown_final'
  },
  loginProcess: [],
  visitedUrls: [],
  pagesData: [],
  menuStructure: [],
  screenshots: [],
  summary: {
    totalPagesAnalyzed: 0,
    totalMenuItems: 0,
    totalForms: 0,
    totalTables: 0,
    totalActions: 0,
    totalLinks: 0
  }
};

// Função para aguardar um tempo
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função para capturar screenshot
async function captureScreenshot(page, name) {
  try {
    const filename = `saeb-${name}.png`;
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
      title: document.title,
      url: window.location.href
    };
    
    // Analisar inputs
    document.querySelectorAll('input').forEach((input, index) => {
      result.inputs.push({
        index: index,
        type: input.type,
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
        className: input.className,
        selector: input.id ? `#${input.id}` : (input.name ? `input[name="${input.name}"]` : `input:nth-of-type(${index + 1})`)
      });
    });
    
    // Analisar botões
    document.querySelectorAll('button, input[type="submit"], input[type="button"]').forEach((button, index) => {
      result.buttons.push({
        index: index,
        type: button.type || button.tagName.toLowerCase(),
        text: button.textContent?.trim() || button.value,
        id: button.id,
        className: button.className,
        selector: button.id ? `#${button.id}` : `button:nth-of-type(${index + 1})`
      });
    });
    
    // Analisar links
    document.querySelectorAll('a').forEach((link, index) => {
      result.links.push({
        index: index,
        text: link.textContent?.trim(),
        href: link.href,
        id: link.id,
        className: link.className
      });
    });
    
    // Analisar formulários
    document.querySelectorAll('form').forEach((form, index) => {
      result.forms.push({
        index: index,
        action: form.action,
        method: form.method,
        id: form.id,
        className: form.className
      });
    });
    
    return result;
  });
  
  console.log(`📊 Elementos encontrados:`);
  console.log(`   - Inputs: ${elements.inputs.length}`);
  console.log(`   - Botões: ${elements.buttons.length}`);
  console.log(`   - Links: ${elements.links.length}`);
  console.log(`   - Formulários: ${elements.forms.length}`);
  
  if (elements.inputs.length > 0) {
    console.log(`\n📝 Inputs detectados:`);
    elements.inputs.forEach((input, index) => {
      console.log(`   ${index + 1}. Tipo: ${input.type}, Nome: ${input.name}, ID: ${input.id}, Placeholder: ${input.placeholder}`);
    });
  }
  
  if (elements.buttons.length > 0) {
    console.log(`\n🔘 Botões detectados:`);
    elements.buttons.forEach((button, index) => {
      console.log(`   ${index + 1}. Texto: "${button.text}", Tipo: ${button.type}, ID: ${button.id}`);
    });
  }
  
  return elements;
}

// Função para tentar login com análise dinâmica
async function attemptSmartLogin(page) {
  console.log('🧠 Tentando login inteligente...');
  
  // Analisar elementos da página
  const elements = await analyzePageElements(page);
  
  if (elements.inputs.length === 0) {
    console.log('⚠️ Nenhum input encontrado na página');
    
    // Verificar se há botão de "Fazer Login" ou similar
    const loginButton = elements.buttons.find(button => 
      button.text && (button.text.toLowerCase().includes('login') || 
                     button.text.toLowerCase().includes('entrar') || 
                     button.text.toLowerCase().includes('acessar'))
    );
    
    if (loginButton) {
      console.log(`🔘 Encontrado botão de login: "${loginButton.text}" - Clicando...`);
      try {
        await page.click(loginButton.selector, { timeout: 5000 });
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        await sleep(3000);
        
        // Tentar novamente após clicar no botão
        console.log('🔄 Tentando login novamente após clicar no botão...');
        return await attemptSmartLogin(page);
      } catch (error) {
        console.log(`❌ Erro ao clicar no botão de login: ${error.message}`);
      }
    }
    
    console.log('❌ Nenhum input ou botão de login utilizável encontrado');
    return false;
  }
  
  // Estratégias baseadas na análise
  const strategies = [];
  
  // Estratégia 1: Usar inputs por nome específico
  const usernameInput = elements.inputs.find(input => 
    input.name && (input.name.toLowerCase().includes('username') || 
                   input.name.toLowerCase().includes('email') || 
                   input.name.toLowerCase().includes('login'))
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
  
  // Estratégia 2: Usar primeiro input de texto e primeiro password
  const firstTextInput = elements.inputs.find(input => 
    input.type === 'text' || input.type === 'email' || !input.type
  );
  const firstPasswordInput = elements.inputs.find(input => input.type === 'password');
  
  if (firstTextInput && firstPasswordInput) {
    strategies.push({
      name: 'Primeiro texto + primeiro password',
      usernameSelector: firstTextInput.selector,
      passwordSelector: firstPasswordInput.selector
    });
  }
  
  // Estratégia 3: Usar os dois primeiros inputs
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
      console.log(`   - Username: ${strategy.usernameSelector}`);
      console.log(`   - Password: ${strategy.passwordSelector}`);
      
      // Aguardar página carregar
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      await sleep(2000);
      
      // Preencher campos
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
      
      // Se não encontrou botão específico, tentar qualquer botão
      if (!submitted && elements.buttons.length > 0) {
        try {
          await page.click(elements.buttons[0].selector, { timeout: 3000 });
          console.log(`🔘 Submetendo via primeiro botão`);
          submitted = true;
        } catch (e) {
          // Continuar
        }
      }
      
      // Se ainda não submeteu, tentar Enter
      if (!submitted) {
        try {
          await page.press(strategy.passwordSelector, 'Enter');
          console.log(`🔘 Submetendo via Enter`);
          submitted = true;
        } catch (e) {
          // Continuar
        }
      }
      
      if (submitted) {
        // Aguardar redirecionamento
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

// Função para processar login no Keycloak
async function processKeycloakLogin(page) {
  console.log('🔐 Processando login Keycloak...');
  
  try {
    // Aguardar página carregar
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await sleep(2000);
    
    // Tentar preencher campos do Keycloak
    await page.fill('#username', CONFIG.username, { timeout: 8000 });
    await page.fill('#password', CONFIG.password, { timeout: 8000 });
    
    console.log('✅ Campos Keycloak preenchidos!');
    
    // Submeter
    await page.click('#kc-login', { timeout: 5000 });
    console.log('🔘 Submetendo login Keycloak');
    
    // Aguardar redirecionamento
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await sleep(3000);
    
    return true;
    
  } catch (error) {
    console.log(`❌ Login Keycloak falhou: ${error.message}`);
    return false;
  }
}

// Função para detectar tipo de página
function detectPageType(url, title) {
  if (url.includes('keycloak') || title.toLowerCase().includes('sign in') || title.toLowerCase().includes('realm')) {
    return 'keycloak';
  }
  if (url.includes('saeb') || url.includes('pmfi')) {
    return 'saeb';
  }
  return 'generic';
}

// Função para analisar página completa
async function analyzePage(page, url) {
  console.log(`\n🌐 ANALISANDO PÁGINA: ${url}`);
  console.log('------------------------------------------------------------');
  
  try {
    const title = await page.title();
    
    // Capturar screenshot
    const screenshotName = `page-${crawlingData.pagesData.length + 1}`;
    await captureScreenshot(page, screenshotName);
    
    // Analisar elementos da página
    const pageData = await page.evaluate(() => {
      // Função para extrair texto limpo
      function getCleanText(element) {
        return element.textContent?.trim().replace(/\s+/g, ' ') || '';
      }
      
      // Função para gerar seletor único
      function getUniqueSelector(element) {
        if (element.id) return `#${element.id}`;
        if (element.className) {
          const classes = element.className.split(' ').filter(c => c.length > 0);
          if (classes.length > 0) return `.${classes[0]}`;
        }
        return element.tagName.toLowerCase();
      }
      
      // Extrair menus e navegação
      const menuItems = [];
      const menuSelectors = [
        'nav a', 'ul.menu a', '.menu a', '.navigation a', '.navbar a',
        '[role="navigation"] a', '.sidebar a', '.nav a', 'header a',
        'a[href^="/"]', 'a[href*="saeb"]', 'a[href*="pmfi"]'
      ];
      
      menuSelectors.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(link => {
            const text = getCleanText(link);
            const href = link.getAttribute('href');
            if (text && href && text.length > 1 && text.length < 100) {
              menuItems.push({
                text: text,
                href: href,
                selector: getUniqueSelector(link),
                type: 'menu_link'
              });
            }
          });
        } catch (e) {}
      });
      
      // Extrair todos os links
      const allLinks = [];
      document.querySelectorAll('a[href]').forEach(link => {
        const text = getCleanText(link);
        const href = link.getAttribute('href');
        if (text && href) {
          allLinks.push({
            text: text,
            href: href,
            selector: getUniqueSelector(link)
          });
        }
      });
      
      // Extrair formulários
      const forms = [];
      document.querySelectorAll('form').forEach((form, index) => {
        const formData = {
          selector: getUniqueSelector(form) || `form:nth-of-type(${index + 1})`,
          action: form.getAttribute('action') || '',
          method: form.getAttribute('method') || 'GET',
          fields: []
        };
        
        form.querySelectorAll('input, select, textarea').forEach(field => {
          if (field.type !== 'hidden') {
            formData.fields.push({
              name: field.getAttribute('name') || '',
              type: field.type || field.tagName.toLowerCase(),
              placeholder: field.getAttribute('placeholder') || '',
              required: field.hasAttribute('required'),
              selector: getUniqueSelector(field)
            });
          }
        });
        
        forms.push(formData);
      });
      
      // Extrair tabelas
      const tables = [];
      document.querySelectorAll('table').forEach((table, index) => {
        const headers = Array.from(table.querySelectorAll('th')).map(th => getCleanText(th));
        const rowCount = table.querySelectorAll('tbody tr, tr').length;
        
        tables.push({
          selector: getUniqueSelector(table) || `table:nth-of-type(${index + 1})`,
          headers: headers,
          rowCount: rowCount,
          hasHeaders: headers.length > 0
        });
      });
      
      // Extrair elementos de ação
      const actionElements = [];
      const actionSelectors = [
        'button', 'input[type="button"]', 'input[type="submit"]',
        '.btn', '.button', '[role="button"]', 'a.action', '.action'
      ];
      
      actionSelectors.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(element => {
            const text = getCleanText(element);
            if (text && text.length > 0 && text.length < 50) {
              actionElements.push({
                text: text,
                type: element.tagName.toLowerCase(),
                className: element.className || '',
                selector: getUniqueSelector(element)
              });
            }
          });
        } catch (e) {}
      });
      
      // Analisar estrutura da página
      const pageStructure = {
        hasHeader: !!document.querySelector('header, .header, #header'),
        hasFooter: !!document.querySelector('footer, .footer, #footer'),
        hasSidebar: !!document.querySelector('aside, .sidebar, .side-nav, nav.sidebar'),
        hasMainContent: !!document.querySelector('main, .main, #main, .content, #content')
      };
      
      return {
        menuItems: menuItems,
        allLinks: allLinks,
        forms: forms,
        tables: tables,
        actionElements: actionElements,
        pageStructure: pageStructure
      };
    });
    
    // Compilar dados da página
    const compiledPageData = {
      url: url,
      title: title,
      timestamp: new Date().toISOString(),
      ...pageData,
      summary: {
        totalMenuItems: pageData.menuItems.length,
        totalLinks: pageData.allLinks.length,
        totalForms: pageData.forms.length,
        totalTables: pageData.tables.length,
        totalActions: pageData.actionElements.length
      },
      screenshot: `saeb-${screenshotName}.png`
    };
    
    crawlingData.pagesData.push(compiledPageData);
    
    // Atualizar estatísticas globais
    crawlingData.summary.totalPagesAnalyzed++;
    crawlingData.summary.totalMenuItems += pageData.menuItems.length;
    crawlingData.summary.totalLinks += pageData.allLinks.length;
    crawlingData.summary.totalForms += pageData.forms.length;
    crawlingData.summary.totalTables += pageData.tables.length;
    crawlingData.summary.totalActions += pageData.actionElements.length;
    
    console.log(`📊 Análise da página:`);
    console.log(`   - Título: ${title}`);
    console.log(`   - Menus: ${pageData.menuItems.length}`);
    console.log(`   - Links: ${pageData.allLinks.length}`);
    console.log(`   - Formulários: ${pageData.forms.length}`);
    console.log(`   - Tabelas: ${pageData.tables.length}`);
    console.log(`   - Ações: ${pageData.actionElements.length}`);
    
    return compiledPageData;
    
  } catch (error) {
    console.log(`❌ Erro ao analisar página: ${error.message}`);
    return null;
  }
}

// Função para navegar por links encontrados
async function navigateAndAnalyze(page, baseUrl) {
  console.log(`\n🗺️ INICIANDO NAVEGAÇÃO COMPLETA DA APLICAÇÃO`);
  console.log('======================================================================');
  
  const visitedUrls = new Set();
  const urlsToVisit = [baseUrl];
  
  while (urlsToVisit.length > 0 && visitedUrls.size < CONFIG.maxPages) {
    const currentUrl = urlsToVisit.shift();
    
    if (visitedUrls.has(currentUrl)) {
      continue;
    }
    
    try {
      console.log(`\n🌐 Navegando para: ${currentUrl}`);
      await page.goto(currentUrl, { waitUntil: 'networkidle', timeout: CONFIG.timeout });
      await sleep(CONFIG.screenshotDelay);
      
      visitedUrls.add(currentUrl);
      crawlingData.visitedUrls.push(currentUrl);
      
      // Analisar a página atual
      const pageData = await analyzePage(page, currentUrl);
      
      if (pageData) {
        // Adicionar novos links para visitar (tanto menus quanto links gerais)
        const allLinksToCheck = [...(pageData.menuItems || []), ...(pageData.allLinks || [])];
        
        allLinksToCheck.forEach(item => {
          if (item.href) {
            let fullUrl;
            try {
              if (item.href.startsWith('http')) {
                fullUrl = item.href;
              } else if (item.href.startsWith('/')) {
                const baseUrlObj = new URL(baseUrl);
                fullUrl = `${baseUrlObj.protocol}//${baseUrlObj.host}${item.href}`;
              } else {
                fullUrl = new URL(item.href, currentUrl).href;
              }
              
              // Só adicionar URLs do mesmo domínio e que não sejam logout/external
              if ((fullUrl.includes('saeb') || fullUrl.includes('pmfi')) && 
                  !fullUrl.includes('logout') && 
                  !fullUrl.includes('signout') &&
                  !visitedUrls.has(fullUrl) && 
                  !urlsToVisit.includes(fullUrl)) {
                urlsToVisit.push(fullUrl);
                console.log(`🔗 Novo link adicionado: ${fullUrl}`);
              }
            } catch (e) {
              // URL inválida, ignorar
            }
          }
        });
      }
      
    } catch (error) {
      console.log(`❌ Erro ao navegar para ${currentUrl}: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Navegação completa finalizada!`);
  console.log(`📊 Total de páginas visitadas: ${visitedUrls.size}`);
}

// Função para gerar relatório markdown
function generateMarkdownReport() {
  console.log(`\n📝 GERANDO RELATÓRIO MARKDOWN COMPLETO...`);
  
  let markdown = `# Relatório Completo de Crawling - Sistema SAEB\n\n`;
  
  // Informações gerais
  markdown += `## 📋 Informações Gerais\n\n`;
  markdown += `- **Data/Hora**: ${crawlingData.timestamp}\n`;
  markdown += `- **URL Base**: ${crawlingData.testInfo.url}\n`;
  markdown += `- **Credenciais**: ${crawlingData.testInfo.credentials}\n`;
  markdown += `- **Tipo de Teste**: ${crawlingData.testInfo.testType}\n\n`;
  
  // Resumo executivo
  markdown += `## 📊 Resumo Executivo\n\n`;
  markdown += `- **Total de Páginas Analisadas**: ${crawlingData.summary.totalPagesAnalyzed}\n`;
  markdown += `- **Total de Itens de Menu**: ${crawlingData.summary.totalMenuItems}\n`;
  markdown += `- **Total de Links**: ${crawlingData.summary.totalLinks}\n`;
  markdown += `- **Total de Formulários**: ${crawlingData.summary.totalForms}\n`;
  markdown += `- **Total de Tabelas**: ${crawlingData.summary.totalTables}\n`;
  markdown += `- **Total de Elementos de Ação**: ${crawlingData.summary.totalActions}\n`;
  markdown += `- **Screenshots Capturados**: ${crawlingData.screenshots.length}\n\n`;
  
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
  
  // URLs visitadas
  markdown += `## 🌐 URLs Visitadas\n\n`;
  crawlingData.visitedUrls.forEach((url, index) => {
    markdown += `${index + 1}. [${url}](${url})\n`;
  });
  markdown += `\n`;
  
  // Análise detalhada de cada página
  markdown += `## 📄 Análise Detalhada das Páginas\n\n`;
  
  crawlingData.pagesData.forEach((page, index) => {
    markdown += `### ${index + 1}. ${page.title}\n\n`;
    markdown += `- **URL**: [${page.url}](${page.url})\n`;
    markdown += `- **Screenshot**: ${page.screenshot}\n`;
    markdown += `- **Timestamp**: ${page.timestamp}\n\n`;
    
    // Estrutura da página
    markdown += `#### 🏗️ Estrutura da Página\n\n`;
    markdown += `- **Header**: ${page.pageStructure.hasHeader ? '✅ Presente' : '❌ Ausente'}\n`;
    markdown += `- **Footer**: ${page.pageStructure.hasFooter ? '✅ Presente' : '❌ Ausente'}\n`;
    markdown += `- **Sidebar**: ${page.pageStructure.hasSidebar ? '✅ Presente' : '❌ Ausente'}\n`;
    markdown += `- **Conteúdo Principal**: ${page.pageStructure.hasMainContent ? '✅ Presente' : '❌ Ausente'}\n\n`;
    
    // Menus e navegação
    if (page.menuItems && page.menuItems.length > 0) {
      markdown += `#### 🧭 Menus e Navegação (${page.menuItems.length} itens)\n\n`;
      page.menuItems.forEach((item, idx) => {
        markdown += `${idx + 1}. **${item.text}**\n`;
        markdown += `   - Link: \`${item.href}\`\n`;
        markdown += `   - Seletor: \`${item.selector}\`\n\n`;
      });
    }
    
    // Todos os links
    if (page.allLinks && page.allLinks.length > 0) {
      markdown += `#### 🔗 Todos os Links (${page.allLinks.length} encontrados)\n\n`;
      page.allLinks.slice(0, 20).forEach((link, idx) => { // Limitar a 20 para não ficar muito longo
        markdown += `${idx + 1}. **${link.text}** → \`${link.href}\`\n`;
      });
      if (page.allLinks.length > 20) {
        markdown += `\n*... e mais ${page.allLinks.length - 20} links*\n`;
      }
      markdown += `\n`;
    }
    
    // Formulários
    if (page.forms && page.forms.length > 0) {
      markdown += `#### 📝 Formulários (${page.forms.length} encontrados)\n\n`;
      page.forms.forEach((form, idx) => {
        markdown += `${idx + 1}. **Formulário ${idx + 1}**\n`;
        markdown += `   - Seletor: \`${form.selector}\`\n`;
        markdown += `   - Action: \`${form.action}\`\n`;
        markdown += `   - Method: \`${form.method}\`\n`;
        markdown += `   - Campos (${form.fields.length}):\n`;
        form.fields.forEach((field, fieldIdx) => {
          markdown += `     ${fieldIdx + 1}. **${field.name || 'Campo sem nome'}** (${field.type})\n`;
          if (field.placeholder) markdown += `        - Placeholder: "${field.placeholder}"\n`;
          markdown += `        - Obrigatório: ${field.required ? 'Sim' : 'Não'}\n`;
          markdown += `        - Seletor: \`${field.selector}\`\n`;
        });
        markdown += `\n`;
      });
    }
    
    // Tabelas
    if (page.tables && page.tables.length > 0) {
      markdown += `#### 📊 Tabelas (${page.tables.length} encontradas)\n\n`;
      page.tables.forEach((table, idx) => {
        markdown += `${idx + 1}. **Tabela ${idx + 1}**\n`;
        markdown += `   - Seletor: \`${table.selector}\`\n`;
        markdown += `   - Linhas: ${table.rowCount}\n`;
        markdown += `   - Possui Cabeçalhos: ${table.hasHeaders ? 'Sim' : 'Não'}\n`;
        if (table.headers.length > 0) {
          markdown += `   - Cabeçalhos: ${table.headers.join(', ')}\n`;
        }
        markdown += `\n`;
      });
    }
    
    // Elementos de ação
    if (page.actionElements && page.actionElements.length > 0) {
      markdown += `#### 🎯 Elementos de Ação (${page.actionElements.length} encontrados)\n\n`;
      page.actionElements.forEach((action, idx) => {
        markdown += `${idx + 1}. **${action.text}**\n`;
        markdown += `   - Tipo: \`${action.type}\`\n`;
        markdown += `   - Classe: \`${action.className}\`\n`;
        markdown += `   - Seletor: \`${action.selector}\`\n\n`;
      });
    }
    
    markdown += `---\n\n`;
  });
  
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
  
  markdown += `\n### 📋 Estrutura do Sistema\n\n`;
  markdown += `O sistema SAEB apresenta uma arquitetura web moderna com as seguintes características:\n\n`;
  
  const hasAuthentication = crawlingData.visitedUrls.some(url => url.includes('auth') || url.includes('login'));
  if (hasAuthentication) {
    markdown += `- **Autenticação**: Sistema integrado com Keycloak para controle de acesso\n`;
  }
  
  markdown += `- **Páginas Mapeadas**: ${crawlingData.summary.totalPagesAnalyzed} páginas foram identificadas e analisadas\n`;
  markdown += `- **Funcionalidades**: Sistema focado em análise de gabaritos PDFs do IDEB\n\n`;
  
  markdown += `### 🔧 Recomendações Técnicas\n\n`;
  markdown += `1. **Documentação**: Este relatório serve como base para documentação técnica do sistema\n`;
  markdown += `2. **Testes**: Os seletores identificados podem ser utilizados para automação de testes\n`;
  markdown += `3. **Manutenção**: A estrutura mapeada facilita futuras manutenções e atualizações\n`;
  markdown += `4. **Integração**: Os formulários e APIs identificados podem ser integrados com outros sistemas\n\n`;
  
  markdown += `---\n\n`;
  markdown += `*Relatório gerado automaticamente em ${new Date().toLocaleString('pt-BR')}*\n`;
  
  return markdown;
}

// Função principal
async function main() {
  console.log('🔧 Iniciando teste completo com crawling total e geração de markdown...');
  console.log('🚀 TESTE COMPLETO - CRAWLING TOTAL + MARKDOWN FINAL');
  console.log('======================================================================');
  console.log(`📋 URL: ${CONFIG.url}`);
  console.log(`🔑 Credenciais: ${CONFIG.username} / ${CONFIG.password}`);
  console.log(`🎯 Objetivo: Login + Crawling completo + Markdown final`);
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // ETAPA 1: Navegação inicial
    console.log(`\n📍 ETAPA 1: Navegação inicial...`);
    await page.goto(CONFIG.url, { waitUntil: 'networkidle' });
    await captureScreenshot(page, '01-inicial');
    
    // ETAPA 2: Processo de login
    console.log(`\n🔑 ETAPA 2: Processo de login...`);
    let loginSuccess = false;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!loginSuccess && attempts < maxAttempts) {
      attempts++;
      console.log(`\n🔑 TENTATIVA DE LOGIN ${attempts}/${maxAttempts}...`);
      console.log('==================================================');
      
      const currentUrl = page.url();
      const currentTitle = await page.title();
      const pageType = detectPageType(currentUrl, currentTitle);
      
      console.log(`📍 URL atual: ${currentUrl}`);
      console.log(`📄 Título: ${currentTitle}`);
      console.log(`🏷️ Tipo de página: ${pageType}`);
      
      crawlingData.loginProcess.push({
        attempt: attempts,
        url: currentUrl,
        title: currentTitle,
        pageType: pageType,
        timestamp: new Date().toISOString()
      });
      
      let attemptSuccess = false;
      
      if (pageType === 'keycloak') {
        console.log('🔐 Detectada página KEYCLOAK - Processando login...');
        attemptSuccess = await processKeycloakLogin(page);
      } else {
        console.log('🧠 Usando login inteligente...');
        attemptSuccess = await attemptSmartLogin(page);
      }
      
      if (attemptSuccess) {
        await sleep(3000);
        const newUrl = page.url();
        const newTitle = await page.title();
        
        console.log(`📍 Nova URL: ${newUrl}`);
        console.log(`📄 Novo título: ${newTitle}`);
        
        // Verificar se o login foi bem-sucedido
        if (!newUrl.includes('signin') && !newUrl.includes('login') && !newUrl.includes('auth/signin')) {
          console.log('✅ LOGIN COMPLETADO COM SUCESSO!');
          loginSuccess = true;
          await captureScreenshot(page, '02-logado');
        } else {
          console.log(`❌ Login não completado na tentativa ${attempts}`);
          if (attempts < maxAttempts) {
            console.log('🔄 Tentando novamente...');
          }
        }
      } else {
        console.log(`❌ Falha na tentativa ${attempts}`);
      }
    }
    
    if (!loginSuccess) {
      throw new Error('Não foi possível completar o login após todas as tentativas');
    }
    
    // ETAPA 3: Crawling completo da aplicação
    console.log(`\n🗺️ ETAPA 3: CRAWLING COMPLETO DA APLICAÇÃO LOGADA`);
    console.log('======================================================================');
    
    const loggedUrl = page.url();
    await navigateAndAnalyze(page, loggedUrl);
    
    // ETAPA 4: Geração do relatório markdown
    console.log(`\n📝 ETAPA 4: GERAÇÃO DO RELATÓRIO MARKDOWN FINAL`);
    console.log('======================================================================');
    
    const markdownContent = generateMarkdownReport();
    const markdownFilename = 'saeb-crawling-relatorio-completo.md';
    fs.writeFileSync(markdownFilename, markdownContent, 'utf8');
    
    // Salvar dados JSON também
    const jsonFilename = 'saeb-crawling-dados-completos.json';
    fs.writeFileSync(jsonFilename, JSON.stringify(crawlingData, null, 2), 'utf8');
    
    console.log(`\n📊 RELATÓRIO FINAL DO CRAWLING COMPLETO`);
    console.log('======================================================================');
    console.log(`🌐 Total de páginas analisadas: ${crawlingData.summary.totalPagesAnalyzed}`);
    console.log(`🔗 URLs visitadas: ${crawlingData.visitedUrls.length}`);
    console.log(`📋 Total de menus encontrados: ${crawlingData.summary.totalMenuItems}`);
    console.log(`🔗 Total de links: ${crawlingData.summary.totalLinks}`);
    console.log(`📝 Total de formulários: ${crawlingData.summary.totalForms}`);
    console.log(`📊 Total de tabelas: ${crawlingData.summary.totalTables}`);
    console.log(`🎯 Total de ações: ${crawlingData.summary.totalActions}`);
    console.log(`\n💾 ARQUIVOS GERADOS:`);
    console.log(`   - Relatório Markdown: ${markdownFilename}`);
    console.log(`   - Dados JSON: ${jsonFilename}`);
    console.log(`   - Screenshots: ${crawlingData.screenshots.length} arquivos`);
    
    console.log(`\n🎯 CRAWLING COMPLETO FINALIZADO COM SUCESSO!`);
    console.log('============================================================');
    console.log('✅ Login completado (incluindo Keycloak se necessário)');
    console.log('✅ Navegação completa da aplicação logada');
    console.log('✅ Análise detalhada de todas as páginas');
    console.log('✅ Extração de menus, formulários, tabelas e ações');
    console.log('✅ Captura de screenshots de todas as páginas');
    console.log('✅ Geração de relatório markdown completo');
    console.log('✅ Dados estruturados salvos em JSON');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    await captureScreenshot(page, 'erro');
  } finally {
    console.log('\n⏳ Aguardando 5 segundos antes de fechar...');
    await sleep(5000);
    await browser.close();
  }
}

// Executar o teste
main().catch(console.error);