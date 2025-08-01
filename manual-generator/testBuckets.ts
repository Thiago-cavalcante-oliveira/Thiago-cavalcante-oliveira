#!/usr/bin/env node
import dotenv from 'dotenv';
import { createRequire } from 'module';
import { MinIOService } from './src/services/MinIOService.js';

const require = createRequire(import.meta.url);
dotenv.config();

async function testMinIOBuckets() {
  console.log('🪣 VERIFICAÇÃO E CRIAÇÃO DE BUCKETS MinIO');
  console.log('==========================================');

  try {
    const minioService = MinIOService.createFromEnv();
    if (!minioService) {
      console.log('❌ MinIO não configurado');
      return;
    }

    const client = (minioService as any).client;
    const bucketName = process.env.MINIO_BUCKET_NAME || 'documentacao';

    console.log(`\n🔍 Verificando bucket: ${bucketName}`);

    // Listar todos os buckets
    const buckets = await client.listBuckets();
    console.log('\n📋 Buckets existentes:');
    buckets.forEach((bucket: any) => {
      console.log(`  - ${bucket.name} (criado: ${bucket.creationDate})`);
    });

    // Verificar se o bucket específico existe
    const bucketExists = await client.bucketExists(bucketName);
    console.log(`\n🪣 Bucket "${bucketName}": ${bucketExists ? '✅ Existe' : '❌ Não existe'}`);

    if (!bucketExists) {
      console.log(`\n📦 Tentando criar bucket "${bucketName}"...`);
      try {
        await client.makeBucket(bucketName, 'us-east-1');
        console.log(`✅ Bucket "${bucketName}" criado com sucesso!`);
      } catch (createError) {
        console.log(`❌ Erro ao criar bucket: ${createError instanceof Error ? createError.message : createError}`);
      }
    }

    // Testar upload de um arquivo de teste
    console.log(`\n🧪 Testando upload no bucket "${bucketName}"...`);
    try {
      const testContent = 'Este é um teste de upload para verificar permissões';
      await client.putObject(bucketName, 'test-file.txt', testContent, testContent.length, {
        'Content-Type': 'text/plain'
      });
      console.log('✅ Upload de teste bem-sucedido!');

      // Remover arquivo de teste
      await client.removeObject(bucketName, 'test-file.txt');
      console.log('🧹 Arquivo de teste removido');
    } catch (uploadError) {
      console.log(`❌ Erro no teste de upload: ${uploadError instanceof Error ? uploadError.message : uploadError}`);
    }

  } catch (error) {
    console.log(`❌ Erro geral: ${error instanceof Error ? error.message : error}`);
  }

  console.log('\n🎯 VERIFICAÇÃO DE BUCKETS CONCLUÍDA!');
}

testMinIOBuckets().catch(console.error);
