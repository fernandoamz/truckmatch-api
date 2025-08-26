const { GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLID, GraphQLNonNull } = require('graphql');
const UserType = require('./types/user');
const UnitType = require('./types/unit');
const { registerUnit } = require('../controllers/unitController');

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    hello: {
      type: GraphQLString,
      resolve: () => 'Hello World! GraphQL está funcionando correctamente.'
    }
    // Se pueden añadir más queries en el futuro
  }
});

const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    registerUnit: {
      type: UnitType,
      args: {
        userId: { type: new GraphQLNonNull(GraphQLID) },
        plateNumber: { type: new GraphQLNonNull(GraphQLString) },
        model: { type: new GraphQLNonNull(GraphQLString) }
      },
      resolve: async (parent, args) => {
        try {
          return await registerUnit(args);
        } catch (error) {
          throw new Error('Error registrando la unidad: ' + error.message);
        }
      }
    }
  }
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation
});
