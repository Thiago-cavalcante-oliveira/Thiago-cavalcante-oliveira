## Manual do Usuário - Sistema Completo (Website)

Esta seção descreve a funcionalidade "Sistema Completo" e como utilizá-la.  Note que o acesso ao sistema completo requer autenticação.


**1. Finalidade:**

A funcionalidade "Sistema Completo" proporciona acesso a um conjunto de recursos e informações através de um website.  Este sistema, acessível via URL `https://saeb-h1.pmfi.pr.gov.br/`,  apresenta múltiplas páginas com diferentes elementos e funcionalidades,  requerendo autenticação para acesso completo.


**2. Elementos Visíveis:**

A funcionalidade "Sistema Completo" apresenta diferentes elementos visíveis dependendo da página acessada.  As páginas identificadas são:

* **Página Principal (`https://saeb-h1.pmfi.pr.gov.br/`):**  Contém 1 elemento principal, possivelmente um link ou botão para acesso à área logada.
* **Página de Login (`https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/protocol/openid-connect/auth...`):**  Apresenta 5 elementos,  incluindo campos para credenciais de login (provavelmente usuário e senha), botões de submit e possivelmente links para recuperação de senha ou ajuda.


**3. Ações Possíveis:**

As ações possíveis dependem da página em que o usuário se encontra:

* **Página Principal:**  A principal ação é clicar no elemento de acesso para iniciar o processo de login.
* **Página de Login:**  O usuário deve inserir suas credenciais (usuário e senha) e clicar no botão de submit para acessar o sistema.  Outras ações podem incluir acessar links de ajuda ou recuperação de senha.


**4. Instruções Passo-a-Passo:**

**Acesso ao Sistema Completo:**

1. **Navegue até a URL:** Abra seu navegador web e acesse `https://saeb-h1.pmfi.pr.gov.br/`.
2. **Autenticação:** Localize o elemento que inicia o processo de login (botão ou link). Clique nele.  Você será redirecionado para a página de login.
3. **Login:** Insira seu nome de usuário e senha nos campos apropriados.
4. **Acesso:** Clique no botão de login. Se suas credenciais estiverem corretas, você terá acesso ao sistema completo.  Caso contrário, verifique suas credenciais e tente novamente.  Utilize os recursos de ajuda ou recuperação de senha caso necessário.


**Observação:** Este manual descreve a funcionalidade com base nas informações fornecidas.  A experiência do usuário pode variar dependendo da implementação e atualizações do sistema.  Para suporte adicional, consulte a documentação oficial ou o suporte técnico do sistema.


---

# Detalhamento Técnico Completo

## Página Principal

**URL:** https://saeb-h1.pmfi.pr.gov.br/

**Descrição:** Página inicial do website

### 📊 Resumo da Página

- **Elementos interativos:** 1
- **Screenshots capturados:** 2
- **Mudanças de estado:** 1
- **Navegações identificadas:** 1

### 📷 Aparência Inicial

![Página Página Principal](/home/thiagotco/stim/teste_auto_manual/manual-generator/output/screenshot_1_page_1_initial.png)

### 🎯 Elementos Interativos

#### ✅ Elementos Funcionais (1)

##### 1. Fazer Login

**Tipo:** BUTTON

**Localização:** x:960, y:340.390625

**✅ Status:** Interação bem-sucedida

**🌐 Navegação:** Sim - de https://saeb-h1.pmfi.pr.gov.br/auth/signin para https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/protocol/openid-connect/auth?client_id=ideb-app&scope=openid%20email%20profile&response_type=code&redirect_uri=https%3A%2F%2Fsaeb-h1.pmfi.pr.gov.br%2Fapi%2Fauth%2Fcallback%2Fkeycloak&state=jFbPw1uBvWt_fxkdF9uc5z-0G-Fh23bfZFcbik7hkrI&code_challenge=oQqQy6sqKjbirxfvYcL-XBO4cVDqQwyaN_Gd7scdUbo&code_challenge_method=S256

**📄 Nova página:** Sign in to IDEB App Realm

**Como usar:**

