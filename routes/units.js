// routes/units.js
const express = require('express');
const { body } = require('express-validator');
const { 
  createUnit, 
  getUnits, 
  getUnitById, 
  updateUnit, 
  assignDriver,
  unassignDriver,
  deleteUnit 
} = require('../controllers/unitController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateUnit = [
  body('plateNumber')
    .trim()
    .notEmpty()
    .withMessage('Plate number is required'),
  body('model')
    .trim()
    .notEmpty()
    .withMessage('Model is required'),
  body('type')
    .isIn(['truck', 'trailer', 'van', 'pickup'])
    .withMessage('Invalid unit type'),
  body('capacity')
    .isFloat({ min: 0.1 })
    .withMessage('Capacity must be a positive number'),
  body('capacityUnit')
    .optional()
    .isIn(['tons', 'kg', 'm3'])
    .withMessage('Invalid capacity unit'),
  body('year')
    .optional()
    .isInt({ min: 1980, max: new Date().getFullYear() + 1 })
    .withMessage('Year must be between 1980 and next year'),
  body('brand')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Brand cannot exceed 50 characters')
];

const validateUnitUpdate = [
  body('plateNumber')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Plate number cannot be empty'),
  body('model')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Model cannot be empty'),
  body('type')
    .optional()
    .isIn(['truck', 'trailer', 'van', 'pickup'])
    .withMessage('Invalid unit type'),
  body('capacity')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Capacity must be a positive number'),
  body('capacityUnit')
    .optional()
    .isIn(['tons', 'kg', 'm3'])
    .withMessage('Invalid capacity unit'),
  body('year')
    .optional()
    .isInt({ min: 1980, max: new Date().getFullYear() + 1 })
    .withMessage('Year must be between 1980 and next year'),
  body('brand')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Brand cannot exceed 50 characters'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'maintenance', 'assigned'])
    .withMessage('Invalid status')
];

// Routes
router.post('/', authenticateToken, validateUnit, createUnit);
router.get('/', authenticateToken, getUnits);
router.get('/:id', authenticateToken, getUnitById);
router.put('/:id', authenticateToken, validateUnitUpdate, updateUnit);
router.put('/:id/assign-driver/:driverId', authenticateToken, assignDriver);
router.put('/:id/unassign-driver', authenticateToken, unassignDriver);
router.delete('/:id', authenticateToken, deleteUnit);

module.exports = router;