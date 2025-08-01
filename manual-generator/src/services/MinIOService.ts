import { Client } from 'minio';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { UrlUtils } from '../utils/index.js';

export interface MinIOConfig {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucketName: string;
}

export class MinIOService {
  private client: Client;
  private bucketName: string;
  private isConnected: boolean = false;
  private config: MinIOConfig;

  constructor(config: MinIOConfig) {
    // Validar configuração antes de criar o cliente
    if (!config.endPoint || config.endPoint.trim() === '') {
      throw new Error('MinIO endPoint é obrigatório');
    }
    
    if (!config.accessKey || !config.secretKey) {
      throw new Error('MinIO accessKey e secretKey são obrigatórios');
    }
    
    if (!config.bucketName || config.bucketName.trim() === '') {
      throw new Error('MinIO bucketName é obrigatório');
    }

    this.config = config;
    this.client = new Client({
      endPoint: config.endPoint,
      port: config.port,
      useSSL: config.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey
    });
    this.bucketName = config.bucketName;
  }

  async initialize(): Promise<void> {
    try {
      // Verificar se o bucket existe, se não, criar
      const exists = await this.client.bucketExists(this.bucketName);
      if (!exists) {
        await this.client.makeBucket(this.bucketName, 'us-east-1');
        console.log(`📦 Bucket '${this.bucketName}' criado com sucesso`);
      }
      
      this.isConnected = true;
      console.log(`✅ MinIO conectado - Bucket: ${this.bucketName}`);
    } catch (error) {
      console.warn(`⚠️ MinIO não disponível: ${error instanceof Error ? error.message : error}`);
      this.isConnected = false;
    }
  }

  async uploadImage(imagePath: string, prefix: string = 'screenshots'): Promise<string | null> {
    if (!this.isConnected) {
      console.log('🔄 MinIO não conectado, usando arquivo local');
      return null;
    }

    try {
      const objectName = `${prefix}/${uuidv4()}_${path.basename(imagePath)}`;
      
      // Upload do arquivo
      await this.client.fPutObject(this.bucketName, objectName, imagePath, {
        'Content-Type': 'image/png',
        'Cache-Control': 'max-age=31536000'
      });
      
      // Gerar URL público
      const protocol = this.config.useSSL ? 'https' : 'http';
      const url = `${protocol}://${this.config.endPoint}:${this.config.port}/${this.bucketName}/${objectName}`;
      
      // Validar URL gerada
      if (!UrlUtils.isValidUrl(url)) {
        console.error(`❌ URL inválida gerada: ${url}`);
        return null;
      }
      
      console.log(`☁️ Imagem enviada para MinIO: ${objectName}`);
      
      return url;
    } catch (error) {
      console.warn(`⚠️ Erro no upload para MinIO: ${error instanceof Error ? error.message : error}`);
      return null;
    }
  }

  async uploadBase64Image(base64: string, prefix: string = 'screenshots'): Promise<string | null> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const objectName = `${prefix}/${uuidv4()}.png`;
      
      await this.client.putObject(this.bucketName, objectName, buffer, buffer.length, {
        'Content-Type': 'image/png',
        'Cache-Control': 'max-age=31536000'
      });
      
      const protocol = this.config.useSSL ? 'https' : 'http';
      const url = `${protocol}://${this.config.endPoint}:${this.config.port}/${this.bucketName}/${objectName}`;
      
      // Validar URL gerada
      if (!UrlUtils.isValidUrl(url)) {
        console.error(`❌ URL inválida gerada: ${url}`);
        return null;
      }
      
      console.log(`☁️ Imagem base64 enviada para MinIO: ${objectName}`);
      
      return url;
    } catch (error) {
      console.warn(`⚠️ Erro no upload base64 para MinIO: ${error instanceof Error ? error.message : error}`);
      return null;
    }
  }

  async uploadScreenshotDirectory(directoryPath: string, prefix: string = 'manual'): Promise<Map<string, string>> {
    const uploadMap = new Map<string, string>();
    
    if (!this.isConnected) {
      console.log('🔄 MinIO não conectado, usando arquivos locais');
      return uploadMap;
    }

    try {
      const files = fs.readdirSync(directoryPath);
      const imageFiles = files.filter(file => 
        file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')
      );

      console.log(`📤 Enviando ${imageFiles.length} imagens para MinIO...`);

      for (const file of imageFiles) {
        const filePath = path.join(directoryPath, file);
        const url = await this.uploadImage(filePath, prefix);
        
        if (url) {
          uploadMap.set(file, url);
        } else {
          // Fallback para arquivo local
          uploadMap.set(file, `./${file}`);
        }
      }

      console.log(`✅ Upload concluído: ${uploadMap.size} arquivos processados`);
      
    } catch (error) {
      console.warn(`⚠️ Erro no upload do diretório: ${error instanceof Error ? error.message : error}`);
    }

    return uploadMap;
  }

  isAvailable(): boolean {
    return this.isConnected;
  }

  static createFromEnv(): MinIOService | null {
    const config = {
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '443'), // Padrão para HTTPS
      useSSL: process.env.MINIO_SECURE === 'true' || process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || '',
      secretKey: process.env.MINIO_SECRET_KEY || '',
      bucketName: process.env.MINIO_BUCKET_NAME || 'web-manuals'
    };

    // Validar endPoint básico
    if (!UrlUtils.validateMinIOEndpoint(config.endPoint, config.port, config.useSSL)) {
      console.error(`❌ Configuração MinIO inválida - EndPoint: ${config.endPoint}:${config.port} (SSL: ${config.useSSL})`);
      return null;
    }

    // Debug das configurações carregadas
    console.log('📋 Configurações MinIO:', {
      endPoint: config.endPoint,
      port: config.port,
      useSSL: config.useSSL,
      bucketName: config.bucketName,
      hasAccessKey: !!config.accessKey,
      hasSecretKey: !!config.secretKey,
      accessKeyPreview: config.accessKey ? config.accessKey.substring(0, 8) + '...' : 'N/A',
      secretKeyPreview: config.secretKey ? config.secretKey.substring(0, 8) + '...' : 'N/A'
    });

    if (!config.accessKey || !config.secretKey) {
      console.log('🔄 Credenciais MinIO não configuradas, usando arquivos locais');
      return null;
    }

    return new MinIOService(config);
  }
}
