const dotenv = require('dotenv');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

dotenv.config();

(async () => {
  const dbFile = process.env.DB_SQLITE_FILE || path.join(__dirname, '..', 'data', 'sgv.sqlite');
  let db;
  try {
    db = await open({ filename: dbFile, driver: sqlite3.Database });
    await db.exec('PRAGMA foreign_keys = ON;');

    console.log('[reset-saldos] Iniciando...');
    await db.exec('BEGIN');

    // Apaga todo histórico de saldo
    console.log('[reset-saldos] Removendo histórico de saldo...');
    await db.exec('DELETE FROM veiculo_saldo_historico');

    // Coleta todos veículos
    const veiculos = await db.all('SELECT id FROM veiculos ORDER BY id ASC');
    console.log(`[reset-saldos] Veículos encontrados: ${veiculos.length}`);

    // Reinsere leitura com saldo 0 para cada veículo
    const now = new Date();
    const ts = now.toISOString().slice(0, 19).replace('T', ' ');
    const stmt = await db.prepare('INSERT INTO veiculo_saldo_historico (veiculo_id, valor, data_leitura, origem) VALUES (?, ?, ?, ?)');
    for (const v of veiculos) {
      await stmt.run(v.id, 0, ts, 'RESET');
    }
    await stmt.finalize();

    await db.exec('COMMIT');
    console.log('[reset-saldos] Concluído com sucesso. Todos os saldos zerados e histórico redefinido.');
    process.exit(0);
  } catch (err) {
    if (db) {
      try { await db.exec('ROLLBACK'); } catch {}
    }
    console.error('[reset-saldos] Falhou:', err?.message || err);
    process.exit(1);
  }
})();
