CREATE TABLE IF NOT EXISTS veiculos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  marca_modelo TEXT NOT NULL,
  ano_fabricacao INTEGER NOT NULL,
  prefixo TEXT,
  placa TEXT NOT NULL UNIQUE,
  placa_vinculada TEXT,
  unidade TEXT NOT NULL,

  km_atual INTEGER NOT NULL DEFAULT 0,
  proxima_revisao_km INTEGER NOT NULL DEFAULT 0,
  data_proxima_revisao TEXT,

  condutor_atual TEXT,
  cartao TEXT,

  os_cman TEXT,
  os_prime TEXT,

  cor TEXT,
  observacoes TEXT,

  manual_path TEXT,
  manual_nome TEXT,

  status TEXT NOT NULL CHECK (status IN ('BASE','BAIXADA','OFICINA','ATIVA')),

  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);
CREATE TABLE IF NOT EXISTS veiculos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  marca_modelo TEXT NOT NULL,
  ano_fabricacao INTEGER NOT NULL,
  prefixo TEXT,
  placa TEXT NOT NULL UNIQUE,
  placa_vinculada TEXT,
  unidade TEXT NOT NULL,

  km_atual INTEGER NOT NULL DEFAULT 0,
  proxima_revisao_km INTEGER NOT NULL DEFAULT 0,
  data_proxima_revisao TEXT,

  condutor_atual TEXT,
  cartao TEXT,

  os_cman TEXT,
  os_prime TEXT,

  cor TEXT,
  observacoes TEXT,

  manual_path TEXT,
  manual_nome TEXT,

  status TEXT NOT NULL CHECK (status IN ('BASE','BAIXADA','OFICINA','ATIVA')),

  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);
