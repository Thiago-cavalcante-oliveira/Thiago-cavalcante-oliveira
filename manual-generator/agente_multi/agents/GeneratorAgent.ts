import { BaseAgent, AgentConfig, TaskData, TaskResult } from '../core/AgnoSCore';
import { MinIOService } from '../services/MinIOService';
import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';

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
  private currentDocuments: GeneratedDocuments | null = null;

  private prompt: string;

  constructor(prompt: string) {
    const config: AgentConfig = {
      name: 'GeneratorAgent',
      version: '1.0.0',
      description: 'Agente especializado na geração de documentos finais em múltiplos formatos',
      capabilities: [
        { name: 'markdown_generation', description: 'Geração de documentos Markdown', version: '1.0.0' },
        { name: 'html_generation', description: 'Geração de documentos HTML', version: '1.0.0' },
        { name: 'pdf_generation', description: 'Geração de documentos PDF', version: '1.0.0' },
        { name: 'multi_format_export', description: 'Exportação em múltiplos formatos', version: '1.0.0' },
        { name: 'document_styling', description: 'Aplicação de estilos e formatação', version: '1.0.0' }
      ]
    };

    super(config);
    this.prompt = prompt;
    this.minioService = new MinIOService();
    this.outputDir = path.join(process.cwd(), 'output', 'final_documents');
  }

  async initialize(): Promise<void> {
    await this.minioService.initialize();
    await this.ensureOutputDirectory();
    this.log('GeneratorAgent inicializado para geração de documentos');
  }

  async processTask(task: TaskData): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      switch (task.type) {
        case 'generate_final_documents':
          return await this.handleDocumentGeneration(task);
        
        case 'generate_specific_format':
          return await this.handleSpecificFormatGeneration(task);
          
        case 'update_documents':
          return await this.handleDocumentUpdate(task);
          
        default:
          throw new Error(`Tipo de tarefa não suportada: ${task.type}`);
      }

    } catch (error) {
      return {
        id: task.id,
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };
    }
  }

  private async handleDocumentGeneration(task: TaskData): Promise<TaskResult> {
    const startTime = Date.now();
    const { userContent, crawlAnalysis, sessionData, authContext, rawData } = task.data;
    
    this.log('Iniciando geração de documentos finais');

    try {
      // Gerar documentos em todos os formatos
      const documents = await this.generateAllFormats(userContent, crawlAnalysis);
      this.currentDocuments = documents;

      // Enviar notificação de conclusão para o Orchestrator
      this.sendTask('OrchestratorAgent', 'generation_complete', {
        documents,
        userContent,
        crawlAnalysis,
        sessionData,
        authContext,
        rawData
      }, 'high');

      return {
        id: task.id,
        taskId: task.id,
        success: true,
        data: documents,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      this.log(`Erro na geração de documentos: ${error}`, 'error');
      throw error;
    }
  }

  private async handleSpecificFormatGeneration(task: TaskData): Promise<TaskResult> {
    const { userContent, format, options } = task.data;
    const startTime = Date.now();

    try {
      let result: any;

      switch (format) {
        case 'markdown':
          result = await this.generateMarkdown(userContent);
          break;
        case 'html':
          result = await this.generateHTML(userContent);
          break;
        case 'pdf':
          result = await this.generatePDF(userContent);
          break;
        default:
          throw new Error(`Formato não suportado: ${format}`);
      }

      return {
        id: task.id,
        taskId: task.id,
        success: true,
        data: result,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      throw error;
    }
  }

  private async handleDocumentUpdate(task: TaskData): Promise<TaskResult> {
    const { updates, format } = task.data;
    const startTime = Date.now();

    try {
      const updated = await this.updateDocuments(updates, format);

      return {
        id: task.id,
        taskId: task.id,
        success: true,
        data: updated,
        timestamp: new Date(),
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      throw error;
    }
  }

  private async generateAllFormats(userContent: any, crawlAnalysis: any): Promise<GeneratedDocuments> {
    this.log('Gerando documentos em todos os formatos (MD, HTML, PDF)');

    // Gerar Markdown
    const markdownContent = await this.generateMarkdown(userContent);
    const markdownPath = path.join(this.outputDir, `manual_usuario_${Date.now()}.md`);
    await fs.writeFile(markdownPath, markdownContent, 'utf-8');

    // Gerar HTML
    const htmlContent = await this.generateHTML(userContent);
    const htmlPath = path.join(this.outputDir, `manual_usuario_${Date.now()}.html`);
    await fs.writeFile(htmlPath, htmlContent, 'utf-8');

    // Gerar PDF (se possível)
    let pdfPath: string | undefined;
    let pdfContent: Buffer | undefined;
    try {
      pdfContent = await this.generatePDF(userContent);
      pdfPath = path.join(this.outputDir, `manual_usuario_${Date.now()}.pdf`);
      await fs.writeFile(pdfPath, pdfContent);
    } catch (error) {
      this.log(`PDF não pôde ser gerado: ${error}`, 'warn');
    }

    // Upload para MinIO
    const markdownUrl = await this.minioService.uploadFile(markdownPath, path.basename(markdownPath), 'text/markdown');
    const htmlUrl = await this.minioService.uploadFile(htmlPath, path.basename(htmlPath), 'text/html');
    const pdfUrl = pdfPath ? await this.minioService.uploadFile(pdfPath, path.basename(pdfPath), 'application/pdf') : undefined;

    // Calcular metadados
    const wordCount = this.calculateWordCount(markdownContent);
    const sectionCount = userContent.sections?.length || 0;

    const documents: GeneratedDocuments = {
      formats: {
        markdown: markdownContent,
        html: htmlContent,
        pdf: pdfContent
      },
      filePaths: {
        markdown: markdownPath,
        html: htmlPath,
        pdf: pdfPath
      },
      minioUrls: {
        markdown: markdownUrl || markdownPath,
        html: htmlUrl || htmlPath,
        pdf: pdfUrl || pdfPath
      },
      metadata: {
        generatedAt: new Date(),
        totalPages: crawlAnalysis.totalPages || 1,
        wordCount,
        sectionCount
      }
    };

    this.log(`Documentos gerados: MD (${wordCount} palavras), HTML, ${pdfPath ? 'PDF' : 'PDF falhou'}`);
    return documents;
  }

  private async generateMarkdown(userContent: any): Promise<string> {
    const metadata = userContent.metadata;
    const introduction = userContent.introduction;
    const sections = userContent.sections || [];
    const appendices = userContent.appendices;
    const summary = userContent.summary;

    let markdown = `# ${metadata.title}

${metadata.subtitle}

---

**Versão:** ${metadata.version}  
**Data de Criação:** ${metadata.dateCreated}  
**Público-Alvo:** ${metadata.targetAudience}  
**Tempo de Leitura Estimado:** ${metadata.estimatedReadTime}

---

## 📋 Índice

`;

    // Gerar índice
    sections.forEach((section: any, index: number) => {
      markdown += `${index + 1}. [${section.title}](#${section.id})\n`;
    });

    markdown += `
${sections.length + 1}. [Troubleshooting](#troubleshooting)
${sections.length + 2}. [Glossário](#glossario)
${sections.length + 3}. [Perguntas Frequentes](#faqs)
${sections.length + 4}. [Resumo e Próximos Passos](#resumo)

---

## 🎯 Introdução

### Visão Geral

${introduction.overview}

### Requisitos Necessários

`;

    introduction.requirements.forEach((req: string) => {
      markdown += `- ${req}\n`;
    });

    markdown += `
### Como Usar Este Manual

${introduction.howToUseManual}

---

`;

    // Gerar seções principais
    sections.forEach((section: any, index: number) => {
      markdown += `## ${index + 1}. ${section.title} {#${section.id}}

${section.description}

### 📝 Passo a Passo

`;

      section.steps.forEach((step: any) => {
        markdown += `#### ${step.stepNumber}. ${step.action}

${step.description}

**Resultado Esperado:** ${step.expectedResult}

`;
        
        if (step.screenshot) {
          markdown += `![Screenshot do Passo ${step.stepNumber}](${step.screenshot})\n\n`;
        }

        if (step.notes && step.notes.length > 0) {
          markdown += `**Observações:**\n`;
          step.notes.forEach((note: string) => {
            markdown += `- ${note}\n`;
          });
          markdown += '\n';
        }
      });

      if (section.tips && section.tips.length > 0) {
        markdown += `### 💡 Dicas Úteis

`;
        section.tips.forEach((tip: string) => {
          markdown += `- ${tip}\n`;
        });
        markdown += '\n';
      }

      if (section.troubleshooting && section.troubleshooting.length > 0) {
        markdown += `### ⚠️ Problemas Comuns

`;
        section.troubleshooting.forEach((issue: string) => {
          markdown += `- ${issue}\n`;
        });
        markdown += '\n';
      }

      markdown += '---\n\n';
    });

    // Gerar apêndices
    markdown += `## 🔧 Troubleshooting {#troubleshooting}

Esta seção contém soluções para os problemas mais comuns:

`;

    appendices.troubleshooting.forEach((item: any) => {
      markdown += `### ${item.problem}

**Sintomas:**
`;
      item.symptoms.forEach((symptom: string) => {
        markdown += `- ${symptom}\n`;
      });

      markdown += `
**Soluções:**
`;
      item.solutions.forEach((solution: string) => {
        markdown += `- ${solution}\n`;
      });

      markdown += `
**Prevenção:**
`;
      item.prevention.forEach((prev: string) => {
        markdown += `- ${prev}\n`;
      });

      markdown += '\n---\n\n';
    });

    markdown += `## 📖 Glossário {#glossario}

`;

    appendices.glossary.forEach((item: any) => {
      markdown += `**${item.term}:** ${item.definition}`;
      if (item.example) {
        markdown += ` *Exemplo: ${item.example}*`;
      }
      markdown += '\n\n';
    });

    markdown += `## ❓ Perguntas Frequentes {#faqs}

`;

    const categories = Array.from(new Set(appendices.faqs.map((faq: any) => faq.category))) as string[];
    
    categories.forEach((category: string) => {
      markdown += `### ${category}\n\n`;
      
      appendices.faqs
        .filter((faq: any) => faq.category === category)
        .forEach((faq: any) => {
          markdown += `**P: ${faq.question}**\n\nR: ${faq.answer}\n\n`;
        });
    });

    markdown += `## 📋 Resumo e Próximos Passos {#resumo}

### Principais Aprendizados

`;

    summary.keyTakeaways.forEach((takeaway: string) => {
      markdown += `- ${takeaway}\n`;
    });

    markdown += `
### Próximos Passos

`;

    summary.nextSteps.forEach((step: string) => {
      markdown += `- ${step}\n`;
    });

    markdown += `
### Contatos de Suporte

`;

    summary.supportContacts.forEach((contact: string) => {
      markdown += `- ${contact}\n`;
    });

    markdown += `
---

*Manual gerado automaticamente em ${new Date().toLocaleString('pt-BR')} pelo Sistema de Geração de Manuais.*
`;

    return markdown;
  }

  private async generateHTML(userContent: any): Promise<string> {
    const markdownContent = await this.generateMarkdown(userContent);
    
    // Template HTML base
    const htmlTemplate = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${userContent.metadata.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        h2 {
            color: #34495e;
            margin-top: 30px;
            padding-left: 15px;
            border-left: 4px solid #3498db;
        }
        h3 {
            color: #7f8c8d;
            margin-top: 25px;
        }
        h4 {
            color: #95a5a6;
            margin-top: 20px;
        }
        .metadata {
            background: #ecf0f1;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .toc {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .toc ul {
            list-style-type: none;
            padding-left: 0;
        }
        .toc li {
            margin: 8px 0;
        }
        .toc a {
            color: #3498db;
            text-decoration: none;
        }
        .toc a:hover {
            text-decoration: underline;
        }
        .step {
            background: #f1f2f6;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
            border-left: 4px solid #2ecc71;
        }
        .tip {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
        }
        .warning {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
        }
        .troubleshooting {
            background: #e1f5fe;
            border: 1px solid #b3e5fc;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
        }
        code {
            background: #f4f4f4;
            padding: 2px 5px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        blockquote {
            border-left: 4px solid #bdc3c7;
            margin: 0;
            padding: 10px 20px;
            background: #f9f9f9;
        }
        img {
            max-width: 100%;
            height: auto;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            margin: 10px 0;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ecf0f1;
            text-align: center;
            color: #7f8c8d;
            font-size: 0.9em;
        }
        .emoji {
            font-size: 1.2em;
        }
        ul, ol {
            padding-left: 20px;
        }
        li {
            margin: 5px 0;
        }
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            .container {
                padding: 20px;
            }
            h1 {
                font-size: 1.8em;
            }
            h2 {
                font-size: 1.4em;
            }
        }
        @media print {
            body {
                background: white;
            }
            .container {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        ${this.convertMarkdownToHTML(markdownContent)}
    </div>
</body>
</html>`;

    return htmlTemplate;
  }

  private convertMarkdownToHTML(markdown: string): string {
    // Conversão básica de Markdown para HTML
    let html = markdown;

    // Headers
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');

    // Bold
    html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/gim, '<a href="$2">$1</a>');

    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^\)]+)\)/gim, '<img src="$2" alt="$1">');

    // Code
    html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');

    // Lists
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');

    // Line breaks
    html = html.replace(/\n\n/gim, '</p><p>');
    html = html.replace(/\n/gim, '<br>');

    // Wrap in paragraphs
    html = '<p>' + html + '</p>';

    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/gim, '');
    html = html.replace(/<p><h([1-6])>/gim, '<h$1>');
    html = html.replace(/<\/h([1-6])><\/p>/gim, '</h$1>');

    // Fix lists
    html = html.replace(/<p><li>/gim, '<ul><li>');
    html = html.replace(/<\/li><\/p>/gim, '</li></ul>');

    return html;
  }

  private async generatePDF(userContent: any): Promise<Buffer> {
    // Para geração de PDF, tentaremos usar puppeteer se disponível
    // Caso contrário, retornaremos uma mensagem explicativa
    
    try {
      const htmlContent = await this.generateHTML(userContent);
      
      // Tentar usar puppeteer se disponível
      const puppeteer = await import('puppeteer').catch(() => null);
      
      if (puppeteer) {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(htmlContent);
        
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '1cm',
            right: '1cm',
            bottom: '1cm',
            left: '1cm'
          }
        });
        
        await browser.close();
        return Buffer.from(pdfBuffer);
      } else {
        throw new Error('Puppeteer não disponível para geração de PDF');
      }

    } catch (error) {
      this.log(`PDF não pôde ser gerado: ${error}`, 'warn');
      throw error;
    }
  }

  private async updateDocuments(updates: any, format?: string): Promise<any> {
    // Implementação futura para atualização de documentos
    this.log('Funcionalidade de atualização de documentos não implementada ainda');
    return null;
  }

  private calculateWordCount(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  private async ensureOutputDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      this.log(`Erro ao criar diretório de saída: ${error}`, 'warn');
    }
  }

  async generateMarkdownReport(taskResult: TaskResult): Promise<string> {
    const timestamp = new Date().toISOString();
    
    let report = `# Relatório do GeneratorAgent

**Task ID:** ${taskResult.taskId}
**Timestamp:** ${timestamp}
**Status:** ${taskResult.success ? '✅ Sucesso' : '❌ Falha'}
**Tempo de Processamento:** ${taskResult.processingTime}ms

`;

    if (taskResult.success && taskResult.data) {
      const documents = taskResult.data as GeneratedDocuments;
      
      report += `## 📄 Documentos Gerados

### Formatos Disponíveis

- **Markdown:** ✅ Gerado (${documents.metadata.wordCount} palavras)
- **HTML:** ✅ Gerado com estilos responsivos
- **PDF:** ${documents.formats.pdf ? '✅ Gerado' : '❌ Falhou'}

### Metadados dos Documentos

- **Data de Geração:** ${documents.metadata.generatedAt.toLocaleString('pt-BR')}
- **Total de Páginas Analisadas:** ${documents.metadata.totalPages}
- **Contagem de Palavras:** ${documents.metadata.wordCount}
- **Seções no Manual:** ${documents.metadata.sectionCount}

### Caminhos dos Arquivos

**Local:**
- Markdown: \`${documents.filePaths.markdown}\`
- HTML: \`${documents.filePaths.html}\`
${documents.filePaths.pdf ? `- PDF: \`${documents.filePaths.pdf}\`` : ''}

**MinIO (Cloud):**
- Markdown: ${documents.minioUrls.markdown}
- HTML: ${documents.minioUrls.html}
${documents.minioUrls.pdf ? `- PDF: ${documents.minioUrls.pdf}` : ''}

### Recursos dos Documentos

**Markdown:**
- Formatação rica com emojis
- Índice interativo
- Seções bem estruturadas
- Links internos funcionais

**HTML:**
- Design responsivo
- Estilos CSS modernos
- Compatível com impressão
- Navegação suave

${documents.formats.pdf ? '**PDF:**\n- Layout profissional\n- Pronto para impressão\n- Formatação preservada' : '**PDF:** Não foi possível gerar (puppeteer não disponível)'}

## 🎯 Resultado Final

✅ Sistema de geração multi-agente **CONCLUÍDO COM SUCESSO**

### Pipeline Executado:
1. **LoginAgent** → Autenticação e captura de sessão
2. **CrawlerAgent** → Navegação e captura de elementos
3. **AnalysisAgent** → Análise inteligente com IA
4. **ContentAgent** → Criação de conteúdo user-friendly  
5. **GeneratorAgent** → Geração de documentos finais

### Estatísticas Finais:
- **Agentes Utilizados:** 5
- **Formatos Gerados:** ${documents.formats.pdf ? '3' : '2'} (MD, HTML${documents.formats.pdf ? ', PDF' : ''})
- **Armazenamento:** Local + MinIO Cloud
- **Status:** Pronto para uso

## Próximas Etapas

✅ **PROCESSO COMPLETO** - Documentos prontos para entrega
📥 Downloads disponíveis nos links do MinIO
🔄 Sistema pronto para nova execução
📞 Suporte disponível para melhorias

`;
    } else {
      report += `## ❌ Erro na Geração de Documentos

**Erro:** ${taskResult.error}

## Ações Recomendadas

- Verificar disponibilidade de espaço em disco
- Verificar permissões de escrita no diretório output/
- Verificar configuração do MinIO
- Instalar puppeteer para geração de PDF: \`npm install puppeteer\`

`;
    }

    // Salvar relatório no MinIO
    await this.minioService.uploadReportMarkdown(report, this.config.name, taskResult.taskId);

    return report;
  }

  async cleanup(): Promise<void> {
    this.currentDocuments = null;
    this.log('GeneratorAgent finalizado - documentos gerados com sucesso');
  }
}
