// tests/routes/drivers.test.js
const request = require('supertest');
const express = require('express');
const driverRoutes = require('../../routes/drivers');
const { Driver, sequelize } = require('../../models');
const { createTestDriver, createTestUser, generateToken, cleanupTestData } = require('../helpers');
const responseHandler = require('../../middleware/responseHandler');
const errorHandler = require('../../middleware/errorHandler');

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(responseHandler);
  app.use('/drivers', driverRoutes);
  app.use(errorHandler);
  return app;
};

describe('Driver Routes', () => {
  let app;
  let token;
  let userId;

  beforeAll(async () => {
    app = createTestApp();
    const user = await createTestUser();
    userId = user.id;
    token = generateToken(user.id);
  });

  beforeEach(async () => {
    // Clean up drivers before each test
    const transaction = await sequelize.transaction();
    try {
      await Driver.destroy({ where: {}, transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /drivers', () => {
    it('should retrieve all drivers', async () => {
      // Create test drivers
      await createTestDriver();
      await createTestDriver();

      const response = await request(app)
        .get('/drivers')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter drivers by status', async () => {
      await createTestDriver({ status: 'active' });
      await createTestDriver({ status: 'inactive' });

      const response = await request(app)
        .get('/drivers?status=active')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(d => d.status === 'active')).toBe(true);
    });
  });

  describe('POST /drivers', () => {
    it('should create a new driver', async () => {
      const response = await request(app)
        .post('/drivers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Juan García',
          license: 'CDL-123456789',
          licenseExpirationDate: new Date('2026-12-31'),
          phone: '+52-555-1234',
          email: 'juan@test.com',
          address: 'Calle Principal 123',
          status: 'active'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('Juan García');
    });

    it('should fail without required fields', async () => {
      const response = await request(app)
        .post('/drivers')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Juan García'
          // missing other required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail without authorization', async () => {
      const response = await request(app)
        .post('/drivers')
        .send({
          name: 'Juan García',
          license: 'CDL-123456789',
          licenseExpirationDate: new Date('2026-12-31'),
          phone: '+52-555-1234',
          email: 'juan@test.com',
          address: 'Calle Principal 123'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /drivers/:id', () => {
    it('should retrieve a driver by id', async () => {
      const driver = await createTestDriver({ name: 'Test Driver' });

      const response = await request(app)
        .get(`/drivers/${driver.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(driver.id);
      expect(response.body.data.name).toBe('Test Driver');
    });

    it('should return 404 for non-existent driver', async () => {
      const response = await request(app)
        .get('/drivers/99999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /drivers/:id', () => {
    it('should update a driver', async () => {
      const driver = await createTestDriver({ name: 'Old Name' });

      const response = await request(app)
        .put(`/drivers/${driver.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
          phone: '+52-555-9999'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.phone).toBe('+52-555-9999');
    });

    it('should return 404 when updating non-existent driver', async () => {
      const response = await request(app)
        .put('/drivers/99999')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Name'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /drivers/:id', () => {
    it('should delete a driver', async () => {
      const driver = await createTestDriver();

      const response = await request(app)
        .delete(`/drivers/${driver.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify driver is deleted
      const deletedDriver = await Driver.findByPk(driver.id);
      expect(deletedDriver).toBeNull();
    });

    it('should return 404 when deleting non-existent driver', async () => {
      const response = await request(app)
        .delete('/drivers/99999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});
