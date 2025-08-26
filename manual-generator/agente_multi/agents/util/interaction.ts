import { Page, ElementHandle } from 'playwright';
import { DetectionConfig } from '../../config/detection-strategies';
import { FoundElement } from '../interfaces/CrawlerTypes';

async function isElementVisible(element: ElementHandle): Promise<boolean> {
  return await element.isVisible();
}

export async function detectAndInteractWithElements(page: Page, config: DetectionConfig): Promise<FoundElement[]> {
  const foundElements: FoundElement[] = [];
  const selectors = [...config.selectors.common, ...config.selectors.administrative, ...config.selectors.custom];

  for (const selector of selectors) {
    const elements = await page.$$(selector);
    for (const element of elements) {
      if (await isElementVisible(element)) {
        const text = await element.textContent() || '';
        const type = selector.includes('button') || selector.includes('btn') ? 'button' : (selector.includes('a') ? 'link' : 'other');
        foundElements.push({
          selector: selector,
          text: text.trim(),
          type: type
        });
      }
    }
  }
  return foundElements;
}

export async function tryInteractionWithElement(page: Page, element: ElementHandle, selector: string): Promise<boolean> {
  try {
    await element.click({ timeout: 5000 });
    await page.waitForLoadState('networkidle');
    return true;
  } catch (error) {
    console.error(`Error interacting with selector ${selector}:`, error);
    return false;
  }
}