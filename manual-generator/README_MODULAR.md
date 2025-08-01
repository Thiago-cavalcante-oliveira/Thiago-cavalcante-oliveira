# Manual Generator - Arquitetura Modular

## 📁 Estrutura do Projeto

```
manual-generator/
├── src/                          # Código fonte modular
│   ├── config/                   # Configurações e constantes
│   │   └── index.ts             # Configurações centralizadas
│   ├── services/                 # Serviços externos
│   │   ├── gemini.ts            # Serviço de análise com IA
│   │   └── playwright.ts        # Serviço de automação web
│   ├── core/                     # Lógica principal do negócio
│   │   └── ManualGenerator.ts   # Orquestração principal
│   ├── utils/                    # Funções utilitárias
│   │   └── index.ts             # Utilitários diversos
│   └── types/                    # Definições de tipos
│       └── index.ts             # Interfaces TypeScript
├── scripts/                      # Scripts legados (manter compatibilidade)
│   ├── generateManual.ts        # Versão monolítica original
│   ├── generatePDF.ts           # Gerador de PDF
│   └── pdfCli.ts               # CLI para PDF
├── generateManualNew.ts         # Nova versão modular
├── output/                      # Arquivos gerados
└── pdfoutput/                   # PDFs gerados
```

## 🏗️ Arquitetura

### **Princípios de Design**

1. **Separação de Responsabilidades** - Cada módulo tem uma responsabilidade específica
2. **Baixo Acoplamento** - Módulos independentes que se comunicam via interfaces
3. **Alta Coesão** - Funcionalidades relacionadas agrupadas
4. **Reutilização** - Serviços e utilitários podem ser usados em diferentes contextos
5. **Testabilidade** - Estrutura facilita testes unitários e de integração

### **Camadas da Aplicação**

#### 🔧 **Config Layer** (`src/config/`)
- Centraliza todas as configurações
- Validação de variáveis de ambiente
- Constantes do sistema
- Estratégias de navegação e seletores

#### 🌐 **Services Layer** (`src/services/`)
- **GeminiService**: Abstrai comunicação com API do Google Gemini
  - Sistema de retry com backoff exponencial
  - Tratamento de rate limiting
  - Análise de conteúdo web
- **PlaywrightService**: Abstrai automação web
  - Navegação robusta com múltiplas estratégias
  - Detecção de elementos interativos
  - Captura de screenshots
  - Interação com elementos

#### 🧠 **Core Layer** (`src/core/`)
- **ManualGenerator**: Orquestração principal
  - Coordena serviços
  - Implementa fluxo de negócio
  - Gera estrutura final do manual

#### 🛠️ **Utils Layer** (`src/utils/`)
- **FileUtils**: Manipulação de arquivos
- **UrlUtils**: Validação e sanitização de URLs
- **TimeUtils**: Utilitários de tempo
- **LogUtils**: Sistema de logging padronizado

#### 📝 **Types Layer** (`src/types/`)
- Interfaces TypeScript
- Definições de contratos entre módulos
- Tipos de dados compartilhados

## 🚀 Comandos Disponíveis

### **Versão Original (Monolítica)**
```bash
npm run generate <URL>      # Gera manual com código original
npm run pdf                 # Gera PDF
npm run full <URL>          # Manual + PDF (versão original)
```

### **Versão Modular (Nova)**
```bash
npm run generate:new <URL>  # Gera manual com arquitetura modular
npm run full:new <URL>      # Manual + PDF (versão modular)
```

### **Exemplo de Uso**
```bash
# Usando nova arquitetura
npm run generate:new "https://www.google.com"

# Gerando PDF
npm run pdf

# Fluxo completo
npm run full:new "https://www.google.com"
```

## 🔄 Benefícios da Refatoração

### **Manutenibilidade**
- ✅ Código organizado por responsabilidade
- ✅ Fácil localização de funcionalidades
- ✅ Modificações isoladas em módulos específicos
- ✅ Menos acoplamento entre componentes

### **Extensibilidade**
- ✅ Novos serviços facilmente adicionados
- ✅ Configurações centralizadas
- ✅ Interfaces bem definidas
- ✅ Suporte a diferentes estratégias

### **Testabilidade**
- ✅ Módulos independentes
- ✅ Mocking simplificado
- ✅ Testes unitários por camada
- ✅ Validação isolada de funcionalidades

### **Robustez**
- ✅ Tratamento de erro centralizado
- ✅ Sistema de retry configurável
- ✅ Logging estruturado
- ✅ Validações padronizadas

## 🧪 Comparação de Versões

| Aspecto | Versão Original | Versão Modular |
|---------|----------------|----------------|
| **Linhas de código** | ~500 linhas em 1 arquivo | ~200-300 linhas distribuídas |
| **Responsabilidades** | Todas misturadas | Separadas por módulo |
| **Configuração** | Hardcoded no código | Centralizada em config/ |
| **Reutilização** | Baixa | Alta |
| **Testes** | Difícil | Facilitado |
| **Debugging** | Complexo | Simplificado |
| **Extensão** | Modificar arquivo grande | Adicionar novos módulos |

## 🔍 Análise de Impacto

### **Mantendo Compatibilidade**
- Scripts originais preservados para compatibilidade
- Mesma API externa (argumentos de linha de comando)
- Mesma estrutura de saída (markdown + screenshots)
- Performance similar ou melhor

### **Facilidade de Manutenção**
- Bug fixes isolados por responsabilidade
- Adição de features sem afetar código existente
- Configurações modificáveis sem rebuild
- Logs mais informativos e estruturados

### **Próximos Passos Sugeridos**
1. **Testes Unitários**: Adicionar testes para cada módulo
2. **Documentação API**: Documentar interfaces públicas
3. **Configuração Externa**: Mover configs para arquivos externos
4. **Pipeline CI/CD**: Integração contínua com testes
5. **Métricas**: Adicionar telemetria e métricas de performance

---

**Migração recomendada**: Use `npm run generate:new` para novos projetos e `npm run generate` para manter compatibilidade com scripts existentes.
