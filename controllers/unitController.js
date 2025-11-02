// controllers/unitController.js
const { Unit, Driver, Document } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// POST /units
const createUnit = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 400, errors.array());
    }

    const { plateNumber, model, type, capacity, capacityUnit, year, brand } = req.body;

    // Check if plate number already exists
    const existingUnit = await Unit.findOne({ where: { plateNumber } });
    if (existingUnit) {
      return res.error('Plate number already exists', 400);
    }

    const unit = await Unit.create({
      plateNumber,
      model,
      type,
      capacity,
      capacityUnit,
      year,
      brand,
      status: 'active'
    });

    res.success(unit, 'Unit created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// GET /units
const getUnits = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const type = req.query.type;
    const search = req.query.search;

    let whereClause = {};

    // Filter by status
    if (status && ['active', 'inactive', 'maintenance', 'assigned'].includes(status)) {
      whereClause.status = status;
    }

    // Filter by type
    if (type && ['truck', 'trailer', 'van', 'pickup'].includes(type)) {
      whereClause.type = type;
    }

    // Search by plate number or model
    if (search) {
      whereClause[Op.or] = [
        { plateNumber: { [Op.iLike]: `%${search}%` } },
        { model: { [Op.iLike]: `%${search}%` } },
        { brand: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Unit.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Driver,
          as: 'driver',
          required: false
        },
        {
          model: Document,
          as: 'documents',
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

// GET /units/:id
const getUnitById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const unit = await Unit.findByPk(id, {
      include: [
        {
          model: Driver,
          as: 'driver',
          required: false
        },
        {
          model: Document,
          as: 'documents',
          required: false
        }
      ]
    });

    if (!unit) {
      return res.error('Unit not found', 404);
    }

    res.success(unit, 'Unit retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// PUT /units/:id
const updateUnit = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const updateData = req.body;

    const unit = await Unit.findByPk(id);
    if (!unit) {
      return res.error('Unit not found', 404);
    }

    // Check if plate number is being updated and already exists
    if (updateData.plateNumber && updateData.plateNumber !== unit.plateNumber) {
      const existingUnit = await Unit.findOne({ 
        where: { 
          plateNumber: updateData.plateNumber,
          id: { [Op.ne]: id }
        } 
      });
      if (existingUnit) {
        return res.error('Plate number already exists', 400);
      }
    }

    await unit.update(updateData);

    const updatedUnit = await Unit.findByPk(id, {
      include: [
        {
          model: Driver,
          as: 'driver',
          required: false
        },
        {
          model: Document,
          as: 'documents',
          required: false
        }
      ]
    });

    res.success(updatedUnit, 'Unit updated successfully');
  } catch (error) {
    next(error);
  }
};

// PUT /units/:id/assign-driver/:driverId
const assignDriver = async (req, res, next) => {
  try {
    const { id, driverId } = req.params;

    const unit = await Unit.findByPk(id);
    if (!unit) {
      return res.error('Unit not found', 404);
    }

    const driver = await Driver.findByPk(driverId);
    if (!driver) {
      return res.error('Driver not found', 404);
    }

    // Check if driver is active
    if (driver.status !== 'active') {
      return res.error('Driver must be active to be assigned', 400);
    }

    // Check if unit is available
    if (unit.status === 'assigned') {
      return res.error('Unit is already assigned to another driver', 400);
    }

    // Assign driver to unit
    await unit.update({ 
      driverId: driverId,
      status: 'assigned'
    });

    const updatedUnit = await Unit.findByPk(id, {
      include: [
        {
          model: Driver,
          as: 'driver',
          required: false
        }
      ]
    });

    res.success(updatedUnit, 'Driver assigned successfully');
  } catch (error) {
    next(error);
  }
};

// PUT /units/:id/unassign-driver
const unassignDriver = async (req, res, next) => {
  try {
    const { id } = req.params;

    const unit = await Unit.findByPk(id);
    if (!unit) {
      return res.error('Unit not found', 404);
    }

    if (!unit.driverId) {
      return res.error('Unit has no driver assigned', 400);
    }

    // Check if unit has active assignments
    const { Assignment } = require('../models');
    const activeAssignment = await Assignment.findOne({
      where: { 
        unitId: id,
        status: ['ready', 'started']
      }
    });

    if (activeAssignment) {
      return res.error('Cannot unassign driver with active trip assignments', 400);
    }

    // Unassign driver
    await unit.update({ 
      driverId: null,
      status: 'active'
    });

    const updatedUnit = await Unit.findByPk(id, {
      include: [
        {
          model: Driver,
          as: 'driver',
          required: false
        }
      ]
    });

    res.success(updatedUnit, 'Driver unassigned successfully');
  } catch (error) {
    next(error);
  }
};

// DELETE /units/:id
const deleteUnit = async (req, res, next) => {
  try {
    const { id } = req.params;

    const unit = await Unit.findByPk(id);
    if (!unit) {
      return res.error('Unit not found', 404);
    }

    // Check if unit has active assignments
    const { Assignment } = require('../models');
    const activeAssignment = await Assignment.findOne({
      where: { 
        unitId: id,
        status: ['ready', 'started']
      }
    });

    if (activeAssignment) {
      return res.error('Cannot delete unit with active assignments', 400);
    }

    await unit.destroy();
    res.success(null, 'Unit deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Legacy function for GraphQL compatibility
async function registerUnit({ userId, plateNumber, model }) {
  try {
    if (!userId || !plateNumber || !model) {
      throw new Error('Faltan campos requeridos: userId, plateNumber, o model.');
    }

    const unit = await Unit.create({ userId, plateNumber, model });
    return unit;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createUnit,
  getUnits,
  getUnitById,
  updateUnit,
  assignDriver,
  unassignDriver,
  deleteUnit,
  registerUnit // Keep for GraphQL compatibility
};
