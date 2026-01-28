const db = require('../config/db');

async function listar() {
  const [rows] = await db.query(
    `SELECT
       id,
       marca_modelo AS marcaModelo,
       ano_fabricacao AS anoFabricacao,
       prefixo,
       placa,
       placa_vinculada AS placaVinculada,
       unidade,
       km_atual AS kmAtual,
       proxima_revisao_km AS proximaRevisaoKm,
       data_proxima_revisao AS dataProximaRevisao,
       condutor_atual AS condutorAtual,
       cartao,
       os_cman AS osCman,
       os_prime AS osPrime,
       status,
       created_at AS createdAt,
       updated_at AS updatedAt
     FROM veiculos
     ORDER BY id DESC`
  );
  return rows;
}

async function criar(payload) {
  const sql = `
    INSERT INTO veiculos
      (marca_modelo, ano_fabricacao, prefixo, placa, placa_vinculada, unidade,
       km_atual, proxima_revisao_km, data_proxima_revisao,
       condutor_atual, cartao, os_cman, os_prime, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    payload.marcaModelo,
    payload.anoFabricacao,
    payload.prefixo,
    payload.placa,
    payload.placaVinculada,
    payload.unidade,
    payload.kmAtual,
    payload.proximaRevisaoKm,
    payload.dataProximaRevisao,
    payload.condutorAtual,
    payload.cartao,
    payload.osCman,
    payload.osPrime,
    payload.status,
  ];

  const [result] = await db.execute(sql, params);
  return { id: result.insertId, ...payload };
}

async function atualizar(id, payload) {
  const sql = `
    UPDATE veiculos SET
      marca_modelo = ?, ano_fabricacao = ?, prefixo = ?, placa = ?, placa_vinculada = ?, unidade = ?,
      km_atual = ?, proxima_revisao_km = ?, data_proxima_revisao = ?,
      condutor_atual = ?, cartao = ?, os_cman = ?, os_prime = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  const params = [
    payload.marcaModelo,
    payload.anoFabricacao,
    payload.prefixo,
    payload.placa,
    payload.placaVinculada,
    payload.unidade,
    payload.kmAtual,
    payload.proximaRevisaoKm,
    payload.dataProximaRevisao,
    payload.condutorAtual,
    payload.cartao,
    payload.osCman,
    payload.osPrime,
    payload.status,
    id,
  ];
  await db.execute(sql, params);
  return { id, ...payload };
}

async function excluir(id) {
  await db.execute('DELETE FROM veiculos WHERE id = ?', [id]);
}

module.exports = { listar, criar, atualizar, excluir };
