# Manual Generator - Sistema Multi-Agente

## 📋 Descrição

O Manual Generator é um sistema multi-agente avançado que automatiza a geração de manuais técnicos através de web crawling inteligente e processamento de IA. O sistema utiliza múltiplos agentes especializados para realizar login automático, navegação web, análise de conteúdo e geração de documentação em diversos formatos.

## 🏗️ Arquitetura do Sistema

### Agentes Principais

- **OrchestratorAgent**: Coordena todo o pipeline de execução
- **LoginAgent**: Realiza autenticação em sites web
- **SmartLoginAgent**: Sistema de login inteligente com fallback
- **CrawlerAgent**: Navega e extrai conteúdo de páginas web
- **MenuModalAgent**: Detecta e interage com menus e modais
- **AnalysisAgent**: Analisa e estrutura o conteúdo extraído
- **ContentAgent**: Gera conteúdo amigável ao usuário
- **GeneratorAgent**: Produz documentos finais em múltiplos formatos
- **ScreenshotAgent**: Captura screenshots durante o processo

### Serviços de Apoio

- **LLMRouter**: Roteamento inteligente entre provedores de IA (Gemini, Groq)
- **PromptInspector**: Análise e otimização de prompts
- **ArtifactStore**: Gerenciamento de artefatos com metadados
- **Timeline**: Rastreamento temporal de execuções
- **MinIOService**: Armazenamento de arquivos em nuvem
- **GeminiKeyManager**: Gerenciamento de chaves API com rotação
- **GroqKeyManager**: Gerenciamento de chaves Groq

## 🔧 Dependências

### Dependências Principais

```json
{
  "@google/generative-ai": "^0.2.0",
  "dotenv": "^16.3.0",
  "groq-sdk": "^0.3.0",
  "marked": "^9.0.0",
  "minio": "^7.1.0",
  "pdf-lib": "^1.17.1",
  "pino": "^9.9.0",
  "playwright": "^1.40.0",
  "puppeteer": "^21.0.0",
  "zod": "^4.0.17"
}
```

### Dependências de Desenvolvimento

```json
{
  "@types/node": "^20.0.0",
  "tsx": "^4.0.0",
  "typescript": "^5.0.0"
}
```

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```env
# Configurações do Gemini AI (Obrigatório)
GOOGLE_API_KEY=sua_chave_api_do_gemini_aqui

# Sistema de Rotação de Chaves Gemini (Opcional)
GEMINI_API_KEY_1=sua_primeira_chave
GEMINI_API_KEY_2=sua_segunda_chave
GEMINI_API_KEY_3=sua_terceira_chave

# Configurações de Retry
GEMINI_MAX_RETRIES=5
GEMINI_BASE_WAIT_TIME=1000
GEMINI_MAX_WAIT_TIME=30000

# Configurações do MinIO (Opcional)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minio_access_key
MINIO_SECRET_KEY=minio_secret_key
MINIO_BUCKET_NAME=web-manuals

# Configurações do Groq (Opcional)
GROQ_API_KEY=sua_chave_groq

# Configurações do Firecrawl (Opcional)
FIRECRAWL_API_KEY=sua_chave_firecrawl
```

## 🚀 Instalação e Execução

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Chave API do Google Gemini

### Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd manual-generator

# Instale as dependências
cd agente_multi
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas chaves API

# Compile o TypeScript
npm run build
```

### Execução

```bash
# Execução principal
npm start

# Modo desenvolvimento (com watch)
npm run dev

# Executar orquestrador
npm run orchestrator

# Executar apenas login
npm run orchestrator:login
```

### Testes

```bash
# Teste básico
npm test

# Teste do crawler
npm run test:crawler

# Teste completo com login
npm run test:full

# Teste do orquestrador
npm run test:orchestrator
```

## 📖 Regras de Negócio

### 1. Sistema de Login Inteligente

- **Detecção Automática**: O sistema detecta automaticamente se um site requer login
- **Fallback Duplo**: Utiliza LoginAgent primeiro, depois SmartLoginAgent como fallback
- **Credenciais Opcionais**: Se não fornecidas, o sistema pula a etapa de login
- **Suporte a Múltiplos Métodos**: Formulários padrão, OAuth, autenticação customizada

### 2. Estratégias de Crawling

- **Básica**: Navegação simples por páginas principais
- **Avançada**: Exploração profunda com detecção de menus e modais
- **Adaptativa**: Ajusta estratégia baseada no tipo de site detectado
- **Respeitosa**: Implementa delays e limites para não sobrecarregar servidores

### 3. Processamento de Conteúdo

- **Análise Estrutural**: Identifica hierarquia e relacionamentos entre elementos
- **Filtragem Inteligente**: Remove conteúdo irrelevante (ads, navegação, etc.)
- **Enriquecimento**: Adiciona contexto e explicações baseadas em IA
- **Validação**: Verifica qualidade e completude do conteúdo extraído

### 4. Geração de Documentos

- **Múltiplos Formatos**: Markdown, HTML, PDF
- **Templates Customizáveis**: Estruturas predefinidas adaptáveis
- **Metadados Ricos**: Informações de origem, data, versão
- **Versionamento**: Controle de versões automático

### 5. Tolerância a Falhas

- **Circuit Breaker**: Proteção contra falhas em cascata
- **Retry Automático**: Tentativas com backoff exponencial
- **Fallback de Provedores**: Troca automática entre APIs de IA
- **Recuperação Graceful**: Continua execução mesmo com falhas parciais

### 6. Monitoramento e Observabilidade

- **Logging Estruturado**: Logs detalhados com níveis apropriados
- **Métricas de Performance**: Tempo de execução, taxa de sucesso
- **Timeline de Execução**: Rastreamento temporal detalhado
- **Relatórios Automáticos**: Geração de relatórios de execução

## 🎯 Casos de Uso

### 1. Geração de Manual de Sistema Web

```bash
npm run orchestrator -- --url https://sistema.exemplo.com --login usuario --password senha
```

### 2. Documentação de API Pública

```bash
npm run orchestrator -- --url https://api.exemplo.com/docs
```

### 3. Manual de Processo Interno

```bash
npm run orchestrator -- --url https://intranet.empresa.com/processo --screenshots true
```

## 📊 Capacidades e Limites

### Quotas de API (Configuração Padrão)

- **Gemini API**: 50 requests/dia por chave (até 3 chaves = 150 total)
- **Groq API**: Conforme plano contratado
- **Estimativa de Manuais**:
  - Pequenos (1-5 páginas): 8-12 manuais/dia
  - Médios (5-15 páginas): 4-6 manuais/dia
  - Grandes (15+ páginas): 2-3 manuais/dia

### Limitações Técnicas

- **JavaScript Pesado**: Sites com muito JS podem ter extração limitada
- **Autenticação Complexa**: OAuth e 2FA podem requerer configuração manual
- **Conteúdo Dinâmico**: Elementos carregados via AJAX podem não ser capturados
- **Rate Limiting**: Respeita limites dos sites para evitar bloqueios

## 🔒 Segurança

- **Credenciais Seguras**: Armazenamento em variáveis de ambiente
- **Sanitização**: Limpeza de dados de entrada e saída
- **Isolamento**: Execução em contextos isolados do navegador
- **Auditoria**: Logs detalhados de todas as operações

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

**Thiago Cavalcante Oliveira**

## 🆘 Suporte

Para suporte e dúvidas:

1. Verifique a documentação existente
2. Consulte os logs de execução
3. Abra uma issue no repositório
4. Entre em contato com o desenvolvedor

---

*Sistema Multi-Agente para Geração Automática de Manuais - v2.0*
