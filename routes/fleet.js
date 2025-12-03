// routes/fleet.js
const express = require('express');
const { validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { 
  registerMaintenance,
  getMaintenanceHistory,
  logFuelConsumption,
  getFuelAnalytics
} = require('../controllers/fleetController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/fleet/maintenance:
 *   post:
 *     tags:
 *       - Fleet Management
 *     summary: Registrar mantenimiento de unidad
 *     description: Registra una actividad de mantenimiento para una unidad
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               unitId:
 *                 type: string
 *                 format: uuid
 *               maintenanceType:
 *                 type: string
 *                 enum: [oil_change, tire_rotation, inspection, repair, cleaning]
 *               description:
 *                 type: string
 *               cost:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date
 *               nextMaintenanceDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *             required: [unitId, maintenanceType, description, cost, date]
 *     responses:
 *       201:
 *         description: Mantenimiento registrado
 */
router.post('/maintenance', async (req, res, next) => {
  try {
    const result = await registerMaintenance(req.body);
    res.status(201).json({ success: true, data: result, message: 'Mantenimiento registrado' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/fleet/maintenance/{unitId}:
 *   get:
 *     tags:
 *       - Fleet Management
 *     summary: Historial de mantenimiento
 *     description: Obtiene el historial completo de mantenimiento de una unidad
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Historial de mantenimiento
 */
router.get('/maintenance/:unitId', async (req, res, next) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const result = await getMaintenanceHistory(req.params.unitId, { page, limit });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/fleet/fuel-log:
 *   post:
 *     tags:
 *       - Fleet Management
 *     summary: Registrar consumo de combustible
 *     description: Registra el consumo de combustible de una unidad
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               unitId:
 *                 type: string
 *                 format: uuid
 *               liters:
 *                 type: number
 *                 description: "Litros cargados"
 *               cost:
 *                 type: number
 *               date:
 *                 type: string
 *                 format: date
 *               odometer:
 *                 type: number
 *                 description: "Lectura del odómetro"
 *               location:
 *                 type: string
 *               notes:
 *                 type: string
 *             required: [unitId, liters, cost, date]
 *     responses:
 *       201:
 *         description: Consumo registrado
 */
router.post('/fuel-log', async (req, res, next) => {
  try {
    const result = await logFuelConsumption(req.body);
    res.status(201).json({ success: true, data: result, message: 'Combustible registrado' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/fleet/fuel-analytics:
 *   get:
 *     tags:
 *       - Fleet Management
 *     summary: Análisis de consumo de combustible
 *     description: Obtiene estadísticas de consumo de combustible (promedio, tendencias)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: monthly
 *     responses:
 *       200:
 *         description: Análisis de combustible
 */
router.get('/fuel-analytics', async (req, res, next) => {
  try {
    const filters = {
      unitId: req.query.unitId,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      groupBy: req.query.groupBy || 'monthly'
    };
    const result = await getFuelAnalytics(filters);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
