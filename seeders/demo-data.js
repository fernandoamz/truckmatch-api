// seeders/demo-data.js
const bcrypt = require('bcryptjs');
const { 
  User, 
  Driver, 
  Unit, 
  Document, 
  Order,
  TripRoute,
  TripRouteEvent,
  Tracking,
  Notification,
  Billing,
  Payment,
  FleetMaintenance,
  sequelize 
} = require('../models');

const seedDemoData = async () => {
  try {
    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      console.log('🌱 Starting database seeding...');

      // Create demo users
      const hashedPassword = await bcrypt.hash('demo123', 10);
      
      const [demoClient, demoEmployer] = await Promise.all([
        User.create({
          email: 'client@truckmatch.com',
          passwordHash: hashedPassword,
          role: 'employer'
        }, { transaction }),
        User.create({
          email: 'admin@truckmatch.com',
          passwordHash: hashedPassword,
          role: 'employer'
        }, { transaction })
      ]);
      console.log('✓ Created demo users');

      // Create demo drivers
      const [driver1, driver2] = await Promise.all([
        Driver.create({
          name: 'Juan Pérez',
          license: 'CDL-123456789',
          licenseExpirationDate: new Date('2026-12-31'),
          phone: '+52-555-0123',
          email: 'juan.perez@email.com',
          address: 'Av. Insurgentes 123, CDMX',
          status: 'active'
        }, { transaction }),
        Driver.create({
          name: 'María González',
          license: 'CDL-987654321',
          licenseExpirationDate: new Date('2026-06-30'),
          phone: '+52-555-0456',
          email: 'maria.gonzalez@email.com',
          address: 'Calle Reforma 456, Guadalajara',
          status: 'active'
        }, { transaction })
      ]);
      console.log('✓ Created demo drivers');

      // Create demo units
      const [unit1, unit2] = await Promise.all([
        Unit.create({
          plateNumber: 'TRK-001-MX',
          model: 'Kenworth T680',
          type: 'truck',
          capacity: 25.5,
          capacityUnit: 'tons',
          year: 2022,
          brand: 'Kenworth',
          status: 'active',
          driverId: driver1.id
        }, { transaction }),
        Unit.create({
          plateNumber: 'TRK-002-MX',
          model: 'Freightliner Cascadia',
          type: 'truck',
          capacity: 30.0,
          capacityUnit: 'tons',
          year: 2023,
          brand: 'Freightliner',
          status: 'active',
          driverId: driver2.id
        }, { transaction })
      ]);
      console.log('✓ Created demo units');

      // Create demo documents for drivers
      await Promise.all([
        // Driver 1 documents
        Document.create({
          entityType: 'driver',
          entityId: driver1.id,
          type: 'license',
          url: '/uploads/documents/demo-license-1.pdf',
          fileName: 'license-juan-perez.pdf',
          expirationDate: new Date('2026-12-31'),
          status: 'valid'
        }, { transaction }),
        Document.create({
          entityType: 'driver',
          entityId: driver1.id,
          type: 'medical_certificate',
          url: '/uploads/documents/demo-medical-1.pdf',
          fileName: 'medical-juan-perez.pdf',
          expirationDate: new Date('2026-03-15'),
          status: 'valid'
        }, { transaction }),
        // Driver 2 documents
        Document.create({
          entityType: 'driver',
          entityId: driver2.id,
          type: 'license',
          url: '/uploads/documents/demo-license-2.pdf',
          fileName: 'license-maria-gonzalez.pdf',
          expirationDate: new Date('2026-06-30'),
          status: 'valid'
        }, { transaction }),
        Document.create({
          entityType: 'driver',
          entityId: driver2.id,
          type: 'medical_certificate',
          url: '/uploads/documents/demo-medical-2.pdf',
          fileName: 'medical-maria-gonzalez.pdf',
          expirationDate: new Date('2026-01-20'),
          status: 'valid'
        }, { transaction })
      ]);

      // Create demo documents for units
      await Promise.all([
        // Unit 1 documents
        Document.create({
          entityType: 'unit',
          entityId: unit1.id,
          type: 'registration',
          url: '/uploads/documents/demo-registration-1.pdf',
          fileName: 'registration-trk-001.pdf',
          expirationDate: new Date('2026-08-15'),
          status: 'valid'
        }, { transaction }),
        Document.create({
          entityType: 'unit',
          entityId: unit1.id,
          type: 'insurance',
          url: '/uploads/documents/demo-insurance-1.pdf',
          fileName: 'insurance-trk-001.pdf',
          expirationDate: new Date('2026-04-30'),
          status: 'valid'
        }, { transaction }),
        // Unit 2 documents
        Document.create({
          entityType: 'unit',
          entityId: unit2.id,
          type: 'registration',
          url: '/uploads/documents/demo-registration-2.pdf',
          fileName: 'registration-trk-002.pdf',
          expirationDate: new Date('2026-09-20'),
          status: 'valid'
        }, { transaction }),
        Document.create({
          entityType: 'unit',
          entityId: unit2.id,
          type: 'insurance',
          url: '/uploads/documents/demo-insurance-2.pdf',
          fileName: 'insurance-trk-002.pdf',
          expirationDate: new Date('2026-05-15'),
          status: 'valid'
        }, { transaction })
      ]);
      console.log('✓ Created demo documents');

      // Create demo order
      // Generate orderNumber manually to avoid validation issues
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      const orderNumber = `ORD-${date}-${random}`;
      
      const order1 = await Order.create({
        orderNumber,
        origin: {
          address: 'Warehouse Centro Logístico',
          city: 'Ciudad de México',
          state: 'CDMX',
          zipCode: '01000',
          coordinates: {
            lat: 19.4326,
            lng: -99.1332
          }
        },
        destination: {
          address: 'Centro de Distribución Norte',
          city: 'Monterrey',
          state: 'Nuevo León',
          zipCode: '64000',
          coordinates: {
            lat: 25.6866,
            lng: -100.3161
          }
        },
        cargoDescription: 'Productos electrónicos diversos - manejo cuidadoso requerido',
        cargoWeight: 15.5,
        cargoWeightUnit: 'tons',
        requirements: [
          'Transportista con experiencia en electrónicos',
          'Unidad con sistema de monitoreo de temperatura',
          'Seguro de carga completo'
        ],
        pickupDate: new Date('2025-12-15T08:00:00'),
        deliveryDate: new Date('2025-12-16T18:00:00'),
        rate: 25000.00,
        currency: 'MXN',
        clientId: demoClient.id,
        status: 'pending',
        notes: 'Carga frágil, requiere manejo especial'
      }, { transaction });

      console.log('✓ Created demo order');

      // Create demo trip routes
      const tripDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const tripRandom1 = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      const tripNumber1 = `TRIP-${tripDate}-${tripRandom1}`;

      // Trip 1: Active trip with order (in_progress)
      const tripRoute1 = await TripRoute.create({
        tripNumber: tripNumber1,
        origin: {
          address: 'Warehouse Centro Logístico',
          city: 'Ciudad de México',
          state: 'CDMX',
          zipCode: '01000',
          coordinates: { lat: 19.4326, lng: -99.1332 }
        },
        destination: {
          address: 'Centro de Distribución Norte',
          city: 'Monterrey',
          state: 'Nuevo León',
          zipCode: '64000',
          coordinates: { lat: 25.6866, lng: -100.3161 }
        },
        estimatedDistanceKm: 920.5,
        estimatedDurationHours: 10.5,
        driverId: driver1.id,
        unitId: unit1.id,
        orderId: order1.id,
        status: 'in_progress',
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // Started 2 hours ago
        metadata: {
          routeType: 'highway',
          tollCost: 850,
          fuelEstimate: 180,
          weatherConditions: 'clear'
        },
        notes: 'Ruta principal CDMX-Monterrey con carga electrónica'
      }, { transaction });

      // Events for trip 1
      await TripRouteEvent.create({
        tripRouteId: tripRoute1.id,
        eventType: 'status_change',
        fromStatus: null,
        toStatus: 'created',
        description: 'Trip route created',
        performedByRole: 'system',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000)
      }, { transaction });

      await TripRouteEvent.create({
        tripRouteId: tripRoute1.id,
        eventType: 'status_change',
        fromStatus: 'created',
        toStatus: 'assigned',
        description: 'Trip assigned to driver and unit',
        performedByRole: 'employer',
        timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000)
      }, { transaction });

      await TripRouteEvent.create({
        tripRouteId: tripRoute1.id,
        eventType: 'status_change',
        fromStatus: 'assigned',
        toStatus: 'in_progress',
        location: { lat: 19.4326, lng: -99.1332, address: 'Warehouse Centro Logístico' },
        description: 'Driver started the trip',
        performedBy: driver1.id,
        performedByRole: 'driver',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }, { transaction });

      await TripRouteEvent.create({
        tripRouteId: tripRoute1.id,
        eventType: 'location_update',
        location: { lat: 20.5, lng: -99.5, address: 'Autopista México-Querétaro' },
        description: 'Location update - en route',
        performedBy: driver1.id,
        performedByRole: 'driver',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000)
      }, { transaction });

      // Trip 2: Repositioning trip without order (completed)
      const tripRandom2 = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      const tripNumber2 = `TRIP-${tripDate}-${tripRandom2}`;

      const tripRoute2 = await TripRoute.create({
        tripNumber: tripNumber2,
        origin: {
          address: 'Terminal Guadalajara',
          city: 'Guadalajara',
          state: 'Jalisco',
          coordinates: { lat: 20.6597, lng: -103.3496 }
        },
        destination: {
          address: 'Base Operaciones CDMX',
          city: 'Ciudad de México',
          state: 'CDMX',
          coordinates: { lat: 19.4326, lng: -99.1332 }
        },
        estimatedDistanceKm: 540.0,
        actualDistanceKm: 548.3,
        estimatedDurationHours: 6.5,
        actualDurationHours: 7.2,
        driverId: driver2.id,
        unitId: unit2.id,
        orderId: null, // No order - repositioning
        status: 'completed',
        startedAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
        arrivedAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        metadata: {
          routeType: 'repositioning',
          reason: 'Return to base after delivery',
          tollCost: 450
        },
        notes: 'Viaje de reposicionamiento - retorno a base'
      }, { transaction });

      // Events for trip 2
      await TripRouteEvent.create({
        tripRouteId: tripRoute2.id,
        eventType: 'status_change',
        fromStatus: null,
        toStatus: 'created',
        description: 'Repositioning trip created',
        performedByRole: 'system',
        timestamp: new Date(Date.now() - 11 * 60 * 60 * 1000)
      }, { transaction });

      await TripRouteEvent.create({
        tripRouteId: tripRoute2.id,
        eventType: 'status_change',
        fromStatus: 'created',
        toStatus: 'assigned',
        description: 'Trip assigned',
        performedByRole: 'employer',
        timestamp: new Date(Date.now() - 10.5 * 60 * 60 * 1000)
      }, { transaction });

      await TripRouteEvent.create({
        tripRouteId: tripRoute2.id,
        eventType: 'status_change',
        fromStatus: 'assigned',
        toStatus: 'in_progress',
        location: { lat: 20.6597, lng: -103.3496, address: 'Terminal Guadalajara' },
        description: 'Trip started',
        performedBy: driver2.id,
        performedByRole: 'driver',
        timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000)
      }, { transaction });

      await TripRouteEvent.create({
        tripRouteId: tripRoute2.id,
        eventType: 'status_change',
        fromStatus: 'in_progress',
        toStatus: 'arrived_at_destination',
        location: { lat: 19.4326, lng: -99.1332, address: 'Base Operaciones CDMX' },
        description: 'Arrived at destination',
        performedBy: driver2.id,
        performedByRole: 'driver',
        timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000)
      }, { transaction });

      await TripRouteEvent.create({
        tripRouteId: tripRoute2.id,
        eventType: 'status_change',
        fromStatus: 'arrived_at_destination',
        toStatus: 'completed',
        description: 'Trip completed successfully',
        performedBy: driver2.id,
        performedByRole: 'driver',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000)
      }, { transaction });

      console.log('✓ Created demo trip routes (2 trips with events)');

      // Create Tracking data (GPS locations)
      await Tracking.create({
        tripRouteId: tripRoute1.id,
        latitude: 19.4326,
        longitude: -99.1332,
        address: 'Paseo de la Reforma, Mexico City',
        speed: 85,
        accuracy: 5,
        userId: driver1.id
      }, { transaction });

      await Tracking.create({
        tripRouteId: tripRoute1.id,
        latitude: 22.5597,
        longitude: -101.2562,
        address: 'Querétaro City',
        speed: 95,
        accuracy: 5,
        userId: driver1.id
      }, { transaction });

      console.log('✓ Created Tracking data (GPS locations)');

      // Create Notifications
      await Promise.all([
        Notification.create({
          userId: demoClient.id,
          type: 'trip_status',
          title: 'Trip Started',
          message: 'Trip CDMX → Monterrey has been started',
          relatedId: tripRoute1.id,
          relatedType: 'TripRoute',
          isRead: false
        }, { transaction }),
        Notification.create({
          userId: demoClient.id,
          type: 'order_update',
          title: 'Order Assigned',
          message: 'Your order has been assigned to a driver',
          relatedId: order1.id,
          relatedType: 'Order',
          isRead: false
        }, { transaction })
      ]);

      console.log('✓ Created Notifications');

      // Create Billing records
      const billing1 = await Billing.create({
        orderId: order1.id,
        totalAmount: order1.rate || 5000,
        status: 'sent',
        invoiceNumber: 'INV-2025-001',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }, { transaction });

      // Create Payment record
      await Payment.create({
        billingId: billing1.id,
        amount: 2500,
        paymentMethod: 'bank_transfer',
        referenceNumber: 'TRANSFER-2025-001',
        status: 'completed'
      }, { transaction });

      console.log('✓ Created Billing and Payment records');

      // Create FleetMaintenance records
      await Promise.all([
        FleetMaintenance.create({
          unitId: unit1.id,
          type: 'oil_change',
          description: 'Oil and filter change',
          cost: 800,
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          nextMaintenanceDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          notes: 'Scheduled maintenance'
        }, { transaction }),
        FleetMaintenance.create({
          unitId: unit1.id,
          type: 'fuel_log',
          description: 'Fuel log: 300L at Monterrey Gas Station',
          cost: 6300,
          date: new Date(),
          metadata: {
            liters: 300,
            odometer: 50000,
            location: 'Monterrey Gas Station',
            pricePerLiter: '21'
          }
        }, { transaction })
      ]);

      console.log('✓ Created Fleet Maintenance data');

      // Commit transaction
      await transaction.commit();
      
      console.log('🎉 Demo data seeded successfully!');
      console.log('\n📋 Demo Data Summary:');
      console.log('👥 Users: 2 (client@truckmatch.com, admin@truckmatch.com)');
      console.log('🚛 Drivers: 2 (Juan Pérez, María González)');
      console.log('🚚 Units: 2 (TRK-001-MX, TRK-002-MX)');
      console.log('📄 Documents: 8 (4 per driver/unit)');
      console.log('📦 Orders: 1 (pending order CDMX → Monterrey)');
      console.log('🚗 Trip Routes: 2 trips');
      console.log('   - Trip 1: In progress (CDMX → Monterrey, with order)');
      console.log('   - Trip 2: Completed (Guadalajara → CDMX, repositioning)');
      console.log('📊 Trip Events: 11 events total');
      console.log('🗺️  Tracking: 2 GPS location points');
      console.log('🔔 Notifications: 2 notifications');
      console.log('💰 Billing: 1 invoice + 1 payment');
      console.log('🔧 Fleet Maintenance: 1 oil change + 1 fuel log');
      console.log('\n🔑 Demo credentials:');
      console.log('   Email: client@truckmatch.com / admin@truckmatch.com');
      console.log('   Password: demo123');

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  }
};

// Run seeder if called directly
if (require.main === module) {
  const { syncModels } = require('../models');
  
  syncModels(false)
    .then(() => seedDemoData())
    .then(() => {
      console.log('✓ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDemoData };