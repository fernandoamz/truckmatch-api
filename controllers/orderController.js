// controllers/orderController.js
const { Order, User, Assignment } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// POST /orders
const createOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 400, errors.array());
    }

    const {
      origin,
      destination,
      cargoDescription,
      cargoWeight,
      cargoWeightUnit,
      requirements,
      pickupDate,
      deliveryDate,
      rate,
      currency,
      notes
    } = req.body;

    // Validate pickup and delivery dates
    if (pickupDate && deliveryDate) {
      if (new Date(pickupDate) >= new Date(deliveryDate)) {
        return res.error('Pickup date must be before delivery date', 400);
      }
    }

    const order = await Order.create({
      origin,
      destination,
      cargoDescription,
      cargoWeight,
      cargoWeightUnit: cargoWeightUnit || 'tons',
      requirements: requirements || [],
      pickupDate,
      deliveryDate,
      rate,
      currency: currency || 'USD',
      clientId: req.user?.id || null,
      notes,
      status: 'pending'
    });

    res.success(order, 'Order created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// GET /orders
const getOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status, clientId, dateFrom, dateTo } = req.query;

    let whereClause = {};

    // Filter by status
    if (status && ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      whereClause.status = status;
    }

    // Filter by client
    if (clientId) {
      whereClause.clientId = clientId;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      whereClause.pickupDate = {};
      if (dateFrom) {
        whereClause.pickupDate[Op.gte] = new Date(dateFrom);
      }
      if (dateTo) {
        whereClause.pickupDate[Op.lte] = new Date(dateTo);
      }
    }

    const { count, rows } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'email', 'role'],
          required: false
        },
        {
          model: Assignment,
          as: 'assignment',
          required: false,
          include: [
            {
              model: require('../models').Driver,
              as: 'driver',
              attributes: ['id', 'name', 'license'],
              required: false
            },
            {
              model: require('../models').Unit,
              as: 'unit',
              attributes: ['id', 'plateNumber', 'model', 'type'],
              required: false
            }
          ]
        }
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

// GET /orders/:id
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'email', 'role'],
          required: false
        },
        {
          model: Assignment,
          as: 'assignment',
          required: false,
          include: [
            {
              model: require('../models').Driver,
              as: 'driver',
              required: false
            },
            {
              model: require('../models').Unit,
              as: 'unit',
              required: false
            }
          ]
        }
      ]
    });

    if (!order) {
      return res.error('Order not found', 404);
    }

    res.success(order, 'Order retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// PATCH /orders/:id
const updateOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const updateData = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      return res.error('Order not found', 404);
    }

    // Prevent updating completed or cancelled orders
    if (order.status === 'completed' || order.status === 'cancelled') {
      return res.error('Cannot update completed or cancelled orders', 400);
    }

    // Validate date changes
    if (updateData.pickupDate && updateData.deliveryDate) {
      if (new Date(updateData.pickupDate) >= new Date(updateData.deliveryDate)) {
        return res.error('Pickup date must be before delivery date', 400);
      }
    }

    // If updating to completed status, validate assignment exists
    if (updateData.status === 'completed') {
      const assignment = await Assignment.findOne({ where: { orderId: id } });
      if (!assignment) {
        return res.error('Cannot complete order without assignment', 400);
      }
      
      // Update assignment status as well
      await assignment.update({ 
        status: 'completed',
        completedAt: new Date()
      });
    }

    await order.update(updateData);

    const updatedOrder = await Order.findByPk(id, {
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'email', 'role'],
          required: false
        },
        {
          model: Assignment,
          as: 'assignment',
          required: false,
          include: [
            {
              model: require('../models').Driver,
              as: 'driver',
              required: false
            },
            {
              model: require('../models').Unit,
              as: 'unit',
              required: false
            }
          ]
        }
      ]
    });

    res.success(updatedOrder, 'Order updated successfully');
  } catch (error) {
    next(error);
  }
};

// DELETE /orders/:id
const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id);
    if (!order) {
      return res.error('Order not found', 404);
    }

    // Prevent deleting orders with active assignments
    if (order.status === 'assigned' || order.status === 'in_progress') {
      return res.error('Cannot delete order with active assignments', 400);
    }

    await order.destroy();
    res.success(null, 'Order deleted successfully');
  } catch (error) {
    next(error);
  }
};

// GET /orders/statistics
const getOrderStatistics = async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    
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

    const [
      totalOrders,
      pendingOrders,
      assignedOrders,
      completedOrders,
      cancelledOrders
    ] = await Promise.all([
      Order.count({ where: whereClause }),
      Order.count({ where: { ...whereClause, status: 'pending' } }),
      Order.count({ where: { ...whereClause, status: 'assigned' } }),
      Order.count({ where: { ...whereClause, status: 'completed' } }),
      Order.count({ where: { ...whereClause, status: 'cancelled' } })
    ]);

    const statistics = {
      totalOrders,
      statusBreakdown: {
        pending: pendingOrders,
        assigned: assignedOrders,
        completed: completedOrders,
        cancelled: cancelledOrders
      },
      completionRate: totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(2) : 0
    };

    res.success(statistics, 'Order statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  getOrderStatistics
};