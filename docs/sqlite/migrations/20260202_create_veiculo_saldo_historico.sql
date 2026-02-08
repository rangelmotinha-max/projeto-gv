-- Cria tabela de histórico de saldo por veículo
CREATE TABLE IF NOT EXISTS veiculo_saldo_historico (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  veiculo_id INTEGER NOT NULL,
  valor NUMERIC NOT NULL,
  data_leitura TEXT NOT NULL,
  origem TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (veiculo_id) REFERENCES veiculos(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_saldo_veiculo ON veiculo_saldo_historico(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_saldo_data ON veiculo_saldo_historico(data_leitura);
