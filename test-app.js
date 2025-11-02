// test-app.js - Archivo temporal para debuggear el problema
const express = require('express');
const cors = require('cors');
const responseHandler = require('./middleware/responseHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(responseHandler);

// Probar rutas una por una
console.log('Testing auth routes...');
try {
  const authRoutes = require('./routes/auth');
  app.use('/auth', authRoutes);
  console.log('✓ Auth routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading auth routes:', error.message);
}

console.log('Testing driver routes...');
try {
  const driverRoutes = require('./routes/drivers');
  app.use('/api/drivers', driverRoutes);
  console.log('✓ Driver routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading driver routes:', error.message);
}

console.log('Testing unit routes...');
try {
  const unitRoutes = require('./routes/units');
  app.use('/api/units', unitRoutes);
  console.log('✓ Unit routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading unit routes:', error.message);
}

console.log('Testing document routes...');
try {
  const documentRoutes = require('./routes/documents');
  app.use('/api/documents', documentRoutes);
  console.log('✓ Document routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading document routes:', error.message);
}

console.log('Testing order routes...');
try {
  const orderRoutes = require('./routes/orders');
  app.use('/api/orders', orderRoutes);  
  console.log('✓ Order routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading order routes:', error.message);
}

console.log('Testing assignment routes...');
try {
  const assignmentRoutes = require('./routes/assignments');
  app.use('/api/assignments', assignmentRoutes);
  console.log('✓ Assignment routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading assignment routes:', error.message);
}

app.get('/', (req, res) => {
  res.json({ message: 'Test server running' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
});