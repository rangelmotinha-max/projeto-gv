# 🔧 Como Resolver Problema de Cache do Navegador

## 🎯 Problema

O autocompletar não funciona mesmo com o servidor rodando? O problema é **cache do navegador**.

## ✅ Soluções (Em Ordem de Eficácia)

### 1. Hard Refresh (Mais Rápido)

**Pressione simultaneamente:**
- **Chrome/Edge/Brave:** `Ctrl + Shift + R` ou `Ctrl + F5`
- **Firefox:** `Ctrl + Shift + R` ou `Ctrl + F5`

Isso recarrega a página **ignorando o cache**.

### 2. Limpar Cache Completo

#### Chrome / Edge / Brave

1. Pressione: `Ctrl + Shift + Del`
2. Selecione:
   - ⏰ **Período:** "Todo o período" ou "Última hora"  
   - ✅ **Imagens e arquivos em cache**
   - ✅ **Cookies e dados do site** (opcional)
3. Clique: **Limpar dados**

#### Firefox

1. Pressione: `Ctrl + Shift + Del`  
2. Selecione:
   - ⏰ **Período:** "Tudo"
   - ✅ **Cache**  
   - ✅ **Cookies** (opcional)
3. Clique: **OK**

### 3. Modo Anônimo/Privado (Para Testar)

Use o modo anônimo que sempre carrega arquivos frescos:
- **Chrome/Edge:** `Ctrl + Shift + N`
- **Firefox:** `Ctrl + Shift + P`

### 4. Desabilitar Cache (DevTools)

1. Pressione `F12` (abrir DevTools)
2. Vá em **Network** (Rede)
3. Marque ☑️ **Disable cache**
4. Mantenha DevTools aberto e recarregue

### 5. Limpar Cache de um Site Específico

#### Chrome / Edge

1. Clique no **cadeado** 🔒 ao lado da URL
2. Clique em **Configurações do site**
3. Role até **Limpar dados**
4. Clique em **Limpar**

## 🧪 Testar se o Cache Foi Limpo

1. Acesse: http://localhost/teste-autocomplete.html
2. Execute o diagnóstico
3. Se mostrar os veículos, o cache foi limpo!

## 📋 Checklist Completo

Siga na ordem:

- [ ] 1. Servidor está rodando? (`sudo lsof -i :80`)
- [ ] 2. Hard Refresh: `Ctrl + Shift + R`
- [ ] 3. Testou em: http://localhost/teste-autocomplete.html
- [ ] 4. Se ainda não funciona: Limpar cache completo
- [ ] 5. Se ainda não funciona: Testar em modo anônimo
- [ ] 6. Se funciona em anônimo: problema é definitivamente cache

## 🔄 Fluxo Recomendado Após Atualizar Código

```bash
# 1. Parar servidor antigo
sudo ./parar-porta80.sh

# 2. Iniciar servidor atualizado
sudo ./deploy-porta80.sh

# 3. No navegador: Hard Refresh
# Pressione: Ctrl + Shift + R

# 4. Testar diagnóstico
# Acesse: http://localhost/teste-autocomplete.html
```

## 💡 Por Que Isso Acontece?

Os navegadores **guardam arquivos JavaScript/CSS em cache** para acelerar o carregamento. Quando você atualiza o código no servidor, o navegador continua usando a versão antiga em cache.

## 🚨 Se Nada Funcionar

Se mesmo após limpar o cache nada funcionar:

```bash
# Verificar se o servidor está realmente rodando
sudo lsof -i :80

# Verificar se o arquivo está correto
curl -s http://localhost/js/main.js | grep -c "buildSuggestions"
# Deve retornar: 6 (ou mais)

# Testar API diretamente
curl -s http://localhost/api/v1/veiculos | head -20
# Deve mostrar JSON com veículos
```

Se a API não responder, o servidor está com problema. Reinicie:

```bash
sudo ./parar-porta80.sh
sudo ./deploy-porta80.sh
```

---

**Atalho:** Para testar rapidamente, sempre use `Ctrl + Shift + R` após cada atualização!
