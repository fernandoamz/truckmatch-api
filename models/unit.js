// models/unit.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Unit extends Model {}

Unit.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  plateNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
    },
  },
  model: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  type: {
    type: DataTypes.ENUM('truck', 'trailer', 'van', 'pickup'),
    allowNull: false,
    defaultValue: 'truck',
  },
  capacity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.1,
    },
  },
  capacityUnit: {
    type: DataTypes.ENUM('tons', 'kg', 'm3'),
    allowNull: false,
    defaultValue: 'tons',
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'maintenance', 'assigned'),
    allowNull: false,
    defaultValue: 'active',
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1980,
      max: new Date().getFullYear() + 1,
    },
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  driverId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'drivers',
      key: 'id',
    },
  },
}, {
  sequelize,
  modelName: 'Unit',
  tableName: 'units',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['plateNumber']
    }
  ]
});

module.exports = Unit;
