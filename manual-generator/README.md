# Manual Generator

Gerador automático de manuais de usuário usando Playwright e Gemini AI. O sistema navega por páginas web, interage com elementos, captura screenshots e gera documentação completa em markdown e PDF.

## 🚀 Funcionalidades

- **Navegação automatizada** com Playwright
- **Detecção inteligente** de elementos interativos
- **Análise com IA** usando Google Gemini
- **Screenshots sequenciais** de todas as interações
- **Geração de PDF profissional** com imagens incluídas
- **Arquitetura modular** para fácil manutenção

## 📋 Pré-requisitos

1. **Node.js** (versão 18+)
2. **Chave API do Google Gemini**
3. **Dependências** instaladas via npm

## ⚙️ Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
# Editar .env e adicionar sua GEMINI_API_KEY
```

## 🎯 Uso

### Gerar Manual Completo + PDF
```bash
npm run full:new "https://seu-site.com"
```

### Gerar Apenas Manual (Markdown)
```bash
npm run generate:new "https://seu-site.com"
```

### Gerar Apenas PDF (do markdown existente)
```bash
npm run pdf
```

## 📁 Estrutura de Arquivos

```
manual-generator/
├── src/
│   ├── config/         # Configurações centralizadas
│   ├── core/           # Lógica principal (ManualGenerator)
│   ├── services/       # Serviços (Playwright, Gemini)
│   ├── types/          # Definições TypeScript
│   └── utils/          # Utilitários
├── scripts/
│   └── generatePDF.ts  # Geração de PDF
├── output/             # Arquivos markdown e screenshots
├── pdfoutput/          # PDFs gerados
└── generateManualNew.ts # Entry point principal
```

## 🔧 Configuração

### Variáveis de Ambiente (.env)
```env
GEMINI_API_KEY=sua_chave_aqui
```

## 📊 Processo de Geração

1. **Navegação**: Acessa a URL fornecida
2. **Carregamento**: Aguarda página carregar completamente
3. **Detecção**: Identifica elementos interativos (botões, links)
4. **Captura**: Screenshot da página principal
5. **Interação**: Clica em cada elemento detectado
6. **Análise**: IA analisa funcionalidade e gera descrição
7. **Screenshots**: Captura resultado de cada interação
8. **Markdown**: Gera arquivo com toda documentação
9. **PDF**: Converte para PDF profissional

## 🖼️ Tratamento de Imagens

- Screenshots salvos como PNG sequenciais
- Conversão automática para base64 no PDF
- Caminhos relativos no markdown (`./screenshot_X.png`)
- Imagens incluídas diretamente no PDF final

## 📝 Exemplos de Uso

### Site E-commerce
```bash
npm run full:new "https://loja.exemplo.com"
```

### Sistema Administrativo
```bash
npm run full:new "https://admin.exemplo.com/login"
```

### API Documentation
```bash
npm run full:new "https://api-docs.exemplo.com"
```
