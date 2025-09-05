// --- Core do Sistema ---
export interface AgentConfig {
  name: string;
  version: string;
  description: string;
  capabilities: { name: string; description: string; version: string; }[];
}

export interface TaskData {
  id: string;
  type: string;
  sender: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  data: Record<string, any>;
}

export interface TaskResult {
  id: string;
  taskId: string;
  success: boolean;
  data?: Record<string, any>;
  error?: string;
  timestamp: Date;
  processingTime: number;
  markdownReport?: string;
}

// --- Configuração da Orquestração ---
export interface OrchestrationConfig {
  targetUrl: string;
  outputDir: string;
  maxSteps: number;
  enableScreenshots: boolean;
  outputFormats: ('markdown' | 'html' | 'pdf')[];
  credentials?: {
    username: string;
    password: string;
    loginUrl?: string;
  };
}

// --- Estruturas para o Ciclo Interativo ---
export interface InteractionTask {
  action: 'navigate' | 'click';
  url: string;
  element?: VisionElement;
}

export interface VisionElement {
  purpose: string;
  text?: string;
  bounds: { x: number; y: number; width: number; height: number; };
}

export interface ManualStep {
  step: number;
  url: string;
  actionDescription: string;
  screenshotPath: string; // Caminho para o artefato salvo
  analysis: {
    elementsOnPage: VisionElement[];
  };
}

// --- Estruturas para Agentes de Análise e Conteúdo ---
export interface AggregatedData {
    steps: ManualStep[];
    config: OrchestrationConfig;
}

export interface FinalAnalysis {
    title: string;
    summary: string;
    keyFunctionalities: string[];
    userWorkflows: string[][];
}

