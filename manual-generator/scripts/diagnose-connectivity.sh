#!/bin/bash

echo "🔍 Diagnóstico de Conectividade Firecrawl"
echo "========================================"

echo ""
echo "📊 Informações do Ambiente:"
echo "- Usuário: $(whoami)"
echo "- Sistema: $(uname -a)"
echo "- Proxy HTTP: ${HTTP_PROXY:-'Não configurado'}"
echo "- Proxy HTTPS: ${HTTPS_PROXY:-'Não configurado'}"
echo "- No Proxy: ${no_proxy:-'Não configurado'}"

echo ""
echo "🌐 Testando conectividade básica:"
echo "- ping google.com (3 pacotes):"
ping -c 3 google.com

echo ""
echo "🔗 Testando resolução DNS:"
echo "- nslookup api.firecrawl.dev:"
nslookup api.firecrawl.dev

echo ""
echo "📡 Testando conectividade HTTP para Firecrawl:"
echo "- Método 1: curl direto (máx 10s):"
timeout 10s curl -s -I https://api.firecrawl.dev/v0/scrape || echo "❌ Falhou"

echo ""
echo "- Método 2: curl com informações detalhadas:"
curl -v --max-time 10 https://api.firecrawl.dev/v0/scrape 2>&1 | head -30

echo ""
echo "🧪 Testando outras APIs similares:"
echo "- httpbin.org:"
timeout 5s curl -s -I https://httpbin.org/get && echo "✅ httpbin OK" || echo "❌ httpbin falhou"

echo "- postman-echo.com:"
timeout 5s curl -s -I https://postman-echo.com/get && echo "✅ postman-echo OK" || echo "❌ postman-echo falhou"

echo ""
echo "📋 Possíveis problemas identificados:"
if [ -n "$HTTPS_PROXY" ]; then
    echo "✅ Proxy configurado: $HTTPS_PROXY"
else
    echo "⚠️ Nenhum proxy configurado (pode ser necessário em ambiente corporativo)"
fi

echo ""
echo "🔧 Sugestões de solução:"
echo "1. Verificar se api.firecrawl.dev está liberado no firewall/proxy corporativo"
echo "2. Configurar proxy corretamente se necessário"
echo "3. Usar apenas Puppeteer como alternativa"
echo "4. Contatar administrador de rede para liberar acesso"
