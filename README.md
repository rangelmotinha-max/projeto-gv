# Projeto GV - Base Web

Estrutura inicial de um sistema web com Node.js + Express e frontend em HTML/CSS/JS.

## Requisitos

- Node.js 18+
- npm

## Como instalar

```bash
# Instale as dependências
npm i
```

## Como rodar em desenvolvimento

```bash
# Inicia com nodemon
npm run dev
```

## Como rodar em produção

**O sistema está configurado para rodar na PORTA 80 (requer sudo)**

### Método 1: Script automatizado (Recomendado)

```bash
sudo ./deploy-porta80.sh
```

### Método 2: Atalho da Área de Trabalho

```bash
# Criar o atalho (execute apenas uma vez)
./criar-atalho.sh

# Depois, clique no atalho "SGV - Sistema de Gestão de Viaturas" na área de trabalho
```

### Método 3: Manual

```bash
sudo npm start
```

**⚠️ IMPORTANTE:** 
- O sistema **sempre usa a porta 80**
- É necessário **sudo** (portas < 1024 requerem privilégios de administrador)
- O atalho da área de trabalho **sempre usa o código mais recente**
- Após atualizações, limpe o cache do navegador: **Ctrl + Shift + R**

📖 Ver [ATUALIZAR-PORTA80.md](./ATUALIZAR-PORTA80.md) para instruções detalhadas.

## Endpoints disponíveis

- `GET /api/v1/health` → retorna `{ "status": "ok", "timestamp": "<ISO>" }`

## Teste rápido no navegador

1. Inicie o servidor: `sudo ./deploy-porta80.sh`
2. Acesse `http://localhost`
3. Faça login e teste as funcionalidades

**Teste de Autocompletar:**
- Acesse: http://localhost/teste-autocomplete.html
- Execute o diagnóstico automático
- Teste o campo de busca

**⚠️ Problema com cache?** Veja: [RESOLVER-CACHE.md](./RESOLVER-CACHE.md)

## Estrutura do projeto

```
public/          # Frontend estático
src/             # Backend Node.js + Express
```
