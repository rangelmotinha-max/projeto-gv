const express = require('express');
const usuarioController = require('../controllers/usuarioController');
const { requireRoles } = require('../middlewares/auth');

const router = express.Router();

// /api/v1/usuarios
router.get('/usuarios', usuarioController.listar);
// Escrita de usuários restrita a ADMIN/EDITOR
router.post('/usuarios', requireRoles(['ADMIN', 'EDITOR']), usuarioController.criar);
router.put('/usuarios/:id', requireRoles(['ADMIN', 'EDITOR']), usuarioController.atualizar);
router.delete('/usuarios/:id', requireRoles(['ADMIN', 'EDITOR']), usuarioController.excluir);


// alteração de senha do usuário logado
// Alteração de senha do próprio usuário — permitir para qualquer perfil autenticado
router.put('/usuarios/:id/senha', usuarioController.alterarSenha);

// reset de senha por administrador (zera para 0000)
// Reset de senha por administrador — manter restrito a ADMIN
router.put('/usuarios/:id/zerar-senha', requireRoles(['ADMIN']), usuarioController.zerarSenhaAdmin);

// recuperação de senha por nome, matrícula e CPF
router.put('/usuarios/recuperar-senha', usuarioController.recuperarSenha);

module.exports = router;
