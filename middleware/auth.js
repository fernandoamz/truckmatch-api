// middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config();

const getTokenFromHeader = (req) => {
  const authHeader = req.headers['authorization'] || '';
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') return parts[1];
  return null;
};

const authenticateToken = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) {
      return res.error('Access token required', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.error('User not found', 401);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.error('Invalid token', 401);
    }
    if (error.name === 'TokenExpiredError') {
      return res.error('Token expired', 401);
    }
    next(error);
  }
};

const attachUserFromAuthHeader = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return next();
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role
      };
    }
  } catch (error) {
    // Silent fail - continue without user
  }
  next();
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.error('Authentication required', 401);
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.error('Insufficient permissions', 403);
    }
    
    next();
  };
};

module.exports = {
  authenticateToken,
  attachUserFromAuthHeader,
  authorize,
  getTokenFromHeader
};
