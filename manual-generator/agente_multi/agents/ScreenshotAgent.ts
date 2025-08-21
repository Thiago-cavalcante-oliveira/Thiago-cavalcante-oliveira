import { BaseAgent, AgentConfig, TaskData, TaskResult } from '../core/AgnoSCore.js';
import { MinIOService } from '../services/MinIOService.js';
import { Browser, Page, chromium } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

interface ScreenshotCache {
  hash: string;
  path: string;
  url: string;
  timestamp: number;
  metadata: {
    viewport: { width: number; height: number };
    element?: string;
    selector?: string;
  };
}

interface ScreenshotTask {
  url: string;
  outputPath: string;
  selector?: string;
  type: 'fullpage' | 'element' | 'viewport';
  reuseSession?: boolean;
}

export class ScreenshotAgent extends BaseAgent {
  private cache = new Map<string, ScreenshotCache>();
  private minioService: MinIOService;
  private browser: Browser | null = null;
  private currentPage: Page | null = null;
  private cacheFilePath: string;

  constructor() {
    const config: AgentConfig = {
      name: 'ScreenshotAgent',
      version: '1.0.0',
      description: 'Agente especializado em captura e gerenciamento de screenshots com cache otimizado',
      capabilities: [
        { name: 'screenshot_capture', description: 'Captura de screenshots com cache inteligente', version: '1.0.0' },
        { name: 'element_screenshot', description: 'Captura de screenshots de elementos específicos', version: '1.0.0' },
        { name: 'batch_processing', description: 'Processamento em lote de screenshots', version: '1.0.0' },
        { name: 'cache_management', description: 'Gerenciamento avançado de cache com detecção de duplicatas', version: '1.0.0' },
        { name: 'minio_integration', description: 'Integração com MinIO para armazenamento em nuvem', version: '1.0.0' }
      ]
    };

    super(config);
    this.minioService = new MinIOService();
    this.cacheFilePath = path.join(process.cwd(), 'output', 'screenshot-cache.json');
    this.setupTaskHandlers();
  }

  private setupTaskHandlers(): void {
    // Este método não é mais necessário pois vamos usar processTask
  }

  async processTask(task: TaskData): Promise<TaskResult> {
    switch (task.type) {
      case 'take_screenshot':
        return await this.handleTakeScreenshot(task);
      case 'take_element_screenshot':
        return await this.handleElementScreenshot(task);
      case 'batch_screenshots':
        return await this.handleBatchScreenshots(task);
      case 'clear_cache':
        return await this.handleClearCache(task);
      case 'optimize_cache':
        return await this.handleOptimizeCache(task);
      default:
        throw new Error(`Tipo de tarefa não suportada: ${task.type}`);
    }
  }

  async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    const { data } = taskResult;
    
    if (taskResult.taskId.includes('take_screenshot')) {
      return `## Screenshot Capturada
- **URL:** ${data.url || 'N/A'}
- **Arquivo:** ${data.path || 'N/A'}
- **Cache:** ${data.fromCache ? '✅ Reutilizado' : '❌ Nova captura'}
- **Hash:** ${data.hash ? data.hash.substring(0, 8) : 'N/A'}
${data.duplicate ? '- **Status:** Duplicata detectada e otimizada' : ''}`;
    }

    if (taskResult.taskId.includes('batch_screenshots')) {
      const stats = data.statistics || {};
      return `## Processamento em Lote
- **Total:** ${stats.total || 0} screenshots
- **Cache Hits:** ${stats.cacheHits || 0}
- **Novas:** ${stats.newScreenshots || 0}
- **Duplicatas:** ${stats.duplicates || 0}
- **Taxa de Sucesso:** ${((stats.successRate || 0) * 100).toFixed(1)}%`;
    }

