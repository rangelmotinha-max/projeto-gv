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

```bash
# Inicia com node
npm start
```

## Endpoints disponíveis

- `GET /api/v1/health` → retorna `{ "status": "ok", "timestamp": "<ISO>" }`

## Teste rápido no navegador

1. Inicie o servidor.
2. Acesse `http://localhost:3000`.
3. Clique no botão **“Testar API”**.
4. Verifique o resultado exibido na tela.

## Estrutura do projeto

```
public/          # Frontend estático
src/             # Backend Node.js + Express
```
