# Documentação do Projeto GV

Este documento fornece uma visão geral detalhada da arquitetura, funcionalidades e estrutura do Projeto GV.

## 1. Visão Geral

O Projeto GV é uma aplicação web Full Stack que serve como base para um sistema de gerenciamento. Ele é construído com um backend em **Node.js** e **Express.js**, e um frontend simples em **HTML, CSS e JavaScript puro**.

A aplicação inclui funcionalidades essenciais como:
- Autenticação de usuários.
- Gerenciamento de usuários (CRUD).
- Gerenciamento de veículos com upload de fotos.
- API RESTful para todas as operações do backend.
- Servidor de arquivos estáticos para o frontend e para os uploads.

## 2. Estrutura de Diretórios

A estrutura do projeto é organizada para separar claramente o backend, o frontend, os dados e a documentação.

```
/
├── .env                  # Arquivo para variáveis de ambiente (NÃO versionado)
├── data/                 # Arquivos de banco de dados (SQLite)
├── docs/                 # Documentação adicional (SQL, etc.)
├── public/               # Código do frontend (HTML, CSS, JS)
├── scripts/              # Scripts de utilidade (ex: inicializar DB)
├── src/                  # Código-fonte do backend (Node.js)
│   ├── app.js            # Arquivo principal de configuração do Express
│   ├── server.js         # Ponto de entrada para iniciar o servidor HTTP
│   ├── config/           # Módulos de configuração (DB, env)
│   ├── controllers/      # Controladores (lógica de requisição/resposta)
│   ├── middlewares/      # Middlewares do Express (logger, auth, errors)
│   ├── routes/           # Definições de rotas da API
│   └── services/         # Lógica de negócio e acesso a dados
└── uploads/              # Arquivos enviados pelos usuários (ex: fotos)
```

## 3. Backend (Node.js)

O backend é construído com Express.js e segue uma arquitetura modular.

### 3.1. API Endpoints

A API é versionada sob o prefixo `/api/v1`.

- **Autenticação**
  - `POST /api/v1/login`: Autentica um usuário e retorna um token (se aplicável).
- **Health Check**
  - `GET /api/v1/health`: Verifica o status da aplicação.
- **Usuários** (`/api/v1/usuarios`)
  - `GET /`: Lista todos os usuários.
  - `GET /:id`: Obtém um usuário por ID.
  - `POST /`: Cria um novo usuário.
  - `PUT /:id`: Atualiza um usuário.
  - `DELETE /:id`: Deleta um usuário.
- **Veículos** (`/api/v1/veiculos`)
  - `GET /`: Lista todos os veículos.
  - `POST /`: Cria um novo veículo (com upload de fotos).
  - ... (outros endpoints CRUD)

### 3.2. Middlewares Principais

- `express.json()`: Faz o parse de corpos de requisição JSON.
- `logger`: Middleware customizado para logar requisições.
- `rateLimit`: Limita o número de tentativas de login para mitigar ataques de força bruta.
- `errorHandler`: Captura e trata todos os erros de forma centralizada.
- `upload`: Middleware (usando `multer`) para processar uploads de arquivos.

### 3.3. Banco de Dados

- O sistema utiliza **SQLite** como banco de dados, o que o torna leve e fácil de configurar.
- O arquivo do banco de dados está localizado em `data/database.sqlite`.
- Os scripts para criação das tabelas estão em `docs/sqlite/`.
- O script `scripts/init-sqlite.js` pode ser usado para inicializar o banco de dados do zero.

## 4. Frontend

O frontend é intencionalmente simples, consistindo em arquivos HTML, CSS e JavaScript estáticos servidos pelo backend.

- `public/index.html`: Página inicial/login.
- `public/home.html`: Dashboard principal após o login.
- `public/cadastro.html`: Página de cadastro de itens.
- `public/css/styles.css`: Folha de estilos principal.
- `public/js/main.js`: Lógica JavaScript do lado do cliente (ex: chamadas de API).

## 5. Regras de Negócio

Esta seção detalha as principais regras e validações implementadas no sistema, agrupadas por funcionalidade.

### 5.1. Autenticação

- **Formato das Credenciais**:
  - A `matrícula` deve conter exatamente 8 dígitos numéricos.
  - A `senha` deve conter exatamente 4 dígitos numéricos.
- **Segurança**:
  - O sistema implementa um limite de taxa (rate limit) para o endpoint de login. São permitidas no máximo **5 tentativas de login a cada 5 minutos** por endereço de IP para prevenir ataques de força bruta.

### 5.2. Gestão de Veículos

- **Validação de Dados**:
  - **Placa**: Deve seguir o formato padrão brasileiro (antigo `ABC1234` ou Mercosul `ABC1X23`). A validação não diferencia maiúsculas de minúsculas e remove caracteres especiais.
  - **Placa Duplicada**: Não é permitido cadastrar um veículo com uma placa que já existe no sistema.
  - **Ano de Fabricação**: Deve ser um ano válido, entre 1970 e o ano atual + 1.
  - **Status**: O status de um veículo deve ser um dos seguintes valores: `BASE`, `BAIXADA`, `OFICINA`, `ATIVA`.
  - **Quilometragem (KM)**: Os valores de `kmAtual` e `proximaRevisaoKm` devem ser numéricos e não negativos.
- **Histórico de KM**:
  - Ao registrar uma nova leitura de KM para um veículo, o valor informado **não pode ser inferior** à última leitura registrada para aquele veículo.
  - O campo `km_atual` na tabela principal do veículo é atualizado automaticamente com a nova leitura, mas somente se ela for superior à atual.

### 5.3. Uploads de Arquivos

O sistema de upload de arquivos para veículos possui as seguintes regras, gerenciadas pelo middleware `upload`:

- **Limites Gerais**:
  - **Tamanho Máximo por Arquivo**: 25 MB.
  - **Quantidade Máxima de Arquivos**: 20 por requisição.
- **Manuais (campo `manual`)**:
  - **Formatos Permitidos**: PDF (`.pdf`) e Documentos Word (`.doc`, `.docx`).
- **Fotos (campo `fotos`)**:
  - **Formatos Permitidos**: Apenas arquivos de imagem (ex: `.jpg`, `.png`, `.gif`).

## 6. Como Começar

Consulte o `README.md` para instruções rápidas sobre instalação e execução do projeto.
