import { BaseAgent, AgentConfig, TaskData, TaskResult } from '../core/AgnoSCore.js';
import { MinIOService } from '../services/MinIOService.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Interfaces para organização dos tipos de dados
export interface DocumentFormats {
  markdown: string;
  html: string;
  pdf?: Buffer;
}

export interface GeneratedDocuments {
  formats: DocumentFormats;
  filePaths: {
    markdown: string;
    html: string;
    pdf?: string;
  };
  minioUrls: {
    markdown: string;
    html: string;
    pdf?: string;
  };
  metadata: {
    generatedAt: Date;
    totalPages: number;
    wordCount: number;
    sectionCount: number;
  };
}

export class GeneratorAgent extends BaseAgent {
  private minioService: MinIOService;
  private outputDir: string;

  // ✅ Construtor único e correto
  constructor(config: AgentConfig) {
    super(config);
    this.minioService = new MinIOService();
    this.outputDir = path.join(process.cwd(), 'output', 'final_documents');
  }

  async initialize(): Promise<void> {
    await this.minioService.initialize();
    await fs.mkdir(this.outputDir, { recursive: true });
    this.log('GeneratorAgent inicializado.');
  }

  async cleanup(): Promise<void> {
    this.log('GeneratorAgent finalizado.');
  }

  async processTask(task: TaskData): Promise<TaskResult> {
    const startTime = Date.now();
    try {
      if (task.type === 'generate_documents') {
        const { markdownContent, analysisData } = task.data; // Dados esperados do ContentAgent e AnalysisAgent
        const documents = await this.generateAllFormats(markdownContent, analysisData);
        
        return {
          id: uuidv4(),
          taskId: task.id,
          success: true,
          data: documents,
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
        };
      }
      throw new Error(`Tipo de tarefa não suportado pelo GeneratorAgent: ${task.type}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        id: uuidv4(),
        taskId: task.id,
        success: false,
        error: errorMessage,
        timestamp: new Date(),
        processingTime: Date.now() - startTime,
      };
    }
  }

  private async generateAllFormats(markdownContent: string, analysisData: any): Promise<GeneratedDocuments> {
    this.log('Gerando documentos em todos os formatos (MD, HTML, PDF)');

    // Gerar e salvar Markdown
    const markdownPath = path.join(this.outputDir, `manual_${Date.now()}.md`);
    await fs.writeFile(markdownPath, markdownContent, 'utf-8');

    // Gerar e salvar HTML
    const htmlContent = this.convertMarkdownToHTML(markdownContent, analysisData.title || 'Manual do Usuário');
    const htmlPath = path.join(this.outputDir, `manual_${Date.now()}.html`);
    await fs.writeFile(htmlPath, htmlContent, 'utf-8');

    // Gerar e salvar PDF
    let pdfPath: string | undefined;
    let pdfContent: Buffer | undefined;
    try {
      pdfContent = await this.generatePDF(htmlContent);
      pdfPath = path.join(this.outputDir, `manual_${Date.now()}.pdf`);
      await fs.writeFile(pdfPath, pdfContent);
    } catch (error) {
      this.log(`Geração de PDF falhou: ${error}`, 'warn');
    }

    // Upload para MinIO
    const markdownUrl = await this.minioService.uploadFile(markdownPath, path.basename(markdownPath), 'text/markdown');
    const htmlUrl = await this.minioService.uploadFile(htmlPath, path.basename(htmlPath), 'text/html');
    const pdfUrl = pdfPath ? await this.minioService.uploadFile(pdfPath, path.basename(pdfPath), 'application/pdf') : undefined;

    // Calcular metadados
    const wordCount = this.calculateWordCount(markdownContent);
    const sectionCount = analysisData.sections?.length || 0;

    const documents: GeneratedDocuments = {
      formats: { markdown: markdownContent, html: htmlContent, pdf: pdfContent },
      filePaths: { markdown: markdownPath, html: htmlPath, pdf: pdfPath },
      minioUrls: {
        markdown: markdownUrl || markdownPath,
        html: htmlUrl || htmlPath,
        pdf: pdfUrl || pdfPath
      },
      metadata: {
        generatedAt: new Date(),
        totalPages: analysisData.totalPages || 1,
        wordCount,
        sectionCount
      }
    };
    this.log(`Documentos gerados: MD (${wordCount} palavras), HTML, ${pdfPath ? 'PDF' : 'PDF falhou'}`);
    return documents;
  }

  // 👇 Cole aqui os seus métodos privados que já estavam corretos:
  // private async generateMarkdown(...) -> A lógica de gerar MD agora é do ContentAgent
  // private convertMarkdownToHTML(...)
  // private async generatePDF(...)
  // private calculateWordCount(...)
  
  // Exemplo simplificado dos métodos que você precisa colar aqui do seu código original
  private convertMarkdownToHTML(markdown: string, title: string): string {
    // ... Sua implementação de conversão de MD para HTML ...
    // É uma boa ideia usar uma biblioteca como 'marked' ou 'showdown' para isso.
    return `<html><head><title>${title}</title></head><body>${markdown}</body></html>`;
  }

  private async generatePDF(htmlContent: string): Promise<Buffer> {
      const puppeteer = await import('puppeteer').catch(() => null);
      if (!puppeteer) {
        throw new Error('A biblioteca Puppeteer é necessária para gerar PDF. Instale com `npm install puppeteer`.');
      }
      const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();
      return pdfBuffer;
  }

  private calculateWordCount(text: string): number {
    return text.split(/\s+/).filter(Boolean).length;
  }


  async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    if (!taskResult.success) {
      return `## Relatório do GeneratorAgent\n\n**Falha:** ${taskResult.error}`;
    }
    const documents = taskResult.data as GeneratedDocuments;
    return `## Relatório do GeneratorAgent\n\n- **Status:** ✅ Sucesso\n- **Documentos Gerados:** Markdown, HTML${documents.formats.pdf ? ', PDF' : ''}\n- **Contagem de Palavras:** ${documents.metadata.wordCount}`;
  }
}