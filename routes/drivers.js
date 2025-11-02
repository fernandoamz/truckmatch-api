/**
 * @swagger
 * tags:
 *   name: Drivers
 *   description: Gestión de transportistas
 */

/**
 * @swagger
 * tags:
 *   name: Drivers
 *   description: Gestión de transportistas
 */

// routes/drivers.js
const express = require('express');
const { body } = require('express-validator');
const { 
  createDriver, 
  getDrivers, 
  getDriverById, 
  updateDriver, 
  deleteDriver 
} = require('../controllers/driverController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateDriver = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('license')
    .trim()
    .notEmpty()
    .withMessage('License number is required'),
  body('licenseExpirationDate')
    .isISO8601()
    .toDate()
    .withMessage('Valid license expiration date is required')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('License expiration date must be in the future');
      }
      return true;
    }),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'under_review'])
    .withMessage('Invalid status')
];

const validateDriverUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('license')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('License number cannot be empty'),
  body('licenseExpirationDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Valid license expiration date is required'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'under_review'])
    .withMessage('Invalid status')
];

/**
 * @swagger
 * /api/drivers:
 *   post:
 *     summary: Crear nuevo transportista
 *     tags: [Drivers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - license
 *               - licenseExpirationDate
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Juan Pérez"
 *               license:
 *                 type: string
 *                 example: "CDL-123456789"
 *               licenseExpirationDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-12-31"
 *               phone:
 *                 type: string
 *                 example: "+52-555-0123"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juan.perez@email.com"
 *               address:
 *                 type: string
 *                 example: "Av. Insurgentes 123, CDMX"
 *     responses:
 *       201:
 *         description: Transportista creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autorizado
 *   get:
 *     summary: Listar transportistas
 *     tags: [Drivers]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Elementos por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, under_review]
 *         description: Filtrar por estado
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre o licencia
 *     responses:
 *       200:
 *         description: Lista de transportistas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 * 
 * /api/drivers/{id}:
 *   get:
 *     summary: Obtener transportista por ID
 *     tags: [Drivers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transportista encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Transportista no encontrado
 *   put:
 *     summary: Actualizar transportista
 *     tags: [Drivers]
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
 *             properties:
 *               name:
 *                 type: string
 *               license:
 *                 type: string
 *               licenseExpirationDate:
 *                 type: string
 *                 format: date
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               address:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, under_review]
 *     responses:
 *       200:
 *         description: Transportista actualizado
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Transportista no encontrado
 *   delete:
 *     summary: Eliminar transportista
 *     tags: [Drivers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transportista eliminado
 *       400:
 *         description: No se puede eliminar (tiene asignaciones activas)
 *       404:
 *         description: Transportista no encontrado
 */

/**
 * @swagger
 * /api/drivers:
 *   post:
 *     summary: Crear nuevo transportista
 *     tags: [Drivers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - license
 *               - licenseExpirationDate
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Juan Pérez"
 *               license:
 *                 type: string
 *                 example: "CDL-123456789"
 *               licenseExpirationDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-12-31"
 *               phone:
 *                 type: string
 *                 example: "+52-555-0123"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juan.perez@email.com"
 *               address:
 *                 type: string
 *                 example: "Av. Insurgentes 123, CDMX"
 *     responses:
 *       201:
 *         description: Transportista creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *   get:
 *     summary: Listar transportistas
 *     tags: [Drivers]
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
 *           enum: [active, inactive, under_review]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de transportistas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */

/**
 * @swagger
 * /api/drivers/{id}:
 *   get:
 *     summary: Obtener transportista por ID
 *     tags: [Drivers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transportista encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Transportista no encontrado
 *   put:
 *     summary: Actualizar transportista
 *     tags: [Drivers]
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
 *             $ref: '#/components/schemas/Driver'
 *     responses:
 *       200:
 *         description: Transportista actualizado
 *       404:
 *         description: Transportista no encontrado
 *   delete:
 *     summary: Eliminar transportista
 *     tags: [Drivers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transportista eliminado
 *       400:
 *         description: No se puede eliminar (tiene asignaciones activas)
 *       404:
 *         description: Transportista no encontrado
 */

// Routes
router.post('/', authenticateToken, validateDriver, createDriver);
router.get('/', authenticateToken, getDrivers);
router.get('/:id', authenticateToken, getDriverById);
router.put('/:id', authenticateToken, validateDriverUpdate, updateDriver);
router.delete('/:id', authenticateToken, deleteDriver);

module.exports = router;