# Relatório de Crawling Melhorado - SAEB

## Informações Gerais
- **Data/Hora**: 18/08/2025, 13:20:34
- **URL Alvo**: https://saeb.pmfi.pr.gov.br/
- **Status Login**: ✅ Sucesso
- **Status Crawling**: ✅ Sucesso

## Análise da Página Pós-Login
- **Título**: IDEB App - Análise de Gabarito PDFs
- **URL Final**: https://saeb.pmfi.pr.gov.br/
- **Total de Elementos**: 11

### Elementos Detectados
1. **NAV** - "DashboardVisão geral do sistemaEscolasGerenciar escolasTurmasGerenciar turmasAlunosGerenciar alunosC" 
   - Seletor: `nav`
   - ID: N/A
   - Classe: m_45252eee mantine-AppShell-navbar
   - Visível: ✅

2. **NAV** - "DashboardVisão geral do sistemaEscolasGerenciar escolasTurmasGerenciar turmasAlunosGerenciar alunosC" 
   - Seletor: `nav`
   - ID: N/A
   - Classe: m_45252eee mantine-AppShell-navbar
   - Visível: ✅

3. **BUTTON** - "Admin Sistema" 
   - Seletor: `button`
   - ID: mantine-ftyjir06u-target
   - Classe: mantine-focus-auto m_87cf2631 mantine-UnstyledButton-root
   - Visível: ✅

4. **BUTTON** - "Admin Sistema" 
   - Seletor: `button`
   - ID: mantine-a3cpr7l5k-target
   - Classe: mantine-focus-auto m_87cf2631 mantine-UnstyledButton-root
   - Visível: ✅

5. **H1** - "Dashboard Administrativo" 
   - Seletor: `h1`
   - ID: N/A
   - Classe: m_8a5d1357 mantine-Title-root
   - Visível: ✅

6. **H2** - "25" 
   - Seletor: `h2`
   - ID: N/A
   - Classe: m_8a5d1357 mantine-Title-root
   - Visível: ✅

7. **H2** - "156" 
   - Seletor: `h2`
   - ID: N/A
   - Classe: m_8a5d1357 mantine-Title-root
   - Visível: ✅

8. **H2** - "3,847" 
   - Seletor: `h2`
   - ID: N/A
   - Classe: m_8a5d1357 mantine-Title-root
   - Visível: ✅

9. **H2** - "247" 
   - Seletor: `h2`
   - ID: N/A
   - Classe: m_8a5d1357 mantine-Title-root
   - Visível: ✅

10. **H3** - "Atividades Recentes" 
   - Seletor: `h3`
   - ID: N/A
   - Classe: m_8a5d1357 mantine-Title-root
   - Visível: ✅

11. **H3** - "Performance do Sistema" 
   - Seletor: `h3`
   - ID: N/A
   - Classe: m_8a5d1357 mantine-Title-root
   - Visível: ✅


