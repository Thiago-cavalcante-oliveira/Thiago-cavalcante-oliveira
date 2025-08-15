// Exemplo de integração do SmartLoginAgent no Orchestrator
import { SmartLoginAgent } from './agents/SmartLoginAgent';
import { SmartCrawler } from './crawler/smartCrawler';
import { chromium } from 'playwright';

// Exemplo de uso no Orchestrator
async function orchestratorWithSmartLogin(input: {
  url: string;
  credentials?: { username: string; password: string };
  maxPages?: number;
}) {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // 1. ETAPA DE LOGIN (só executa se houver credenciais)
    if (input.credentials?.username && input.credentials?.password) {
      console.log('🔐 Iniciando processo de login...');
      
      const loginAgent = new SmartLoginAgent();
      await loginAgent.initialize();
      loginAgent.setPage(page);
      
      const loginResult = await loginAgent.processTask({
        id: 'login-task-' + Date.now(),
        type: 'smart_login',
        data: {
          baseUrl: input.url,
          credentials: input.credentials
        },
        sender: 'test-integration',
        timestamp: new Date(),
        priority: 'high'
      });
      
      if (!loginResult.success) {
        throw new Error(`Falha no login: ${loginResult.error}`);
      }
      
      console.log('✅ Login realizado com sucesso!');
      console.log(`📁 Logs de login: ${loginAgent.getOutputDir()}`);
    } else {
      console.log('ℹ️ Sem credenciais - prosseguindo sem login');
    }
    
    // 2. ETAPA DE CRAWLING (só inicia após login bem-sucedido)
    console.log('🕷️ Iniciando crawling...');
    
    const crawler = new SmartCrawler(browser, {
      maxPages: input.maxPages || 10,
      maxDepth: 2,
      includeInteractive: true
    });
    
    const crawlResult = await crawler.crawlSite(input.url);
    
    console.log('✅ Crawling concluído!');
    return {
      loginSuccess: !!input.credentials,
      crawlResult
    };
    
  } finally {
    await browser.close();
  }
}

// Exemplo de uso
const example = {
  url: 'https://saeb-h1.pmfi.pr.gov.br/auth/signin',
  credentials: {
    username: 'admin',
    password: 'admin123'
  },
  maxPages: 5
};

// orchestratorWithSmartLogin(example);