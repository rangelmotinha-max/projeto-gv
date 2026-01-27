const db = require('../config/db');

async function login(req, res, next) {
  try {
    const { matricula, senha } = req.body;

    if (!matricula || !senha) {
      return res
        .status(400)
        .json({ message: 'Informe matrícula e senha.' });
    }

    const [rows] = await db.execute(
      'SELECT id, nome_completo AS nome, matricula, posto_graduacao AS posto, perfil FROM usuarios WHERE matricula = ? AND senha = ? LIMIT 1',
      [matricula, senha]
    );

    if (!rows.length) {
      return res
        .status(401)
        .json({ message: 'Matrícula ou senha incorretos.' });
    }

    const usuario = rows[0];

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

module.exports = {
  login,
};
