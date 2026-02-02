const db = require('../config/db');
const { setLoginCookie, clearLoginCookie } = require('../middlewares/auth');

async function login(req, res, next) {
  try {
    const { matricula, senha } = req.body;

    if (!matricula || !senha) {
      return res
        .status(400)
        .json({ message: 'Informe matrícula e senha.' });
    }

    // Normaliza e valida regra: matrícula 8 dígitos, senha 4 dígitos
    const matriculaDigits = String(matricula).replace(/\D/g, '');
    if (!/^\d{8}$/.test(matriculaDigits)) {
      console.log('[auth] login rejeitado: matrícula inválida', { matriculaOriginal: matricula, condicao: '8 dígitos' });
      return res.status(400).json({ message: 'Matrícula deve conter exatamente 8 números.' });
    }
      const senhaDigitsReq = String(senha).replace(/\D/g, '');
      if (!/^\d{4}$/.test(senhaDigitsReq)) {
        console.log('[auth] login rejeitado: senha inválida', { matricula: matriculaDigits, condicao: '4 dígitos' });
        return res.status(400).json({ message: 'A senha deve ter exatamente 4 números.' });
      }

    // Busca por matrícula e compara senha em código (evita qualquer problema de bind)
    const [rows] = await db.query(
      'SELECT id, nome_completo AS nome, matricula, posto_graduacao AS posto, perfil, senha FROM usuarios WHERE matricula = ? LIMIT 1',
      [matriculaDigits]
    );

    if (!rows.length) {
      console.log('[auth] 401: usuário não encontrado', {
        matricula: matriculaDigits,
        usuarioDb: null,
        condicao: 'rows.length === 0',
      });
      return res.status(401).json({ message: 'Matrícula ou senha incorretos.' });
    }

    const usuario = rows[0];
      const senhaDigitsDb = String(usuario.senha ?? '').replace(/\D/g, '');
      const condicao = 'senhaDigitsDb === senhaDigitsReq';
      const comparado = { senhaDigitsDb, senhaDigitsReq };
      if (senhaDigitsDb !== senhaDigitsReq) {
        const usuarioLog = { ...usuario };
        delete usuarioLog.senha;
        console.log('[auth] 401: senha incorreta', {
          matricula: matriculaDigits,
          usuarioDb: usuarioLog,
          condicao,
          comparado,
          resultado: false,
        });
      return res.status(401).json({ message: 'Matrícula ou senha incorretos.' });
    }

    console.log('[auth] login OK', { id: usuario.id, matricula: usuario.matricula, condicao, resultado: true });
    // Define cookie de sessão assinado (HttpOnly)
    setLoginCookie(res, {
      id: usuario.id,
      nome: usuario.nome,
      matricula: usuario.matricula,
      posto: usuario.posto,
      perfil: usuario.perfil,
    });
    res.json({
      id: usuario.id,
      nome: usuario.nome,
      matricula: usuario.matricula,
      posto: usuario.posto,
      perfil: usuario.perfil,
    });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    clearLoginCookie(res);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  logout,
};
