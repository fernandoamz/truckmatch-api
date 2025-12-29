// tests/routes/documents.test.js
const request = require('supertest');
const express = require('express');
const documentRoutes = require('../../routes/documents');
const { Document, Driver, Unit, sequelize } = require('../../models');
const { createTestDriver, createTestUnit, createTestUser, generateToken, cleanupTestData } = require('../helpers');
const responseHandler = require('../../middleware/responseHandler');
const errorHandler = require('../../middleware/errorHandler');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(responseHandler);
  app.use('/documents', documentRoutes);
  app.use(errorHandler);
  return app;
};

describe('Document Routes', () => {
  let app;
  let token;
  let driver;
  let unit;

  beforeAll(async () => {
    app = createTestApp();
    const user = await createTestUser();
    token = generateToken(user.id);
    driver = await createTestDriver();
    unit = await createTestUnit({ driverId: driver.id });
  });

  beforeEach(async () => {
    const transaction = await sequelize.transaction();
    try {
      await Document.destroy({ where: {}, transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /documents', () => {
    it('should retrieve all documents', async () => {
      await Document.create({
        entityType: 'driver',
        entityId: driver.id,
        type: 'license',
        url: '/uploads/test.pdf',
        fileName: 'test.pdf',
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'valid'
      });

      const response = await request(app)
        .get('/documents')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter documents by entity type', async () => {
      await Document.create({
        entityType: 'driver',
        entityId: driver.id,
        type: 'license',
        url: '/uploads/test.pdf',
        fileName: 'test.pdf',
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'valid'
      });

      const response = await request(app)
        .get('/documents?entityType=driver')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(d => d.entityType === 'driver')).toBe(true);
    });

    it('should filter documents by status', async () => {
      await Document.create({
        entityType: 'driver',
        entityId: driver.id,
        type: 'license',
        url: '/uploads/test.pdf',
        fileName: 'test.pdf',
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'valid'
      });

      const response = await request(app)
        .get('/documents?status=valid')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(d => d.status === 'valid')).toBe(true);
    });
  });

  describe('POST /documents', () => {
    it('should create a new document for driver', async () => {
      const response = await request(app)
        .post('/documents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          entityType: 'driver',
          entityId: driver.id,
          type: 'license',
          url: '/uploads/new-license.pdf',
          fileName: 'new-license.pdf',
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });

    it('should create a new document for unit', async () => {
      const response = await request(app)
        .post('/documents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          entityType: 'unit',
          entityId: unit.id,
          type: 'insurance',
          url: '/uploads/insurance.pdf',
          fileName: 'insurance.pdf',
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /documents/:id', () => {
    it('should retrieve a document by id', async () => {
      const doc = await Document.create({
        entityType: 'driver',
        entityId: driver.id,
        type: 'license',
        url: '/uploads/test.pdf',
        fileName: 'test.pdf',
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'valid'
      });

      const response = await request(app)
        .get(`/documents/${doc.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(doc.id);
    });
  });

  describe('PUT /documents/:id', () => {
    it('should update a document status', async () => {
      const doc = await Document.create({
        entityType: 'driver',
        entityId: driver.id,
        type: 'license',
        url: '/uploads/test.pdf',
        fileName: 'test.pdf',
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'valid'
      });

      const response = await request(app)
        .put(`/documents/${doc.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'expiring_soon'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('expiring_soon');
    });
  });

  describe('DELETE /documents/:id', () => {
    it('should delete a document', async () => {
      const doc = await Document.create({
        entityType: 'driver',
        entityId: driver.id,
        type: 'license',
        url: '/uploads/test.pdf',
        fileName: 'test.pdf',
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'valid'
      });

      const response = await request(app)
        .delete(`/documents/${doc.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deletedDoc = await Document.findByPk(doc.id);
      expect(deletedDoc).toBeNull();
    });
  });
});
