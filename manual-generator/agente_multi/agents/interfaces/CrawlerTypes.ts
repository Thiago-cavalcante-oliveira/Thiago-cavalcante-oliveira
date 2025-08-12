export type InteractionType = 'input' | 'submit' | 'select' | 'click' | 'navigate' | 'toggle';
export type ContentType = 'heading' | 'text' | 'image' | 'description';
export type InteractivityLevel = 'static' | 'interactive' | 'dynamic';

export interface BaseElement {
  type: string;
  purpose: string;
  selector: string;
}

export interface InteractiveElement extends BaseElement {
  action: string;
  required: boolean;
  interactionType: InteractionType;
  isStatic: false;
}

export interface StaticElement extends BaseElement {
  content: string;
  contentType: ContentType;
  isStatic: true;
}

export interface RelatedElement {
  type: string;
  relationship: 'describes' | 'validates' | 'submits' | 'contains';
  dependent: boolean;
  selector: string;
}

export interface ElementGroup {
  primary: InteractiveElement | StaticElement;
  related: RelatedElement[];
  context: {
    workflow: string;
    location: string;
    importance: 'primary' | 'secondary';
    interactivityLevel: InteractivityLevel;
  };
}

export interface CrawlResult {
  url: string;
  title: string;
  elements: ElementGroup[];
  workflows: Array<{
    name: string;
    steps: string[];
    elements: string[];
  }>;
  stats: {
    staticElements: number;
    interactiveElements: number;
    totalElements: number;
  };
  metadata: {
    timestamp: Date;
    loadTime: number;
    elementCount: number;
  };
}

export interface ElementContext {
  type: string;
  purpose: string;
  actionType: string;
  workflow?: string;
  importance: 'primary' | 'secondary';
  interactivityLevel: InteractivityLevel;
}
