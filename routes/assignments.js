// routes/assignments.js
const express = require('express');
const { body } = require('express-validator');
const { 
  createAssignment, 
  getAssignments, 
  getAssignmentById, 
  updateAssignment, 
  deleteAssignment,
  revalidateAssignment 
} = require('../controllers/assignmentController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateAssignment = [
  body('orderId')
    .isUUID()
    .withMessage('Valid order ID is required'),
  body('driverId')
    .isUUID()
    .withMessage('Valid driver ID is required'),
  body('unitId')
    .isUUID()
    .withMessage('Valid unit ID is required'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

const validateAssignmentUpdate = [
  body('status')
    .optional()
    .isIn(['pending', 'ready', 'started', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

// Routes
router.post('/', authenticateToken, validateAssignment, createAssignment);
router.get('/', authenticateToken, getAssignments);
router.get('/:id', authenticateToken, getAssignmentById);
router.patch('/:id', authenticateToken, validateAssignmentUpdate, updateAssignment);
router.post('/:id/revalidate', authenticateToken, revalidateAssignment);
router.delete('/:id', authenticateToken, deleteAssignment);

module.exports = router;