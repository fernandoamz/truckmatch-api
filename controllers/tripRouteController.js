// controllers/tripRouteController.js
const { TripRoute, TripRouteEvent, Driver, Unit, Order, Assignment } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const sequelize = require('../config/db');

// Status transition validation matrix
const VALID_TRANSITIONS = {
  created: ['assigned', 'cancelled'],
  assigned: ['in_progress', 'cancelled'],
  in_progress: ['arrived_at_destination', 'cancelled'],
  arrived_at_destination: ['completed', 'in_progress', 'cancelled'],
  completed: [], // Terminal state
  cancelled: [] // Terminal state
};

// Helper: Validate status transition
const isValidTransition = (fromStatus, toStatus) => {
  if (fromStatus === toStatus) return false;
  return VALID_TRANSITIONS[fromStatus]?.includes(toStatus) || false;
};

// Helper: Check if driver has active trip
const checkDriverAvailability = async (driverId, excludeTripId = null, transaction = null) => {
  const whereClause = {
    driverId,
    status: {
      [Op.in]: ['assigned', 'in_progress', 'arrived_at_destination']
    }
  };
  
  if (excludeTripId) {
    whereClause.id = { [Op.ne]: excludeTripId };
  }

  const activeTrip = await TripRoute.findOne({
    where: whereClause,
    transaction
  });

  return !activeTrip; // true if available
};

// Helper: Check if unit has active trip
const checkUnitAvailability = async (unitId, excludeTripId = null, transaction = null) => {
  const whereClause = {
    unitId,
    status: {
      [Op.in]: ['assigned', 'in_progress', 'arrived_at_destination']
    }
  };
  
  if (excludeTripId) {
    whereClause.id = { [Op.ne]: excludeTripId };
  }

  const activeTrip = await TripRoute.findOne({
    where: whereClause,
    transaction
  });

  return !activeTrip; // true if available
};

// Helper: Create event log
const createEventLog = async (tripRouteId, eventData, transaction = null) => {
  return await TripRouteEvent.create({
    tripRouteId,
    timestamp: new Date(),
    ...eventData
  }, { transaction });
};

