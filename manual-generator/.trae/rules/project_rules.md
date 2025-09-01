Regras e Requisitos do Projeto: Manual Generator
1. Visão Geral e Princípios Fundamentais
Este documento é a fonte única e obrigatória de verdade para todas as decisões técnicas, padrões de código e protocolos de arquitetura do projeto Manual Generator. O seu objetivo é garantir a consistência, qualidade e manutenibilidade do sistema.

Os princípios que guiam este projeto são:

Resiliência acima de tudo: A nossa automação deve ser capaz de lidar com as variações e a natureza dinâmica da web moderna. Scripts instáveis ("flaky") não são aceitáveis.

Inteligência, não força bruta: Priorizamos a análise inteligente do DOM e a inferência de funcionalidades em vez de depender de seletores frágeis e regras hard-coded.

Modularidade e Clareza: Cada componente do sistema (agente, serviço) deve ter uma responsabilidade única e bem definida. O código deve ser legível e autoexplicativo.

Testabilidade Intrínseca: A arquitetura deve facilitar a criação de testes unitários e de integração, permitindo validar cada parte do sistema de forma isolada e conjunta.

2. Estrutura do Projeto
A organização dos ficheiros e diretórios deve seguir rigorosamente esta estrutura para manter a ordem e a clareza.

/
|-- src/
|   |-- agents/         # Implementação de cada agente (LoginAgent, CrawlerAgent, etc.)
|   |-- services/       # Clientes para serviços externos (MinIO, LLMs, etc.)
|   |-- core/           # O framework AgnoSCore e as classes base
|   |-- config/         # Configurações da aplicação, como estratégias de deteção
|   |-- pipelines/      # Orquestração e definição dos fluxos de execução
|   |-- types/          # Interfaces e tipos globais do TypeScript
|   |-- utils/          # Funções utilitárias puras e reutilizáveis
|   |-- index.ts        # Ponto de entrada principal da aplicação
|
|-- tests/
|   |-- unit/           # Testes unitários, focados em agentes e serviços isolados
|   |-- integration/    # Testes que validam a interação entre múltiplos componentes
|   |-- e2e/            # Testes ponta a ponta que simulam um fluxo de utilizador completo
|   |-- fixtures/       # Dados mockados, como HTMLs de exemplo ou respostas de API
|   |-- state/          # Armazena o estado de sessões autenticadas para reutilização
|
|-- .env                # Ficheiro local com segredos e variáveis de ambiente (NÃO versionado)
|-- .env.example        # Exemplo de como o ficheiro .env deve ser estruturado
|-- package.json
|-- tsconfig.json

3. Padrões de Código e Convenções
Linguagem: Todo o código deve ser escrito em TypeScript.

Formatação: O projeto utiliza Prettier para formatação automática e ESLint para análise estática de código. Nenhum código deve ser "commitado" sem passar por estas ferramentas.

Nomenclatura:

Classes e Interfaces: PascalCase (ex: CrawlerAgent, AgentConfig).

Variáveis e Funções: camelCase (ex: fetchPageContent, mainUrl).

Ficheiros de Teste: [nome-do-componente].test.ts (unitário) ou [fluxo].spec.ts (integração/e2e).

Comentários: Comente o "porquê", não o "o quê". O código deve ser claro o suficiente para explicar o que faz. Use comentários para explicar decisões complexas, lógicas de negócio ou workarounds.

4. Arquitetura dos Agentes (AgnoSCore)
Herança: Todo o agente DEVE herdar da classe BaseAgent do AgnoSCore.

Interfaces de Dados:

A entrada de dados de um agente deve ser definida numa interface que estende TaskData (ex: CrawlTaskData).

A saída de dados de um agente deve ser definida numa interface que estende TaskResult (ex: CrawlTaskResult).

Estas interfaces garantem um contrato claro entre os agentes no pipeline.

Estado: Agentes devem ser, sempre que possível, sem estado (stateless). Toda a informação necessária para a sua execução deve vir da TaskData. Eles não devem manter estado interno entre execuções.

Configuração: A configuração de um agente é injetada através do construtor, utilizando uma interface que estende AgentConfig.

5. Protocolos de Interação Web (Playwright)
Estas são as regras mais críticas do projeto para garantir a resiliência do scraping.

Proibição de Seletores Frágeis: É ESTRITAMENTE PROIBIDO depender de seletores de CSS gerados dinamicamente (ex: css=.sc-a1b2c3d4-0) ou de seletores de XPath baseados na posição absoluta.

Hierarquia de Seletores (Ordem de Prioridade): Ao selecionar um elemento, a busca deve seguir esta ordem de preferência:

Atributos de Teste: page.getByTestId('id-de-teste').

Roles ARIA e Atributos de Acessibilidade: page.getByRole('button', { name: 'Enviar' }). Esta é a forma preferencial, pois simula como um utilizador real ou uma tecnologia assistiva interage com a página.

Texto Visível: page.getByText('Fazer Login').

HTML Semântico e Atributos Estáveis: page.locator('nav button.primary').

Uso Obrigatório de Locators: Utilize sempre page.locator() ou os métodos getBy...() para criar referências a elementos. Métodos legados como page.$() ou page.$$() NÃO DEVEM ser usados. Locators são a base da funcionalidade de auto-espera do Playwright.

Estratégias de Espera:

Proibição de Esperas Fixas: page.waitForTimeout() é PROIBIDO no código final. Ele é um sintoma de um teste instável e só deve ser usado para depuração local.

Ações e Asserções Web-First: Confie nas esperas automáticas do Playwright. Uma ação como locator.click() já espera o elemento ser visível e clicável. Uma asserção como expect(locator).toBeVisible() também espera até que a condição seja verdadeira ou o tempo limite seja atingido.

6. Estratégia de Testes
Testes Unitários (/unit):

Devem testar uma única unidade (um agente, um serviço) de forma isolada.

NÃO devem fazer chamadas de rede reais (HTTP, DB). Use mocks para simular dependências externas.

Exemplo: Testar o AnalysisAgent fornecendo um HTML mockado (fixture) e validando a estrutura de dados de saída.

Testes de Integração (/integration):

Validam a interação entre dois ou mais componentes.

Podem realizar chamadas de rede controladas para um ambiente de teste.

Exemplo: Testar se o LoginAgent e o CrawlerAgent funcionam juntos para extrair dados de uma página autenticada.

Testes de Ponta a Ponta (/e2e):

Simulam um fluxo de utilizador completo, do início ao fim.

Reutilização de Estado de Autenticação: Um teste de login bem-sucedido DEVE exportar o seu estado de autenticação (context.storageState()) para um ficheiro em tests/state/. Os testes subsequentes que requerem autenticação DEVEM importar este estado (browser.newContext({ storageState: '...' })) em vez de fazer login novamente. Isso torna a suíte de testes drasticamente mais rápida e mais estável.

7. Gerenciamento de Configuração e Segredos
Variáveis de Ambiente: Todas as configurações que variam entre ambientes (local, teste, produção) e todos os segredos (chaves de API, senhas) DEVEM ser geridas através de variáveis de ambiente.

Ficheiro .env: O ficheiro .env é para uso exclusivamente local e NUNCA deve ser versionado no Git.

Validação de Configuração: Recomenda-se o uso de uma biblioteca como o Zod para validar as variáveis de ambiente na inicialização da aplicação, garantindo que todas as configurações necessárias estão presentes e corretas.