#!/usr/bin/env node
import dotenv from 'dotenv';
import { Client } from 'minio';

dotenv.config();

async function debugMinIO() {
  console.log('🔧 DEBUG DETALHADO MinIO');
  console.log('========================');

  console.log('\n📋 Configurações carregadas:');
  console.log(`MINIO_ENDPOINT: ${process.env.MINIO_ENDPOINT}`);
  console.log(`MINIO_ACCESS_KEY: ${process.env.MINIO_ACCESS_KEY}`);
  console.log(`MINIO_SECRET_KEY: ${process.env.MINIO_SECRET_KEY ? 'Definida' : 'Não definida'}`);
  console.log(`MINIO_BUCKET_NAME: ${process.env.MINIO_BUCKET_NAME}`);
  console.log(`MINIO_SECURE: ${process.env.MINIO_SECURE}`);

  const config = {
    endPoint: process.env.MINIO_ENDPOINT || 'minio-s3.pmfi.pr.gov.br',
    port: 443,
    useSSL: true,
    accessKey: process.env.MINIO_ACCESS_KEY || '',
    secretKey: process.env.MINIO_SECRET_KEY || ''
  };

  console.log('\n🔧 Configuração do cliente MinIO:');
  console.log(`Endpoint: ${config.endPoint}`);
  console.log(`Port: ${config.port}`);
  console.log(`UseSSL: ${config.useSSL}`);
  console.log(`AccessKey: ${config.accessKey.substring(0, 8)}...`);
  console.log(`SecretKey: ${config.secretKey.substring(0, 8)}...`);

  try {
    console.log('\n⏳ Criando cliente MinIO...');
    const client = new Client(config);
    
    console.log('✅ Cliente criado com sucesso');
    
    console.log('\n⏳ Testando listBuckets()...');
    const buckets = await client.listBuckets();
    
    console.log(`✅ Buckets encontrados: ${buckets.length}`);
    buckets.forEach((bucket, index) => {
      console.log(`   ${index + 1}. ${bucket.name} (criado: ${bucket.creationDate})`);
    });

    const bucketName = process.env.MINIO_BUCKET_NAME || 'documentacao';
    
    console.log(`\n⏳ Verificando se bucket "${bucketName}" existe...`);
    const exists = await client.bucketExists(bucketName);
    console.log(`Bucket "${bucketName}": ${exists ? '✅ Existe' : '❌ Não existe'}`);

    if (!exists) {
      console.log(`\n⏳ Tentando criar bucket "${bucketName}"...`);
      await client.makeBucket(bucketName, 'us-east-1');
      console.log(`✅ Bucket "${bucketName}" criado!`);
    }

    console.log(`\n⏳ Testando upload no bucket "${bucketName}"...`);
    const testContent = 'Teste MinIO - Manual Generator';
    await client.putObject(bucketName, 'test-upload.txt', testContent, testContent.length, {
      'Content-Type': 'text/plain'
    });
    console.log('✅ Upload realizado com sucesso!');

    console.log(`\n⏳ Listando objetos no bucket "${bucketName}"...`);
    const stream = client.listObjects(bucketName, '', true);
    const objects: any[] = [];
    
    for await (const obj of stream) {
      objects.push(obj);
    }
    
    console.log(`📋 Objetos encontrados: ${objects.length}`);
    objects.forEach((obj: any, index: number) => {
      console.log(`   ${index + 1}. ${obj.name} (${obj.size} bytes, modificado: ${obj.lastModified})`);
    });

    console.log(`\n⏳ Removendo arquivo de teste...`);
    await client.removeObject(bucketName, 'test-upload.txt');
    console.log('✅ Arquivo de teste removido');

    const url = `https://${config.endPoint}:${config.port}/${bucketName}/exemplo-screenshot.png`;
    console.log(`\n🔗 Exemplo de URL para imagens: ${url}`);

    console.log('\n🎯 TESTE MinIO CONCLUÍDO COM SUCESSO!');

  } catch (error) {
    console.log(`\n❌ ERRO: ${error instanceof Error ? error.message : error}`);
    if (error instanceof Error && error.stack) {
      console.log('\n📋 Stack trace:');
      console.log(error.stack);
    }
  }
}

debugMinIO().catch(console.error);
