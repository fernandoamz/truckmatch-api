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

// GraphQL endpoint (backwards compatibility)
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

// 404 handler
app.use('*', (req, res) => {
  res.error(`Route ${req.originalUrl} not found`, 404);
});

// Error handling middleware (must be last)
app.use(errorHandler);

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
