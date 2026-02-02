// Carrega variáveis de ambiente
const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  // Define porta com fallback
  port: process.env.PORT || 3000,
  // Segredo para assinar sessão (defina AUTH_SECRET no .env em produção)
  authSecret: process.env.AUTH_SECRET || 'sgv-dev-secret-change-me',
};
