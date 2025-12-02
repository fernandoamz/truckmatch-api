// routes/trip-routes.js
/**
 * @swagger
 * tags:
 *   name: TripRoutes
 *   description: Gestión de rutas de viaje y trayectos
 */

const express = require('express');
const { body } = require('express-validator');
const { 
  createTripRoute,
  getTripRoutes,
  getTripRouteById,
  updateTripRoute,
  updateTripStatus,
  getTripHistory,
  deleteTripRoute,
  getTripStatistics
} = require('../controllers/tripRouteController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateLocationObject = (location, fieldName) => {
  if (!location.address && !location.coordinates) {
    throw new Error(`${fieldName} must include address or coordinates`);
  }
  if (location.coordinates) {
    if (!location.coordinates.lat || !location.coordinates.lng) {
      throw new Error(`${fieldName} coordinates must include lat and lng`);
    }
  }
  return true;
};

const validateTripRoute = [
  body('origin')
    .isObject()
    .withMessage('Origin must be an object')
    .custom((value) => validateLocationObject(value, 'Origin')),
  body('destination')
    .isObject()
    .withMessage('Destination must be an object')
    .custom((value) => validateLocationObject(value, 'Destination')),
  body('estimatedDistanceKm')
    .isFloat({ min: 0.1 })
    .withMessage('Estimated distance must be a positive number'),
  body('estimatedDurationHours')
    .isFloat({ min: 0.1 })
    .withMessage('Estimated duration must be a positive number'),
  body('driverId')
    .isUUID()
    .withMessage('Valid driver ID is required'),
  body('unitId')
    .isUUID()
    .withMessage('Valid unit ID is required'),
  body('orderId')
    .optional()
    .isUUID()
    .withMessage('Order ID must be a valid UUID'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes cannot exceed 2000 characters')
];

const validateTripRouteUpdate = [
  body('origin')
    .optional()
    .isObject()
    .withMessage('Origin must be an object')
    .custom((value) => value ? validateLocationObject(value, 'Origin') : true),
  body('destination')
    .optional()
    .isObject()
    .withMessage('Destination must be an object')
    .custom((value) => value ? validateLocationObject(value, 'Destination') : true),
  body('estimatedDistanceKm')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Estimated distance must be a positive number'),
  body('actualDistanceKm')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Actual distance must be a non-negative number'),
  body('estimatedDurationHours')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Estimated duration must be a positive number'),
  body('driverId')
    .optional()
    .isUUID()
    .withMessage('Driver ID must be a valid UUID'),
  body('unitId')
    .optional()
    .isUUID()
    .withMessage('Unit ID must be a valid UUID'),
  body('orderId')
    .optional()
    .isUUID()
    .withMessage('Order ID must be a valid UUID'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes cannot exceed 2000 characters')
];

const validateStatusUpdate = [
  body('status')
    .isIn(['created', 'assigned', 'in_progress', 'arrived_at_destination', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  body('location')
    .optional()
    .isObject()
    .withMessage('Location must be an object'),
  body('location.lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('location.lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

// Routes

/**
 * @swagger
 * /api/trip-routes:
 *   post:
 *     summary: Crear nueva ruta de viaje
 *     description: Crea una nueva ruta asignando driver, unidad y opcionalmente una orden. Valida disponibilidad.
 *     tags: [TripRoutes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - origin
 *               - destination
 *               - estimatedDistanceKm
 *               - estimatedDurationHours
 *               - driverId
 *               - unitId
 *             properties:
 *               origin:
 *                 type: object
 *                 properties:
 *                   address:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   coordinates:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                       lng:
 *                         type: number
 *               destination:
 *                 type: object
 *                 properties:
 *                   address:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   coordinates:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                       lng:
 *                         type: number
 *               estimatedDistanceKm:
 *                 type: number
 *                 example: 920.5
 *               estimatedDurationHours:
 *                 type: number
 *                 example: 10.5
 *               driverId:
 *                 type: string
 *                 format: uuid
 *               unitId:
 *                 type: string
 *                 format: uuid
 *               orderId:
 *                 type: string
 *                 format: uuid
 *               metadata:
 *                 type: object
 *                 example: { "routeType": "highway", "tollCost": 850 }
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ruta creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validación fallida o driver/unit no disponible
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Driver, unit u orden no encontrado
 */
router.post('/', authenticateToken, validateTripRoute, createTripRoute);

/**
 * @swagger
 * /api/trip-routes:
 *   get:
 *     summary: Listar rutas de viaje
 *     description: Obtiene lista paginada de rutas con filtros opcionales
 *     tags: [TripRoutes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [created, assigned, in_progress, arrived_at_destination, completed, cancelled]
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: orderId
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
 *     responses:
 *       200:
 *         description: Lista de rutas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', authenticateToken, getTripRoutes);

/**
 * @swagger
 * /api/trip-routes/statistics:
 *   get:
 *     summary: Estadísticas de viajes
 *     description: Obtiene estadísticas agregadas de viajes (total, por estado, distancia, duración promedio)
 *     tags: [TripRoutes]
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
 *         name: driverId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Estadísticas de viajes
 */
router.get('/statistics', authenticateToken, getTripStatistics);

/**
 * @swagger
 * /api/trip-routes/{id}:
 *   get:
 *     summary: Obtener ruta por ID
 *     description: Obtiene los detalles completos de una ruta específica
 *     tags: [TripRoutes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detalles de la ruta
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Ruta no encontrada
 */
router.get('/:id', authenticateToken, getTripRouteById);

/**
 * @swagger
 * /api/trip-routes/{id}/history:
 *   get:
 *     summary: Historial de eventos de la ruta
 *     description: Obtiene el historial completo de eventos/cambios de una ruta
 *     tags: [TripRoutes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Historial de eventos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TripRouteEvent'
 *       404:
 *         description: Ruta no encontrada
 */
router.get('/:id/history', authenticateToken, getTripHistory);

/**
 * @swagger
 * /api/trip-routes/{id}:
 *   patch:
 *     summary: Actualizar ruta
 *     description: Actualiza los datos de una ruta. No permite actualizar rutas completadas o canceladas.
 *     tags: [TripRoutes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estimatedDistanceKm:
 *                 type: number
 *               estimatedDurationHours:
 *                 type: number
 *               driverId:
 *                 type: string
 *                 format: uuid
 *               unitId:
 *                 type: string
 *                 format: uuid
 *               metadata:
 *                 type: object
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ruta actualizada
 *       400:
 *         description: Ruta completada/cancelada o driver/unit no disponible
 *       404:
 *         description: Ruta no encontrada
 */
router.patch('/:id', authenticateToken, validateTripRouteUpdate, updateTripRoute);

/**
 * @swagger
 * /api/trip-routes/{id}/status:
 *   post:
 *     summary: Actualizar estado de la ruta (App móvil)
 *     description: Cambia el estado de la ruta. Valida transiciones permitidas y registra evento automático.
 *     tags: [TripRoutes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [created, assigned, in_progress, arrived_at_destination, completed, cancelled]
 *               location:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *                   address:
 *                     type: string
 *               notes:
 *                 type: string
 *           example:
 *             status: "in_progress"
 *             location:
 *               lat: 19.4326
 *               lng: -99.1332
 *               address: "Warehouse CDMX"
 *             notes: "Salida confirmada"
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       400:
 *         description: Transición de estado inválida
 *       404:
 *         description: Ruta no encontrada
 */
router.post('/:id/status', authenticateToken, validateStatusUpdate, updateTripStatus);

/**
 * @swagger
 * /api/trip-routes/{id}:
 *   delete:
 *     summary: Eliminar ruta
 *     description: Elimina una ruta. Solo permite eliminar rutas en estados created, cancelled o completed.
 *     tags: [TripRoutes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Ruta eliminada
 *       400:
 *         description: No se puede eliminar ruta activa
 *       404:
 *         description: Ruta no encontrada
 */
router.delete('/:id', authenticateToken, deleteTripRoute);

module.exports = router;
