// controllers/documentController.js
const { Document, Driver, Unit } = require('../models');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/documents');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const entityType = req.body.entityType;
    const entityId = req.body.entityId;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${entityType}-${entityId}-${timestamp}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (jpeg, jpg, png) and documents (pdf, doc, docx) are allowed'));
    }
  }
});

// POST /documents/upload
const uploadDocument = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 400, errors.array());
    }

    const { entityType, entityId, type, expirationDate, notes } = req.body;

    // Validate entity exists
    if (entityType === 'driver') {
      const driver = await Driver.findByPk(entityId);
      if (!driver) {
        return res.error('Driver not found', 404);
      }
    } else if (entityType === 'unit') {
      const unit = await Unit.findByPk(entityId);
      if (!unit) {
        return res.error('Unit not found', 404);
      }
    }

    if (!req.file) {
      return res.error('No file uploaded', 400);
    }

    // Create document record
    const document = await Document.create({
      entityType,
      entityId,
      type,
      url: `/uploads/documents/${req.file.filename}`,
      fileName: req.file.originalname,
      expirationDate: expirationDate || null,
      notes,
      status: 'pending_review'
    });

    res.success(document, 'Document uploaded successfully', 201);
  } catch (error) {
    // Clean up uploaded file if database operation fails
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
    }
    next(error);
  }
};

// GET /documents
const getDocuments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { entityType, entityId, type, status } = req.query;

    let whereClause = {};

    // Filter by entity
    if (entityType && ['driver', 'unit'].includes(entityType)) {
      whereClause.entityType = entityType;
    }

    if (entityId) {
      whereClause.entityId = entityId;
    }

    // Filter by document type
    if (type) {
      whereClause.type = type;
    }

    // Filter by status
    if (status && ['valid', 'expired', 'rejected', 'pending_review'].includes(status)) {
      whereClause.status = status;
    }

    const { count, rows } = await Document.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Driver,
          as: 'driver',
          required: false
        },
        {
          model: Unit,
          as: 'unit',
          required: false
        }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.paginated(rows, { page, limit, total: count });
  } catch (error) {
    next(error);
  }
};

// GET /documents/:id
const getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await Document.findByPk(id, {
      include: [
        {
          model: Driver,
          as: 'driver',
          required: false
        },
        {
          model: Unit,
          as: 'unit',
          required: false
        }
      ]
    });

    if (!document) {
      return res.error('Document not found', 404);
    }

    res.success(document, 'Document retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// PATCH /documents/:id
const updateDocument = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const updateData = req.body;

    const document = await Document.findByPk(id);
    if (!document) {
      return res.error('Document not found', 404);
    }

    // Auto-update status based on expiration date
    if (updateData.expirationDate) {
      const now = new Date();
      const expirationDate = new Date(updateData.expirationDate);
      
      if (expirationDate < now) {
        updateData.status = 'expired';
      } else if (document.status === 'expired' && expirationDate > now) {
        updateData.status = 'pending_review';
      }
    }

    await document.update(updateData);

    const updatedDocument = await Document.findByPk(id, {
      include: [
        {
          model: Driver,
          as: 'driver',
          required: false
        },
        {
          model: Unit,
          as: 'unit',
          required: false
        }
      ]
    });

    res.success(updatedDocument, 'Document updated successfully');
  } catch (error) {
    next(error);
  }
};

// DELETE /documents/:id
const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await Document.findByPk(id);
    if (!document) {
      return res.error('Document not found', 404);
    }

    // Delete physical file
    const filePath = path.join(__dirname, '..', document.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await document.destroy();
    res.success(null, 'Document deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Check for expired documents (utility function)
const checkExpiredDocuments = async () => {
  try {
    const now = new Date();
    await Document.update(
      { status: 'expired' },
      {
        where: {
          expirationDate: { [require('sequelize').Op.lt]: now },
          status: { [require('sequelize').Op.ne]: 'expired' }
        }
      }
    );
    console.log('Expired documents updated');
  } catch (error) {
    console.error('Error updating expired documents:', error);
  }
};

module.exports = {
  upload,
  uploadDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  checkExpiredDocuments
};