## Dados do Login
```json
{
  "id": "login-1755533993526",
  "taskId": "login-1755533993526",
  "success": true,
  "data": {
    "authenticated": true,
    "authType": "basic",
    "sessionData": {
      "cookies": "",
      "localStorage": "{\"nextauth.message\":\"{\\\"event\\\":\\\"session\\\",\\\"data\\\":{\\\"trigger\\\":\\\"getSession\\\"},\\\"timestamp\\\":1755534017}\"}",
      "sessionStorage": "{}",
      "url": "https://saeb.pmfi.pr.gov.br/",
      "userInfo": {},
      "timestamp": "2025-08-18T16:20:18.387Z",
      "sessionId": "session_1755534018388_o0fkyfdue",
      "userContext": {}
    },
    "sessionId": "session_1755534018388_o0fkyfdue",
    "userContext": {},
    "loginSteps": [
      {
        "action": "navigate",
        "url": "https://saeb.pmfi.pr.gov.br/",
        "finalUrl": "https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/protocol/openid-connect/auth?client_id=ideb-app&scope=openid%20email%20profile&response_type=code&redirect_uri=https%3A%2F%2Fsaeb.pmfi.pr.gov.br%2Fapi%2Fauth%2Fcallback%2Fkeycloak&state=kzQSrAFd--eOoHDrZHt6qMLZV6c0zvoTrWTa2rKJV2g&code_challenge=gIM3aVa5EgLolOeodZ81Hw5b3AziDR2s_CCplRTsSPI&code_challenge_method=S256",
        "timestamp": "2025-08-18T16:20:03.866Z"
      },
      {
        "action": "analyze_page",
        "analysis": {
          "authMethods": {
            "standardAuth": {
              "available": true,
              "fields": {
                "required": [],
                "optional": [
                  "username",
                  "password"
                ]
              }
            },
            "oauthProviders": [],
            "additionalFeatures": {
              "passwordRecovery": {
                "available": true,
                "link": "/realms/ideb-realm/login-actions/reset-credentials?client_id=ideb-app&tab_id=SYKtEQEmOQo&client_data=eyJydSI6Imh0dHBzOi8vc2FlYi5wbWZpLnByLmdvdi5ici9hcGkvYXV0aC9jYWxsYmFjay9rZXljbG9hayIsInJ0IjoiY29kZSIsInN0Ijoia3pRU3JBRmQtLWVPb0hEclpIdDZxTUxaVjZjMHp2b1RyV1RhMnJLSlYyZyJ9"
              },
              "registration": {
                "available": false
              },
              "twoFactor": false
            }
          },
          "alternativeLogins": [],
          "hasStandardLogin": true,
          "hasOAuthOptions": false,
          "pageUrl": "https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/login-actions/authenticate?execution=47ecfa33-2e03-4463-b99f-2a949e36b775&client_id=ideb-app&tab_id=SYKtEQEmOQo&client_data=eyJydSI6Imh0dHBzOi8vc2FlYi5wbWZpLnByLmdvdi5ici9hcGkvYXV0aC9jYWxsYmFjay9rZXljbG9hayIsInJ0IjoiY29kZSIsInN0Ijoia3pRU3JBRmQtLWVPb0hEclpIdDZxTUxaVjZjMHp2b1RyV1RhMnJLSlYyZyJ9",
          "pageTitle": "Sign in to IDEB App Realm"
        },
        "timestamp": "2025-08-18T16:20:08.540Z"
      },
      {
        "action": "fill_credentials",
        "username": "admin",
        "timestamp": "2025-08-18T16:20:17.069Z"
      },
      {
        "action": "click_submit",
        "timestamp": "2025-08-18T16:20:18.376Z"
      }
    ],
    "screenshots": {
      "login_page": "output/screenshots/login_page_1755534003866.png",
      "campo_usuario": "output/screenshots/campo_usuario_1755534008213.png",
      "campo_senha": "output/screenshots/campo_senha_1755534008341.png",
      "botao_login": "output/screenshots/botao_login_1755534008447.png",
      "before_submit": "output/screenshots/login_page_1755534017069.png",
      "post_login_page": "output/screenshots/post_login_page_1755534018389.png"
    },
    "pageAnalysis": {
      "authMethods": {
        "standardAuth": {
          "available": true,
          "fields": {
            "required": [],
            "optional": [
              "username",
              "password"
            ]
          }
        },
        "oauthProviders": [],
        "additionalFeatures": {
          "passwordRecovery": {
            "available": true,
            "link": "/realms/ideb-realm/login-actions/reset-credentials?client_id=ideb-app&tab_id=SYKtEQEmOQo&client_data=eyJydSI6Imh0dHBzOi8vc2FlYi5wbWZpLnByLmdvdi5ici9hcGkvYXV0aC9jYWxsYmFjay9rZXljbG9hayIsInJ0IjoiY29kZSIsInN0Ijoia3pRU3JBRmQtLWVPb0hEclpIdDZxTUxaVjZjMHp2b1RyV1RhMnJLSlYyZyJ9"
          },
          "registration": {
            "available": false
          },
          "twoFactor": false
        }
      },
      "alternativeLogins": [],
      "hasStandardLogin": true,
      "hasOAuthOptions": false,
      "pageUrl": "https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/login-actions/authenticate?execution=47ecfa33-2e03-4463-b99f-2a949e36b775&client_id=ideb-app&tab_id=SYKtEQEmOQo&client_data=eyJydSI6Imh0dHBzOi8vc2FlYi5wbWZpLnByLmdvdi5ici9hcGkvYXV0aC9jYWxsYmFjay9rZXljbG9hayIsInJ0IjoiY29kZSIsInN0Ijoia3pRU3JBRmQtLWVPb0hEclpIdDZxTUxaVjZjMHp2b1RyV1RhMnJLSlYyZyJ9",
      "pageTitle": "Sign in to IDEB App Realm"
    }
  },
  "timestamp": "2025-08-18T16:20:18.721Z",
  "processingTime": 25194
}
```

## Dados do Crawling
```json
{
  "id": "crawl-1755534024197",
  "taskId": "crawl-1755534024197",
  "success": true,
  "data": {
    "pageObjective": {
      "centralPurpose": "IDEB App - Análise de Gabarito PDFs",
      "mainFunctionalities": [
        "Admin Sistema",
        "Admin Sistema"
      ],
      "userGoals": [
        "Dashboard Administrativo",
        "25",
        "156"
      ]
    },
    "interactiveElements": [],
    "discoveredPages": [],
    "workflows": [],
    "hiddenFunctionalities": [],
    "screenshots": {
      "pagina_0_inicial": "screenshots/pagina_0_inicial-2025-08-18T16-20-27-899Z.png"
    },
    "statistics": {
      "totalElementsTested": 0,
      "successfulInteractions": 0,
      "pagesDiscovered": 0,
      "workflowsIdentified": 0,
      "hiddenFeaturesFound": 0,
      "processingTime": 10392,
      "currentDepth": 0,
      "visitedPagesCount": 1
    }
  },
  "timestamp": "2025-08-18T16:20:34.589Z",
  "processingTime": 10392
}
```

## Diagnóstico
✅ **Sucesso**: 11 elementos detectados na página.

---
*Relatório gerado automaticamente pelo teste de crawling melhorado*
