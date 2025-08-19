import { chromium, Browser, Page } from 'playwright';
import { LoginAgent } from './agents/LoginAgent';
import { CrawlerAgent } from './agents/CrawlerAgent';
import { MinIOService } from './services/MinIOService';
import { LLMManager } from './services/LLMManager';
import { TaskData } from './core/AgnoSCore';
import * as fs from 'fs/promises';
import * as path from 'path';

// Definir __dirname e __filename para ES modules
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

async function testCrawlingImproved() {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    console.log('🚀 Iniciando teste de crawling melhorado...');
    
    // Inicializar browser
    browser = await chromium.launch({ 
      headless: false,
      slowMo: 1000 // Adicionar delay para melhor observação
    });
    page = await browser.newPage();
    
    // Configurar viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Inicializar serviços
    const minioService = new MinIOService();
    const llmManager = new LLMManager();
    
    // Inicializar agentes
    const loginAgent = new LoginAgent(minioService, llmManager);
    const crawlerAgent = new CrawlerAgent(minioService, llmManager);
    
    // Configurar página nos agentes
    loginAgent.setPage(page);
    crawlerAgent.setPage(page);
    
    console.log('🔐 Iniciando processo de login...');
    
    // Tarefa de autenticação
    const loginTask: TaskData = {
      id: `login-${Date.now()}`,
      type: 'authenticate',
      data: {
        url: 'https://saeb.pmfi.pr.gov.br/',
        page: page,
        credentials: {
          username: 'admin',
          password: 'admin123'
        }
      },
      sender: 'test-script',
      timestamp: new Date(),
      priority: 'medium'
    };
    
    const loginResult = await loginAgent.processTask(loginTask);
    
    if (!loginResult.success) {
      throw new Error(`Login falhou: ${loginResult.error}`);
    }
    
    console.log('✅ Login realizado com sucesso!');
    
    // Aguardar carregamento completo da página
    console.log('⏳ Aguardando carregamento completo da página...');
    await page.waitForTimeout(5000);
    
    // Aguardar por elementos específicos da aplicação SAEB
    try {
      await page.waitForSelector('body', { timeout: 10000 });
      console.log('✅ Página carregada');
    } catch (error) {
      console.log('⚠️ Timeout aguardando elementos, continuando...');
    }
    
    // Capturar screenshot da página após login
    await page.screenshot({ 
      path: path.join(__dirname, 'output', 'screenshots', 'page-after-login.png'),
      fullPage: true 
    });
    console.log('📸 Screenshot da página pós-login capturado');
    
    // Analisar elementos presentes na página
    console.log('🔍 Analisando elementos da página...');
    const pageAnalysis = await page.evaluate(() => {
      const elements = [];
      
      // Buscar por diferentes tipos de elementos
      const selectors = [
        'nav', '.nav', '.navbar', '.menu', '.sidebar',
        'button', '.btn', '.button',
        'a[href]', 'link',
        '.card', '.panel', '.widget',
        'form', 'input', 'select', 'textarea',
        '[role="button"]', '[role="link"]', '[role="menuitem"]',
        '.dashboard', '.admin', '.main-content',
        'h1', 'h2', 'h3', '.title', '.heading'
      ];
      
      selectors.forEach(selector => {
        try {
          const found = document.querySelectorAll(selector);
          found.forEach((el, index) => {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              elements.push({
                selector: selector,
                tag: el.tagName.toLowerCase(),
                text: el.textContent?.trim().substring(0, 100) || '',
                id: el.id || '',
                className: el.className || '',
                href: (el as HTMLAnchorElement).href || '',
                visible: rect.width > 0 && rect.height > 0,
                position: { x: rect.left, y: rect.top, width: rect.width, height: rect.height }
              });
            }
          });
        } catch (e) {
          // Ignorar erros de seletor
        }
      });
      
      return {
        url: window.location.href,
        title: document.title,
        elements: elements,
        totalElements: elements.length
      };
    });
    
    console.log(`📊 Análise da página:`);
    console.log(`   - URL: ${pageAnalysis.url}`);
    console.log(`   - Título: ${pageAnalysis.title}`);
    console.log(`   - Elementos encontrados: ${pageAnalysis.totalElements}`);
    
    // Mostrar alguns elementos encontrados
    if (pageAnalysis.elements.length > 0) {
      console.log('🔍 Primeiros elementos encontrados:');
      pageAnalysis.elements.slice(0, 10).forEach((el, i) => {
        console.log(`   ${i + 1}. ${el.tag} - "${el.text}" (${el.selector})`);
      });
    }
    
    console.log('🕷️ Iniciando processo de crawling melhorado...');
    
    // Tarefa de crawling com configurações melhoradas
    const crawlTask: TaskData = {
      id: `crawl-${Date.now()}`,
      type: 'start_authenticated_crawl',
      data: {
        url: page.url(),
        page: page,
        options: {
          maxDepth: 2, // Reduzir profundidade para teste
          maxPages: 20, // Reduzir número de páginas
          enableScreenshots: true,
          timeout: 30000, // Reduzir timeout
          waitTime: 3000, // Tempo de espera entre interações
          specificSelectors: [
            // Seletores específicos para SAEB
            '.menu-item', '.nav-link', '.sidebar-item',
            '.dashboard-card', '.admin-panel', '.main-menu',
            'button[type="button"]', 'a[href*="/"]',
            '.btn-primary', '.btn-secondary', '.action-button'
          ]
        }
      },
      sender: 'test-script',
      timestamp: new Date(),
      priority: 'medium'
    };
    
    const crawlResult = await crawlerAgent.processTask(crawlTask);
    
    if (!crawlResult.success) {
      console.log(`❌ Crawling falhou: ${crawlResult.error}`);
    } else {
      console.log('✅ Crawling concluído com sucesso!');
    }
    
    // Gerar relatório melhorado
    const reportData = {
      timestamp: new Date().toISOString(),
      url: page.url(),
      pageAnalysis: pageAnalysis,
      loginResult: loginResult,
      crawlResult: crawlResult
    };
    
    const reportPath = path.join(__dirname, 'output', 'crawl-data-report-improved.md');
    const reportContent = generateImprovedMarkdownReport(reportData);
    
    await fs.writeFile(reportPath, reportContent, 'utf-8');
    console.log(`📄 Relatório melhorado salvo em: ${reportPath}`);
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
    console.log('🧹 Recursos liberados');
  }
}

