const express = require('express');
const veiculoController = require('../controllers/veiculoController');
const upload = require('../middlewares/upload');
const { requireRoles } = require('../middlewares/auth');

const router = express.Router();

// /api/v1/veiculos
router.get('/veiculos', veiculoController.listar);
// Criação de veículo (somente ADMIN/EDITOR)
router.post(
	'/veiculos',
	requireRoles(['ADMIN', 'EDITOR']),
	upload.fields([
		{ name: 'fotos', maxCount: 12 },
		{ name: 'manual', maxCount: 1 },
	]),
	veiculoController.criar
);
// Atualização de veículo (somente ADMIN/EDITOR)
router.put(
	'/veiculos/:id',
	requireRoles(['ADMIN', 'EDITOR']),
	upload.fields([
		{ name: 'fotos', maxCount: 12 },
		{ name: 'manual', maxCount: 1 },
	]),
	veiculoController.atualizar
);
// Exclusões (somente ADMIN/EDITOR)
router.delete('/veiculos/:id/fotos/:fotoId', requireRoles(['ADMIN', 'EDITOR']), veiculoController.excluirFoto);
router.delete('/veiculos/:id', requireRoles(['ADMIN', 'EDITOR']), veiculoController.excluir);

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
