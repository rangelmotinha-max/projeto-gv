const db = require('../config/db');

async function listar() {
  const [rows] = await db.query(
    `SELECT
       v.id,
       v.marca_modelo AS marcaModelo,
       v.ano_fabricacao AS anoFabricacao,
       v.prefixo,
       v.placa,
       v.placa_vinculada AS placaVinculada,
       v.unidade,
       v.cor,
       v.km_atual AS kmAtual,
       v.proxima_revisao_km AS proximaRevisaoKm,
       v.data_proxima_revisao AS dataProximaRevisao,
       v.condutor_atual AS condutorAtual,
       v.cartao,
       v.os_cman AS osCman,
       v.os_prime AS osPrime,
       v.observacoes,
       v.manual_path AS manualPath,
       v.manual_nome AS manualNome,
       v.status,
       v.created_at AS createdAt,
       v.updated_at AS updatedAt,
       (
         SELECT valor FROM veiculo_saldo_historico sh
         WHERE sh.veiculo_id = v.id
         ORDER BY sh.data_leitura DESC, sh.id DESC
         LIMIT 1
       ) AS saldoAtual
     FROM veiculos v
     ORDER BY v.id DESC`
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

  const toWebUrl = (p) => {
    let s = String(p || '').trim();
    if (!s) return s;
    s = s.replace(/\\/g, '/');
    if (s.includes('/uploads/veiculos/')) {
      const filename = s.split('/').pop();
      return '/uploads/veiculos/' + filename;
    }
    if (s.startsWith('/uploads/')) {
      const filename = s.split('/').pop();
      return '/uploads/veiculos/' + filename;
    }
    if (/uploads/i.test(s)) {
      const filename = s.split('/').pop();
      return '/uploads/veiculos/' + filename;
    }
    const filename = s.split('/').pop();
    return '/uploads/veiculos/' + filename;
  };

  const map = new Map();
  for (const r of rows) map.set(r.id, []);
  for (const f of fotos) {
    const arr = map.get(f.veiculoId);
    if (arr) arr.push({ id: f.id, url: toWebUrl(f.caminho), nome: f.nome });
  }

  return rows.map((r) => ({
    ...r,
    manualPath: r.manualPath ? toWebUrl(r.manualPath) : r.manualPath,
    fotos: map.get(r.id) || [],
  }));
}

async function criar(payload) {
  const sql = `
    INSERT INTO veiculos
      (marca_modelo, ano_fabricacao, prefixo, placa, placa_vinculada, unidade,
       cor, km_atual, proxima_revisao_km, data_proxima_revisao,
       condutor_atual, cartao, os_cman, os_prime, observacoes, manual_path, manual_nome, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    payload.marcaModelo,
    payload.anoFabricacao,
    payload.prefixo,
    payload.placa,
    payload.placaVinculada,
    payload.unidade,
    payload.cor || null,
    payload.kmAtual,
    payload.proximaRevisaoKm,
    payload.dataProximaRevisao,
    payload.condutorAtual,
    payload.cartao,
    payload.osCman,
    payload.osPrime,
    payload.observacoes || null,
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
       cor, km_atual, proxima_revisao_km, data_proxima_revisao,
       condutor_atual, cartao, os_cman, os_prime, observacoes, manual_path, manual_nome, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    payload.marcaModelo,
    payload.anoFabricacao,
    payload.prefixo,
    payload.placa,
    payload.placaVinculada,
    payload.unidade,
    payload.cor || null,
    payload.kmAtual,
    payload.proximaRevisaoKm,
    payload.dataProximaRevisao,
    payload.condutorAtual,
    payload.cartao,
    payload.osCman,
    payload.osPrime,
    payload.observacoes || null,
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
    'cor = ?',
    'km_atual = ?',
    'proxima_revisao_km = ?',
    'data_proxima_revisao = ?',
    'condutor_atual = ?',
    'cartao = ?',
    'os_cman = ?',
    'os_prime = ?',
    'observacoes = ?',
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
    payload.cor || null,
    payload.kmAtual,
    payload.proximaRevisaoKm,
    payload.dataProximaRevisao,
    payload.condutorAtual,
    payload.cartao,
    payload.osCman,
    payload.osPrime,
    payload.observacoes || null,
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

async function atualizarLeituraKm(veiculoId, kmId, novoKm) {
  const veiculoIdNum = Number(veiculoId);
  const kmIdNum = Number(kmId);
  if (!Number.isInteger(veiculoIdNum) || veiculoIdNum <= 0 || !Number.isInteger(kmIdNum) || kmIdNum <= 0) {
    const err = new Error('Identificadores inválidos para veículo ou leitura de KM.');
    err.status = 400;
    throw err;
  }

  const [rowsAtual] = await db.query(
    'SELECT id, veiculo_id AS veiculoId, km, data_leitura AS dataLeitura FROM veiculo_km_historico WHERE id = ? AND veiculo_id = ?',
    [kmIdNum, veiculoIdNum]
  );
  if (!rowsAtual.length) {
    const err = new Error('Leitura de KM não encontrada para este veículo.');
    err.status = 404;
    throw err;
  }

  const novoKmNum = Number(novoKm);
  if (!Number.isFinite(novoKmNum) || novoKmNum < 0) {
    const err = new Error('Informe um KM válido.');
    err.status = 400;
    throw err;
  }

  // Garante que somente uma das 3 últimas leituras possa ser alterada
  const [ultimos] = await db.query(
    'SELECT id FROM veiculo_km_historico WHERE veiculo_id = ? ORDER BY data_leitura DESC, id DESC LIMIT 3',
    [veiculoIdNum]
  );
  const permitido = ultimos.some((r) => r.id === kmIdNum);
  if (!permitido) {
    const err = new Error('Só é permitido alterar um dos 3 últimos registros de KM.');
    err.status = 400;
    throw err;
  }

  // Busca todas as leituras para validar a sequência do hodômetro
  const [todas] = await db.query(
    'SELECT id, km, data_leitura AS dataLeitura FROM veiculo_km_historico WHERE veiculo_id = ? ORDER BY data_leitura ASC, id ASC',
    [veiculoIdNum]
  );

  const idx = todas.findIndex((r) => r.id === kmIdNum);
  if (idx === -1) {
    const err = new Error('Leitura de KM não encontrada para este veículo.');
    err.status = 404;
    throw err;
  }

  const anterior = idx > 0 ? todas[idx - 1] : null;
  const proximo = idx < todas.length - 1 ? todas[idx + 1] : null;

  if (anterior && novoKmNum < (anterior.km || 0)) {
    const err = new Error('Km inferior ao último registrado.');
    err.status = 400;
    throw err;
  }

  if (proximo && novoKmNum > (proximo.km || 0)) {
    const err = new Error('Km inválido: superior ao próximo registro da sequência.');
    err.status = 400;
    throw err;
  }

  await db.execute(
    'UPDATE veiculo_km_historico SET km = ? WHERE id = ? AND veiculo_id = ?',
    [novoKmNum, kmIdNum, veiculoIdNum]
  );

  // Recalcula o km_atual do veículo com base na última leitura existente
  const [lastRows] = await db.query(
    'SELECT km FROM veiculo_km_historico WHERE veiculo_id = ? ORDER BY data_leitura DESC, id DESC LIMIT 1',
    [veiculoIdNum]
  );
  if (lastRows.length) {
    const kmAtual = lastRows[0].km || 0;
    await db.execute('UPDATE veiculos SET km_atual = ? WHERE id = ?', [kmAtual, veiculoIdNum]);
  }

  return { id: kmIdNum, veiculoId: veiculoIdNum, km: novoKmNum };
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

// ===== Histórico de Saldo =====
async function registrarLeituraSaldo(veiculoId, valor, dataLeitura = null, origem = 'FORM') {
  const sql = 'INSERT INTO veiculo_saldo_historico (veiculo_id, valor, data_leitura, origem) VALUES (?, ?, ?, ?)';
  const when = dataLeitura ? new Date(dataLeitura) : new Date();
  const ts = when.toISOString().slice(0, 19).replace('T', ' ');
  await db.execute(sql, [veiculoId, valor, ts, origem]);
}

async function atualizarLeituraSaldo(veiculoId, saldoId, novoValor) {
  const veiculoIdNum = Number(veiculoId);
  const saldoIdNum = Number(saldoId);
  if (!Number.isInteger(veiculoIdNum) || veiculoIdNum <= 0 || !Number.isInteger(saldoIdNum) || saldoIdNum <= 0) {
    const err = new Error('Identificadores inválidos para veículo ou leitura de saldo.');
    err.status = 400;
    throw err;
  }

  const [rowsAtual] = await db.query(
    'SELECT id, veiculo_id AS veiculoId, valor, data_leitura AS dataLeitura FROM veiculo_saldo_historico WHERE id = ? AND veiculo_id = ?',
    [saldoIdNum, veiculoIdNum]
  );
  if (!rowsAtual.length) {
    const err = new Error('Leitura de saldo não encontrada para este veículo.');
    err.status = 404;
    throw err;
  }

  const novoValorNum = Number(novoValor);
  if (!Number.isFinite(novoValorNum) || novoValorNum < 0) {
    const err = new Error('Informe um saldo válido.');
    err.status = 400;
    throw err;
  }

  // Garante que somente uma das 3 últimas leituras possa ser alterada
  const [ultimos] = await db.query(
    'SELECT id FROM veiculo_saldo_historico WHERE veiculo_id = ? ORDER BY data_leitura DESC, id DESC LIMIT 3',
    [veiculoIdNum]
  );
  const permitido = ultimos.some((r) => r.id === saldoIdNum);
  if (!permitido) {
    const err = new Error('Só é permitido alterar um dos 3 últimos registros de saldo.');
    err.status = 400;
    throw err;
  }

  await db.execute(
    'UPDATE veiculo_saldo_historico SET valor = ? WHERE id = ? AND veiculo_id = ?',
    [novoValorNum, saldoIdNum, veiculoIdNum]
  );

  return { id: saldoIdNum, veiculoId: veiculoIdNum, valor: novoValorNum };
}

async function listarLeiturasSaldo(veiculoId, inicio = null, fim = null) {
  const where = ['veiculo_id = ?'];
  const params = [veiculoId];
  if (inicio) { where.push('data_leitura >= ?'); params.push(inicio); }
  if (fim) { where.push('data_leitura <= ?'); params.push(fim); }
  const [rows] = await db.query(
    `SELECT id, veiculo_id AS veiculoId, valor, data_leitura AS dataLeitura, origem, created_at AS createdAt
     FROM veiculo_saldo_historico
     WHERE ${where.join(' AND ')}
     ORDER BY data_leitura DESC, id DESC`,
    params
  );
  return rows;
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
   atualizarLeituraKm,
  registrarLeituraSaldo,
  atualizarLeituraSaldo,
  listarLeiturasSaldo,
};
