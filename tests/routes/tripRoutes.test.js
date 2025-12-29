// tests/routes/tripRoutes.test.js
const request = require('supertest');
const express = require('express');
const tripRouteRoutes = require('../../routes/trip-routes');
const { TripRoute, sequelize } = require('../../models');
const { createTestTripRoute, createTestUser, generateToken, cleanupTestData } = require('../helpers');
const responseHandler = require('../../middleware/responseHandler');
const errorHandler = require('../../middleware/errorHandler');

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(responseHandler);
  app.use('/trip-routes', tripRouteRoutes);
  app.use(errorHandler);
  return app;
};

describe('Trip Route Routes', () => {
  let app;
  let token;

  beforeAll(async () => {
    app = createTestApp();
    const user = await createTestUser();
    token = generateToken(user.id);
  });

  beforeEach(async () => {
    const transaction = await sequelize.transaction();
    try {
      await TripRoute.destroy({ where: {}, transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /trip-routes', () => {
    it('should retrieve all trip routes', async () => {
      await createTestTripRoute();
      await createTestTripRoute();

      const response = await request(app)
        .get('/trip-routes')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter trip routes by status', async () => {
      await createTestTripRoute({ status: 'created' });
      await createTestTripRoute({ status: 'in_progress' });

      const response = await request(app)
        .get('/trip-routes?status=in_progress')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(t => t.status === 'in_progress')).toBe(true);
    });
  });

  describe('POST /trip-routes', () => {
    it('should create a new trip route', async () => {
      const response = await request(app)
        .post('/trip-routes')
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
            city: 'Monterrey',
            state: 'NL',
            zipCode: '64000',
            coordinates: { lat: 25.6866, lng: -100.3161 }
          },
          estimatedDistanceKm: 920,
          estimatedDurationHours: 10.5,
          status: 'created'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('tripNumber');
    });

    it('should fail without required fields', async () => {
      const response = await request(app)
        .post('/trip-routes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          estimatedDistanceKm: 500
          // missing required location fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /trip-routes/:id', () => {
    it('should retrieve a trip route by id', async () => {
      const tripRoute = await createTestTripRoute();

      const response = await request(app)
        .get(`/trip-routes/${tripRoute.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(tripRoute.id);
      expect(response.body.data).toHaveProperty('tripNumber');
    });

    it('should return 404 for non-existent trip route', async () => {
      const response = await request(app)
        .get('/trip-routes/99999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /trip-routes/:id', () => {
    it('should update a trip route status', async () => {
      const tripRoute = await createTestTripRoute({ status: 'created' });

      const response = await request(app)
        .put(`/trip-routes/${tripRoute.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'in_progress',
          startedAt: new Date()
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('in_progress');
    });

    it('should complete a trip route', async () => {
      const tripRoute = await createTestTripRoute({
        status: 'in_progress',
        startedAt: new Date(Date.now() - 10 * 60 * 60 * 1000)
      });

      const response = await request(app)
        .put(`/trip-routes/${tripRoute.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'completed',
          arrivedAt: new Date(),
          actualDistanceKm: 925
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.actualDistanceKm).toBe(925);
    });
  });

  describe('DELETE /trip-routes/:id', () => {
    it('should delete a trip route', async () => {
      const tripRoute = await createTestTripRoute();

      const response = await request(app)
        .delete(`/trip-routes/${tripRoute.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify trip route is deleted
      const deletedTripRoute = await TripRoute.findByPk(tripRoute.id);
      expect(deletedTripRoute).toBeNull();
    });
  });
});
