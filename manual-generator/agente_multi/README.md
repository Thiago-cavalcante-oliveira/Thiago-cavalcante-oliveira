# 🤖 Sistema Multi-Agente de Geração de Manuais

Um sistema avançado baseado no framework **AgnoS** que utiliza múltiplos agentes especializados para gerar automaticamente manuais de usuário completos e profissionais a partir de aplicações web.

## 🚀 Características

- **Pipeline Multi-Agente**: 5 agentes especializados trabalhando em conjunto
- **IA Generativa**: Integração com Google Gemini para análise inteligente
- **Múltiplos Formatos**: Geração em Markdown, HTML e PDF
- **Screenshots Automáticos**: Captura hierárquica de elementos
- **Armazenamento em Nuvem**: Integração opcional com MinIO
- **Relatórios Detalhados**: Acompanhamento completo da execução

## 🏗️ Arquitetura do Sistema

### Agentes Especializados

1. **🔐 LoginAgent** - Autenticação e gerenciamento de sessão
2. **🕷️ CrawlerAgent** - Navegação e captura de elementos
3. **🧠 AnalysisAgent** - Análise inteligente com IA
4. **📝 ContentAgent** - Criação de conteúdo user-friendly
5. **📄 GeneratorAgent** - Geração de documentos finais
6. **🎯 OrchestratorAgent** - Coordenação do pipeline

### Pipeline de Execução

```
URL Alvo → LoginAgent → CrawlerAgent → AnalysisAgent → ContentAgent → GeneratorAgent → Manuais Finais
```

## 📋 Pré-requisitos

- **Node.js** 18+ 
- **NPM** ou **Yarn**
- **API Key do Google Gemini** (obrigatório)
- **MinIO** (opcional, para armazenamento em nuvem)

## 🔧 Instalação

1. **Clone e configure o projeto:**
```bash
cd agente_multi
npm install
```

2. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
```

3. **Edite o arquivo .env com suas configurações:**
```env
# OBRIGATÓRIO - API Key do Gemini
GEMINI_API_KEY=sua_api_key_aqui

# URL que você quer documentar
TARGET_URL=https://exemplo.com

# Credenciais (se necessário)
LOGIN_USERNAME=seu_usuario
LOGIN_PASSWORD=sua_senha
```

## 🎮 Como Usar

### Execução Básica

```bash
npm run start
```

### Execução em Modo de Desenvolvimento

```bash
npm run dev
```

### Limpeza de Arquivos

```bash
npm run clean
```

## 📊 Resultados Gerados

Após a execução bem-sucedida, você encontrará:

### 📁 Estrutura de Saída

```
output/
├── final_documents/           # Documentos gerados
│   ├── manual_usuario_xxx.md  # Manual em Markdown
│   ├── manual_usuario_xxx.html # Manual em HTML
│   └── manual_usuario_xxx.pdf  # Manual em PDF (se disponível)
└── screenshots/               # Screenshots capturados
    ├── main_page.png
    └── elements/
        ├── element_01_xxx.png
        └── ...
```

### 🔗 Links Disponíveis

- **Documentos Finais**: URLs diretos para download
- **Relatórios de Agentes**: Logs detalhados de cada etapa
- **Screenshots**: Imagens organizadas por elemento

## ⚙️ Configuração Avançada

### MinIO (Armazenamento em Nuvem)

Para habilitar o armazenamento em nuvem, configure no `.env`:

```env
MINIO_ENDPOINT=seu-minio-server.com
MINIO_PORT=9000
MINIO_ACCESS_KEY=sua_access_key
MINIO_SECRET_KEY=sua_secret_key
MINIO_BUCKET=documentacao
```

### Personalização da URL Alvo

```env
# Exemplos de URLs que podem ser documentadas
TARGET_URL=https://www.google.com          # Site público
TARGET_URL=https://app.exemplo.com/login   # Sistema com login
TARGET_URL=http://localhost:3000           # Aplicação local
```

## 🔍 Solução de Problemas

### ❌ Erro: "GEMINI_API_KEY não configurada"

1. Acesse: https://aistudio.google.com/app/apikey
2. Crie uma nova API key
3. Configure no arquivo `.env`

### ❌ Erro: "PDF não pôde ser gerado"

```bash
# Instale o puppeteer se não estiver disponível
npm install puppeteer
```

### ❌ Erro: "MinIO não disponível"

- O MinIO é opcional - o sistema continuará funcionando salvando arquivos localmente
- Para usar MinIO, certifique-se de que o servidor esteja rodando

### ❌ Erro: "Timeout na navegação"

- Verifique a conectividade de rede
- Aumente o timeout no `.env`: `EXECUTION_TIMEOUT=60`

## 📈 Estatísticas de Exemplo

Após uma execução típica:

```
✅ PIPELINE EXECUTADO COM SUCESSO!
⏱️  Tempo Total: 45.67s
📊 Páginas Processadas: 3
🔍 Elementos Analisados: 22
📸 Screenshots: 25
📝 Palavras no Manual: 1,847
```

## 🛠️ Desenvolvimento

### Estrutura do Código

```
agente_multi/
├── agents/                    # Agentes especializados
│   ├── LoginAgent.ts
│   ├── CrawlerAgent.ts
│   ├── AnalysisAgent.ts
│   ├── ContentAgent.ts
│   ├── GeneratorAgent.ts
│   └── OrchestratorAgent.ts
├── core/                      # Framework AgnoS
│   └── AgnoSCore.ts
├── services/                  # Serviços auxiliares
│   └── MinIOService.ts
└── main.ts                    # Ponto de entrada
```

### Extensibilidade

O sistema é projetado para ser extensível:

- **Novos Agentes**: Herde de `BaseAgent`
- **Novos Formatos**: Estenda `GeneratorAgent`
- **Novos Serviços**: Implemente interfaces padronizadas

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- **Issues**: Reporte problemas no GitHub
- **Documentação**: Consulte os comentários no código
- **Exemplos**: Verifique os arquivos de teste

## 🎯 Roadmap

- [ ] Suporte a mais formatos de saída
- [ ] Interface web para execução
- [ ] Integração com mais provedores de IA
- [ ] Suporte a autenticação OAuth2
- [ ] Cache inteligente de resultados
- [ ] Modo batch para múltiplas URLs

---

**Desenvolvido com ❤️ usando TypeScript, Playwright, Google Gemini AI e Framework AgnoS**
