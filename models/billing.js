const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Billing extends Model {}

Billing.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: () => require('crypto').randomUUID(),
    primaryKey: true
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'orders', key: 'id' },
    onDelete: 'CASCADE'
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'paid', 'overdue'),
    defaultValue: 'draft'
  },
  issueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  paidDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Billing',
  tableName: 'billings',
  timestamps: true,
  indexes: [
    { fields: ['orderId'] },
    { fields: ['status', 'createdAt'] }
  ]
});

module.exports = Billing;
