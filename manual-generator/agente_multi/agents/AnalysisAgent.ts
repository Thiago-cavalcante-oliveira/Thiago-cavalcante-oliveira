import { BaseAgent, AgentConfig, TaskData, TaskResult } from '../core/AgnoSCore.js';
import { llmRouter } from '../services/LLMRouter.js';
import { v4 as uuidv4 } from 'uuid';
import { AggregatedData, FinalAnalysis, ManualStep } from '../../types/types.js';

export class AnalysisAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      name: 'AnalysisAgent',
      version: '3.0.0',
      description: 'Analisa a sequência de passos de exploração para extrair insights e sumarizar a funcionalidade.',
      capabilities: [{ name: 'steps_analysis', description: 'Analisa uma sequência de interações.', version: '3.0.0' }],
    };
    super(config);
  }

  async initialize(): Promise<void> { this.log('AnalysisAgent inicializado.'); }
  async cleanup(): Promise<void> { this.log('AnalysisAgent finalizado.'); }

  async processTask(task: TaskData): Promise<TaskResult> {
    if (task.type !== 'analyze_steps') {
      throw new Error(`Tipo de tarefa não suportado: ${task.type}`);
    }

    const { steps } = task.data as AggregatedData;
    this.log(`Iniciando análise de ${steps.length} passos de exploração...`);

    const analysisPrompt = this.createAnalysisPrompt(steps);
    
    const response = await llmRouter.route(analysisPrompt, { provider: 'groq' });
    const finalAnalysis = this.parseAnalysisResponse(response.content);

    return {
      id: uuidv4(),
      taskId: task.id,
      success: true,
      data: finalAnalysis,
      timestamp: new Date(),
      processingTime: response.responseTime,
    };
  }
  
  private createAnalysisPrompt(steps: ManualStep[]): string {
    const stepsSummary = steps.map(step => 
      `Passo ${step.step}: ${step.actionDescription}\n  - URL: ${step.url}\n  - Elementos Vistos: ${step.analysis.elementsOnPage.map(e => `"${e.purpose}"`).join(', ')}`
    ).join('\n\n');

    return `
      Você é um especialista em análise de software. Com base na sequência de passos de exploração a seguir, gere uma análise concisa.

      Passos de Exploração:
      ${stepsSummary}

      Sua Tarefa:
      1.  **title**: Crie um título descritivo para o manual (ex: "Manual do Usuário - Sistema de Gestão Acadêmica").
      2.  **summary**: Escreva um parágrafo de resumo sobre a funcionalidade principal explorada.
      3.  **keyFunctionalities**: Liste as 3 a 5 funcionalidades mais importantes observadas.
      4.  **userWorkflows**: Descreva um ou dois fluxos de trabalho do usuário que foram identificados a partir dos passos.

      Responda APENAS em formato JSON com a estrutura:
      {
        "title": "string",
        "summary": "string",
        "keyFunctionalities": ["string"],
        "userWorkflows": [["string"]]
      }
    `;
  }
  
  private parseAnalysisResponse(response: string): FinalAnalysis {
    try {
      return JSON.parse(response);
    } catch (error) {
      this.log(`Erro ao parsear resposta da análise. Usando fallback. Erro: ${error}`, 'warn');
      return {
        title: "Manual do Sistema",
        summary: "Este documento descreve as funcionalidades exploradas no sistema.",
        keyFunctionalities: ["Navegação", "Interação com elementos"],
        userWorkflows: [["O usuário acessa o sistema, navega entre as páginas e clica em funcionalidades."]]
      };
    }
  }

  async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    if (!taskResult.success) return `## Relatório de Análise\n\n**Falha:** ${taskResult.error}`;
    const analysis = taskResult.data as FinalAnalysis;
    return `## Relatório de Análise\n\n- **Status:** Sucesso\n- **Título Proposto:** ${analysis.title}`;
  }
}
