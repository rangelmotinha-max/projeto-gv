// Configuração principal do Express
const express = require('express');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { requireRoles, servePublic } = require('./middlewares/auth');
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

// Limite de tentativas de login (5 tentativas por 5 minutos por IP)
const loginLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false });
app.use('/api/v1/login', loginLimiter);

// Gate de páginas HTML protegidas (deve vir ANTES do static)
app.get('/home.html', requireRoles(['ADMIN', 'LEITOR']), servePublic('home.html'));
app.get('/usuarios.html', requireRoles(['ADMIN', 'LEITOR']), servePublic('usuarios.html'));
app.get('/cadastro.html', requireRoles(['ADMIN', 'LEITOR']), servePublic('cadastro.html'));
app.get('/relatorio.html', requireRoles(['ADMIN', 'LEITOR']), servePublic('relatorio.html'));
app.get('/lancar-km.html', requireRoles(['ADMIN', 'LEITOR', 'EDITOR']), servePublic('lancar-km.html'));
app.get('/lancar-saldo.html', requireRoles(['ADMIN', 'LEITOR', 'EDITOR']), servePublic('lancar-saldo.html'));

// Arquivos estáticos do frontend (demais assets e páginas públicas)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Servir arquivos enviados (fotos e manuais)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

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
