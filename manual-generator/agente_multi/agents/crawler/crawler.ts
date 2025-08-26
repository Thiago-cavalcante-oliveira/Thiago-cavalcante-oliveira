import { BaseAgent, AgentConfig, TaskData, TaskResult } from '../../core/AgnoSCore.js';
import { Page, Browser } from 'playwright';
import { MinIOService } from '../../services/MinIOService.js';
import { LLMManager } from '../../services/LLMManager.js';
import { MenuModalAgent, MenuDetectionResult } from '../MenuModalAgent.js';
import { Timeline } from '../../services/Timeline.js';
import { DetectionConfig, DEFAULT_DETECTION_CONFIG, getSystemConfig, mergeDetectionConfig } from '../../config/detection-strategies.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  CrawlResult, 
  ElementContext, 
  ElementGroup, 
  HomePageMap, 
  InteractionType, 
  InteractiveElement, 
  NavigationElement, 
  StaticElement, 
  UserClickRequest, 
  RelatedElement,
  PageData,
  InteractionResult,
  ProxyConfig,
  ProxyAuthResult
} from './types';
import { logToFile, retryWithFallback } from './helpers';

export class CrawlerAgent extends BaseAgent {
  private page: Page | null = null;
  private browser: Browser | null = null;
  private minioService: MinIOService;
  private llmManager: LLMManager | null = null;
  private menuModalAgent: MenuModalAgent | null = null;
  private timeline: Timeline | null = null;
  private screenshots: string[] = [];
  private proxyConfig: ProxyConfig | null = null;
  private visitedPages: Set<string> = new Set();
  private allPageData: PageData[] = [];
  private discoveredPages: Array<{
    url: string;
    title: string;
    accessMethod: string;
    functionality: string;
  }> = [];
  private logDir: string;
  private logFile: string;
  private retryAttempts: number = 3;
  private retryDelay: number = 2000;
  private detectionConfig: DetectionConfig = DEFAULT_DETECTION_CONFIG;
  private systemType: string = 'default';
  private homePageMap: HomePageMap | null = null;
  private userClickRequest: UserClickRequest | null = null;

  constructor(config: AgentConfig) {
    super(config);
    this.minioService = new MinIOService();
    this.logDir = path.join(__dirname, '..", "..", "..", "output", "agent_logs');
    this.logFile = path.join(this.logDir, 'crawler_agent.log');
  }

  protected override async log(message: string, stage: string = 'crawler'): Promise<void> {
    await logToFile(this.logDir, this.logFile, message, stage);
  }

  private async retry<T>(operation: () => Promise<T>, operationName: string): Promise<T | null> {
    return await retryWithFallback(this.logDir, this.logFile, this.retryAttempts, this.retryDelay, operation, operationName);
  }

  private createFailedInteractionResult(element: any, screenshotBefore: string): InteractionResult {
    return {
      element: {
        type: element.type,
        text: element.text,
        selector: element.selector,
        location: 'main-content'
      },
      functionality: {
        action: `attempted click on ${element.type}`,
        expectedResult: 'failed to interact',
        triggersWhat: 'error',
        destinationUrl: element.href,
        opensModal: false,
        changesPageContent: false
      },
      interactionResults: {
        wasClicked: false,
        visualChanges: [],
        newElementsAppeared: [],
        navigationOccurred: false,
        screenshotBefore: screenshotBefore,
        screenshotAfter: ''
      }
    };
  }

  setPage(page: Page | null): void {
    this.page = page;
    this.log('CrawlerAgent: página definida');
    
    if (this.menuModalAgent && page) {
      this.menuModalAgent.setPage(page);
    }
  }

  setTimeline(timeline: Timeline): void {
    this.timeline = timeline;
  }

  setMenuModalAgent(agent: MenuModalAgent): void {
    this.menuModalAgent = agent;
    if (this.page) {
      agent.setPage(this.page);
    }
    if (this.browser) {
      agent.setBrowser(this.browser);
    }
  }

  setSystemType(systemType: string): void {
    this.systemType = systemType;
    this.detectionConfig = getSystemConfig(systemType);
  }

  async initialize(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async processTask(task: TaskData): Promise<TaskResult> {
    throw new Error("Method not implemented.");
  }

  async cleanup(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    throw new Error("Method not implemented.");
  }

  async execute(task: TaskData): Promise<TaskResult> {
    throw new Error("Method not implemented.");
  }
}