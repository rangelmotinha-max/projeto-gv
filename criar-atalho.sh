#!/bin/bash
# Script para criar atalho na área de trabalho

PROJETO_DIR="/home/user/Downloads/sistemas/SISTEMAS/projeto-gv"
DESKTOP_DIR="$HOME/Desktop"

# Se Desktop não existe, tenta Área de Trabalho
if [ ! -d "$DESKTOP_DIR" ]; then
  DESKTOP_DIR="$HOME/Área de Trabalho"
fi

# Se ainda não existe, usa o padrão do XDG
if [ ! -d "$DESKTOP_DIR" ]; then
  DESKTOP_DIR=$(xdg-user-dir DESKTOP 2>/dev/null || echo "$HOME/Desktop")
fi

# Cria o diretório se não existir
mkdir -p "$DESKTOP_DIR"

ATALHO_FILE="$DESKTOP_DIR/SGV-Sistema.desktop"

echo "📝 Criando atalho em: $ATALHO_FILE"

cat > "$ATALHO_FILE" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=SGV - Sistema de Gestão de Viaturas
Comment=Inicia o Sistema de Gestão de Viaturas na porta 80
Exec=bash -c 'cd $PROJETO_DIR && sudo ./deploy-porta80.sh; echo ""; echo "Pressione ENTER para fechar..."; read'
Icon=applications-internet
Terminal=true
Categories=Application;Network;
EOF

# Torna o atalho executável
chmod +x "$ATALHO_FILE"

# Torna os scripts executáveis também
chmod +x "$PROJETO_DIR/deploy-porta80.sh"
chmod +x "$PROJETO_DIR/parar-porta80.sh"

echo "✅ Atalho criado com sucesso!"
echo ""
echo "📍 Localização: $ATALHO_FILE"
echo ""
echo "💡 Instruções:"
echo "  1. Clique duas vezes no atalho 'SGV - Sistema de Gestão de Viaturas'"
echo "  2. Digite sua senha sudo quando solicitado"
echo "  3. Aguarde o servidor iniciar"
echo "  4. Acesse localmente: http://localhost"
echo "  5. Acesse externamente: https://nabavoadora.xyz"
echo ""
echo "⚠️  O atalho SEMPRE usará o código mais recente do projeto!"
