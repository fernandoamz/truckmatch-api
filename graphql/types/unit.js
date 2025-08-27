const { GraphQLObjectType, GraphQLID, GraphQLString } = require('graphql');

const UnitType = new GraphQLObjectType({
  name: 'unit',
  fields: () => ({
    id: { type: GraphQLID },
    plateNumber: { type: GraphQLString },
    model: { type: GraphQLString },
    userId: { type: GraphQLID }
  })
});

module.exports = UnitType;
