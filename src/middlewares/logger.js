// Middleware simples de log (método, path e tempo de resposta)
module.exports = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    // Log enxuto para o console
    console.log(`${req.method} ${req.originalUrl} - ${durationMs.toFixed(2)}ms`);
  });

  next();
};
