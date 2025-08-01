export interface InteractiveElement {
  selector: string;
  text: string;
  type: 'button' | 'link' | 'clickable';
  id?: string;
  className?: string;
  context?: 'navigation' | 'expandable' | 'card' | 'action' | 'link' | 'text';
  element?: any; // Para debug purposes
}

export interface InteractionResult {
  element: InteractiveElement;
  filename: string;
  content: string;
  modalContent: string | null;
  url: string;
  title: string;
  success: boolean;
  navigationOccurred: boolean;
  urlChanged: boolean;
  initialUrl: string;
  finalUrl: string;
  error?: string;
}

export interface RetryConfig {
  maxRetries: number;
  baseWaitTime: number;
  maxWaitTime: number;
  rateLimitWaitTime: number;
}

export interface AnalysisContext {
  text?: string;
  type?: string;
  url?: string;
  sectionTitle?: string;
  isMainPage?: boolean;
}

export interface ManualSection {
  title: string;
  content: string;
  screenshot: string;
  url: string;
}

export interface NavigationStrategy {
  waitUntil?: 'networkidle' | 'domcontentloaded' | 'load';
  timeout: number;
}

export interface AuthCredentials {
  username?: string;
  password?: string;
}
