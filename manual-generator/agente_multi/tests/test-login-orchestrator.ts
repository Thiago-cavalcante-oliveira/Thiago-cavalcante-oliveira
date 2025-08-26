import { OrchestratorAgent } from '../agents/OrchestratorAgent.js';
import { chromium, Browser, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Teste específico para agentes de login via orquestrador
 * Permite testar sistematicamente cada agente e medir grau de sucesso
 */
class LoginOrchestratorTest {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private outputDir: string;
  private testResults: any[] = [];

  constructor() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.outputDir = path.join(__dirname, 'output', `login-orchestrator-test-${timestamp}`);
  }

  async setup(): Promise<void> {
    console.log('🚀 Iniciando teste do agente de login via orquestrador...');
    
    // Criar diretório de saída
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Inicializar browser
    this.browser = await chromium.launch({
      headless: false,
      slowMo: 1000,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const context = await this.browser.newContext({
      ignoreHTTPSErrors: true
    });
    
    this.page = await context.newPage();
    
    // Configurar viewport
    await this.page.setViewportSize({ width: 1280, height: 720 });
    
    console.log('✅ Setup concluído');
  }

  async testLoginWithOrchestrator(): Promise<void> {
    if (!this.page) throw new Error('Page não inicializada');
    
    console.log('🔐 Testando login via orquestrador...');
    
    const testConfig = {
      url: 'https://saeb-h1.pmfi.pr.gov.br/',
      credentials: {
        username: 'admin',
        password: 'admin123'
      },
      outputDir: this.outputDir,
      onlyLogin: true // Flag para executar apenas login
    };
    
    try {
      // Screenshot inicial
      await this.page.goto(testConfig.url);
      await this.page.screenshot({ 
        path: path.join(this.outputDir, '01-initial-page.png'),
        fullPage: true 
      });
      
      // Inicializar orquestrador
      const orchestrator = new OrchestratorAgent();
      await orchestrator.initialize();
      
      // Configurar orquestrador para executar apenas login
      const result = await orchestrator.executeLoginOnly({
        url: testConfig.url,
        credentials: testConfig.credentials,
        outputDir: this.outputDir
      });
      
      // Registrar resultado
      this.testResults.push({
        agent: 'OrchestratorAgent (Login Only)',
        success: result.success,
        method: result.method || 'unknown',
        duration: result.duration || 0,
        errors: result.errors || [],
        screenshots: result.screenshots || [],
        timestamp: new Date().toISOString()
      });
      
      // Screenshot final
      await this.page.screenshot({ 
        path: path.join(this.outputDir, '99-final-result.png'),
        fullPage: true 
      });
      
      console.log(`✅ Teste concluído - Sucesso: ${result.success}`);
      
    } catch (error) {
      console.error('❌ Erro durante teste:', error);
      
      this.testResults.push({
        agent: 'OrchestratorAgent (Login Only)',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      
      // Screenshot de erro
      if (this.page) {
        await this.page.screenshot({ 
          path: path.join(this.outputDir, '99-error.png'),
          fullPage: true 
        });
      }
    }
  }

  async generateReport(): Promise<void> {
    console.log('📊 Gerando relatório de testes...');
    
    const report = {
      testSuite: 'Login Orchestrator Test',
      timestamp: new Date().toISOString(),
      outputDirectory: this.outputDir,
      results: this.testResults,
      summary: {
        totalTests: this.testResults.length,
        successful: this.testResults.filter(r => r.success).length,
        failed: this.testResults.filter(r => !r.success).length,
        successRate: this.testResults.length > 0 
          ? (this.testResults.filter(r => r.success).length / this.testResults.length * 100).toFixed(2) + '%'
          : '0%'
      }
    };
    
    // Salvar relatório JSON
    await fs.writeFile(
      path.join(this.outputDir, 'test-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    // Salvar relatório legível
    const readableReport = `
# Relatório de Teste - Agente de Login via Orquestrador

## Resumo
- **Total de Testes**: ${report.summary.totalTests}
- **Sucessos**: ${report.summary.successful}
- **Falhas**: ${report.summary.failed}
- **Taxa de Sucesso**: ${report.summary.successRate}
- **Diretório de Saída**: ${this.outputDir}

## Resultados Detalhados

${this.testResults.map((result, index) => `
### Teste ${index + 1}: ${result.agent}
- **Sucesso**: ${result.success ? '✅' : '❌'}
- **Método**: ${result.method || 'N/A'}
- **Duração**: ${result.duration || 0}ms
- **Timestamp**: ${result.timestamp}
${result.errors?.length ? `- **Erros**: ${result.errors.join(', ')}` : ''}
${result.error ? `- **Erro**: ${result.error}` : ''}
`).join('')}

## Arquivos Gerados
- Screenshots: 01-initial-page.png, 99-final-result.png
- Logs: test-report.json
- Relatório: test-report.md
`;
    
    await fs.writeFile(
      path.join(this.outputDir, 'test-report.md'),
      readableReport
    );
    
    console.log('📋 Relatório salvo em:', this.outputDir);
    console.log('📊 Resumo:', report.summary);
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Limpando recursos...');
    
    if (this.browser) {
      await this.browser.close();
    }
    
    console.log('✅ Cleanup concluído');
  }

  async run(): Promise<void> {
    try {
      await this.setup();
      await this.testLoginWithOrchestrator();
      await this.generateReport();
    } catch (error) {
      console.error('💥 Erro fatal durante teste:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Executar teste se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const test = new LoginOrchestratorTest();
  test.run().catch(console.error);
}

export { LoginOrchestratorTest };