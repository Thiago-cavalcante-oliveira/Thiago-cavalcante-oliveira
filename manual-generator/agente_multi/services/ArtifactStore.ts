import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

interface Artifact {
  id: string;
  type: 'screenshot' | 'document' | 'data' | 'report' | 'cache';
  name: string;
  path: string;
  size: number;
  hash: string;
  metadata: Record<string, any>;
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
  tags: string[];
  dependencies: string[]; // IDs de outros artefatos
  expiresAt?: Date;
}

interface StorageStats {
  totalArtifacts: number;
  totalSize: number;
  typeBreakdown: Record<string, { count: number; size: number }>;
  oldestArtifact: Date;
  newestArtifact: Date;
  mostAccessed: Artifact[];
  leastAccessed: Artifact[];
}

interface CleanupPolicy {
  maxAge: number; // dias
  maxSize: number; // bytes
  maxCount: number;
  preserveTypes: string[];
  preserveTags: string[];
}

export class ArtifactStore {
  private indexFile: string;
  private storageDir: string;
  private artifacts: Map<string, Artifact> = new Map();
  private cleanupPolicy: CleanupPolicy;

  constructor(storageDir: string = 'output/artifacts') {
    this.storageDir = path.resolve(storageDir);
    this.indexFile = path.join(this.storageDir, 'index.json');
    
    this.cleanupPolicy = {
      maxAge: 30, // 30 dias
      maxSize: 500 * 1024 * 1024, // 500MB
      maxCount: 1000,
      preserveTypes: ['document', 'report'],
      preserveTags: ['important', 'final']
    };

    this.loadIndex();
  }

  /**
   * Armazena um novo artefato
   */
  async store(data: {
    type: Artifact['type'];
    name: string;
    content: Buffer | string;
    metadata?: Record<string, any>;
    tags?: string[];
    dependencies?: string[];
    expiresAt?: Date;
  }): Promise<string> {
    const id = this.generateId();
    const fileName = `${id}_${this.sanitizeFileName(data.name)}`;
    const filePath = path.join(this.storageDir, data.type, fileName);
    
    // Criar diretório se não existir
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    // Escrever arquivo
    const content = Buffer.isBuffer(data.content) ? data.content : Buffer.from(data.content, 'utf-8');
    await fs.writeFile(filePath, content);
    
    // Calcular hash
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    
    // Criar artefato
    const artifact: Artifact = {
      id,
      type: data.type,
      name: data.name,
      path: filePath,
      size: content.length,
      hash,
      metadata: data.metadata || {},
      createdAt: new Date(),
      lastAccessed: new Date(),
      accessCount: 0,
      tags: data.tags || [],
      dependencies: data.dependencies || [],
      expiresAt: data.expiresAt
    };
    
    this.artifacts.set(id, artifact);
    await this.saveIndex();
    
    console.log(`📦 Artefato armazenado: ${data.name} (${this.formatSize(content.length)})`);
    
    // Verificar se precisa de limpeza
    await this.checkCleanupNeeded();
    
    return id;
  }

  /**
   * Recupera um artefato
   */
  async retrieve(id: string): Promise<{ artifact: Artifact; content: Buffer } | null> {
    const artifact = this.artifacts.get(id);
    if (!artifact) {
      return null;
    }
    
    try {
      const content = await fs.readFile(artifact.path);
      
      // Atualizar estatísticas de acesso
      artifact.lastAccessed = new Date();
      artifact.accessCount++;
      await this.saveIndex();
      
      return { artifact, content };
    } catch (error) {
      console.error(`❌ Erro ao recuperar artefato ${id}:`, error);
      return null;
    }
  }