// POST /api/trip-routes
const createTripRoute = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return res.error('Validation failed', 400, errors.array());
    }

    const {
      origin,
      destination,
      estimatedDistanceKm,
      estimatedDurationHours,
      driverId,
      unitId,
      orderId,
      metadata,
      notes
    } = req.body;

    // Validate driver exists and is active
    const driver = await Driver.findByPk(driverId, { transaction });
    if (!driver) {
      await transaction.rollback();
      return res.error('Driver not found', 404);
    }
    if (driver.status !== 'active') {
      await transaction.rollback();
      return res.error('Driver is not active', 400);
    }

    // Validate unit exists and is active
    const unit = await Unit.findByPk(unitId, { transaction });
    if (!unit) {
      await transaction.rollback();
      return res.error('Unit not found', 404);
    }
    if (unit.status !== 'active') {
      await transaction.rollback();
      return res.error('Unit is not active', 400);
    }

    // Validate order exists if provided
    if (orderId) {
      const order = await Order.findByPk(orderId, { transaction });
      if (!order) {
        await transaction.rollback();
        return res.error('Order not found', 404);
      }
      // Check if order already has an active trip
      const existingTrip = await TripRoute.findOne({
        where: {
          orderId,
          status: {
            [Op.in]: ['created', 'assigned', 'in_progress', 'arrived_at_destination']
          }
        },
        transaction
      });
      if (existingTrip) {
        await transaction.rollback();
        return res.error('Order already has an active trip', 400);
      }
    }

    // Check driver availability
    const driverAvailable = await checkDriverAvailability(driverId, null, transaction);
    if (!driverAvailable) {
      await transaction.rollback();
      return res.error('Driver already has an active trip', 400);
    }

    // Check unit availability
    const unitAvailable = await checkUnitAvailability(unitId, null, transaction);
    if (!unitAvailable) {
      await transaction.rollback();
      return res.error('Unit already assigned to another active trip', 400);
    }

    // Create trip route
    const tripRoute = await TripRoute.create({
      origin,
      destination,
      estimatedDistanceKm,
      estimatedDurationHours,
      driverId,
      unitId,
      orderId: orderId || null,
      metadata: metadata || {},
      notes,
      status: 'created'
    }, { transaction });

    // Create initial event
    await createEventLog(tripRoute.id, {
      eventType: 'status_change',
      fromStatus: null,
      toStatus: 'created',
      description: 'Trip route created',
      performedBy: req.user?.id || null,
      performedByRole: req.user?.role || 'system'
    }, transaction);

    // Update order status if linked
    if (orderId) {
      await Order.update(
        { status: 'assigned' },
        { where: { id: orderId }, transaction }
      );
    }

    await transaction.commit();

    const createdTrip = await TripRoute.findByPk(tripRoute.id, {
      include: [
        { model: Driver, as: 'driver', attributes: ['id', 'name', 'license', 'phone'] },
        { model: Unit, as: 'unit', attributes: ['id', 'plateNumber', 'model', 'type'] },
        { model: Order, as: 'order', attributes: ['id', 'orderNumber', 'status'], required: false }
      ]
    });

    res.success(createdTrip, 'Trip route created successfully', 201);
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// GET /api/trip-routes
const getTripRoutes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status, driverId, unitId, orderId, dateFrom, dateTo } = req.query;

    let whereClause = {};

    if (status && ['created', 'assigned', 'in_progress', 'arrived_at_destination', 'completed', 'cancelled'].includes(status)) {
      whereClause.status = status;
    }

    if (driverId) {
      whereClause.driverId = driverId;
    }

    if (unitId) {
      whereClause.unitId = unitId;
    }

    if (orderId) {
      whereClause.orderId = orderId;
    }

    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) {
        whereClause.createdAt[Op.gte] = new Date(dateFrom);
      }
      if (dateTo) {
        whereClause.createdAt[Op.lte] = new Date(dateTo);
      }
    }

    const { count, rows } = await TripRoute.findAndCountAll({
      where: whereClause,
      include: [
        { model: Driver, as: 'driver', attributes: ['id', 'name', 'license', 'phone'] },
        { model: Unit, as: 'unit', attributes: ['id', 'plateNumber', 'model', 'type'] },
        { model: Order, as: 'order', attributes: ['id', 'orderNumber', 'status'], required: false }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.paginated(rows, { page, limit, total: count });
  } catch (error) {
    next(error);
  }
};

// GET /api/trip-routes/:id
const getTripRouteById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tripRoute = await TripRoute.findByPk(id, {
      include: [
        { model: Driver, as: 'driver' },
        { model: Unit, as: 'unit' },
        { model: Order, as: 'order', required: false }
      ]
    });

    if (!tripRoute) {
      return res.error('Trip route not found', 404);
    }

    res.success(tripRoute, 'Trip route retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// PATCH /api/trip-routes/:id
const updateTripRoute = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return res.error('Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const updateData = req.body;

    const tripRoute = await TripRoute.findByPk(id, { transaction });
    if (!tripRoute) {
      await transaction.rollback();
      return res.error('Trip route not found', 404);
    }

    // Prevent updating completed or cancelled trips
    if (tripRoute.status === 'completed' || tripRoute.status === 'cancelled') {
      await transaction.rollback();
      return res.error('Cannot update completed or cancelled trips', 400);
    }

    // If changing driver, validate availability
    if (updateData.driverId && updateData.driverId !== tripRoute.driverId) {
      const driverAvailable = await checkDriverAvailability(updateData.driverId, id, transaction);
      if (!driverAvailable) {
        await transaction.rollback();
        return res.error('Driver already has an active trip', 400);
      }

      // Log reassignment
      await createEventLog(id, {
        eventType: 'reassignment',
        description: `Driver changed from ${tripRoute.driverId} to ${updateData.driverId}`,
        metadata: { oldDriverId: tripRoute.driverId, newDriverId: updateData.driverId },
        performedBy: req.user?.id || null,
        performedByRole: req.user?.role || 'system'
      }, transaction);
    }

    // If changing unit, validate availability
    if (updateData.unitId && updateData.unitId !== tripRoute.unitId) {
      const unitAvailable = await checkUnitAvailability(updateData.unitId, id, transaction);
      if (!unitAvailable) {
        await transaction.rollback();
        return res.error('Unit already assigned to another active trip', 400);
      }

      // Log reassignment
      await createEventLog(id, {
        eventType: 'reassignment',
        description: `Unit changed from ${tripRoute.unitId} to ${updateData.unitId}`,
        metadata: { oldUnitId: tripRoute.unitId, newUnitId: updateData.unitId },
        performedBy: req.user?.id || null,
        performedByRole: req.user?.role || 'system'
      }, transaction);
    }

    // Update trip route
    await tripRoute.update(updateData, { transaction });

    // Log metadata update if changed
    if (updateData.metadata) {
      await createEventLog(id, {
        eventType: 'metadata_updated',
        description: 'Trip metadata updated',
        metadata: updateData.metadata,
        performedBy: req.user?.id || null,
        performedByRole: req.user?.role || 'system'
      }, transaction);
    }

    await transaction.commit();

    const updatedTrip = await TripRoute.findByPk(id, {
      include: [
        { model: Driver, as: 'driver' },
        { model: Unit, as: 'unit' },
        { model: Order, as: 'order', required: false }
      ]
    });

    res.success(updatedTrip, 'Trip route updated successfully');
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// POST /api/trip-routes/:id/status
const updateTripStatus = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { status, location, notes } = req.body;

    if (!status) {
      await transaction.rollback();
      return res.error('Status is required', 400);
    }

    const tripRoute = await TripRoute.findByPk(id, { transaction });
    if (!tripRoute) {
      await transaction.rollback();
      return res.error('Trip route not found', 404);
    }

    const fromStatus = tripRoute.status;

    // Validate transition
    if (!isValidTransition(fromStatus, status)) {
      await transaction.rollback();
      return res.error(
        `Invalid status transition from '${fromStatus}' to '${status}'`,
        400,
        { allowedTransitions: VALID_TRANSITIONS[fromStatus] }
      );
    }

    // Update timestamps based on status
    const updateFields = { status };
    
    if (status === 'in_progress' && !tripRoute.startedAt) {
      updateFields.startedAt = new Date();
    }
    
    if (status === 'arrived_at_destination' && !tripRoute.arrivedAt) {
      updateFields.arrivedAt = new Date();
    }
    
    if (status === 'completed') {
      updateFields.completedAt = new Date();
      
      // Calculate actual duration if started
      if (tripRoute.startedAt) {
        const durationMs = new Date() - new Date(tripRoute.startedAt);
        updateFields.actualDurationHours = (durationMs / (1000 * 60 * 60)).toFixed(2);
      }

      // Update linked order status
      if (tripRoute.orderId) {
        await Order.update(
          { status: 'completed' },
          { where: { id: tripRoute.orderId }, transaction }
        );
      }
    }
    
    if (status === 'cancelled') {
      updateFields.cancelledAt = new Date();
      updateFields.cancellationReason = notes || 'No reason provided';
    }

    // Update trip route
    await tripRoute.update(updateFields, { transaction });

    // Create status change event
    await createEventLog(id, {
      eventType: 'status_change',
      fromStatus,
      toStatus: status,
      location: location || null,
      description: notes || `Status changed from ${fromStatus} to ${status}`,
      performedBy: req.user?.id || null,
      performedByRole: req.user?.role || 'driver'
    }, transaction);

    await transaction.commit();

    const updatedTrip = await TripRoute.findByPk(id, {
      include: [
        { model: Driver, as: 'driver' },
        { model: Unit, as: 'unit' },
        { model: Order, as: 'order', required: false }
      ]
    });

    res.success(updatedTrip, 'Trip status updated successfully');
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// GET /api/trip-routes/:id/history
const getTripHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tripRoute = await TripRoute.findByPk(id);
    if (!tripRoute) {
      return res.error('Trip route not found', 404);
    }

    const events = await TripRouteEvent.findAll({
      where: { tripRouteId: id },
      order: [['timestamp', 'ASC']]
    });

    res.success(events, 'Trip history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/trip-routes/:id
const deleteTripRoute = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tripRoute = await TripRoute.findByPk(id);
    if (!tripRoute) {
      return res.error('Trip route not found', 404);
    }

    // Only allow deletion of created, cancelled, or completed trips
    if (!['created', 'cancelled', 'completed'].includes(tripRoute.status)) {
      return res.error('Cannot delete active trips', 400);
    }

    await tripRoute.destroy();
    res.success(null, 'Trip route deleted successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/trip-routes/statistics
const getTripStatistics = async (req, res, next) => {
  try {
    const { dateFrom, dateTo, driverId } = req.query;
    
    let whereClause = {};
    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) {
        whereClause.createdAt[Op.gte] = new Date(dateFrom);
      }
      if (dateTo) {
        whereClause.createdAt[Op.lte] = new Date(dateTo);
      }
    }

    if (driverId) {
      whereClause.driverId = driverId;
    }

    const [
      totalTrips,
      createdTrips,
      assignedTrips,
      inProgressTrips,
      completedTrips,
      cancelledTrips,
      totalDistanceResult,
      avgDurationResult
    ] = await Promise.all([
      TripRoute.count({ where: whereClause }),
      TripRoute.count({ where: { ...whereClause, status: 'created' } }),
      TripRoute.count({ where: { ...whereClause, status: 'assigned' } }),
      TripRoute.count({ where: { ...whereClause, status: 'in_progress' } }),
      TripRoute.count({ where: { ...whereClause, status: 'completed' } }),
      TripRoute.count({ where: { ...whereClause, status: 'cancelled' } }),
      TripRoute.sum('actualDistanceKm', { where: { ...whereClause, status: 'completed' } }),
      TripRoute.findAll({
        where: { ...whereClause, status: 'completed', actualDurationHours: { [Op.ne]: null } },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('actualDurationHours')), 'avgDuration']
        ],
        raw: true
      })
    ]);

    const statistics = {
      totalTrips,
      statusBreakdown: {
        created: createdTrips,
        assigned: assignedTrips,
        inProgress: inProgressTrips,
        completed: completedTrips,
        cancelled: cancelledTrips
      },
      completionRate: totalTrips > 0 ? ((completedTrips / totalTrips) * 100).toFixed(2) : 0,
      totalDistanceTraveled: totalDistanceResult || 0,
      averageDuration: avgDurationResult[0]?.avgDuration || 0
    };

    res.success(statistics, 'Trip statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTripRoute,
  getTripRoutes,
  getTripRouteById,
  updateTripRoute,
  updateTripStatus,
  getTripHistory,
  deleteTripRoute,
  getTripStatistics
};
