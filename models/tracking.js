const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Tracking extends Model {}

Tracking.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: () => require('crypto').randomUUID(),
    primaryKey: true
  },
  tripRouteId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'trip_routes', key: 'id' },
    onDelete: 'CASCADE'
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  speed: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  accuracy: {
    type: DataTypes.DECIMAL(6, 2),
    defaultValue: 0
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Tracking',
  tableName: 'trackings',
  timestamps: true,
  indexes: [
    { fields: ['tripRouteId', 'createdAt'] },
    { fields: ['userId'] }
  ]
});

module.exports = Tracking;
