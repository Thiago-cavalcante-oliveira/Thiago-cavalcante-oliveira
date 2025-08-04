export interface InteractiveElement {
  selector: string;
  text: string;
  name: string; // Nome do elemento
  type: 'button' | 'link' | 'clickable' | 'input' | 'textarea' | 'select';
  id?: string;
  className?: string;
  context?: 'navigation' | 'expandable' | 'card' | 'action' | 'link' | 'text' | 'form' | 'modal' | 'menu' | 'content';
  href?: string;
  boundingBox?: any;
  coordinates?: { x: number; y: number }; // Coordenadas do elemento
  size?: { width: number; height: number }; // Tamanho do elemento
  isVisible?: boolean; // Se o elemento está visível
  score?: number; // Score de relevância para priorização
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
  newPageExplored?: boolean; // Se uma nova página foi explorada
  newPageElements?: InteractiveElement[]; // Elementos encontrados na nova página
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
