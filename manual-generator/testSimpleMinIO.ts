#!/usr/bin/env node
import dotenv from 'dotenv';
import { Client } from 'minio';

dotenv.config();

async function simpleMinIOTest() {
  console.log('🔧 TESTE SIMPLES DE CONECTIVIDADE MinIO');
  console.log('=======================================');

  const configs = [
    // Configuração atual
    {
      name: 'Configuração atual (porta 443)',
      endPoint: process.env.MINIO_ENDPOINT || 'minio-s3.pmfi.pr.gov.br',
      port: 443,
      useSSL: true,
      accessKey: process.env.MINIO_ACCESS_KEY || '',
      secretKey: process.env.MINIO_SECRET_KEY || ''
    },
    // Teste sem porta explícita
    {
      name: 'Configuração sem porta (padrão SSL)',
      endPoint: process.env.MINIO_ENDPOINT || 'minio-s3.pmfi.pr.gov.br',
      useSSL: true,
      accessKey: process.env.MINIO_ACCESS_KEY || '',
      secretKey: process.env.MINIO_SECRET_KEY || ''
    }
  ];

  for (const config of configs) {
    console.log(`\n🧪 Testando: ${config.name}`);
    console.log(`   Endpoint: ${config.endPoint}`);
    console.log(`   Port: ${(config as any).port || 'padrão'}`);
    console.log(`   SSL: ${config.useSSL}`);
    console.log(`   Access Key: ${config.accessKey.substring(0, 8)}...`);

    try {
      const client = new Client(config as any);
      
      console.log('   ⏳ Testando listBuckets...');
      const buckets = await client.listBuckets();
      console.log(`   ✅ Sucesso! Buckets encontrados: ${buckets.length}`);
      buckets.forEach((bucket: any) => {
        console.log(`      - ${bucket.name}`);
      });
      
      // Se chegou até aqui, esta configuração funciona
      console.log(`   🎯 CONFIGURAÇÃO FUNCIONANDO!`);
      break;
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log('\n🎯 TESTE DE CONECTIVIDADE CONCLUÍDO!');
}

simpleMinIOTest().catch(console.error);
