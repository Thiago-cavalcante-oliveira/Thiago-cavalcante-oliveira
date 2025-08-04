import { Browser, Page, chromium } from 'playwright';
import { InteractiveElement, InteractionResult } from '../types/index';

export class SimpleNavigationService {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private baseUrl: string = '';
  private visitedUrls: Set<string> = new Set();
  private capturedScreens: Map<string, string> = new Map();

  async init(): Promise<void> {
    await this.initialize();
  }

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    console.log('🎭 Iniciando Simple Navigation Service...');
  }

  async navigateToPage(url: string): Promise<boolean> {
    return await this.navigateTo(url);
  }

  async navigateTo(url: string): Promise<boolean> {
    if (!this.page) throw new Error('Página não disponível');

    try {
      console.log(`🌐 Navegando para: ${url}`);
      
      if (!this.baseUrl) {
        this.baseUrl = new URL(url).origin;
        console.log(`🏠 URL base definida: ${this.baseUrl}`);
      }

      await this.page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });

      console.log('⏳ Aguardando estabilização da página...');
      await this.page.waitForTimeout(2000);
      
      this.visitedUrls.add(url);
      console.log(`✅ Navegação bem-sucedida para: ${url}`);
      return true;
    } catch (error) {
      console.log(`❌ Erro ao navegar: ${error instanceof Error ? error.message : error}`);
      return false;
    }
  }

  async detectAllInteractiveElements(): Promise<InteractiveElement[]> {
    if (!this.page) throw new Error('Página não disponível');

    console.log('🔍 Iniciando detecção simples de elementos...');

    try {
      const elements = await this.page.evaluate(() => {
        const results = [];
        
        // Buscar elementos básicos
        const selector = 'a[href], button, input:not([type="hidden"]), select, textarea, [role="button"]';
        const allElements = document.querySelectorAll(selector);
        
        allElements.forEach((element, index) => {
          const rect = element.getBoundingClientRect();
          
          // Verificar visibilidade básica
          if (rect.width <= 0 || rect.height <= 0) return;
          
          const text = element.textContent?.trim() || 
                      element.getAttribute('placeholder') || 
                      element.getAttribute('aria-label') || 
                      element.tagName;
          
          if (!text) return;
          
          results.push({
            selector: element.tagName.toLowerCase() + (element.id ? '#' + element.id : ':nth-of-type(' + (index + 1) + ')'),
            text: text.substring(0, 100),
            type: element.tagName.toLowerCase(),
            context: 'content',
            id: element.id || '',
            className: element.className?.toString() || '',
            href: element.getAttribute('href') || '',
            boundingBox: {
              x: rect.left,
              y: rect.top,
              width: rect.width,
              height: rect.height,
              top: rect.top,
              left: rect.left
            },
            score: 10
          });
        });

        return results;
      });

      console.log(`✅ ${elements.length} elementos detectados`);
      return elements;
    } catch (error) {
      console.log(`❌ Erro ao detectar elementos: ${error}`);
      return [];
    }
  }

  async takeScreenshot(filename?: string): Promise<string> {
    if (!this.page) throw new Error('Página não disponível');

    try {
      const timestamp = Date.now();
      const generatedFilename = filename || `screenshot_${timestamp}.png`;
      
      await this.page.screenshot({
        path: generatedFilename,
        fullPage: true,
        type: 'png'
      });
      
      console.log(`📷 Screenshot capturado: ${generatedFilename}`);
      return generatedFilename;
    } catch (error) {
      console.log(`❌ Erro ao capturar screenshot: ${error}`);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      console.log('🔄 Browser fechado com sucesso');
    }
  }

  getPage(): Page | null {
    return this.page;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getVisitedUrls(): string[] {
    return Array.from(this.visitedUrls);
  }

  async interactWithElement(element: InteractiveElement): Promise<InteractionResult> {
    if (!this.page) throw new Error('Página não disponível');

    const initialUrl = this.page.url();
    
    try {
      console.log(`🎯 Interagindo com: ${element.type.toUpperCase()} - "${element.text.substring(0, 50)}..."`);
      
      const locator = this.page.locator(element.selector).first();
      
      // Verificar se é visível
      if (await locator.isVisible({ timeout: 2000 })) {
        // Fazer hover primeiro
        await locator.hover({ timeout: 2000 });
        await this.page.waitForTimeout(500);
        
        // Interação baseada no tipo
        if (element.type === 'input' || element.type === 'textarea') {
          await locator.fill('teste automatizado');
          console.log('   ✅ Campo preenchido');
        } else {
          await locator.click({ timeout: 2000 });
          console.log('   ✅ Clique realizado');
          
          // Aguardar possível navegação
          await this.page.waitForTimeout(1000);
        }
        
        const finalUrl = this.page.url();
        const navigationOccurred = initialUrl !== finalUrl;
        
        return {
          success: true,
          navigationOccurred,
          urlChanged: navigationOccurred,
          initialUrl,
          finalUrl,
          element,
          filename: '',
          content: 'Interação realizada com sucesso',
          modalContent: null,
          url: finalUrl,
          title: `Interação com ${element.type}`,
          newPageExplored: false,
          newPageElements: []
        };
      } else {
        console.log('   ⚠️ Elemento não visível');
        return {
          success: false,
          navigationOccurred: false,
          urlChanged: false,
          initialUrl,
          finalUrl: initialUrl,
          element,
          filename: '',
          content: 'Elemento não visível',
          modalContent: null,
          url: initialUrl,
          title: 'Falha na interação',
          newPageExplored: false,
          newPageElements: []
        };
      }
    } catch (error) {
      console.log(`   ❌ Erro na interação: ${error instanceof Error ? error.message : error}`);
      return {
        success: false,
        navigationOccurred: false,
        urlChanged: false,
        initialUrl,
        finalUrl: initialUrl,
        element,
        filename: '',
        content: 'Erro na interação',
        modalContent: null,
        url: initialUrl,
        title: 'Erro na interação',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        newPageExplored: false,
        newPageElements: []
      };
    }
  }
}
