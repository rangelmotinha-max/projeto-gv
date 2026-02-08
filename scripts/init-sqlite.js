const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

dotenv.config();

(async () => {
  try {
    const dbFile = process.env.DB_SQLITE_FILE || path.join(__dirname, '..', 'data', 'sgv.sqlite');
    fs.mkdirSync(path.dirname(dbFile), { recursive: true });

    const db = await open({ filename: dbFile, driver: sqlite3.Database });
    await db.exec('PRAGMA foreign_keys = ON;');

    const sqlDir = path.join(__dirname, '..', 'docs', 'sqlite');
    const filesInOrder = [
      'veiculos.sqlite.sql',
      'veiculo_fotos.sqlite.sql',
      'veiculo_km_historico.sqlite.sql',
      'usuarios.sqlite.sql',
    ];

    for (const file of filesInOrder) {
      const full = path.join(sqlDir, file);
      if (!fs.existsSync(full)) {
        console.log(`[sqlite:init] (pulado) ${file} não encontrado.`);
        continue;
      }
      const sql = fs.readFileSync(full, 'utf8');
      if (!sql.trim()) {
        console.log(`[sqlite:init] (pulado) ${file} vazio.`);
        continue;
      }
      console.log(`[sqlite:init] Executando ${file}...`);
      await db.exec(sql);
      console.log(`[sqlite:init] OK: ${file}`);
    }

    // Executa migrações, se existirem
    const migrationsDir = path.join(sqlDir, 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const migs = fs
        .readdirSync(migrationsDir)
        .filter((f) => f.toLowerCase().endsWith('.sql'))
        .sort();
      for (const m of migs) {
        const full = path.join(migrationsDir, m);
        const sql = fs.readFileSync(full, 'utf8');
        if (!sql.trim()) {
          console.log(`[sqlite:init] (pulado) migração ${m} vazia.`);
          continue;
        }
        console.log(`[sqlite:init] Executando migração ${m}...`);
        try {
          await db.exec(sql);
          console.log(`[sqlite:init] OK migração: ${m}`);
        } catch (err) {
          console.warn(`[sqlite:init] Aviso: migração ${m} falhou, seguindo adiante. Motivo: ${err?.message || err}`);
        }
      }
    }

    await db.close();
    console.log('[sqlite:init] Finalizado com sucesso.');
    process.exit(0);
  } catch (err) {
    console.error('[sqlite:init] Falhou:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
