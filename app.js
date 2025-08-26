const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { graphqlHTTP } = require('express-graphql');
const authRoutes = require('./routes/auth');
const sequelize = require('./config/db');
const { verifyTokenFromHeader } = require('./middleware/auth');
const graphqlSchema = require('./graphql/schema');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API Truckmatch funcionando' });
});

// GraphQL endpoint
app.use('/graphql', graphqlHTTP((req) => {
  let user = null;
  try {
    user = verifyTokenFromHeader(req.headers.authorization);
  } catch (err) {
    // Si no se puede verificar el token, 'user' se queda en null
  }

  return {
    schema: graphqlSchema,
    graphiql: true,
    context: { user }
  };
}));

const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => {
    console.log('Conectado a PostgreSQL');
    return sequelize.sync();
  })
  .then(() => {
    app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
  })
  .catch(err => {
    console.error('Error conectando a la base de datos:', err);
  });
