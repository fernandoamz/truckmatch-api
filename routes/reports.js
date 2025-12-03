// routes/reports.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { 
  getDashboardSummary,
  getTripReports,
  getDriverPerformance,
  getUnitUtilization,
  getRevenueReport,
  exportReports
} = require('../controllers/reportController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/reports/summary:
 *   get:
 *     tags:
 *       - Reports & Analytics
 *     summary: Dashboard general
 *     description: Obtiene métricas generales del dashboard (KPIs principales)
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *     responses:
 *       200:
 *         description: Resumen del dashboard
 */
router.get('/summary', async (req, res, next) => {
  try {
    const dateFrom = req.query.dateFrom;
    const dateTo = req.query.dateTo;
    const result = await getDashboardSummary({ dateFrom, dateTo });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/reports/trips:
 *   get:
 *     tags:
 *       - Reports & Analytics
 *     summary: Reportes de viajes
 *     description: Obtiene reporte de viajes completados con filtros
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [completed, cancelled, in_progress]
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
 *         description: Reporte de viajes
 */
router.get('/trips', async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      status: req.query.status,
      page: req.query.page || 1,
      limit: req.query.limit || 20
    };
    const result = await getTripReports(filters);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/reports/drivers:
 *   get:
 *     tags:
 *       - Reports & Analytics
 *     summary: Performance de drivers
 *     description: Obtiene métricas de desempeño por transportista
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [trips, earnings, rating, efficiency]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Performance de drivers
 */
router.get('/drivers', async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      sortBy: req.query.sortBy || 'trips',
      limit: req.query.limit || 10
    };
    const result = await getDriverPerformance(filters);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/reports/units:
 *   get:
 *     tags:
 *       - Reports & Analytics
 *     summary: Utilización de unidades
 *     description: Obtiene métricas de utilización por unidad (km, horas, rentabilidad)
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, maintenance]
 *     responses:
 *       200:
 *         description: Utilización de unidades
 */
router.get('/units', async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      status: req.query.status
    };
    const result = await getUnitUtilization(filters);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/reports/revenue:
 *   get:
 *     tags:
 *       - Reports & Analytics
 *     summary: Reporte de ingresos
 *     description: Obtiene ingresos por período con desglose por tipo de servicio
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Reporte de ingresos
 */
router.get('/revenue', async (req, res, next) => {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      groupBy: req.query.groupBy || 'monthly'
    };
    const result = await getRevenueReport(filters);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/reports/export:
 *   get:
 *     tags:
 *       - Reports & Analytics
 *     summary: Exportar reportes
 *     description: Exporta reportes en CSV, Excel o PDF
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [csv, excel, pdf]
 *       - in: query
 *         name: reportType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [trips, drivers, units, revenue]
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
 *     responses:
 *       200:
 *         description: Archivo exportado
 */
router.get('/export', async (req, res, next) => {
  try {
    const format = req.query.format;
    const reportType = req.query.reportType;
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };
    const result = await exportReports(reportType, format, filters);
    res.attachment(`report.${format === 'excel' ? 'xlsx' : format}`);
    res.send(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
