// tests/routes/units.test.js
const request = require('supertest');
const express = require('express');
const unitRoutes = require('../../routes/units');
const { Unit, sequelize } = require('../../models');
const { createTestUnit, createTestUser, generateToken, cleanupTestData } = require('../helpers');
const responseHandler = require('../../middleware/responseHandler');
const errorHandler = require('../../middleware/errorHandler');

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(responseHandler);
  app.use('/units', unitRoutes);
  app.use(errorHandler);
  return app;
};

describe('Unit Routes', () => {
  let app;
  let token;

  beforeAll(async () => {
    app = createTestApp();
    const user = await createTestUser();
    token = generateToken(user.id);
  });

  beforeEach(async () => {
    // Clean up units before each test
    const transaction = await sequelize.transaction();
    try {
      await Unit.destroy({ where: {}, transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /units', () => {
    it('should retrieve all units', async () => {
      await createTestUnit();
      await createTestUnit();

      const response = await request(app)
        .get('/units')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter units by status', async () => {
      await createTestUnit({ status: 'active' });
      await createTestUnit({ status: 'maintenance' });

      const response = await request(app)
        .get('/units?status=active')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(u => u.status === 'active')).toBe(true);
    });
  });

  describe('POST /units', () => {
    it('should create a new unit', async () => {
      const response = await request(app)
        .post('/units')
        .set('Authorization', `Bearer ${token}`)
        .send({
          plateNumber: 'TRK-TEST-001',
          model: 'Kenworth T680',
          type: 'truck',
          capacity: 25.0,
          capacityUnit: 'tons',
          year: 2023,
          brand: 'Kenworth',
          status: 'active'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.plateNumber).toBe('TRK-TEST-001');
    });

    it('should fail without required fields', async () => {
      const response = await request(app)
        .post('/units')
        .set('Authorization', `Bearer ${token}`)
        .send({
          plateNumber: 'TRK-TEST-001'
          // missing other required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /units/:id', () => {
    it('should retrieve a unit by id', async () => {
      const unit = await createTestUnit({ plateNumber: 'TRK-UNIQUE-001' });

      const response = await request(app)
        .get(`/units/${unit.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(unit.id);
      expect(response.body.data.plateNumber).toBe('TRK-UNIQUE-001');
    });

    it('should return 404 for non-existent unit', async () => {
      const response = await request(app)
        .get('/units/99999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /units/:id', () => {
    it('should update a unit', async () => {
      const unit = await createTestUnit({ status: 'active' });

      const response = await request(app)
        .put(`/units/${unit.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'maintenance',
          capacity: 30.0
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('maintenance');
      expect(response.body.data.capacity).toBe(30.0);
    });
  });

  describe('DELETE /units/:id', () => {
    it('should delete a unit', async () => {
      const unit = await createTestUnit();

      const response = await request(app)
        .delete(`/units/${unit.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify unit is deleted
      const deletedUnit = await Unit.findByPk(unit.id);
      expect(deletedUnit).toBeNull();
    });
  });
});
