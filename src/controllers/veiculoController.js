const fs = require('fs');
const path = require('path');
const veiculoService = require('../services/veiculoService');
const { getSession } = require('../middlewares/auth');

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

  return { erros, valores: { ano, km, proxKm } };
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

    let {
      marcaModelo,
      prefixo,
      placa,
      placaVinculada,
      unidade,
      cor,
      dataProximaRevisao,
      condutorAtual,
      cartao,
      osCman,
      osPrime,
      observacoes,
      status,
    } = req.body;

    // Sanitização do campo cartao
    if (cartao) {
      cartao = String(cartao).replace(/\D/g, '');
      if (cartao.length !== 16) {
        return res.status(400).json({ message: 'O campo cartão deve conter exatamente 16 dígitos numéricos.' });
      }
    }

    const { erros, valores } = validarPayloadVeiculo(req.body);
    if (erros.length) return res.status(400).json({ message: erros[0] });
    const { ano, km, proxKm } = valores;

    // Arquivos
    const files = req.files || {};
    const manualFile = files.manual?.[0] || null;
    const fotosFiles = files.fotos || [];

    const manualPath = manualFile
      ? path.posix.join('/uploads/veiculos', path.basename(manualFile.path))
      : null;
    const manualNome = manualFile ? manualFile.originalname : null;

    const fotosPayload = fotosFiles.map((f) => ({
      caminho: path.posix.join('/uploads/veiculos', path.basename(f.path)),
      nome: f.originalname,
    }));

    const item = await veiculoService.criarComFotos({
      marcaModelo,
      anoFabricacao: ano,
      prefixo: prefixo || null,
      placa: placa.toUpperCase(),
      placaVinculada: placaVinculada ? placaVinculada.toUpperCase() : null,
      unidade,
      cor: cor || null,
      kmAtual: km,
      proximaRevisaoKm: proxKm,
      dataProximaRevisao: dataProximaRevisao || null,
      condutorAtual: condutorAtual || null,
      cartao: cartao || null,
      osCman: osCman || null,
      osPrime: osPrime || null,
      observacoes: observacoes || null,
      manualPath,
      manualNome,
      status,
    }, fotosPayload);

    // registra leitura de KM inicial
    try {
      await veiculoService.registrarLeituraKm(item.id, km, null, 'FORM');
    } catch (err) {
      // não bloqueia o cadastro se falhar o histórico
      console.warn('Falha ao registrar KM inicial:', err?.message || err);
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

    // Sanitização do campo cartao
    if (payload.cartao) {
      payload.cartao = String(payload.cartao).replace(/\D/g, '');
      if (payload.cartao.length !== 16) {
        return res.status(400).json({ message: 'O campo cartão deve conter exatamente 16 dígitos numéricos.' });
      }
    }

    // validação direta (não chamar criar aqui)
    const { erros, valores } = validarPayloadVeiculo(payload);
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
      anoFabricacao: valores.ano,
      prefixo: payload.prefixo || null,
      placa: payload.placa?.toUpperCase(),
      placaVinculada: payload.placaVinculada ? payload.placaVinculada.toUpperCase() : null,
      unidade: payload.unidade,
      cor: payload.cor || null,
      kmAtual: valores.km,
      proximaRevisaoKm: valores.proxKm,
      dataProximaRevisao: payload.dataProximaRevisao || null,
      condutorAtual: payload.condutorAtual || null,
      cartao: payload.cartao || null,
      osCman: payload.osCman || null,
      osPrime: payload.osPrime || null,
      observacoes: payload.observacoes || null,
      status: payload.status,
      manualPath,
      manualNome,
    });

    // registra leitura se informada
    const kmAtualNum = valores.km;
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

