const { chromium } = require('playwright');

async function testFixedName() {
  console.log('🔍 Testando correção do __name...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('file:///home/thiagotco/stim/Thiago-cavalcante-oliveira/manual-generator/agente_multi/test-debug.html');
    
    const result = await page.evaluate(() => {
      // Função auxiliar para gerar seletor CSS (definida como expressão)
      const generateSelectorForElement = function(element) {
        if (element.id) {
          return '#' + element.id;
        }
        
        let selector = element.tagName.toLowerCase();
        
        if (element.className) {
          const classes = element.className.split(' ').filter(function(c) { return c.trim(); });
          if (classes.length > 0) {
            selector += '.' + classes.join('.');
          }
        }
        
        return selector;
      };
      
      // Testar a função
      const testElement = document.querySelector('h1');
      if (testElement) {
        return generateSelectorForElement(testElement);
      }
      
      return 'no-element-found';
    });
    
    console.log('✅ Resultado:', result);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await browser.close();
  }
}

testFixedName();