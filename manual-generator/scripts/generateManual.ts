
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { chromium, Browser, Page } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config();

// Verificação das variáveis de ambiente
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY não encontrada no arquivo .env');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    maxOutputTokens: 2048,
  }
});

const OUTPUT_DIR = path.join(__dirname, '../output');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Configurações do sistema de retry
const RETRY_CONFIG = {
  maxRetries: parseInt(process.env.GEMINI_MAX_RETRIES || '5'),
  baseWaitTime: parseInt(process.env.GEMINI_BASE_WAIT_TIME || '1000'),
  maxWaitTime: parseInt(process.env.GEMINI_MAX_WAIT_TIME || '30000'),
  rateLimitWaitTime: 2000
};

// Função para detectar elementos interativos
async function detectInteractiveElements(page: Page) {
  return await page.evaluate(() => {
    const interactiveElements: Array<{
      selector: string;
      text: string;
      type: string;
      id?: string;
      className?: string;
    }> = [];

    // Detectar botões
    const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"], [role="button"]');
    buttons.forEach((btn, index) => {
      const text = btn.textContent?.trim() || btn.getAttribute('aria-label') || btn.getAttribute('title') || `Button ${index + 1}`;
      if (text && text.length > 0 && text.length < 100) {
        interactiveElements.push({
          selector: `button:nth-of-type(${index + 1})`,
          text: text,
          type: 'button',
          id: btn.id,
          className: btn.className
        });
      }
    });

    // Detectar links importantes (não de navegação básica)
    const links = document.querySelectorAll('a[href]');
    links.forEach((link, index) => {
      const text = link.textContent?.trim() || '';
      const href = link.getAttribute('href') || '';
      
      // Filtrar links relevantes
      if (text && 
          text.length > 2 && 
          text.length < 50 && 
          !href.startsWith('mailto:') && 
          !href.startsWith('tel:') &&
          !text.toLowerCase().includes('home') &&
          !text.toLowerCase().includes('voltar') &&
          (href.startsWith('#') || href.includes('modal') || href.includes('popup') || text.toLowerCase().includes('ver') || text.toLowerCase().includes('abrir'))) {
        
        interactiveElements.push({
          selector: `a:nth-of-type(${index + 1})`,
          text: text,
          type: 'link',
          id: link.id,
          className: link.className
        });
      }
    });

    // Detectar elementos com eventos de clique
    const clickableElements = document.querySelectorAll('[onclick], [data-toggle], [data-target], [data-modal]');
    clickableElements.forEach((elem, index) => {
      const text = elem.textContent?.trim() || elem.getAttribute('aria-label') || elem.getAttribute('title') || `Clickable ${index + 1}`;
      if (text && text.length > 0 && text.length < 100) {
        interactiveElements.push({
          selector: `[onclick]:nth-of-type(${index + 1})`,
          text: text,
          type: 'clickable',
          id: elem.id,
          className: elem.className
        });
      }
    });

    return interactiveElements.slice(0, 10); // Limitar a 10 elementos por página
  });
}

// Função para aguardar mudanças na página
async function waitForPageChanges(page: Page, timeout = 3000) {
  try {
    await Promise.race([
      page.waitForSelector('[role="dialog"], .modal, .popup, .overlay', { timeout }),
      page.waitForFunction(() => {
        const modals = document.querySelectorAll('[role="dialog"], .modal, .popup, .overlay');
        return modals.length > 0 && Array.from(modals).some(modal => {
          const style = window.getComputedStyle(modal);
          return style.display !== 'none' && style.visibility !== 'hidden';
        });
      }, { timeout }),
      new Promise(resolve => setTimeout(resolve, timeout))
    ]);
  } catch (error) {
    // Timeout é esperado se não houver mudanças
  }
}

