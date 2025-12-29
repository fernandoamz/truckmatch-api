// tests/routes/auth.test.js
const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const authRoutes = require('../../routes/auth');
const { User, sequelize } = require('../../models');
const { createTestUser, cleanupTestData, generateToken } = require('../helpers');
const responseHandler = require('../../middleware/responseHandler');
const errorHandler = require('../../middleware/errorHandler');

// Create a test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(responseHandler);
  app.use('/auth', authRoutes);
  app.use(errorHandler);
  return app;
};

describe('Auth Routes', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    // Clean up before each test
    const transaction = await sequelize.transaction();
    try {
      await User.destroy({ where: {}, transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('POST /auth/register', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'newuser@test.com',
          password: 'SecurePass123!',
          role: 'employer'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email', 'newuser@test.com');
      expect(response.body.data).toHaveProperty('role', 'employer');
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'SecurePass123!',
          role: 'employer'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail if user already exists', async () => {
      // Create a user first
      await createTestUser({ email: 'existing@test.com' });

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'existing@test.com',
          password: 'SecurePass123!',
          role: 'employer'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail without required fields', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'user@test.com'
          // missing password and role
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await createTestUser({
        email: 'user@test.com',
        passwordHash: await bcrypt.hash('password123', 10)
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'user@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
    });

    it('should fail with wrong password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'user@test.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail if user does not exist', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail without required fields', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'user@test.com'
          // missing password
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const user = await createTestUser();
      const token = generateToken(user.id);

      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /auth/verify', () => {
    it('should verify valid token', async () => {
      const user = await createTestUser();
      const token = generateToken(user.id);

      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/auth/verify');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
