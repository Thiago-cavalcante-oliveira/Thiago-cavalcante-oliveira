import { chromium } from 'playwright';

async function testDebugName() {
  console.log('🔍 Testando problema do __name...');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: [
      '--ignore-certificate-errors',
      '--ignore-ssl-errors',
      '--disable-web-security'
    ]
  });
  
  const page = await browser.newPage();
  
  try {
    // Navegar para uma página simples
    await page.goto('file:///home/thiagotco/stim/Thiago-cavalcante-oliveira/manual-generator/agente_multi/test-debug.html');
    
    // Testar o código JavaScript isoladamente
    const result = await page.evaluate(() => {
      // Função auxiliar para gerar seletor CSS
      function generateSelectorForElement(element) {
        if (element.id) {
          return '#' + element.id;
        }
        
        let selector = element.tagName.toLowerCase();
        
        if (element.className) {
          const classes = element.className.split(' ').filter(c => c.trim());
          if (classes.length > 0) {
            selector += '.' + classes.join('.');
          }
        }
        
        return selector;
      }

      // Testar a função
      const testElement = document.querySelector('h1');
      if (testElement) {
        return generateSelectorForElement(testElement);
      }
      
      return 'no-element-found';
    });
    
    console.log('✅ Teste bem-sucedido:', result);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await browser.close();
  }
}

testDebugName().catch(console.error);