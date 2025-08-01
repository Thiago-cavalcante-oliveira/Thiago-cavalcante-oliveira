# Gerador de PDF - Manual de Usuário

Este módulo converte os manuais gerados em formato Markdown para PDF com formatação profissional, mantendo a ordem sequencial dos screenshots e organizando o conteúdo em seções.

## 🚀 Recursos

- **Conversão Markdown para PDF** com formatação profissional
- **CSS customizado** para melhor apresentação
- **Quebras de página inteligentes** para seções
- **Screenshots ordenados** (screenshot_1.png → screenshot_N.png)
- **Cabeçalhos e rodapés** com numeração de páginas
- **Estrutura organizada**: Página Principal → Funcionalidades
- **Validação automática** de screenshots e estrutura

## 📋 Comandos Disponíveis

### Geração Básica
```bash
# Gera PDF único organizado em seções
npm run pdf

# Usando CLI com mais opções
npm run pdf:cli generate
```

### Comandos CLI
```bash
# Gera PDF único com todas as seções
npm run pdf:cli generate

# Valida estrutura do manual e screenshots
npm run pdf:cli validate

# Lista manuais disponíveis
npm run pdf:cli list

# Remove todos os PDFs gerados
npm run pdf:cli clean

# Mostra ajuda completa
npm run pdf:cli help
```

## 📁 Estrutura de Saída

```
pdfoutput/
└── manual_www_google_com___5pages_2025-07-30T19-12-32.pdf  # PDF único organizado
```

**Nomenclatura do arquivo:**
- `manual_` + URL_simplificada + `_` + número_de_páginas + `pages_` + timestamp

## 🎨 Formatação do PDF

### Estrutura Sequencial
1. **Página Principal** - Screenshot 1 + descrição completa
2. **Funcionalidade 1** - Screenshot 2 + análise detalhada  
3. **Funcionalidade 2** - Screenshot 3 + análise detalhada
4. **Funcionalidade N** - Screenshot N + análise detalhada

### Estilos Aplicados
- **Fonte**: Segoe UI (sistema) para melhor legibilidade
- **Margens**: 2cm superior/inferior, 1.5cm laterais
- **Cores**: Esquema profissional azul/cinza
- **Screenshots**: Bordas destacadas, centralizados, sombra sutil
- **Quebras de página**: Automáticas entre seções principais

### Elementos Especiais
- **Cabeçalho**: "Manual de Usuário - Gerado Automaticamente"
- **Rodapé**: Numeração de páginas (X / Total)
- **Screenshots**: Bordas e sombras com fundo branco
- **Código**: Blocos destacados com fundo cinza
- **Títulos**: Hierarquia visual clara com cores

## 🔧 Configuração

### CSS Customizado
O arquivo `generatePDF.ts` inclui CSS customizado para:
- Quebras de página inteligentes
- Formatação de títulos e subtítulos
- Espaçamento consistente
- Preservação de imagens
- Tabelas responsivas

### Opções de PDF
- **Formato**: A4
- **Orientação**: Retrato
- **Qualidade**: Alta resolução
- **Fontes**: Incorporadas no PDF
- **Imagens**: Compressão otimizada

## 📊 Estrutura do Manual

O gerador segue a lógica definida:

### 1. **Página Principal** (Screenshot 1)
- Captura inicial do site/aplicação
- Descrição geral da interface
- Elementos visíveis identificados
- Ações possíveis mapeadas
- Instruções passo-a-passo básicas

### 2. **Funcionalidades Interativas** (Screenshots 2-N)
Para cada elemento interativo detectado:
- Screenshot da modal/estado alterado após interação
- Descrição específica da funcionalidade
- Elementos específicos da nova interface
- Ações possíveis na nova tela
- Instruções detalhadas de uso

### Validação Automática
- ✅ Verifica existência de todos os screenshots sequenciais
- ✅ Valida estrutura do markdown (seções organizadas)
- ✅ Confirma ordem correta (screenshot_1.png → screenshot_N.png)
- ✅ Garante caminhos absolutos para imagens no PDF

## 🛠️ Personalização

### Modificar CSS
Edite o método `getCustomCSS()` em `generatePDF.ts`:

```typescript
private getCustomCSS(): string {
  return `
    /* Seus estilos personalizados aqui */
    h1 { color: #custom-color; }
  `;
}
```

### Configurar Opções de PDF
Ajuste o método `getPDFConfig()`:

```typescript
pdf_options: {
  format: 'A4',        // ou 'Letter', 'A3', etc
  margin: { ... },     // margens personalizadas
  printBackground: true // cores de fundo
}
```

## 🔍 Debugging

### Logs do Processo
O gerador exibe informações detalhadas:
- 📖 Leitura do arquivo
- 🔧 Pré-processamento
- 🎨 Aplicação de estilos
- 📄 Geração do PDF
- 📊 Estatísticas do arquivo

### Troubleshooting
- **Erro de arquivo não encontrado**: Verifique se o manual existe em `output/`
- **PDF vazio**: Confirme se o Markdown tem conteúdo válido
- **Imagens não aparecem**: Verifique caminhos relativos das imagens
- **Formatação incorreta**: Revise a estrutura do Markdown

## 📈 Performance

- **Velocidade**: ~2-5 segundos para manual completo
- **Tamanho**: Tipicamente 0.1-0.5 MB por manual
- **Qualidade**: Resolução adequada para impressão
- **Compatibilidade**: PDF/A para arquivamento

## 🔄 Integração

### Com Geração de Manual
```bash
# Gera manual e PDF em sequência
npm run full
# ou
npm run generate && npm run pdf
```

### Validação Antes da Geração
```bash
# Valida screenshots e estrutura
npm run pdf:cli validate

# Gera PDF após validação
npm run pdf:cli generate
```

### Workflow Completo
```bash
# 1. Gera manual com screenshots ordenados
npm run generate

# 2. Valida estrutura e screenshots
npm run pdf:cli validate

# 3. Gera PDF organizado em seções
npm run pdf
```

## 📝 Formatos Suportados

### Entrada
- ✅ Markdown (.md)
- ✅ Imagens PNG/JPG
- ✅ Links e referências
- ✅ Listas e tabelas

### Saída
- ✅ PDF com qualidade de impressão
- ✅ Metadados incorporados
- ✅ Marcadores de navegação
- ✅ Texto pesquisável

---

**Desenvolvido com md-to-pdf e otimizado para manuais gerados automaticamente.**
