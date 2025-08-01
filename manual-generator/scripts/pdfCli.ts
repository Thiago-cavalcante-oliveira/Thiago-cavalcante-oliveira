#!/usr/bin/env node
import { PDFGenerator } from './generatePDF.js';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  const generator = new PDFGenerator();

  switch (command) {
    case 'generate':
    case 'all':
      console.log('📄 Gerando PDF completo organizado em seções...');
      await generator.validateScreenshots();
      const availableManuals = await generator.listAvailableManuals();
      if (availableManuals.length > 0) {
        console.log(`📄 Gerando PDF para: ${availableManuals[0]}`);
        await generator.generatePDF(availableManuals[0]);
      } else {
        console.log('❌ Nenhum manual encontrado para gerar PDF');
      }
      break;

    case 'validate':
      console.log('� Validando estrutura do manual e screenshots...');
      await generator.validateScreenshots();
      break;

    case 'list':
      const manuals = await generator.listAvailableManuals();
      console.log('📋 Manuais disponíveis:');
      manuals.forEach((manual, index) => {
        console.log(`  ${index + 1}. ${manual}`);
      });
      break;

    case 'clean':
      const pdfDir = path.join(process.cwd(), 'pdfoutput');
      if (fs.existsSync(pdfDir)) {
        const files = fs.readdirSync(pdfDir);
        files.forEach(file => {
          if (file.endsWith('.pdf')) {
            fs.unlinkSync(path.join(pdfDir, file));
            console.log(`🗑️  Removido: ${file}`);
          }
        });
        console.log('✅ Limpeza concluída!');
      } else {
        console.log('📁 Diretório pdfoutput não encontrado');
      }
      break;

    case 'help':
    default:
      console.log(`
🔧 Manual Generator - Gerador de PDF

Uso: npm run pdf:cli <comando> [opções]

Comandos disponíveis:
  generate, all    Gera PDF único organizado em seções
  validate         Valida estrutura do manual e screenshots
  list            Lista manuais disponíveis
  clean           Remove todos os PDFs gerados
  help            Mostra esta ajuda

Funcionalidades:
  ✅ PDF único com todas as seções ordenadas
  ✅ Screenshots sequenciais (screenshot_1.png → screenshot_N.png)
  ✅ Estrutura: Página Principal → Funcionalidades
  ✅ Quebras de página automáticas entre seções
  ✅ Formatação profissional com CSS customizado

Exemplos:
  npm run pdf:cli generate     # Gera PDF completo
  npm run pdf:cli validate     # Valida screenshots
  npm run pdf:cli list         # Lista manuais
  npm run pdf:cli clean        # Limpa PDFs

Arquivos de saída: ./pdfoutput/
      `);
      break;
  }
}

main().catch(console.error);
