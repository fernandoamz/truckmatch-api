// controllers/fleetController.js
const { Unit, FleetMaintenance } = require('../models');
const { Op } = require('sequelize');

// Register maintenance
const registerMaintenance = async (data) => {
  const { unitId, maintenanceType, description, cost, date, nextMaintenanceDate, notes } = data;
  
  const unit = await Unit.findByPk(unitId);
  if (!unit) throw new Error('Unit not found');
  
  const maintenance = await FleetMaintenance.create({
    unitId,
    type: maintenanceType,
    description,
    cost,
    date: new Date(date),
    nextMaintenanceDate: nextMaintenanceDate ? new Date(nextMaintenanceDate) : null,
    notes
  });
  
  return maintenance;
};

// Get maintenance history
const getMaintenanceHistory = async (unitId, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;
  
  const unit = await Unit.findByPk(unitId);
  if (!unit) throw new Error('Unit not found');
  
  const { count, rows } = await FleetMaintenance.findAndCountAll({
    where: { unitId },
    order: [['date', 'DESC']],
    offset,
    limit: parseInt(limit)
  });
  
  return {
    unitId,
    plateNumber: unit.plateNumber,
    data: rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  };
};

// Log fuel consumption
const logFuelConsumption = async (data) => {
  const { unitId, liters, cost, date, odometer, location, notes } = data;
  
  const unit = await Unit.findByPk(unitId);
  if (!unit) throw new Error('Unit not found');
  
  // For now, store as a special maintenance record
  const fuelLog = await FleetMaintenance.create({
    unitId,
    type: 'fuel_log',
    description: `Fuel log: ${liters}L at ${location || 'unknown'}`,
    cost,
    date: new Date(date),
    metadata: {
      liters,
      odometer,
      location,
      pricePerLiter: (cost / liters).toFixed(2)
    },
    notes
  });
  
  return fuelLog;
};

// Get fuel analytics
const getFuelAnalytics = async (filters = {}) => {
  const { unitId, dateFrom, dateTo, groupBy = 'monthly' } = filters;
  
  const where = { type: 'fuel_log' };
  if (unitId) where.unitId = unitId;
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date[Op.gte] = new Date(dateFrom);
    if (dateTo) where.date[Op.lte] = new Date(dateTo);
  }
  
  const fuelLogs = await FleetMaintenance.findAll({
    where,
    order: [['date', 'ASC']]
  });
  
  // Calculate analytics
  const totalLiters = fuelLogs.reduce((sum, log) => {
    const liters = log.metadata?.liters || 0;
    return sum + liters;
  }, 0);
  
  const totalCost = fuelLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
  const avgPricePerLiter = totalLiters > 0 ? (totalCost / totalLiters).toFixed(2) : 0;
  
  return {
    period: { from: dateFrom, to: dateTo },
    unitId: unitId || 'all',
    totalRefuelings: fuelLogs.length,
    totalLiters: totalLiters.toFixed(2),
    totalCost: totalCost.toFixed(2),
    avgPricePerLiter,
    recentLogs: fuelLogs.slice(-5)
  };
};

module.exports = {
  registerMaintenance,
  getMaintenanceHistory,
  logFuelConsumption,
  getFuelAnalytics
};
