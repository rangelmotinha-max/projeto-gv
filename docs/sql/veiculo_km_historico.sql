USE sgv;

CREATE TABLE IF NOT EXISTS veiculo_km_historico (
  id INT AUTO_INCREMENT PRIMARY KEY,
  veiculo_id INT NOT NULL,
  km INT NOT NULL,
  data_leitura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  origem ENUM('FORM','MANUAL') NOT NULL DEFAULT 'FORM',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_km_veiculo_data (veiculo_id, data_leitura),
  CONSTRAINT fk_km_veiculo FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE CASCADE
);
