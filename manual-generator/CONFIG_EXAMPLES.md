# Exemplos de Configuração - Manual Generator

## 📋 Configurações por Cenário

### 1. Configuração Básica (Desenvolvimento)

```env
# .env - Configuração mínima para desenvolvimento
GOOGLE_API_KEY=AIzaSyBSbrE6vZ8ARSVQVhLKoUUEehuyaPG59Es

# Configurações opcionais
LOG_LEVEL=info
DEBUG=false
```

### 2. Configuração Avançada (Produção)

```env
# .env - Configuração completa para produção

# === GEMINI AI CONFIGURATION ===
GOOGLE_API_KEY=AIzaSyBSbrE6vZ8ARSVQVhLKoUUEehuyaPG59Es

# Sistema de Rotação de Chaves (Recomendado)
GEMINI_API_KEY_1=AIzaSyBSbrE6vZ8ARSVQVhLKoUUEehuyaPG59Es
GEMINI_API_KEY_2=AIzaSyDyAm5Dz_1HKsxu1LxZtvVrzzGbDWQpi3g
GEMINI_API_KEY_3=AIzaSyDFnPXGMrv-RAz9ErnnsXGb-25GtlPgfm0
GEMINI_API_KEY_4=AIzaSyC...
GEMINI_API_KEY_5=AIzaSyD...

# Configurações de Retry
GEMINI_MAX_RETRIES=10
GEMINI_BASE_WAIT_TIME=2000
GEMINI_MAX_WAIT_TIME=60000

# === GROQ CONFIGURATION ===
GROQ_API_KEY=gsk_...
GROQ_MODEL=mixtral-8x7b-32768
GROQ_MAX_TOKENS=32768

# === MINIO/S3 CONFIGURATION ===
MINIO_ENDPOINT=minio-s3.pmfi.pr.gov.br
MINIO_ACCESS_KEY=kntBkLK0a4vk1aDWOdBD
MINIO_SECRET_KEY=YlrjuLdLyjf33kKOa4c9kFpsJLWkEIUcifzy5pRH
MINIO_BUCKET_NAME=documentacao
MINIO_SECURE=true
MINIO_REGION=us-east-1

# === FIRECRAWL CONFIGURATION ===
FIRECRAWL_API_KEY=fc-941e1fe26deb4f57963f42bb49c8d555

# === LOGGING CONFIGURATION ===
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE=logs/manual-generator.log

# === PERFORMANCE CONFIGURATION ===
MAX_CONCURRENT_PAGES=3
PAGE_TIMEOUT=30000
NAVIGATION_TIMEOUT=60000
SCREENSHOT_QUALITY=80

# === SECURITY CONFIGURATION ===
ENABLE_SANDBOX=true
ALLOW_EXTERNAL_SCRIPTS=false
MAX_FILE_SIZE=50MB
```

### 3. Configuração para Amazon S3

```env
# Configuração para usar Amazon S3
MINIO_ENDPOINT=s3.amazonaws.com
MINIO_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
MINIO_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
MINIO_BUCKET_NAME=my-manual-generator-bucket
MINIO_SECURE=true
MINIO_REGION=us-west-2
```

### 4. Configuração para DigitalOcean Spaces

```env
# Configuração para DigitalOcean Spaces
MINIO_ENDPOINT=nyc3.digitaloceanspaces.com
MINIO_ACCESS_KEY=your_spaces_access_key
MINIO_SECRET_KEY=your_spaces_secret_key
MINIO_BUCKET_NAME=my-manuals-space
MINIO_SECURE=true
MINIO_REGION=nyc3
```

## 🎯 Configurações por Tipo de Site

### Sites Públicos (Sem Login)

```typescript
// Configuração para sites públicos
const publicSiteConfig: OrchestrationConfig = {
  targetUrl: 'https://docs.example.com',
  maxRetries: 3,
  timeoutMinutes: 15,
  enableScreenshots: true,
  outputFormats: ['markdown', 'pdf'],
  crawlingStrategy: 'basic',
  // Sem credenciais
  credentials: undefined
};
```

### Sites com Login Simples

```typescript
// Configuração para sites com login básico
const loginSiteConfig: OrchestrationConfig = {
  targetUrl: 'https://app.example.com/dashboard',
  maxRetries: 5,
  timeoutMinutes: 20,
  enableScreenshots: true,
  outputFormats: ['markdown', 'html', 'pdf'],
  crawlingStrategy: 'advanced',
  credentials: {
    username: 'user@example.com',
    password: 'secure_password',
    loginUrl: 'https://app.example.com/login'
  }
};
```

### Sites com Login Customizado

```typescript
// Configuração para sites com fluxo de login complexo
const customLoginConfig: OrchestrationConfig = {
  targetUrl: 'https://complex-app.example.com',
  maxRetries: 5,
  timeoutMinutes: 25,
  enableScreenshots: true,
  outputFormats: ['markdown', 'pdf'],
  crawlingStrategy: 'advanced',
  credentials: {
    username: 'admin@company.com',
    password: 'complex_password_123',
    loginUrl: 'https://complex-app.example.com/auth/login',
    customSteps: [
      {
        type: 'waitForSelector',
        selector: '#login-form',
        timeout: 5000
      },
      {
        type: 'fill',
        selector: 'input[name="email"]',
        value: 'admin@company.com'
      },
      {
        type: 'fill',
        selector: 'input[name="password"]',
        value: 'complex_password_123'
      },
      {
        type: 'click',
        selector: 'button[type="submit"]'
      },
      {
        type: 'waitForSelector',
        selector: '.dashboard',
        timeout: 10000
      }
    ]
  }
};
```

## 🔧 Configurações de Performance

### Alta Performance (Recursos Abundantes)

