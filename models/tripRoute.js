// models/tripRoute.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class TripRoute extends Model {}

TripRoute.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tripNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Unique trip identifier: TRIP-YYYYMMDD-XXXX'
  },
  origin: {
    type: DataTypes.JSON,
    allowNull: false,
    validate: {
      isValidLocation(value) {
        if (!value.address && !value.coordinates) {
          throw new Error('Origin must include address or coordinates');
        }
        if (value.coordinates && (!value.coordinates.lat || !value.coordinates.lng)) {
          throw new Error('Coordinates must include lat and lng');
        }
      }
    },
    comment: 'Origin with address, city, state, zipCode, coordinates {lat, lng}'
  },
  destination: {
    type: DataTypes.JSON,
    allowNull: false,
    validate: {
      isValidLocation(value) {
        if (!value.address && !value.coordinates) {
          throw new Error('Destination must include address or coordinates');
        }
        if (value.coordinates && (!value.coordinates.lat || !value.coordinates.lng)) {
          throw new Error('Coordinates must include lat and lng');
        }
      }
    },
    comment: 'Destination with address, city, state, zipCode, coordinates {lat, lng}'
  },
  estimatedDistanceKm: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.1,
    },
    comment: 'Estimated distance in kilometers'
  },
  actualDistanceKm: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0,
    },
    comment: 'Actual distance traveled (updated on completion)'
  },
  estimatedDurationHours: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: 0.1,
    },
    comment: 'Estimated duration in hours'
  },
  actualDurationHours: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
    },
    comment: 'Actual duration (calculated from start to completion)'
  },
  status: {
    type: DataTypes.ENUM(
      'created',
      'assigned',
      'in_progress',
      'arrived_at_destination',
      'completed',
      'cancelled'
    ),
    allowNull: false,
    defaultValue: 'created',
    comment: 'Current trip status'
  },
  driverId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'drivers',
      key: 'id',
    },
    comment: 'Assigned driver'
  },
  unitId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'units',
      key: 'id',
    },
    comment: 'Assigned unit/truck'
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'orders',
      key: 'id',
    },
    comment: 'Associated order (optional for empty returns or repositioning)'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional data: weather, toll fees, fuel consumption, etc.'
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when trip started (status changed to in_progress)'
  },
  arrivedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when arrived at destination'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when trip was completed'
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when trip was cancelled'
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason for cancellation'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional notes or observations'
  }
}, {
  sequelize,
  modelName: 'TripRoute',
  tableName: 'trip_routes',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['tripNumber']
    },
    {
      fields: ['status']
    },
    {
      fields: ['driverId']
    },
    {
      fields: ['unitId']
    },
    {
      fields: ['orderId']
    },
    {
      fields: ['createdAt']
    }
  ],
  hooks: {
    beforeValidate: async (tripRoute) => {
      if (!tripRoute.tripNumber) {
        // Generate trip number: TRIP-YYYYMMDD-XXXX
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
        const generated = `TRIP-${date}-${random}`;
        tripRoute.setDataValue('tripNumber', generated);
      }
    }
  }
});

module.exports = TripRoute;
