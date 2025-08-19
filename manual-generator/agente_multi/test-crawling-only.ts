import { LoginAgent } from './agents/LoginAgent.js';
import { CrawlerAgent } from './agents/CrawlerAgent.js';
import { TaskData } from './core/AgnoSCore.js';
import { chromium, Browser, Page } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync, mkdirSync } from 'fs';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testCrawlingAgent() {
  let browser: Browser | null = null;
  let page: Page | null = null;
  
  try {
    logger.info('🚀 Iniciando teste do agente de crawling');
    
    // Inicializar browser
    browser = await chromium.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    page = await browser.newPage();
    
    // Configurações do teste
    const targetUrl = 'https://saeb.pmfi.pr.gov.br/';
    const credentials = {
      username: 'admin',
      password: 'admin123'
    };
    
    // Inicializar agentes
    const loginAgent = new LoginAgent();
    const crawlerAgent = new CrawlerAgent();
    
    await loginAgent.initialize();
    await crawlerAgent.initialize();
    
    // Configurar página nos agentes
    loginAgent.setPage(page);
    crawlerAgent.setPage(page);
    
    logger.info('🔐 Iniciando processo de login...');
    
    // Tarefa de login
    const loginTask: TaskData = {
      id: `login-${Date.now()}`,
      type: 'authenticate',
      data: {
        url: targetUrl,
        credentials: credentials,
        page: page,
        options: {
          headless: false,
          timeout: 30000
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
    
    logger.info('✅ Login realizado com sucesso!');
    logger.info('🕷️ Iniciando processo de crawling...');
    
    // Tarefa de crawling
    const crawlTask: TaskData = {
      id: `crawl-${Date.now()}`,
      type: 'start_authenticated_crawl',
      data: {
        url: page.url(), // URL atual após login
        page: page,
        options: {
          maxDepth: 3,
          maxPages: 50,
          enableScreenshots: true,
          timeout: 60000
        }
      },
      sender: 'test-script',
      timestamp: new Date(),
      priority: 'medium'
    };
    
    const crawlResult = await crawlerAgent.processTask(crawlTask);
    
    if (!crawlResult.success) {
      throw new Error(`Crawling falhou: ${crawlResult.error}`);
    }
    
    logger.info('✅ Crawling concluído com sucesso!');
    
    // Gerar relatório em Markdown
    await generateMarkdownReport(loginResult, crawlResult);
    
    logger.info('📄 Relatório gerado com sucesso!');
    
  } catch (error) {
    logger.error('❌ Erro durante o teste:');
    if (error instanceof Error) {
      logger.error(error.message);
    } else {
      logger.error(String(error));
    }
  } finally {
    // Cleanup
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
  }
}

async function generateMarkdownReport(loginResult: any, crawlResult: any) {
  const outputDir = join(__dirname, 'output');
  
  try {
    mkdirSync(outputDir, { recursive: true });
  } catch (error) {
    // Diretório já existe
  }
  
  const reportPath = join(outputDir, 'crawl-data-report.md');
  
  const report = `# Relatório de Crawling - SAEB

## Informações Gerais
- **Data/Hora**: ${new Date().toLocaleString('pt-BR')}
- **URL Alvo**: https://saeb.pmfi.pr.gov.br/
- **Status Login**: ${loginResult.success ? '✅ Sucesso' : '❌ Falha'}
- **Status Crawling**: ${crawlResult.success ? '✅ Sucesso' : '❌ Falha'}

## Dados do Login
\`\`\`json
${JSON.stringify(loginResult, null, 2)}
\`\`\`

## Dados do Crawling
\`\`\`json
${JSON.stringify(crawlResult, null, 2)}
\`\`\`

## Resumo
- **Páginas Descobertas**: ${crawlResult.data?.pages?.length || 0}
- **Elementos Capturados**: ${crawlResult.data?.elements?.length || 0}
- **Screenshots**: ${crawlResult.data?.screenshots?.length || 0}
- **Tempo de Processamento**: ${crawlResult.processingTime || 0}ms

---
*Relatório gerado automaticamente pelo agente de crawling*
`;
  
  writeFileSync(reportPath, report, 'utf-8');
  logger.info(`📄 Relatório salvo em: ${reportPath}`);
}

// Executar o teste
testCrawlingAgent().catch(console.error);