// routes/documents.js
const express = require('express');
const { body } = require('express-validator');
const { 
  upload,
  uploadDocument, 
  getDocuments, 
  getDocumentById, 
  updateDocument, 
  deleteDocument 
} = require('../controllers/documentController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateDocumentUpload = [
  body('entityType')
    .isIn(['driver', 'unit'])
    .withMessage('Entity type must be driver or unit'),
  body('entityId')
    .isUUID()
    .withMessage('Valid entity ID is required'),
  body('type')
    .isIn(['license', 'insurance', 'registration', 'inspection', 'permit', 'medical_certificate', 'identification', 'other'])
    .withMessage('Invalid document type'),
  body('expirationDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Valid expiration date is required'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

const validateDocumentUpdate = [
  body('type')
    .optional()
    .isIn(['license', 'insurance', 'registration', 'inspection', 'permit', 'medical_certificate', 'identification', 'other'])
    .withMessage('Invalid document type'),
  body('expirationDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Valid expiration date is required'),
  body('status')
    .optional()
    .isIn(['valid', 'expired', 'rejected', 'pending_review'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

// Routes
router.post('/upload', authenticateToken, upload.single('document'), validateDocumentUpload, uploadDocument);
router.get('/', authenticateToken, getDocuments);
router.get('/:id', authenticateToken, getDocumentById);
router.patch('/:id', authenticateToken, validateDocumentUpdate, updateDocument);
router.delete('/:id', authenticateToken, deleteDocument);

module.exports = router;