import { mdToPdf } from 'md-to-pdf';
import * as fs from 'fs';
import * as path from 'path';

class PDFGenerator {
  private outputDir: string;
  private pdfOutputDir: string;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'output');
    this.pdfOutputDir = path.join(process.cwd(), 'pdfoutput');
  }

  private getCustomCSS(): string {
    return `
      @page {
        margin: 2cm 1.5cm 2cm 1.5cm;
        @top-center {
          content: "Manual de Usuário - Gerado Automaticamente";
          font-size: 10px;
          color: #666;
        }
        @bottom-center {
          content: "Página " counter(page) " de " counter(pages);
          font-size: 10px;
          color: #666;
        }
      }

      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: none;
        margin: 0;
        padding: 20px;
      }

      /* Título principal */
      h1 {
        color: #2c3e50;
        border-bottom: 3px solid #3498db;
        padding-bottom: 10px;
        margin-top: 30px;
        text-align: center;
        font-size: 24px;
      }

      h1:first-of-type {
        page-break-before: auto;
        margin-top: 0;
      }

      /* Títulos de seção */
      h2 {
        color: #34495e;
        border-bottom: 2px solid #e74c3c;
        padding-bottom: 8px;
        margin-top: 25px;
        margin-bottom: 15px;
        page-break-after: avoid;
        font-size: 18px;
      }

      /* Subtítulos */
      h3 {
        color: #2980b9;
        margin-top: 20px;
        margin-bottom: 10px;
        font-size: 16px;
      }

      h4 {
        color: #8e44ad;
        margin-top: 15px;
        margin-bottom: 8px;
        font-size: 14px;
      }

      /* Imagens de screenshot */
      img, .screenshot-image {
        max-width: 100%;
        height: auto;
        border: 2px solid #bdc3c7;
        border-radius: 8px;
        padding: 8px;
        margin: 15px auto;
        display: block;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        page-break-inside: avoid;
        background-color: white;
      }

      /* Container para screenshots */
      .screenshot-container {
        text-align: center;
        margin: 20px 0;
        page-break-inside: avoid;
      }

      .screenshot-container img {
        max-width: 90%;
        height: auto;
        border: 2px solid #bdc3c7;
        border-radius: 8px;
        padding: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        background-color: white;
      }

      /* Container para cada seção do manual */
      .manual-section {
        margin-bottom: 30px;
        page-break-inside: avoid;
      }

      /* Quebra de página entre seções */
      .section-break {
        page-break-before: always;
      }

      /* Informações do cabeçalho */
      .manual-header {
        text-align: center;
        margin-bottom: 30px;
        padding: 20px;
        background-color: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #dee2e6;
      }

      /* Informações da página */
      .page-info {
        background-color: #e8f4f8;
        padding: 15px;
        border-radius: 5px;
        margin: 20px 0;
        border-left: 4px solid #3498db;
        font-size: 14px;
      }

      /* Blocos de código */
      pre {
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 4px;
        padding: 15px;
        overflow-x: auto;
        font-size: 12px;
        page-break-inside: avoid;
      }

      code {
        background-color: #f8f9fa;
        padding: 2px 4px;
        border-radius: 3px;
        font-size: 90%;
        font-family: 'Courier New', monospace;
      }

      /* Citações */
      blockquote {
        border-left: 4px solid #3498db;
        margin: 0;
        padding-left: 15px;
        color: #7f8c8d;
        font-style: italic;
      }

      /* Tabelas */
      table {
        border-collapse: collapse;
        width: 100%;
        margin: 15px 0;
        page-break-inside: avoid;
        font-size: 14px;
      }

      th, td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }

      th {
        background-color: #f2f2f2;
        font-weight: bold;
      }

      /* Listas */
      ol, ul {
        margin: 10px 0;
        padding-left: 25px;
      }

      li {
        margin: 5px 0;
        line-height: 1.5;
      }

      /* Texto em negrito */
      strong {
        color: #2c3e50;
        font-weight: 600;
      }

      /* Separadores de seção */
      hr {
        border: none;
        border-top: 2px solid #3498db;
        margin: 30px 0;
        page-break-after: avoid;
      }

      /* Parágrafos */
      p {
        margin: 8px 0;
        text-align: justify;
      }

      /* Evita quebras ruins */
      .no-break {
        page-break-inside: avoid;
      }

      /* Estilos específicos para elementos do manual */
      .manual-section h2:first-child {
        margin-top: 0;
      }

      .manual-section img:first-of-type {
        margin-top: 10px;
      }

      /* Formatação especial para instruções passo-a-passo */
      .manual-section ol ol {
        list-style-type: lower-alpha;
      }

      /* URL e informações técnicas */
      .manual-header strong {
        color: #3498db;
      }
    `;
  }

  private getPDFConfig() {
    return {
      css: this.getCustomCSS(),
      body_class: ['manual-pdf'],
      marked_options: {
        headerIds: false,
        mangle: false
      },
      pdf_options: {
        format: 'A4' as const,
        margin: {
          top: '2cm',
          right: '1.5cm',
          bottom: '2cm',
          left: '1.5cm'
        },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size: 10px; color: #666; width: 100%; text-align: center; padding: 10px;">
            Manual de Usuário - Gerado Automaticamente
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 10px; color: #666; width: 100%; text-align: center; padding: 10px;">
            <span class="pageNumber"></span> / <span class="totalPages"></span>
          </div>
        `
      },
      launch_options: {
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files']
      }
    };
  }

  private preprocessMarkdown(content: string): string {
    // Adiciona classes CSS para melhor controle de quebras de página
    let processedContent = content;

    // Converter todas as imagens para data URLs (base64) para garantir inclusão no PDF
    processedContent = processedContent.replace(
      /!\[Screenshot\]\(\.?\/?((screenshot_\d+\.png))\)/g,
      (match, fullPath, imagePath) => {
        try {
          const fullImagePath = path.join(this.outputDir, imagePath);
          console.log(`🖼️  Processando imagem: ${fullImagePath}`);
          
          if (fs.existsSync(fullImagePath)) {
            const imageBuffer = fs.readFileSync(fullImagePath);
            const base64Image = imageBuffer.toString('base64');
            console.log(`✅ Imagem convertida para base64: ${imagePath} (${Math.round(base64Image.length/1024)}KB)`);
            
            // Usar tag HTML img diretamente para melhor controle
            return `<div class="screenshot-container"><img src="data:image/png;base64,${base64Image}" alt="Screenshot" class="screenshot-image" /></div>`;
          } else {
            console.warn(`⚠️ Imagem não encontrada: ${fullImagePath}`);
            return `<div class="screenshot-container"><p style="color: red; text-align: center; padding: 20px; border: 1px solid red;">❌ Screenshot não encontrado: ${imagePath}</p></div>`;
          }
        } catch (error) {
          console.warn(`⚠️ Erro ao processar imagem ${imagePath}:`, error);
          return `<div class="screenshot-container"><p style="color: orange; text-align: center; padding: 20px; border: 1px solid orange;">⚠️ Erro ao carregar screenshot: ${imagePath}</p></div>`;
        }
      }
    );

    // Adiciona quebra de página antes de cada nova seção principal (mas não na primeira)
    processedContent = processedContent.replace(
      /^---\s*\n## (Funcionalidade:|Página Principal:)/gm, 
      (match, title) => {
        return `<div class="section-break"></div>\n\n---\n## ${title}`;
      }
    );

    // Remove a primeira quebra de página se existir
    processedContent = processedContent.replace(
      /^<div class="section-break"><\/div>\s*\n\n---\s*\n## Página Principal:/m,
      '---\n## Página Principal:'
    );

    // Envolve cada seção completa em um container
    processedContent = processedContent.replace(
      /(---\s*\n## .*?)(?=\n---|\n<div class="section-break">|$)/gs,
      '<div class="manual-section">\n\n$1\n\n</div>'
    );

    // Adiciona classe especial para screenshots
    processedContent = processedContent.replace(
      /!\[Screenshot\]/g,
      '![Screenshot]{.screenshot-image}'
    );

    return processedContent;
  }

  async generatePDF(markdownFile: string): Promise<void> {
    const manualPath = `${this.outputDir}/${markdownFile}`;
    
    if (!fs.existsSync(manualPath)) {
      throw new Error(`Arquivo não encontrado: ${manualPath}`);
    }

    console.log('📖 Lendo arquivo markdown...');
    let markdownContent = fs.readFileSync(manualPath, 'utf8');
    
    // Contar screenshots antes do preprocessamento
    const screenshotCount = this.countScreenshots(markdownContent);
    
    console.log('🔧 Pré-processando conteúdo e configurando imagens...');
    markdownContent = this.preprocessMarkdown(markdownContent);

    console.log(`📄 Gerando PDF completo com ${screenshotCount} páginas de funcionalidades...`);
    
    const urlInfo = this.extractUrlInfo(markdownContent);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const pdfFilename = `manual_${urlInfo.sanitized}___${screenshotCount}pages_${timestamp}.pdf`;
    const pdfPath = `${this.pdfOutputDir}/${pdfFilename}`;

    try {
      // Criar arquivo temporário no diretório de output para que os caminhos relativos funcionem
      const tempMarkdownPath = path.join(this.outputDir, 'temp_manual_for_pdf.md');
      fs.writeFileSync(tempMarkdownPath, markdownContent);

      const pdf = await mdToPdf(
        { path: tempMarkdownPath },
        { 
          ...this.getPDFConfig(),
          dest: pdfPath 
        }
      );

      if (pdf && pdf.filename) {
        console.log(`✅ PDF gerado com sucesso: ${pdf.filename}`);
        const stats = fs.statSync(pdf.filename);
        console.log(`📊 Tamanho do arquivo: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`📅 Data de criação: ${new Date().toLocaleString('pt-BR')}`);
        console.log(`📑 Estrutura: Página Principal + ${screenshotCount - 1} Funcionalidades`);
        console.log(`🖼️  Screenshots incluídos: ${screenshotCount} imagens sequenciais`);
      }

      // Limpar arquivo temporário
      if (fs.existsSync(tempMarkdownPath)) {
        fs.unlinkSync(tempMarkdownPath);
      }
    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error);
      throw error;
    }
  }

  async listAvailableManuals(): Promise<string[]> {
    try {
      if (!fs.existsSync(this.outputDir)) {
        return [];
      }

      const files = fs.readdirSync(this.outputDir);
      return files.filter(file => file.endsWith('.md'));
    } catch (error) {
      console.error('❌ Erro ao listar manuais:', error);
      return [];
    }
  }

  private countScreenshots(content: string): number {
    const matches = content.match(/!\[Screenshot\]/g);
    return matches ? matches.length : 0;
  }

  private extractUrlInfo(content: string): { original: string; sanitized: string } {
    const urlMatch = content.match(/\*\*URL Base:\*\* (.+)/);
    const originalUrl = urlMatch ? urlMatch[1].trim() : 'unknown';
    
    const sanitized = originalUrl
      .replace(/https?:\/\//, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50);
    
    return { original: originalUrl, sanitized };
  }

  async validateScreenshots(): Promise<void> {
    console.log('� Validando screenshots ordenados...');
    
    const inputPath = path.join(this.outputDir, 'manual.md');
    if (!fs.existsSync(inputPath)) {
      console.log('⚠️  Arquivo manual.md não encontrado');
      return;
    }

    const markdownContent = fs.readFileSync(inputPath, 'utf-8');
    const screenshots = markdownContent.match(/screenshot_\d+\.png/g) || [];
    
    console.log(`📸 Screenshots encontrados no markdown: ${screenshots.length}`);
    
    for (const screenshot of screenshots) {
      const screenshotPath = path.join(this.outputDir, screenshot);
      if (fs.existsSync(screenshotPath)) {
        console.log(`✅ ${screenshot} - Disponível`);
      } else {
        console.log(`❌ ${screenshot} - Não encontrado`);
      }
    }
  }
}

// Script principal
async function main() {
  const generator = new PDFGenerator();

  try {
    console.log('🚀 Iniciando gerador de PDF...');
    
    // Valida screenshots antes de gerar
    await generator.validateScreenshots();
    
    // Lista manuais disponíveis
    const availableManuals = await generator.listAvailableManuals();
    console.log('📋 Manuais disponíveis:', availableManuals);

    if (availableManuals.length === 0) {
      console.log('⚠️  Nenhum manual encontrado no diretório output/');
      return;
    }

    // Usa o primeiro manual disponível ou o especificado por argumento
    const targetManual = process.argv[2] || availableManuals[0];
    
    if (!availableManuals.includes(targetManual)) {
      console.error(`❌ Manual não encontrado: ${targetManual}`);
      console.log('📋 Manuais disponíveis:', availableManuals);
      return;
    }

    console.log(`📖 Processando manual: ${targetManual}`);

    // Gera PDF único organizado em seções
    await generator.generatePDF(targetManual);

    console.log('🎉 Processo concluído com sucesso!');
    console.log(`📁 Arquivo gerado em: ${path.join(process.cwd(), 'pdfoutput')}`);

  } catch (error) {
    console.error('💥 Erro durante a execução:', error);
    process.exit(1);
  }
}

// Executa se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { PDFGenerator };
