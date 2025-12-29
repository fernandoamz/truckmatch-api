// tests/routes/billing.test.js
const request = require('supertest');
const express = require('express');
const billingRoutes = require('../../routes/billing');
const { Billing, Payment, Order, sequelize } = require('../../models');
const { createTestOrder, createTestUser, generateToken, cleanupTestData } = require('../helpers');
const responseHandler = require('../../middleware/responseHandler');
const errorHandler = require('../../middleware/errorHandler');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(responseHandler);
  app.use('/billing', billingRoutes);
  app.use(errorHandler);
  return app;
};

describe('Billing Routes', () => {
  let app;
  let token;
  let order;

  beforeAll(async () => {
    app = createTestApp();
    const user = await createTestUser();
    token = generateToken(user.id);
    order = await createTestOrder({ clientId: user.id });
  });

  beforeEach(async () => {
    const transaction = await sequelize.transaction();
    try {
      await Payment.destroy({ where: {}, transaction });
      await Billing.destroy({ where: {}, transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /billing', () => {
    it('should retrieve all billing records', async () => {
      await Billing.create({
        orderId: order.id,
        totalAmount: 5000,
        status: 'sent',
        invoiceNumber: 'INV-001',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const response = await request(app)
        .get('/billing')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter billing by status', async () => {
      await Billing.create({
        orderId: order.id,
        totalAmount: 5000,
        status: 'sent',
        invoiceNumber: 'INV-001',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const response = await request(app)
        .get('/billing?status=sent')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(b => b.status === 'sent')).toBe(true);
    });
  });

  describe('POST /billing', () => {
    it('should create a new billing record', async () => {
      const response = await request(app)
        .post('/billing')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderId: order.id,
          totalAmount: 5000,
          invoiceNumber: 'INV-TEST-001',
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe('sent'); // Default status
    });

    it('should fail without required fields', async () => {
      const response = await request(app)
        .post('/billing')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderId: order.id
          // missing totalAmount and other required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /billing/:id', () => {
    it('should retrieve a billing record by id', async () => {
      const billing = await Billing.create({
        orderId: order.id,
        totalAmount: 5000,
        status: 'sent',
        invoiceNumber: 'INV-001',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const response = await request(app)
        .get(`/billing/${billing.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(billing.id);
    });
  });

  describe('PUT /billing/:id', () => {
    it('should update a billing record status', async () => {
      const billing = await Billing.create({
        orderId: order.id,
        totalAmount: 5000,
        status: 'sent',
        invoiceNumber: 'INV-001',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const response = await request(app)
        .put(`/billing/${billing.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'paid',
          paidDate: new Date()
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('paid');
    });
  });

  describe('POST /billing/:id/payment', () => {
    it('should record a payment for billing', async () => {
      const billing = await Billing.create({
        orderId: order.id,
        totalAmount: 5000,
        status: 'sent',
        invoiceNumber: 'INV-001',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const response = await request(app)
        .post(`/billing/${billing.id}/payment`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 5000,
          paymentMethod: 'bank_transfer',
          referenceNumber: 'TRANSFER-001'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });
  });

  describe('DELETE /billing/:id', () => {
    it('should delete a billing record', async () => {
      const billing = await Billing.create({
        orderId: order.id,
        totalAmount: 5000,
        status: 'sent',
        invoiceNumber: 'INV-001',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      const response = await request(app)
        .delete(`/billing/${billing.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deletedBilling = await Billing.findByPk(billing.id);
      expect(deletedBilling).toBeNull();
    });
  });
});
