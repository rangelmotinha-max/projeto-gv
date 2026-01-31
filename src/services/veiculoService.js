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
    `SELECT id, veiculo_id AS veiculoId, caminho, nome_arquivo AS nome
     FROM veiculo_fotos
     WHERE veiculo_id IN (${placeholders})
     ORDER BY id DESC`,
    ids
  );

  const map = new Map();
  for (const r of rows) map.set(r.id, []);
  for (const f of fotos) {
    const arr = map.get(f.veiculoId);
    if (arr) arr.push({ id: f.id, url: f.caminho, nome: f.nome });
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

async function criarComFotos(payload, fotos = []) {
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

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.execute(sql, params);
    const veiculoId = result.insertId;

    if (fotos.length) {
      const fotoSql = 'INSERT INTO veiculo_fotos (veiculo_id, caminho, nome_arquivo) VALUES (?, ?, ?)';
      for (const f of fotos) {
        await conn.execute(fotoSql, [veiculoId, f.caminho, f.nome]);
      }
    }

    await conn.commit();
    return { id: veiculoId, ...payload };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
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

async function excluirFoto(veiculoId, fotoId) {
  const [rows] = await db.query(
    'SELECT id, caminho FROM veiculo_fotos WHERE id = ? AND veiculo_id = ?',
    [fotoId, veiculoId]
  );
  if (!rows.length) {
    const err = new Error('Foto não encontrada.');
    err.status = 404;
    throw err;
  }

  await db.execute('DELETE FROM veiculo_fotos WHERE id = ? AND veiculo_id = ?', [fotoId, veiculoId]);
  return rows[0];
}

// ===== Histórico de KM =====

async function registrarLeituraKm(veiculoId, km, dataLeitura = null, origem = 'FORM') {
  // valida progresso do hodômetro
  const [lastRows] = await db.query(
    'SELECT km FROM veiculo_km_historico WHERE veiculo_id = ? ORDER BY data_leitura DESC, id DESC LIMIT 1',
    [veiculoId]
  );
  if (lastRows.length && km < (lastRows[0].km || 0)) {
    const err = new Error('Km inferior ao último registrado.');
    err.status = 400;
    throw err;
  }

  const sql = 'INSERT INTO veiculo_km_historico (veiculo_id, km, data_leitura, origem) VALUES (?, ?, ?, ?)';
  const when = dataLeitura ? new Date(dataLeitura) : new Date();
  const ts = when.toISOString().slice(0, 19).replace('T', ' ');
  await db.execute(sql, [veiculoId, km, ts, origem]);

  // Atualiza km_atual se maior
  await db.execute('UPDATE veiculos SET km_atual = ? WHERE id = ? AND (km_atual IS NULL OR km_atual < ?)', [km, veiculoId, km]);
}

async function listarLeiturasKm(veiculoId, inicio = null, fim = null) {
  const where = ['veiculo_id = ?'];
  const params = [veiculoId];
  if (inicio) { where.push('data_leitura >= ?'); params.push(inicio); }
  if (fim) { where.push('data_leitura <= ?'); params.push(fim); }
  const [rows] = await db.query(
    `SELECT id, veiculo_id AS veiculoId, km, data_leitura AS dataLeitura, origem, created_at AS createdAt
     FROM veiculo_km_historico
     WHERE ${where.join(' AND ')}
     ORDER BY data_leitura ASC, id ASC`,
    params
  );
  return rows;
}

async function obterMediasKm(veiculoId, inicio = null, fim = null) {
  const where = ['veiculo_id = ?'];
  const params = [veiculoId];
  if (inicio) { where.push('data_leitura >= ?'); params.push(inicio); }
  if (fim) { where.push('data_leitura <= ?'); params.push(fim); }

  const [primeiraRows] = await db.query(
    `SELECT km, data_leitura AS dataLeitura FROM veiculo_km_historico WHERE ${where.join(' AND ')} ORDER BY data_leitura ASC, id ASC LIMIT 1`,
    params
  );
  const [ultimaRows] = await db.query(
    `SELECT km, data_leitura AS dataLeitura FROM veiculo_km_historico WHERE ${where.join(' AND ')} ORDER BY data_leitura DESC, id DESC LIMIT 1`,
    params
  );

  if (!primeiraRows.length || !ultimaRows.length) {
    return { kmInicial: null, kmFinal: null, deltaKm: 0, dias: 0, mediaDia: 0, mediaSemana: 0, mediaMes: 0, periodo: { inicio, fim } };
  }

  const kmInicial = primeiraRows[0].km || 0;
  const kmFinal = ultimaRows[0].km || 0;
  const deltaKm = Math.max(0, kmFinal - kmInicial);
  const dIni = new Date(primeiraRows[0].dataLeitura);
  const dFim = new Date(ultimaRows[0].dataLeitura);
  const ms = Math.max(1, dFim.getTime() - dIni.getTime());
  const dias = Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
  const mediaDia = deltaKm / dias;
  return {
    kmInicial,
    kmFinal,
    deltaKm,
    dias,
    mediaDia,
    mediaSemana: mediaDia * 7,
    mediaMes: mediaDia * 30,
    periodo: { inicio: inicio || dIni.toISOString(), fim: fim || dFim.toISOString() },
  };
}

module.exports = {
  listar,
  criar,
  criarComFotos,
  atualizar,
  excluir,
  inserirFotos,
  excluirFoto,
  registrarLeituraKm,
  listarLeiturasKm,
  obterMediasKm,
};
