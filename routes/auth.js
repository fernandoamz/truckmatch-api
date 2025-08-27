// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const { createAccessToken, createRefreshToken, verifyToken } = require('../utils/token');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// En producción: guarda refresh tokens en DB o Redis
const REFRESH_TOKENS = new Set();

// Registro
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ message: 'Email ya registrado' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, role });

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    REFRESH_TOKENS.add(refreshToken);

    res.status(201).json({
      user: { id: user.id, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registrando usuario', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Datos incompletos' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Credenciales inválidas' });

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    REFRESH_TOKENS.add(refreshToken);

    res.json({
      user: { id: user.id, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en login', error: error.message });
  }
});

// Refresh
router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token requerido' });
    if (!REFRESH_TOKENS.has(refreshToken))
      return res.status(403).json({ message: 'Refresh token no permitido' });

    const payload = verifyToken(refreshToken); // { userId, iat, exp }
    const user = { id: payload.userId, role: payload.role || 'driver' };
    const newAccess = createAccessToken(user);
    res.json({ accessToken: newAccess });
  } catch (error) {
    res.status(403).json({ message: 'Refresh token inválido', error: error.message });
  }
});

// Perfil autenticado
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: ['id', 'email', 'role', 'createdAt'],
    });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo usuario' });
  }
});

module.exports = router;
