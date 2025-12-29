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
  Assignment,
  sequelize 
} = require('../models');

// Helper function to create realistic Mexican names
const drivers = [
  { name: 'Juan Pérez Rodríguez', city: 'CDMX' },
  { name: 'María González López', city: 'Guadalajara' },
  { name: 'Carlos Martínez Hernández', city: 'Monterrey' },
  { name: 'Roberto Sánchez Torres', city: 'Querétaro' },
  { name: 'Luis García Ramírez', city: 'Veracruz' },
  { name: 'Miguel López Díaz', city: 'Puebla' },
  { name: 'Antonio Hernández Cruz', city: 'Cancún' },
  { name: 'Francisco Rodríguez Moreno', city: 'Aguascalientes' },
  { name: 'Diego Flores Silva', city: 'Toluca' },
  { name: 'Pablo Morales Gutierrez', city: 'Mérida' },
  { name: 'Jorge Ramírez López', city: 'CDMX' },
  { name: 'Manuel Torres García', city: 'Guadalajara' }
];

const seedDemoData = async () => {
  try {
    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      console.log('🌱 Starting database seeding with expanded data...');

      // Create demo users
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
      console.log('✓ Created 3 demo users');

      // Create demo drivers (12 drivers)
      const driversList = await Promise.all(
        drivers.map((driver, idx) => 
          Driver.create({
            name: driver.name,
            license: `CDL-2024-${String(100000 + idx).slice(-6)}`,
            licenseExpirationDate: new Date(Date.now() + (200 + idx * 10) * 24 * 60 * 60 * 1000),
            phone: `+52-555-${String(1000 + idx).slice(-4)}`,
            email: `${driver.name.toLowerCase().replace(/\s/g, '.')}.${idx}@truckmatch.com`,
            address: `Calle Principal ${idx * 100}, ${driver.city}`,
            status: idx < 10 ? 'active' : 'inactive'
          }, { transaction })
        )
      );
      console.log(`✓ Created ${driversList.length} drivers`);

      // Create demo units (15 units)
      const unitModels = [
        { model: 'Kenworth T680', brand: 'Kenworth', capacity: 25.5 },
        { model: 'Freightliner Cascadia', brand: 'Freightliner', capacity: 30.0 },
        { model: 'Peterbilt 579', brand: 'Peterbilt', capacity: 28.0 },
        { model: 'Volvo VNL', brand: 'Volvo', capacity: 27.5 },
        { model: 'Mack Granite', brand: 'Mack', capacity: 26.0 }
      ];

      const unitsList = await Promise.all(
        Array.from({ length: 15 }, (_, idx) => {
          const model = unitModels[idx % unitModels.length];
          return Unit.create({
            plateNumber: `TRK-${String(1000 + idx).slice(-3)}-MX`,
            model: model.model,
            type: idx < 13 ? 'truck' : 'van',
            capacity: model.capacity,
            capacityUnit: 'tons',
            year: 2020 + Math.floor(idx / 3),
            brand: model.brand,
            status: idx < 13 ? 'active' : (idx === 13 ? 'maintenance' : 'inactive'),
            driverId: driversList[idx % driversList.length].id
          }, { transaction });
        })
      );
      console.log(`✓ Created ${unitsList.length} units`);

      // Create documents (30+ documents)
      const documentPromises = [];
      
      // Driver documents
      driversList.forEach((driver, idx) => {
        documentPromises.push(
          Document.create({
            entityType: 'driver',
            entityId: driver.id,
            type: 'license',
            url: `/uploads/documents/license-${driver.id}.pdf`,
            fileName: `license-${driver.name.replace(/\s/g, '-')}.pdf`,
            expirationDate: new Date(Date.now() + (150 + idx * 20) * 24 * 60 * 60 * 1000),
            status: idx < 10 ? 'valid' : (idx === 10 ? 'pending_review' : 'expired')
          }, { transaction }),
          Document.create({
            entityType: 'driver',
            entityId: driver.id,
            type: 'medical_certificate',
            url: `/uploads/documents/medical-${driver.id}.pdf`,
            fileName: `medical-${driver.name.replace(/\s/g, '-')}.pdf`,
            expirationDate: new Date(Date.now() + (100 + idx * 15) * 24 * 60 * 60 * 1000),
            status: idx < 10 ? 'valid' : 'expired'
          }, { transaction })
        );
      });

      // Unit documents
      unitsList.forEach((unit, idx) => {
        documentPromises.push(
          Document.create({
            entityType: 'unit',
            entityId: unit.id,
            type: 'registration',
            url: `/uploads/documents/reg-${unit.id}.pdf`,
            fileName: `registration-${unit.plateNumber}.pdf`,
            expirationDate: new Date(Date.now() + (180 + idx * 10) * 24 * 60 * 60 * 1000),
            status: 'valid'
          }, { transaction }),
          Document.create({
            entityType: 'unit',
            entityId: unit.id,
            type: 'insurance',
            url: `/uploads/documents/insurance-${unit.id}.pdf`,
            fileName: `insurance-${unit.plateNumber}.pdf`,
            expirationDate: new Date(Date.now() + (120 + idx * 10) * 24 * 60 * 60 * 1000),
            status: idx % 3 === 0 ? 'expired' : (idx % 3 === 1 ? 'pending_review' : 'valid')
          }, { transaction })
        );
      });

      await Promise.all(documentPromises);
      console.log(`✓ Created ${documentPromises.length} documents`);

      // Create demo orders
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
        clientId: users[0].id,
        status: 'pending',
        notes: 'Carga frágil, requiere manejo especial'
      }, { transaction });

      // Create demo orders (15 orders with various statuses)
      const cities = [
        { name: 'Ciudad de México', state: 'CDMX', lat: 19.4326, lng: -99.1332 },
        { name: 'Guadalajara', state: 'Jalisco', lat: 20.6597, lng: -103.3496 },
        { name: 'Monterrey', state: 'Nuevo León', lat: 25.6866, lng: -100.3161 },
        { name: 'Querétaro', state: 'Querétaro', lat: 20.5889, lng: -100.3898 },
        { name: 'Veracruz', state: 'Veracruz', lat: 19.1906, lng: -96.1347 },
        { name: 'Puebla', state: 'Puebla', lat: 19.0413, lng: -98.2063 },
        { name: 'Cancún', state: 'Quintana Roo', lat: 21.1629, lng: -87.0739 },
        { name: 'Mérida', state: 'Yucatán', lat: 20.9674, lng: -89.6238 }
      ];

      const orderStatuses = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];
      const cargoTypes = [
        'Productos electrónicos',
        'Alimentos perecederos',
        'Materiales de construcción',
        'Piezas automotrices',
        'Textiles y ropa',
        'Productos químicos',
        'Equipos industriales',
        'Mercancía general'
      ];

      const ordersList = await Promise.all(
        Array.from({ length: 15 }, (_, idx) => {
          const originCity = cities[idx % cities.length];
          const destCity = cities[(idx + 1 + Math.floor(idx / 2)) % cities.length];
          const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          const orderNum = `ORD-${date}-${String(1000 + idx).slice(-4)}`;
          
          return Order.create({
            orderNumber: orderNum,
            origin: {
              address: `Warehouse ${originCity.name} ${idx}`,
              city: originCity.name,
              state: originCity.state,
              zipCode: `${10000 + idx * 100}`,
              coordinates: { lat: originCity.lat + (idx * 0.001), lng: originCity.lng + (idx * 0.001) }
            },
            destination: {
              address: `Distribution Center ${destCity.name} ${idx}`,
              city: destCity.name,
              state: destCity.state,
              zipCode: `${20000 + idx * 100}`,
              coordinates: { lat: destCity.lat - (idx * 0.001), lng: destCity.lng - (idx * 0.001) }
            },
            cargoDescription: `${cargoTypes[idx % cargoTypes.length]} - Cantidad: ${10 + idx * 5} unidades`,
            cargoWeight: 5 + idx * 1.5,
            cargoWeightUnit: 'tons',
            requirements: idx % 2 === 0 ? ['Seguro de carga'] : ['Seguro de carga', 'Control de temperatura'],
            pickupDate: new Date(Date.now() + (idx * 2 - 10) * 24 * 60 * 60 * 1000),
            deliveryDate: new Date(Date.now() + (idx * 2 - 5) * 24 * 60 * 60 * 1000),
            rate: 3000 + idx * 500 + Math.random() * 2000,
            currency: 'MXN',
            clientId: users[0].id,
            status: orderStatuses[idx % orderStatuses.length],
            notes: `Orden #${idx + 1} - ${['Entrega urgente', 'Horario específico', 'Manejo especial', 'Cliente frecuente', 'Nueva ruta'][idx % 5]}`
          }, { transaction });
        })
      );
      console.log(`✓ Created ${ordersList.length} orders`);

      // Create demo trip routes (12 trips with various statuses)
      const tripStatuses = ['created', 'assigned', 'in_progress', 'completed', 'cancelled'];
      
      const tripRoutesList = await Promise.all(
        Array.from({ length: 12 }, (_, idx) => {
          const originCity = cities[idx % cities.length];
          const destCity = cities[(idx + 2) % cities.length];
          const tripDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          const tripNum = `TRIP-${tripDate}-${String(1000 + idx).slice(-4)}`;
          const startTime = Date.now() - (12 - idx) * 24 * 60 * 60 * 1000;
          
          return TripRoute.create({
            tripNumber: tripNum,
            origin: {
              address: `Terminal ${originCity.name} ${idx}`,
              city: originCity.name,
              state: originCity.state,
              coordinates: { lat: originCity.lat, lng: originCity.lng }
            },
            destination: {
              address: `Distribution ${destCity.name} ${idx}`,
              city: destCity.name,
              state: destCity.state,
              coordinates: { lat: destCity.lat, lng: destCity.lng }
            },
            estimatedDistanceKm: 300 + idx * 50,
            actualDistanceKm: idx < 8 ? (300 + idx * 50 + Math.random() * 50) : null,
            estimatedDurationHours: 4 + idx * 0.5,
            actualDurationHours: idx < 8 ? (4 + idx * 0.5 + Math.random() * 1) : null,
            driverId: driversList[idx % driversList.length].id,
            unitId: unitsList[idx % unitsList.length].id,
            orderId: idx < 12 ? ordersList[idx % ordersList.length].id : null,
            status: tripStatuses[idx % tripStatuses.length],
            startedAt: idx > 0 ? new Date(startTime) : null,
            arrivedAt: idx < 8 ? new Date(startTime + 12 * 60 * 60 * 1000) : null,
            completedAt: idx < 8 ? new Date(startTime + 14 * 60 * 60 * 1000) : null,
            metadata: {
              routeType: idx % 3 === 0 ? 'repositioning' : 'delivery',
              tollCost: 200 + idx * 100,
              fuelEstimate: 50 + idx * 10
            },
            notes: `Trip #${idx + 1} - Status: ${tripStatuses[idx % tripStatuses.length]}`
          }, { transaction });
        })
      );
      console.log(`✓ Created ${tripRoutesList.length} trip routes`);

      // Create trip route events for each trip (3-5 events per trip)
      let eventCount = 0;
      for (let idx = 0; idx < tripRoutesList.length; idx++) {
        const trip = tripRoutesList[idx];
        const events = [];
        
        // Status created event
        events.push({
          tripRouteId: trip.id,
          eventType: 'status_change',
          toStatus: 'created',
          description: 'Trip route created',
          performedByRole: 'system',
          timestamp: new Date(Date.now() - (15 - idx) * 24 * 60 * 60 * 1000)
        });

        if (trip.status !== 'created') {
          events.push({
            tripRouteId: trip.id,
            eventType: 'status_change',
            fromStatus: 'created',
            toStatus: 'assigned',
            description: 'Trip assigned to driver',
            performedByRole: 'employer',
            timestamp: new Date(Date.now() - (14 - idx) * 24 * 60 * 60 * 1000)
          });
        }

        if (trip.status === 'in_progress' || trip.status === 'completed' || trip.status === 'cancelled') {
          events.push({
            tripRouteId: trip.id,
            eventType: 'status_change',
            fromStatus: 'assigned',
            toStatus: 'in_progress',
            location: { lat: trip.origin.coordinates.lat, lng: trip.origin.coordinates.lng },
            description: 'Trip started',
            performedBy: trip.driverId,
            performedByRole: 'driver',
            timestamp: new Date(Date.now() - (13 - idx) * 24 * 60 * 60 * 1000)
          });

          events.push({
            tripRouteId: trip.id,
            eventType: 'location_update',
            location: { lat: (trip.origin.coordinates.lat + trip.destination.coordinates.lat) / 2, lng: (trip.origin.coordinates.lng + trip.destination.coordinates.lng) / 2 },
            description: 'Location update - en route',
            performedBy: trip.driverId,
            performedByRole: 'driver',
            timestamp: new Date(Date.now() - (12 - idx) * 24 * 60 * 60 * 1000)
          });
        }

        if (trip.status === 'completed') {
          events.push({
            tripRouteId: trip.id,
            eventType: 'status_change',
            fromStatus: 'in_progress',
            toStatus: 'completed',
            location: { lat: trip.destination.coordinates.lat, lng: trip.destination.coordinates.lng },
            description: 'Trip completed successfully',
            performedBy: trip.driverId,
            performedByRole: 'driver',
            timestamp: new Date(Date.now() - (10 - idx) * 24 * 60 * 60 * 1000)
          });
        }

        await Promise.all(events.map(e => TripRouteEvent.create(e, { transaction })));
        eventCount += events.length;
      }
      console.log(`✓ Created ${eventCount} trip route events`);

      // Create Tracking data (30+ GPS locations)
      let trackingCount = 0;
      for (let idx = 0; idx < Math.min(8, tripRoutesList.length); idx++) {
        const trip = tripRoutesList[idx];
        if (trip.status === 'in_progress' || trip.status === 'completed') {
          for (let locIdx = 0; locIdx < 3 + Math.floor(Math.random() * 3); locIdx++) {
            const progress = locIdx / 4;
            const lat = trip.origin.coordinates.lat + (trip.destination.coordinates.lat - trip.origin.coordinates.lat) * progress;
            const lng = trip.origin.coordinates.lng + (trip.destination.coordinates.lng - trip.origin.coordinates.lng) * progress;
            
            await Tracking.create({
              tripRouteId: trip.id,
              latitude: lat,
              longitude: lng,
              address: `Location ${locIdx + 1} on route`,
              speed: 60 + Math.random() * 40,
              accuracy: 5 + Math.random() * 10,
              userId: trip.driverId
            }, { transaction });
            trackingCount++;
          }
        }
      }
      console.log(`✓ Created ${trackingCount} tracking GPS points`);

      // Create Notifications (20+ notifications)
      const notificationTypes = ['trip_status', 'order_update', 'driver_alert', 'system_alert'];
      const notificationsList = [];
      
      for (let idx = 0; idx < 20; idx++) {
        const type = notificationTypes[idx % notificationTypes.length];
        notificationsList.push(
          Notification.create({
            userId: users[idx % users.length].id,
            type: type,
            title: `${type.replace(/_/g, ' ')} - #${idx + 1}`.toUpperCase(),
            message: `Notification message for ${type} ${idx + 1}`,
            relatedId: idx < 12 ? tripRoutesList[idx % tripRoutesList.length].id : ordersList[idx % ordersList.length].id,
            relatedType: idx < 12 ? 'TripRoute' : 'Order',
            isRead: idx > 10
          }, { transaction })
        );
      }
      await Promise.all(notificationsList);
      console.log(`✓ Created ${notificationsList.length} notifications`);

      // Create Assignments (10+ assignments)
      const assignmentsList = await Promise.all(
        Array.from({ length: 10 }, (_, idx) => 
          Assignment.create({
            driverId: driversList[idx % driversList.length].id,
            orderId: ordersList[idx % ordersList.length].id,
            unitId: unitsList[idx % unitsList.length].id,
            status: ['pending', 'ready', 'started', 'completed'][idx % 4],
            assignedAt: new Date(Date.now() - (10 - idx) * 24 * 60 * 60 * 1000),
            notes: `Assignment #${idx + 1} - Driver to Order mapping`
          }, { transaction })
        )
      );
      console.log(`✓ Created ${assignmentsList.length} assignments`);

      // Create Billing and Payments (15+ billing records with payments)
      const billingList = [];
      const paymentList = [];
      
      for (let idx = 0; idx < 15; idx++) {
        const billing = await Billing.create({
          orderId: ordersList[idx % ordersList.length].id,
          totalAmount: 3000 + idx * 500 + Math.random() * 2000,
          status: idx < 5 ? 'paid' : (idx < 10 ? 'sent' : 'draft'),
          invoiceNumber: `INV-2024-${String(1000 + idx).slice(-4)}`,
          issueDate: new Date(Date.now() - (15 - idx) * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() + (15 + idx) * 24 * 60 * 60 * 1000),
          paidDate: idx < 5 ? new Date(Date.now() - (5 - idx) * 24 * 60 * 60 * 1000) : null
        }, { transaction });
        billingList.push(billing);

        // Create payment if billing is paid
        if (idx < 5) {
          const payment = await Payment.create({
            billingId: billing.id,
            amount: billing.totalAmount,
            paymentMethod: idx % 3 === 0 ? 'bank_transfer' : (idx % 3 === 1 ? 'credit_card' : 'cash'),
            referenceNumber: `PAY-${String(1000 + idx).slice(-4)}`,
            status: 'completed',
            paidDate: new Date(Date.now() - (5 - idx) * 24 * 60 * 60 * 1000)
          }, { transaction });
          paymentList.push(payment);
        }
      }
      console.log(`✓ Created ${billingList.length} billing records and ${paymentList.length} payments`);

      // Create Fleet Maintenance records (15+ records)
      const maintenanceTypes = ['oil_change', 'tire_rotation', 'inspection', 'repair', 'cleaning', 'fuel_log'];
      const maintenanceList = await Promise.all(
        Array.from({ length: 15 }, (_, idx) =>
          FleetMaintenance.create({
            unitId: unitsList[idx % unitsList.length].id,
            type: maintenanceTypes[idx % maintenanceTypes.length],
            description: `${maintenanceTypes[idx % maintenanceTypes.length].replace(/_/g, ' ')} maintenance #${idx + 1}`,
            cost: 500 + idx * 200 + Math.random() * 1000,
            date: new Date(Date.now() - (20 - idx) * 24 * 60 * 60 * 1000),
            nextMaintenanceDate: idx % 3 === 0 ? new Date(Date.now() + (90 + idx * 10) * 24 * 60 * 60 * 1000) : null,
            metadata: idx % maintenanceTypes.length === 2 ? {
              liters: 200 + Math.random() * 150,
              odometer: 40000 + idx * 1000,
              location: 'Gas Station',
              pricePerLiter: 20 + Math.random() * 5
            } : null,
            notes: `Maintenance record #${idx + 1}`
          }, { transaction })
        )
      );
      console.log(`✓ Created ${maintenanceList.length} fleet maintenance records`);

      // Commit transaction
      await transaction.commit();
      
      console.log('\n🎉 Demo data seeded successfully with expanded dataset!\n');
      console.log('📊 EXPANDED Demo Data Summary:');
      console.log('════════════════════════════════════════════════════');
      console.log(`👥 Users:                    ${users.length} (client, dispatcher, admin)`);
      console.log(`🚛 Drivers:                  ${driversList.length} (10 active, 2 inactive)`);
      console.log(`🚚 Vehicles:                 ${unitsList.length} (13 trucks, 2 vans - various statuses)`);
      console.log(`📄 Documents:                ${driversList.length * 2 + unitsList.length * 2} (licenses, certificates, registrations, insurance)`);
      console.log(`📦 Orders:                   ${ordersList.length} (pending, assigned, in_progress, completed, cancelled)`);
      console.log(`🚗 Trip Routes:              ${tripRoutesList.length} (created, assigned, in_progress, completed, cancelled)`);
      console.log(`📊 Trip Events:              ${eventCount} (status changes, location updates)`);
      console.log(`🗺️  GPS Tracking Points:      ${trackingCount} (real-time location history)`);
      console.log(`📋 Assignments:              ${assignmentsList.length} (driver to order mapping)`);
      console.log(`🔔 Notifications:            ${notificationsList.length} (status, order, documents, payment, maintenance)`);
      console.log(`💰 Billing Records:          ${billingList.length} (paid, sent, pending)`);
      console.log(`💳 Payments:                 ${paymentList.length} (completed)`);
      console.log(`🔧 Fleet Maintenance:        ${maintenanceList.length} (oil change, tire rotation, fuel, inspections, etc)`);
      console.log('════════════════════════════════════════════════════');
      console.log('\n✨ Total Records Created: 100+ entries with realistic relationships\n');
      console.log('🔑 Demo User Credentials:');
      console.log('════════════════════════════════════════════════════');
      console.log('📧 Email:    client@truckmatch.com');
      console.log('             dispatcher@truckmatch.com');
      console.log('             admin@truckmatch.com');
      console.log('🔐 Password: demo123');
      console.log('════════════════════════════════════════════════════\n');

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