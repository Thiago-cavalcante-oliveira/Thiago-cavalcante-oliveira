# Relatório de Crawling - SAEB

## Informações Gerais
- **Data/Hora**: 18/08/2025, 13:00:23
- **URL Alvo**: https://saeb.pmfi.pr.gov.br/
- **Status Login**: ✅ Sucesso
- **Status Crawling**: ✅ Sucesso

## Dados do Login
```json
{
  "id": "login-1755532795411",
  "taskId": "login-1755532795411",
  "success": true,
  "data": {
    "authenticated": true,
    "authType": "basic",
    "sessionData": {
      "cookies": "",
      "localStorage": "{\"nextauth.message\":\"{\\\"event\\\":\\\"session\\\",\\\"data\\\":{\\\"trigger\\\":\\\"getSession\\\"},\\\"timestamp\\\":1755532811}\"}",
      "sessionStorage": "{}",
      "url": "https://saeb.pmfi.pr.gov.br/",
      "userInfo": {},
      "timestamp": "2025-08-18T16:00:12.520Z",
      "sessionId": "session_1755532812531_y8g7v6sif",
      "userContext": {}
    },
    "sessionId": "session_1755532812531_y8g7v6sif",
    "userContext": {},
    "loginSteps": [
      {
        "action": "navigate",
        "url": "https://saeb.pmfi.pr.gov.br/",
        "finalUrl": "https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/protocol/openid-connect/auth?client_id=ideb-app&scope=openid%20email%20profile&response_type=code&redirect_uri=https%3A%2F%2Fsaeb.pmfi.pr.gov.br%2Fapi%2Fauth%2Fcallback%2Fkeycloak&state=jPGXEF2S9oqJ6mkQQU7Hl13mzMjqOuAFN9l6GDS5pco&code_challenge=RnTJjPILGbXArXY1TY4NrSC1-b4jxcr9kZinCuyHjo8&code_challenge_method=S256",
        "timestamp": "2025-08-18T16:00:04.840Z"
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
                "link": "/realms/ideb-realm/login-actions/reset-credentials?client_id=ideb-app&tab_id=jYZBzsf6Nts&client_data=eyJydSI6Imh0dHBzOi8vc2FlYi5wbWZpLnByLmdvdi5ici9hcGkvYXV0aC9jYWxsYmFjay9rZXljbG9hayIsInJ0IjoiY29kZSIsInN0IjoialBHWEVGMlM5b3FKNm1rUVFVN0hsMTNtek1qcU91QUZOOWw2R0RTNXBjbyJ9"
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
          "pageUrl": "https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/login-actions/authenticate?execution=47ecfa33-2e03-4463-b99f-2a949e36b775&client_id=ideb-app&tab_id=jYZBzsf6Nts&client_data=eyJydSI6Imh0dHBzOi8vc2FlYi5wbWZpLnByLmdvdi5ici9hcGkvYXV0aC9jYWxsYmFjay9rZXljbG9hayIsInJ0IjoiY29kZSIsInN0IjoialBHWEVGMlM5b3FKNm1rUVFVN0hsMTNtek1qcU91QUZOOWw2R0RTNXBjbyJ9",
          "pageTitle": "Sign in to IDEB App Realm"
        },
        "timestamp": "2025-08-18T16:00:08.787Z"
      },
      {
        "action": "fill_credentials",
        "username": "admin",
        "timestamp": "2025-08-18T16:00:11.499Z"
      },
      {
        "action": "click_submit",
        "timestamp": "2025-08-18T16:00:11.793Z"
      }
    ],
    "screenshots": {
      "login_page": "https://minio-s3.pmfi.pr.gov.br/documentacao/screenshots/login_page_1755532804840.png",
      "campo_usuario": "https://minio-s3.pmfi.pr.gov.br/documentacao/screenshots/campo_usuario_1755532808295.png",
      "campo_senha": "https://minio-s3.pmfi.pr.gov.br/documentacao/screenshots/campo_senha_1755532808446.png",
      "botao_login": "https://minio-s3.pmfi.pr.gov.br/documentacao/screenshots/botao_login_1755532808628.png",
      "before_submit": "https://minio-s3.pmfi.pr.gov.br/documentacao/screenshots/login_page_1755532811499.png",
      "post_login_page": "https://minio-s3.pmfi.pr.gov.br/documentacao/screenshots/post_login_page_1755532812532.png"
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
            "link": "/realms/ideb-realm/login-actions/reset-credentials?client_id=ideb-app&tab_id=jYZBzsf6Nts&client_data=eyJydSI6Imh0dHBzOi8vc2FlYi5wbWZpLnByLmdvdi5ici9hcGkvYXV0aC9jYWxsYmFjay9rZXljbG9hayIsInJ0IjoiY29kZSIsInN0IjoialBHWEVGMlM5b3FKNm1rUVFVN0hsMTNtek1qcU91QUZOOWw2R0RTNXBjbyJ9"
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
      "pageUrl": "https://keycloak.pmfi.pr.gov.br/realms/ideb-realm/login-actions/authenticate?execution=47ecfa33-2e03-4463-b99f-2a949e36b775&client_id=ideb-app&tab_id=jYZBzsf6Nts&client_data=eyJydSI6Imh0dHBzOi8vc2FlYi5wbWZpLnByLmdvdi5ici9hcGkvYXV0aC9jYWxsYmFjay9rZXljbG9hayIsInJ0IjoiY29kZSIsInN0IjoialBHWEVGMlM5b3FKNm1rUVFVN0hsMTNtek1qcU91QUZOOWw2R0RTNXBjbyJ9",
      "pageTitle": "Sign in to IDEB App Realm"
    }
  },
  "timestamp": "2025-08-18T16:00:13.779Z",
  "processingTime": 18367
}
```

## Dados do Crawling
```json
{
  "id": "crawl-1755532813779",
  "taskId": "crawl-1755532813779",
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
      "pagina_0_inicial": "screenshots/pagina_0_inicial-2025-08-18T16-00-16-563Z.png"
    },
    "statistics": {
      "totalElementsTested": 0,
      "successfulInteractions": 0,
      "pagesDiscovered": 0,
      "workflowsIdentified": 0,
      "hiddenFeaturesFound": 0,
      "processingTime": 9648,
      "currentDepth": 0,
      "visitedPagesCount": 1
    }
  },
  "timestamp": "2025-08-18T16:00:23.428Z",
  "processingTime": 9648
}
```

## Resumo
- **Páginas Descobertas**: 0
- **Elementos Capturados**: 0
- **Screenshots**: 0
- **Tempo de Processamento**: 9648ms

---
*Relatório gerado automaticamente pelo agente de crawling*