function generateImprovedMarkdownReport(data: any): string {
  return `# Relatório de Crawling Melhorado - SAEB

## Informações Gerais
- **Data/Hora**: ${new Date(data.timestamp).toLocaleString('pt-BR')}
- **URL Alvo**: ${data.url}
- **Status Login**: ${data.loginResult.success ? '✅ Sucesso' : '❌ Falha'}
- **Status Crawling**: ${data.crawlResult.success ? '✅ Sucesso' : '❌ Falha'}

## Análise da Página Pós-Login
- **Título**: ${data.pageAnalysis.title}
- **URL Final**: ${data.pageAnalysis.url}
- **Total de Elementos**: ${data.pageAnalysis.totalElements}

### Elementos Detectados
${data.pageAnalysis.elements.slice(0, 20).map((el: any, i: number) => 
  `${i + 1}. **${el.tag.toUpperCase()}** - "${el.text}" \n   - Seletor: \`${el.selector}\`\n   - ID: ${el.id || 'N/A'}\n   - Classe: ${el.className || 'N/A'}\n   - Visível: ${el.visible ? '✅' : '❌'}\n`
).join('\n')}

## Dados do Login
\`\`\`json
${JSON.stringify(data.loginResult, null, 2)}
\`\`\`

## Dados do Crawling
\`\`\`json
${JSON.stringify(data.crawlResult, null, 2)}
\`\`\`

## Diagnóstico
${data.pageAnalysis.totalElements === 0 ? 
  '⚠️ **Problema**: Nenhum elemento foi detectado na página. Possíveis causas:\n- Página ainda carregando\n- Elementos carregados via JavaScript\n- Seletores inadequados\n- Problemas de autenticação' :
  `✅ **Sucesso**: ${data.pageAnalysis.totalElements} elementos detectados na página.`
}

---
*Relatório gerado automaticamente pelo teste de crawling melhorado*
`;
}

// Executar o teste
testCrawlingImproved().catch(console.error);