  /**
   * Busca artefatos por critérios
   */
  search(criteria: {
    type?: Artifact['type'];
    tags?: string[];
    name?: string;
    createdAfter?: Date;
    createdBefore?: Date;
    minSize?: number;
    maxSize?: number;
  }): Artifact[] {
    return Array.from(this.artifacts.values()).filter(artifact => {
      if (criteria.type && artifact.type !== criteria.type) return false;
      if (criteria.tags && !criteria.tags.some(tag => artifact.tags.includes(tag))) return false;
      if (criteria.name && !artifact.name.toLowerCase().includes(criteria.name.toLowerCase())) return false;
      if (criteria.createdAfter && artifact.createdAt < criteria.createdAfter) return false;
      if (criteria.createdBefore && artifact.createdAt > criteria.createdBefore) return false;
      if (criteria.minSize && artifact.size < criteria.minSize) return false;
      if (criteria.maxSize && artifact.size > criteria.maxSize) return false;
      
      return true;
    });
  }

  /**
   * Remove um artefato
   */
  async remove(id: string): Promise<boolean> {
    const artifact = this.artifacts.get(id);
    if (!artifact) {
      return false;
    }
    
    try {
      await fs.unlink(artifact.path);
      this.artifacts.delete(id);
      await this.saveIndex();
      
      console.log(`🗑️ Artefato removido: ${artifact.name}`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao remover artefato ${id}:`, error);
      return false;
    }
  }

  /**
   * Atualiza metadados de um artefato
   */
  async updateMetadata(id: string, metadata: Record<string, any>): Promise<boolean> {
    const artifact = this.artifacts.get(id);
    if (!artifact) {
      return false;
    }
    
    artifact.metadata = { ...artifact.metadata, ...metadata };
    await this.saveIndex();
    
    return true;
  }

  /**
   * Adiciona tags a um artefato
   */
  async addTags(id: string, tags: string[]): Promise<boolean> {
    const artifact = this.artifacts.get(id);
    if (!artifact) {
      return false;
    }
    
    artifact.tags = [...new Set([...artifact.tags, ...tags])];
    await this.saveIndex();
    
    return true;
  }

  /**
   * Obtém estatísticas do armazenamento
   */
  getStats(): StorageStats {
    const artifacts = Array.from(this.artifacts.values());
    
    if (artifacts.length === 0) {
      return {
        totalArtifacts: 0,
        totalSize: 0,
        typeBreakdown: {},
        oldestArtifact: new Date(),
        newestArtifact: new Date(),
        mostAccessed: [],
        leastAccessed: []
      };
    }
    
    const typeBreakdown: Record<string, { count: number; size: number }> = {};
    let totalSize = 0;
    
    artifacts.forEach(artifact => {
      totalSize += artifact.size;
      
      if (!typeBreakdown[artifact.type]) {
        typeBreakdown[artifact.type] = { count: 0, size: 0 };
      }
      
      typeBreakdown[artifact.type].count++;
      typeBreakdown[artifact.type].size += artifact.size;
    });
    
    const sortedByDate = artifacts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const sortedByAccess = artifacts.sort((a, b) => b.accessCount - a.accessCount);
    
    return {
      totalArtifacts: artifacts.length,
      totalSize,
      typeBreakdown,
      oldestArtifact: sortedByDate[0].createdAt,
      newestArtifact: sortedByDate[sortedByDate.length - 1].createdAt,
      mostAccessed: sortedByAccess.slice(0, 5),
      leastAccessed: sortedByAccess.slice(-5).reverse()
    };
  }

  /**
   * Executa limpeza baseada na política
   */
  async cleanup(): Promise<{ removed: number; freedSpace: number }> {
    const artifacts = Array.from(this.artifacts.values());
    const now = new Date();
    let removed = 0;
    let freedSpace = 0;
    
    // Remover artefatos expirados
    for (const artifact of artifacts) {
      if (artifact.expiresAt && now > artifact.expiresAt) {
        if (await this.remove(artifact.id)) {
          removed++;
          freedSpace += artifact.size;
        }
      }
    }
    
    // Remover artefatos antigos (exceto preservados)
    const maxAgeMs = this.cleanupPolicy.maxAge * 24 * 60 * 60 * 1000;
    for (const artifact of artifacts) {
      if (this.shouldPreserve(artifact)) continue;
      
      const age = now.getTime() - artifact.createdAt.getTime();
      if (age > maxAgeMs) {
        if (await this.remove(artifact.id)) {
          removed++;
          freedSpace += artifact.size;
        }
      }
    }
    
    // Verificar limites de tamanho e quantidade
    const stats = this.getStats();
    if (stats.totalSize > this.cleanupPolicy.maxSize || stats.totalArtifacts > this.cleanupPolicy.maxCount) {
      const candidates = artifacts
        .filter(a => !this.shouldPreserve(a))
        .sort((a, b) => a.lastAccessed.getTime() - b.lastAccessed.getTime());
      
      for (const artifact of candidates) {
        if (stats.totalSize <= this.cleanupPolicy.maxSize && stats.totalArtifacts <= this.cleanupPolicy.maxCount) {
          break;
        }
        
        if (await this.remove(artifact.id)) {
          removed++;
          freedSpace += artifact.size;
        }
      }
    }
    
    console.log(`🧹 Limpeza concluída: ${removed} artefatos removidos, ${this.formatSize(freedSpace)} liberados`);
    
    return { removed, freedSpace };
  }

  /**
   * Gera relatório de armazenamento
   */
  generateReport(): string {
    const stats = this.getStats();
    
    return `
# Relatório do Armazenamento de Artefatos

## Estatísticas Gerais
- **Total de artefatos**: ${stats.totalArtifacts}
- **Espaço total usado**: ${this.formatSize(stats.totalSize)}
- **Artefato mais antigo**: ${stats.oldestArtifact.toLocaleDateString()}
- **Artefato mais recente**: ${stats.newestArtifact.toLocaleDateString()}

## Breakdown por Tipo
${Object.entries(stats.typeBreakdown).map(([type, data]) => 
  `- **${type}**: ${data.count} artefatos (${this.formatSize(data.size)})`
).join('\n')}

## Mais Acessados
${stats.mostAccessed.map((a, i) => 
  `${i + 1}. ${a.name} (${a.accessCount} acessos)`
).join('\n')}

## Menos Acessados
${stats.leastAccessed.map((a, i) => 
  `${i + 1}. ${a.name} (${a.accessCount} acessos)`
).join('\n')}

---
*Relatório gerado em ${new Date().toLocaleString()}*
`;
  }

  // Métodos privados
  private async loadIndex(): Promise<void> {
    try {
      const data = await fs.readFile(this.indexFile, 'utf-8');
      const parsed = JSON.parse(data);
      
      this.artifacts.clear();
      Object.entries(parsed).forEach(([id, artifact]: [string, any]) => {
        this.artifacts.set(id, {
          ...artifact,
          createdAt: new Date(artifact.createdAt),
          lastAccessed: new Date(artifact.lastAccessed),
          expiresAt: artifact.expiresAt ? new Date(artifact.expiresAt) : undefined
        });
      });
      
      console.log(`📚 Índice carregado: ${this.artifacts.size} artefatos`);
    } catch (error) {
      console.log('📝 Criando novo índice de artefatos');
    }
  }

  private async saveIndex(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.indexFile), { recursive: true });
      
      const data: Record<string, any> = {};
      this.artifacts.forEach((artifact, id) => {
        data[id] = artifact;
      });
      
      await fs.writeFile(this.indexFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Erro ao salvar índice:', error);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeFileName(name: string): string {
    return name.replace(/[^a-zA-Z0-9.-]/g, '_');
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  private shouldPreserve(artifact: Artifact): boolean {
    // Preservar por tipo
    if (this.cleanupPolicy.preserveTypes.includes(artifact.type)) {
      return true;
    }
    
    // Preservar por tags
    if (artifact.tags.some(tag => this.cleanupPolicy.preserveTags.includes(tag))) {
      return true;
    }
    
    return false;
  }

  private async checkCleanupNeeded(): Promise<void> {
    const stats = this.getStats();
    
    // Limpeza automática se exceder limites
    if (stats.totalSize > this.cleanupPolicy.maxSize * 0.9 || 
        stats.totalArtifacts > this.cleanupPolicy.maxCount * 0.9) {
      console.log('🧹 Iniciando limpeza automática...');
      await this.cleanup();
    }
  }
}