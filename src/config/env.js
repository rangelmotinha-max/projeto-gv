// Carrega variáveis de ambiente
const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  // Define porta com fallback
  port: process.env.PORT || 3000,
};
