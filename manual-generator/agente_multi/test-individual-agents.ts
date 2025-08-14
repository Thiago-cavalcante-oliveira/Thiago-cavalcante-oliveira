import { LoginAgent } from './agents/LoginAgent.js';
import { CrawlerAgent } from './agents/CrawlerAgent.js';
import { AnalysisAgent } from './agents/AnalysisAgent.js';
import { ContentAgent } from './agents/ContentAgent.js';
import { GeneratorAgent } from './agents/GeneratorAgent.js';
import { ScreenshotAgent } from './agents/ScreenshotAgent.js';
import { MinIOService } from './services/MinIOService.js';
import { TaskData } from './core/AgnoSCore.js';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

interface TestConfig {
  url: string;
  username: string;
  password: string;
  maxPages: number;
  timeout: number;
  debugMode: boolean;
}

const config: TestConfig = {
  url: 'https://saeb-h1.pmfi.pr.gov.br/auth/signin',
  username: 'admin',
  password: 'admin123',
  maxPages: 3,
  timeout: 30000,
  debugMode: true
};

class IndividualAgentTester {
  private minioService: MinIOService;
  
  constructor() {
    this.minioService = new MinIOService();
  }

  async testLoginAgent(): Promise<void> {
    console.log('\n🔐 TESTANDO LOGIN AGENT');
    console.log('=' .repeat(50));
    
    try {
      const loginAgent = new LoginAgent();
      await loginAgent.initialize();
      
      console.log('✅ LoginAgent inicializado com sucesso');
      
      const taskData: TaskData = {
        id: `login-test-${Date.now()}`,
        type: 'authenticate',
        data: {
          url: config.url,
          credentials: {
            username: config.username,
            password: config.password
          }
        },
        sender: 'test-individual-agents',
        timestamp: new Date(),
        priority: 'medium'
      };
      
      const result = await loginAgent.processTask(taskData);
      
      if (result.success) {
        console.log('✅ Login realizado com sucesso');
        console.log(`📄 Sucesso: ${result.success}`);
        
        if (result.data?.screenshots) {
          console.log(`📸 Screenshots capturados: ${Object.keys(result.data.screenshots).length}`);
        }
      } else {
        console.error('❌ Falha no login:', result.error);
      }
      
      await loginAgent.cleanup();
      
    } catch (error) {
      console.error('❌ Erro no teste do LoginAgent:', error);
    }
  }

  async testCrawlerAgent(): Promise<void> {
    console.log('\n🕷️ TESTANDO CRAWLER AGENT');
    console.log('=' .repeat(50));
    
    try {
      const crawlerAgent = new CrawlerAgent();
      await crawlerAgent.initialize();
      
      console.log('✅ CrawlerAgent inicializado com sucesso');
      
      const taskData: TaskData = {
        id: `crawler-test-${Date.now()}`,
        type: 'crawl_page',
        data: {
          startUrl: config.url,
          credentials: {
            username: config.username,
            password: config.password
          },
          maxPages: config.maxPages,
          timeout: config.timeout
        },
        sender: 'test-individual-agents',
        timestamp: new Date(),
        priority: 'medium'
      };
      
      const result = await crawlerAgent.processTask(taskData);
      
      if (result.success) {
        console.log('✅ Crawling realizado com sucesso');
        console.log(`📊 Sucesso: ${result.success}`);
        
        if (result.data) {
          console.log(`📄 Dados coletados: ${JSON.stringify(result.data).length} caracteres`);
          
          // Salvar resultado do crawling
          const reportUrl = await this.minioService.uploadBuffer(
            Buffer.from(JSON.stringify(result.data, null, 2)),
            `crawler-test-${Date.now()}.json`,
            'application/json'
          );
          console.log(`📄 Relatório salvo: ${reportUrl}`);
        }
      } else {
        console.error('❌ Falha no crawling:', result.error);
      }
      
      await crawlerAgent.cleanup();
      
    } catch (error) {
      console.error('❌ Erro no teste do CrawlerAgent:', error);
    }
  }

