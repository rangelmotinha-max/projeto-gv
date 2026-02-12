-- Tabela de alterações de veículo
CREATE TABLE IF NOT EXISTS vehicle_changes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL,
  odometer_entry_id INTEGER NULL,
  change_date TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(vehicle_id) REFERENCES veiculos(id) ON DELETE CASCADE,
  FOREIGN KEY(odometer_entry_id) REFERENCES veiculo_km_historico(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_vehicle_changes_vehicle_date
  ON vehicle_changes(vehicle_id, change_date);

CREATE INDEX IF NOT EXISTS idx_vehicle_changes_odometer_entry
  ON vehicle_changes(odometer_entry_id);