1. Localize o elemento "Fazer Login" na página
2. Clique no elemento
3. Você será redirecionado para: https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/protocol/openid-connect/auth?client_id=ideb-app&scope=openid%20email%20profile&response_type=code&redirect_uri=https%3A%2F%2Fsaeb-h1.pmfi.pr.gov.br%2Fapi%2Fauth%2Fcallback%2Fkeycloak&state=jFbPw1uBvWt_fxkdF9uc5z-0G-Fh23bfZFcbik7hkrI&code_challenge=oQqQy6sqKjbirxfvYcL-XBO4cVDqQwyaN_Gd7scdUbo&code_challenge_method=S256
4. A nova página terá o título: "Sign in to IDEB App Realm"

**🔄 Mudança observada:** Navegação de https://saeb-h1.pmfi.pr.gov.br/auth/signin para https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/protocol/openid-connect/auth?client_id=ideb-app&scope=openid%20email%20profile&response_type=code&redirect_uri=https%3A%2F%2Fsaeb-h1.pmfi.pr.gov.br%2Fapi%2Fauth%2Fcallback%2Fkeycloak&state=jFbPw1uBvWt_fxkdF9uc5z-0G-Fh23bfZFcbik7hkrI&code_challenge=oQqQy6sqKjbirxfvYcL-XBO4cVDqQwyaN_Gd7scdUbo&code_challenge_method=S256, Título alterado de "Next.js" para "Sign in to IDEB App Realm", Foco alterado para INPUT

**📷 Screenshot após interação:**

![Elemento Fazer Login](/home/thiagotco/stim/teste_auto_manual/manual-generator/output/screenshot_2_page_1_element_1.png)

---

### 🔄 Mudanças de Estado Observadas

#### Fazer Login

**Mudança observada:** Navegação de https://saeb-h1.pmfi.pr.gov.br/auth/signin para https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/protocol/openid-connect/auth?client_id=ideb-app&scope=openid%20email%20profile&response_type=code&redirect_uri=https%3A%2F%2Fsaeb-h1.pmfi.pr.gov.br%2Fapi%2Fauth%2Fcallback%2Fkeycloak&state=jFbPw1uBvWt_fxkdF9uc5z-0G-Fh23bfZFcbik7hkrI&code_challenge=oQqQy6sqKjbirxfvYcL-XBO4cVDqQwyaN_Gd7scdUbo&code_challenge_method=S256, Título alterado de "Next.js" para "Sign in to IDEB App Realm", Foco alterado para INPUT

**Timestamp:** 04/08/2025, 17:00:01

**Estado anterior:** URL: https://saeb-h1.pmfi.pr.gov.br/auth/signin, Título: Next.js, Modais: 0, Elemento ativo: BODY

**Estado posterior:** URL: https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/protocol/openid-connect/auth?client_id=ideb-app&scope=openid%20email%20profile&response_type=code&redirect_uri=https%3A%2F%2Fsaeb-h1.pmfi.pr.gov.br%2Fapi%2Fauth%2Fcallback%2Fkeycloak&state=jFbPw1uBvWt_fxkdF9uc5z-0G-Fh23bfZFcbik7hkrI&code_challenge=oQqQy6sqKjbirxfvYcL-XBO4cVDqQwyaN_Gd7scdUbo&code_challenge_method=S256, Título: Sign in to IDEB App Realm, Modais: 0, Elemento ativo: INPUT

---

### 🎯 Navegações Identificadas

Esta página permite navegar para:

- [https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/protocol/openid-connect/auth?client_id=ideb-app&scope=openid%20email%20profile&response_type=code&redirect_uri=https%3A%2F%2Fsaeb-h1.pmfi.pr.gov.br%2Fapi%2Fauth%2Fcallback%2Fkeycloak&state=jFbPw1uBvWt_fxkdF9uc5z-0G-Fh23bfZFcbik7hkrI&code_challenge=oQqQy6sqKjbirxfvYcL-XBO4cVDqQwyaN_Gd7scdUbo&code_challenge_method=S256](https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/protocol/openid-connect/auth?client_id=ideb-app&scope=openid%20email%20profile&response_type=code&redirect_uri=https%3A%2F%2Fsaeb-h1.pmfi.pr.gov.br%2Fapi%2Fauth%2Fcallback%2Fkeycloak&state=jFbPw1uBvWt_fxkdF9uc5z-0G-Fh23bfZFcbik7hkrI&code_challenge=oQqQy6sqKjbirxfvYcL-XBO4cVDqQwyaN_Gd7scdUbo&code_challenge_method=S256)


