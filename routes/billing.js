// routes/billing.js
const express = require('express');
const { validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { 
  getOrderBilling,
  generateInvoice,
  listInvoices,
  registerPayment,
  getPaymentHistory,
  adjustRate
} = require('../controllers/billingController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/billing/orders/{orderId}:
 *   get:
 *     tags:
 *       - Billing & Payments
 *     summary: Obtener detalles de facturación de orden
 *     description: Obtiene información de facturación de una orden
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detalles de facturación
 */
router.get('/orders/:orderId', async (req, res, next) => {
  try {
    const result = await getOrderBilling(req.params.orderId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/billing/invoices:
 *   post:
 *     tags:
 *       - Billing & Payments
 *     summary: Generar factura
 *     description: Genera una factura para una orden
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *               invoiceNumber:
 *                 type: string
 *               issueDate:
 *                 type: string
 *                 format: date
 *               dueDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *             required: [orderId]
 *     responses:
 *       201:
 *         description: Factura generada
 */
router.post('/invoices', async (req, res, next) => {
  try {
    const result = await generateInvoice(req.body);
    res.status(201).json({ success: true, data: result, message: 'Factura generada' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/billing/invoices:
 *   get:
 *     tags:
 *       - Billing & Payments
 *     summary: Listar facturas
 *     description: Lista todas las facturas con filtros opcionales
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
 *           enum: [draft, sent, paid, overdue]
 *     responses:
 *       200:
 *         description: Lista de facturas
 */
router.get('/invoices', async (req, res, next) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const status = req.query.status;
    const result = await listInvoices({ page, limit, status });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/billing/payments:
 *   post:
 *     tags:
 *       - Billing & Payments
 *     summary: Registrar pago
 *     description: Registra un pago para una orden/factura
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               invoiceId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *                 enum: [credit_card, bank_transfer, cash, check]
 *               referenceNumber:
 *                 type: string
 *               notes:
 *                 type: string
 *             required: [invoiceId, amount, paymentMethod]
 *     responses:
 *       201:
 *         description: Pago registrado
 */
router.post('/payments', async (req, res, next) => {
  try {
    const result = await registerPayment(req.body);
    res.status(201).json({ success: true, data: result, message: 'Pago registrado' });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/billing/payments:
 *   get:
 *     tags:
 *       - Billing & Payments
 *     summary: Obtener historial de pagos
 *     description: Lista el historial de pagos con filtros opcionales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: orderId
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
 *           default: 10
 *     responses:
 *       200:
 *         description: Historial de pagos
 */
router.get('/payments', async (req, res, next) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const orderId = req.query.orderId;
    const result = await getPaymentHistory({ page, limit, orderId });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/billing/orders/{orderId}/rate:
 *   patch:
 *     tags:
 *       - Billing & Payments
 *     summary: Ajustar tarifa de orden
 *     description: Ajusta la tarifa/precio de una orden
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
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
 *               newRate:
 *                 type: number
 *               reason:
 *                 type: string
 *             required: [newRate]
 *     responses:
 *       200:
 *         description: Tarifa actualizada
 */
router.patch('/orders/:orderId/rate', async (req, res, next) => {
  try {
    const result = await adjustRate(req.params.orderId, req.body);
    res.json({ success: true, data: result, message: 'Tarifa actualizada' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
