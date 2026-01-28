const express = require('express');
const veiculoController = require('../controllers/veiculoController');

const router = express.Router();

// /api/v1/veiculos
router.get('/veiculos', veiculoController.listar);
router.post('/veiculos', veiculoController.criar);
router.put('/veiculos/:id', veiculoController.atualizar);
router.delete('/veiculos/:id', veiculoController.excluir);

module.exports = router;
