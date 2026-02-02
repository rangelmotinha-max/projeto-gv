const path = require('path');
const crypto = require('crypto');
const { authSecret } = require('../config/env');

function signToken(payload) {
  const data = JSON.stringify(payload);
  const sig = crypto.createHmac('sha256', authSecret).update(data).digest('hex');
  const token = Buffer.from(data, 'utf8').toString('base64') + '.' + sig;
  return token;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [b64, sig] = parts;
  let data;
  try {
    data = Buffer.from(b64, 'base64').toString('utf8');
  } catch {
    return null;
  }
  const expected = crypto.createHmac('sha256', authSecret).update(data).digest('hex');
  if (sig !== expected) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function parseCookies(req) {
  const header = req.headers?.cookie;
  const result = {};
  if (!header) return result;
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx > -1) {
      const key = part.slice(0, idx).trim();
      const val = part.slice(idx + 1).trim();
      result[key] = val;
    }
  });
  return result;
}

function getSession(req) {
  const cookies = parseCookies(req);
  const token = cookies['sgv_session'];
  const payload = verifyToken(token);
  return payload || null;
}

function setLoginCookie(res, payload) {
  const token = signToken(payload);
  const cookieVal = `sgv_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
  res.setHeader('Set-Cookie', cookieVal);
}

function clearLoginCookie(res) {
  const cookieVal = `sgv_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  res.setHeader('Set-Cookie', cookieVal);
}

function requireRoles(roles = []) {
  return (req, res, next) => {
    const sess = getSession(req);
    if (!sess) {
      // Não logado: volta para login
      return res.redirect('/index.html');
    }
    const perfil = sess.perfil;
    if (!roles.includes(perfil)) {
      // Editor tentando página não permitida: redireciona para área permitida
      if (perfil === 'EDITOR') {
        return res.redirect('/lancar-km.html');
      }
      return res.status(403).send('Acesso negado');
    }
    // Anexa sessão ao request para uso futuro
    req.sessionUser = sess;
    next();
  };
}

function servePublic(fileName) {
  return (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'public', fileName));
  };
}

module.exports = {
  signToken,
  verifyToken,
  parseCookies,
  getSession,
  setLoginCookie,
  clearLoginCookie,
  requireRoles,
  servePublic,
};
