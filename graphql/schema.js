// graphql/schema.js
const {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLNonNull,
} = require('graphql');

const UnitType = require('./types/unit');
const UserType = require('./types/user');
const Unit = require('../models/unit');
const User = require('../models/user');

// Query pública simple
const RootQuery = new GraphQLObjectType({
  name: 'Query',
  fields: {
    hello: {
      type: GraphQLString,
      resolve: () => 'Hello World! GraphQL está funcionando correctamente.',
    },
    // Ejemplo de "me" por GraphQL (requiere JWT)
    me: {
      type: UserType,
      resolve: async (_parent, _args, context) => {
        if (!context.user) throw new Error('No autenticado');
        const { userId } = context.user;
        const user = await User.findByPk(userId);
        if (!user) throw new Error('Usuario no encontrado');
        return user;
      },
    },
  },
});

// Mutations protegidas
const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    registerUnit: {
      type: UnitType,
      args: {
        plateNumber: { type: new GraphQLNonNull(GraphQLString) },
        model: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: async (_parent, args, context) => {
        if (!context.user) throw new Error('No autenticado');
        const { userId } = context.user;
        const unit = await Unit.create({
          userId,
          plateNumber: args.plateNumber,
          model: args.model,
        });
        return unit;
      },
    },
  },
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation,
});
