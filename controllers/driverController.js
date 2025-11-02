// controllers/driverController.js
const { Driver, Document, Unit } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// POST /drivers
const createDriver = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 400, errors.array());
    }

    const { name, license, licenseExpirationDate, phone, email, address } = req.body;

    // Check if license already exists
    const existingDriver = await Driver.findOne({ where: { license } });
    if (existingDriver) {
      return res.error('License number already exists', 400);
    }

    const driver = await Driver.create({
      name,
      license,
      licenseExpirationDate,
      phone,
      email,
      address,
      status: 'under_review'
    });

    res.success(driver, 'Driver created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// GET /drivers
const getDrivers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const search = req.query.search;

    let whereClause = {};

    // Filter by status
    if (status && ['active', 'inactive', 'under_review'].includes(status)) {
      whereClause.status = status;
    }

    // Search by name or license
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { license: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Driver.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Document,
          as: 'documents',
          required: false
        },
        {
          model: Unit,
          as: 'units',
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

// GET /drivers/:id
const getDriverById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findByPk(id, {
      include: [
        {
          model: Document,
          as: 'documents',
          required: false
        },
        {
          model: Unit,
          as: 'units',
          required: false
        }
      ]
    });

    if (!driver) {
      return res.error('Driver not found', 404);
    }

    res.success(driver, 'Driver retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// PUT /drivers/:id
const updateDriver = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.error('Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const updateData = req.body;

    const driver = await Driver.findByPk(id);
    if (!driver) {
      return res.error('Driver not found', 404);
    }

    // Check if license is being updated and already exists
    if (updateData.license && updateData.license !== driver.license) {
      const existingDriver = await Driver.findOne({ 
        where: { 
          license: updateData.license,
          id: { [Op.ne]: id }
        } 
      });
      if (existingDriver) {
        return res.error('License number already exists', 400);
      }
    }

    await driver.update(updateData);

    const updatedDriver = await Driver.findByPk(id, {
      include: [
        {
          model: Document,
          as: 'documents',
          required: false
        },
        {
          model: Unit,
          as: 'units',
          required: false
        }
      ]
    });

    res.success(updatedDriver, 'Driver updated successfully');
  } catch (error) {
    next(error);
  }
};

// DELETE /drivers/:id
const deleteDriver = async (req, res, next) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findByPk(id);
    if (!driver) {
      return res.error('Driver not found', 404);
    }

    // Check if driver has active assignments
    const { Assignment } = require('../models');
    const activeAssignment = await Assignment.findOne({
      where: { 
        driverId: id,
        status: ['ready', 'started']
      }
    });

    if (activeAssignment) {
      return res.error('Cannot delete driver with active assignments', 400);
    }

    await driver.destroy();
    res.success(null, 'Driver deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDriver,
  getDrivers,
  getDriverById,
  updateDriver,
  deleteDriver
};