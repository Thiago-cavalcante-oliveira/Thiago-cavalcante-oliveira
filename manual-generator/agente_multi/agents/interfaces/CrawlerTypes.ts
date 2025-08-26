import { DetectionConfig } from '../../config/detection-strategies';

export interface FoundElement {
  selector: string;
  text: string;
  type: 'button' | 'link' | 'other';
}

export interface CrawlResult {
  pageData: any[]; 
  interactions: any[];
  stats: { [key: string]: number };
  totalElements: number;
}

export interface ElementContext {
  elements: any[]; 
  config: DetectionConfig;
}

export interface ElementGroup {
  type: string;
  elements: any[];
}

export interface HomePageMap {
  mainMenu: any | null;
  modals: any[];
  majorActions: any[];
}

export enum InteractionType {
  Click = 'click',
  Hover = 'hover',
  FormFill = 'form_fill',
}

export interface InteractiveElement {
  type: string;
  text: string;
  selector: string;
  href?: string;
}

export interface NavigationElement {
  type: string;
  text: string;
  selector: string;
  href: string;
}

export interface StaticElement {
  type: string;
  text: string;
  selector: string;
}

export interface UserClickRequest {
  element: any;
  action: string;
}

export interface RelatedElement {
  element: any;
  relationship: string;
}
