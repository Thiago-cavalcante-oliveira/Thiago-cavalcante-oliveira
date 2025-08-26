export interface PageData {
  url: string;
  title: string;
  elements: (InteractiveElement | StaticElement)[];
  screenshots: string[];
  metadata: {
    timestamp: Date;
    loadTime: number;
    elementCount: number;
  };
}

export interface InteractionResult {
  element: {
    type: string;
    text: string;
    selector: string;
    location: string;
  };
  functionality: {
    action: string;
    expectedResult: string;
    triggersWhat: string;
    destinationUrl: string | null;
    opensModal: boolean;
    changesPageContent: boolean;
  };
  interactionResults: {
    wasClicked: boolean;
    visualChanges: string[];
    newElementsAppeared: string[];
    navigationOccurred: boolean;
    screenshotBefore: string;
    screenshotAfter: string;
  };
}

export interface ProxyConfig {
  proxy: {
    enabled: boolean;
    host: string;
    port: string;
    username: string;
    password: string;
    protocol: string;
  };
  authentication: {
    autoDetect: boolean;
    timeout: number;
    retryAttempts: number;
  };
  selectors: {
    usernameField: string;
    passwordField: string;
    submitButton: string;
    authDialog: string;
    authForm: string;
  };
}

export interface ProxyAuthResult {
  detected: boolean;
  authenticated: boolean;
  error?: string;
}

export interface CrawlResult {
    url: string;
    title: string;
    screenshot: string;
    elements: (NavigationElement | InteractiveElement)[];
    groups: ElementGroup[];
    pageMap: HomePageMap;
}

export interface ElementContext {
    element: InteractiveElement;
    relatedElements: RelatedElement[];
    screenshot: string;
}

export interface RelatedElement {
    element: InteractiveElement;
    relationship: string;
}

export interface ElementGroup {
    groupType: string;
    elements: InteractiveElement[];
    location: string;
}

export interface HomePageMap {
    mainContent: ElementGroup;
    header: ElementGroup;
    footer: ElementGroup;
    sidebars: ElementGroup[];
}

export enum InteractionType {
    Click = "click",
    Hover = "hover",
    FormFill = "form_fill"
}

export interface InteractiveElement {
    id: string;
    type: string;
    text: string;
    selector: string;
    href?: string;
    confidence: number;
    interactionType: InteractionType;
}

export interface NavigationElement extends InteractiveElement {
    isNavigation: true;
}

export interface StaticElement {
    type: string;
    text: string;
    selector: string;
}

export interface UserClickRequest {
    elementId: string;
    context: string;
}

export interface Menu {
    selector: string;
    items: Array<{
      selector: string;
      label: string;
      href?: string;
    }>;
}

export interface Modal {
    selector: string;
    title: string;
    buttons: string[];
}

export interface MenuDetectionResult {
    menus: Menu[];
    modals: Modal[];
    interactiveElements: Array<{
        selector: string;
        type: string;
        text: string;
        isVisible: boolean;
        boundingBox?: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
    }>;
}