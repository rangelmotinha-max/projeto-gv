// Configuração principal do Express
const express = require('express');
const path = require('path');
const logger = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');
const healthRoutes = require('./routes/healthRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const authRoutes = require('./routes/authRoutes');
const veiculoRoutes = require('./routes/veiculoRoutes');

const app = express();

// Middlewares globais
app.use(express.json());
app.use(logger);

// Arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rotas versionadas
app.use('/api/v1', healthRoutes);
app.use('/api/v1', usuarioRoutes);
app.use('/api/v1', authRoutes);
app.use('/api/v1', veiculoRoutes);

// Fallback simples para rotas não encontradas
app.use((req, res, next) => {
  const error = new Error('Rota não encontrada');
  error.status = 404;
  next(error);
});

// Tratamento centralizado de erros
app.use(errorHandler);

module.exports = app;
