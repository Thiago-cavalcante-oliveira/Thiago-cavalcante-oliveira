import { BaseAgent } from '../core/AgnoSCore';
import{ AgentConfig, TaskData, TaskResult} from '../../types/types'
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import puppeteer from 'puppeteer';
import { marked } from 'marked';

export class GeneratorAgent extends BaseAgent {
  private outputDir: string;

  constructor() {
    const config: AgentConfig = {
      name: 'GeneratorAgent',
      version: '1.1.0',
      description: 'Gera documentos finais em múltiplos formatos (MD, HTML, PDF).',
      capabilities: [{ name: 'document_generation', description: 'Criação de PDF/HTML a partir de Markdown', version: '1.1.0' }],
    };
    super(config);
    this.outputDir = path.join(process.cwd(), 'output', 'final_documents');
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });
    this.log.info('GeneratorAgent inicializado.');
  }

  async cleanup(): Promise<void> {}

  async processTask(task: TaskData): Promise<TaskResult> {
    if (task.type !== 'generate_documents') {
      throw new Error(`Tipo de tarefa não suportado: ${task.type}`);
    }
    const { markdownContent } = task.data as { markdownContent: string };
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    const mdPath = path.join(this.outputDir, `manual_${timestamp}.md`);
    await fs.writeFile(mdPath, markdownContent, 'utf-8');

    const htmlContent = await marked.parse(markdownContent);
    const htmlPath = path.join(this.outputDir, `manual_${timestamp}.html`);
    await fs.writeFile(htmlPath, this.styleHTML(htmlContent), 'utf-8');
    
    let pdfPath: string | undefined;
    try {
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
        const page = await browser.newPage();
        await page.setContent(this.styleHTML(htmlContent), { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();
        
        pdfPath = path.join(this.outputDir, `manual_${timestamp}.pdf`);
        await fs.writeFile(pdfPath, pdfBuffer);
    } catch (error) {
        this.log.warn({error}, `Geração de PDF falhou`);
    }

    return {
        id: uuidv4(),
        taskId: task.id,
        success: true,
        data: { filePaths: { markdown: mdPath, html: htmlPath, pdf: pdfPath } },
        timestamp: new Date(),
        processingTime: 0,
    };
  }

  private styleHTML(content: string): string {
    return `
      <!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8"><title>Manual do Sistema</title>
      <style>body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px; } h1, h2, h3 { border-bottom: 1px solid #ddd; padding-bottom: 4px; color: #333; } img { max-width: 100%; height: auto; border: 1px solid #ccc; border-radius: 4px; margin-top: 1em; } code { background: #f4f4f4; padding: 2px 5px; border-radius: 4px;}</style>
      </head><body>${content}</body></html>
    `;
  }

  async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    const { filePaths } = taskResult.data as { filePaths: Record<string, string | undefined>};
    return `## Relatório do GeneratorAgent\n\n- **Status:** Sucesso\n- **Documentos Gerados:**\n  - MD: ${filePaths.markdown}\n  - HTML: ${filePaths.html}\n  - PDF: ${filePaths.pdf || 'N/A'}`;
  }
}

