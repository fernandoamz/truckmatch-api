// tests/routes/tracking.test.js
const request = require('supertest');
const express = require('express');
const trackingRoutes = require('../../routes/tracking');
const { Tracking, TripRoute, sequelize } = require('../../models');
const { createTestTripRoute, createTestUser, generateToken, cleanupTestData } = require('../helpers');
const responseHandler = require('../../middleware/responseHandler');
const errorHandler = require('../../middleware/errorHandler');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(responseHandler);
  app.use('/tracking', trackingRoutes);
  app.use(errorHandler);
  return app;
};

describe('Tracking Routes', () => {
  let app;
  let token;
  let tripRoute;

  beforeAll(async () => {
    app = createTestApp();
    const user = await createTestUser();
    token = generateToken(user.id);
    tripRoute = await createTestTripRoute({ status: 'in_progress' });
  });

  beforeEach(async () => {
    const transaction = await sequelize.transaction();
    try {
      await Tracking.destroy({ where: {}, transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /tracking', () => {
    it('should retrieve all tracking points', async () => {
      await Tracking.create({
        tripRouteId: tripRoute.id,
        latitude: 19.4326,
        longitude: -99.1332,
        address: 'Mexico City',
        speed: 85,
        accuracy: 5,
        userId: tripRoute.driverId
      });

      const response = await request(app)
        .get('/tracking')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter tracking points by trip route', async () => {
      await Tracking.create({
        tripRouteId: tripRoute.id,
        latitude: 19.4326,
        longitude: -99.1332,
        address: 'Mexico City',
        speed: 85,
        accuracy: 5,
        userId: tripRoute.driverId
      });

      const response = await request(app)
        .get(`/tracking?tripRouteId=${tripRoute.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(t => t.tripRouteId === tripRoute.id)).toBe(true);
    });
  });

  describe('POST /tracking', () => {
    it('should create a new tracking point', async () => {
      const response = await request(app)
        .post('/tracking')
        .set('Authorization', `Bearer ${token}`)
        .send({
          tripRouteId: tripRoute.id,
          latitude: 20.5,
          longitude: -99.5,
          address: 'Querétaro Area',
          speed: 90,
          accuracy: 5
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });

    it('should fail without required fields', async () => {
      const response = await request(app)
        .post('/tracking')
        .set('Authorization', `Bearer ${token}`)
        .send({
          latitude: 20.5
          // missing longitude and other required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /tracking/:id', () => {
    it('should retrieve a tracking point by id', async () => {
      const tracking = await Tracking.create({
        tripRouteId: tripRoute.id,
        latitude: 19.4326,
        longitude: -99.1332,
        address: 'Mexico City',
        speed: 85,
        accuracy: 5,
        userId: tripRoute.driverId
      });

      const response = await request(app)
        .get(`/tracking/${tracking.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(tracking.id);
    });
  });

  describe('GET /tracking/trip/:tripRouteId', () => {
    it('should retrieve all tracking points for a trip', async () => {
      await Tracking.create({
        tripRouteId: tripRoute.id,
        latitude: 19.4326,
        longitude: -99.1332,
        address: 'Mexico City',
        speed: 85,
        accuracy: 5,
        userId: tripRoute.driverId
      });

      await Tracking.create({
        tripRouteId: tripRoute.id,
        latitude: 20.5,
        longitude: -99.5,
        address: 'Querétaro Area',
        speed: 90,
        accuracy: 5,
        userId: tripRoute.driverId
      });

      const response = await request(app)
        .get(`/tracking/trip/${tripRoute.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
    });
  });

  describe('DELETE /tracking/:id', () => {
    it('should delete a tracking point', async () => {
      const tracking = await Tracking.create({
        tripRouteId: tripRoute.id,
        latitude: 19.4326,
        longitude: -99.1332,
        address: 'Mexico City',
        speed: 85,
        accuracy: 5,
        userId: tripRoute.driverId
      });

      const response = await request(app)
        .delete(`/tracking/${tracking.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deletedTracking = await Tracking.findByPk(tracking.id);
      expect(deletedTracking).toBeNull();
    });
  });
});
