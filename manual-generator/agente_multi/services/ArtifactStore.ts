import * as fs from 'fs/promises';
import * as path from 'path';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

interface Artifact {
  id: string;
  type: 'screenshot' | 'document' | 'data' | 'report';
  name: string;
  path: string;
  size: number;
  hash: string;
  createdAt: Date;
}

export class ArtifactStore {
  private storageDir: string;
  private indexFile: string;
  private artifacts: Map<string, Artifact> = new Map();
  private log = logger.child({ service: 'ArtifactStore' });

  constructor(storageDir: string = 'output/artifacts') {
    this.storageDir = path.resolve(storageDir);
    this.indexFile = path.join(this.storageDir, 'index.json');
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.storageDir, { recursive: true });
    await this.loadIndex();
  }

  async store(data: {
    type: Artifact['type'];
    name: string;
    content: Buffer | string;
  }): Promise<string> {
    const id = uuidv4();
    const subDir = path.join(this.storageDir, data.type);
    await fs.mkdir(subDir, { recursive: true });

    const sanitizedName = data.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${id}-${sanitizedName}`;
    const filePath = path.join(subDir, fileName);

    const contentBuffer = Buffer.isBuffer(data.content) ? data.content : Buffer.from(data.content, 'utf-8');
    await fs.writeFile(filePath, contentBuffer);

    const hash = crypto.createHash('sha256').update(contentBuffer).digest('hex');

    const artifact: Artifact = {
      id,
      type: data.type,
      name: data.name,
      path: filePath,
      size: contentBuffer.length,
      hash,
      createdAt: new Date(),
    };

    this.artifacts.set(id, artifact);
    await this.saveIndex();
    this.log.info({ name: data.name, size: contentBuffer.length }, `📦 Artefato armazenado`);
    
    return filePath;
  }

  private async loadIndex(): Promise<void> {
    try {
      const data = await fs.readFile(this.indexFile, 'utf-8');
      const parsed = JSON.parse(data);
      this.artifacts = new Map(Object.entries(parsed));
      this.log.info(`📚 Índice carregado: ${this.artifacts.size} artefatos`);
    } catch (error) {
      this.log.info('📝 Criando novo índice de artefatos.');
    }
  }

  private async saveIndex(): Promise<void> {
    try {
      const data = Object.fromEntries(this.artifacts.entries());
      await fs.writeFile(this.indexFile, JSON.stringify(data, null, 2));
    } catch (error) {
      this.log.error({ error }, '❌ Erro ao salvar índice de artefatos.');
    }
  }
}

