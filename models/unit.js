const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./user');

const Unit = sequelize.define('Unit', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  plateNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  model: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

Unit.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Unit, { foreignKey: 'userId' });

module.exports = Unit;
