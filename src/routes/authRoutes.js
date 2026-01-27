const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// /api/v1/login
router.post('/login', authController.login);

module.exports = router;
