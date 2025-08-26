const jwt = require('jsonwebtoken');
require('dotenv').config();

const createAccessToken = (user) => {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: parseInt(process.env.JWT_ACCESS_EXPIRES || 900, 10) }
  );
};

const createRefreshToken = (user) => {
  return jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: parseInt(process.env.JWT_REFRESH_EXPIRES || 604800, 10) }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { createAccessToken, createRefreshToken, verifyToken };
