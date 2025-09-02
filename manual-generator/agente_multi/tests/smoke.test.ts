import { chromium } from 'playwright';
import { AgnoSCore } from '../core/AgnoSCore.js';
import { OrchestratorAgent } from '../agents/OrchestratorAgent.js';
import { LoginAgent } from '../agents/LoginAgent.js';
import { CrawlerAgent } from '../agents/CrawlerAgent.js';
import { AnalysisAgent } from '../agents/AnalysisAgent.js';
import { ContentAgent } from '../agents/ContentAgent.js';
import { GeneratorAgent } from '../agents/GeneratorAgent.js';
import { ScreenshotAgent } from '../agents/ScreenshotAgent.js';
import { LLMRouter } from '../services/LLMRouter.js';
import { PromptInspector } from '../services/PromptInspector.js';
import { ArtifactStore } from '../services/ArtifactStore.js';
import { Timeline } from '../services/Timeline.js';
import { safeValidateEnvironment } from '../config/environment.js';

describe('Manual Generator Smoke Tests', () => {
  let browser: any;
  let agnosCore: AgnoSCore;

  beforeAll(async () => {
    safeValidateEnvironment();
    browser = await chromium.launch();
    agnosCore = new AgnoSCore(browser);
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should successfully run orchestrator for a public website without credentials', async () => {
    const orchestratorAgent = new OrchestratorAgent(agnosCore, {
      loginAgent: new LoginAgent(agnosCore),
      crawlerAgent: new CrawlerAgent(agnosCore),
      analysisAgent: new AnalysisAgent(agnosCore),
      contentAgent: new ContentAgent(agnosCore),
      generatorAgent: new GeneratorAgent(agnosCore),
      screenshotAgent: new ScreenshotAgent(agnosCore),
      llmRouter: new LLMRouter(),
      promptInspector: new PromptInspector(),
      artifactStore: new ArtifactStore(),
      timeline: new Timeline(),
    });

    const testUrl = 'https://www.google.com';
    const result = await orchestratorAgent.execute({
      url: testUrl,
      maxDepth: 1,
      headless: true,
      outputDir: './output/test_no_credentials',
      auth: {},
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.message).toContain('Orchestration completed successfully');
  }, 60000);

  test('should successfully run orchestrator for a website requiring credentials', async () => {
    const orchestratorAgent = new OrchestratorAgent(agnosCore, {
      loginAgent: new LoginAgent(agnosCore),
      crawlerAgent: new CrawlerAgent(agnosCore),
      analysisAgent: new AnalysisAgent(agnosCore),
      contentAgent: new ContentAgent(agnosCore),
      generatorAgent: new GeneratorAgent(agnosCore),
      screenshotAgent: new ScreenshotAgent(agnosCore),
      llmRouter: new LLMRouter(),
      promptInspector: new PromptInspector(),
      artifactStore: new ArtifactStore(),
      timeline: new Timeline(),
    });

    // Replace with a URL that requires login and provide valid credentials
    const testUrl = 'https://www.example.com/login'; 
    const result = await orchestratorAgent.execute({
      url: testUrl,
      maxDepth: 1,
      headless: true,
      outputDir: './output/test_with_credentials',
      auth: {
        username: 'your_username',
        password: 'your_password',
        loginUrl: testUrl,
        usernameSelector: '#username',
        passwordSelector: '#password',
        submitSelector: '#login-button',
      },
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.message).toContain('Orchestration completed successfully');
  }, 60000);
});