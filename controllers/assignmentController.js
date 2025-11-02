// controllers/assignmentController.js
const { Assignment, Order, Driver, Unit, Document } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// Validation helper function
const validateAssignmentRequirements = async (driverId, unitId) => {
  const validationResults = {
    driverValid: false,
    unitValid: false,
    driverDocuments: [],
    unitDocuments: [],
    errors: []
  };

  // Check driver
  const driver = await Driver.findByPk(driverId, {
    include: [
      {
        model: Document,
        as: 'documents',
        required: false
      }
    ]
  });

  if (!driver) {
    validationResults.errors.push('Driver not found');
    return validationResults;
  }

  if (driver.status !== 'active') {
    validationResults.errors.push('Driver must be active');
  }

  // Check driver license expiration
  if (new Date(driver.licenseExpirationDate) <= new Date()) {
    validationResults.errors.push('Driver license has expired');
  }

  // Check driver documents
  const validDriverDocs = driver.documents.filter(doc => 
    doc.status === 'valid' && 
    (!doc.expirationDate || new Date(doc.expirationDate) > new Date())
  );
  validationResults.driverDocuments = validDriverDocs;

  if (validDriverDocs.length === 0) {
    validationResults.errors.push('Driver has no valid documents');
  } else {
    validationResults.driverValid = true;
  }

  // Check unit
  const unit = await Unit.findByPk(unitId, {
    include: [
      {
        model: Document,
        as: 'documents',
        required: false
      }
    ]
  });

  if (!unit) {
    validationResults.errors.push('Unit not found');
    return validationResults;
  }

  if (unit.status !== 'active' && unit.status !== 'assigned') {
    validationResults.errors.push('Unit must be active or assigned');
  }

  // Check unit documents
  const validUnitDocs = unit.documents.filter(doc => 
    doc.status === 'valid' && 
    (!doc.expirationDate || new Date(doc.expirationDate) > new Date())
  );
  validationResults.unitDocuments = validUnitDocs;

  if (validUnitDocs.length === 0) {
    validationResults.errors.push('Unit has no valid documents');
  } else {
    validationResults.unitValid = true;
  }

  // Check for active assignments
  const activeDriverAssignment = await Assignment.findOne({
    where: {
      driverId,
      status: ['ready', 'started']
    }
  });

  if (activeDriverAssignment) {
    validationResults.errors.push('Driver is already assigned to an active trip');
  }

  const activeUnitAssignment = await Assignment.findOne({
    where: {
      unitId,
      status: ['ready', 'started']
    }
  });

  if (activeUnitAssignment) {
    validationResults.errors.push('Unit is already assigned to an active trip');
  }

  return validationResults;
};

