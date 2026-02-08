const dotenv = require('dotenv');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

dotenv.config();

(async () => {
  try {
    const dbFile = process.env.DB_SQLITE_FILE || path.join(__dirname, '..', 'data', 'sgv.sqlite');
    const db = await open({ filename: dbFile, driver: sqlite3.Database });
    await db.exec("PRAGMA foreign_keys = OFF;");
    const res = await db.run("UPDATE usuarios SET senha = '1234';");
    await db.exec("PRAGMA foreign_keys = ON;");
    const row = await db.get("SELECT COUNT(*) AS total FROM usuarios;");
    console.log(`[set-all-passwords] Atualizadas ${res.changes} linhas. Total de usuários: ${row.total}`);
    await db.close();
    process.exit(0);
  } catch (err) {
    console.error('[set-all-passwords] Falhou:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();