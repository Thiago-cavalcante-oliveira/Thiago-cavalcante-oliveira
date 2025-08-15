import { chromium, Browser, Page } from 'playwright';
import { logger } from './utils/logger';
import * as fs from 'fs';

async function debugSaebPage() {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    logger.info('🔍 Iniciando debug da página SAEB...');

    // Lançar navegador em modo visível para debug
    browser = await chromium.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    
    // Configurar viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    
    logger.info('✅ Navegador lançado');

    // Navegar para a página de login
    const loginUrl = 'https://saeb-h1.pmfi.pr.gov.br/auth/signin';
    logger.info(`📍 Navegando para: ${loginUrl}`);
    
    await page.goto(loginUrl, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    logger.info('✅ Página carregada');

    // Aguardar carregamento completo
    await page.waitForTimeout(5000);
    
    // Capturar screenshot
    const screenshotPath = './debug-saeb-page.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    logger.info(`📸 Screenshot salva em: ${screenshotPath}`);
    
    // Obter informações da página
    const pageInfo = {
      url: page.url(),
      title: await page.title(),
      content: await page.content()
    };
    
    logger.info(`📄 Título da página: ${pageInfo.title}`);
    logger.info(`🔗 URL atual: ${pageInfo.url}`);
    
    // Salvar HTML completo para análise
    const htmlPath = './debug-saeb-page.html';
    fs.writeFileSync(htmlPath, pageInfo.content);
    logger.info(`💾 HTML salvo em: ${htmlPath}`);
    
    // Analisar todos os elementos da página
    const pageAnalysis = await page.evaluate(() => {
      const analysis = {
        inputs: [] as any[],
        buttons: [] as any[],
        forms: [] as any[],
        links: [] as any[],
        scripts: [] as any[],
        bodyText: document.body?.innerText?.substring(0, 500) || 'Sem texto no body',
        hasReact: !!(window as any).React,
        hasNextJs: document.querySelector('script[src*="_next"]') !== null,
        metaTags: [] as any[]
      };
      
      // Analisar inputs
      document.querySelectorAll('input').forEach((input, index) => {
        analysis.inputs.push({
          index,
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
          className: input.className,
          value: input.value,
          visible: input.offsetParent !== null
        });
      });
      
      // Analisar botões
      document.querySelectorAll('button').forEach((button, index) => {
        analysis.buttons.push({
          index,
          type: button.type,
          className: button.className,
          text: button.textContent?.trim(),
          visible: button.offsetParent !== null
        });
      });
      
      // Analisar formulários
      document.querySelectorAll('form').forEach((form, index) => {
        analysis.forms.push({
          index,
          action: form.action,
          method: form.method,
          className: form.className,
          id: form.id
        });
      });
      
      // Analisar links
      document.querySelectorAll('a').forEach((link, index) => {
        if (index < 10) { // Limitar a 10 links
          analysis.links.push({
            index,
            href: link.href,
            text: link.textContent?.trim(),
            className: link.className
          });
        }
      });
      
      // Analisar scripts
      document.querySelectorAll('script').forEach((script, index) => {
        if (index < 5) { // Limitar a 5 scripts
          analysis.scripts.push({
            index,
            src: script.src,
            type: script.type,
            hasContent: !!script.textContent
          });
        }
      });
      
      // Analisar meta tags
      document.querySelectorAll('meta').forEach((meta, index) => {
        if (index < 10) {
          analysis.metaTags.push({
            name: meta.getAttribute('name'),
            property: meta.getAttribute('property'),
            content: meta.getAttribute('content')
          });
        }
      });
      
      return analysis;
    });
    
    logger.info('📊 Análise da página:');
    console.log(JSON.stringify(pageAnalysis, null, 2));
    
    // Verificar se é uma SPA (Single Page Application)
    if (pageAnalysis.hasNextJs || pageAnalysis.hasReact) {
      logger.info('⚛️ Detectada aplicação React/Next.js - aguardando carregamento dinâmico...');
      
      // Aguardar mais tempo para carregamento dinâmico
      await page.waitForTimeout(10000);
      
      // Tentar novamente após aguardar
      const updatedAnalysis = await page.evaluate(() => {
        const inputs = [] as any[];
        document.querySelectorAll('input').forEach((input, index) => {
          inputs.push({
            index,
            type: input.type,
            name: input.name,
            id: input.id,
            placeholder: input.placeholder,
            className: input.className,
            visible: input.offsetParent !== null
          });
        });
        return { inputs, bodyText: document.body?.innerText?.substring(0, 500) };
      });
      
      logger.info('📊 Análise após aguardar carregamento dinâmico:');
      console.log(JSON.stringify(updatedAnalysis, null, 2));
      
      // Capturar nova screenshot
      await page.screenshot({ path: './debug-saeb-page-after-wait.png', fullPage: true });
      logger.info('📸 Nova screenshot salva: debug-saeb-page-after-wait.png');
    }
    
    // Aguardar mais um pouco para observação manual
    logger.info('⏳ Aguardando 15 segundos para observação manual...');
    await page.waitForTimeout(15000);
    
  } catch (error) {
    logger.error(`❌ Erro durante o debug: ${error instanceof Error ? error.message : String(error)}`);
    console.error('Stack trace:', error);
  } finally {
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
    logger.info('🏁 Debug finalizado');
  }
}

// Executar o debug
debugSaebPage().catch(console.error);