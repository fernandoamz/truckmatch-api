// controllers/trackingController.js
const { TripRoute, Tracking, Unit } = require('../models');
const { Op } = require('sequelize');

// Update location (driver sends GPS)
const updateLocation = async (data, userId) => {
  const { tripRouteId, latitude, longitude, address, speed, accuracy } = data;
  
  const tripRoute = await TripRoute.findByPk(tripRouteId);
  if (!tripRoute) throw new Error('Trip route not found');
  
  const tracking = await Tracking.create({
    tripRouteId,
    latitude,
    longitude,
    address,
    speed: speed || 0,
    accuracy: accuracy || 0,
    userId
  });
  
  return tracking;
};

// Get current location of trip
const getCurrentLocation = async (tripRouteId) => {
  const tracking = await Tracking.findOne({
    where: { tripRouteId },
    order: [['createdAt', 'DESC']],
    limit: 1
  });
  
  if (!tracking) throw new Error('No location found for this trip');
  
  return tracking;
};

// Get trip breadcrumbs (all locations)
const getTripBreadcrumbs = async (tripRouteId, limit = 100) => {
  const locations = await Tracking.findAll({
    where: { tripRouteId },
    order: [['createdAt', 'ASC']],
    limit: parseInt(limit)
  });
  
  return locations;
};

// Get current location of unit
const getUnitCurrentLocation = async (unitId) => {
  // Get active trip for this unit
  const tripRoute = await TripRoute.findOne({
    where: {
      unitId,
      status: { [Op.in]: ['assigned', 'in_progress'] }
    }
  });
  
  if (!tripRoute) throw new Error('No active trip for this unit');
  
  const tracking = await Tracking.findOne({
    where: { tripRouteId: tripRoute.id },
    order: [['createdAt', 'DESC']],
    limit: 1
  });
  
  return tracking;
};

module.exports = {
  updateLocation,
  getCurrentLocation,
  getTripBreadcrumbs,
  getUnitCurrentLocation
};
