// Middleware centralizado de tratamento de erros
module.exports = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Erro interno do servidor';
  const details = err.details || null;

  res.status(status).json({
    error: {
      message,
      details,
    },
  });
};
