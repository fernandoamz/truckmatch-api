// models/assignment.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Assignment extends Model {}

Assignment.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id',
    },
  },
  driverId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'drivers',
      key: 'id',
    },
  },
  unitId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'units',
      key: 'id',
    },
  },
  status: {
    type: DataTypes.ENUM('pending', 'ready', 'started', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
  },
  assignedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  validationResults: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
  },
}, {
  sequelize,
  modelName: 'Assignment',
  tableName: 'assignments',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['orderId']
    },
    {
      fields: ['driverId']
    },
    {
      fields: ['unitId']
    },
    {
      fields: ['status']
    }
  ],
  validate: {
    // Ensure driver and unit are not assigned to multiple active trips
    async uniqueActiveAssignment() {
      if (this.status === 'started' || this.status === 'ready') {
        const activeDriverAssignment = await Assignment.findOne({
          where: {
            driverId: this.driverId,
            status: ['started', 'ready'],
            id: { [sequelize.Sequelize.Op.ne]: this.id }
          }
        });
        
        if (activeDriverAssignment) {
          throw new Error('Driver is already assigned to an active trip');
        }

        const activeUnitAssignment = await Assignment.findOne({
          where: {
            unitId: this.unitId,
            status: ['started', 'ready'],
            id: { [sequelize.Sequelize.Op.ne]: this.id }
          }
        });
        
        if (activeUnitAssignment) {
          throw new Error('Unit is already assigned to an active trip');
        }
      }
    }
  }
});

module.exports = Assignment;