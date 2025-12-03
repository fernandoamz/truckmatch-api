const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class FleetMaintenance extends Model {}

FleetMaintenance.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: () => require('crypto').randomUUID(),
    primaryKey: true
  },
  unitId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'units', key: 'id' },
    onDelete: 'CASCADE'
  },
  type: {
    type: DataTypes.ENUM('oil_change', 'tire_rotation', 'inspection', 'repair', 'cleaning', 'fuel_log'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  nextMaintenanceDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional data (fuel liters, odometer, etc)'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'FleetMaintenance',
  tableName: 'fleet_maintenances',
  timestamps: true,
  indexes: [
    { fields: ['unitId', 'date'] },
    { fields: ['type'] }
  ]
});

module.exports = FleetMaintenance;
