-- Adiciona coluna user_id à tabela de alterações de veículo
ALTER TABLE vehicle_changes ADD COLUMN user_id INTEGER NULL;

-- (Opcional) índice para consultas por usuário
CREATE INDEX IF NOT EXISTS idx_vehicle_changes_user ON vehicle_changes(user_id);
