// controllers/reportController.js
const { TripRoute, Driver, Unit, Order, Billing, sequelize } = require('../models');
const { Op } = require('sequelize');

// Dashboard summary
const getDashboardSummary = async (filters = {}) => {
  const { dateFrom, dateTo } = filters;
  
  const where = {};
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
    if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);
  }
  
  const totalTrips = await TripRoute.count({ where });
  const completedTrips = await TripRoute.count({
    where: { ...where, status: 'completed' }
  });
  const inProgressTrips = await TripRoute.count({
    where: { ...where, status: 'in_progress' }
  });
  
  const totalDistance = await TripRoute.sum('actualDistanceKm', {
    where: { ...where, status: 'completed' }
  });
  
  return {
    totalTrips,
    completedTrips,
    inProgressTrips,
    completionRate: totalTrips > 0 ? ((completedTrips / totalTrips) * 100).toFixed(2) : 0,
    totalDistance: totalDistance || 0,
    metrics: {
      activeDrivers: await Driver.count({ where: { status: 'active' } }),
      activeUnits: await Unit.count({ where: { status: 'active' } }),
      pendingOrders: await Order.count({ where: { status: 'pending' } })
    }
  };
};

// Trip reports
const getTripReports = async (filters = {}) => {
  const { dateFrom, dateTo, status, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;
  
  const where = {};
  if (dateFrom || dateTo) {
    where.completedAt = {};
    if (dateFrom) where.completedAt[Op.gte] = new Date(dateFrom);
    if (dateTo) where.completedAt[Op.lte] = new Date(dateTo);
  }
  if (status) where.status = status;
  
  const { count, rows } = await TripRoute.findAndCountAll({
    where,
    include: [
      { model: Driver, attributes: ['id', 'name'] },
      { model: Unit, attributes: ['id', 'plateNumber'] }
    ],
    order: [['completedAt', 'DESC']],
    offset,
    limit: parseInt(limit)
  });
  
  return {
    data: rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  };
};

// Driver performance
const getDriverPerformance = async (filters = {}) => {
  const { dateFrom, dateTo, sortBy = 'trips', limit = 10 } = filters;
  
  const where = {};
  if (dateFrom || dateTo) {
    where.completedAt = {};
    if (dateFrom) where.completedAt[Op.gte] = new Date(dateFrom);
    if (dateTo) where.completedAt[Op.lte] = new Date(dateTo);
  }
  
  let orderBy = [['tripsCompleted', 'DESC']];
  if (sortBy === 'earnings') orderBy = [[sequelize.literal('totalEarnings'), 'DESC']];
  if (sortBy === 'efficiency') orderBy = [[sequelize.literal('avgDurationHours'), 'ASC']];
  
  const drivers = await sequelize.query(`
    SELECT 
      d.id, d.name, d.email,
      COUNT(CASE WHEN tr.status = 'completed' THEN 1 END) as tripsCompleted,
      COALESCE(SUM(CASE WHEN tr.status = 'completed' THEN tr.actualDistanceKm ELSE 0 END), 0) as totalDistance,
      COALESCE(AVG(CASE WHEN tr.status = 'completed' THEN tr.actualDurationHours ELSE 0 END), 0) as avgDurationHours,
      COALESCE(SUM(o.rate), 0) as totalEarnings
    FROM drivers d
    LEFT JOIN "TripRoutes" tr ON d.id = tr."driverId" ${dateFrom || dateTo ? 'AND tr."completedAt" BETWEEN ? AND ?' : ''}
    LEFT JOIN orders o ON tr."orderId" = o.id
    GROUP BY d.id, d.name, d.email
    ORDER BY tripsCompleted DESC
    LIMIT ${parseInt(limit)}
  `, {
    replacements: dateFrom && dateTo ? [new Date(dateFrom), new Date(dateTo)] : [],
    type: sequelize.QueryTypes.SELECT
  });
  
  return drivers;
};

// Unit utilization
const getUnitUtilization = async (filters = {}) => {
  const { dateFrom, dateTo, status } = filters;
  
  const where = {};
  if (status) where.status = status;
  
  const units = await Unit.findAll({
    where,
    attributes: ['id', 'plateNumber', 'status']
  });
  
  const utilization = await Promise.all(
    units.map(async (unit) => {
      const tripWhere = { unitId: unit.id };
      if (dateFrom || dateTo) {
        tripWhere.completedAt = {};
        if (dateFrom) tripWhere.completedAt[Op.gte] = new Date(dateFrom);
        if (dateTo) tripWhere.completedAt[Op.lte] = new Date(dateTo);
      }
      
      const trips = await TripRoute.findAll({
        where: tripWhere,
        attributes: ['actualDistanceKm', 'actualDurationHours', 'status']
      });
      
      const totalDistance = trips.reduce((sum, t) => sum + (t.actualDistanceKm || 0), 0);
      const totalHours = trips.reduce((sum, t) => sum + (t.actualDurationHours || 0), 0);
      
      return {
        unitId: unit.id,
        plateNumber: unit.plateNumber,
        status: unit.status,
        tripsCompleted: trips.length,
        totalDistance,
        totalHours,
        averageDistancePerTrip: trips.length > 0 ? (totalDistance / trips.length).toFixed(2) : 0
      };
    })
  );
  
  return utilization;
};

// Revenue report
const getRevenueReport = async (filters = {}) => {
  const { dateFrom, dateTo, groupBy = 'monthly' } = filters;
  
  let dateFormat = '%Y-%m';
  if (groupBy === 'daily') dateFormat = '%Y-%m-%d';
  if (groupBy === 'weekly') dateFormat = '%Y-W%w';
  
  const revenues = await sequelize.query(`
    SELECT 
      DATE_FORMAT(o."createdAt", '${dateFormat}') as period,
      COUNT(o.id) as totalOrders,
      COALESCE(SUM(o.rate), 0) as totalRevenue,
      COALESCE(AVG(o.rate), 0) as avgRate
    FROM orders o
    WHERE o.status = 'completed' 
      ${dateFrom ? 'AND o."createdAt" >= ?' : ''}
      ${dateTo ? 'AND o."createdAt" <= ?' : ''}
    GROUP BY period
    ORDER BY period DESC
  `, {
    replacements: [
      ...(dateFrom ? [new Date(dateFrom)] : []),
      ...(dateTo ? [new Date(dateTo)] : [])
    ],
    type: sequelize.QueryTypes.SELECT
  });
  
  return revenues;
};

// Export reports
const exportReports = async (reportType, format, filters = {}) => {
  // In a real implementation, you'd generate CSV/Excel/PDF files
  // For now, return a placeholder
  
  return {
    message: `Report exported as ${format}`,
    reportType,
    generatedAt: new Date()
  };
};

module.exports = {
  getDashboardSummary,
  getTripReports,
  getDriverPerformance,
  getUnitUtilization,
  getRevenueReport,
  exportReports
};
