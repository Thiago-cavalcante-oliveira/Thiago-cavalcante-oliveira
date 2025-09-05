import { BaseAgent } from '../core/AgnoSCore';
import { llmRouter } from '../services/LLMRouter';
import { v4 as uuidv4 } from 'uuid';
import { AggregatedData, FinalAnalysis, ManualStep, AgentConfig, TaskData, TaskResult } from '../../types/types';

export class AnalysisAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      name: 'AnalysisAgent',
      version: '3.0.0',
      description: 'Analisa a sequência de passos para extrair insights.',
      capabilities: [{ name: 'steps_analysis', description: 'Analisa uma sequência de interações.', version: '3.0.0' }],
    };
    super(config);
  }

  async initialize(): Promise<void> { this.log.info('AnalysisAgent inicializado.'); }
  async cleanup(): Promise<void> {}

  async processTask(task: TaskData): Promise<TaskResult> {
    if (task.type !== 'analyze_steps') {
      throw new Error(`Tipo de tarefa não suportado: ${task.type}`);
    }

    const { steps } = task.data as AggregatedData;
    this.log.info(`Analisando ${steps.length} passos de exploração...`);

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
      `Passo ${step.step}: ${step.actionDescription}\n  - URL: ${step.url}`
    ).join('\n');

    return `
      Você é um especialista em análise de software. Com base na sequência de passos de exploração a seguir, gere uma análise concisa para um manual de utilizador.

      Passos de Exploração:
      ${stepsSummary}

      Sua Tarefa (Responda APENAS em formato JSON):
      1.  "title": Crie um título descritivo para o manual.
      2.  "summary": Escreva um parágrafo de resumo sobre a funcionalidade principal explorada.
      3.  "keyFunctionalities": Liste as 3 a 5 funcionalidades mais importantes observadas.
      4.  "userWorkflows": Descreva um ou dois fluxos de trabalho do utilizador em uma lista de passos simples (ex: ["Aceder ao dashboard", "Clicar em 'Novo Relatório'", "Preencher formulário", "Guardar relatório"]).
    `;
  }
  
  private parseAnalysisResponse(response: string): FinalAnalysis {
    try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if(!jsonMatch) throw new Error("Nenhum JSON encontrado na resposta da LLM");
        return JSON.parse(jsonMatch[0]);
    } catch (error) {
      this.log.warn({ error, response }, `Erro ao parsear resposta da análise. Usando fallback.`);
      return {
        title: "Manual do Sistema",
        summary: "Este documento descreve as funcionalidades exploradas no sistema.",
        keyFunctionalities: ["Navegação", "Interação com elementos"],
        userWorkflows: [["O utilizador acede ao sistema, navega entre as páginas e clica em funcionalidades."]]
      };
    }
  }

  async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    if (!taskResult.success) return `## Relatório de Análise\n\n**Falha:** ${taskResult.error}`;
    const analysis = taskResult.data as FinalAnalysis;
    return `## Relatório de Análise\n\n- **Status:** Sucesso\n- **Título Proposto:** ${analysis.title}`;
  }
}

