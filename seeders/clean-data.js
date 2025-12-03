// seeders/clean-data.js
const { 
  User, 
  Driver, 
  Unit, 
  Document, 
  Order,
  Assignment,
  TripRoute,
  TripRouteEvent,
  Tracking,
  Notification,
  Billing,
  Payment,
  FleetMaintenance,
  sequelize 
} = require('../models');

const cleanData = async () => {
  try {
    console.log('🧹 Starting database cleanup...');

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // Delete in correct order (respecting foreign key constraints)
      
      // Delete payments first (references billing)
      const deletedPayments = await Payment.destroy({ 
        where: {},
        truncate: false,
        transaction 
      });
      console.log(`✓ Deleted ${deletedPayments} payments`);

      // Delete billing (references orders)
      const deletedBilling = await Billing.destroy({ 
        where: {},
        truncate: false,
        transaction 
      });
      console.log(`✓ Deleted ${deletedBilling} billing records`);

      // Delete notifications (references users)
      const deletedNotifications = await Notification.destroy({ 
        where: {},
        truncate: false,
        transaction 
      });
      console.log(`✓ Deleted ${deletedNotifications} notifications`);

      // Delete tracking (references trip routes)
      const deletedTracking = await Tracking.destroy({ 
        where: {},
        truncate: false,
        transaction 
      });
      console.log(`✓ Deleted ${deletedTracking} tracking records`);

      // Delete fleet maintenance (references units)
      const deletedMaintenance = await FleetMaintenance.destroy({ 
        where: {},
        truncate: false,
        transaction 
      });
      console.log(`✓ Deleted ${deletedMaintenance} fleet maintenance records`);

      // Delete assignments first (references orders, drivers, units)
      const deletedAssignments = await Assignment.destroy({ 
        where: {},
        truncate: false,
        transaction 
      });
      console.log(`✓ Deleted ${deletedAssignments} assignments`);

      // Delete trip route events first (references trip routes)
      const deletedEvents = await TripRouteEvent.destroy({ 
        where: {},
        truncate: false,
        transaction 
      });
      console.log(`✓ Deleted ${deletedEvents} trip route events`);

      // Delete trip routes (references orders, drivers, units)
      const deletedTripRoutes = await TripRoute.destroy({ 
        where: {},
        truncate: false,
        transaction 
      });
      console.log(`✓ Deleted ${deletedTripRoutes} trip routes`);

      // Delete documents (references drivers and units)
      const deletedDocuments = await Document.destroy({ 
        where: {},
        truncate: false,
        transaction 
      });
      console.log(`✓ Deleted ${deletedDocuments} documents`);

      // Delete orders (references users)
      const deletedOrders = await Order.destroy({ 
        where: {},
        truncate: false,
        transaction 
      });
      console.log(`✓ Deleted ${deletedOrders} orders`);

      // Delete units (references drivers)
      const deletedUnits = await Unit.destroy({ 
        where: {},
        truncate: false,
        transaction 
      });
      console.log(`✓ Deleted ${deletedUnits} units`);

      // Delete drivers
      const deletedDrivers = await Driver.destroy({ 
        where: {},
        truncate: false,
        transaction 
      });
      console.log(`✓ Deleted ${deletedDrivers} drivers`);

      // Delete users
      const deletedUsers = await User.destroy({ 
        where: {},
        truncate: false,
        transaction 
      });
      console.log(`✓ Deleted ${deletedUsers} users`);

      // Commit transaction
      await transaction.commit();
      
      console.log('🎉 Database cleaned successfully!');
      console.log('\n📋 Cleanup Summary:');
      console.log(`   Payments: ${deletedPayments}`);
      console.log(`   Billing Records: ${deletedBilling}`);
      console.log(`   Notifications: ${deletedNotifications}`);
      console.log(`   Tracking Records: ${deletedTracking}`);
      console.log(`   Fleet Maintenance: ${deletedMaintenance}`);
      console.log(`   Assignments: ${deletedAssignments}`);
      console.log(`   Trip Route Events: ${deletedEvents}`);
      console.log(`   Trip Routes: ${deletedTripRoutes}`);
      console.log(`   Documents: ${deletedDocuments}`);
      console.log(`   Orders: ${deletedOrders}`);
      console.log(`   Units: ${deletedUnits}`);
      console.log(`   Drivers: ${deletedDrivers}`);
      console.log(`   Users: ${deletedUsers}`);

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    throw error;
  }
};

// Run cleaner if called directly
if (require.main === module) {
  const { syncModels } = require('../models');
  
  sequelize.authenticate()
    .then(() => syncModels())
    .then(() => cleanData())
    .then(() => {
      console.log('✓ Cleanup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanData };
