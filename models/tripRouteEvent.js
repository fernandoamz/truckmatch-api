// models/tripRouteEvent.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class TripRouteEvent extends Model {}

TripRouteEvent.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  tripRouteId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'trip_routes',
      key: 'id',
    },
    comment: 'Trip route this event belongs to'
  },
  eventType: {
    type: DataTypes.ENUM(
      'status_change',
      'location_update',
      'note_added',
      'metadata_updated',
      'reassignment',
      'delay_reported',
      'incident_reported'
    ),
    allowNull: false,
    comment: 'Type of event'
  },
  fromStatus: {
    type: DataTypes.ENUM(
      'created',
      'assigned',
      'in_progress',
      'arrived_at_destination',
      'completed',
      'cancelled'
    ),
    allowNull: true,
    comment: 'Previous status (for status_change events)'
  },
  toStatus: {
    type: DataTypes.ENUM(
      'created',
      'assigned',
      'in_progress',
      'arrived_at_destination',
      'completed',
      'cancelled'
    ),
    allowNull: true,
    comment: 'New status (for status_change events)'
  },
  location: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Current location when event occurred: {lat, lng, address}'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Event description or notes'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional event data'
  },
  performedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'User ID who triggered the event (driver, dispatcher, admin)'
  },
  performedByRole: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Role of the user who performed the action'
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'When the event occurred'
  }
}, {
  sequelize,
  modelName: 'TripRouteEvent',
  tableName: 'trip_route_events',
  timestamps: true,
  updatedAt: false, // Events are immutable once created
  indexes: [
    {
      fields: ['tripRouteId']
    },
    {
      fields: ['eventType']
    },
    {
      fields: ['timestamp']
    },
    {
      fields: ['performedBy']
    }
  ]
});

module.exports = TripRouteEvent;