// POST /assignments
const createAssignment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 400, errors.array());
    }

    const { orderId, driverId, unitId, notes } = req.body;

    // Check if order exists and is available
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.error('Order not found', 404);
    }

    if (order.status !== 'pending') {
      return res.error('Order is not available for assignment', 400);
    }

    // Check if order already has an assignment
    const existingAssignment = await Assignment.findOne({ where: { orderId } });
    if (existingAssignment) {
      return res.error('Order already has an assignment', 400);
    }

    // Validate assignment requirements
    const validation = await validateAssignmentRequirements(driverId, unitId);
    
    if (validation.errors.length > 0) {
      return res.error('Assignment validation failed', 400, validation.errors);
    }

    // Create assignment
    const assignment = await Assignment.create({
      orderId,
      driverId,
      unitId,
      notes,
      status: validation.driverValid && validation.unitValid ? 'ready' : 'pending',
      validationResults: validation
    });

    // Update order status
    await order.update({ status: 'assigned' });

    // Update unit status
    await Unit.findByPk(unitId).then(unit => unit.update({ status: 'assigned' }));

    const fullAssignment = await Assignment.findByPk(assignment.id, {
      include: [
        {
          model: Order,
          as: 'order',
          required: false
        },
        {
          model: Driver,
          as: 'driver',
          required: false
        },
        {
          model: Unit,
          as: 'unit',
          required: false
        }
      ]
    });

    res.success(fullAssignment, 'Assignment created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// GET /assignments
const getAssignments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status, driverId, unitId, orderId } = req.query;

    let whereClause = {};

    // Filter by status
    if (status && ['pending', 'ready', 'started', 'completed', 'cancelled'].includes(status)) {
      whereClause.status = status;
    }

    // Filter by driver
    if (driverId) {
      whereClause.driverId = driverId;
    }

    // Filter by unit
    if (unitId) {
      whereClause.unitId = unitId;
    }

    // Filter by order
    if (orderId) {
      whereClause.orderId = orderId;
    }

    const { count, rows } = await Assignment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Order,
          as: 'order',
          required: false
        },
        {
          model: Driver,
          as: 'driver',
          required: false
        },
        {
          model: Unit,
          as: 'unit',
          required: false
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

// GET /assignments/:id
const getAssignmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findByPk(id, {
      include: [
        {
          model: Order,
          as: 'order',
          required: false
        },
        {
          model: Driver,
          as: 'driver',
          required: false,
          include: [
            {
              model: Document,
              as: 'documents',
              required: false
            }
          ]
        },
        {
          model: Unit,
          as: 'unit',
          required: false,
          include: [
            {
              model: Document,
              as: 'documents',
              required: false
            }
          ]
        }
      ]
    });

    if (!assignment) {
      return res.error('Assignment not found', 404);
    }

    res.success(assignment, 'Assignment retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// PATCH /assignments/:id
const updateAssignment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const updateData = req.body;

    const assignment = await Assignment.findByPk(id);
    if (!assignment) {
      return res.error('Assignment not found', 404);
    }

    // Handle status transitions
    if (updateData.status && updateData.status !== assignment.status) {
      switch (updateData.status) {
        case 'started':
          if (assignment.status !== 'ready') {
            return res.error('Assignment must be ready before starting', 400);
          }
          updateData.startedAt = new Date();
          
          // Update order status
          await Order.findByPk(assignment.orderId).then(order => {
            if (order) order.update({ status: 'in_progress' });
          });
          break;

        case 'completed':
          if (assignment.status !== 'started') {
            return res.error('Assignment must be started before completing', 400);
          }
          updateData.completedAt = new Date();
          
          // Update order and unit status
          await Promise.all([
            Order.findByPk(assignment.orderId).then(order => {
              if (order) order.update({ status: 'completed' });
            }),
            Unit.findByPk(assignment.unitId).then(unit => {
              if (unit) unit.update({ status: 'active' });
            })
          ]);
          break;

        case 'cancelled':
          // Update order and unit status
          await Promise.all([
            Order.findByPk(assignment.orderId).then(order => {
              if (order) order.update({ status: 'pending' });
            }),
            Unit.findByPk(assignment.unitId).then(unit => {
              if (unit) unit.update({ status: 'active' });
            })
          ]);
          break;
      }
    }

    await assignment.update(updateData);

    const updatedAssignment = await Assignment.findByPk(id, {
      include: [
        {
          model: Order,
          as: 'order',
          required: false
        },
        {
          model: Driver,
          as: 'driver',
          required: false
        },
        {
          model: Unit,
          as: 'unit',
          required: false
        }
      ]
    });

    res.success(updatedAssignment, 'Assignment updated successfully');
  } catch (error) {
    next(error);
  }
};

// DELETE /assignments/:id
const deleteAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findByPk(id);
    if (!assignment) {
      return res.error('Assignment not found', 404);
    }

    // Prevent deleting started assignments
    if (assignment.status === 'started') {
      return res.error('Cannot delete started assignments', 400);
    }

    // Update related records
    await Promise.all([
      Order.findByPk(assignment.orderId).then(order => {
        if (order) order.update({ status: 'pending' });
      }),
      Unit.findByPk(assignment.unitId).then(unit => {
        if (unit) unit.update({ status: 'active' });
      })
    ]);

    await assignment.destroy();
    res.success(null, 'Assignment deleted successfully');
  } catch (error) {
    next(error);
  }
};

// POST /assignments/:id/revalidate
const revalidateAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findByPk(id);
    if (!assignment) {
      return res.error('Assignment not found', 404);
    }

    // Re-run validation
    const validation = await validateAssignmentRequirements(assignment.driverId, assignment.unitId);
    
    // Update assignment with new validation results
    const newStatus = validation.errors.length === 0 ? 'ready' : 'pending';
    
    await assignment.update({
      validationResults: validation,
      status: newStatus
    });

    const updatedAssignment = await Assignment.findByPk(id, {
      include: [
        {
          model: Order,
          as: 'order',
          required: false
        },
        {
          model: Driver,
          as: 'driver',
          required: false
        },
        {
          model: Unit,
          as: 'unit',
          required: false
        }
      ]
    });

    res.success(updatedAssignment, 'Assignment revalidated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  revalidateAssignment
};