import { BaseAgent, AgentConfig, TaskData, TaskResult } from '../core/AgnoSCore.js';
import { MinIOService } from '../services/MinIOService.js';
import { v4 as uuidv4 } from 'uuid';

export interface ContentGenerationData extends TaskData {
  analysisData: CrawlAnalysis;
  crawlData: any; // Adicionei crawlData aqui, se necessário para futuras expansões
}

export class ContentAgent extends BaseAgent {
  private minioService: MinIOService;

  constructor(config: AgentConfig, minioService: MinIOService) {
    super(config);
    this.minioService = minioService;
  }

  async initialize(): Promise<void> { /* ... */ }
  async cleanup(): Promise<void> { /* ... */ }

  async processTask(task: TaskData): Promise<TaskResult> {
    this.log('Processando tarefa de geração de conteúdo...');
    const { analysisData, crawlData } = task.data as ContentGenerationData;

    // Gerar um título baseado na análise ou um padrão
    const title = analysisData.summary || 'Manual do Utilizador';

    // Conteúdo markdown simplificado para demonstração
    const markdownContent = `# ${title}\n\n${analysisData.summary}\n\n---\n\n## Páginas Analisadas\n\n${analysisData.pageAnalyses.map(page => `- [${page.title}](${page.url})`).join('\n')}\n\n---\n\n## Elementos Chave\n\n${analysisData.pageAnalyses.flatMap(page => page.elementAnalyses).map(el => `- **${el.description}**: ${el.functionality}`).join('\n')}`;

    return {
      id: uuidv4(),
      taskId: task.id,
      success: true,
      data: { markdownContent, analysisData }, // Passar analysisData para o GeneratorAgent
      timestamp: new Date(),
      processingTime: 100
    };
  }

  async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    return `## Relatório do ContentAgent\n\n- Status: ${taskResult.success ? 'Sucesso' : 'Falha'}`;
  }
}
