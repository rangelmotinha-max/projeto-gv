// Rotas da API de saúde
const express = require('express');
const healthController = require('../controllers/healthController');

const router = express.Router();

router.get('/health', healthController.getHealth);

module.exports = router;
