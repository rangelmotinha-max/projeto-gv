CREATE TABLE IF NOT EXISTS veiculo_fotos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  veiculo_id INTEGER NOT NULL,
  caminho TEXT NOT NULL,
  nome_arquivo TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fotos_veiculo ON veiculo_fotos (veiculo_id);
CREATE TABLE IF NOT EXISTS veiculo_fotos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  veiculo_id INTEGER NOT NULL,
  caminho TEXT NOT NULL,
  nome_arquivo TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fotos_veiculo ON veiculo_fotos (veiculo_id);
