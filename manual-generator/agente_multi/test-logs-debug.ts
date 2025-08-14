import { AnalysisAgent } from './agents/AnalysisAgent.js';
import { ContentAgent } from './agents/ContentAgent.js';
import { GeneratorAgent } from './agents/GeneratorAgent.js';
import { CrawlerAgent } from './agents/CrawlerAgent.js';
import { LoginAgent } from './agents/LoginAgent.js';
import { ScreenshotAgent } from './agents/ScreenshotAgent.js';
import * as fs from 'fs/promises';
import * as path from 'path';

async function testLogsGeneration() {
  console.log('🔍 TESTANDO GERAÇÃO DE LOGS DOS AGENTES');
  console.log('='.repeat(50));
  
  const logDir = path.join(process.cwd(), 'output', 'logs');
  
  // Limpar logs existentes
  try {
    await fs.rm(logDir, { recursive: true, force: true });
    console.log('📁 Diretório de logs limpo');
  } catch (error) {
    console.log('📁 Diretório de logs não existia');
  }
  
  // Criar diretório de logs
  await fs.mkdir(logDir, { recursive: true });
  console.log('📁 Diretório de logs criado:', logDir);
  
  // Teste AnalysisAgent
  console.log('\n🧠 Testando AnalysisAgent...');
  try {
    const analysisAgent = new AnalysisAgent('Teste de logs');
    await analysisAgent.initialize();
    console.log('✅ AnalysisAgent inicializado');
    
    // Verificar se o log foi criado
    const analysisLogFile = path.join(logDir, 'analysis-agent.log');
    try {
      const logContent = await fs.readFile(analysisLogFile, 'utf-8');
      console.log('✅ Log do AnalysisAgent criado:', logContent.split('\n').length, 'linhas');
    } catch (error) {
      console.log('❌ Log do AnalysisAgent não encontrado');
    }
  } catch (error) {
    console.log('❌ Erro no AnalysisAgent:', error);
  }
  
  // Teste ContentAgent
  console.log('\n📝 Testando ContentAgent...');
  try {
    const contentAgent = new ContentAgent('Teste de logs');
    await contentAgent.initialize();
    console.log('✅ ContentAgent inicializado');
    
    // Verificar se o log foi criado
    const contentLogFile = path.join(logDir, 'content-agent.log');
    try {
      const logContent = await fs.readFile(contentLogFile, 'utf-8');
      console.log('✅ Log do ContentAgent criado:', logContent.split('\n').length, 'linhas');
    } catch (error) {
      console.log('❌ Log do ContentAgent não encontrado');
    }
  } catch (error) {
    console.log('❌ Erro no ContentAgent:', error);
  }
  
  // Teste GeneratorAgent
  console.log('\n📄 Testando GeneratorAgent...');
  try {
    const generatorAgent = new GeneratorAgent('Teste de logs');
    await generatorAgent.initialize();
    console.log('✅ GeneratorAgent inicializado');
    
    // Verificar se o log foi criado
    const generatorLogFile = path.join(logDir, 'generator-agent.log');
    try {
      const logContent = await fs.readFile(generatorLogFile, 'utf-8');
      console.log('✅ Log do GeneratorAgent criado:', logContent.split('\n').length, 'linhas');
    } catch (error) {
      console.log('❌ Log do GeneratorAgent não encontrado');
    }
  } catch (error) {
    console.log('❌ Erro no GeneratorAgent:', error);
  }
  
  // Teste CrawlerAgent
  console.log('\n🕷️ Testando CrawlerAgent...');
  try {
    const crawlerAgent = new CrawlerAgent();
    await crawlerAgent.initialize();
    console.log('✅ CrawlerAgent inicializado');
    
    // Verificar se o log foi criado
    const crawlerLogFile = path.join(logDir, 'crawler-agent.log');
    try {
      const logContent = await fs.readFile(crawlerLogFile, 'utf-8');
      console.log('✅ Log do CrawlerAgent criado:', logContent.split('\n').length, 'linhas');
    } catch (error) {
      console.log('❌ Log do CrawlerAgent não encontrado');
    }
  } catch (error) {
    console.log('❌ Erro no CrawlerAgent:', error);
  }
  
  // Listar todos os arquivos de log criados
  console.log('\n📋 RESUMO DOS LOGS CRIADOS:');
  console.log('='.repeat(30));
  try {
    const logFiles = await fs.readdir(logDir);
    if (logFiles.length === 0) {
      console.log('❌ Nenhum arquivo de log foi criado');
    } else {
      for (const file of logFiles) {
        const filePath = path.join(logDir, file);
        const stats = await fs.stat(filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        console.log(`✅ ${file}: ${stats.size} bytes, ${content.split('\n').length} linhas`);
      }
    }
  } catch (error) {
    console.log('❌ Erro ao listar logs:', error);
  }
}

testLogsGeneration().catch(console.error);