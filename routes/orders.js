// routes/orders.js
const express = require('express');
const { body } = require('express-validator');
const { 
  createOrder, 
  getOrders, 
  getOrderById, 
  updateOrder, 
  deleteOrder,
  getOrderStatistics 
} = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateLocationObject = (location, fieldName) => {
  if (!location.address || !location.city || !location.state) {
    throw new Error(`${fieldName} must include address, city, and state`);
  }
  return true;
};

const validateOrder = [
  body('origin')
    .isObject()
    .withMessage('Origin must be an object')
    .custom((value) => validateLocationObject(value, 'Origin')),
  body('destination')
    .isObject()
    .withMessage('Destination must be an object')
    .custom((value) => validateLocationObject(value, 'Destination')),
  body('cargoDescription')
    .trim()
    .notEmpty()
    .withMessage('Cargo description is required')
    .isLength({ max: 1000 })
    .withMessage('Cargo description cannot exceed 1000 characters'),
  body('cargoWeight')
    .isFloat({ min: 0.1 })
    .withMessage('Cargo weight must be a positive number'),
  body('cargoWeightUnit')
    .optional()
    .isIn(['tons', 'kg', 'lbs'])
    .withMessage('Invalid cargo weight unit'),
  body('requirements')
    .optional()
    .isArray()
    .withMessage('Requirements must be an array'),
  body('pickupDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Valid pickup date is required'),
  body('deliveryDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Valid delivery date is required'),
  body('rate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Rate must be a positive number'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

const validateOrderUpdate = [
  body('origin')
    .optional()
    .isObject()
    .withMessage('Origin must be an object')
    .custom((value) => value ? validateLocationObject(value, 'Origin') : true),
  body('destination')
    .optional()
    .isObject()
    .withMessage('Destination must be an object')
    .custom((value) => value ? validateLocationObject(value, 'Destination') : true),
  body('cargoDescription')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Cargo description cannot be empty')
    .isLength({ max: 1000 })
    .withMessage('Cargo description cannot exceed 1000 characters'),
  body('cargoWeight')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Cargo weight must be a positive number'),
  body('cargoWeightUnit')
    .optional()
    .isIn(['tons', 'kg', 'lbs'])
    .withMessage('Invalid cargo weight unit'),
  body('requirements')
    .optional()
    .isArray()
    .withMessage('Requirements must be an array'),
  body('pickupDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Valid pickup date is required'),
  body('deliveryDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Valid delivery date is required'),
  body('rate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Rate must be a positive number'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code'),
  body('status')
    .optional()
    .isIn(['pending', 'assigned', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

// Routes
router.post('/', authenticateToken, validateOrder, createOrder);
router.get('/', authenticateToken, getOrders);
router.get('/statistics', authenticateToken, getOrderStatistics);
router.get('/:id', authenticateToken, getOrderById);
router.patch('/:id', authenticateToken, validateOrderUpdate, updateOrder);
router.delete('/:id', authenticateToken, deleteOrder);

module.exports = router;