// models/document.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Document extends Model {}

Document.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  entityType: {
    type: DataTypes.ENUM('driver', 'unit'),
    allowNull: false,
  },
  entityId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM(
      'license',
      'insurance',
      'registration',
      'inspection',
      'permit',
      'medical_certificate',
      'identification',
      'other'
    ),
    allowNull: false,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  expirationDate: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      isDate: true,
    },
  },
  status: {
    type: DataTypes.ENUM('valid', 'expired', 'rejected', 'pending_review'),
    allowNull: false,
    defaultValue: 'pending_review',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'Document',
  tableName: 'documents',
  timestamps: true,
  indexes: [
    {
      fields: ['entityType', 'entityId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['expirationDate']
    }
  ]
});

module.exports = Document;