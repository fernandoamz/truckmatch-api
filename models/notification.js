const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Notification extends Model {}

Notification.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: () => require('crypto').randomUUID(),
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE'
  },
  type: {
    type: DataTypes.ENUM('trip_status', 'order_update', 'driver_alert', 'system_alert'),
    defaultValue: 'system_alert'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  relatedId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID of related entity (trip, order, etc)'
  },
  relatedType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Type of related entity'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Notification',
  tableName: 'notifications',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'isRead', 'createdAt'] }
  ]
});

module.exports = Notification;