```typescript
const highPerformanceConfig = {
  maxConcurrentPages: 5,
  pageTimeout: 60000,
  navigationTimeout: 120000,
  screenshotQuality: 100,
  enableParallelProcessing: true,
  cacheStrategy: 'aggressive',
  retryStrategy: {
    maxRetries: 10,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2
  }
};
```

### Recursos Limitados

```typescript
const lowResourceConfig = {
  maxConcurrentPages: 1,
  pageTimeout: 30000,
  navigationTimeout: 45000,
  screenshotQuality: 60,
  enableParallelProcessing: false,
  cacheStrategy: 'conservative',
  retryStrategy: {
    maxRetries: 3,
    baseDelay: 2000,
    maxDelay: 15000,
    backoffFactor: 1.5
  }
};
```

## 🎨 Configurações de Output

### Documentação Técnica

```typescript
const technicalDocsConfig = {
  outputFormats: ['markdown', 'html'],
  includeCodeBlocks: true,
  includeScreenshots: true,
  screenshotAnnotations: true,
  detailLevel: 'high',
  includeMetadata: true,
  generateIndex: true,
  customTemplates: {
    markdown: 'templates/technical.md.hbs',
    html: 'templates/technical.html.hbs'
  }
};
```

### Manual de Usuário

```typescript
const userManualConfig = {
  outputFormats: ['pdf', 'html'],
  includeCodeBlocks: false,
  includeScreenshots: true,
  screenshotAnnotations: true,
  detailLevel: 'medium',
  language: 'user-friendly',
  includeStepByStep: true,
  customTemplates: {
    pdf: 'templates/user-manual.pdf.hbs',
    html: 'templates/user-manual.html.hbs'
  }
};
```

### Relatório Executivo

```typescript
const executiveReportConfig = {
  outputFormats: ['pdf'],
  includeCodeBlocks: false,
  includeScreenshots: false,
  detailLevel: 'low',
  focusOnFeatures: true,
  includeMetrics: true,
  executiveSummary: true,
  customTemplates: {
    pdf: 'templates/executive-report.pdf.hbs'
  }
};
```

## 🔐 Configurações de Segurança

### Ambiente Corporativo

```env
# Configurações de segurança para ambiente corporativo
ENABLE_SANDBOX=true
ALLOW_EXTERNAL_SCRIPTS=false
MAX_FILE_SIZE=100MB
ENABLE_CONTENT_FILTERING=true
BLOCK_SUSPICIOUS_DOMAINS=true
ENABLE_AUDIT_LOGGING=true
AUDIT_LOG_LEVEL=detailed
ENCRYPT_STORED_DATA=true
SESSION_TIMEOUT=3600
MAX_LOGIN_ATTEMPTS=3
```

### Ambiente de Desenvolvimento

```env
# Configurações relaxadas para desenvolvimento
ENABLE_SANDBOX=false
ALLOW_EXTERNAL_SCRIPTS=true
MAX_FILE_SIZE=500MB
ENABLE_CONTENT_FILTERING=false
BLOCK_SUSPICIOUS_DOMAINS=false
ENABLE_AUDIT_LOGGING=false
DEBUG_MODE=true
VERBOSE_LOGGING=true
```

## 🌐 Configurações de Proxy

### Proxy Corporativo

```env
# Configurações de proxy
HTTP_PROXY=http://proxy.company.com:8080
HTTPS_PROXY=http://proxy.company.com:8080
NO_PROXY=localhost,127.0.0.1,.company.com
PROXY_AUTH_USER=proxy_user
PROXY_AUTH_PASS=proxy_password
```

### Configuração no Playwright

```typescript
// playwright.config.ts
export default {
  use: {
    proxy: {
      server: 'http://proxy.company.com:8080',
      username: process.env.PROXY_AUTH_USER,
      password: process.env.PROXY_AUTH_PASS
    }
  }
};
```

## 📊 Configurações de Monitoramento

### Métricas Detalhadas

```env
# Configurações de monitoramento
ENABLE_METRICS=true
METRICS_ENDPOINT=http://prometheus:9090
METRICS_INTERVAL=30000
ENABLE_HEALTH_CHECK=true
HEALTH_CHECK_PORT=3001
ENABLE_TRACING=true
TRACING_ENDPOINT=http://jaeger:14268
```

### Alertas

```typescript
// Configuração de alertas
const alertConfig = {
  email: {
    enabled: true,
    smtp: {
      host: 'smtp.company.com',
      port: 587,
      secure: false,
      auth: {
        user: 'alerts@company.com',
        pass: 'smtp_password'
      }
    },
    recipients: ['admin@company.com', 'dev-team@company.com']
  },
  slack: {
    enabled: true,
    webhook: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
    channel: '#manual-generator-alerts'
  },
  thresholds: {
    errorRate: 0.1,        // 10% de taxa de erro
    responseTime: 30000,   // 30 segundos
    memoryUsage: 0.8       // 80% de uso de memória
  }
};
```

## 🔄 Configurações de Backup

### Backup Automático

```env
# Configurações de backup
ENABLE_AUTO_BACKUP=true
BACKUP_INTERVAL=86400  # 24 horas em segundos
BACKUP_RETENTION_DAYS=30
BACKUP_STORAGE_TYPE=s3
BACKUP_S3_BUCKET=manual-generator-backups
BACKUP_ENCRYPTION=true
BACKUP_COMPRESSION=true
```

### Configuração de Restore

```typescript
// Configuração de restore
const restoreConfig = {
  source: 's3://manual-generator-backups/2024-01-15/',
  target: './restored-data/',
  includeArtifacts: true,
  includeConfigurations: true,
  includeLogs: false,
  verifyIntegrity: true
};
```

---

*Exemplos de Configuração - Manual Generator v2.0*