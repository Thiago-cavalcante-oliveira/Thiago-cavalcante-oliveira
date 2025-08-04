import { AutoOutputService } from './src/services/AutoOutputService';

async function testPDFGeneration() {
  console.log('🧪 Testando geração de PDF...');
  
  const outputService = new AutoOutputService('./output');
  
  const sampleMarkdown = `# Manual de Teste

## Seção 1: Introdução

Este é um **teste** de geração de PDF com conteúdo em *markdown*.

### Características:
- Item 1
- Item 2  
- Item 3

### Código de exemplo:
\`\`\`javascript
console.log('Hello World!');
\`\`\`

## Seção 2: Conclusão

O teste foi **concluído** com sucesso!
`;

  try {
    const result = await outputService.generateAllFormats(sampleMarkdown, 'teste_pdf');
    console.log('✅ Teste concluído com sucesso!');
    console.log('📁 Arquivos gerados:', result);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testPDFGeneration();
