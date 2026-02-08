// Middleware de log com informações detalhadas (IP, Browser, método, path e tempo de resposta)
module.exports = (req, res, next) => {
  const start = process.hrtime.bigint();

  // Captura informações do cliente
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
    || req.headers['x-real-ip'] 
    || req.socket.remoteAddress 
    || req.connection.remoteAddress;
  
  const userAgent = req.headers['user-agent'] || 'Desconhecido';
  
  // Simplifica o user-agent para mostrar apenas o principal
  let browser = 'Desconhecido';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
  else if (userAgent.includes('Edg')) browser = 'Edge';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
  else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera';

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    
    // Log detalhado para requisições específicas
    if (req.method === 'POST' && (req.originalUrl.includes('/login') || req.originalUrl.includes('/logout'))) {
      console.log(`${req.method} ${req.originalUrl} - ${durationMs.toFixed(2)}ms [IP: ${ip}] [Browser: ${browser}]`);
    } else {
      // Log enxuto para outras requisições
      console.log(`${req.method} ${req.originalUrl} - ${durationMs.toFixed(2)}ms`);
    }
  });

  next();
};
