const path = require('path');
const veiculoService = require('../services/veiculoService');

const validarPlacaBR = (placa) => {
  const p = (placa || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const reAntiga = /^[A-Z]{3}\d{4}$/; // ABC1234
  const reMercosul = /^[A-Z]{3}\d[A-Z]\d{2}$/; // ABC1D23
  return reAntiga.test(p) || reMercosul.test(p);
};

// Validação compartilhada para criar/atualizar veículo
function validarPayloadVeiculo(body = {}) {
  const erros = [];
  const {
    marcaModelo,
    anoFabricacao,
    placa,
    placaVinculada,
    unidade,
    kmAtual,
    proximaRevisaoKm,
    status,
  } = body;

  if (!marcaModelo) erros.push('Informe Marca/Modelo.');
  const ano = Number(anoFabricacao);
  const currentYear = new Date().getFullYear();
  if (!(ano >= 1970 && ano <= currentYear + 1)) erros.push('Ano de fabricação inválido.');
  if (!validarPlacaBR(placa)) erros.push('Placa inválida.');
  if (placaVinculada && !validarPlacaBR(placaVinculada)) erros.push('Placa vinculada inválida.');
  if (!unidade) erros.push('Informe a Unidade.');
  const km = Number(kmAtual);
  const proxKm = Number(proximaRevisaoKm);
  if (!(km >= 0)) erros.push('Km Atual inválido.');
  if (!(proxKm >= 0)) erros.push('Próxima Revisão Km inválido.');
  if (!status || !['BASE', 'BAIXADA', 'OFICINA', 'ATIVA'].includes(status)) erros.push('Status inválido.');

  return erros;
}

async function listar(req, res, next) {
  try {
    const itens = await veiculoService.listar();
    res.json(itens);
  } catch (e) {
    next(e);
  }
}

async function criar(req, res, next) {
  try {
    const {
      marcaModelo,
      anoFabricacao,
      prefixo,
      placa,
      placaVinculada,
      unidade,
      kmAtual,
      proximaRevisaoKm,
      dataProximaRevisao,
      condutorAtual,
      cartao,
      osCman,
      osPrime,
      status,
    } = req.body;

    const erros = validarPayloadVeiculo(req.body);
    if (erros.length) return res.status(400).json({ message: erros[0] });

    // Arquivos
    const files = req.files || {};
    const manualFile = files.manual?.[0] || null;
    const fotosFiles = files.fotos || [];

    const manualPath = manualFile
      ? path.posix.join('/uploads/veiculos', path.basename(manualFile.path))
      : null;
    const manualNome = manualFile ? manualFile.originalname : null;

    const item = await veiculoService.criar({
      marcaModelo,
      anoFabricacao: ano,
      prefixo: prefixo || null,
      placa: placa.toUpperCase(),
      placaVinculada: placaVinculada ? placaVinculada.toUpperCase() : null,
      unidade,
      kmAtual: km,
      proximaRevisaoKm: proxKm,
      dataProximaRevisao: dataProximaRevisao || null,
      condutorAtual: condutorAtual || null,
      cartao: cartao || null,
      osCman: osCman || null,
      osPrime: osPrime || null,
      manualPath,
      manualNome,
      status,
    });

    // registra leitura de KM inicial
    try {
      await veiculoService.registrarLeituraKm(item.id, km, null, 'FORM');
    } catch (err) {
      // não bloqueia o cadastro se falhar o histórico
      console.warn('Falha ao registrar KM inicial:', err?.message || err);
    }

    if (fotosFiles.length) {
      await veiculoService.inserirFotos(
        item.id,
        fotosFiles.map((f) => ({
          caminho: path.posix.join('/uploads/veiculos', path.basename(f.path)),
          nome: f.originalname,
        }))
      );
    }

    res.status(201).json(item);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Placa já cadastrada.' });
    }
    next(e);
  }
}

async function atualizar(req, res, next) {
  try {
    const { id } = req.params;
    const payload = { ...req.body };

    // validação direta (não chamar criar aqui)
    const erros = validarPayloadVeiculo(payload);
    if (erros.length) return res.status(400).json({ message: erros[0] });

    const files = req.files || {};
    const manualFile = files.manual?.[0] || null;
    const fotosFiles = files.fotos || [];

    const manualPath = manualFile
      ? path.posix.join('/uploads/veiculos', path.basename(manualFile.path))
      : undefined;
    const manualNome = manualFile ? manualFile.originalname : undefined;

    const atualizado = await veiculoService.atualizar(id, {
      marcaModelo: payload.marcaModelo,
      anoFabricacao: Number(payload.anoFabricacao),
      prefixo: payload.prefixo || null,
      placa: payload.placa?.toUpperCase(),
      placaVinculada: payload.placaVinculada ? payload.placaVinculada.toUpperCase() : null,
      unidade: payload.unidade,
      kmAtual: Number(payload.kmAtual),
      proximaRevisaoKm: Number(payload.proximaRevisaoKm),
      dataProximaRevisao: payload.dataProximaRevisao || null,
      condutorAtual: payload.condutorAtual || null,
      cartao: payload.cartao || null,
      osCman: payload.osCman || null,
      osPrime: payload.osPrime || null,
      status: payload.status,
      manualPath,
      manualNome,
    });

    // registra leitura se informada
    const kmAtualNum = Number(payload.kmAtual);
    if (!Number.isNaN(kmAtualNum) && kmAtualNum >= 0) {
      try {
        await veiculoService.registrarLeituraKm(id, kmAtualNum, null, 'FORM');
      } catch (err) {
        console.warn('Falha ao registrar KM em atualização:', err?.message || err);
      }
    }

    if (fotosFiles.length) {
      await veiculoService.inserirFotos(
        id,
        fotosFiles.map((f) => ({
          caminho: path.posix.join('/uploads/veiculos', path.basename(f.path)),
          nome: f.originalname,
        }))
      );
    }

    res.json(atualizado);
  } catch (e) {
    next(e);
  }
}

async function excluir(req, res, next) {
  try {
    const { id } = req.params;
    await veiculoService.excluir(id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

// ===== Histórico de KM =====
async function adicionarKm(req, res, next) {
  try {
    const { id } = req.params;
    const { km, dataLeitura } = req.body;
    const kmNum = Number(km);
    if (Number.isNaN(kmNum) || kmNum < 0) {
      return res.status(400).json({ message: 'Informe um KM válido.' });
    }
    await veiculoService.registrarLeituraKm(id, kmNum, dataLeitura || null, 'MANUAL');
    res.status(201).json({ veiculoId: Number(id), km: kmNum, dataLeitura: dataLeitura || new Date().toISOString() });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
}

async function listarKms(req, res, next) {
  try {
    const { id } = req.params;
    const { inicio, fim } = req.query;
    const rows = await veiculoService.listarLeiturasKm(id, inicio || null, fim || null);
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

async function mediasKms(req, res, next) {
  try {
    const { id } = req.params;
    const { inicio, fim } = req.query;
    const data = await veiculoService.obterMediasKm(id, inicio || null, fim || null);
    res.json(data);
  } catch (e) {
    next(e);
  }
}

module.exports = { listar, criar, atualizar, excluir, adicionarKm, listarKms, mediasKms };
