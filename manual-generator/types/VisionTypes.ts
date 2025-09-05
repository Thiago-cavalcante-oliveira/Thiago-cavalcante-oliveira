import { Page } from 'playwright';

export interface VisionElement {
  id: string;
  type: string;
  selector: string;
  bbox: { x: number; y: number; width: number; height: number; };
  description: string;
  actionable: boolean;
  value?: string;
}

export interface InteractionTask {
  action: 'navigate' | 'click' | 'input';
  url?: string;
  element?: VisionElement;
  value?: string;
}

export interface ManualStep {
  step: number;
  url: string;
  actionDescription: string;
  screenshotId: string;
  elementsOnPage: VisionElement[];
}