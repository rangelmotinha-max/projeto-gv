const db = require('../src/config/db');
(async () => {
  const [rows] = await db.query(
    'SELECT id, nome_completo AS nome, matricula, perfil FROM usuarios WHERE matricula = ? AND senha = ? LIMIT 1',
    ['07330545', '1234']
  );
  console.log('rows len via wrapper:', rows.length, rows);
  process.exit(0);
})();