    return `## Tarefa de Screenshot
- **Tipo:** ${taskResult.taskId}
- **Status:** ${taskResult.success ? '✅ Sucesso' : '❌ Erro'}
- **Tempo:** ${taskResult.processingTime}ms`;
  }

  async initialize(): Promise<void> {
    try {
      this.log('🖼️ Inicializando Screenshot Agent...');
      
      // Inicializar MinIO
      await this.minioService.initialize();
      
      // Carregar cache existente
      await this.loadCache();
      
      // Inicializar browser
      await this.initializeBrowser();
      
      this.log('✅ Screenshot Agent inicializado');
    } catch (error) {
      this.log(`❌ Erro na inicialização: ${error}`, 'error');
      throw error;
    }
  }

  private async initializeBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
      headless: false, // Permite visualizar o browser
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      this.log('🌐 Browser inicializado');
    }
  }

  private async loadCache(): Promise<void> {
    try {
      if (await fs.access(this.cacheFilePath).then(() => true).catch(() => false)) {
        const cacheData = await fs.readFile(this.cacheFilePath, 'utf-8');
        const cacheArray = JSON.parse(cacheData);
        this.cache = new Map(cacheArray);
        this.log(`📋 Cache carregado: ${this.cache.size} entradas`);
      }
    } catch (error) {
      this.log(`⚠️ Erro ao carregar cache: ${error}`, 'warn');
    }
  }

  private async saveCache(): Promise<void> {
    try {
      const cacheArray = Array.from(this.cache.entries());
      await fs.mkdir(path.dirname(this.cacheFilePath), { recursive: true });
      await fs.writeFile(this.cacheFilePath, JSON.stringify(cacheArray, null, 2));
      this.log(`💾 Cache salvo: ${this.cache.size} entradas`);
    } catch (error) {
      this.log(`❌ Erro ao salvar cache: ${error}`, 'error');
    }
  }

  private generateCacheKey(url: string, selector?: string, viewport?: { width: number; height: number }): string {
    const data = `${url}:${selector || 'fullpage'}:${viewport ? `${viewport.width}x${viewport.height}` : 'default'}`;
    return crypto.createHash('md5').update(data).digest('hex');
  }

  private async calculateImageHash(imagePath: string): Promise<string> {
    try {
      const imageBuffer = await fs.readFile(imagePath);
      return crypto.createHash('sha256').update(imageBuffer).digest('hex');
    } catch (error) {
      this.log(`❌ Erro ao calcular hash da imagem: ${error}`, 'error');
      return '';
    }
  }

  private async handleTakeScreenshot(task: TaskData): Promise<TaskResult> {
    const startTime = Date.now();
    const { url, outputPath, selector, type = 'fullpage', reuseSession = true }: ScreenshotTask = task.data;

    try {
      this.log(`📸 Capturando screenshot: ${url}`);

      // Verificar cache primeiro
      const viewport = { width: 1920, height: 1080 };
      const cacheKey = this.generateCacheKey(url, selector, viewport);
      const cached = this.cache.get(cacheKey);

      if (cached && await this.isCacheValid(cached)) {
        this.log(`✅ Screenshot encontrada no cache: ${cached.path}`);
        return {
          id: task.id,
          taskId: task.id,
          success: true,
          data: {
            path: cached.path,
            url: cached.url,
            fromCache: true,
            hash: cached.hash
          },
          timestamp: new Date(),
          processingTime: Date.now() - startTime
        };
      }

      // Capturar nova screenshot
      const screenshotResult = await this.captureScreenshot(url, outputPath, selector, type, reuseSession);
      
      // Calcular hash da nova imagem
      const imageHash = await this.calculateImageHash(screenshotResult.path);
      
      // Verificar se já temos uma imagem igual
      const duplicateEntry = this.findDuplicateByHash(imageHash);
      if (duplicateEntry) {
        this.log(`🔄 Screenshot duplicada detectada, reutilizando: ${duplicateEntry.path}`);
        // Remover arquivo duplicado
        await fs.unlink(screenshotResult.path).catch(() => {});
        
        return {
          id: task.id,
          taskId: task.id,
          success: true,
          data: {
            path: duplicateEntry.path,
            url: duplicateEntry.url,
            fromCache: true,
            duplicate: true,
            hash: duplicateEntry.hash
          },
          timestamp: new Date(),
          processingTime: Date.now() - startTime
        };
      }

      // Salvar no cache
      const cacheEntry: ScreenshotCache = {
        hash: imageHash,
        path: screenshotResult.path,
        url: url,
        timestamp: Date.now(),
        metadata: {
          viewport,
          element: selector,
          selector: selector
        }
      };

      this.cache.set(cacheKey, cacheEntry);
      await this.saveCache();

      // Upload para MinIO se disponível
      if (screenshotResult.path) {
        try {
          const remotePath = `screenshots/${path.basename(screenshotResult.path)}`;
          await this.minioService.uploadFile(screenshotResult.path, remotePath);
          this.log(`☁️ Screenshot enviada para MinIO: ${remotePath}`);
        } catch (error) {
          this.log(`⚠️ Erro no upload para MinIO: ${error}`, 'warn');
        }
      }

      return {
        id: task.id,
        taskId: task.id,
        success: true,
        data: {
          path: screenshotResult.path,
          url: url,
          fromCache: false,
          hash: imageHash
        },
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      this.log(`❌ Erro ao capturar screenshot: ${error}`, 'error');
      throw error;
    }
  }

  private async handleElementScreenshot(task: TaskData): Promise<TaskResult> {
    const startTime = Date.now();
    const { url, outputPath, selectors } = task.data;

    try {
      this.log(`📸 Capturando screenshots de elementos: ${url}`);
      
      if (!this.browser) {
        await this.initializeBrowser();
      }

      const page = await this.browser!.newPage();
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(url, { waitUntil: 'networkidle' });

      const results = [];
      
      for (let i = 0; i < selectors.length; i++) {
        const selector = selectors[i];
        const elementPath = `${outputPath}_element_${i + 1}_${selector.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        
        try {
          const element = await page.$(selector);
          if (element) {
            const buffer = await element.screenshot();
            await fs.writeFile(elementPath, buffer);
            
            // Calcular hash e verificar cache
            const imageHash = await this.calculateImageHash(elementPath);
            const duplicate = this.findDuplicateByHash(imageHash);
            
            if (duplicate) {
              await fs.unlink(elementPath).catch(() => {});
              results.push({
                selector,
                path: duplicate.path,
                fromCache: true,
                hash: duplicate.hash
              });
            } else {
              // Adicionar ao cache
              const cacheKey = this.generateCacheKey(url, selector);
              this.cache.set(cacheKey, {
                hash: imageHash,
                path: elementPath,
                url: url,
                timestamp: Date.now(),
                metadata: {
                  viewport: { width: 1920, height: 1080 },
                  element: selector,
                  selector: selector
                }
              });
              
              results.push({
                selector,
                path: elementPath,
                fromCache: false,
                hash: imageHash
              });

              // Upload para MinIO
              try {
                const remotePath = `screenshots/elements/${path.basename(elementPath)}`;
                await this.minioService.uploadFile(elementPath, remotePath);
              } catch (error) {
                this.log(`⚠️ Erro no upload para MinIO: ${error}`, 'warn');
              }
            }
          } else {
            this.log(`⚠️ Elemento não encontrado: ${selector}`, 'warn');
          }
        } catch (error) {
          this.log(`❌ Erro ao capturar elemento ${selector}: ${error}`, 'error');
        }
      }

      await page.close();
      await this.saveCache();

      return {
        id: task.id,
        taskId: task.id,
        success: true,
        data: {
          results,
          totalElements: results.length,
          cached: results.filter(r => r.fromCache).length
        },
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      this.log(`❌ Erro ao capturar screenshots de elementos: ${error}`, 'error');
      throw error;
    }
  }

  private async captureScreenshot(
    url: string, 
    outputPath: string, 
    selector?: string, 
    type: string = 'fullpage',
    reuseSession: boolean = true
  ): Promise<{ path: string }> {
    
    if (!this.browser) {
      await this.initializeBrowser();
    }

    let page: Page;
    
    if (reuseSession && this.currentPage) {
      page = this.currentPage;
    } else {
      page = await this.browser!.newPage();
      await page.setViewportSize({ width: 1920, height: 1080 });
      if (reuseSession) {
        this.currentPage = page;
      }
    }

    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Aguardar um pouco para garantir que a página carregou completamente
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Criar diretório se não existir
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    if (selector) {
      // Screenshot de elemento específico
      const element = await page.$(selector);
      if (element) {
        const buffer = await element.screenshot();
        await fs.writeFile(outputPath, buffer);
      } else {
        throw new Error(`Elemento não encontrado: ${selector}`);
      }
    } else {
      // Screenshot da página completa
      const buffer = await page.screenshot({ 
        fullPage: type === 'fullpage'
      });
      await fs.writeFile(outputPath, buffer);
    }

    if (!reuseSession) {
      await page.close();
    }

    return { path: outputPath };
  }

  private async isCacheValid(cached: ScreenshotCache): Promise<boolean> {
    try {
      // Verificar se arquivo ainda existe
      await fs.access(cached.path);
      
      // Verificar idade do cache (ex: 1 hora)
      const maxAge = 60 * 60 * 1000; // 1 hora em ms
      return (Date.now() - cached.timestamp) < maxAge;
    } catch {
      return false;
    }
  }

  private findDuplicateByHash(hash: string): ScreenshotCache | null {
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.hash === hash) {
        return entry;
      }
    }
    return null;
  }

  private async handleBatchScreenshots(task: TaskData): Promise<TaskResult> {
    const startTime = Date.now();
    const { screenshots }: { screenshots: ScreenshotTask[] } = task.data;

    try {
      this.log(`📸 Processamento em lote: ${screenshots.length} screenshots`);
      
      const results = [];
      let cacheHits = 0;
      let newScreenshots = 0;
      let duplicates = 0;

      for (const screenshot of screenshots) {
        try {
          const result = await this.handleTakeScreenshot({
            id: `batch_${Date.now()}`,
            type: 'take_screenshot',
            data: screenshot,
            sender: 'ScreenshotAgent',
            priority: 'medium',
            timestamp: new Date()
          });
          
          results.push(result.data);
          
          if (result.data.fromCache) {
            cacheHits++;
          } else {
            newScreenshots++;
          }
          
          if (result.data.duplicate) {
            duplicates++;
          }
        } catch (error) {
          this.log(`❌ Erro em screenshot individual: ${error}`, 'error');
          results.push({
            url: screenshot.url,
            error: error instanceof Error ? error.message : String(error),
            success: false
          });
        }
      }

      this.log(`📊 Estatísticas do lote: ${cacheHits} cache hits, ${newScreenshots} novas, ${duplicates} duplicatas`);

      return {
        id: task.id,
        taskId: task.id,
        success: true,
        data: {
          results,
          statistics: {
            total: screenshots.length,
            cacheHits,
            newScreenshots,
            duplicates,
            successRate: results.filter(r => r.success !== false).length / screenshots.length
          }
        },
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      this.log(`❌ Erro no processamento em lote: ${error}`, 'error');
      throw error;
    }
  }

  private async handleClearCache(task: TaskData): Promise<TaskResult> {
    try {
      const oldSize = this.cache.size;
      this.cache.clear();
      await this.saveCache();
      
      this.log(`🗑️ Cache limpo: ${oldSize} entradas removidas`);

      return {
        id: task.id,
        taskId: task.id,
        success: true,
        data: {
          cleared: oldSize,
          message: `Cache limpo com sucesso: ${oldSize} entradas removidas`
        },
        timestamp: new Date(),
        processingTime: 0
      };
    } catch (error) {
      this.log(`❌ Erro ao limpar cache: ${error}`, 'error');
      throw error;
    }
  }

  private async handleOptimizeCache(task: TaskData): Promise<TaskResult> {
    const startTime = Date.now();
    
    try {
      this.log('🔧 Otimizando cache...');
      
      const initialSize = this.cache.size;
      let removed = 0;
      let invalid = 0;

      // Remover entradas inválidas (arquivos que não existem mais)
      for (const [key, entry] of Array.from(this.cache.entries())) {
        if (!await this.isCacheValid(entry)) {
          this.cache.delete(key);
          removed++;
        }
        
        try {
          await fs.access(entry.path);
        } catch {
          this.cache.delete(key);
          invalid++;
        }
      }

      await this.saveCache();
      
      this.log(`✅ Cache otimizado: ${removed} expiradas, ${invalid} inválidas, ${this.cache.size} restantes`);

      return {
        id: task.id,
        taskId: task.id,
        success: true,
        data: {
          initialSize,
          finalSize: this.cache.size,
          removed,
          invalid,
          optimization: `${((removed + invalid) / initialSize * 100).toFixed(1)}% redução`
        },
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      this.log(`❌ Erro na otimização do cache: ${error}`, 'error');
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      await this.saveCache();
      
      if (this.currentPage && !this.currentPage.isClosed()) {
        await this.currentPage.close();
      }
      
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      
      this.log('🧹 Screenshot Agent finalizado');
    } catch (error) {
      this.log(`❌ Erro na finalização: ${error}`, 'error');
    }
  }

  // Métodos públicos para uso por outros agentes
  async takeScreenshot(url: string, outputPath: string, selector?: string): Promise<{ path: string; fromCache: boolean; hash: string }> {
    const result = await this.handleTakeScreenshot({
      id: `direct_${Date.now()}`,
      type: 'take_screenshot',
      data: { url, outputPath, selector },
      sender: 'ScreenshotAgent',
      priority: 'medium',
      timestamp: new Date()
    });

    return result.data;
  }

  getCacheStatistics(): { size: number; oldestEntry: number; newestEntry: number } {
    if (this.cache.size === 0) {
      return { size: 0, oldestEntry: 0, newestEntry: 0 };
    }

    const timestamps = Array.from(this.cache.values()).map(entry => entry.timestamp);
    return {
      size: this.cache.size,
      oldestEntry: Math.min(...timestamps),
      newestEntry: Math.max(...timestamps)
    };
  }
}