## Sign in to IDEB App Realm

**URL:** https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/protocol/openid-connect/auth?client_id=ideb-app&scope=openid%20email%20profile&response_type=code&redirect_uri=https%3A%2F%2Fsaeb-h1.pmfi.pr.gov.br%2Fapi%2Fauth%2Fcallback%2Fkeycloak&state=jFbPw1uBvWt_fxkdF9uc5z-0G-Fh23bfZFcbik7hkrI&code_challenge=oQqQy6sqKjbirxfvYcL-XBO4cVDqQwyaN_Gd7scdUbo&code_challenge_method=S256

**Descrição:** Página acessada através de: Fazer Login

### 📊 Resumo da Página

- **Elementos interativos:** 5
- **Screenshots capturados:** 6
- **Mudanças de estado:** 3
- **Navegações identificadas:** 1

### 📷 Aparência Inicial

![Página Sign in to IDEB App Realm](/home/thiagotco/stim/teste_auto_manual/manual-generator/output/screenshot_3_page_2_initial.png)

### 🎯 Elementos Interativos

#### ✅ Elementos Funcionais (3)

##### 1. Forgot Password?

**Tipo:** A

**Localização:** x:791.359375, y:673.28125

**✅ Status:** Interação bem-sucedida

**🌐 Navegação:** Sim - de https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/protocol/openid-connect/auth?client_id=ideb-app&scope=openid%20email%20profile&response_type=code&redirect_uri=https%3A%2F%2Fsaeb-h1.pmfi.pr.gov.br%2Fapi%2Fauth%2Fcallback%2Fkeycloak&state=jFbPw1uBvWt_fxkdF9uc5z-0G-Fh23bfZFcbik7hkrI&code_challenge=oQqQy6sqKjbirxfvYcL-XBO4cVDqQwyaN_Gd7scdUbo&code_challenge_method=S256 para https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/login-actions/reset-credentials?client_id=ideb-app&tab_id=TBl9TneVnd4&client_data=eyJydSI6Imh0dHBzOi8vc2FlYi1oMS5wbWZpLnByLmdvdi5ici9hcGkvYXV0aC9jYWxsYmFjay9rZXljbG9hayIsInJ0IjoiY29kZSIsInN0IjoiakZiUHcxdUJ2V3RfZnhrZEY5dWM1ei0wRy1GaDIzYmZaRmNiaWs3aGtySSJ9

**📄 Nova página:** Sign in to IDEB App Realm

**Como usar:**

1. Localize o elemento "Forgot Password?" na página
2. Clique no elemento
3. Você será redirecionado para: https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/login-actions/reset-credentials?client_id=ideb-app&tab_id=TBl9TneVnd4&client_data=eyJydSI6Imh0dHBzOi8vc2FlYi1oMS5wbWZpLnByLmdvdi5ici9hcGkvYXV0aC9jYWxsYmFjay9rZXljbG9hayIsInJ0IjoiY29kZSIsInN0IjoiakZiUHcxdUJ2V3RfZnhrZEY5dWM1ei0wRy1GaDIzYmZaRmNiaWs3aGtySSJ9
4. A nova página terá o título: "Sign in to IDEB App Realm"

**🔄 Mudança observada:** Navegação de https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/protocol/openid-connect/auth?client_id=ideb-app&scope=openid%20email%20profile&response_type=code&redirect_uri=https%3A%2F%2Fsaeb-h1.pmfi.pr.gov.br%2Fapi%2Fauth%2Fcallback%2Fkeycloak&state=jFbPw1uBvWt_fxkdF9uc5z-0G-Fh23bfZFcbik7hkrI&code_challenge=oQqQy6sqKjbirxfvYcL-XBO4cVDqQwyaN_Gd7scdUbo&code_challenge_method=S256 para https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/login-actions/reset-credentials?client_id=ideb-app&tab_id=TBl9TneVnd4&client_data=eyJydSI6Imh0dHBzOi8vc2FlYi1oMS5wbWZpLnByLmdvdi5ici9hcGkvYXV0aC9jYWxsYmFjay9rZXljbG9hayIsInJ0IjoiY29kZSIsInN0IjoiakZiUHcxdUJ2V3RfZnhrZEY5dWM1ei0wRy1GaDIzYmZaRmNiaWs3aGtySSJ9

