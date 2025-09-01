# Guia de Solução de Problemas - Manual Generator

## 🚨 Problemas Comuns e Soluções

### 1. Problemas de Autenticação

#### ❌ Erro: "Invalid API Key"

**Sintomas:**
```
Error: Invalid API key provided for Gemini AI
Status: 401 Unauthorized
```

**Soluções:**
1. Verifique se a chave API está correta no arquivo `.env`
2. Confirme se a chave não expirou
3. Teste a chave diretamente:

```bash
curl -H "Authorization: Bearer $GOOGLE_API_KEY" \
     "https://generativelanguage.googleapis.com/v1/models"
```

#### ❌ Erro: "Quota Exceeded"

**Sintomas:**
```
Error: Quota exceeded for requests per minute
Status: 429 Too Many Requests
```

**Soluções:**
1. Configure múltiplas chaves API no `.env`:
```env
GEMINI_API_KEY_1=AIzaSy...
GEMINI_API_KEY_2=AIzaSy...
GEMINI_API_KEY_3=AIzaSy...
```

2. Ajuste os limites de retry:
```env
GEMINI_MAX_RETRIES=10
GEMINI_BASE_WAIT_TIME=5000
```

### 2. Problemas de Login

#### ❌ Erro: "Login Failed"

**Sintomas:**
```
Login attempt failed: Could not find login form
Falling back to SmartLoginAgent...
```

**Diagnóstico:**
```bash
# Execute com debug habilitado
DEBUG=true npm run start -- --url "https://example.com" --username "user" --password "pass"
```

**Soluções:**
1. Verifique se a URL de login está correta
2. Confirme os seletores CSS:

```typescript
// Teste manual dos seletores
const loginConfig = {
  credentials: {
    username: 'user@example.com',
    password: 'password',
    loginUrl: 'https://example.com/login',
    customSelectors: {
      usernameField: 'input[name="email"]',
      passwordField: 'input[name="password"]',
      submitButton: 'button[type="submit"]'
    }
  }
};
```

3. Use o SmartLoginAgent para sites complexos:
```typescript
const smartLoginConfig = {
  useSmartLogin: true,
  loginTimeout: 30000,
  waitForNavigation: true
};
```

#### ❌ Erro: "CAPTCHA Detected"

**Sintomas:**
```
CAPTCHA detected on login page
Manual intervention required
```

**Soluções:**
1. Configure bypass de CAPTCHA (se disponível):
```env
BYPASS_CAPTCHA=true
CAPTCHA_SOLVER_API_KEY=your_key
```

2. Use credenciais de teste sem CAPTCHA
3. Configure User-Agent específico:
```env
CUSTOM_USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
```

### 3. Problemas de Crawling

#### ❌ Erro: "Page Timeout"

**Sintomas:**
```
Timeout waiting for page to load
Navigation timeout of 30000ms exceeded
```

**Soluções:**
1. Aumente o timeout:
```env
PAGE_TIMEOUT=60000
NAVIGATION_TIMEOUT=120000
```

2. Configure estratégia de wait:
```typescript
const crawlConfig = {
  waitUntil: 'networkidle0',
  timeout: 60000,
  retryOnTimeout: true
};
```

#### ❌ Erro: "Memory Leak"

**Sintomas:**
```
JavaScript heap out of memory
Process killed due to memory usage
```

**Soluções:**
1. Limite páginas concorrentes:
```env
MAX_CONCURRENT_PAGES=1
```

2. Configure garbage collection:
```bash
node --max-old-space-size=4096 --expose-gc dist/main.js
```

3. Implemente limpeza de recursos:
```typescript
// No código do crawler
after(async () => {
  await browser.close();
  if (global.gc) global.gc();
});
```

### 4. Problemas de Storage (MinIO/S3)

#### ❌ Erro: "Connection Refused"

**Sintomas:**
```
Error: connect ECONNREFUSED 127.0.0.1:9000
MinIO connection failed
```

**Diagnóstico:**
```bash
# Teste conectividade
telnet minio-endpoint 9000

# Teste credenciais
mc alias set myminio http://minio-endpoint:9000 ACCESS_KEY SECRET_KEY
mc ls myminio
```

**Soluções:**
1. Verifique configurações de rede:
```env
MINIO_ENDPOINT=minio-s3.pmfi.pr.gov.br
MINIO_PORT=443
MINIO_USE_SSL=true
```

2. Configure proxy se necessário:
```env
HTTP_PROXY=http://proxy:8080
HTTPS_PROXY=http://proxy:8080
```

#### ❌ Erro: "Access Denied"

**Sintomas:**
```
Error: Access Denied
Bucket policy doesn't allow this operation
```

