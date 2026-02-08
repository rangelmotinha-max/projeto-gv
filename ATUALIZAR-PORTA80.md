# 🔄 Como Usar o Sistema (Porta 80)

Este guia explica como iniciar, parar e atualizar o Sistema de Gestão de Viaturas.

## ⚙️ Configuração

O sistema está configurado para rodar **EXCLUSIVAMENTE na porta 80**.
- ✅ Sempre usa o código mais recente
- ✅ Requer privilégios de administrador (sudo)
- ✅ Acesso via: http://localhost

## ✅ Como Iniciar o Sistema

### Opção 1: Atalho da Área de Trabalho (Mais Fácil)

### Opção 2: Script Automatizado

```bash
cd /home/user/Downloads/sistemas/SISTEMAS/projeto-gv
sudo ./deploy-porta80.sh
```

Este script:
- ✅ Para qualquer processo antigo na porta 80
- ✅ Verifica dependências
- ✅ Inicia o servidor com o código atualizado
- ✅ Mostra o PID do processo

### Opção 3: Manual

```bash
# 1. Parar o servidor (se estiver rodando)
sudo ./parar-porta80.sh

# 2. Iniciar
sudoy-porta80.sh
```

Este script:
- ✅ Para qualquer processo na porta 80
- ✅ Atualiza dependências se necessário
- ✅ Inicia o servidor com o código atualizado
- ✅ Mostra o PID do processo para gerenciamento

### Opção 2: Parar e Iniciar Manualmente

```bash
# 1. Parar o servidor atual
sudo ./parar-porta80.sh

# 2. Iniciar novamente
sudo PORT=80 npm start
```� Após Fazer Alterações no Código

1. **Pare o servidor:**
   ```bash
   sudo ./parar-porta80.sh
   ```

2. **Inicie novamente:**
   ```bash
   sudo ./deploy-porta80.sh
   ```
   **OU** clique no atalho da área de trabalho

3. **Limpe o cache do navegador:**
   - Pressione: **Ctrl + Shift + R** (recarregar forçando)
   - OU: **Ctrl + Shift + Del** (limpar cache completo)

4. **Teste:**
   - Acesse: http://localhost
   - Verifique se as alterações aparecem

Isso criará um atalho chamado **"SGV - Sistema de Gestão de Viaturas"** na sua área de trabalho.

## 🧹 Limpar Cache do Navegador

Mesmo após atualizar o servidor, você pode precisar limpar o cache do navegador:

### Google Chrome / Chromium / Edge

1. Pressione: **Ctrl + Shift + Del**
2. Selecione:
   - ⏰ Período: **Todo o período** ou **Última hora**
   - ✅ Imagens e arquivos em cache
   - ✅ JavaScript e dados salvos (opcional)
3. Clique em **Limpar dados**

**OU** Recarregar forçando cache:
- Pressione: **Ctrl + Shift + R** ou **Ctrl + F5**

### Firefox

2. Faça login
3. Vá para: **Lançar KM**
4. No campo de busca, digite parte do nome (ex: "hilu" para Hilux)
5. Deve aparecer lista de sugestões

Se não aparecer:
- Limpe o cache: **Ctrl + Shift + R**
- Verifique se o servidor está rodando: `sudo lsof -i :80`
**OU** Recarregar forçando:
- Pressione: **Ctrl + Shift + R** ou **Ctrl + F5**

## 🔍 Verificar se Está Funcionando

1. Acesse: http://localhost/lancar-km.html
2. No campo **"Placa / Placa Vinculada / Prefixo / Marca/Modelo"**:
   - Digite parte do nome do veículo (ex: "hilu" para Hilux)
   - Deve aparecer uma lista de sugestões
3. Se não aparecer:
   - Limpe o cache do navegador novamente
   - Verifique se o servidor foi reiniciado

## 📋 Comandos Úteis

```bash
# Ver processos rodando na porta 80
sudo lsof -i :80

# Parar um processo específico
sudo kill -9 <PID>

# Ver logs do servidor em execução
# (se iniciou em background, não há logs diretos)

# Pare o processo existente
sudo ./parar-porta80.sh

# Inicie novamente
sudo ./deployp node
```

## 🐛 Resolução de Problemas

### Erro: "Porta 80 já está em uso"

```bash
# Sempre use sudo
sudo npm start

# OU use o script
sudo ./deploy-porta80.sh

# OU use o atalho da área de trabalho (pede senha automaticamente)
```

### Erro: "Permissão negada na porta 80"

A porta 80 requer privilégios de administrador:

```bash
# Use sudo
sudo PORT=80 npm start

# OU use o script
sudo ./deploy-porta80.sh
```

### Cache não limpa

Use modo anônimo/privado do navegador para testar:
- Chrome: **Ctrl + Shift + N**
- F**Verifique que fez as alterações no projeto correto:**
   ```bash
   cd /home/user/Downloads/sistemas/SISTEMAS/projeto-gv
   cat src/config/env.js | grep "port:"
   ```
   Deve mostrar: `port: process.env.PORT || 80,`

2. **Pare e reinicie o servidor:**
   ```bash
   sudo ./parar-porta80.sh
   sudo ./deploy-porta80.sh
   ```

3. **Limpe cache do navegador:**
  ✅ **O sistema SEMPRE roda na porta 80** (não há mais porta 3000/3001)
- ✅ **Sempre requer sudo** (portas < 1024 precisam de privilégios)
- ✅ **O atalho da área de trabalho sempre usa o código mais recente**
- ✅ **Limpe o cache do navegador** após cada atualização do código
- ✅ **Pare o servidor antigo antes de iniciar um novo**

## 🚀 Fluxo de Trabalho Recomendado

1. ✏️ **Faça alterações no código**
2. 🛑 **Pare o servidor:** `sudo ./parar-porta80.sh`
3. 🚀 **Inicie novamente:** `sudo ./deploy-porta80.sh` ou use o atalho
4. 🧹 **Limpe cache:** **Ctrl + Shift + R** no navegador
5. 🎉 **Teste:**gador** após cada atualização do código
- **Use sudo** para rodar na porta 80 (portas < 1024 precisam de privilégios)
- **Guarde o PID** do processo para poder pará-lo depois

## 🚀 Fluxo de Atualização Recomendado

1. ✏️ Faça alterações no código
2. 🧪 Teste na porta 3000: `PORT=3000 npm start`
3. ✅ Se funcionar, pare o processo (Ctrl+C)
4. 🛑 Pare o servidor na porta 80: `sudo ./parar-porta80.sh`
5. 🚀 Inicie na porta 80: `sudo ./deploy-porta80.sh`
6. 🧹 Limpe cache do navegador: **Ctrl + Shift + Del**
7. 🎉 Teste no navegador: http://localhost

---

**Criado em:** 08/02/2026
**Última atualização:** 08/02/2026
