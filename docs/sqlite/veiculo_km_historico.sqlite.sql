CREATE TABLE IF NOT EXISTS veiculo_km_historico (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  veiculo_id INTEGER NOT NULL,
  km INTEGER NOT NULL,
  data_leitura TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  origem TEXT NOT NULL DEFAULT 'FORM' CHECK (origem IN ('FORM','MANUAL')),
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_km_veiculo_data ON veiculo_km_historico (veiculo_id, data_leitura);
CREATE TABLE IF NOT EXISTS veiculo_km_historico (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  veiculo_id INTEGER NOT NULL,
  km INTEGER NOT NULL,
  data_leitura TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  origem TEXT NOT NULL DEFAULT 'FORM' CHECK (origem IN ('FORM','MANUAL')),
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_km_veiculo_data ON veiculo_km_historico (veiculo_id, data_leitura);
