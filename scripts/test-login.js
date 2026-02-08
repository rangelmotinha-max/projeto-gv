const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

(async () => {
  const matricula = process.argv[2];
  const senha = process.argv[3];
  if (!matricula || !senha) { console.log('uso: node scripts/test-login.js <matricula> <senha>'); process.exit(1); }
  const dbFile = path.join(__dirname, '..', 'data', 'sgv.sqlite');
  const db = await open({ filename: dbFile, driver: sqlite3.Database });
  const matriculaDigits = String(matricula).replace(/\D/g,'');
  const rows = await db.all(
    'SELECT id, nome_completo AS nome, matricula, posto_graduacao AS posto, perfil FROM usuarios WHERE matricula = ? AND senha = ? LIMIT 1',
    matriculaDigits, senha
  );
  console.log('rows length:', rows.length, rows);
  await db.close();
})();