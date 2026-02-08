#!/bin/bash
# Script para parar o servidor rodando na porta 80

PORTA=80

echo "🔍 Procurando processo na porta $PORTA..."

PID=$(lsof -ti :$PORTA 2>/dev/null || true)

if [ -z "$PID" ]; then
  echo "ℹ️  Nenhum processo rodando na porta $PORTA"
  exit 0
fi

echo "⚠️  Encontrado processo PID: $PID"
echo "🛑 Encerrando..."

if [ "$EUID" -eq 0 ]; then
  kill -9 $PID 2>/dev/null
else
  sudo kill -9 $PID 2>/dev/null
fi

sleep 1

# Verifica se parou
if lsof -ti :$PORTA > /dev/null 2>&1; then
  echo "❌ Falha ao encerrar o processo"
  exit 1
else
  echo "✅ Processo encerrado com sucesso"
fi
