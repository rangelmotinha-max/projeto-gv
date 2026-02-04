// Recuperação de senha por nome, matrícula e CPF
async function recuperarSenha(req, res, next) {
  try {
    const { nome, matricula, cpf, novaSenha } = req.body;
    if (!nome || !matricula || !cpf || !novaSenha) {
      return res.status(400).json({ message: 'Preencha todos os campos.' });
    }
    if (!/^\d{4}$/.test(novaSenha)) {
      return res.status(400).json({ message: 'Nova senha deve conter exatamente 4 números.' });
    }
    // Busca usuário por nome, matrícula e cpf
    const usuario = await usuarioService.buscarUsuarioPorDados(nome, matricula, cpf);
    if (!usuario) {
      return res.status(404).json({ message: 'Dados não conferem.' });
    }
    await usuarioService.alterarSenha(usuario.id, usuario.senha, novaSenha, true);
    res.json({ message: 'Senha alterada com sucesso!' });
  } catch (error) {
    next(error);
  }
}
const usuarioService = require('../services/usuarioService');
const { getSession } = require('../middlewares/auth');

const apenasDigitos = (valor = '') => valor.replace(/\D/g, '');

const validarCPF = (cpf) => {
  cpf = apenasDigitos(cpf || '');
  if (!cpf || cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i), 10) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(cpf.charAt(9), 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i), 10) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(cpf.charAt(10), 10)) return false;

  return true;
};

async function listar(req, res, next) {
  try {
    const usuarios = await usuarioService.listarUsuarios();
    res.json(usuarios);
  } catch (error) {
    next(error);
  }
}

async function criar(req, res, next) {
  try {
    const { nome, matricula, posto, cpf, perfil, senha } = req.body;

    const erros = [];

    if (!nome) erros.push('Informe o nome completo.');

    const matriculaDigits = apenasDigitos(matricula || '');
    if (!/^\d{8}$/.test(matriculaDigits)) {
      erros.push('Matrícula deve conter exatamente 8 números.');
    }

    if (!posto) erros.push('Informe o posto/graduação.');

    const cpfDigits = apenasDigitos(cpf || '');
    if (!/^\d{11}$/.test(cpfDigits)) {
      erros.push('CPF deve conter exatamente 11 números.');
    } else if (!validarCPF(cpfDigits)) {
      erros.push('CPF inválido.');
    }

    if (!perfil || !['ADMIN', 'EDITOR', 'LEITOR'].includes(perfil)) {
      erros.push('Selecione um tipo de perfil válido.');
    }

    if (!senha || !/^\d{4}$/.test(senha)) {
      erros.push('Senha deve conter exatamente 4 números.');
    }

    if (erros.length) {
      return res.status(400).json({ message: erros[0] });
    }

    const usuarioCriado = await usuarioService.criarUsuario({
      nome,
      matricula: matriculaDigits,
      posto,
      cpf: cpfDigits,
      perfil,
      senha,
    });

    res.status(201).json(usuarioCriado);
  } catch (error) {
    next(error);
  }
}

async function atualizar(req, res, next) {
  try {
    const { id } = req.params;
    const { nome, matricula, posto, cpf, perfil, senha } = req.body;

    const erros = [];

    if (!nome) erros.push('Informe o nome completo.');

    const matriculaDigits = apenasDigitos(matricula || '');
    if (!/^\d{8}$/.test(matriculaDigits)) {
      erros.push('Matrícula deve conter exatamente 8 números.');
    }

    if (!posto) erros.push('Informe o posto/graduação.');

    const cpfDigits = apenasDigitos(cpf || '');
    if (!/^\d{11}$/.test(cpfDigits)) {
      erros.push('CPF deve conter exatamente 11 números.');
    } else if (!validarCPF(cpfDigits)) {
      erros.push('CPF inválido.');
    }

    if (!perfil || !['ADMIN', 'EDITOR', 'LEITOR'].includes(perfil)) {
      erros.push('Selecione um tipo de perfil válido.');
    }

    if (!senha || !/^\d{4}$/.test(senha)) {
      erros.push('Senha deve conter exatamente 4 números.');
    }

    if (erros.length) {
      return res.status(400).json({ message: erros[0] });
    }

    const usuarioAtualizado = await usuarioService.atualizarUsuario(id, {
      nome,
      matricula: matriculaDigits,
      posto,
      cpf: cpfDigits,
      perfil,
      senha,
    });

    res.json(usuarioAtualizado);
  } catch (error) {
    next(error);
  }
}

async function excluir(req, res, next) {
  try {
    const { id } = req.params;
    await usuarioService.excluirUsuario(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function alterarSenha(req, res, next) {
  try {
    const { id } = req.params;
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
      return res
        .status(400)
        .json({ message: 'Informe a senha atual e a nova senha.' });
    }

    if (!/^\d{4}$/.test(novaSenha)) {
      return res
        .status(400)
        .json({ message: 'Nova senha deve conter exatamente 4 números.' });
    }

    const sess = getSession(req);
    if (!sess) {
      return res.status(401).json({ message: 'Não autenticado.' });
    }

    const isSelf = String(sess.id) === String(id);
    const isAdmin = sess.perfil === 'ADMIN';

    // Regra: cada usuário pode alterar apenas a própria senha.
    // Administradores podem alterar a senha de qualquer usuário.
    if (!isSelf && !isAdmin) {
      return res
        .status(403)
        .json({ message: 'Você só pode alterar a sua própria senha.' });
    }

    if (isSelf) {
      await usuarioService.alterarSenha(id, senhaAtual, novaSenha);
    } else if (isAdmin) {
      // Admin alterando senha de outro usuário: ignora validação da senha atual
      await usuarioService.alterarSenha(id, '', novaSenha, true);
    }

    res.json({ message: 'Senha alterada com sucesso.' });
  } catch (error) {
    if (error.status === 401) {
      return res.status(401).json({ message: 'Senha não confere.' });
    }
    next(error);
  }
}

async function zerarSenhaAdmin(req, res, next) {
  try {
    const sess = getSession(req);
    if (!sess || sess.perfil !== 'ADMIN') {
      return res
        .status(403)
        .json({ message: 'Apenas administradores podem zerar senha de usuários.' });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'ID do usuário é obrigatório.' });
    }

    const novaSenha = '0000';
    await usuarioService.alterarSenha(id, '', novaSenha, true);

    return res.json({
      message: 'Senha zerada com sucesso.',
      novaSenha,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listar,
  criar,
  atualizar,
  excluir,
  alterarSenha,
  recuperarSenha,
   zerarSenhaAdmin,
};
