# Guia de Contribuição - Manual Generator

Obrigado por considerar contribuir com o Manual Generator! Este documento fornece diretrizes para contribuições efetivas.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Padrões de Desenvolvimento](#padrões-de-desenvolvimento)
- [Processo de Pull Request](#processo-de-pull-request)
- [Reportando Bugs](#reportando-bugs)
- [Sugerindo Melhorias](#sugerindo-melhorias)
- [Documentação](#documentação)
- [Testes](#testes)
- [Estilo de Código](#estilo-de-código)

## 🤝 Código de Conduta

Este projeto adere ao [Contributor Covenant](https://www.contributor-covenant.org/). Ao participar, você deve seguir este código de conduta.

### Nossos Compromissos

- **Respeito**: Tratar todos com respeito e dignidade
- **Inclusão**: Criar um ambiente acolhedor para todos
- **Colaboração**: Trabalhar juntos de forma construtiva
- **Profissionalismo**: Manter padrões profissionais

## 🚀 Como Contribuir

### Tipos de Contribuição

1. **🐛 Correção de Bugs**
   - Identifique e corrija problemas existentes
   - Adicione testes para prevenir regressões

2. **✨ Novas Funcionalidades**
   - Implemente funcionalidades solicitadas
   - Proponha e desenvolva melhorias

3. **📚 Documentação**
   - Melhore documentação existente
   - Adicione exemplos e tutoriais

4. **🧪 Testes**
   - Adicione cobertura de testes
   - Melhore testes existentes

5. **🔧 Refatoração**
   - Melhore qualidade do código
   - Otimize performance

## 🛠️ Configuração do Ambiente

### Pré-requisitos

```bash
# Node.js (versão 18 ou superior)
node --version  # v18.0.0+

# npm (versão 8 ou superior)
npm --version   # v8.0.0+

# Git
git --version
```

### Setup Inicial

```bash
# 1. Fork o repositório no GitHub
# 2. Clone seu fork
git clone https://github.com/SEU_USUARIO/manual-generator.git
cd manual-generator

# 3. Adicione o repositório original como upstream
git remote add upstream https://github.com/ORIGINAL_OWNER/manual-generator.git

# 4. Instale dependências
npm install

# 5. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações

# 6. Execute testes para verificar setup
npm test
```

### Configuração de Desenvolvimento

```bash
# Instale ferramentas de desenvolvimento
npm install -g typescript ts-node

# Configure hooks de pre-commit
npm run prepare

# Execute em modo de desenvolvimento
npm run dev
```

## 📏 Padrões de Desenvolvimento

### Estrutura do Projeto

```
manual-generator/
├── src/
│   ├── agents/           # Agentes do sistema
│   ├── services/         # Serviços de suporte
│   ├── interfaces/       # Interfaces TypeScript
│   ├── types/           # Tipos TypeScript
│   ├── utils/           # Utilitários
│   └── main.ts          # Ponto de entrada
├── tests/               # Testes
├── docs/                # Documentação
├── examples/            # Exemplos de uso
└── scripts/             # Scripts de build/deploy
```

### Convenções de Nomenclatura

```typescript
// Classes: PascalCase
class OrchestratorAgent {}

// Interfaces: PascalCase com 'I' prefix (opcional)
interface IConfiguration {}
interface Configuration {}  // Preferido

// Funções e variáveis: camelCase
const userName = 'john';
function processData() {}

// Constantes: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;

// Arquivos: kebab-case
// orchestrator-agent.ts
// content-analyzer.ts
```

### Padrões de Código

#### 1. Estrutura de Classes

```typescript
export class ExampleAgent {
  // Propriedades privadas primeiro
  private readonly config: Configuration;
  private cache: Map<string, any>;
  
  // Propriedades públicas
  public readonly name: string;
  
  // Constructor
  constructor(config: Configuration) {
    this.config = config;
    this.cache = new Map();
    this.name = 'ExampleAgent';
  }
  
  // Métodos públicos
  public async execute(): Promise<Result> {
    // Implementação
  }
  
  // Métodos privados
  private validateInput(input: any): boolean {
    // Implementação
  }
}
```

#### 2. Tratamento de Erros

```typescript
// Use classes de erro específicas
export class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Tratamento robusto
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  if (error instanceof ValidationError) {
    logger.warn(`Validation failed for field: ${error.field}`);
    throw error;
  }
  
  logger.error('Unexpected error:', error);
  throw new Error('Operation failed');
}
```

#### 3. Logging

```typescript
import { Logger } from '../utils/logger';

class ExampleService {
  private logger = new Logger('ExampleService');
  
  async processData(data: any) {
    this.logger.info('Starting data processing', { dataSize: data.length });
    
    try {
      const result = await this.transform(data);
      this.logger.info('Data processing completed', { resultSize: result.length });
      return result;
    } catch (error) {
      this.logger.error('Data processing failed', { error: error.message });
      throw error;
    }
  }
}
```

#### 4. Configuração e Validação

```typescript
import Joi from 'joi';

// Schema de validação
const configSchema = Joi.object({
  apiKey: Joi.string().required(),
  timeout: Joi.number().min(1000).default(30000),
  retries: Joi.number().min(0).max(10).default(3)
});

// Validação
export function validateConfig(config: any): Configuration {
  const { error, value } = configSchema.validate(config);
  
  if (error) {
    throw new ValidationError(`Invalid configuration: ${error.message}`);
  }
  
  return value;
}
```

## 🔄 Processo de Pull Request

### 1. Preparação

```bash
# Sincronize com upstream
git fetch upstream
git checkout main
git merge upstream/main

# Crie branch para sua feature
git checkout -b feature/nome-da-feature
# ou
git checkout -b fix/nome-do-bug
```

### 2. Desenvolvimento

```bash
# Faça suas mudanças
# Adicione testes
# Execute testes
npm test

# Execute linting
npm run lint

# Execute type checking
npm run type-check

# Execute build
npm run build
```

### 3. Commit

```bash
# Use conventional commits
git add .
git commit -m "feat: adiciona nova funcionalidade X"
# ou
git commit -m "fix: corrige problema Y"
# ou
git commit -m "docs: atualiza documentação Z"
```

#### Tipos de Commit

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Mudanças na documentação
- `style`: Mudanças de formatação
- `refactor`: Refatoração de código
- `test`: Adição ou modificação de testes
- `chore`: Mudanças em ferramentas/configuração

### 4. Pull Request

```bash
# Push para seu fork
git push origin feature/nome-da-feature

# Crie PR no GitHub
# Use o template de PR
```

#### Template de PR

```markdown
## Descrição
Descreva brevemente as mudanças realizadas.

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova funcionalidade
- [ ] Breaking change
- [ ] Documentação

## Como Testar
1. Passo 1
2. Passo 2
3. Passo 3

## Checklist
- [ ] Testes passando
- [ ] Lint passando
- [ ] Documentação atualizada
- [ ] Changelog atualizado (se necessário)

## Screenshots (se aplicável)

## Issues Relacionadas
Fixes #123
```

## 🐛 Reportando Bugs

### Template de Bug Report

```markdown
**Descrição do Bug**
Descrição clara e concisa do problema.

**Passos para Reproduzir**
1. Vá para '...'
2. Clique em '....'
3. Role para baixo até '....'
4. Veja o erro

**Comportamento Esperado**
Descrição do que deveria acontecer.

**Screenshots**
Se aplicável, adicione screenshots.

**Ambiente:**
 - OS: [e.g. Ubuntu 20.04]
 - Node.js: [e.g. 18.0.0]
 - Versão: [e.g. 2.0.0]

**Contexto Adicional**
Qualquer outra informação relevante.
```

### Informações Úteis

```bash
# Colete informações do sistema
node --version
npm --version
uname -a

# Logs relevantes
tail -100 logs/manual-generator.log

# Configuração (sem credenciais)
env | grep -E "(LOG|DEBUG)" | head -10
```

## 💡 Sugerindo Melhorias

### Template de Feature Request

```markdown
**Problema Relacionado**
Descreva o problema que esta feature resolveria.

**Solução Proposta**
Descrição clara da solução desejada.

**Alternativas Consideradas**
Outras soluções que você considerou.

**Contexto Adicional**
Qualquer outra informação relevante.
```

## 📚 Documentação

### Padrões de Documentação

```typescript
/**
 * Processa dados de entrada e retorna resultado transformado.
 * 
 * @param data - Dados de entrada para processamento
 * @param options - Opções de configuração
 * @returns Promise que resolve para dados processados
 * 
 * @example
 * ```typescript
 * const result = await processData(
 *   { items: [1, 2, 3] },
 *   { transform: 'uppercase' }
 * );
 * ```
 * 
 * @throws {ValidationError} Quando dados de entrada são inválidos
 * @throws {ProcessingError} Quando processamento falha
 */
export async function processData(
  data: InputData,
  options: ProcessingOptions
): Promise<ProcessedData> {
  // Implementação
}
```

### Atualizando Documentação

```bash
# Gere documentação da API
npm run docs:generate

# Visualize documentação localmente
npm run docs:serve

# Valide links na documentação
npm run docs:validate
```

## 🧪 Testes

### Estrutura de Testes

```
tests/
├── unit/              # Testes unitários
├── integration/       # Testes de integração
├── e2e/              # Testes end-to-end
├── fixtures/         # Dados de teste
└── helpers/          # Utilitários de teste
```

### Padrões de Teste

```typescript
// unit/agents/orchestrator-agent.test.ts
import { OrchestratorAgent } from '../../src/agents/orchestrator-agent';
import { mockConfig } from '../helpers/mock-config';

describe('OrchestratorAgent', () => {
  let agent: OrchestratorAgent;
  
  beforeEach(() => {
    agent = new OrchestratorAgent(mockConfig);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('execute', () => {
    it('should process valid input successfully', async () => {
      // Arrange
      const input = { url: 'https://example.com' };
      
      // Act
      const result = await agent.execute(input);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
    
    it('should handle invalid input gracefully', async () => {
      // Arrange
      const input = { url: 'invalid-url' };
      
      // Act & Assert
      await expect(agent.execute(input))
        .rejects
        .toThrow('Invalid URL format');
    });
  });
});
```

### Executando Testes

```bash
# Todos os testes
npm test

# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Testes e2e
npm run test:e2e

# Cobertura
npm run test:coverage

# Watch mode
npm run test:watch
```

### Cobertura de Testes

- **Mínimo**: 80% de cobertura geral
- **Crítico**: 95% para código crítico
- **Novo código**: 90% de cobertura

## 🎨 Estilo de Código

### ESLint e Prettier

```bash
# Verificar estilo
npm run lint

# Corrigir automaticamente
npm run lint:fix

# Formatar código
npm run format
```

### Configuração do Editor

#### VS Code (.vscode/settings.json)

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true
  }
}
```

### Padrões de Import

```typescript
// 1. Node.js modules
import fs from 'fs';
import path from 'path';

// 2. External libraries
import express from 'express';
import { Logger } from 'winston';

// 3. Internal modules (absolute paths)
import { OrchestratorAgent } from '@/agents/orchestrator-agent';
import { Configuration } from '@/types/configuration';

// 4. Relative imports
import { helper } from './helper';
import { utils } from '../utils';
```

## 🏷️ Versionamento

Seguimos [Semantic Versioning](https://semver.org/):

- **MAJOR**: Mudanças incompatíveis
- **MINOR**: Novas funcionalidades compatíveis
- **PATCH**: Correções de bugs compatíveis

### Release Process

```bash
# Prepare release
npm run release:prepare

# Create release
npm run release:create

# Publish release
npm run release:publish
```

## 🤔 Dúvidas?

- **Issues**: Para bugs e feature requests
- **Discussions**: Para perguntas gerais
- **Email**: Para questões sensíveis
- **Documentation**: README.md e TECHNICAL_GUIDE.md

## 🙏 Reconhecimento

Todos os contribuidores são reconhecidos no arquivo [CONTRIBUTORS.md](CONTRIBUTORS.md).

---

**Obrigado por contribuir com o Manual Generator!** 🚀

*Guia de Contribuição - Manual Generator v2.0*