const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const { createAccessToken, createRefreshToken, verifyToken } = require('../utils/token');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

const REFRESH_TOKENS = new Set(); // En producción guarda en DB o Redis

// Registro
router.post('/register', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) return res.status(400).json({ message: 'Datos incompletos' });

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(409).json({ message: 'Usuario ya existe' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, role });
    res.status(201).json({ message: 'Usuario creado', userId: user.id });
  } catch (error) {
    res.status(500).json({ message: 'Error en registro', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Datos incompletos' });

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Credenciales inválidas' });

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    REFRESH_TOKENS.add(refreshToken);

    res.json({ accessToken, refreshToken });
  } catch (error) {
    res.status(500).json({ message: 'Error en login', error: error.message });
  }
});

// Refresh token
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'Refresh token requerido' });
  if (!REFRESH_TOKENS.has(refreshToken)) return res.status(403).json({ message: 'Refresh token inválido' });

  try {
    const payload = verifyToken(refreshToken);
    const user = { id: payload.userId, role: payload.role || 'driver' };

    const newAccessToken = createAccessToken(user);
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(403).json({ message: 'Refresh token inválido' });
  }
});

// Perfil autenticado
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, { attributes: ['id', 'email', 'role', 'createdAt'] });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo usuario' });
  }
});

module.exports = router;
