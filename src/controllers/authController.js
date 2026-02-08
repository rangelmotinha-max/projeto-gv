const db = require('../config/db');
const { setLoginCookie, clearLoginCookie } = require('../middlewares/auth');

async function login(req, res, next) {
  try {
    const { matricula, senha } = req.body;

    // Captura informações do cliente
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
      || req.headers['x-real-ip'] 
      || req.socket.remoteAddress 
      || req.connection.remoteAddress;
    
    const userAgent = req.headers['user-agent'] || 'Desconhecido';
    
    // Identifica o browser
    let browser = 'Desconhecido';
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
    else if (userAgent.includes('Edg')) browser = 'Edge';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera';
    
    // Identifica o sistema operacional
    let os = 'Desconhecido';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac OS')) os = 'MacOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

    if (!matricula || !senha) {
      return res
        .status(400)
        .json({ message: 'Informe matrícula e senha.' });
    }

    // Normaliza e valida regra: matrícula 8 dígitos, senha 4 dígitos
    const matriculaDigits = String(matricula).replace(/\D/g, '');
    if (!/^\d{8}$/.test(matriculaDigits)) {
      console.log('[auth] login rejeitado: matrícula inválida', { matriculaOriginal: matricula, condicao: '8 dígitos', ip, browser, os });
      return res.status(400).json({ message: 'Matrícula deve conter exatamente 8 números.' });
    }
      const senhaDigitsReq = String(senha).replace(/\D/g, '');
      if (!/^\d{4}$/.test(senhaDigitsReq)) {
        console.log('[auth] login rejeitado: senha inválida', { matricula: matriculaDigits, condicao: '4 dígitos', ip, browser, os });
        return res.status(400).json({ message: 'A senha deve ter exatamente 4 números.' });
      }

    // Busca por matrícula e compara senha em código (evita qualquer problema de bind)
    const [rows] = await db.query(
      'SELECT id, nome_completo AS nome, matricula, posto_graduacao AS posto, perfil, senha FROM usuarios WHERE matricula = ? LIMIT 1',
      [matriculaDigits]
    );

    if (!rows.length) {
      console.log('[auth] ❌ FALHA LOGIN - Usuário não encontrado', {
        matricula: matriculaDigits,
        ip,
        browser,
        os,
        timestamp: new Date().toLocaleString('pt-BR')
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
        console.log('[auth] ❌ FALHA LOGIN - Senha incorreta', {
          matricula: matriculaDigits,
          nome: usuario.nome,
          ip,
          browser,
          os,
          timestamp: new Date().toLocaleString('pt-BR')
        });
      return res.status(401).json({ message: 'Matrícula ou senha incorretos.' });
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ LOGIN REALIZADO COM SUCESSO');
    console.log('───────────────────────────────────────────────────────');
    console.log(`  Usuário: ${usuario.nome} (${usuario.posto})`);
    console.log(`  Matrícula: ${usuario.matricula}`);
    console.log(`  Perfil: ${usuario.perfil}`);
    console.log(`  IP: ${ip}`);
    console.log(`  Browser: ${browser}`);
    console.log(`  Sistema: ${os}`);
    console.log(`  Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
    console.log('═══════════════════════════════════════════════════════');
    
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
    // Captura informações do cliente
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
      || req.headers['x-real-ip'] 
      || req.socket.remoteAddress 
      || req.connection.remoteAddress;
    
    const userAgent = req.headers['user-agent'] || 'Desconhecido';
    
    // Identifica o browser
    let browser = 'Desconhecido';
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
    else if (userAgent.includes('Edg')) browser = 'Edge';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera';
    
    // Tenta pegar informações do usuário antes de limpar o cookie
    const usuario = req.usuario || null;
    
    console.log('───────────────────────────────────────────────────────');
    console.log('🚪 LOGOUT REALIZADO');
    if (usuario) {
      console.log(`  Usuário: ${usuario.nome}`);
      console.log(`  Matrícula: ${usuario.matricula}`);
    }
    console.log(`  IP: ${ip}`);
    console.log(`  Browser: ${browser}`);
    console.log(`  Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
    console.log('───────────────────────────────────────────────────────');
    
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