// Função para interagir com um elemento e capturar resultado
async function interactWithElement(page: Page, element: any, screenshotIndex: number) {
  console.log(`🔍 Interagindo com: ${element.text} (${element.type})`);
  
  try {
    // Tentar diferentes seletores
    let elementHandle = null;
    const selectors = [
      element.id ? `#${element.id}` : null,
      element.className ? `.${element.className.split(' ')[0]}` : null,
      element.selector
    ].filter(Boolean);

    for (const selector of selectors) {
      try {
        elementHandle = await page.$(selector);
        if (elementHandle) break;
      } catch (e) {
        continue;
      }
    }

    if (!elementHandle) {
      // Tentar por texto usando locator
      if (element.type === 'button') {
        try {
          const locator = page.locator(`button:has-text("${element.text}")`).first();
          if (await locator.count() > 0) {
            elementHandle = locator;
          }
        } catch (e) {
          elementHandle = null;
        }
      } else if (element.type === 'link') {
        try {
          const locator = page.locator(`a:has-text("${element.text}")`).first();
          if (await locator.count() > 0) {
            elementHandle = locator;
          }
        } catch (e) {
          elementHandle = null;
        }
      }
    }

    if (!elementHandle) {
      console.log(`⚠️ Elemento não encontrado: ${element.text}`);
      return null;
    }

    // Verificar se o elemento está visível
    const isVisible = await elementHandle.isVisible();
    if (!isVisible) {
      console.log(`⚠️ Elemento não visível: ${element.text}`);
      return null;
    }

    // Fazer scroll até o elemento
    await elementHandle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // Interagir com o elemento
    await elementHandle.click();
    console.log(`✅ Clique realizado em: ${element.text}`);

    // Aguardar mudanças na página
    await waitForPageChanges(page);
    await page.waitForTimeout(2000);

    // Capturar screenshot do novo estado
    const filename = `screenshot_${screenshotIndex}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);
    await page.screenshot({ 
      path: filepath, 
      fullPage: true 
    });
    console.log(`📷 Screenshot capturado: ${filename}`);

    // Extrair conteúdo da página/modal
    const content = await page.content();
    
    // Verificar se há modal aberto
    const modalContent = await page.evaluate(() => {
      const modals = document.querySelectorAll('[role="dialog"], .modal, .popup, .overlay');
      let modalText = '';
      
      modals.forEach(modal => {
        const style = window.getComputedStyle(modal);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          modalText += modal.textContent || '';
        }
      });
      
      return modalText.trim();
    });

    return {
      element,
      filename,
      content: content.substring(0, 8000),
      modalContent: modalContent || null,
      url: page.url(),
      title: await page.title()
    };

  } catch (error) {
    console.log(`❌ Erro ao interagir com ${element.text}:`, error);
    return null;
  }
}

// Função para analisar conteúdo com Gemini
async function analyzeContentWithGemini(
  content: string, 
  sectionTitle: string, 
  url: string, 
  interactiveElements: string[] = [],
  elementContext?: any
) {
  const prompt = `Você é um especialista em criação de manuais de usuário. Analise o conteúdo abaixo e gere uma seção de manual de usuário em português brasileiro.

${elementContext ? 
  `CONTEXTO: Esta análise é sobre a funcionalidade "${elementContext.text}" (${elementContext.type}) que foi ativada/clicada.` 
  : 'CONTEXTO: Esta é a análise da página principal.'}

Inclua:
- **Finalidade:** Descrição clara da finalidade da tela/funcionalidade
- **Elementos Visíveis:** Lista organizada dos campos/elementos visíveis
- **Ações Possíveis:** Possíveis ações que o usuário pode realizar
- **Instruções Passo-a-Passo:** Quando aplicável, forneça instruções detalhadas

${interactiveElements.length > 0 ? 
  `\n**Elementos Interativos Detectados:** ${interactiveElements.join(', ')}` 
  : ''}

Formate a resposta em Markdown. Seja claro, objetivo e didático.

CONTEÚDO PARA ANÁLISE:
${content}`;

  // Sistema de retry com backoff exponencial para o Gemini
  let retryCount = 0;
  const maxRetries = RETRY_CONFIG.maxRetries;
  let geminiSuccess = false;
  let analysisText = '';

  while (retryCount < maxRetries && !geminiSuccess) {
    try {
      console.log(`🔄 Tentativa ${retryCount + 1}/${maxRetries} de análise com Gemini para "${sectionTitle}"...`);
      const result = await model.generateContent(prompt);
      const response = result.response;
      analysisText = response.text();
      geminiSuccess = true;
      console.log(`✅ Análise do Gemini concluída com sucesso!`);
    } catch (geminiError: any) {
      retryCount++;
      
      if (geminiError?.status === 503 || geminiError?.message?.includes('overloaded')) {
        const waitTime = Math.min(
          RETRY_CONFIG.baseWaitTime * Math.pow(2, retryCount), 
          RETRY_CONFIG.maxWaitTime
        );
        console.log(`⏳ Gemini sobrecarregado. Aguardando ${waitTime/1000}s antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else if (geminiError?.status === 429) {
        const waitTime = Math.min(
          RETRY_CONFIG.rateLimitWaitTime * Math.pow(2, retryCount), 
          RETRY_CONFIG.maxWaitTime * 2
        );
        console.log(`🚦 Rate limit atingido. Aguardando ${waitTime/1000}s antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        console.error(`❌ Erro na tentativa ${retryCount}: ${geminiError?.message || geminiError}`);
        if (retryCount < maxRetries) {
          const waitTime = 5000;
          console.log(`⏳ Aguardando ${waitTime/1000}s antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
  }

  if (geminiSuccess) {
    return analysisText;
  } else {
    console.error(`❌ Falha ao processar "${sectionTitle}" com Gemini após ${maxRetries} tentativas`);
    return `### ⚠️ Análise Automática Indisponível

*A análise automática desta funcionalidade não pôde ser realizada devido à indisponibilidade temporária do serviço de IA.*

**Funcionalidade:** ${elementContext?.text || sectionTitle}
**Tipo:** ${elementContext?.type || 'Página'}
**URL:** ${url}

**Ações sugeridas:**
- Verifique o screenshot capturado
- Execute novamente o comando em alguns minutos
- Analise manualmente os elementos visíveis na tela`;
  }
}

async function generateManualFromUrl(targetUrl: string) {
  console.log('🔍 Iniciando análise da página...');
  
  let browser: Browser | null = null;
  let page: Page | null = null;
  
  try {
    // Sistema híbrido: Crawler-TS + Playwright
    let crawlerContent = '';
    let crawlerSuccess = false;
    
    // Tentativa 1: Usar Crawler-TS para extrair conteúdo
    console.log('�️ Tentando extrair conteúdo com Crawler-TS...');
    try {
      // const crawler = createCrawler()
      //   .allowExtensions(['html', 'htm'])
      //   .ignoreDoubles(true);
      
      // Por enquanto, vamos usar apenas Playwright que é mais confiável
      console.log('📋 Usando apenas Playwright para extração completa...');

      /*
      const crawlResult = await new Promise<any>((resolve, reject) => {
        crawler.queue({
          uri: targetUrl,
          callback: (error: any, res: any, done: any) => {
            if (error) {
              reject(error);
            } else {
              resolve(res);
            }
            done();
          }
        });
      });

      if (crawlResult && crawlResult.body) {
        crawlerContent = crawlResult.body;
        crawlerSuccess = true;
        console.log('✅ Conteúdo extraído com Crawler-TS com sucesso');
      }
      */
    } catch (crawlerError: any) {
      console.log(`⚠️ Crawler-TS falhou: ${crawlerError.message}`);
    }

    console.log('🎭 Iniciando Playwright para screenshot e conteúdo adicional...');

    // Tentativa 2: Usar Playwright para screenshot e conteúdo
    browser = await chromium.launch({ 
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    
    page = await browser.newPage();
    
    // Configurar User-Agent e viewport
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    await page.setViewportSize({ width: 1920, height: 1080 });

    const markdownSections: string[] = [];
    
    // Processar a página principal com retry aprimorado
    console.log(`📸 Acessando ${targetUrl}`);
    try {
      // Tentar múltiplas estratégias de navegação
      let navigationSuccess = false;
      const navigationStrategies = [
        { waitUntil: 'networkidle' as const, timeout: 45000 },
        { waitUntil: 'domcontentloaded' as const, timeout: 30000 },
        { waitUntil: 'load' as const, timeout: 60000 },
        { timeout: 30000 } // Sem waitUntil como último recurso
      ];
      
      for (let i = 0; i < navigationStrategies.length && !navigationSuccess; i++) {
        try {
          console.log(`🔄 Tentativa de navegação ${i + 1}/${navigationStrategies.length}...`);
          await page.goto(targetUrl, navigationStrategies[i]);
          navigationSuccess = true;
          console.log(`✅ Navegação bem-sucedida com estratégia ${i + 1}`);
        } catch (navError) {
          console.log(`⚠️ Falha na estratégia ${i + 1}: ${navError instanceof Error ? navError.message : navError}`);
          if (i === navigationStrategies.length - 1) {
            throw navError;
          }
        }
      }
      
      // Aguardar carregamento adicional
      console.log('⏳ Aguardando carregamento completo da página...');
      await page.waitForTimeout(8000);
      
      // Verificar se a página carregou corretamente
      const currentUrl = page.url();
      const title = await page.title();
      console.log(`📄 URL atual: ${currentUrl}`);
      console.log(`📋 Título da página: ${title}`);
      
      // Verificar se há conteúdo visível
      const bodyText = await page.evaluate(() => {
        return document.body?.innerText?.substring(0, 200) || 'Sem conteúdo detectado';
      });
      console.log(`📝 Prévia do conteúdo: ${bodyText}...`);

      // Scroll para garantir que todo o conteúdo seja carregado
      console.log('📜 Fazendo scroll para carregar conteúdo dinâmico...');
      await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if(totalHeight >= scrollHeight){
              clearInterval(timer);
              window.scrollTo(0, 0); // Voltar ao topo
              resolve();
            }
          }, 100);
        });
      });
      
      // Aguardar mais um pouco após o scroll
      await page.waitForTimeout(3000);

      const filename = `screenshot_1.png`;
      const filepath = path.join(OUTPUT_DIR, filename);
      await page.screenshot({ 
        path: filepath, 
        fullPage: true
      });
      console.log(`📷 Screenshot salvo: ${filename}`);

      // Detectar elementos interativos na página
      console.log('🔍 Detectando elementos interativos...');
      const interactiveElements = await detectInteractiveElements(page);
      console.log(`🎯 Encontrados ${interactiveElements.length} elementos interativos`);

      // Análise da página principal
      let contentToAnalyze = '';
      const html = await page.content();
      contentToAnalyze = html.substring(0, 8000);
      console.log('📋 Analisando página principal...');

      // Analisar página principal com Gemini
      const mainPageAnalysis = await analyzeContentWithGemini(
        contentToAnalyze, 
        'Página Principal', 
        targetUrl,
        interactiveElements.map(el => el.text)
      );

      if (mainPageAnalysis) {
        markdownSections.push(`## Página Principal: ${targetUrl}\n![Screenshot](${filename})\n\n${mainPageAnalysis}`);
        console.log(`✅ Página principal processada com sucesso`);
      }

      // Interagir com elementos e capturar funcionalidades
      let screenshotIndex = 2;
      
      for (const element of interactiveElements) {
        console.log(`\n🎯 Processando elemento: ${element.text}`);
        
        try {
          // Voltar ao estado inicial se necessário
          if (page.url() !== targetUrl) {
            await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForTimeout(2000);
          }

          // Interagir com o elemento
          const interactionResult = await interactWithElement(page, element, screenshotIndex);
          
          if (interactionResult) {
            // Analisar o resultado da interação
            const analysisContent = interactionResult.modalContent || interactionResult.content;
            const sectionTitle = `Funcionalidade: ${element.text}`;
            
            const analysis = await analyzeContentWithGemini(
              analysisContent,
              sectionTitle,
              interactionResult.url,
              [],
              element
            );

            if (analysis) {
              markdownSections.push(`## ${sectionTitle}\n![Screenshot](${interactionResult.filename})\n\n${analysis}`);
              console.log(`✅ Funcionalidade "${element.text}" processada com sucesso`);
            }

            screenshotIndex++;
            
            // Fechar modal se aberto
            try {
              const closeButton = await page.$('[aria-label="Close"], .close, .modal-close, [data-dismiss="modal"]');
              if (closeButton && await closeButton.isVisible()) {
                await closeButton.click();
                await page.waitForTimeout(1000);
              }
            } catch (e) {
              // Pressionar ESC para fechar modal
              await page.keyboard.press('Escape');
              await page.waitForTimeout(1000);
            }
          }
          
        } catch (elementError) {
          console.log(`⚠️ Erro ao processar elemento "${element.text}":`, elementError);
          continue;
        }
      }
        
    } catch (err) {
      console.error(`Erro ao processar ${targetUrl}:`, err);
    }
    
    // Gerar manual final
    const timestamp = new Date().toLocaleString('pt-BR');
    const header = `# Manual de Usuário Gerado Automaticamente

**URL Base:** ${targetUrl}  
**Data de Geração:** ${timestamp}  
**Total de Páginas:** ${markdownSections.length}

---
`;
    
    const markdown = header + markdownSections.join('\n\n---\n\n');
    const manualPath = path.join(OUTPUT_DIR, 'manual.md');
    fs.writeFileSync(manualPath, markdown);
    
    console.log('✅ Manual gerado com sucesso!');
    console.log(`📁 Arquivo: ${manualPath}`);
    console.log(`📊 Total de páginas processadas: ${markdownSections.length}`);
    console.log(`📷 Screenshots salvos em: ${OUTPUT_DIR}`);
    
  } catch (error) {
    console.error('❌ Erro durante a geração do manual:', error);
  } finally {
    // Garantir que o browser seja fechado
    if (browser) {
      try {
        await browser.close();
        console.log('🔄 Browser fechado com sucesso');
      } catch (closeError) {
        console.error('⚠️ Erro ao fechar browser:', closeError);
      }
    }
  }
}

const inputUrl = process.argv[2];
if (!inputUrl) {
  console.error('❌ Uso: npm run generate <URL>');
  console.error('   Exemplo: npm run generate "https://exemplo.com"');
  process.exit(1);
}

// Validação básica da URL
try {
  new URL(inputUrl);
} catch (error) {
  console.error('❌ URL inválida:', inputUrl);
  process.exit(1);
}

console.log(`🚀 Iniciando geração de manual para: ${inputUrl}`);
generateManualFromUrl(inputUrl);
