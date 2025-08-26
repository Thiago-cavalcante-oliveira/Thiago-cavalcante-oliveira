import { Page } from 'playwright';
import { DetectionConfig } from '../../config/detection-strategies';
import { FoundElement } from '../interfaces/CrawlerTypes';

export async function detectPotentialModals(page: Page, config: DetectionConfig): Promise<FoundElement[]> {
  const modalSelectors = config.selectors.common.filter(selector => selector.includes('modal') || selector.includes('popup') || selector.includes('overlay'));
  const foundModals: FoundElement[] = [];

  for (const selector of modalSelectors) {
    const elements = await page.$$(selector);
    for (const element of elements) {
      const isVisible = await element.isVisible();
      if (isVisible) {
        const text = await element.textContent() || '';
        foundModals.push({
          selector: selector,
          text: text.trim(),
          type: 'other'
        });
      }
    }
  }

  return foundModals;
}