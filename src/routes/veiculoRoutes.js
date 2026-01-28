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
router.delete('/veiculos/:id', veiculoController.excluir);

module.exports = router;
