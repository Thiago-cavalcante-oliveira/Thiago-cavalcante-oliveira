# Relatório Super Completo - Crawling Agressivo de Todas as Páginas

## 📋 Informações Gerais

- **Data/Hora**: 2025-08-19T12:09:01.062Z
- **URL Base**: https://saeb-h1.pmfi.pr.gov.br/auth/signin
- **Credenciais**: admin/admin123
- **Tipo de Teste**: crawling_completo_todas_paginas_agressivo
- **Modo Agressivo**: ATIVADO
- **Configurações**:
  - Máximo de páginas: 500
  - Profundidade máxima: 10
  - Timeout: 45000ms
  - Clicar todos os botões: true
  - Explorar todos os menus: true
  - Seguir todos os links: true
  - Tentativas de retry: 3

## 📊 Resumo Executivo Super Detalhado

- **Total de Páginas Analisadas**: 2
- **Total de URLs Visitadas**: 2
- **Total de Itens de Menu**: 0
- **Total de Links**: 5
- **Total de Formulários**: 1
- **Total de Tabelas**: 0
- **Total de Elementos de Ação**: 2
- **Total de Rotas Descobertas**: 7
- **Total de Cliques Realizados**: 1
- **Total de Tentativas Falhadas**: 1
- **Total de Conteúdo Dinâmico**: 3
- **Screenshots Capturados**: 3
- **Interações do Usuário**: 0

## 🔑 Processo de Login

### Tentativa 1

