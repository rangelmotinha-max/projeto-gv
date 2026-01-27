// Bootstrap do servidor
const app = require('./app');
const { port } = require('./config/env');

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
