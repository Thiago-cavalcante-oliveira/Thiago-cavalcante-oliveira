import { BaseAgent, AgentConfig, TaskData, TaskResult, AgentCapability } from '../core/AgnoSCore.js';
import { llmRouter } from '../services/LLMRouter.js'; // Importando a instância singleton
import { readFile } from 'fs/promises'; // Usando a versão assíncrona
import { v4 as uuidv4 } from 'uuid';

export interface VisionElement {
  purpose: string;
  text?: string;
  bounds: { x: number; y: number; width: number; height: number; }; // Padronizado para 'bounds'
}

export class VisionAgent extends BaseAgent {
  private visionPrompt: string = '';

  constructor() {
    const config: AgentConfig = {
      name: 'VisionAgent',
      version: '1.0.0',
      description: 'Analisa screenshots para identificar elementos interativos usando LLMs.',
      // Corrigido para o tipo AgentCapability[]
      capabilities: [
        { name: 'visual_analysis', description: 'Analisa screenshots para identificar elementos', version: '1.0.0' }
      ],
    };
    super(config);
  }

  async initialize(): Promise<void> {
    try {
      // Usando readFile assíncrono para não bloquear o processo
      this.visionPrompt = await readFile('./prompts/vision.prompt.txt', 'utf-8');
      this.log('Prompt de visão carregado com sucesso.');
    } catch (error) {
      this.log(`Falha ao carregar o prompt de visão: ${error}`, 'error');
      throw new Error('Inicialização do VisionAgent falhou: Não foi possível carregar o prompt.');
    }
  }

  async cleanup(): Promise<void> {
    // Nenhuma limpeza específica para o VisionAgent por enquanto
  }

  async processTask(task: TaskData): Promise<TaskResult> {
    const startTime = Date.now();
    if (task.type !== 'analyze_screenshot') {
      return this.createErrorResult(task.id, 'Tipo de tarefa não suportado.', startTime);
    }

    const { screenshotBuffer } = task.data as { screenshotBuffer: Buffer };
    if (!screenshotBuffer) {
      return this.createErrorResult(task.id, 'Buffer do screenshot está em falta.', startTime);
    }

    this.log('Analisando screenshot com o LLM...');
    try {
      // Usando a instância singleton do llmRouter
      const response = await llmRouter.route(this.visionPrompt, {}, screenshotBuffer);
      // Corrigido de response.text para response.content
      const parsedElements = this.parseLLMResponse(response.content);

      return {
        id: uuidv4(),
        taskId: task.id,
        success: true,
        data: { interactiveElements: parsedElements },
        timestamp: new Date(),
        // Usando o tempo de resposta real do LLM
        processingTime: response.responseTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`Erro durante a análise do LLM: ${errorMessage}`, 'error');
      return this.createErrorResult(task.id, `Análise do LLM falhou: ${errorMessage}`, startTime);
    }
  }

  private parseLLMResponse(llmResponse: string): VisionElement[] {
    try {
      const jsonMatch = llmResponse.match(/```json\n([\s\S]*?)\n```/);
      if (!jsonMatch || !jsonMatch[1]) {
        this.log('Nenhum bloco JSON encontrado na resposta do LLM.', 'warn');
        return [];
      }
      
      const jsonString = jsonMatch[1];
      const parsed = JSON.parse(jsonString);

      // Validação da estrutura dos dados recebidos
      if (Array.isArray(parsed?.interactiveElements)) {
         return parsed.interactiveElements as VisionElement[];
      }
      
      this.log('A estrutura JSON da resposta do LLM não é a esperada.', 'warn');
      return [];

    } catch (error) {
      this.log(`Falha ao fazer parse do JSON da resposta do LLM: ${error}`, 'error');
      return [];
    }
  }

  private createErrorResult(taskId: string, message: string, startTime: number): TaskResult {
    return {
      id: uuidv4(),
      taskId: taskId,
      success: false,
      error: message,
      timestamp: new Date(),
      processingTime: Date.now() - startTime,
    };
  }

  async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    if (!taskResult.success) {
      return `## Relatório do VisionAgent\n\n**Tarefa falhou:** ${taskResult.error || 'Erro desconhecido'}\n`;
    }

    const elements: VisionElement[] = taskResult.data?.interactiveElements || [];
    let report = `## Relatório de Análise do VisionAgent\n\n`;

    if (elements.length > 0) {
      report += `Identificou **${elements.length}** elementos interativos:\n\n`;
      elements.forEach(el => {
        report += `- **Propósito**: ${el.purpose}\n`;
        if (el.text) report += `  - **Texto**: "${el.text}"\n`;
        report += `  - **Localização**: x=${el.bounds.x}, y=${el.bounds.y}, w=${el.bounds.width}, h=${el.bounds.height}\n\n`;
      });
    } else {
      report += `Nenhum elemento interativo foi identificado.\n`;
    }
    return report;
  }
}
