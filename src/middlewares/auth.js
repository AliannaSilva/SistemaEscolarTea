// middlewares/auth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'segredo123';

function authMiddleware(req, res, next) {
  // suporte para ?token=... (útil para downloads do relatório onde header pode não estar presente)
  let token = null;
  if (req.query && req.query.token) token = req.query.token;
  const header = req.headers['authorization'];
  if (!token && header) token = header.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token ausente' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

module.exports = authMiddleware;
