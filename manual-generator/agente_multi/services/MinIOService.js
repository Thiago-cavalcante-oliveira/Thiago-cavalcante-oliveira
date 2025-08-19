"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinIOService = void 0;
const minio_1 = require("minio");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
class MinIOService {
    constructor() {
        this.isAvailable = false;
        this.enabled = false;
        const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
        const useSSL = process.env.MINIO_SECURE === 'true';
        const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
        const secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';
        this.bucketName = process.env.MINIO_BUCKET_NAME || 'documentacao';
        this.endPoint = endpoint;
        this.enabled = !!(endpoint && accessKey && secretKey);
        if (this.enabled) {
            this.client = new minio_1.Client({
                endPoint: endpoint,
                port: useSSL ? 443 : 80,
                useSSL: useSSL,
                accessKey: accessKey,
                secretKey: secretKey
            });
            console.log(`✅ MinIO configurado: ${useSSL ? 'https' : 'http'}://${endpoint}:${useSSL ? 443 : 80}`);
        }
        else {
            console.log('⚠️  MinIO não configurado - usando apenas armazenamento local');
        }
    }
    async initialize() {
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
        }
        catch (error) {
            console.log(`⚠️ [MinIO] Não disponível: ${error instanceof Error ? error.message : error}`);
            this.isAvailable = false;
        }
    }
    async uploadFile(localPath, remotePath, contentType) {
        if (!this.isAvailable) {
            console.log('⚠️ [MinIO] Serviço não disponível, salvando localmente');
            return null;
        }
        try {
            const stats = await fs.stat(localPath);
            await this.client.fPutObject(this.bucketName, remotePath, localPath, {
                'Content-Type': contentType || this.getContentType(localPath),
                'Content-Length': stats.size
            });
            const url = `https://${this.endPoint}/${this.bucketName}/${remotePath}`;
            console.log(`📤 [MinIO] Upload realizado: ${remotePath}`);
            return url;
        }
        catch (error) {
            console.log(`❌ [MinIO] Erro no upload de ${localPath}: ${error}`);
            return null;
        }
    }
    async uploadBuffer(buffer, remotePath, contentType) {
        if (!this.isAvailable) {
            console.log('⚠️ [MinIO] Serviço não disponível');
            return null;
        }
        try {
            await this.client.putObject(this.bucketName, remotePath, buffer, buffer.length, {
                'Content-Type': contentType
            });
            const url = `https://${this.endPoint}/${this.bucketName}/${remotePath}`;
            console.log(`📤 [MinIO] Buffer upload realizado: ${remotePath}`);
            return url;
        }
        catch (error) {
            console.log(`❌ [MinIO] Erro no upload do buffer: ${error}`);
            return null;
        }
    }
    async uploadScreenshot(localPath, filename) {
        const remotePath = `screenshots/${filename}`;
        return await this.uploadFile(localPath, remotePath, 'image/png');
    }
    async uploadManual(content, filename, format) {
        if (!this.isAvailable) {
            return null;
        }
        try {
            const remotePath = `manuais/${format}/${filename}`;
            const contentType = this.getContentTypeForFormat(format);
            const buffer = Buffer.from(content, 'utf-8');
            return await this.uploadBuffer(buffer, remotePath, contentType);
        }
        catch (error) {
            console.log(`❌ [MinIO] Erro no upload do manual: ${error}`);
            return null;
        }
    }
    async uploadReportMarkdown(content, agentName, taskId) {
        if (!this.isAvailable) {
            return null;
        }
        const remotePath = `relatorios/${agentName}/${taskId}.md`;
        const buffer = Buffer.from(content, 'utf-8');
        return await this.uploadBuffer(buffer, remotePath, 'text/markdown');
    }
    async downloadFile(remotePath, localPath) {
        if (!this.isAvailable) {
            return false;
        }
        try {
            await this.client.fGetObject(this.bucketName, remotePath, localPath);
            console.log(`📥 [MinIO] Download realizado: ${remotePath} -> ${localPath}`);
            return true;
        }
        catch (error) {
            console.log(`❌ [MinIO] Erro no download: ${error}`);
            return false;
        }
    }
    async listFiles(prefix) {
        if (!this.isAvailable) {
            return [];
        }
        try {
            const files = [];
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
        }
        catch (error) {
            console.log(`❌ [MinIO] Erro ao listar arquivos: ${error}`);
            return [];
        }
    }
    async deleteFile(remotePath) {
        if (!this.isAvailable) {
            return false;
        }
        try {
            await this.client.removeObject(this.bucketName, remotePath);
            console.log(`🗑️ [MinIO] Arquivo removido: ${remotePath}`);
            return true;
        }
        catch (error) {
            console.log(`❌ [MinIO] Erro ao remover arquivo: ${error}`);
            return false;
        }
    }
    async getFileUrl(remotePath, expiry = 7 * 24 * 60 * 60) {
        if (!this.isAvailable) {
            return null;
        }
        try {
            const url = await this.client.presignedGetObject(this.bucketName, remotePath, expiry);
            return url;
        }
        catch (error) {
            console.log(`❌ [MinIO] Erro ao gerar URL: ${error}`);
            return null;
        }
    }
    getContentType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const contentTypes = {
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
    getContentTypeForFormat(format) {
        const types = {
            'md': 'text/markdown',
            'html': 'text/html',
            'pdf': 'application/pdf'
        };
        return types[format];
    }
    isServiceAvailable() {
        return this.isAvailable;
    }
    getBucketName() {
        return this.bucketName;
    }
}
exports.MinIOService = MinIOService;
