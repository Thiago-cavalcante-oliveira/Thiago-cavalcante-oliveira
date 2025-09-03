import { Client } from 'minio';
import * as fs from 'fs/promises';
import * as path from 'path';
import { env } from '../config/env.js';
import * as dotenv from 'dotenv';
import { Client } from 'minio';

dotenv.config();

export class MinIOService {
  private client!: Client; // Usar ! para indicar que será inicializado condicionalmente
  private bucketName: string;
  private isAvailable: boolean = false;
  private endPoint: string;
  private enabled: boolean = false;

  constructor() {
    // Usar variáveis de ambiente diretamente do env
    let endpoint: string;
    let useSSL: boolean;
    let accessKey: string;
    let secretKey: string;
    let bucketName: string;
    
    // Usar valores padrão se as variáveis não estiverem definidas
    endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    useSSL = process.env.MINIO_USE_SSL === 'true';
    accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
    secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';
    bucketName = process.env.MINIO_BUCKET_NAME || 'documentacao';
    
    this.bucketName = bucketName;
    this.endPoint = endpoint;
    this.enabled = !!(endpoint && accessKey && secretKey);

    if (this.enabled) {
      this.client = new Client({
        endPoint: endpoint,
        port: useSSL ? 443 : 80,
        useSSL: useSSL,
        accessKey: accessKey,
        secretKey: secretKey
      });
      console.log(`✅ MinIO configurado: ${useSSL ? 'https' : 'http'}://${endpoint}:${useSSL ? 443 : 80}`);
    } else {
      console.log('⚠️  MinIO não configurado - usando apenas armazenamento local');
    }
  }

  async initialize(): Promise<void> {
    try {
      console.log('🗄️ [MinIO] Verificando conexão...');
      
      // Testar conexão
      await this.client.listBuckets();
      
      // Verificar/criar bucket
      const bucketExists = await this.client.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.client.makeBucket(this.bucketName);
        console.log(`✅ [MinIO] Bucket '${this.bucketName}' criado`);
      }

      this.isAvailable = true;
      console.log(`✅ [MinIO] Conectado ao bucket '${this.bucketName}'`);

    } catch (error) {
      console.log(`⚠️ [MinIO] Não disponível: ${error instanceof Error ? error.message : error}`);
      this.isAvailable = false;
    }
  }

  async uploadFile(localPath: string, remotePath: string, contentType?: string): Promise<string | null> {
    if (!this.isAvailable) {
      console.log('⚠️ [MinIO] Serviço não disponível, salvando localmente');
      return null;
    }

    try {
      const stats = await fs.stat(localPath);
      
      await this.client.fPutObject(
        this.bucketName,
        remotePath,
        localPath,
        {
          'Content-Type': contentType || this.getContentType(localPath),
          'Content-Length': stats.size
        }
      );

      const url = `https://${this.endPoint}/${this.bucketName}/${remotePath}`;
      console.log(`📤 [MinIO] Upload realizado: ${remotePath}`);
      
      return url;

    } catch (error) {
      console.log(`❌ [MinIO] Erro no upload de ${localPath}: ${error}`);
      return null;
    }
  }

  async uploadBuffer(buffer: Buffer, remotePath: string, contentType: string): Promise<string | null> {
    if (!this.isAvailable) {
      console.log('⚠️ [MinIO] Serviço não disponível');
      return null;
    }

    try {
      await this.client.putObject(
        this.bucketName,
        remotePath,
        buffer,
        buffer.length,
        {
          'Content-Type': contentType
        }
      );

      const url = `https://${this.endPoint}/${this.bucketName}/${remotePath}`;
      console.log(`📤 [MinIO] Buffer upload realizado: ${remotePath}`);
      
      return url;

    } catch (error) {
      console.log(`❌ [MinIO] Erro no upload do buffer: ${error}`);
      return null;
    }
  }

  async uploadScreenshot(localPath: string, filename: string): Promise<string | null> {
    const remotePath = `screenshots/${filename}`;
    return await this.uploadFile(localPath, remotePath, 'image/png');
  }

  async uploadManual(content: string, filename: string, format: 'md' | 'html' | 'pdf'): Promise<string | null> {
    if (!this.isAvailable) {
      return null;
    }

    try {
      const remotePath = `manuais/${format}/${filename}`;
      const contentType = this.getContentTypeForFormat(format);
      const buffer = Buffer.from(content, 'utf-8');

      return await this.uploadBuffer(buffer, remotePath, contentType);

    } catch (error) {
      console.log(`❌ [MinIO] Erro no upload do manual: ${error}`);
      return null;
    }
  }

  async uploadReportMarkdown(content: string, agentName: string, taskId: string): Promise<string | null> {
    if (!this.isAvailable) {
      return null;
    }

    const remotePath = `relatorios/${agentName}/${taskId}.md`;
    const buffer = Buffer.from(content, 'utf-8');
    
    return await this.uploadBuffer(buffer, remotePath, 'text/markdown');
  }

  async downloadFile(remotePath: string, localPath: string): Promise<boolean> {
    if (!this.isAvailable) {
      return false;
    }

    try {
      await this.client.fGetObject(this.bucketName, remotePath, localPath);
      console.log(`📥 [MinIO] Download realizado: ${remotePath} -> ${localPath}`);
      return true;

    } catch (error) {
      console.log(`❌ [MinIO] Erro no download: ${error}`);
      return false;
    }
  }

  async listFiles(prefix?: string): Promise<string[]> {
    if (!this.isAvailable) {
      return [];
    }

    try {
      const files: string[] = [];
      const stream = this.client.listObjects(this.bucketName, prefix, true);
      
      return new Promise((resolve, reject) => {
        stream.on('data', (obj) => {
          if (obj.name) {
            files.push(obj.name);
          }
        });

        stream.on('error', (error) => {
          reject(error);
        });

        stream.on('end', () => {
          resolve(files);
        });
      });

    } catch (error) {
      console.log(`❌ [MinIO] Erro ao listar arquivos: ${error}`);
      return [];
    }
  }

  async deleteFile(remotePath: string): Promise<boolean> {
    if (!this.isAvailable) {
      return false;
    }

    try {
      await this.client.removeObject(this.bucketName, remotePath);
      console.log(`🗑️ [MinIO] Arquivo removido: ${remotePath}`);
      return true;

    } catch (error) {
      console.log(`❌ [MinIO] Erro ao remover arquivo: ${error}`);
      return false;
    }
  }

  async getFileUrl(remotePath: string, expiry: number = 7 * 24 * 60 * 60): Promise<string | null> {
    if (!this.isAvailable) {
      return null;
    }

    try {
      const url = await this.client.presignedGetObject(this.bucketName, remotePath, expiry);
      return url;

    } catch (error) {
      console.log(`❌ [MinIO] Erro ao gerar URL: ${error}`);
      return null;
    }
  }

  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    
    const contentTypes: { [key: string]: string } = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.html': 'text/html',
      '.md': 'text/markdown',
      '.txt': 'text/plain',
      '.json': 'application/json'
    };

    return contentTypes[ext] || 'application/octet-stream';
  }

  private getContentTypeForFormat(format: 'md' | 'html' | 'pdf'): string {
    const types = {
      'md': 'text/markdown',
      'html': 'text/html',
      'pdf': 'application/pdf'
    };

    return types[format];
  }

  isServiceAvailable(): boolean {
    return this.isAvailable;
  }

  getBucketName(): string {
    return this.bucketName;
  }
}
