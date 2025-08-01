#!/usr/bin/env node
import { APP_CONFIG } from './src/config/index.js'; // Isso vai carregar o .env
import { MinIOService } from './src/services/MinIOService.js';

console.log('🧪 Testando integração MinIO...');

async function testMinIOIntegration() {
  
  // Carregar configurações do .env
  console.log('\n📋 Variáveis de ambiente:');
  console.log('MINIO_ENDPOINT:', process.env.MINIO_ENDPOINT);
  console.log('MINIO_ACCESS_KEY:', process.env.MINIO_ACCESS_KEY ? '***configured***' : 'não definido');
  console.log('MINIO_SECRET_KEY:', process.env.MINIO_SECRET_KEY ? '***configured***' : 'não definido');
  console.log('MINIO_BUCKET_NAME:', process.env.MINIO_BUCKET_NAME);
  console.log('MINIO_SECURE:', process.env.MINIO_SECURE);
  
  // Criar serviço MinIO
  const minioService = MinIOService.createFromEnv();
  
  if (!minioService) {
    console.log('❌ MinIOService não pôde ser criado - verificar configurações');
    return;
  }
  
  // Tentar inicializar
  console.log('\n🔄 Tentando conectar ao MinIO...');
  await minioService.initialize();
  
  if (minioService.isAvailable()) {
    console.log('✅ Conexão com MinIO estabelecida com sucesso!');
    console.log('🎯 Integração MinIO está funcionando corretamente');
  } else {
    console.log('❌ Não foi possível conectar ao MinIO');
    console.log('💡 Verificar credenciais e conectividade de rede');
  }
}

testMinIOIntegration().catch(console.error);
