const veiculoService = require('../services/veiculoService');

const validarPlacaBR = (placa) => {
  const p = (placa || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const reAntiga = /^[A-Z]{3}\d{4}$/; // ABC1234
  const reMercosul = /^[A-Z]{3}\d[A-Z]\d{2}$/; // ABC1D23
  return reAntiga.test(p) || reMercosul.test(p);
};

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

    const erros = [];
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

    if (erros.length) return res.status(400).json({ message: erros[0] });

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
      status,
    });

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

    // reutiliza as validações do criar, simulando a mesma checagem
    const mockReq = { body: payload };
    const mockRes = {
      status: (c) => ({ json: (o) => res.status(c).json(o) }),
      json: (o) => o,
    };
    await criar(mockReq, mockRes, next);

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
    });

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

module.exports = { listar, criar, atualizar, excluir };
