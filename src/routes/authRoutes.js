const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

// /api/v1/login
router.post('/login', authController.login);

// /api/v1/logout
router.post('/logout', authController.logout);

module.exports = router;
