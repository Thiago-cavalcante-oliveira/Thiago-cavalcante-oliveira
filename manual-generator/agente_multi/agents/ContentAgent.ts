import { BaseAgent } from '../core/AgnoSCore';
import { v4 as uuidv4 } from 'uuid';
import { FinalAnalysis, ManualStep, AgentConfig, TaskData, TaskResult } from '../../types/types';
import path from 'path';

export class ContentAgent extends BaseAgent {
  constructor() {
    const config: AgentConfig = {
      name: 'ContentAgent',
      version: '3.0.0',
      description: 'Transforma a análise final e os passos em um manual bem estruturado em Markdown.',
      capabilities: [{ name: 'markdown_generation', description: 'Gera conteúdo de manual em Markdown.', version: '3.0.0' }],
    };
    super(config);
  }

  async initialize(): Promise<void> { this.log.info('ContentAgent inicializado.'); }
  async cleanup(): Promise<void> {}

  async processTask(task: TaskData): Promise<TaskResult> {
    if (task.type !== 'generate_content') {
      throw new Error(`Tipo de tarefa não suportado: ${task.type}`);
    }
    const { analysis, steps } = task.data as { analysis: FinalAnalysis, steps: ManualStep[] };
    this.log.info('Gerando conteúdo Markdown a partir da análise final...');

    const markdownContent = this.buildMarkdown(analysis, steps);

    return {
      id: uuidv4(),
      taskId: task.id,
      success: true,
      data: { markdownContent },
      timestamp: new Date(),
      processingTime: 10,
    };
  }

  private buildMarkdown(analysis: FinalAnalysis, steps: ManualStep[]): string {
    let md = `# ${analysis.title}\n\n`;
    md += `## Introdução\n\n${analysis.summary}\n\n`;
    
    md += `## Funcionalidades Principais\n\n`;
    analysis.keyFunctionalities.forEach(func => { md += `- ${func}\n`; });

    md += `\n## Passo a Passo da Exploração\n\n`;
    steps.forEach(step => {
      md += `### Passo ${step.step}: ${step.actionDescription}\n\n`;
      md += `**URL:** \`${step.url}\`\n\n`;
      const screenshotName = path.basename(step.screenshotPath);
      md += `![Screenshot do Passo ${step.step}](./../artifacts/screenshot/${screenshotName})\n\n`;
      md += `Nesta tela, foram identificados os seguintes elementos:\n`;
      step.analysis.elementsOnPage.forEach(el => {
        md += `- **${el.purpose}** ${el.text ? `(Texto: "${el.text}")` : ''}\n`;
      });
      md += '\n---\n\n';
    });

    return md;
  }

  async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    return `## Relatório do ContentAgent\n\n- **Status:** Sucesso`;
  }
}

