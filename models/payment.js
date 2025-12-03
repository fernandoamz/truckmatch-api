const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Payment extends Model {}

Payment.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: () => require('crypto').randomUUID(),
    primaryKey: true
  },
  billingId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'billings', key: 'id' },
    onDelete: 'CASCADE'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.ENUM('credit_card', 'bank_transfer', 'cash', 'check'),
    allowNull: false
  },
  referenceNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Payment',
  tableName: 'payments',
  timestamps: true,
  indexes: [
    { fields: ['billingId', 'status'] }
  ]
});

module.exports = Payment;