**Soluções:**
1. Verifique permissões do bucket:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": "*"},
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::bucket-name/*"
    }
  ]
}
```

2. Configure credenciais corretas:
```env
MINIO_ACCESS_KEY=correct_access_key
MINIO_SECRET_KEY=correct_secret_key
```

### 5. Problemas de Performance

#### ❌ Problema: "Processamento Lento"

**Sintomas:**
- Geração de manual demora mais de 30 minutos
- Alto uso de CPU/memória
- Timeouts frequentes

**Otimizações:**

1. **Paralelização:**
```typescript
const optimizedConfig = {
  maxConcurrentPages: 3,
  enableParallelProcessing: true,
  batchSize: 5
};
```

2. **Cache Inteligente:**
```env
ENABLE_CACHE=true
CACHE_TTL=3600
CACHE_STRATEGY=aggressive
```

3. **Otimização de Screenshots:**
```env
SCREENSHOT_QUALITY=70
SCREENSHOT_FORMAT=webp
ENABLE_SCREENSHOT_COMPRESSION=true
```

#### ❌ Problema: "Alto Uso de Memória"

**Monitoramento:**
```bash
# Monitore uso de memória
ps aux | grep node
top -p $(pgrep node)

# Use ferramentas de profiling
node --inspect dist/main.js
```

**Otimizações:**
```typescript
// Configuração de memória
const memoryConfig = {
  maxOldSpaceSize: 4096,
  enableGC: true,
  gcInterval: 100,
  streamProcessing: true
};
```

### 6. Problemas de Rede

#### ❌ Erro: "DNS Resolution Failed"

**Sintomas:**
```
Error: getaddrinfo ENOTFOUND example.com
DNS lookup failed
```

**Soluções:**
1. Configure DNS customizado:
```env
DNS_SERVERS=8.8.8.8,8.8.4.4
```

2. Use IP direto temporariamente:
```bash
# Teste com IP
nslookup example.com
ping 192.168.1.100
```

#### ❌ Erro: "SSL Certificate Error"

**Sintomas:**
```
Error: unable to verify the first certificate
SSL handshake failed
```

**Soluções:**
1. Configure certificados:
```env
NODE_TLS_REJECT_UNAUTHORIZED=0  # Apenas para desenvolvimento!
CA_BUNDLE_PATH=/path/to/ca-bundle.crt
```

2. Use proxy com certificados válidos:
```env
HTTPS_PROXY=https://proxy-with-valid-certs:8080
```

### 7. Problemas de Geração de Conteúdo

#### ❌ Erro: "Content Generation Failed"

**Sintomas:**
```
Error: Failed to generate content for section
AI response parsing failed
```

**Diagnóstico:**
```bash
# Execute com logs detalhados
LOG_LEVEL=debug npm run start

# Verifique logs de AI
tail -f logs/ai-responses.log
```

**Soluções:**
1. Configure fallback de modelos:
```env
PRIMARY_MODEL=gemini-pro
FALLBACK_MODEL=gpt-3.5-turbo
ENABLE_MODEL_FALLBACK=true
```

2. Ajuste parâmetros de geração:
```typescript
const generationConfig = {
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.9,
  retryOnError: true,
  maxRetries: 3
};
```

#### ❌ Erro: "Invalid JSON Response"

**Sintomas:**
```
SyntaxError: Unexpected token '#' in JSON
Failed to parse AI response
```

**Soluções:**
1. Configure prompt mais específico:
```typescript
const promptConfig = {
  enforceJsonFormat: true,
  includeJsonSchema: true,
  validateResponse: true
};
```

2. Implemente parser robusto:
```typescript
function parseAIResponse(response: string) {
  try {
    // Remove comentários e caracteres inválidos
    const cleaned = response
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .replace(/^[^{]*/, '')
      .replace(/[^}]*$/, '');
    
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return null;
  }
}
```

## 🔧 Ferramentas de Diagnóstico

### Script de Diagnóstico Automático

```bash
#!/bin/bash
# diagnostic.sh

echo "=== Manual Generator Diagnostic ==="

# Verificar dependências
echo "Checking dependencies..."
node --version
npm --version

# Verificar variáveis de ambiente
echo "Checking environment variables..."
if [ -z "$GOOGLE_API_KEY" ]; then
  echo "❌ GOOGLE_API_KEY not set"
else
  echo "✅ GOOGLE_API_KEY configured"
fi

# Verificar conectividade
echo "Checking connectivity..."
curl -s https://generativelanguage.googleapis.com/v1/models > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ Gemini API accessible"
else
  echo "❌ Gemini API not accessible"
fi

# Verificar MinIO
if [ ! -z "$MINIO_ENDPOINT" ]; then
  echo "Checking MinIO connectivity..."
  nc -z $MINIO_ENDPOINT $MINIO_PORT
  if [ $? -eq 0 ]; then
    echo "✅ MinIO accessible"
  else
    echo "❌ MinIO not accessible"
  fi
fi

# Verificar espaço em disco
echo "Checking disk space..."
df -h .

# Verificar memória
echo "Checking memory..."
free -h

echo "=== Diagnostic Complete ==="
```

### Logs de Debug

```bash
# Habilitar logs detalhados
export DEBUG=manual-generator:*
export LOG_LEVEL=debug

# Executar com logs
npm run start 2>&1 | tee debug.log

# Analisar logs
grep "ERROR" debug.log
grep "TIMEOUT" debug.log
grep "MEMORY" debug.log
```

### Monitoramento em Tempo Real

```bash
# Monitor de recursos
watch -n 1 'ps aux | grep node | head -5'

# Monitor de rede
netstat -tuln | grep :3000

# Monitor de logs
tail -f logs/manual-generator.log | grep -E "(ERROR|WARN|TIMEOUT)"
```

## 📞 Suporte

### Informações para Suporte

Quando reportar um problema, inclua:

1. **Versão do sistema:**
```bash
node --version
npm --version
cat package.json | grep version
```

2. **Configuração (sem credenciais):**
```bash
env | grep -E "(GOOGLE|MINIO|LOG)" | sed 's/=.*/=****/'
```

3. **Logs relevantes:**
```bash
tail -100 logs/manual-generator.log
```

4. **Informações do sistema:**
```bash
uname -a
df -h
free -h
```

### Canais de Suporte

- **Issues GitHub:** Para bugs e melhorias
- **Documentação:** README.md e TECHNICAL_GUIDE.md
- **Logs:** Sempre inclua logs relevantes
- **Reprodução:** Passos para reproduzir o problema

---

*Guia de Troubleshooting - Manual Generator v2.0*