#!/bin/bash
# Script para testar conectividade do servidor

echo "=============================================="
echo "  Diagnóstico de Conectividade - SGV"
echo "=============================================="
echo ""

echo "🔍 1. Verificando se o servidor está rodando na porta 80..."
if lsof -i :80 > /dev/null 2>&1; then
  echo "✅ Servidor ESTÁ rodando na porta 80"
  lsof -i :80 | grep LISTEN
else
  echo "❌ Servidor NÃO está rodando na porta 80"
  echo "   Execute: sudo ./deploy-porta80.sh"
fi

echo ""
echo "🔍 2. Testando conexão em localhost:80..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:80 > /tmp/curl_test 2>&1; then
  HTTP_CODE=$(cat /tmp/curl_test)
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "404" ]; then
    echo "✅ Servidor responde em localhost:80 (HTTP $HTTP_CODE)"
  else
    echo "⚠️  Servidor responde mas com código: $HTTP_CODE"
  fi
else
  echo "❌ Servidor NÃO responde em localhost:80"
fi

echo ""
echo "🔍 3. Testando conexão em 0.0.0.0:80..."
if curl -s -o /dev/null -w "%{http_code}" http://0.0.0.0:80 > /tmp/curl_test2 2>&1; then
  HTTP_CODE=$(cat /tmp/curl_test2)
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "404" ]; then
    echo "✅ Servidor responde em 0.0.0.0:80 (HTTP $HTTP_CODE)"
  else
    echo "⚠️  Servidor responde mas com código: $HTTP_CODE"
  fi
else
  echo "❌ Servidor NÃO responde em 0.0.0.0:80"
fi

echo ""
echo "🔍 4. Verificando interfaces de rede..."
ip addr show | grep "inet " | grep -v "127.0.0.1"

echo ""
echo "🔍 5. Verificando Cloudflare Tunnel..."
if pgrep -x "cloudflared" > /dev/null; then
  echo "✅ Cloudflare Tunnel (cloudflared) está rodando"
  pgrep -a cloudflared
else
  echo "⚠️  Cloudflare Tunnel (cloudflared) NÃO está rodando"
  echo "   O túnel precisa estar ativo para nabavoadora.xyz funcionar"
fi

echo ""
echo "=============================================="
echo "  Resumo"
echo "=============================================="
echo ""
echo "Para o nabavoadora.xyz funcionar, você precisa:"
echo "  1. ✓ Servidor rodando na porta 80"
echo "  2. ✓ Servidor respondendo em 0.0.0.0"
echo "  3. ✓ Cloudflare Tunnel ativo"
echo "  4. ✓ Túnel configurado para http://localhost:80"
echo ""
