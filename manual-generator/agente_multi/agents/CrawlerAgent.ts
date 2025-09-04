import { BaseAgent, AgentConfig, AgentCapability, TaskData, TaskResult } from '../core/AgnoSCore.js';
import { v4 as uuidv4 } from 'uuid';
import { Page } from 'playwright';
import { VisionAgent, VisionElement } from './VisionAgent.js';

export class CrawlerAgent extends BaseAgent {
  private visionAgent: VisionAgent;

  constructor(visionAgent: VisionAgent) {
    const config: AgentConfig = {
      name: 'CrawlerAgent',
      version: '2.0.0',
      description: 'Navega em aplicações web usando análise visual para mapear funcionalidades.',
      capabilities: [
        { name: 'web_crawling', description: 'Navega e explora páginas web.', version: '2.0.0' },
        { name: 'visual_analysis', description: 'Utiliza o VisionAgent para analisar o conteúdo visual.', version: '1.0.0' }
      ],
    };
    super(config);
    this.visionAgent = visionAgent;
  }
  
  async initialize(): Promise<void> { this.log('CrawlerAgent inicializado.'); }
  async cleanup(): Promise<void> { this.log('CrawlerAgent finalizado.'); }

  async processTask(task: TaskData): Promise<TaskResult> {
    const startTime = Date.now();
    const { targetUrl, page } = task.data as { targetUrl: string, page: Page };

    const urlsToVisit = new Set<string>([targetUrl]);
    const visitedUrls = new Set<string>();
    const discoveredData: any[] = [];

    while (urlsToVisit.size > 0) {
      const currentUrl = Array.from(urlsToVisit)[0];
      urlsToVisit.delete(currentUrl);

      if (visitedUrls.has(currentUrl)) continue;

      try {
        this.log(`Navegando para: ${currentUrl}`);
        await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        visitedUrls.add(currentUrl);

        const screenshotBuffer = await page.screenshot({ fullPage: true });
        
        const visionResult = await this.visionAgent.executeTask({
            id: uuidv4(), type: 'analyze_screenshot', sender: this.config.name,
            timestamp: new Date(), priority: 'high', data: { screenshotBuffer }
        });
        
        if (visionResult.success && visionResult.data?.interactiveElements) {
            const elements: VisionElement[] = visionResult.data.interactiveElements;
            discoveredData.push({ url: currentUrl, elements });
            this.log(`Encontrou ${elements.length} elementos interativos.`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.log(`Erro ao processar URL ${currentUrl}: ${errorMessage}`, 'error');
      }
    }

    return {
      id: uuidv4(),
      taskId: task.id,
      success: true,
      data: { visitedPages: Array.from(visitedUrls), discoveredData },
      timestamp: new Date(),
      processingTime: Date.now() - startTime,
    };
  }

  async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    const visitedPages = taskResult.data?.visitedPages || [];
    return `## Relatório do CrawlerAgent (Visual)\n\nVisitou **${visitedPages.length}** páginas.\n`;
  }
}