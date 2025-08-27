const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { graphqlHTTP } = require('express-graphql');
const authRoutes = require('./routes/auth');
const sequelize = require('./config/db');
const authenticateToken = require('./middleware/auth');
const { attachUserFromAuthHeader } = require('./middleware/auth');
const graphqlSchema = require('./graphql/schema');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);

app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'truckmatch-api' });
});

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

const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => {
    console.log('Conectado a PostgreSQL');
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
  })
  .catch(err => {
    console.error('Error conectando a la base de datos:', err);
  });
