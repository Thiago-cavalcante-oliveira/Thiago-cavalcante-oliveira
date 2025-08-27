// src/tests/CrawlingOrchestratorTest.ts
import 'dotenv/config';
import { OrchestratorAgent } from '../agents/OrchestratorAgent';
import * as path from 'path';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Teste completo para o agente de crawling via orquestrador.
 * Executa o pipeline completo incluindo login, crawling e geração de documentos.
 */
class CrawlingOrchestratorTest {
  private outputDir: string;
  private testResults: any[] = [];

  constructor() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.outputDir = path.join(__dirname, 'output', `crawling-orchestrator-test-${timestamp}`);
  }

  async setup(): Promise<void> {
    console.log('🚀 Iniciando teste do agente de crawling via orquestrador...');
    await fs.mkdir(this.outputDir, { recursive: true });
    console.log('✅ Setup concluído (output em:', this.outputDir, ')');
  }

  async testCrawlingWithOrchestrator(): Promise<void> {
    console.log('🔐 Testando crawling via OrchestratorAgent...');

    // Configuração de teste com credenciais das variáveis de ambiente
    const testConfig = {
      url: process.env.SAEB_URL || 'https://saeb-h1.pmfi.pr.gov.br/auth/signin',
      credentials: {
        username: process.env.SAEB_USERNAME || 'admin',
        password: process.env.SAEB_PASSWORD || 'admin123',
      },
      outputDir: this.outputDir,
    };

    console.log('📋 Configuração do teste:');
    console.log(`   URL: ${testConfig.url}`);
    console.log(`   Usuário: ${testConfig.credentials.username}`);
    console.log(`   Senha: ${testConfig.credentials.password ? '[DEFINIDA]' : '[NÃO DEFINIDA]'}`);
    console.log(`   Output: ${testConfig.outputDir}`);

    try {
      const orchestrator = new OrchestratorAgent();
      await orchestrator.initialize();

      const fullPipelineConfig = {
        targetUrl: testConfig.url,
        credentials: testConfig.credentials,
        outputDir: this.outputDir,
        enableScreenshots: true,
        outputFormats: ['markdown', 'pdf'] as ('markdown' | 'html' | 'pdf')[],
        crawlingStrategy: 'advanced' as 'basic' | 'advanced',
        maxRetries: 3,
        timeoutMinutes: 30,
        crawlingDepth: 3,
        maxPagesPerDomain: 50,
        enableDetailedAnalysis: true,
        generateTimeline: true
      };

      console.log('🚀 Executando pipeline completo (login + crawling + geração de documentos)...');
      const result = await orchestrator.executeFullPipeline(fullPipelineConfig);

      this.testResults.push({
        agent: 'OrchestratorAgent (Full Pipeline Completo)',
        success: result.success,
        data: {
          documentsGenerated: result.documentsGenerated,
          statistics: result.statistics,
          agentsExecuted: result.agentsExecuted,
        },
        errors: result.errors,
        timestamp: new Date().toISOString(),
      });

      console.log(`✅ Pipeline concluído - Sucesso: ${result.success}`);
      console.log('📊 Stats:', result.statistics);

      // finalize recursos do orchestrator (fecha browser, etc.)
      await orchestrator.cleanup();

    } catch (error) {
      console.error('❌ Erro durante teste de crawling:', error);

      this.testResults.push({
        agent: 'OrchestratorAgent (Full Pipeline Completo)',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    }
  }

  async generateReport(): Promise<void> {
    console.log('📊 Gerando relatório de testes...');

    const summary = {
      totalTests: this.testResults.length,
      successful: this.testResults.filter(r => r.success).length,
      failed: this.testResults.filter(r => !r.success).length,
    };
    const report = {
      testSuite: 'Complete Crawling Orchestrator Test',
      timestamp: new Date().toISOString(),
      outputDirectory: this.outputDir,
      results: this.testResults,
      summary: {
        ...summary,
        successRate:
          this.testResults.length > 0
            ? ((summary.successful / this.testResults.length) * 100).toFixed(2) + '%'
            : '0%',
      },
    };

    await fs.writeFile(
      path.join(this.outputDir, 'test-report.json'),
      JSON.stringify(report, null, 2),
    );

    const readableReport = `
# Relatório de Teste Completo - Agente de Crawling via Orquestrador

## Resumo
- **Total de Testes**: ${report.summary.totalTests}
- **Sucessos**: ${report.summary.successful}
- **Falhas**: ${report.summary.failed}
- **Taxa de Sucesso**: ${report.summary.successRate}
- **Diretório de Saída**: ${this.outputDir}

## Resultados Detalhados
${this.testResults
  .map((result, index) => `
### Teste ${index + 1}: ${result.agent}
- **Sucesso**: ${result.success ? '✅' : '❌'}
- **Timestamp**: ${result.timestamp}
${result.errors?.length ? `- **Erros**: ${result.errors.join(', ')}` : ''}
${result.error ? `- **Erro**: ${result.error}` : ''}
`)
  .join('')}
`;
    await fs.writeFile(path.join(this.outputDir, 'test-report.md'), readableReport);

    console.log('📋 Relatório salvo em:', this.outputDir);
    console.log('📊 Resumo:', report.summary);
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Limpando recursos... (nada adicional aqui, o Orchestrator fecha o browser)');
    console.log('✅ Cleanup concluído');
  }

  async run(): Promise<void> {
    try {
      await this.setup();
      await this.testCrawlingWithOrchestrator();
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
  const test = new CrawlingOrchestratorTest();
  test.run().catch(console.error);
}

export { CrawlingOrchestratorTest };
