FROM node:18-alpine

# Instala dependências necessárias para compilar o sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências e recompila o sqlite3
RUN npm install --production && \
    npm rebuild sqlite3 --build-from-source

# Copia todo o código
COPY . .

# Cria diretório de dados se não existir
RUN mkdir -p data uploads

# Expõe a porta da aplicação
EXPOSE 3001

# Comando para iniciar
CMD ["npm", "start"]