async function excluirFoto(req, res, next) {
  try {
    const { id, fotoId } = req.params;
    const veiculoIdNum = Number(id);
    const fotoIdNum = Number(fotoId);
    if (!Number.isInteger(veiculoIdNum) || veiculoIdNum <= 0) {
      return res.status(400).json({ message: 'Informe um ID de veículo válido.' });
    }
    if (!Number.isInteger(fotoIdNum) || fotoIdNum <= 0) {
      return res.status(400).json({ message: 'Informe um ID de foto válido.' });
    }

    const foto = await veiculoService.excluirFoto(veiculoIdNum, fotoIdNum);

    if (foto?.caminho) {
      const caminhoRelativo = foto.caminho.startsWith('/') ? foto.caminho.slice(1) : foto.caminho;
      const caminhoCompleto = path.resolve(__dirname, '..', '..', caminhoRelativo);
      try {
        await fs.promises.unlink(caminhoCompleto);
      } catch (err) {
        if (err?.code !== 'ENOENT') {
          console.warn('Falha ao remover arquivo de foto:', err?.message || err);
        }
      }
    }

    res.status(204).send();
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
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

// ===== Saldo =====
async function adicionarSaldo(req, res, next) {
  try {
    const { id } = req.params;
    const { valor, dataLeitura } = req.body;
    const valNum = Number(valor);
    if (Number.isNaN(valNum) || valNum < 0) {
      return res.status(400).json({ message: 'Informe um saldo válido.' });
    }
    await veiculoService.registrarLeituraSaldo(id, valNum, dataLeitura || null, 'MANUAL');
    res.status(201).json({ veiculoId: Number(id), valor: valNum, dataLeitura: dataLeitura || new Date().toISOString() });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
}

async function listarSaldos(req, res, next) {
  try {
    const { id } = req.params;
    const { inicio, fim } = req.query;
    const rows = await veiculoService.listarLeiturasSaldo(id, inicio || null, fim || null);
    res.json(rows);
  } catch (e) {
    next(e);
  }
}
// Atualização de leitura de Saldo (apenas ADMIN, e somente um dos 3 últimos registros)
async function atualizarSaldo(req, res, next) {
  try {
    const sess = getSession(req);
    if (!sess || sess.perfil !== 'ADMIN') {
      return res.status(403).json({ message: 'Apenas administradores podem alterar o histórico de saldo.' });
    }

    const { id, saldoId } = req.params;
    const { valor } = req.body;

    const veiculoIdNum = Number(id);
    const saldoIdNum = Number(saldoId);
    const valorNum = Number(valor);

    if (!Number.isInteger(veiculoIdNum) || veiculoIdNum <= 0) {
      return res.status(400).json({ message: 'Informe um ID de veículo válido.' });
    }
    if (!Number.isInteger(saldoIdNum) || saldoIdNum <= 0) {
      return res.status(400).json({ message: 'Informe um ID de leitura de saldo válido.' });
    }
    if (Number.isNaN(valorNum) || valorNum < 0) {
      return res.status(400).json({ message: 'Informe um saldo válido.' });
    }

    const atualizado = await veiculoService.atualizarLeituraSaldo(veiculoIdNum, saldoIdNum, valorNum);
    res.json(atualizado);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
}
// Atualização de leitura de KM (apenas ADMIN, e somente um dos 3 últimos registros)
async function atualizarKm(req, res, next) {
  try {
    const sess = getSession(req);
    if (!sess || sess.perfil !== 'ADMIN') {
      return res.status(403).json({ message: 'Apenas administradores podem alterar o histórico de KM.' });
    }

    const { id, kmId } = req.params;
    const { km } = req.body;

    const veiculoIdNum = Number(id);
    const kmIdNum = Number(kmId);
    const kmNum = Number(km);

    if (!Number.isInteger(veiculoIdNum) || veiculoIdNum <= 0) {
      return res.status(400).json({ message: 'Informe um ID de veículo válido.' });
    }
    if (!Number.isInteger(kmIdNum) || kmIdNum <= 0) {
      return res.status(400).json({ message: 'Informe um ID de leitura de KM válido.' });
    }
    if (Number.isNaN(kmNum) || kmNum < 0) {
      return res.status(400).json({ message: 'Informe um KM válido.' });
    }

    const atualizado = await veiculoService.atualizarLeituraKm(veiculoIdNum, kmIdNum, kmNum);
    res.json(atualizado);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
}

module.exports = { listar, criar, atualizar, excluir, excluirFoto, adicionarKm, listarKms, mediasKms, adicionarSaldo, listarSaldos, atualizarSaldo, atualizarKm };
