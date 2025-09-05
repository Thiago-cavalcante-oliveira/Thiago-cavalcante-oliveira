export interface BaseElement {
  type: string;
  purpose: string;
  selector: string;
}

export interface InteractiveElement extends BaseElement {
  action: 'input' | 'select' | 'submit' | 'click' | 'navigate' | 'toggle';
  required: boolean;
  interactionType: 'input' | 'select' | 'submit' | 'click' | 'navigate' | 'toggle';
  isStatic: false;
}

export interface StaticElement extends BaseElement {
  content: string;
  contentType: 'text' | 'image' | 'heading' | 'description' | 'label';
  isStatic: true;
}

export interface RelatedElement {
  type: string;
  relationship: 'describes' | 'validates' | 'submits' | 'contains';
  dependent: boolean;
  selector: string;
  isStatic?: boolean;
}

export interface ElementGroup {
  primary: InteractiveElement | StaticElement;
  related: RelatedElement[];
  context: {
    workflow: string;
    location: 'header' | 'footer' | 'left-sidebar' | 'right-sidebar' | 'main-content';
    importance: 'primary' | 'secondary';
    interactivityLevel: 'static' | 'interactive' | 'dynamic';
  };
}

export interface CrawlResult {
  url: string;
  title: string;
  elements: ElementGroup[];
  workflows: {
    name: string;
    steps: string[];
    elements: string[];
  }[];
  stats: {
    staticElements: number;
    interactiveElements: number;
    totalElements: number;
  };
  screenshots?: string[];
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
  interactivityLevel: 'static' | 'interactive' | 'dynamic';
}
