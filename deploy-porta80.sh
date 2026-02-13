#!/bin/bash
# Script para deploy do sistema na porta 80
# Execute com: sudo ./deploy-porta80.sh

set -e  # Para em caso de erro

PROJETO_DIR="/home/user/Downloads/sistemas/SISTEMAS/projeto-gv"
PORTA=80
USUARIO_ORIGINAL="${SUDO_USER:-$USER}"

echo "=============================================="
echo "  Deploy do Sistema de Gestão de Viaturas"
echo "=============================================="
echo ""

# Verifica se está rodando como root
if [ "$EUID" -ne 0 ]; then 
   echo "❌ Este script precisa ser executado como root (use sudo)"
   exit 1
fi

# Para qualquer processo rodando na porta 80
echo "🔍 Verificando processos na porta $PORTA..."
PID=$(lsof -ti :$PORTA 2>/dev/null || true)
if [ -n "$PID" ]; then
  echo "⚠️  Encontrado processo na porta $PORTA (PID: $PID)"
  echo "🛑 Encerrando processo..."
  kill -9 $PID 2>/dev/null || true
  sleep 2
  echo "✅ Processo encerrado"
else
  echo "ℹ️  Nenhum processo rodando na porta $PORTA"
fi

# Vai para o diretório do projeto
cd "$PROJETO_DIR"

echo ""
echo "📦 Verificando dependências..."
if [ ! -d "node_modules" ]; then
  echo "⚠️  node_modules não encontrado. Instalando dependências..."
  sudo -u "$USUARIO_ORIGINAL" npm install --production
else
  echo "✅ Dependências já instaladas"
fi

echo ""
echo "🔧 Verificando banco de dados..."
if [ ! -f "$PROJETO_DIR/data/sgv.sqlite" ]; then
  echo "⚠️  Banco de dados não encontrado. Inicializando..."
  node scripts/init-sqlite.js
fi

echo ""
echo "🚀 Iniciando servidor na porta $PORTA..."
echo ""
echo "=============================================="
echo "  🌐 Acesse localmente: http://localhost:$PORTA"
echo "  🌍 Acesse externamente: https://nabavoadora.xyz"
echo "=============================================="
echo ""
echo "💡 Dicas:"
echo "  - Para parar: Ctrl+C ou feche esta janela"
echo "  - Limpar cache do navegador: Ctrl+Shift+Del"
echo ""
echo "📋 Logs do servidor:"
echo "=============================================="
echo ""

# Inicia o servidor em foreground para manter o processo rodando
exec npm start