- **URL**: [https://saeb-h1.pmfi.pr.gov.br/auth/signin](https://saeb-h1.pmfi.pr.gov.br/auth/signin)
- **Título**: Next.js
- **Timestamp**: 2025-08-19T12:09:04.509Z

## 🌐 URLs Visitadas

1. [https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/protocol/openid-connect/auth?client_id=ideb-app&scope=openid%20email%20profile&response_type=code&redirect_uri=https%3A%2F%2Fsaeb-h1.pmfi.pr.gov.br%2Fapi%2Fauth%2Fcallback%2Fkeycloak&state=izjRmOogOLaxanwCUMbVschh1j9eM6HUAEQsLp3Jj74&code_challenge=QWdf7zX7Up4wCq5kbXhLitbzqP5b1DP1utgqQDeQAUs&code_challenge_method=S256](https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/protocol/openid-connect/auth?client_id=ideb-app&scope=openid%20email%20profile&response_type=code&redirect_uri=https%3A%2F%2Fsaeb-h1.pmfi.pr.gov.br%2Fapi%2Fauth%2Fcallback%2Fkeycloak&state=izjRmOogOLaxanwCUMbVschh1j9eM6HUAEQsLp3Jj74&code_challenge=QWdf7zX7Up4wCq5kbXhLitbzqP5b1DP1utgqQDeQAUs&code_challenge_method=S256)
2. [https://keycloak.pmfi.pr.gov.br/resources/xptso/common/keycloak/vendor/patternfly-v5/patternfly.min.css](https://keycloak.pmfi.pr.gov.br/resources/xptso/common/keycloak/vendor/patternfly-v5/patternfly.min.css)

## 🗺️ Rotas Descobertas (7 total)

### LINK (5 encontrados)

1. **/resources/xptso/login/keycloak.v2/img/favicon.ico**
   - URL: `/resources/xptso/login/keycloak.v2/img/favicon.ico`
   - Seletor: `a:nth-of-type(1)`
   - Prioridade: 10

2. **/resources/xptso/common/keycloak/vendor/patternfly-v5/patternfly.min.css**
   - URL: `/resources/xptso/common/keycloak/vendor/patternfly-v5/patternfly.min.css`
   - Seletor: `a:nth-of-type(2)`
   - Prioridade: 10

3. **/resources/xptso/common/keycloak/vendor/patternfly-v5/patternfly-addons.css**
   - URL: `/resources/xptso/common/keycloak/vendor/patternfly-v5/patternfly-addons.css`
   - Seletor: `a:nth-of-type(3)`
   - Prioridade: 10

4. **/resources/xptso/login/keycloak.v2/css/styles.css**
   - URL: `/resources/xptso/login/keycloak.v2/css/styles.css`
   - Seletor: `a:nth-of-type(4)`
   - Prioridade: 10

5. **Forgot Password?**
   - URL: `/realms/ideb-realm/login-actions/reset-credentials?client_id=ideb-app&tab_id=y9QQZIh1YWc&client_data=eyJydSI6Imh0dHBzOi8vc2FlYi1oMS5wbWZpLnByLmdvdi5ici9hcGkvYXV0aC9jYWxsYmFjay9rZXljbG9hayIsInJ0IjoiY29kZSIsInN0IjoiaXpqUm1Pb2dPTGF4YW53Q1VNYlZzY2hoMWo5ZU02SFVBRVFzTHAzSmo3NCJ9`
   - Seletor: `a:nth-of-type(5)`
   - Prioridade: 10

### BUTTON (2 encontrados)

1. **Show password**
   - Seletor: `button:nth-of-type(1)`
   - Prioridade: 8

2. **Sign In**
   - Seletor: `#kc-login`
   - Prioridade: 8

## 📄 Análise Super Detalhada das Páginas

### 1. Sign in to IDEB App Realm (Profundidade 0)

- **URL**: [https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/protocol/openid-connect/auth?client_id=ideb-app&scope=openid%20email%20profile&response_type=code&redirect_uri=https%3A%2F%2Fsaeb-h1.pmfi.pr.gov.br%2Fapi%2Fauth%2Fcallback%2Fkeycloak&state=izjRmOogOLaxanwCUMbVschh1j9eM6HUAEQsLp3Jj74&code_challenge=QWdf7zX7Up4wCq5kbXhLitbzqP5b1DP1utgqQDeQAUs&code_challenge_method=S256](https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/protocol/openid-connect/auth?client_id=ideb-app&scope=openid%20email%20profile&response_type=code&redirect_uri=https%3A%2F%2Fsaeb-h1.pmfi.pr.gov.br%2Fapi%2Fauth%2Fcallback%2Fkeycloak&state=izjRmOogOLaxanwCUMbVschh1j9eM6HUAEQsLp3Jj74&code_challenge=QWdf7zX7Up4wCq5kbXhLitbzqP5b1DP1utgqQDeQAUs&code_challenge_method=S256)
- **Screenshot**: crawling-page-1-depth-0.png
- **Timestamp**: 2025-08-19T12:09:21.156Z

#### 📊 Estatísticas da Página

- **Menus**: 0
- **Links**: 5
- **Formulários**: 1
- **Tabelas**: 0
- **Ações**: 2
- **Rotas**: 7

#### 🔗 Links (5 encontrados)

1. **/resources/xptso/login/keycloak.v2/img/favicon.ico**
   - URL: `/resources/xptso/login/keycloak.v2/img/favicon.ico`
   - Externo: Não

2. **/resources/xptso/common/keycloak/vendor/patternfly-v5/patternfly.min.css**
   - URL: `/resources/xptso/common/keycloak/vendor/patternfly-v5/patternfly.min.css`
   - Externo: Não

3. **/resources/xptso/common/keycloak/vendor/patternfly-v5/patternfly-addons.css**
   - URL: `/resources/xptso/common/keycloak/vendor/patternfly-v5/patternfly-addons.css`
   - Externo: Não

4. **/resources/xptso/login/keycloak.v2/css/styles.css**
   - URL: `/resources/xptso/login/keycloak.v2/css/styles.css`
   - Externo: Não

5. **Forgot Password?**
   - URL: `/realms/ideb-realm/login-actions/reset-credentials?client_id=ideb-app&tab_id=y9QQZIh1YWc&client_data=eyJydSI6Imh0dHBzOi8vc2FlYi1oMS5wbWZpLnByLmdvdi5ici9hcGkvYXV0aC9jYWxsYmFjay9rZXljbG9hayIsInJ0IjoiY29kZSIsInN0IjoiaXpqUm1Pb2dPTGF4YW53Q1VNYlZzY2hoMWo5ZU02SFVBRVFzTHAzSmo3NCJ9`
   - Externo: Não

#### 📝 Formulários (1 encontrados)

1. **Formulário 1**
   - Ação: `https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/login-actions/authenticate?session_code=OsXte9_sLosnRuoaPGPbhsFbdBSnhVv4-D940W1X1n8&execution=47ecfa33-2e03-4463-b99f-2a949e36b775&client_id=ideb-app&tab_id=y9QQZIh1YWc&client_data=eyJydSI6Imh0dHBzOi8vc2FlYi1oMS5wbWZpLnByLmdvdi5ici9hcGkvYXV0aC9jYWxsYmFjay9rZXljbG9hayIsInJ0IjoiY29kZSIsInN0IjoiaXpqUm1Pb2dPTGF4YW53Q1VNYlZzY2hoMWo5ZU02SFVBRVFzTHAzSmo3NCJ9`
   - Método: `post`
   - Campos: 3

#### 🎯 Elementos de Ação (2 encontrados)

1. **Show password**
   - Tipo: `button`
   - Desabilitado: Não
   - Seletor: `button:nth-of-type(1)`

2. **Sign In**
   - Tipo: `submit`
   - Desabilitado: Não
   - Seletor: `#kc-login`

---

### 2.  (Profundidade 1)

- **URL**: [https://keycloak.pmfi.pr.gov.br/resources/xptso/common/keycloak/vendor/patternfly-v5/patternfly.min.css](https://keycloak.pmfi.pr.gov.br/resources/xptso/common/keycloak/vendor/patternfly-v5/patternfly.min.css)
- **Screenshot**: null
- **Timestamp**: 2025-08-19T12:10:54.390Z

#### 📊 Estatísticas da Página

- **Menus**: 0
- **Links**: 0
- **Formulários**: 0
- **Tabelas**: 0
- **Ações**: 0
- **Rotas**: 0

---

## 🔘 Cliques Realizados (1 total)

1. **Sign In**
   - Seletor: `#kc-login`
   - Tentativa: 1
   - Sucesso: Sim
   - Timestamp: 2025-08-19T12:09:25.878Z

## ❌ Tentativas Falhadas (6 total)

1. **Show password**
   - Seletor: `button:nth-of-type(1)`
   - Erro: locator.scrollIntoViewIfNeeded: Error: strict mode violation: locator('button:nth-of-type(1)') resolved to 2 elements:
    1) <button type="button" data-password-toggle="" aria-controls="password" aria-label="Show password" data-icon-show="fa-eye fas" data-label-show="Show password" data-label-hide="Hide password" data-icon-hide="fa-eye-slash fas" class="pf-v5-c-button pf-m-control">…</button> aka getByRole('button', { name: 'Show password' })
    2) <button name="login" id="kc-login" type="submit" class="pf-v5-c-button pf-m-primary pf-m-block ">Sign In</button> aka getByRole('button', { name: 'Sign In' })

Call log:
[2m  - waiting for locator('button:nth-of-type(1)')[22m

   - Timestamp: 2025-08-19T12:09:23.263Z

2. **https://keycloak.pmfi.pr.gov.br/resources/xptso/login/keycloak.v2/img/favicon.ico**
   - URL: `https://keycloak.pmfi.pr.gov.br/resources/xptso/login/keycloak.v2/img/favicon.ico`
   - Erro: page.goto: net::ERR_ABORTED at https://keycloak.pmfi.pr.gov.br/resources/xptso/login/keycloak.v2/img/favicon.ico
Call log:
[2m  - navigating to "https://keycloak.pmfi.pr.gov.br/resources/xptso/login/keycloak.v2/img/favicon.ico", waiting until "networkidle"[22m

   - Timestamp: 2025-08-19T12:09:30.891Z

3. **https://keycloak.pmfi.pr.gov.br/resources/xptso/common/keycloak/vendor/patternfly-v5/patternfly-addons.css**
   - URL: `https://keycloak.pmfi.pr.gov.br/resources/xptso/common/keycloak/vendor/patternfly-v5/patternfly-addons.css`
   - Erro: page.goto: Target page, context or browser has been closed
   - Timestamp: 2025-08-19T12:11:24.413Z

4. **https://keycloak.pmfi.pr.gov.br/resources/xptso/login/keycloak.v2/css/styles.css**
   - URL: `https://keycloak.pmfi.pr.gov.br/resources/xptso/login/keycloak.v2/css/styles.css`
   - Erro: page.goto: Target page, context or browser has been closed
   - Timestamp: 2025-08-19T12:11:24.414Z

5. **https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/login-actions/reset-credentials?client_id=ideb-app&tab_id=y9QQZIh1YWc&client_data=eyJydSI6Imh0dHBzOi8vc2FlYi1oMS5wbWZpLnByLmdvdi5ici9hcGkvYXV0aC9jYWxsYmFjay9rZXljbG9hayIsInJ0IjoiY29kZSIsInN0IjoiaXpqUm1Pb2dPTGF4YW53Q1VNYlZzY2hoMWo5ZU02SFVBRVFzTHAzSmo3NCJ9**
   - URL: `https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/login-actions/reset-credentials?client_id=ideb-app&tab_id=y9QQZIh1YWc&client_data=eyJydSI6Imh0dHBzOi8vc2FlYi1oMS5wbWZpLnByLmdvdi5ici9hcGkvYXV0aC9jYWxsYmFjay9rZXljbG9hayIsInJ0IjoiY29kZSIsInN0IjoiaXpqUm1Pb2dPTGF4YW53Q1VNYlZzY2hoMWo5ZU02SFVBRVFzTHAzSmo3NCJ9`
   - Erro: page.goto: Target page, context or browser has been closed
   - Timestamp: 2025-08-19T12:11:24.414Z

6. **https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/login-actions/authenticate?execution=47ecfa33-2e03-4463-b99f-2a949e36b775&client_id=ideb-app&tab_id=y9QQZIh1YWc&client_data=eyJydSI6Imh0dHBzOi8vc2FlYi1oMS5wbWZpLnByLmdvdi5ici9hcGkvYXV0aC9jYWxsYmFjay9rZXljbG9hayIsInJ0IjoiY29kZSIsInN0IjoiaXpqUm1Pb2dPTGF4YW53Q1VNYlZzY2hoMWo5ZU02SFVBRVFzTHAzSmo3NCJ9**
   - URL: `https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/login-actions/authenticate?execution=47ecfa33-2e03-4463-b99f-2a949e36b775&client_id=ideb-app&tab_id=y9QQZIh1YWc&client_data=eyJydSI6Imh0dHBzOi8vc2FlYi1oMS5wbWZpLnByLmdvdi5ici9hcGkvYXV0aC9jYWxsYmFjay9rZXljbG9hayIsInJ0IjoiY29kZSIsInN0IjoiaXpqUm1Pb2dPTGF4YW53Q1VNYlZzY2hoMWo5ZU02SFVBRVFzTHAzSmo3NCJ9`
   - Erro: page.goto: Target page, context or browser has been closed
   - Timestamp: 2025-08-19T12:11:24.427Z

## 📸 Screenshots Capturados (3 total)

1. crawling-01-inicial.png
2. crawling-02-logado.png
3. crawling-page-1-depth-0.png

## 🎯 Conclusões e Recomendações Super Detalhadas

### ✅ Funcionalidades Identificadas

- **Formulários**: Sistema possui 1 formulários para entrada de dados
- **Interações**: Sistema oferece 2 elementos interativos
- **Links**: Sistema contém 5 links para navegação

### 📋 Arquitetura do Sistema

O sistema analisado apresenta as seguintes características:

- **Páginas Mapeadas**: 2 páginas foram identificadas e analisadas
- **Profundidade de Navegação**: Máximo de 10 níveis explorados
- **Rotas Descobertas**: 7 rotas de navegação identificadas
- **Taxa de Sucesso**: 50.0% de cliques bem-sucedidos

### 🔧 Recomendações Técnicas Avançadas

1. **Documentação Completa**: Este relatório serve como base para documentação técnica completa do sistema
2. **Automação de Testes**: Os 7 seletores identificados podem ser utilizados para automação de testes
3. **Manutenção Facilitada**: A estrutura mapeada facilita futuras manutenções e atualizações
4. **Integração de Sistemas**: APIs e formulários identificados podem ser integrados com outros sistemas
5. **Monitoramento Contínuo**: As rotas descobertas podem ser monitoradas para mudanças
6. **Otimização de Performance**: Identificadas 2 páginas que podem ser otimizadas
7. **Acessibilidade**: Elementos identificados podem ser auditados para conformidade com padrões de acessibilidade

### 📊 Análise de Complexidade

- **Pontuação de Complexidade**: 10
- **Nível de Complexidade**: Baixa
- **Páginas por Profundidade**: Distribuição equilibrada em 10 níveis
- **Densidade de Interação**: 1.0 elementos interativos por página

### 📈 Estatísticas Finais

- **Tempo de Execução**: Crawling completo realizado
- **Cobertura de Páginas**: 2 páginas analisadas
- **Eficiência de Cliques**: 1 cliques realizados com sucesso
- **Taxa de Falhas**: 50.0%
- **Screenshots Coletados**: 3 imagens para documentação
- **Dados Estruturados**: Todas as informações salvas em JSON para processamento posterior

---

*Relatório super completo gerado automaticamente em 19/08/2025, 09:11:24*
*Ferramenta: Crawler Super Agressivo v3.0 - Captura Completa de Páginas*
*Modo: Agressivo com captura de todas as páginas possíveis*
