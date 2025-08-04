import * as fs from 'fs';
import * as path from 'path';
import { mdToPdf } from 'md-to-pdf';

export interface OutputFormats {
  markdown: string;
  html: string;
  pdf: string;
}

export class AutoOutputService {
  private outputDir: string;

  constructor(outputDir: string = './output') {
    this.outputDir = outputDir;
    this.ensureOutputDirectory();
  }

  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    // Criar subdiretórios para diferentes formatos
    const subdirs = ['html', 'pdf', 'assets'];
    subdirs.forEach(subdir => {
      const dirPath = path.join(this.outputDir, subdir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
  }

  async generateAllFormats(markdownContent: string, baseFilename: string): Promise<OutputFormats> {
    console.log('📄 Gerando todos os formatos de saída...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeFilename = baseFilename.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    const paths = {
      markdown: path.join(this.outputDir, `${safeFilename}.md`),
      html: path.join(this.outputDir, 'html', `${safeFilename}.html`),
      pdf: path.join(this.outputDir, 'pdf', `${safeFilename}.pdf`)
    };

    try {
      // 1. Salvar Markdown
      console.log('📝 Salvando Markdown...');
      fs.writeFileSync(paths.markdown, markdownContent, 'utf8');
      
      // 2. Gerar HTML
      console.log('🌐 Gerando HTML...');
      const htmlContent = await this.generateHTML(markdownContent, safeFilename);
      fs.writeFileSync(paths.html, htmlContent, 'utf8');
      
      // 3. Gerar PDF
      console.log('📄 Gerando PDF...');
      await this.generatePDF(markdownContent, paths.pdf);
      
      console.log('✅ Todos os formatos gerados com sucesso!');
      console.log(`   📝 Markdown: ${paths.markdown}`);
      console.log(`   🌐 HTML: ${paths.html}`);
      console.log(`   📄 PDF: ${paths.pdf}`);
      
      return paths;
      
    } catch (error) {
      console.error(`❌ Erro na geração de formatos: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  private async generateHTML(markdownContent: string, filename: string): Promise<string> {
    // Converter Markdown para HTML básico
    const htmlContent = this.markdownToHTML(markdownContent);
    
    // Criar HTML completo com estilos
    const fullHTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manual do Usuário - ${filename}</title>
    <style>
        ${this.getHTMLStyles()}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Manual do Usuário</h1>
            <p class="subtitle">Gerado automaticamente em ${new Date().toLocaleDateString('pt-BR')}</p>
        </header>
        
        <main>
            ${htmlContent}
        </main>
        
        <footer>
            <p>© ${new Date().getFullYear()} - Manual gerado automaticamente</p>
        </footer>
    </div>
    
    <script>
        ${this.getHTMLScripts()}
    </script>
</body>
</html>`;
    
    return fullHTML;
  }

  private markdownToHTML(markdown: string): string {
    return markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      
      // Bold and Italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      
      // Images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="screenshot">')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      
      // Lists
      .replace(/^\s*\* (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>')
      
      // Horizontal rules
      .replace(/^---$/gm, '<hr>')
      
      // Paragraphs
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gm, '<p>$1</p>')
      
      // Clean up empty paragraphs
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<h[1-6]>.*<\/h[1-6]>)<\/p>/g, '$1')
      .replace(/<p>(<hr>)<\/p>/g, '$1')
      .replace(/<p>(<ul>.*<\/ul>)<\/p>/g, '$1');
  }

  private getHTMLStyles(): string {
    return `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #333;
        background-color: #f5f5f5;
      }
      
      .container {
        max-width: 1200px;
        margin: 0 auto;
        background: white;
        box-shadow: 0 0 20px rgba(0,0,0,0.1);
        min-height: 100vh;
      }
      
      header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 2rem;
        text-align: center;
      }
      
      header h1 {
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
      }
      
      .subtitle {
        opacity: 0.9;
        font-size: 1.1rem;
      }
      
      main {
        padding: 2rem;
      }
      
      h1, h2, h3 {
        color: #2c3e50;
        margin: 1.5rem 0 1rem 0;
      }
      
      h1 { font-size: 2rem; }
      h2 { font-size: 1.5rem; border-bottom: 2px solid #3498db; padding-bottom: 0.5rem; }
      h3 { font-size: 1.2rem; color: #7f8c8d; }
      
      p {
        margin-bottom: 1rem;
        text-align: justify;
      }
      
      .screenshot {
        max-width: 100%;
        height: auto;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        margin: 1rem 0;
        display: block;
      }
      
      ul {
        margin: 1rem 0;
        padding-left: 2rem;
      }
      
      li {
        margin-bottom: 0.5rem;
      }
      
      code {
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 4px;
        padding: 0.2rem 0.4rem;
        font-family: 'Courier New', monospace;
        font-size: 0.9rem;
      }
      
      pre {
        background: #2d3748;
        color: #e2e8f0;
        padding: 1rem;
        border-radius: 8px;
        overflow-x: auto;
        margin: 1rem 0;
      }
      
      pre code {
        background: none;
        border: none;
        color: inherit;
        padding: 0;
      }
      
      hr {
        border: none;
        height: 2px;
        background: linear-gradient(90deg, transparent, #3498db, transparent);
        margin: 2rem 0;
      }
      
      footer {
        background: #34495e;
        color: white;
        text-align: center;
        padding: 1rem;
        margin-top: 2rem;
      }
      
      /* Responsividade */
      @media (max-width: 768px) {
        .container {
          margin: 0;
          box-shadow: none;
        }
        
        header, main {
          padding: 1rem;
        }
        
        header h1 {
          font-size: 2rem;
        }
      }
      
      /* Animações suaves */
      .screenshot {
        transition: transform 0.3s ease;
      }
      
      .screenshot:hover {
        transform: scale(1.02);
        cursor: pointer;
      }
      
      /* Print styles */
      @media print {
        body {
          background: white;
        }
        
        .container {
          box-shadow: none;
        }
        
        header {
          background: #333 !important;
          color: white !important;
        }
      }
    `;
  }

  private getHTMLScripts(): string {
    return `
      // Adicionar funcionalidade de zoom nas imagens
      document.querySelectorAll('.screenshot').forEach(img => {
        img.addEventListener('click', function() {
          if (this.style.transform === 'scale(1.5)') {
            this.style.transform = 'scale(1)';
            this.style.position = 'relative';
            this.style.zIndex = '1';
          } else {
            this.style.transform = 'scale(1.5)';
            this.style.position = 'relative';
            this.style.zIndex = '1000';
            this.style.cursor = 'zoom-out';
          }
        });
      });
      
      // Smooth scrolling para links internos
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
          e.preventDefault();
          const target = document.querySelector(this.getAttribute('href'));
          if (target) {
            target.scrollIntoView({
              behavior: 'smooth'
            });
          }
        });
      });
      
      console.log('📱 Manual interativo carregado com sucesso!');
    `;
  }

  private async generatePDF(markdownContent: string, outputPath: string): Promise<void> {
    try {
      // Corrigir caminhos das imagens para caminhos absolutos
      const correctedMarkdown = this.fixImagePathsForPDF(markdownContent);
      
      // Criar arquivo CSS temporário
      const tempCssPath = path.join(this.outputDir, 'temp-pdf-styles.css');
      fs.writeFileSync(tempCssPath, this.getPDFStyles(), 'utf8');
      
      const pdfConfig = {
        dest: outputPath,
        pdf_options: {
          format: 'A4' as const,
          margin: {
            top: '20mm',
            right: '15mm',
            bottom: '20mm',
            left: '15mm'
          },
          printBackground: true,
          displayHeaderFooter: true,
          headerTemplate: `
            <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
              Manual do Usuário - Gerado automaticamente
            </div>
          `,
          footerTemplate: `
            <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
              Página <span class="pageNumber"></span> de <span class="totalPages"></span>
            </div>
          `
        },
        stylesheet: [tempCssPath]
      };

      await mdToPdf({ content: correctedMarkdown }, pdfConfig);
      
      // Limpar arquivo CSS temporário
      if (fs.existsSync(tempCssPath)) {
        fs.unlinkSync(tempCssPath);
      }
      
      console.log(`✅ PDF gerado: ${outputPath}`);
      
    } catch (error) {
      console.error(`❌ Erro na geração do PDF: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  private fixImagePathsForPDF(markdownContent: string): string {
    // Converter caminhos relativos para absolutos
    return markdownContent.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g, 
      (match, alt, imagePath) => {
        // Se o caminho já é absoluto, manter como está
        if (imagePath.startsWith('http') || imagePath.startsWith('/')) {
          return match;
        }
        
        // Converter para caminho absoluto
        const absolutePath = path.resolve(this.outputDir, imagePath);
        
        // Verificar se o arquivo existe
        if (fs.existsSync(absolutePath)) {
          return `![${alt}](file://${absolutePath})`;
        } else {
          console.warn(`⚠️ Imagem não encontrada para PDF: ${imagePath}`);
          return `![${alt}](${imagePath})`;
        }
      }
    );
  }

  private getPDFStyles(): string {
    return `
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: none;
        margin: 0;
        padding: 20px;
      }
      
      h1, h2, h3 {
        color: #2c3e50;
        page-break-after: avoid;
      }
      
      h1 {
        font-size: 24px;
        border-bottom: 3px solid #3498db;
        padding-bottom: 10px;
        margin-bottom: 20px;
      }
      
      h2 {
        font-size: 20px;
        margin-top: 30px;
        margin-bottom: 15px;
      }
      
      h3 {
        font-size: 16px;
        margin-top: 20px;
        margin-bottom: 10px;
      }
      
      img {
        max-width: 100%;
        height: auto;
        border: 1px solid #ddd;
        border-radius: 5px;
        margin: 10px 0;
        page-break-inside: avoid;
      }
      
      p {
        margin-bottom: 10px;
        text-align: justify;
        orphans: 3;
        widows: 3;
      }
      
      ul, ol {
        margin: 10px 0;
        padding-left: 30px;
      }
      
      li {
        margin-bottom: 5px;
      }
      
      code {
        background-color: #f5f5f5;
        border: 1px solid #ccc;
        border-radius: 3px;
        padding: 2px 4px;
        font-family: 'Courier New', monospace;
        font-size: 90%;
      }
      
      pre {
        background-color: #f8f8f8;
        border: 1px solid #ccc;
        border-radius: 5px;
        padding: 10px;
        overflow-x: auto;
        page-break-inside: avoid;
      }
      
      hr {
        border: none;
        height: 1px;
        background-color: #ccc;
        margin: 20px 0;
      }
      
      .page-break {
        page-break-before: always;
      }
    `;
  }

  async copyAssets(sourceDir: string): Promise<void> {
    const assetsDir = path.join(this.outputDir, 'assets');
    
    if (!fs.existsSync(sourceDir)) {
      console.log('⚠️ Diretório de assets não encontrado, pulando cópia');
      return;
    }

    try {
      const files = fs.readdirSync(sourceDir);
      const imageFiles = files.filter(file => 
        file.match(/\\.(png|jpg|jpeg|gif|svg)$/i)
      );

      console.log(`📁 Copiando ${imageFiles.length} assets...`);
      
      for (const file of imageFiles) {
        const sourcePath = path.join(sourceDir, file);
        const destPath = path.join(assetsDir, file);
        fs.copyFileSync(sourcePath, destPath);
      }
      
      console.log(`✅ Assets copiados para: ${assetsDir}`);
      
    } catch (error) {
      console.error(`❌ Erro ao copiar assets: ${error instanceof Error ? error.message : error}`);
    }
  }
}
