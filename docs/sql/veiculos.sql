-- Banco de dados e tabela de veículos
CREATE DATABASE IF NOT EXISTS sgv CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sgv;

CREATE TABLE IF NOT EXISTS veiculos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  marca_modelo VARCHAR(120) NOT NULL,
  ano_fabricacao INT NOT NULL,
  prefixo VARCHAR(40) NULL,
  placa VARCHAR(10) NOT NULL,
  placa_vinculada VARCHAR(10) NULL,
  unidade VARCHAR(120) NOT NULL,

  km_atual INT NOT NULL DEFAULT 0,
  proxima_revisao_km INT NOT NULL DEFAULT 0,
  data_proxima_revisao DATE NULL,

  condutor_atual VARCHAR(120) NULL,
  cartao VARCHAR(60) NULL,

  os_cman VARCHAR(60) NULL,
  os_prime VARCHAR(60) NULL,

  status ENUM('BASE','BAIXADA','OFICINA','ATIVA') NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_veiculos_placa (placa)
);
