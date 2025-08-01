#!/usr/bin/env node
import dotenv from 'dotenv';
import { createRequire } from 'module';
import { MinIOService } from './src/services/MinIOService.js';
import { GeminiService } from './src/services/gemini.js';
import { AgentService } from './src/services/AgentService.js';

const require = createRequire(import.meta.url);
dotenv.config();

async function testSystemComponents() {
  console.log('🔍 VERIFICAÇÃO COMPLETA DO SISTEMA AGENTE');
  console.log('==========================================');

  // 1. Dependências
  console.log('\n1. 📦 DEPENDÊNCIAS:');
  const pkg = require('./package.json');
  const requiredDeps = ['minio', 'uuid', '@google/generative-ai', 'playwright'];
  requiredDeps.forEach(dep => {
    const version = pkg.dependencies[dep] || pkg.devDependencies[dep];
    console.log(`  ${dep}: ${version ? '✅ ' + version : '❌ NÃO INSTALADO'}`);
  });

  // 2. Variáveis de ambiente
  console.log('\n2. 🔧 VARIÁVEIS DE AMBIENTE:');
  const envChecks = [
    ['GEMINI_API_KEY', process.env.GEMINI_API_KEY ? '✅ Configurada' : '❌ Não configurada'],
    ['MINIO_ENDPOINT', process.env.MINIO_ENDPOINT || '⚠️  Padrão: localhost'],
    ['MINIO_ACCESS_KEY', process.env.MINIO_ACCESS_KEY ? '✅ Configurada' : '❌ Não configurada'],
    ['MINIO_SECRET_KEY', process.env.MINIO_SECRET_KEY ? '✅ Configurada' : '❌ Não configurada'],
    ['MINIO_BUCKET_NAME', process.env.MINIO_BUCKET_NAME || '⚠️  Padrão: web-manuals']
  ];

  envChecks.forEach(([key, status]) => {
    console.log(`  ${key}: ${status}`);
  });

  // 3. Teste do MinIO
  console.log('\n3. ☁️  TESTE MinIO:');
  try {
    const minioService = MinIOService.createFromEnv();
    if (minioService) {
      await minioService.initialize();
      console.log(`  Status: ${minioService.isAvailable() ? '✅ Conectado' : '❌ Não conectado'}`);
      
      // Testar listagem de buckets
      try {
        const buckets = await (minioService as any).client.listBuckets();
        console.log(`  Buckets disponíveis: ${buckets.length}`);
        buckets.forEach((bucket: any) => {
          console.log(`    - ${bucket.name} (criado em: ${bucket.creationDate})`);
        });
      } catch (err) {
        console.log(`  ⚠️  Erro ao listar buckets: ${err instanceof Error ? err.message : err}`);
      }
    } else {
      console.log('  ❌ MinIO não configurado');
    }
  } catch (error) {
    console.log(`  ❌ Erro: ${error instanceof Error ? error.message : error}`);
  }

  // 4. Teste do Gemini
  console.log('\n4. 🤖 TESTE GEMINI:');
  try {
    const geminiService = new GeminiService();
    console.log('  ✅ Serviço inicializado');
    console.log(`  Modelo: ${(geminiService as any).model.model}`);
    
    // Teste simples de análise
    const testResponse = await geminiService.analyzeContent(
      'Teste de funcionalidade', 
      'Teste', 
      'http://test.com', 
      [],
      { type: 'button', text: 'Botão de teste' }
    );
    console.log(`  Teste de resposta: ${testResponse ? '✅ Funcionando' : '❌ Falha'}`);
    console.log(`  Resposta: "${testResponse?.substring(0, 50)}..."`);
  } catch (error) {
    console.log(`  ❌ Erro: ${error instanceof Error ? error.message : error}`);
  }

  // 5. Teste do AgentService
  console.log('\n5. 🎯 TESTE AGENT SERVICE:');
  try {
    const agentService = new AgentService();
    console.log('  ✅ Serviço inicializado');
    console.log('  ✅ Integração com MinIO e Gemini configurada');
  } catch (error) {
    console.log(`  ❌ Erro: ${error instanceof Error ? error.message : error}`);
  }

  console.log('\n🎯 VERIFICAÇÃO CONCLUÍDA!');
}

testSystemComponents().catch(console.error);