  async testAnalysisAgent(): Promise<void> {
    console.log('\n🔍 TESTANDO ANALYSIS AGENT');
    console.log('=' .repeat(50));
    
    try {
      const analysisAgent = new AnalysisAgent('analysis-prompt');
      await analysisAgent.initialize();
      
      console.log('✅ AnalysisAgent inicializado com sucesso');
      
      // Simular dados de entrada para análise
      const mockCrawlData = {
        pages: [{
          url: config.url,
          title: 'Sistema SAEB - Login',
          elements: [
            { type: 'input', name: 'username', label: 'Usuário' },
            { type: 'input', name: 'password', label: 'Senha' },
            { type: 'button', name: 'submit', label: 'Entrar' }
          ],
          screenshot: 'mock-screenshot-path'
        }]
      };
      
      const taskData: TaskData = {
        id: `analysis-test-${Date.now()}`,
        type: 'analyze_crawl_data',
        data: {
          crawlData: mockCrawlData,
          authContext: { authenticated: true }
        },
        sender: 'test-individual-agents',
        timestamp: new Date(),
        priority: 'medium'
      };
      
      const result = await analysisAgent.processTask(taskData);
      
      if (result.success) {
        console.log('✅ Análise realizada com sucesso');
        console.log(`📊 Sucesso: ${result.success}`);
        
        // Salvar resultado da análise
        const reportUrl = await this.minioService.uploadBuffer(
          Buffer.from(JSON.stringify(result.data, null, 2)),
          `analysis-test-${Date.now()}.json`,
          'application/json'
        );
        console.log(`📄 Relatório salvo: ${reportUrl}`);
      } else {
        console.error('❌ Falha na análise:', result.error);
      }
      
      await analysisAgent.cleanup();
      
    } catch (error) {
      console.error('❌ Erro no teste do AnalysisAgent:', error);
    }
  }

  async testContentAgent(): Promise<void> {
    console.log('\n📝 TESTANDO CONTENT AGENT');
    console.log('=' .repeat(50));
    
    try {
      const contentAgent = new ContentAgent('content-prompt');
      await contentAgent.initialize();
      
      console.log('✅ ContentAgent inicializado com sucesso');
      
      // Simular dados de análise
      const mockAnalysis = {
        summary: 'Sistema SAEB para gestão educacional',
        pageAnalyses: [{
          url: config.url,
          title: 'Login SAEB',
          purpose: 'Autenticação de usuários',
          elementAnalyses: [{
            id: 'login-form',
            description: 'Formulário de login',
            functionality: 'Autenticação',
            category: 'authentication'
          }]
        }]
      };
      
      const taskData: TaskData = {
        id: `content-test-${Date.now()}`,
        type: 'generate_user_friendly_content',
        data: {
          crawlAnalysis: mockAnalysis,
          authContext: { authenticated: true },
          rawData: []
        },
        sender: 'test-individual-agents',
        timestamp: new Date(),
        priority: 'medium'
      };
      
      const result = await contentAgent.processTask(taskData);
      
      if (result.success) {
        console.log('✅ Conteúdo gerado com sucesso');
        console.log(`📄 Sucesso: ${result.success}`);
        
        // Salvar conteúdo gerado
        const contentUrl = await this.minioService.uploadBuffer(
          Buffer.from(JSON.stringify(result.data, null, 2)),
          `content-test-${Date.now()}.json`,
          'application/json'
        );
        console.log(`📄 Conteúdo salvo: ${contentUrl}`);
      } else {
        console.error('❌ Falha na geração de conteúdo:', result.error);
      }
      
      await contentAgent.cleanup();
      
    } catch (error) {
      console.error('❌ Erro no teste do ContentAgent:', error);
    }
  }

  async testGeneratorAgent(): Promise<void> {
    console.log('\n📋 TESTANDO GENERATOR AGENT');
    console.log('=' .repeat(50));
    
    try {
      const generatorAgent = new GeneratorAgent('generator-prompt');
      await generatorAgent.initialize();
      
      console.log('✅ GeneratorAgent inicializado com sucesso');
      
      // Simular conteúdo para geração de documento
      const mockContent = {
        metadata: {
          title: 'Manual do Sistema SAEB',
          version: '1.0.0'
        },
        sections: [{
          title: 'Login no Sistema',
          description: 'Como acessar o sistema',
          steps: [{
            stepNumber: 1,
            action: 'Acessar URL',
            description: 'Abrir o navegador e acessar o sistema'
          }]
        }]
      };
      
      const taskData: TaskData = {
        id: `generator-test-${Date.now()}`,
        type: 'generate_final_documents',
        data: {
          content: mockContent,
          formats: ['pdf', 'markdown']
        },
        sender: 'test-individual-agents',
        timestamp: new Date(),
        priority: 'medium'
      };
      
      const result = await generatorAgent.processTask(taskData);
      
      if (result.success) {
        console.log('✅ Documento gerado com sucesso');
        console.log(`📄 Sucesso: ${result.success}`);
        
        if (result.data?.urls) {
          console.log(`🔗 URLs dos documentos: ${Object.keys(result.data.urls).join(', ')}`);
        }
      } else {
        console.error('❌ Falha na geração do documento:', result.error);
      }
      
      await generatorAgent.cleanup();
      
    } catch (error) {
      console.error('❌ Erro no teste do GeneratorAgent:', error);
    }
  }

