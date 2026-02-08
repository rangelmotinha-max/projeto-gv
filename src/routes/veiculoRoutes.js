const express = require('express');
const veiculoController = require('../controllers/veiculoController');
const upload = require('../middlewares/upload');

const router = express.Router();

// /api/v1/veiculos
router.get('/veiculos', veiculoController.listar);
router.post(
	'/veiculos',
	upload.fields([
		{ name: 'fotos', maxCount: 12 },
		{ name: 'manual', maxCount: 1 },
	]),
	veiculoController.criar
);
router.put(
	'/veiculos/:id',
	upload.fields([
		{ name: 'fotos', maxCount: 12 },
		{ name: 'manual', maxCount: 1 },
	]),
	veiculoController.atualizar
);
router.delete('/veiculos/:id/fotos/:fotoId', veiculoController.excluirFoto);
router.delete('/veiculos/:id', veiculoController.excluir);

// Histórico de KM
router.post('/veiculos/:id/kms', express.json(), veiculoController.adicionarKm);
router.get('/veiculos/:id/kms', veiculoController.listarKms);
router.get('/veiculos/:id/kms/medias', veiculoController.mediasKms);
router.put('/veiculos/:id/kms/:kmId', express.json(), veiculoController.atualizarKm);

// Histórico de Saldo
router.post('/veiculos/:id/saldos', express.json(), veiculoController.adicionarSaldo);
router.get('/veiculos/:id/saldos', veiculoController.listarSaldos);
router.put('/veiculos/:id/saldos/:saldoId', express.json(), veiculoController.atualizarSaldo);

module.exports = router;