**📷 Screenshot após interação:**

![Elemento Forgot Password?](/home/thiagotco/stim/teste_auto_manual/manual-generator/output/screenshot_4_page_2_element_1.png)

---

##### 2. Show password

**Tipo:** BUTTON

**Localização:** x:1159, y:641.28125

**✅ Status:** Interação bem-sucedida

**🔄 Ação:** Interação local (sem navegação)

**Como usar:**

1. Localize o elemento "Show password" na página
2. Clique no elemento para ativá-lo
3. Observe as mudanças na página

**📷 Screenshot após interação:**

![Elemento Show password](/home/thiagotco/stim/teste_auto_manual/manual-generator/output/screenshot_5_page_2_element_2.png)

---

##### 3. INPUT_0

**Tipo:** INPUT

**Localização:** x:960, y:563.09375

**✅ Status:** Interação bem-sucedida

**🔄 Ação:** Interação local (sem navegação)

**Como usar:**

1. Localize o elemento "INPUT_0" na página
2. Clique no campo para ativá-lo
3. Digite o texto desejado
4. Pressione Tab ou clique fora para confirmar

**📷 Screenshot após interação:**

![Elemento INPUT_0](/home/thiagotco/stim/teste_auto_manual/manual-generator/output/screenshot_6_page_2_element_3.png)

---

#### ⚠️ Elementos com Problemas (2)

- **Sign In** (button): Elemento não visível
- **INPUT_0** (input): Elemento não visível

### 🔄 Mudanças de Estado Observadas

#### Forgot Password?

**Mudança observada:** Navegação de https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/protocol/openid-connect/auth?client_id=ideb-app&scope=openid%20email%20profile&response_type=code&redirect_uri=https%3A%2F%2Fsaeb-h1.pmfi.pr.gov.br%2Fapi%2Fauth%2Fcallback%2Fkeycloak&state=jFbPw1uBvWt_fxkdF9uc5z-0G-Fh23bfZFcbik7hkrI&code_challenge=oQqQy6sqKjbirxfvYcL-XBO4cVDqQwyaN_Gd7scdUbo&code_challenge_method=S256 para https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/login-actions/reset-credentials?client_id=ideb-app&tab_id=TBl9TneVnd4&client_data=eyJydSI6Imh0dHBzOi8vc2FlYi1oMS5wbWZpLnByLmdvdi5ici9hcGkvYXV0aC9jYWxsYmFjay9rZXljbG9hayIsInJ0IjoiY29kZSIsInN0IjoiakZiUHcxdUJ2V3RfZnhrZEY5dWM1ei0wRy1GaDIzYmZaRmNiaWs3aGtySSJ9

**Timestamp:** 04/08/2025, 17:00:10

**Estado anterior:** URL: https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/protocol/openid-connect/auth?client_id=ideb-app&scope=openid%20email%20profile&response_type=code&redirect_uri=https%3A%2F%2Fsaeb-h1.pmfi.pr.gov.br%2Fapi%2Fauth%2Fcallback%2Fkeycloak&state=jFbPw1uBvWt_fxkdF9uc5z-0G-Fh23bfZFcbik7hkrI&code_challenge=oQqQy6sqKjbirxfvYcL-XBO4cVDqQwyaN_Gd7scdUbo&code_challenge_method=S256, Título: Sign in to IDEB App Realm, Modais: 0, Elemento ativo: INPUT

**Estado posterior:** URL: https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/login-actions/reset-credentials?client_id=ideb-app&tab_id=TBl9TneVnd4&client_data=eyJydSI6Imh0dHBzOi8vc2FlYi1oMS5wbWZpLnByLmdvdi5ici9hcGkvYXV0aC9jYWxsYmFjay9rZXljbG9hayIsInJ0IjoiY29kZSIsInN0IjoiakZiUHcxdUJ2V3RfZnhrZEY5dWM1ei0wRy1GaDIzYmZaRmNiaWs3aGtySSJ9, Título: Sign in to IDEB App Realm, Modais: 0, Elemento ativo: INPUT

