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
       manual_path AS manualPath,
       manual_nome AS manualNome,
       status,
       created_at AS createdAt,
       updated_at AS updatedAt
     FROM veiculos
     ORDER BY id DESC`
  );

  if (!rows.length) return rows.map((r) => ({ ...r, fotos: [] }));

  const ids = rows.map((r) => r.id);
  const placeholders = ids.map(() => '?').join(',');
  const [fotos] = await db.query(
    `SELECT veiculo_id AS veiculoId, caminho, nome_arquivo AS nome
     FROM veiculo_fotos
     WHERE veiculo_id IN (${placeholders})
     ORDER BY id DESC`,
    ids
  );

  const map = new Map();
  for (const r of rows) map.set(r.id, []);
  for (const f of fotos) {
    const arr = map.get(f.veiculoId);
    if (arr) arr.push({ url: f.caminho, nome: f.nome });
  }

  return rows.map((r) => ({ ...r, fotos: map.get(r.id) || [] }));
}

async function criar(payload) {
  const sql = `
    INSERT INTO veiculos
      (marca_modelo, ano_fabricacao, prefixo, placa, placa_vinculada, unidade,
       km_atual, proxima_revisao_km, data_proxima_revisao,
       condutor_atual, cartao, os_cman, os_prime, manual_path, manual_nome, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    payload.manualPath || null,
    payload.manualNome || null,
    payload.status,
  ];

  const [result] = await db.execute(sql, params);
  return { id: result.insertId, ...payload };
}

async function atualizar(id, payload) {
  const sets = [
    'marca_modelo = ?',
    'ano_fabricacao = ?',
    'prefixo = ?',
    'placa = ?',
    'placa_vinculada = ?',
    'unidade = ?',
    'km_atual = ?',
    'proxima_revisao_km = ?',
    'data_proxima_revisao = ?',
    'condutor_atual = ?',
    'cartao = ?',
    'os_cman = ?',
    'os_prime = ?',
    'status = ?',
    'updated_at = CURRENT_TIMESTAMP',
  ];
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

  if (payload.manualPath !== undefined || payload.manualNome !== undefined) {
    sets.splice(sets.length - 1, 0, 'manual_path = ?', 'manual_nome = ?');
    params.splice(params.length, 0, payload.manualPath || null, payload.manualNome || null);
  }

  const sql = `UPDATE veiculos SET ${sets.join(', ')} WHERE id = ?`;
  params.push(id);
  await db.execute(sql, params);
  return { id, ...payload };
}

async function excluir(id) {
  await db.execute('DELETE FROM veiculos WHERE id = ?', [id]);
}

async function inserirFotos(veiculoId, fotos = []) {
  if (!fotos.length) return;
  const sql = 'INSERT INTO veiculo_fotos (veiculo_id, caminho, nome_arquivo) VALUES (?, ?, ?)';
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    for (const f of fotos) {
      await conn.execute(sql, [veiculoId, f.caminho, f.nome]);
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

module.exports = { listar, criar, atualizar, excluir, inserirFotos };
