#!/usr/bin/env node
import dotenv from 'dotenv';
import { Client } from 'minio';

dotenv.config();

async function createBucketIfNeeded() {
  console.log('🪣 CRIAÇÃO DO BUCKET DOCUMENTACAO');
  console.log('=================================');

  try {
    const client = new Client({
      endPoint: process.env.MINIO_ENDPOINT || 'minio-s3.pmfi.pr.gov.br',
      port: 443,
      useSSL: true,
      accessKey: process.env.MINIO_ACCESS_KEY || '',
      secretKey: process.env.MINIO_SECRET_KEY || ''
    });

    const bucketName = process.env.MINIO_BUCKET_NAME || 'documentacao';

    console.log(`🔍 Verificando bucket: ${bucketName}`);

    // Verificar se existe
    const exists = await client.bucketExists(bucketName);
    console.log(`Bucket "${bucketName}": ${exists ? '✅ Já existe' : '❌ Não existe'}`);

    if (!exists) {
      console.log(`\n📦 Criando bucket "${bucketName}"...`);
      await client.makeBucket(bucketName, 'us-east-1');
      console.log(`✅ Bucket "${bucketName}" criado com sucesso!`);
    }

    // Testar upload
    console.log(`\n🧪 Testando upload no bucket "${bucketName}"...`);
    const testContent = 'Teste de permissões para manual generator';
    await client.putObject(bucketName, 'test-manual-generator.txt', testContent, testContent.length, {
      'Content-Type': 'text/plain'
    });
    console.log('✅ Upload de teste bem-sucedido!');

    // Listar objetos no bucket
    const stream = client.listObjects(bucketName, '', true);
    const objects: any[] = [];
    
    for await (const obj of stream) {
      objects.push(obj);
    }
    
    console.log(`📋 Objetos no bucket: ${objects.length}`);
    objects.forEach(obj => {
      console.log(`   - ${obj.name} (${obj.size} bytes)`);
    });

    // Remover arquivo de teste
    await client.removeObject(bucketName, 'test-manual-generator.txt');
    console.log('🧹 Arquivo de teste removido');

    // URL de exemplo
    const protocol = 'https';
    const exampleUrl = `${protocol}://${process.env.MINIO_ENDPOINT}:443/${bucketName}/exemplo.png`;
    console.log(`\n🔗 Exemplo de URL gerada: ${exampleUrl}`);

  } catch (error) {
    console.log(`❌ Erro: ${error instanceof Error ? error.message : error}`);
  }

  console.log('\n🎯 VERIFICAÇÃO DE BUCKET CONCLUÍDA!');
}

createBucketIfNeeded().catch(console.error);
