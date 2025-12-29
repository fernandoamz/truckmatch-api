// tests/helpers.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Driver, Unit, Order, TripRoute, Assignment } = require('../models');

/**
 * Create a test user with optional overrides
 */
async function createTestUser(overrides = {}, transaction = null) {
  const defaults = {
    email: `test-user-${Date.now()}@test.com`,
    passwordHash: await bcrypt.hash('password123', 10),
    role: 'employer',
    ...overrides
  };

  return User.create(defaults, { transaction });
}

/**
 * Create a test driver with optional overrides
 */
async function createTestDriver(overrides = {}, transaction = null) {
  const defaults = {
    name: `Test Driver ${Date.now()}`,
    license: `CDL-${Date.now()}`,
    licenseExpirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    phone: '+52-555-0000',
    email: `driver-${Date.now()}@test.com`,
    address: 'Test Address 123',
    status: 'active',
    ...overrides
  };

  return Driver.create(defaults, { transaction });
}

/**
 * Create a test unit with optional overrides
 */
async function createTestUnit(overrides = {}, transaction = null) {
  let driverId = overrides.driverId;
  
  // Create a driver if not provided
  if (!driverId) {
    const driver = await createTestDriver({}, transaction);
    driverId = driver.id;
  }

  const defaults = {
    plateNumber: `TST-${Date.now()}`,
    model: 'Test Model',
    type: 'truck',
    capacity: 25.0,
    capacityUnit: 'tons',
    year: 2023,
    brand: 'TestBrand',
    status: 'active',
    driverId,
    ...overrides
  };

  return Unit.create(defaults, { transaction });
}

/**
 * Create a test order with optional overrides
 */
async function createTestOrder(overrides = {}, transaction = null) {
  let clientId = overrides.clientId;

  // Create a client if not provided
  if (!clientId) {
    const client = await createTestUser({ role: 'employer' }, transaction);
    clientId = client.id;
  }

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');

  const defaults = {
    orderNumber: `ORD-${date}-${random}`,
    origin: {
      address: 'Origin Address 123',
      city: 'Test City 1',
      state: 'State1',
      zipCode: '12345',
      coordinates: { lat: 19.4326, lng: -99.1332 }
    },
    destination: {
      address: 'Destination Address 456',
      city: 'Test City 2',
      state: 'State2',
      zipCode: '54321',
      coordinates: { lat: 25.6866, lng: -100.3161 }
    },
    cargoDescription: 'Test Cargo',
    cargoWeight: 10.0,
    cargoWeightUnit: 'tons',
    requirements: ['Test requirement'],
    pickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    deliveryDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
    rate: 5000.00,
    currency: 'MXN',
    clientId,
    status: 'pending',
    ...overrides
  };

  return Order.create(defaults, { transaction });
}

/**
 * Create a test trip route with optional overrides
 */
async function createTestTripRoute(overrides = {}, transaction = null) {
  let driverId = overrides.driverId;
  let unitId = overrides.unitId;

  if (!driverId || !unitId) {
    const unit = await createTestUnit({}, transaction);
    driverId = unit.driverId;
    unitId = unit.id;
  }

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');

  const defaults = {
    tripNumber: `TRIP-${date}-${random}`,
    origin: {
      address: 'Origin Address 123',
      city: 'Test City 1',
      state: 'State1',
      zipCode: '12345',
      coordinates: { lat: 19.4326, lng: -99.1332 }
    },
    destination: {
      address: 'Destination Address 456',
      city: 'Test City 2',
      state: 'State2',
      zipCode: '54321',
      coordinates: { lat: 25.6866, lng: -100.3161 }
    },
    estimatedDistanceKm: 500.0,
    estimatedDurationHours: 6.0,
    driverId,
    unitId,
    status: 'created',
    ...overrides
  };

  return TripRoute.create(defaults, { transaction });
}

/**
 * Create a test assignment with optional overrides
 */
async function createTestAssignment(overrides = {}, transaction = null) {
  let driverId = overrides.driverId;
  let orderId = overrides.orderId;

  if (!driverId) {
    const driver = await createTestDriver({}, transaction);
    driverId = driver.id;
  }

  if (!orderId) {
    const order = await createTestOrder({}, transaction);
    orderId = order.id;
  }

  const defaults = {
    driverId,
    orderId,
    status: 'assigned',
    notes: 'Test assignment',
    ...overrides
  };

  return Assignment.create(defaults, { transaction });
}

/**
 * Generate JWT token for a user
 */
function generateToken(userId, role = 'employer', expiresIn = '24h') {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn }
  );
}

/**
 * Clean up all test data
 */
async function cleanupTestData() {
  const { sequelize, User, Driver, Unit, Order, TripRoute, TripRouteEvent, Assignment, Document, Tracking, Notification, Billing, Payment, FleetMaintenance } = require('../models');

  try {
    const transaction = await sequelize.transaction();

    try {
      // Delete in correct order to respect foreign keys
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

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    throw error;
  }
}

module.exports = {
  createTestUser,
  createTestDriver,
  createTestUnit,
  createTestOrder,
  createTestTripRoute,
  createTestAssignment,
  generateToken,
  cleanupTestData
};
