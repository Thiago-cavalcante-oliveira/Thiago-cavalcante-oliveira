# LoginAgent - OUTPUT

**Timestamp:** 2025-08-15T19:10:58.211Z

## Dados de Saída

```json
{
  "success": true,
  "data": {
    "authenticated": true,
    "authType": "basic",
    "sessionData": {
      "cookies": "ASPSESSIONIDAGQCSSBS=EMEFJEOBCAKPPFCBMGPCKICO",
      "localStorage": "{}",
      "sessionStorage": "{}",
      "url": "https://rptreinamentos.pmfi.pr.gov.br/RP/Sistema/Auth/Login?returnUrl=/RP/Sistema",
      "userInfo": {},
      "timestamp": "2025-08-15T19:10:57.960Z",
      "sessionId": "session_1755285057976_7pob7ztrk",
      "userContext": {}
    },
    "sessionId": "session_1755285057976_7pob7ztrk",
    "userContext": {},
    "loginSteps": [
      {
        "action": "navigate",
        "url": "http://rptreinamentos.pmfi.pr.gov.br/",
        "finalUrl": "https://rptreinamentos.pmfi.pr.gov.br/RP/Sistema/Auth/Login?returnUrl=/RP/Sistema",
        "timestamp": "2025-08-15T19:10:55.990Z"
      },
      {
        "action": "analyze_page",
        "analysis": {
          "authMethods": {
            "standardAuth": {
              "available": false,
              "fields": {
                "required": [],
                "optional": [
                  "ReturnUrl",
                  "__RequestVerificationToken",
                  "Usuario",
                  "Senha",
                  "LembrarUsuario",
                  "LembrarUsuario"
                ]
              }
            },
            "oauthProviders": [],
            "additionalFeatures": {
              "passwordRecovery": {
                "available": false
              },
              "registration": {
                "available": false
              },
              "twoFactor": false
            }
          },
          "alternativeLogins": [],
          "hasStandardLogin": false,
          "hasOAuthOptions": false,
          "pageUrl": "https://rptreinamentos.pmfi.pr.gov.br/RP/Sistema/Auth/Login?returnUrl=/RP/Sistema",
          "pageTitle": "Acessar o sistema - Sistema de Gerenciamento"
        },
        "timestamp": "2025-08-15T19:10:57.935Z"
      }
    ],
    "screenshots": {
      "login_page": "https://minio-s3.pmfi.pr.gov.br/documentacao/screenshots/login_page_1755285055991.png",
      "campo_usuario": "https://minio-s3.pmfi.pr.gov.br/documentacao/screenshots/campo_usuario_1755285056730.png",
      "campo_senha": "https://minio-s3.pmfi.pr.gov.br/documentacao/screenshots/campo_senha_1755285057544.png",
      "botao_login": "https://minio-s3.pmfi.pr.gov.br/documentacao/screenshots/botao_login_1755285057746.png",
      "post_login_page": "https://minio-s3.pmfi.pr.gov.br/documentacao/screenshots/post_login_page_1755285057976.png"
    },
    "pageAnalysis": {
      "authMethods": {
        "standardAuth": {
          "available": false,
          "fields": {
            "required": [],
            "optional": [
              "ReturnUrl",
              "__RequestVerificationToken",
              "Usuario",
              "Senha",
              "LembrarUsuario",
              "LembrarUsuario"
            ]
          }
        },
        "oauthProviders": [],
        "additionalFeatures": {
          "passwordRecovery": {
            "available": false
          },
          "registration": {
            "available": false
          },
          "twoFactor": false
        }
      },
      "alternativeLogins": [],
      "hasStandardLogin": false,
      "hasOAuthOptions": false,
      "pageUrl": "https://rptreinamentos.pmfi.pr.gov.br/RP/Sistema/Auth/Login?returnUrl=/RP/Sistema",
      "pageTitle": "Acessar o sistema - Sistema de Gerenciamento"
    }
  },
  "timestamp": "2025-08-15T19:10:58.210Z"
}
```
