// routes/notifications.js
const express = require('express');
const { validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { 
  listNotifications,
  getNotification,
  markAsRead,
  deleteNotification,
  setPreferences
} = require('../controllers/notificationController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Listar notificaciones del usuario
 *     description: Obtiene todas las notificaciones del usuario autenticado
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
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Lista de notificaciones
 */
router.get('/', async (req, res, next) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const unreadOnly = req.query.unreadOnly === 'true';
    const result = await listNotifications(req.user.id, { page, limit, unreadOnly });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Obtener notificación por ID
 *     description: Obtiene los detalles de una notificación específica
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
 *         description: Detalles de notificación
 *       404:
 *         description: Notificación no encontrada
 */
router.get('/:id', async (req, res, next) => {
  try {
    const result = await getNotification(req.params.id, req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: Marcar notificación como leída
 *     description: Marca una notificación como leída
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
 *         description: Notificación marcada como leída
 */
router.patch('/:id/read', async (req, res, next) => {
  try {
    const result = await markAsRead(req.params.id, req.user.id);
    res.json({ success: true, data: result, message: 'Marcada como leída' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: Eliminar notificación
 *     description: Elimina una notificación
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
 *         description: Notificación eliminada
 */
router.delete('/:id', async (req, res, next) => {
  try {
    await deleteNotification(req.params.id, req.user.id);
    res.json({ success: true, message: 'Notificación eliminada' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/notifications/preferences:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Configurar preferencias de notificaciones
 *     description: Configura canales de notificación (email, push, SMS) y tipos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailEnabled:
 *                 type: boolean
 *               pushEnabled:
 *                 type: boolean
 *               smsEnabled:
 *                 type: boolean
 *               notificationTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [trip_status, order_update, driver_alert, system_alert]
 *     responses:
 *       200:
 *         description: Preferencias actualizadas
 */
router.post('/preferences', async (req, res, next) => {
  try {
    const result = await setPreferences(req.user.id, req.body);
    res.json({ success: true, data: result, message: 'Preferencias guardadas' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
