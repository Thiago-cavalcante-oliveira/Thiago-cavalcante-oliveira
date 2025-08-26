import { Page, Browser } from 'playwright';
import { promises as fs } from 'fs';
import { MinIOService } from '../../services/MinIOService.js';
import { LLMManager } from '../../services/LLMManager.js';
import { MenuDetectionResult, UserClickRequest, InteractionResult, InteractiveElement } from './types';
import { MenuModalAgent } from '../MenuModalAgent.js';
import { Timeline } from '../../services/Timeline.js';

// Função movida de CrawlerAgent.ts e adaptada
export async function captureScreenshot(
    page: Page, 
    filename: string,
    outputDir: string,
    minioService: MinIOService
): Promise<string> {
    if (!page) return '';
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = `${outputDir}/screenshot-${filename}-${timestamp}.png`;
      
      await page.screenshot({ 
        path: screenshotPath, 
        fullPage: true 
      });
      
      const buffer = await fs.readFile(screenshotPath);
      const minioPath = `screenshots/${filename}-${timestamp}.png`;
      await minioService.uploadBuffer(buffer, minioPath, 'image/png');
      
      await fs.unlink(screenshotPath).catch(() => {});
      
      return minioPath;
    } catch (error: any) {
      console.error(`Erro ao capturar screenshot: ${error}`);
      return '';
    }
}

// Função movida de CrawlerAgent.ts e adaptada
export async function detectMainMenuWithUserInteraction(page: Page, menuModalAgent: MenuModalAgent, timeline?: Timeline): Promise<MenuDetectionResult | null> {
    if (!menuModalAgent || !page) {
      console.log('MenuModalAgent ou página não disponível para detecção de menu');
      return null;
    }

    try {
      console.log('🔍 Iniciando detecção avançada de menus...');
      await page.waitForTimeout(3000);
      const menuResult = await menuModalAgent.run();
      console.log(`📊 Detecção automática concluída: ${menuResult.menus.length} menus, ${menuResult.interactiveElements.length} elementos interativos`);
      await page.waitForTimeout(5000);
      
      if (menuResult.menus.length === 0) {
        console.log('⚠️ Nenhum menu principal detectado automaticamente. Solicitando interação do usuário...');
        const userInteraction = await menuModalAgent.requestUserInteraction();
        if (!userInteraction.userCancelled && userInteraction.clickedElement) {
            console.log(`👆 Usuário clicou em: ${userInteraction.clickedElement.text} (${userInteraction.clickedElement.selector})`);
            const analysis = await menuModalAgent.analyzeClickedElement(userInteraction.clickedElement.selector);
            console.log(`🔍 Análise do elemento clicado: ${analysis.relatedElements.length} elementos relacionados encontrados`);
            await page.waitForTimeout(3000);
            if (timeline) {
              await timeline.recordEvent({
                type: 'user_action',
                description: 'Usuário identificou menu principal',
                metadata: {
                  clickedElement: userInteraction.clickedElement,
                  relatedElements: analysis.relatedElements.length
                },
                status: 'success',
                tags: ['user-interaction', 'menu-detection']
              });
            }
        } else {
            console.log('❌ Usuário cancelou a interação ou não clicou em nenhum elemento');
        }
      } else {
        console.log('✅ Menus detectados automaticamente - não é necessária interação do usuário');
        await page.waitForTimeout(5000);
      }
      console.log('🏁 Detecção de menus concluída');
      return menuResult;
    } catch (error: any) {
      console.error(`❌ Erro na detecção de menu: ${error}`);
      return null;
    }
}

// Nova função extraída de CrawlerAgent.ts
export function createFailedInteractionResult(element: any, screenshotBefore: string): InteractionResult {
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

// Nova função extraída de CrawlerAgent.ts
export async function tryInteractionWithElement(
  page: Page,
  element: InteractiveElement,
  log: (message: string, stage?: string) => Promise<void>,
  minioService: MinIOService,
  outputDir: string
): Promise<InteractionResult> {
  const screenshotBefore = await captureScreenshot(page, 'before-interaction', outputDir, minioService);
  
  try {
    await log(`Tentando interação com o elemento: ${element.text || element.selector}`);
    await page.click(element.selector, { timeout: 5000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 7000 });
    const screenshotAfter = await captureScreenshot(page, 'after-interaction', outputDir, minioService);
    await log(`Interação com ${element.text || element.selector} bem-sucedida.`);
    
    return {
      element: { type: element.type, text: element.text, selector: element.selector, location: 'main-content' },
      functionality: {
        action: 'click',
        expectedResult: 'navigate or change content',
        triggersWhat: 'navigation',
        destinationUrl: page.url(),
        opensModal: false, 
        changesPageContent: true
      },
      interactionResults: {
        wasClicked: true,
        visualChanges: [], 
        newElementsAppeared: [],
        navigationOccurred: true,
        screenshotBefore: screenshotBefore,
        screenshotAfter: screenshotAfter
      }
    };
  } catch (error: any) {
    await log(`Falha na interação com ${element.text || element.selector}: ${error.message}`);
    const screenshotAfter = await captureScreenshot(page, 'after-interaction-failed', outputDir, minioService);
    return {
      element: { type: element.type, text: element.text, selector: element.selector, location: 'main-content' },
      functionality: {
        action: 'click',
        expectedResult: 'failed to interact',
        triggersWhat: 'error',
        destinationUrl: '',
        opensModal: false,
        changesPageContent: false
      },
      interactionResults: {
        wasClicked: false,
        visualChanges: [],
        newElementsAppeared: [],
        navigationOccurred: false,
        screenshotBefore: screenshotBefore,
        screenshotAfter: screenshotAfter
      }
    };
  }
}

// Nova função extraída de CrawlerAgent.ts
export async function detectAndInteractWithElements(
  page: Page,
  elements: InteractiveElement[],
  log: (message: string, stage?: string) => Promise<void>,
  minioService: MinIOService,
  outputDir: string
): Promise<InteractionResult[]> {
  const interactionResults: InteractionResult[] = [];
  for (const element of elements) {
    const result = await tryInteractionWithElement(page, element, log, minioService, outputDir);
    interactionResults.push(result);
    if (!result.interactionResults.wasClicked) {
      await log('Interação falhou, interrompendo a sequência de interações.');
      break;
    }
  }
  return interactionResults;
}