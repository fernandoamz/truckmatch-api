const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: {
    useUTC: false,
  },
  timezone: '+00:00',
});

module.exports = sequelize;
