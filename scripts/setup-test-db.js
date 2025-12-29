#!/usr/bin/env node
// scripts/setup-test-db.js
/**
 * Script para configurar la base de datos de prueba con datos realistas
 * Limpia los datos existentes y carga datos de demo completos
 */

const bcrypt = require('bcryptjs');
const { sequelize, syncModels } = require('../models');
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
  Assignment
} = require('../models');

const setupTestDB = async () => {
  try {
    console.log('🔧 Setting up test database...\n');

    // Sync models
    console.log('📊 Syncing database models...');
    await syncModels(true); // Force sync for test environment
    console.log('✅ Database models synced\n');

    // Clean existing data
    console.log('🧹 Cleaning existing test data...');
    const transaction = await sequelize.transaction();

    try {
      // Delete in correct order (respecting foreign key constraints)
      await Payment.destroy({ where: {}, transaction });
      await Billing.destroy({ where: {}, transaction });
      await Notification.destroy({ where: {}, transaction });
      await Tracking.destroy({ where: {}, transaction });
      await TripRouteEvent.destroy({ where: {}, transaction });
      await Assignment.destroy({ where: {}, transaction });
      await TripRoute.destroy({ where: {}, transaction });
      await Document.destroy({ where: {}, transaction });
      await FleetMaintenance.destroy({ where: {}, transaction });
      await Order.destroy({ where: {}, transaction });
      await Unit.destroy({ where: {}, transaction });
      await Driver.destroy({ where: {}, transaction });
      await User.destroy({ where: {}, transaction });

      console.log('✅ Test data cleaned\n');

      // Create realistic test data
      console.log('🌱 Creating realistic test data...');

      // 1. Create users
      const hashedPassword = await bcrypt.hash('demo123', 10);

      const users = await Promise.all([
        User.create({
          email: 'client@truckmatch.com',
          passwordHash: hashedPassword,
          role: 'employer'
        }, { transaction }),
        User.create({
          email: 'dispatcher@truckmatch.com',
          passwordHash: hashedPassword,
          role: 'employer'
        }, { transaction }),
        User.create({
          email: 'admin@truckmatch.com',
          passwordHash: hashedPassword,
          role: 'employer'
        }, { transaction })
      ]);

      console.log('✓ Created 3 users (client, dispatcher, admin)');

      // 2. Create drivers with realistic Mexican names and data
      const drivers = await Promise.all([
        Driver.create({
          name: 'Juan Pérez Rodríguez',
          license: 'CDL-2023-001234',
          licenseExpirationDate: new Date('2026-12-31'),
          phone: '+52-555-0123',
          email: 'juan.perez@truckmatch.com',
          address: 'Av. Paseo de la Reforma 505, Col. Cuauhtémoc, CDMX',
          status: 'active'
        }, { transaction }),
        Driver.create({
          name: 'María González López',
          license: 'CDL-2023-005678',
          licenseExpirationDate: new Date('2026-06-30'),
          phone: '+52-555-0456',
          email: 'maria.gonzalez@truckmatch.com',
          address: 'Calle Independencia 456, Guadalajara, Jalisco',
          status: 'active'
        }, { transaction }),
        Driver.create({
          name: 'Carlos Martínez Hernández',
          license: 'CDL-2023-009012',
          licenseExpirationDate: new Date('2025-09-15'),
          phone: '+52-555-0789',
          email: 'carlos.martinez@truckmatch.com',
          address: 'Blvd. Fundidores 123, Monterrey, NL',
          status: 'active'
        }, { transaction }),
        Driver.create({
          name: 'Roberto Sánchez Torres',
          license: 'CDL-2023-003456',
          licenseExpirationDate: new Date('2026-03-20'),
          phone: '+52-555-0999',
          email: 'roberto.sanchez@truckmatch.com',
          address: 'Calle Juárez 789, Querétaro, Qro',
          status: 'inactive'
        }, { transaction })
      ]);

      console.log('✓ Created 4 drivers (3 active, 1 inactive)');

      // 3. Create units/vehicles
      const units = await Promise.all([
        Unit.create({
          plateNumber: 'TRK-001-MX',
          model: 'Kenworth T680',
          type: 'truck',
          capacity: 25.5,
          capacityUnit: 'tons',
          year: 2022,
          brand: 'Kenworth',
          status: 'active',
          driverId: drivers[0].id
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
          driverId: drivers[1].id
        }, { transaction }),
        Unit.create({
          plateNumber: 'TRK-003-MX',
          model: 'Peterbilt 579',
          type: 'truck',
          capacity: 28.0,
          capacityUnit: 'tons',
          year: 2021,
          brand: 'Peterbilt',
          status: 'maintenance',
          driverId: drivers[2].id
        }, { transaction }),
        Unit.create({
          plateNumber: 'VAN-001-MX',
          model: 'Sprinter Van',
          type: 'van',
          capacity: 8.0,
          capacityUnit: 'tons',
          year: 2023,
          brand: 'Mercedes',
          status: 'active',
          driverId: null
        }, { transaction })
      ]);

      console.log('✓ Created 4 units (3 trucks, 1 van)');

      // 4. Create documents
      const documents = await Promise.all([
        // Driver 1 documents
        Document.create({
          entityType: 'driver',
          entityId: drivers[0].id,
          type: 'license',
          url: '/uploads/documents/lic-001.pdf',
          fileName: 'license-juan-perez.pdf',
          expirationDate: new Date('2026-12-31'),
          status: 'valid'
        }, { transaction }),
        Document.create({
          entityType: 'driver',
          entityId: drivers[0].id,
          type: 'medical_certificate',
          url: '/uploads/documents/med-001.pdf',
          fileName: 'medical-juan-perez.pdf',
          expirationDate: new Date('2026-03-15'),
          status: 'valid'
        }, { transaction }),
        // Driver 2 documents
        Document.create({
          entityType: 'driver',
          entityId: drivers[1].id,
          type: 'license',
          url: '/uploads/documents/lic-002.pdf',
          fileName: 'license-maria-gonzalez.pdf',
          expirationDate: new Date('2026-06-30'),
          status: 'valid'
        }, { transaction }),
        Document.create({
          entityType: 'driver',
          entityId: drivers[1].id,
          type: 'medical_certificate',
          url: '/uploads/documents/med-002.pdf',
          fileName: 'medical-maria-gonzalez.pdf',
          expirationDate: new Date('2026-01-20'),
          status: 'expiring_soon'
        }, { transaction }),
        // Unit 1 documents
        Document.create({
          entityType: 'unit',
          entityId: units[0].id,
          type: 'registration',
          url: '/uploads/documents/reg-001.pdf',
          fileName: 'registration-trk-001.pdf',
          expirationDate: new Date('2026-08-15'),
          status: 'valid'
        }, { transaction }),
        Document.create({
          entityType: 'unit',
          entityId: units[0].id,
          type: 'insurance',
          url: '/uploads/documents/ins-001.pdf',
          fileName: 'insurance-trk-001.pdf',
          expirationDate: new Date('2026-04-30'),
          status: 'valid'
        }, { transaction }),
        // Unit 2 documents
        Document.create({
          entityType: 'unit',
          entityId: units[1].id,
          type: 'registration',
          url: '/uploads/documents/reg-002.pdf',
          fileName: 'registration-trk-002.pdf',
          expirationDate: new Date('2026-09-20'),
          status: 'valid'
        }, { transaction }),
        Document.create({
          entityType: 'unit',
          entityId: units[1].id,
          type: 'insurance',
          url: '/uploads/documents/ins-002.pdf',
          fileName: 'insurance-trk-002.pdf',
          expirationDate: new Date('2026-05-15'),
          status: 'valid'
        }, { transaction })
      ]);

      console.log('✓ Created 8 documents');

      // 5. Create orders
      const orders = await Promise.all([
        // Order 1: Pending
        Order.create({
          orderNumber: 'ORD-20250101-0001',
          origin: {
            address: 'Parque Industrial Vallejo 123, Col. San Bartolo Cahuac',
            city: 'Ciudad de México',
            state: 'CDMX',
            zipCode: '07010',
            coordinates: { lat: 19.4919, lng: -99.1378 }
          },
          destination: {
            address: 'Centro de Distribución Monterrey 456, Av. Los Colonizadores',
            city: 'Monterrey',
            state: 'Nuevo León',
            zipCode: '64000',
            coordinates: { lat: 25.6866, lng: -100.3161 }
          },
          cargoDescription: 'Equipos electrónicos (laptops y componentes)',
          cargoWeight: 15.5,
          cargoWeightUnit: 'tons',
          requirements: ['Transportista con experiencia', 'Seguro de carga completo', 'Monitoreo GPS obligatorio'],
          pickupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          rate: 8500.00,
          currency: 'MXN',
          clientId: users[0].id,
          status: 'pending',
          notes: 'Carga frágil, requiere manejo especial'
        }, { transaction }),
        // Order 2: In transit
        Order.create({
          orderNumber: 'ORD-20250102-0002',
          origin: {
            address: 'Puerto de Veracruz Terminal 1, Blvd. Avila Camacho',
            city: 'Veracruz',
            state: 'Veracruz',
            zipCode: '91700',
            coordinates: { lat: 19.1906, lng: -96.1347 }
          },
          destination: {
            address: 'Centro Logístico CDMX, Av. Río San Joaquín 305',
            city: 'Ciudad de México',
            state: 'CDMX',
            zipCode: '11560',
            coordinates: { lat: 19.3562, lng: -99.1222 }
          },
          cargoDescription: 'Contenedor con mercancía general de importación',
          cargoWeight: 22.0,
          cargoWeightUnit: 'tons',
          requirements: ['Licencia T-MEC', 'Documentos aduanales'],
          pickupDate: new Date(Date.now() - 8 * 60 * 60 * 1000),
          deliveryDate: new Date(Date.now() + 16 * 60 * 60 * 1000),
          rate: 12000.00,
          currency: 'MXN',
          clientId: users[0].id,
          status: 'in_transit',
          notes: 'Transporte de carga importada'
        }, { transaction }),
        // Order 3: Completed
        Order.create({
          orderNumber: 'ORD-20250103-0003',
          origin: {
            address: 'Querétaro Distribution Center, Blvd. Juriquilla',
            city: 'Querétaro',
            state: 'Querétaro',
            zipCode: '76230',
            coordinates: { lat: 20.6295, lng: -100.4117 }
          },
          destination: {
            address: 'Guadalajara Warehouse, Av. Colomos 301',
            city: 'Guadalajara',
            state: 'Jalisco',
            zipCode: '44210',
            coordinates: { lat: 20.6597, lng: -103.3496 }
          },
          cargoDescription: 'Productos manufacturados - Piezas de automóvil',
          cargoWeight: 18.0,
          cargoWeightUnit: 'tons',
          requirements: ['Transportista profesional'],
          pickupDate: new Date(Date.now() - 48 * 60 * 60 * 1000),
          deliveryDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
          rate: 7500.00,
          currency: 'MXN',
          clientId: users[0].id,
          status: 'completed',
          notes: 'Entrega exitosa'
        }, { transaction })
      ]);

      console.log('✓ Created 3 orders (pending, in_transit, completed)');

      // 6. Create trip routes
      const tripRoutes = await Promise.all([
        // Active trip with order
        TripRoute.create({
          tripNumber: 'TRIP-20250101-0001',
          origin: {
            address: 'Parque Industrial Vallejo 123',
            city: 'Ciudad de México',
            state: 'CDMX',
            zipCode: '07010',
            coordinates: { lat: 19.4919, lng: -99.1378 }
          },
          destination: {
            address: 'Centro de Distribución Monterrey 456',
            city: 'Monterrey',
            state: 'Nuevo León',
            zipCode: '64000',
            coordinates: { lat: 25.6866, lng: -100.3161 }
          },
          estimatedDistanceKm: 920.5,
          estimatedDurationHours: 10.5,
          driverId: drivers[0].id,
          unitId: units[0].id,
          orderId: orders[1].id,
          status: 'in_progress',
          startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          metadata: {
            routeType: 'delivery',
            tollCost: 850,
            fuelEstimate: 180,
            weatherConditions: 'clear'
          },
          notes: 'Ruta CDMX-Monterrey en progreso'
        }, { transaction }),
        // Completed repositioning trip
        TripRoute.create({
          tripNumber: 'TRIP-20250102-0002',
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
          driverId: drivers[1].id,
          unitId: units[1].id,
          orderId: orders[2].id,
          status: 'completed',
          startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          arrivedAt: new Date(Date.now() - 16 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 15.5 * 60 * 60 * 1000),
          metadata: {
            routeType: 'delivery',
            tollCost: 450,
            fuelUsed: 120,
            completionTime: 7.2
          },
          notes: 'Viaje completado exitosamente'
        }, { transaction })
      ]);

      console.log('✓ Created 2 trip routes (active, completed)');

      // 7. Create trip route events
      const tripRouteEvents = await Promise.all([
        // Events for Trip 1 (in progress)
        TripRouteEvent.create({
          tripRouteId: tripRoutes[0].id,
          eventType: 'status_change',
          toStatus: 'created',
          description: 'Trip route created by dispatcher',
          performedByRole: 'system',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000)
        }, { transaction }),
        TripRouteEvent.create({
          tripRouteId: tripRoutes[0].id,
          eventType: 'status_change',
          fromStatus: 'created',
          toStatus: 'assigned',
          description: 'Trip assigned to driver and unit',
          performedByRole: 'employer',
          timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000)
        }, { transaction }),
        TripRouteEvent.create({
          tripRouteId: tripRoutes[0].id,
          eventType: 'status_change',
          fromStatus: 'assigned',
          toStatus: 'in_progress',
          location: { lat: 19.4919, lng: -99.1378, address: 'Parque Industrial Vallejo' },
          description: 'Driver started the trip',
          performedBy: drivers[0].id,
          performedByRole: 'driver',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
        }, { transaction }),
        TripRouteEvent.create({
          tripRouteId: tripRoutes[0].id,
          eventType: 'location_update',
          location: { lat: 20.5, lng: -99.5, address: 'Autopista México-Querétaro' },
          description: 'Location update - en ruta',
          performedBy: drivers[0].id,
          performedByRole: 'driver',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000)
        }, { transaction }),
        // Events for Trip 2 (completed)
        TripRouteEvent.create({
          tripRouteId: tripRoutes[1].id,
          eventType: 'status_change',
          toStatus: 'created',
          description: 'Trip route created',
          performedByRole: 'system',
          timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000)
        }, { transaction }),
        TripRouteEvent.create({
          tripRouteId: tripRoutes[1].id,
          eventType: 'status_change',
          fromStatus: 'created',
          toStatus: 'in_progress',
          location: { lat: 20.6597, lng: -103.3496, address: 'Terminal Guadalajara' },
          description: 'Trip started',
          performedBy: drivers[1].id,
          performedByRole: 'driver',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }, { transaction }),
        TripRouteEvent.create({
          tripRouteId: tripRoutes[1].id,
          eventType: 'status_change',
          fromStatus: 'in_progress',
          toStatus: 'completed',
          location: { lat: 19.4326, lng: -99.1332, address: 'Base Operaciones CDMX' },
          description: 'Trip completed successfully',
          performedBy: drivers[1].id,
          performedByRole: 'driver',
          timestamp: new Date(Date.now() - 15.5 * 60 * 60 * 1000)
        }, { transaction })
      ]);

      console.log('✓ Created 7 trip route events');

      // 8. Create tracking data
      const trackingData = await Promise.all([
        Tracking.create({
          tripRouteId: tripRoutes[0].id,
          latitude: 19.4919,
          longitude: -99.1378,
          address: 'Parque Industrial Vallejo, CDMX',
          speed: 0,
          accuracy: 5,
          userId: drivers[0].id
        }, { transaction }),
        Tracking.create({
          tripRouteId: tripRoutes[0].id,
          latitude: 20.5,
          longitude: -99.5,
          address: 'Autopista México-Querétaro',
          speed: 85,
          accuracy: 5,
          userId: drivers[0].id
        }, { transaction }),
        Tracking.create({
          tripRouteId: tripRoutes[0].id,
          latitude: 21.8,
          longitude: -100.0,
          address: 'Querétaro Area',
          speed: 95,
          accuracy: 5,
          userId: drivers[0].id
        }, { transaction })
      ]);

      console.log('✓ Created 3 tracking GPS points');

      // 9. Create notifications
      const notifications = await Promise.all([
        Notification.create({
          userId: users[0].id,
          type: 'trip_status',
          title: 'Trip Started',
          message: 'Trip CDMX → Monterrey has been started by Juan Pérez',
          relatedId: tripRoutes[0].id,
          relatedType: 'TripRoute',
          isRead: false
        }, { transaction }),
        Notification.create({
          userId: users[0].id,
          type: 'order_update',
          title: 'Order Assigned',
          message: 'Your order has been assigned to a driver and unit',
          relatedId: orders[1].id,
          relatedType: 'Order',
          isRead: false
        }, { transaction }),
        Notification.create({
          userId: users[0].id,
          type: 'document_expiring',
          title: 'Document Expiring Soon',
          message: 'Medical certificate of María González will expire soon',
          relatedId: documents[3].id,
          relatedType: 'Document',
          isRead: false
        }, { transaction })
      ]);

      console.log('✓ Created 3 notifications');

      // 10. Create billing and payments
      const billings = await Promise.all([
        Billing.create({
          orderId: orders[2].id,
          totalAmount: orders[2].rate,
          status: 'paid',
          invoiceNumber: 'INV-2024-12-001',
          issueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
          paidDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }, { transaction }),
        Billing.create({
          orderId: orders[1].id,
          totalAmount: orders[1].rate,
          status: 'sent',
          invoiceNumber: 'INV-2024-12-002',
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }, { transaction })
      ]);

      const payments = await Promise.all([
        Payment.create({
          billingId: billings[0].id,
          amount: orders[2].rate,
          paymentMethod: 'bank_transfer',
          referenceNumber: 'TRANSFER-2024-12-001',
          status: 'completed',
          paidDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }, { transaction })
      ]);

      console.log('✓ Created 2 billing records and 1 payment');

      // 11. Create fleet maintenance records
      const maintenanceRecords = await Promise.all([
        FleetMaintenance.create({
          unitId: units[0].id,
          type: 'oil_change',
          description: 'Cambio de aceite y filtro',
          cost: 800.00,
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          nextMaintenanceDate: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000),
          notes: 'Mantenimiento programado regular'
        }, { transaction }),
        FleetMaintenance.create({
          unitId: units[0].id,
          type: 'fuel_log',
          description: 'Carga de combustible - Estación Monterrey',
          cost: 6300.00,
          date: new Date(),
          metadata: {
            liters: 300,
            odometer: 50000,
            location: 'Estación de Combustible Monterrey',
            pricePerLiter: 21
          }
        }, { transaction }),
        FleetMaintenance.create({
          unitId: units[1].id,
          type: 'tire_rotation',
          description: 'Rotación de llantas',
          cost: 1200.00,
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          nextMaintenanceDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          notes: 'Mantenimiento preventivo'
        }, { transaction })
      ]);

      console.log('✓ Created 3 fleet maintenance records');

      // 12. Create assignments
      const assignments = await Promise.all([
        Assignment.create({
          driverId: drivers[0].id,
          orderId: orders[1].id,
          status: 'assigned',
          assignedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          notes: 'Assigned to primary driver'
        }, { transaction })
      ]);

      console.log('✓ Created 1 assignment');

      await transaction.commit();

      console.log('\n✅ Test database setup completed successfully!\n');
      console.log('📊 Summary of created test data:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👥 Users:                  3 (1 client, 1 dispatcher, 1 admin)');
      console.log('🚛 Drivers:                4 (3 active, 1 inactive)');
      console.log('🚚 Vehicles:               4 (3 trucks, 1 van)');
      console.log('📄 Documents:              8 (licenses, medical, registration, insurance)');
      console.log('📦 Orders:                 3 (pending, in_transit, completed)');
      console.log('🚗 Trip Routes:            2 (in_progress, completed)');
      console.log('📊 Trip Events:            7 (status changes, location updates)');
      console.log('🗺️  GPS Tracking Points:    3 (real-time location data)');
      console.log('🔔 Notifications:          3 (trip status, order, document alerts)');
      console.log('💰 Billing Records:        2 (1 paid, 1 sent)');
      console.log('💳 Payments:               1 (completed)');
      console.log('🔧 Maintenance Records:    3 (oil change, fuel, tires)');
      console.log('📋 Assignments:            1 (driver to order)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n🔑 Demo User Credentials:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:    client@truckmatch.com');
      console.log('             dispatcher@truckmatch.com');
      console.log('             admin@truckmatch.com');
      console.log('🔐 Password: demo123');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error setting up test database:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  setupTestDB()
    .then(() => {
      console.log('✓ Setup complete. Press Ctrl+C to exit.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupTestDB };
