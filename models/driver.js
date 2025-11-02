// models/driver.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Driver extends Model {}

Driver.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100],
    },
  },
  license: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
    },
  },
  licenseExpirationDate: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true,
      isAfter: new Date().toISOString().split('T')[0], // Must be future date
    },
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'under_review'),
    allowNull: false,
    defaultValue: 'under_review',
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [10, 15],
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'Driver',
  tableName: 'drivers',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['license']
    }
  ]
});

module.exports = Driver;