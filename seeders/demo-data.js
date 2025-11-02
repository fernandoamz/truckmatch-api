// seeders/demo-data.js
const bcrypt = require('bcryptjs');
const { 
  User, 
  Driver, 
  Unit, 
  Document, 
  Order, 
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
          licenseExpirationDate: new Date('2025-12-31'),
          phone: '+52-555-0123',
          email: 'juan.perez@email.com',
          address: 'Av. Insurgentes 123, CDMX',
          status: 'active'
        }, { transaction }),
        Driver.create({
          name: 'María González',
          license: 'CDL-987654321',
          licenseExpirationDate: new Date('2025-06-30'),
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
          expirationDate: new Date('2025-12-31'),
          status: 'valid'
        }, { transaction }),
        Document.create({
          entityType: 'driver',
          entityId: driver1.id,
          type: 'medical_certificate',
          url: '/uploads/documents/demo-medical-1.pdf',
          fileName: 'medical-juan-perez.pdf',
          expirationDate: new Date('2025-03-15'),
          status: 'valid'
        }, { transaction }),
        // Driver 2 documents
        Document.create({
          entityType: 'driver',
          entityId: driver2.id,
          type: 'license',
          url: '/uploads/documents/demo-license-2.pdf',
          fileName: 'license-maria-gonzalez.pdf',
          expirationDate: new Date('2025-06-30'),
          status: 'valid'
        }, { transaction }),
        Document.create({
          entityType: 'driver',
          entityId: driver2.id,
          type: 'medical_certificate',
          url: '/uploads/documents/demo-medical-2.pdf',
          fileName: 'medical-maria-gonzalez.pdf',
          expirationDate: new Date('2025-01-20'),
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
          expirationDate: new Date('2025-08-15'),
          status: 'valid'
        }, { transaction }),
        Document.create({
          entityType: 'unit',
          entityId: unit1.id,
          type: 'insurance',
          url: '/uploads/documents/demo-insurance-1.pdf',
          fileName: 'insurance-trk-001.pdf',
          expirationDate: new Date('2025-04-30'),
          status: 'valid'
        }, { transaction }),
        // Unit 2 documents
        Document.create({
          entityType: 'unit',
          entityId: unit2.id,
          type: 'registration',
          url: '/uploads/documents/demo-registration-2.pdf',
          fileName: 'registration-trk-002.pdf',
          expirationDate: new Date('2025-09-20'),
          status: 'valid'
        }, { transaction }),
        Document.create({
          entityType: 'unit',
          entityId: unit2.id,
          type: 'insurance',
          url: '/uploads/documents/demo-insurance-2.pdf',
          fileName: 'insurance-trk-002.pdf',
          expirationDate: new Date('2025-05-15'),
          status: 'valid'
        }, { transaction })
      ]);
      console.log('✓ Created demo documents');

      // Create demo order
      const order1 = await Order.create({
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
        pickupDate: new Date('2024-11-15T08:00:00'),
        deliveryDate: new Date('2024-11-16T18:00:00'),
        rate: 25000.00,
        currency: 'MXN',
        clientId: demoClient.id,
        status: 'pending',
        notes: 'Carga frágil, requiere manejo especial'
      }, { transaction });

      console.log('✓ Created demo order');

      // Commit transaction
      await transaction.commit();
      
      console.log('🎉 Demo data seeded successfully!');
      console.log('\n📋 Demo Data Summary:');
      console.log('👥 Users: 2 (client@truckmatch.com, admin@truckmatch.com)');
      console.log('🚛 Drivers: 2 (Juan Pérez, María González)');
      console.log('🚚 Units: 2 (TRK-001-MX, TRK-002-MX)');
      console.log('📄 Documents: 8 (4 per driver/unit)');
      console.log('📦 Orders: 1 (pending order CDMX → Monterrey)');
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