---

#### Show password

**Mudança observada:** Foco alterado para BUTTON

**Timestamp:** 04/08/2025, 17:00:17

**Estado anterior:** URL: https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/protocol/openid-connect/auth?client_id=ideb-app&scope=openid%20email%20profile&response_type=code&redirect_uri=https%3A%2F%2Fsaeb-h1.pmfi.pr.gov.br%2Fapi%2Fauth%2Fcallback%2Fkeycloak&state=jFbPw1uBvWt_fxkdF9uc5z-0G-Fh23bfZFcbik7hkrI&code_challenge=oQqQy6sqKjbirxfvYcL-XBO4cVDqQwyaN_Gd7scdUbo&code_challenge_method=S256, Título: Sign in to IDEB App Realm, Modais: 0, Elemento ativo: INPUT

**Estado posterior:** URL: https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/protocol/openid-connect/auth?client_id=ideb-app&scope=openid%20email%20profile&response_type=code&redirect_uri=https%3A%2F%2Fsaeb-h1.pmfi.pr.gov.br%2Fapi%2Fauth%2Fcallback%2Fkeycloak&state=jFbPw1uBvWt_fxkdF9uc5z-0G-Fh23bfZFcbik7hkrI&code_challenge=oQqQy6sqKjbirxfvYcL-XBO4cVDqQwyaN_Gd7scdUbo&code_challenge_method=S256, Título: Sign in to IDEB App Realm, Modais: 0, Elemento ativo: BUTTON

---

#### INPUT_0

**Mudança observada:** Foco alterado para INPUT

**Timestamp:** 04/08/2025, 17:00:20

**Estado anterior:** URL: https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/protocol/openid-connect/auth?client_id=ideb-app&scope=openid%20email%20profile&response_type=code&redirect_uri=https%3A%2F%2Fsaeb-h1.pmfi.pr.gov.br%2Fapi%2Fauth%2Fcallback%2Fkeycloak&state=jFbPw1uBvWt_fxkdF9uc5z-0G-Fh23bfZFcbik7hkrI&code_challenge=oQqQy6sqKjbirxfvYcL-XBO4cVDqQwyaN_Gd7scdUbo&code_challenge_method=S256, Título: Sign in to IDEB App Realm, Modais: 0, Elemento ativo: BUTTON

**Estado posterior:** URL: https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/protocol/openid-connect/auth?client_id=ideb-app&scope=openid%20email%20profile&response_type=code&redirect_uri=https%3A%2F%2Fsaeb-h1.pmfi.pr.gov.br%2Fapi%2Fauth%2Fcallback%2Fkeycloak&state=jFbPw1uBvWt_fxkdF9uc5z-0G-Fh23bfZFcbik7hkrI&code_challenge=oQqQy6sqKjbirxfvYcL-XBO4cVDqQwyaN_Gd7scdUbo&code_challenge_method=S256, Título: Sign in to IDEB App Realm, Modais: 0, Elemento ativo: INPUT

---

### 🎯 Navegações Identificadas

Esta página permite navegar para:

- [https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/login-actions/reset-credentials?client_id=ideb-app&tab_id=TBl9TneVnd4&client_data=eyJydSI6Imh0dHBzOi8vc2FlYi1oMS5wbWZpLnByLmdvdi5ici9hcGkvYXV0aC9jYWxsYmFjay9rZXljbG9hayIsInJ0IjoiY29kZSIsInN0IjoiakZiUHcxdUJ2V3RfZnhrZEY5dWM1ei0wRy1GaDIzYmZaRmNiaWs3aGtySSJ9](https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/login-actions/reset-credentials?client_id=ideb-app&tab_id=TBl9TneVnd4&client_data=eyJydSI6Imh0dHBzOi8vc2FlYi1oMS5wbWZpLnByLmdvdi5ici9hcGkvYXV0aC9jYWxsYmFjay9rZXljbG9hayIsInJ0IjoiY29kZSIsInN0IjoiakZiUHcxdUJ2V3RfZnhrZEY5dWM1ei0wRy1GaDIzYmZaRmNiaWs3aGtySSJ9)

