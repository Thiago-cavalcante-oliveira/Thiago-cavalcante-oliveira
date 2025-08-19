import { chromium } from 'playwright';

async function testSimple() {
  console.log('🔍 Teste simples em JS...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('file:///home/thiagotco/stim/Thiago-cavalcante-oliveira/manual-generator/agente_multi/test-debug.html');
    
    const result = await page.evaluate(() => {
      function testFunction() {
        return 'função funcionou';
      }
      return testFunction();
    });
    
    console.log('✅ Resultado:', result);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await browser.close();
  }
}

testSimple();