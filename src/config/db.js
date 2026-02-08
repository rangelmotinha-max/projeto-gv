const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

dotenv.config();

const DB_FILE = process.env.DB_SQLITE_FILE || path.join(__dirname, '..', '..', 'data', 'sgv.sqlite');

// Garante diretório do arquivo do banco
fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });

// Conexão única para SQLite (não há pool)
let dbPromise = open({ filename: DB_FILE, driver: sqlite3.Database })
  .then(async (db) => {
    await db.exec('PRAGMA foreign_keys = ON;');
    return db;
  });

// Fornece API compatível com uso existente (query/execute/getConnection)
async function query(sql, params = []) {
  const db = await dbPromise;
  const bind = Array.isArray(params) ? params : [params];
  const rows = await db.all(sql, ...bind);
  return [rows];
}

async function execute(sql, params = []) {
  const db = await dbPromise;
  const bind = Array.isArray(params) ? params : [params];
  const res = await db.run(sql, ...bind);
  return [{ insertId: res.lastID ?? 0, affectedRows: res.changes ?? 0 }];
}

async function getConnection() {
  const db = await dbPromise;
  return {
    beginTransaction: () => db.exec('BEGIN'),
    commit: () => db.exec('COMMIT'),
    rollback: () => db.exec('ROLLBACK'),
    execute: (sql, params = []) => db.run(sql, ...(Array.isArray(params) ? params : [params])),
    query: (sql, params = []) => db.all(sql, ...(Array.isArray(params) ? params : [params])),
    release: async () => {},
  };
}

module.exports = { query, execute, getConnection };
