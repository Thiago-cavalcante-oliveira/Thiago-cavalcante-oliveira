import { BaseAgent, AgentConfig, TaskData, TaskResult } from '../core/AgnoSCore.js';
import { v4 as uuidv4 } from 'uuid';
import { Browser, Page, chromium } from 'playwright';
import { VisionAgent, VisionElement } from './VisionAgent.js';
import * as fs from 'fs/promises';

export class CrawlerAgent extends BaseAgent {
  private visionAgent: VisionAgent;
  private browser: Browser | null = null;
  private page: Page | null = null;

  constructor(visionAgent: VisionAgent) {
    const config: AgentConfig = {
      name: 'CrawlerAgent',
      version: '2.0.0',
      description: 'Navega em aplicações web usando análise visual para mapear funcionalidades.',
      capabilities: ['web_crawling', 'data_extraction', 'visual_analysis'],
    };
    super(config);
    this.visionAgent = visionAgent;
  }

  async initialize(): Promise<void> {
    this.log('Initializing CrawlerAgent...');
    await this.visionAgent.initialize();
    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage();
    this.log('CrawlerAgent initialized.');
  }

  async cleanup(): Promise<void> {
    this.log('Cleaning up CrawlerAgent...');
    await this.visionAgent.cleanup();
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
    this.log('CrawlerAgent cleaned up.');
  }

  async processTask(task: TaskData): Promise<TaskResult> {
    const { targetUrl, page } = task.data as { targetUrl: string, page: Page };
    const urlsToVisit = new Set<string>([targetUrl]);
    const visitedUrls = new Set<string>();
    const discoveredData: any[] = [];

    while (urlsToVisit.size > 0) {
      const currentUrl = urlsToVisit.values().next().value;
      urlsToVisit.delete(currentUrl);

      if (visitedUrls.has(currentUrl)) continue;

      try {
        this.log(`Navegando para: ${currentUrl}`);
        await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        visitedUrls.add(currentUrl);

        this.log(`Analisando visualmente a página...`);
        const screenshotBuffer = await page.screenshot({ fullPage: true });
        
        const visionResult = await this.visionAgent.executeTask({
            id: uuidv4(), type: 'analyze_screenshot', sender: this.config.name,
            timestamp: new Date(), priority: 'high', data: { screenshotBuffer }
        });
        
        if (visionResult.success && visionResult.data.interactiveElements) {
            discoveredData.push({ url: currentUrl, elements: visionResult.data.interactiveElements });
            const elements: VisionElement[] = visionResult.data.interactiveElements;
            
            // Lógica para descobrir novas URLs (simplificada) 
            // Uma implementação mais avançada clicaria nos elementos 
            this.log(`Encontrou ${elements.length} elementos interativos.`);
        }
      } catch (error) {
        this.log(`Erro ao processar URL ${currentUrl}: ${error}`, 'error');
      }
    }

    return {
      id: uuidv4(),
      taskId: task.id,
      success: true,
      data: { visitedPages: Array.from(visitedUrls), discoveredData },
      timestamp: new Date(),
      processingTime: 0, // O tempo será calculado no AgnoSCore 
    };
  }

  async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    const { visitedPages, discoveredData } = taskResult.data;
    let report = `## Relatório do CrawlerAgent (Visual)\n\nO agente visitou **${visitedPages.length}** páginas únicas.\n\n`;
    for (const pageData of discoveredData) {
        report += `### Análise de: ${pageData.url}\n`;
        if (pageData.elements.length > 0) {
            report += pageData.elements.map((el: VisionElement) => `- **${el.purpose}**`).join('\n') + '\n\n';
        } else {
            report += `- Nenhum elemento interativo proeminente foi identificado.\n\n`;
        }
    }
    return report;
  }
}
