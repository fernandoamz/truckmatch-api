// models/index.js
const sequelize = require('../config/db');

// Import all models
const User = require('./user');
const Unit = require('./unit');
const Driver = require('./driver');
const Document = require('./document');
const Order = require('./order');
const Assignment = require('./assignment');
const TripRoute = require('./tripRoute');
const TripRouteEvent = require('./tripRouteEvent');
const Tracking = require('./tracking');
const Notification = require('./notification');
const Billing = require('./billing');
const Payment = require('./payment');
const FleetMaintenance = require('./fleetMaintenance');

// Define relationships
// Driver-Unit relationship (one driver can have multiple units)
Driver.hasMany(Unit, { foreignKey: 'driverId', as: 'units' });
Unit.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

// User-Order relationship (one user can have multiple orders)
User.hasMany(Order, { foreignKey: 'clientId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'clientId', as: 'client' });

// Assignment relationships
Order.hasOne(Assignment, { foreignKey: 'orderId', as: 'assignment' });
Assignment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Driver.hasMany(Assignment, { foreignKey: 'driverId', as: 'assignments' });
Assignment.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

Unit.hasMany(Assignment, { foreignKey: 'unitId', as: 'assignments' });
Assignment.belongsTo(Unit, { foreignKey: 'unitId', as: 'unit' });

// Document relationships (polymorphic)
// Documents can belong to either drivers or units
Driver.hasMany(Document, { 
  foreignKey: 'entityId', 
  constraints: false,
  scope: { entityType: 'driver' },
  as: 'documents' 
});

Unit.hasMany(Document, { 
  foreignKey: 'entityId', 
  constraints: false,
  scope: { entityType: 'unit' },
  as: 'documents' 
});

Document.belongsTo(Driver, { 
  foreignKey: 'entityId', 
  constraints: false,
  as: 'driver' 
});

Document.belongsTo(Unit, { 
  foreignKey: 'entityId', 
  constraints: false,
  as: 'unit' 
});

// TripRoute relationships
Driver.hasMany(TripRoute, { foreignKey: 'driverId', as: 'tripRoutes' });
TripRoute.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

Unit.hasMany(TripRoute, { foreignKey: 'unitId', as: 'tripRoutes' });
TripRoute.belongsTo(Unit, { foreignKey: 'unitId', as: 'unit' });

Order.hasMany(TripRoute, { foreignKey: 'orderId', as: 'tripRoutes' });
TripRoute.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// TripRouteEvent relationships
TripRoute.hasMany(TripRouteEvent, { foreignKey: 'tripRouteId', as: 'events' });
TripRouteEvent.belongsTo(TripRoute, { foreignKey: 'tripRouteId', as: 'tripRoute' });

// Tracking relationships
TripRoute.hasMany(Tracking, { foreignKey: 'tripRouteId', as: 'trackingHistory' });
Tracking.belongsTo(TripRoute, { foreignKey: 'tripRouteId', as: 'tripRoute' });

// Notification relationships
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Billing relationships
Order.hasOne(Billing, { foreignKey: 'orderId', as: 'billing' });
Billing.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Billing.hasMany(Payment, { foreignKey: 'billingId', as: 'payments' });
Payment.belongsTo(Billing, { foreignKey: 'billingId', as: 'billing' });

// FleetMaintenance relationships
Unit.hasMany(FleetMaintenance, { foreignKey: 'unitId', as: 'maintenanceHistory' });
FleetMaintenance.belongsTo(Unit, { foreignKey: 'unitId', as: 'unit' });

// Export all models and sequelize instance
module.exports = {
  sequelize,
  User,
  Unit,
  Driver,
  Document,
  Order,
  Assignment,
  TripRoute,
  TripRouteEvent,
  Tracking,
  Notification,
  Billing,
  Payment,
  FleetMaintenance
};

// Function to sync all models
const syncModels = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Unable to sync models:', error);
  }
};

module.exports.syncModels = syncModels;