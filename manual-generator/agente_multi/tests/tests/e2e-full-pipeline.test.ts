// Ficheiro: tests/e2e-full-pipeline.test.ts

import { test, expect } from '@playwright/test';
import { OrchestratorAgent, OrchestrationConfig, OrchestrationResult } from '../../agents/OrchestratorAgent.js'; // Ajuste o caminho se necessário
import * as path from 'path';
import * as fs from 'fs';

// Configurações do Teste E2E
const TEST_CONFIG = {
  URL: 'https://saeb-h1.pmfi.pr.gov.br/auth/signin',
  USERNAME: 'admin',
  PASSWORD: 'admin123',
  OUTPUT_DIR: path.join(process.cwd(), 'output', 'e2e-test-run'),
  // Aumentar o timeout para o teste completo, pois envolve LLMs e várias etapas.
  // 10 minutos (600,000 ms) é um valor seguro.
  TIMEOUT: 600000 
};

// Descreve a suíte de testes para o pipeline completo
test.describe('Teste de Pipeline Completo E2E', () => {

  // Antes de todos os testes, garante que o diretório de saída exista e esteja limpo
  test.beforeAll(() => {
    if (fs.existsSync(TEST_CONFIG.OUTPUT_DIR)) {
      fs.rmSync(TEST_CONFIG.OUTPUT_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_CONFIG.OUTPUT_DIR, { recursive: true });
  });

  // O caso de teste principal
  test('deve executar o pipeline completo com sucesso e gerar a documentação', async () => {
    // Define um timeout maior para este teste específico
    test.setTimeout(TEST_CONFIG.TIMEOUT);

    // --- ARRANGE (Organizar) ---
    console.log('🧪 [ARRANGE] Configurando o OrchestratorAgent...');
    
    const orchestrator = new OrchestratorAgent();
    // A inicialização é crucial para preparar todos os sub-agentes
    await orchestrator.initialize();

    const config: OrchestrationConfig = {
      targetUrl: TEST_CONFIG.URL,
      outputDir: TEST_CONFIG.OUTPUT_DIR,
      maxRetries: 2,
      timeoutMinutes: 8, // 8 minutos de timeout para o pipeline
      enableScreenshots: true,
      outputFormats: ['markdown', 'html'], // Formatos que queremos verificar
      credentials: {
        username: TEST_CONFIG.USERNAME,
        password: TEST_CONFIG.PASSWORD,
        loginUrl: TEST_CONFIG.URL
      },
    };

    // --- ACT (Agir) ---
    console.log('🚀 [ACT] Executando o pipeline completo...');
    const result = await orchestrator.executeFullPipeline(config);
    console.log('📊 [ACT] Pipeline concluído. Resultado:', result);

    // --- ASSERT (Verificar) ---
    console.log('🧐 [ASSERT] Verificando os resultados...');

    // 1. Verificar o sucesso geral e a ausência de erros
    expect(result.success, 'O pipeline deve ser concluído com sucesso').toBe(true);
    expect(result.errors, 'O pipeline não deve conter erros').toHaveLength(0);

    // 2. Verificar se os agentes corretos foram executados
    expect(result.agentsExecuted, 'Deve ter executado o LoginAgent').toContain('LoginAgent');
    expect(result.agentsExecuted, 'Deve ter executado o CrawlerAgent').toContain('CrawlerAgent');
    expect(result.agentsExecuted, 'Deve ter executado o AnalysisAgent').toContain('AnalysisAgent');
    expect(result.agentsExecuted, 'Deve ter executado o ContentAgent').toContain('ContentAgent');
    expect(result.agentsExecuted, 'Deve ter executado o GeneratorAgent').toContain('GeneratorAgent');

    // 3. Verificar se o crawling processou pelo menos uma página
    expect(result.statistics.pagesProcessed, 'Deve ter processado pelo menos uma página').toBeGreaterThan(0);
    
    // 4. Verificar se os caminhos dos documentos foram gerados no resultado
    expect(result.documentsGenerated.markdown, 'Deve haver um caminho para o documento Markdown').toBeDefined();
    expect(result.documentsGenerated.html, 'Deve haver um caminho para o documento HTML').toBeDefined();
    
    // 5. A verificação mais importante: Os ficheiros existem fisicamente no disco?
    const markdownPath = result.documentsGenerated.markdown!;
    const htmlPath = result.documentsGenerated.html!;

    console.log(`Verificando a existência do ficheiro: ${markdownPath}`);
    expect(fs.existsSync(markdownPath), `O ficheiro Markdown gerado deve existir em: ${markdownPath}`).toBe(true);
    
    console.log(`Verificando a existência do ficheiro: ${htmlPath}`);
    expect(fs.existsSync(htmlPath), `O ficheiro HTML gerado deve existir em: ${htmlPath}`).toBe(true);

    // 6. Verificar se os ficheiros têm conteúdo
    const markdownContent = fs.readFileSync(markdownPath, 'utf-8');
    expect(markdownContent.length, 'O ficheiro Markdown não pode estar vazio').toBeGreaterThan(100);

    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    expect(htmlContent.length, 'O ficheiro HTML não pode estar vazio').toBeGreaterThan(100);

    console.log('✅ [ASSERT] Todas as verificações passaram com sucesso!');
  });
});