  async testScreenshotAgent(): Promise<void> {
    console.log('\n📸 TESTANDO SCREENSHOT AGENT');
    console.log('=' .repeat(50));
    
    try {
      const screenshotAgent = new ScreenshotAgent();
      await screenshotAgent.initialize();
      
      console.log('✅ ScreenshotAgent inicializado com sucesso');
      
      const taskData: TaskData = {
        id: `screenshot-test-${Date.now()}`,
        type: 'take_screenshot',
        data: {
          url: config.url,
          outputPath: `screenshot-test-${Date.now()}.png`,
          type: 'fullpage'
        },
        sender: 'test-individual-agents',
        timestamp: new Date(),
        priority: 'medium'
      };
      
      const result = await screenshotAgent.processTask(taskData);
      
      if (result.success) {
        console.log('✅ Screenshot capturado com sucesso');
        console.log(`📸 Sucesso: ${result.success}`);
        
        if (result.data?.path) {
          console.log(`📄 Caminho: ${result.data.path}`);
        }
      } else {
        console.error('❌ Falha na captura de screenshot:', result.error);
      }
      
      await screenshotAgent.cleanup();
      
    } catch (error) {
      console.error('❌ Erro no teste do ScreenshotAgent:', error);
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 INICIANDO TESTES INDIVIDUAIS DOS AGENTES');
    console.log('=' .repeat(60));
    console.log(`🌐 URL: ${config.url}`);
    console.log(`👤 Usuário: ${config.username}`);
    console.log(`📄 Máximo de páginas: ${config.maxPages}`);
    console.log(`⏱️ Timeout: ${config.timeout}ms`);
    console.log(`🐛 Modo debug: ${config.debugMode ? 'Ativado' : 'Desativado'}`);
    
    const tests = [
      { name: 'LoginAgent', fn: () => this.testLoginAgent() },
      { name: 'CrawlerAgent', fn: () => this.testCrawlerAgent() },
      { name: 'AnalysisAgent', fn: () => this.testAnalysisAgent() },
      { name: 'ContentAgent', fn: () => this.testContentAgent() },
      { name: 'GeneratorAgent', fn: () => this.testGeneratorAgent() },
      { name: 'ScreenshotAgent', fn: () => this.testScreenshotAgent() }
    ];
    
    for (const test of tests) {
      try {
        console.log(`\n🧪 Executando teste: ${test.name}`);
        await test.fn();
        console.log(`✅ Teste ${test.name} concluído`);
      } catch (error) {
        console.error(`❌ Erro no teste ${test.name}:`, error);
      }
      
      // Pausa entre testes
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n🎉 TODOS OS TESTES INDIVIDUAIS CONCLUÍDOS!');
    console.log('=' .repeat(60));
  }
}

// Função para executar um agente específico
export async function testSpecificAgent(agentName: string): Promise<void> {
  const tester = new IndividualAgentTester();
  
  switch (agentName.toLowerCase()) {
    case 'login':
      await tester.testLoginAgent();
      break;
    case 'crawler':
      await tester.testCrawlerAgent();
      break;
    case 'analysis':
      await tester.testAnalysisAgent();
      break;
    case 'content':
      await tester.testContentAgent();
      break;
    case 'generator':
      await tester.testGeneratorAgent();
      break;
    case 'screenshot':
      await tester.testScreenshotAgent();
      break;
    default:
      console.error(`❌ Agente '${agentName}' não reconhecido`);
      console.log('Agentes disponíveis: login, crawler, analysis, content, generator, screenshot');
  }
}

// Executar todos os testes se chamado diretamente
if (process.argv[2]) {
  testSpecificAgent(process.argv[2]).catch(console.error);
} else {
  const tester = new IndividualAgentTester();
  tester.runAllTests().catch(console.error);
}