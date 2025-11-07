const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
require('dotenv').config();

// Import middleware
const { attachUserFromAuthHeader } = require('./middleware/auth');
const responseHandler = require('./middleware/responseHandler');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const driverRoutes = require('./routes/drivers');
const unitRoutes = require('./routes/units');
const documentRoutes = require('./routes/documents');
const orderRoutes = require('./routes/orders');
const assignmentRoutes = require('./routes/assignments');

// Import database
const { sequelize, syncModels } = require('./models');

// GraphQL (keep for backwards compatibility)
const { graphqlHTTP } = require('express-graphql');
const graphqlSchema = require('./graphql/schema');

// Import document expiration checker
const { checkExpiredDocuments } = require('./controllers/documentController');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Response handler middleware
app.use(responseHandler);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger Documentation
try {
  console.log('Registering Swagger UI at /api-docs');
  // Debug: check swagger spec paths for invalid ':' parameters
  try {
    if (swaggerSpecs && swaggerSpecs.paths) {
      const bad = Object.keys(swaggerSpecs.paths).filter(p => p.includes(':'));
      if (bad.length) {
        console.error('Swagger spec contains path keys with ":" ->', bad);
      } else {
        console.log('Swagger spec path keys OK (no ":" found) - total paths:', Object.keys(swaggerSpecs.paths).length);
      }
    }
  } catch (e) {
    console.error('Error while inspecting swaggerSpecs.paths:', e && e.stack ? e.stack : e);
  }
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'TruckMatch API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true
  }
  }));
} catch (err) {
  console.error('Error while registering Swagger UI:', err && err.stack ? err.stack : err);
  throw err;
}

// Health check endpoint
app.get('/', (_req, res) => {
  res.success({ 
    service: 'truckmatch-api', 
    version: '1.0.0',
    documentation: '/api-docs'
  }, 'Service is running');
});

app.get('/health', (_req, res) => {
  res.success({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }, 'Health check passed');
});

// API Routes
app.use('/auth', authRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/assignments', assignmentRoutes);
// API Routes (wrap mounts to help identify which mount triggers path-to-regexp)
try {
  console.log('Mounting /auth routes');
  app.use('/auth', authRoutes);
  console.log('Mounted /auth OK');
} catch (e) {
  console.error('Error mounting /auth:', e && e.stack ? e.stack : e);
  throw e;
}

try {
  console.log('Mounting /api/drivers routes');
  app.use('/api/drivers', driverRoutes);
  console.log('Mounted /api/drivers OK');
} catch (e) {
  console.error('Error mounting /api/drivers:', e && e.stack ? e.stack : e);
  throw e;
}

try {
  console.log('Mounting /api/units routes');
  app.use('/api/units', unitRoutes);
  console.log('Mounted /api/units OK');
} catch (e) {
  console.error('Error mounting /api/units:', e && e.stack ? e.stack : e);
  throw e;
}

try {
  console.log('Mounting /api/documents routes');
  app.use('/api/documents', documentRoutes);
  console.log('Mounted /api/documents OK');
} catch (e) {
  console.error('Error mounting /api/documents:', e && e.stack ? e.stack : e);
  throw e;
}

try {
  console.log('Mounting /api/orders routes');
  app.use('/api/orders', orderRoutes);
  console.log('Mounted /api/orders OK');
} catch (e) {
  console.error('Error mounting /api/orders:', e && e.stack ? e.stack : e);
  throw e;
}

try {
  console.log('Mounting /api/assignments routes');
  app.use('/api/assignments', assignmentRoutes);
  console.log('Mounted /api/assignments OK');
} catch (e) {
  console.error('Error mounting /api/assignments:', e && e.stack ? e.stack : e);
  throw e;
}

// GraphQL endpoint (backwards compatibility)
try {
  console.log('Mounting /graphql endpoint');
  app.use(
    '/graphql',
    attachUserFromAuthHeader,
    graphqlHTTP((req) => ({
      schema: graphqlSchema,
      graphiql:
        process.env.NODE_ENV !== 'production'
          ? { headerEditorEnabled: true }
          : false,
      context: { user: req.user || null },
    }))
  );
  console.log('Mounted /graphql OK');
} catch (e) {
  console.error('Error mounting /graphql:', e && e.stack ? e.stack : e);
  throw e;
}

// 404 handler
try {
  console.log('Registering 404 handler (catch-all)');
  // Use the no-path form of app.use to avoid any path-to-regexp parsing issues
  app.use((req, res) => {
    res.error(`Route ${req.originalUrl} not found`, 404);
  });
  console.log('404 handler registered');
} catch (e) {
  console.error('Error registering 404 handler:', e && e.stack ? e.stack : e);
  throw e;
}

// Error handling middleware (must be last)
try {
  console.log('Registering error handler middleware');
  app.use(errorHandler);
  console.log('Error handler middleware registered');
} catch (e) {
  console.error('Error registering error handler:', e && e.stack ? e.stack : e);
  throw e;
}

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Connected to PostgreSQL database');

    // Sync models (create tables if they don't exist)
    await syncModels(false); // Set to true to force recreate tables
    console.log('✓ Database models synchronized');

    // Start periodic document expiration check
    setInterval(checkExpiredDocuments, 24 * 60 * 60 * 1000); // Check daily
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 TruckMatch API server running on port ${PORT}`);
      console.log(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
      console.log(`🔗 REST API base: http://localhost:${PORT}/api`);
      console.log(`📁 File uploads: http://localhost:${PORT}/uploads`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
