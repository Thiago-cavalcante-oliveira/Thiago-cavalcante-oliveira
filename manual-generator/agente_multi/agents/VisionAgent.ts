import { BaseAgent } from '../core/AgnoSCore';
import { llmRouter } from '../services/LLMRouter';
import { readFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { VisionElement, AgentConfig, TaskData, TaskResult } from '../../types/types';

export class VisionAgent extends BaseAgent {
  private visionPrompt: string = '';

  constructor() {
    const config: AgentConfig = {
      name: 'VisionAgent',
      version: '1.1.0',
      description: 'Analisa screenshots para identificar elementos interativos usando LLMs.',
      capabilities: [{ name: 'visual_analysis', description: 'Analisa screenshots para identificar elementos', version: '1.1.0' }],
    };
    super(config);
  }

  async initialize(): Promise<void> {
    try {
      this.visionPrompt = await readFile('./agente_multi/prompts/vision.prompt.txt', 'utf-8');
      this.log.info('Prompt de visão carregado com sucesso.');
    } catch (error) {
      this.log.error({ error }, 'Falha ao carregar o prompt de visão');
      throw new Error('Inicialização do VisionAgent falhou: Não foi possível carregar o prompt.');
    }
  }

  async cleanup(): Promise<void> {}

  async processTask(task: TaskData): Promise<TaskResult> {
    const startTime = Date.now();
    if (task.type !== 'analyze_screenshot') {
      return this.createErrorResult(task.id, 'Tipo de tarefa não suportado.', startTime);
    }

    const { screenshotBuffer } = task.data as { screenshotBuffer: Buffer };
    if (!screenshotBuffer) {
      return this.createErrorResult(task.id, 'Buffer do screenshot está em falta.', startTime);
    }

    this.log.info('Analisando screenshot com o LLM...');
    try {
      const response = await llmRouter.route(this.visionPrompt, { provider: 'gemini' }, screenshotBuffer);
      const parsedElements = this.parseLLMResponse(response.content);

      return {
        id: uuidv4(),
        taskId: task.id,
        success: true,
        data: { interactiveElements: parsedElements },
        timestamp: new Date(),
        processingTime: response.responseTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log.error({ error }, `Erro durante a análise do LLM`);
      return this.createErrorResult(task.id, `Análise do LLM falhou: ${errorMessage}`, startTime);
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

  private parseLLMResponse(llmResponse: string): VisionElement[] {
    try {
      const jsonMatch = llmResponse.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : llmResponse;
      
      const parsed = JSON.parse(jsonString);

      if (parsed && Array.isArray(parsed.interactiveElements)) {
         return parsed.interactiveElements;
      }
      
      this.log.warn({ response: llmResponse }, 'A estrutura JSON da resposta do LLM não é a esperada.');
      return [];

    } catch (error) {
      this.log.error({ error, llmResponse }, 'Falha ao fazer parse do JSON da resposta do LLM');
      return [];
    }
  }

  async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    if (!taskResult.success) {
      return `## Relatório do VisionAgent\n\n**Tarefa falhou:** ${taskResult.error || 'Erro desconhecido'}\n`;
    }
    const elements = (taskResult.data?.interactiveElements as VisionElement[]) || [];
    return `## Relatório de Análise do VisionAgent\n\nIdentificou **${elements.length}** elementos interativos.`;
  }
}

