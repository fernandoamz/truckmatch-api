// tests/routes/orders.test.js
const request = require('supertest');
const express = require('express');
const orderRoutes = require('../../routes/orders');
const { Order, sequelize } = require('../../models');
const { createTestOrder, createTestUser, generateToken, cleanupTestData } = require('../helpers');
const responseHandler = require('../../middleware/responseHandler');
const errorHandler = require('../../middleware/errorHandler');

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(responseHandler);
  app.use('/orders', orderRoutes);
  app.use(errorHandler);
  return app;
};

describe('Order Routes', () => {
  let app;
  let token;
  let clientId;

  beforeAll(async () => {
    app = createTestApp();
    const user = await createTestUser({ role: 'employer' });
    clientId = user.id;
    token = generateToken(user.id);
  });

  beforeEach(async () => {
    const transaction = await sequelize.transaction();
    try {
      await Order.destroy({ where: {}, transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /orders', () => {
    it('should retrieve all orders', async () => {
      await createTestOrder({ clientId });
      await createTestOrder({ clientId });

      const response = await request(app)
        .get('/orders')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter orders by status', async () => {
      await createTestOrder({ clientId, status: 'pending' });
      await createTestOrder({ clientId, status: 'completed' });

      const response = await request(app)
        .get('/orders?status=pending')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(o => o.status === 'pending')).toBe(true);
    });
  });

  describe('POST /orders', () => {
    it('should create a new order', async () => {
      const response = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          origin: {
            address: 'Origin Street 123',
            city: 'Mexico City',
            state: 'CDMX',
            zipCode: '01000',
            coordinates: { lat: 19.4326, lng: -99.1332 }
          },
          destination: {
            address: 'Destination Street 456',
            city: 'Guadalajara',
            state: 'Jalisco',
            zipCode: '44100',
            coordinates: { lat: 20.6597, lng: -103.3496 }
          },
          cargoDescription: 'Test cargo',
          cargoWeight: 15.5,
          cargoWeightUnit: 'tons',
          requirements: ['Temperature control'],
          pickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          deliveryDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
          rate: 5000.00,
          currency: 'MXN'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('orderNumber');
    });

    it('should fail without required fields', async () => {
      const response = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          cargoDescription: 'Test cargo'
          // missing required location and date fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /orders/:id', () => {
    it('should retrieve an order by id', async () => {
      const order = await createTestOrder({ clientId });

      const response = await request(app)
        .get(`/orders/${order.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(order.id);
      expect(response.body.data.cargoDescription).toBe(order.cargoDescription);
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .get('/orders/99999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /orders/:id', () => {
    it('should update an order', async () => {
      const order = await createTestOrder({ clientId, status: 'pending' });

      const response = await request(app)
        .put(`/orders/${order.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'assigned',
          rate: 6000.00
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('assigned');
      expect(response.body.data.rate).toBe(6000.00);
    });
  });

  describe('DELETE /orders/:id', () => {
    it('should delete an order', async () => {
      const order = await createTestOrder({ clientId });

      const response = await request(app)
        .delete(`/orders/${order.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify order is deleted
      const deletedOrder = await Order.findByPk(order.id);
      expect(deletedOrder).toBeNull();
    });
  });
});
