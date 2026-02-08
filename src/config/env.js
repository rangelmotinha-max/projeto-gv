// Carrega variáveis de ambiente
const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  // Define porta 80 como padrão (requer sudo)
  port: process.env.PORT || 80,
  // Segredo para assinar sessão (defina AUTH_SECRET no .env em produção)
  authSecret: process.env.AUTH_SECRET || 'sgv-dev-secret-change-me',
};
