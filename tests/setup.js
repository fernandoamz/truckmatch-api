// tests/setup.js
require('dotenv').config();

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Mock timers if needed in specific tests
// jest.useFakeTimers();

// Setup test database connection
const { sequelize, syncModels } = require('../models');

// Global setup
beforeAll(async () => {
  try {
    // Sync models without forcing (to avoid dropping in production)
    await syncModels(false);
  } catch (error) {
    console.error('Error syncing models:', error);
  }
});

// Global teardown
afterAll(async () => {
  try {
    if (sequelize) {
      await sequelize.close();
    }
  } catch (error) {
    console.error('Error closing sequelize connection:', error);
  }
});

// Suppress console output during tests (optional)
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  // Optionally suppress logs
  // console.log = jest.fn();
  // console.error = jest.fn();
  // console.warn = jest.fn();
});

afterEach(() => {
  // Restore console methods
  // console.log = originalLog;
  // console.error = originalError;
  // console.warn = originalWarn;
});
