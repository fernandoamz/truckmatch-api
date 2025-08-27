// middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const getTokenFromHeader = (req) => {
  const authHeader = req.headers['authorization'] || '';
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') return parts[1];
  return null;
};

const authenticateToken = (req, res, next) => {
  const token = getTokenFromHeader(req);
  if (!token) return res.status(401).json({ message: 'Token requerido' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido' });
    req.user = user; // { userId, role, iat, exp }
    next();
  });
};

const attachUserFromAuthHeader = (req, _res, next) => {
  const token = getTokenFromHeader(req);
  if (!token) return next();
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
  } catch (_) {
    // token inválido => seguimos sin usuario
  }
  next();
};

module.exports = authenticateToken;
module.exports.getTokenFromHeader = getTokenFromHeader;
module.exports.attachUserFromAuthHeader = attachUserFromAuthHeader;
