# 🤖 Integração com MinIO - Upload de Imagens para Nuvem

O sistema agora suporta upload automático de imagens para MinIO (compatível com Amazon S3), permitindo que os manuais gerados tenham imagens hospedadas na nuvem ao invés de arquivos locais.

## 🚀 Benefícios da Integração MinIO

1. **📤 Imagens na nuvem**: Screenshots são enviados automaticamente para storage na nuvem
2. **🔗 URLs públicas**: Manuais contêm links diretos para as imagens hospedadas
3. **📱 Compatibilidade**: Manuais funcionam em qualquer lugar sem dependência de arquivos locais
4. **⚡ Performance**: Imagens são servidas via CDN para carregamento mais rápido
5. **🔄 Fallback automático**: Se MinIO não estiver configurado, usa arquivos locais

## ⚙️ Configuração

### 1. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
# MinIO/S3 Configuration
MINIO_ENDPOINT=seu-servidor-minio.com
MINIO_PORT=9000
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=sua_access_key
MINIO_SECRET_KEY=sua_secret_key
MINIO_BUCKET_NAME=web-manuals
```

### 2. Exemplos de configuração

#### MinIO local (desenvolvimento):
```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=web-manuals
```

#### DigitalOcean Spaces:
```env
MINIO_ENDPOINT=nyc3.digitaloceanspaces.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=seu_spaces_key
MINIO_SECRET_KEY=seu_spaces_secret
MINIO_BUCKET_NAME=meu-bucket-manuals
```

#### Amazon S3:
```env
MINIO_ENDPOINT=s3.amazonaws.com
MINIO_PORT=443
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=AKIA...
MINIO_SECRET_KEY=...
MINIO_BUCKET_NAME=meu-bucket-s3
```

## 🛠️ Como usar

### Modo amigável com MinIO:
```bash
npm run generate:friendly "https://exemplo.com" "usuario" "senha"
```

### Verificar se MinIO está funcionando:

O sistema mostrará logs indicando se está usando MinIO ou arquivos locais:

```
☁️ MinIO conectado - Bucket: web-manuals
☁️ Processando imagens com MinIO...
☁️ Imagem enviada para MinIO: screenshot_1.png
```

Ou se não estiver configurado:
```
🔄 MinIO não disponível, usando arquivos locais
📁 Usando arquivos locais...
```

## 📁 Estrutura de pastas no MinIO

```
meu-bucket/
├── main-screenshots/
│   ├── uuid-screenshot_main.png
│   └── uuid-screenshot_1.png
├── interaction-screenshots/
│   ├── uuid-screenshot_2.png
│   └── uuid-screenshot_3.png
└── manual-screenshots/
    └── outros arquivos...
```

## 🔧 Funcionalidades avançadas

### Upload manual de diretório completo:
```typescript
import { MinIOService } from './src/services/MinIOService.js';

const minio = MinIOService.createFromEnv();
await minio.initialize();
const uploadMap = await minio.uploadScreenshotDirectory('./output', 'manual-123');
```

### Upload de imagem Base64:
```typescript
const url = await minio.uploadBase64Image(base64String, 'screenshots');
```

## 🚫 Sem MinIO configurado

Se as variáveis MinIO não estiverem configuradas, o sistema:

1. ✅ Funciona normalmente com arquivos locais
2. ✅ Gera manuais com caminhos relativos (`./screenshot_1.png`)
3. ✅ Não gera erros ou problemas

## 🐛 Troubleshooting

### MinIO não conecta:
- Verifique se o endpoint está correto
- Confirme as credenciais de acesso
- Teste a conectividade de rede

### Bucket não existe:
- O sistema cria automaticamente o bucket se não existir
- Verifique permissões de criação de buckets

### Imagens não aparecem no manual:
- Verifique se o bucket tem permissões públicas de leitura
- Confirme se as URLs geradas estão corretas

## 📊 Logs e monitoramento

O sistema gera logs detalhados sobre:
- ✅ Status da conexão MinIO
- 📤 Uploads realizados
- ⚠️ Erros e fallbacks
- 📁 Uso de arquivos locais

Exemplo de output:
```
🤖 Iniciando geração de manual amigável...
✅ MinIO conectado - Bucket: web-manuals
☁️ Processando imagens com MinIO...
☁️ Imagem enviada para MinIO: main-screenshots/uuid-screenshot_main.png
☁️ Imagem enviada para MinIO: interaction-screenshots/uuid-screenshot_2.png
✅ Upload concluído: 3 arquivos processados
✅ Manual amigável gerado com sucesso!
```
