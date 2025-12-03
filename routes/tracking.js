// routes/tracking.js
const express = require('express');
const { validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { validateTrackingUpdate } = require('../middleware/validators');
const { 
  updateLocation,
  getCurrentLocation,
  getTripBreadcrumbs,
  getUnitCurrentLocation
} = require('../controllers/trackingController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/tracking/update-location:
 *   post:
 *     tags:
 *       - Tracking & Ubicación
 *     summary: Actualizar ubicación GPS
 *     description: Driver envía su ubicación GPS actual (típicamente desde app móvil)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tripRouteId:
 *                 type: string
 *                 format: uuid
 *               latitude:
 *                 type: number
 *                 example: 25.6867
 *               longitude:
 *                 type: number
 *                 example: -100.3161
 *               address:
 *                 type: string
 *                 example: "Av. Carlos V, Centro, Monterrey"
 *               speed:
 *                 type: number
 *                 description: "Velocidad en km/h"
 *               accuracy:
 *                 type: number
 *                 description: "Precisión GPS en metros"
 *             required: [tripRouteId, latitude, longitude]
 *     responses:
 *       200:
 *         description: Ubicación registrada exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Viaje no encontrado
 */
router.post('/update-location', validateTrackingUpdate, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  try {
    const result = await updateLocation(req.body, req.user.id);
    res.json({ success: true, data: result, message: 'Ubicación actualizada' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tracking/trip/{tripRouteId}/current:
 *   get:
 *     tags:
 *       - Tracking & Ubicación
 *     summary: Obtener ubicación actual del viaje
 *     description: Obtiene la última ubicación registrada de un viaje
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripRouteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Ubicación actual encontrada
 *       404:
 *         description: Viaje no encontrado
 */
router.get('/trip/:tripRouteId/current', async (req, res, next) => {
  try {
    const result = await getCurrentLocation(req.params.tripRouteId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tracking/trip/{tripRouteId}/breadcrumbs:
 *   get:
 *     tags:
 *       - Tracking & Ubicación
 *     summary: Obtener historial de recorrido (breadcrumbs)
 *     description: Obtiene todas las ubicaciones registradas de un viaje (historial completo)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripRouteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Historial de ubicaciones
 *       404:
 *         description: Viaje no encontrado
 */
router.get('/trip/:tripRouteId/breadcrumbs', async (req, res, next) => {
  try {
    const limit = req.query.limit || 100;
    const result = await getTripBreadcrumbs(req.params.tripRouteId, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tracking/unit/{unitId}/current:
 *   get:
 *     tags:
 *       - Tracking & Ubicación
 *     summary: Obtener ubicación actual de unidad
 *     description: Obtiene la última ubicación registrada de una unidad
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Ubicación actual de la unidad
 *       404:
 *         description: Unidad no encontrada
 */
router.get('/unit/:unitId/current', async (req, res, next) => {
  try {
    const result = await getUnitCurrentLocation(req.params.unitId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
