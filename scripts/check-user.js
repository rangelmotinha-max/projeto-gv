const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

(async () => {
  const matricula = process.argv[2] || '';
  if (!/^\d{8}$/.test(matricula)) {
    console.error('Informe a matrícula (8 dígitos) como argumento.');
    process.exit(1);
  }
  const dbFile = process.env.DB_SQLITE_FILE || path.join(__dirname, '..', 'data', 'sgv.sqlite');
  const db = await open({ filename: dbFile, driver: sqlite3.Database });
  const row = await db.get('SELECT id, nome_completo AS nome, matricula, perfil, senha FROM usuarios WHERE matricula = ?', matricula);
  console.log(row || null);
  await db.close();
})();