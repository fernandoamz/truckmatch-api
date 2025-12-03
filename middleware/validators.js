// middleware/validators.js
const { body, validationResult } = require('express-validator');

// Validators for Tracking
const validateTrackingUpdate = [
  body('tripRouteId').isUUID().withMessage('tripRouteId debe ser un UUID válido'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('latitude debe estar entre -90 y 90'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('longitude debe estar entre -180 y 180'),
  body('speed').optional().isFloat({ min: 0 }).withMessage('speed debe ser un número positivo'),
  body('accuracy').optional().isFloat({ min: 0 }).withMessage('accuracy debe ser un número positivo')
];

// Validators for Trip Route
const validateTripRoute = [
  body('origin.address').notEmpty().withMessage('origin.address requerido'),
  body('origin.city').notEmpty().withMessage('origin.city requerido'),
  body('origin.state').notEmpty().withMessage('origin.state requerido'),
  body('destination.address').notEmpty().withMessage('destination.address requerido'),
  body('destination.city').notEmpty().withMessage('destination.city requerido'),
  body('destination.state').notEmpty().withMessage('destination.state requerido'),
  body('estimatedDistanceKm').isFloat({ min: 0 }).withMessage('estimatedDistanceKm debe ser un número positivo'),
  body('estimatedDurationHours').isFloat({ min: 0 }).withMessage('estimatedDurationHours debe ser un número positivo'),
  body('driverId').isUUID().withMessage('driverId debe ser un UUID válido'),
  body('unitId').isUUID().withMessage('unitId debe ser un UUID válido'),
  body('orderId').optional().isUUID().withMessage('orderId debe ser un UUID válido')
];

const validateTripRouteUpdate = [
  body('origin.address').optional().notEmpty().withMessage('origin.address no puede estar vacío'),
  body('destination.address').optional().notEmpty().withMessage('destination.address no puede estar vacío'),
  body('estimatedDistanceKm').optional().isFloat({ min: 0 }).withMessage('estimatedDistanceKm debe ser un número positivo'),
  body('estimatedDurationHours').optional().isFloat({ min: 0 }).withMessage('estimatedDurationHours debe ser un número positivo')
];

const validateStatusUpdate = [
  body('newStatus')
    .isIn(['created', 'assigned', 'in_progress', 'arrived_at_destination', 'completed', 'cancelled'])
    .withMessage('newStatus inválido')
];

// Validators for Orders
const validateOrder = [
  body('origin.address').notEmpty().withMessage('origin.address requerido'),
  body('origin.city').notEmpty().withMessage('origin.city requerido'),
  body('origin.state').notEmpty().withMessage('origin.state requerido'),
  body('destination.address').notEmpty().withMessage('destination.address requerido'),
  body('destination.city').notEmpty().withMessage('destination.city requerido'),
  body('destination.state').notEmpty().withMessage('destination.state requerido'),
  body('cargoDescription').notEmpty().withMessage('cargoDescription requerido'),
  body('cargoWeight').isFloat({ min: 0 }).withMessage('cargoWeight debe ser un número positivo'),
  body('cargoWeightUnit').isIn(['tons', 'kg', 'lbs']).withMessage('cargoWeightUnit inválido'),
  body('pickupDate').optional().isISO8601().withMessage('pickupDate debe ser ISO8601'),
  body('deliveryDate').optional().isISO8601().withMessage('deliveryDate debe ser ISO8601'),
  body('rate').optional().isFloat({ min: 0 }).withMessage('rate debe ser un número positivo'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('currency debe ser código de 3 letras')
];

const validateOrderUpdate = [
  body('origin.address').optional().notEmpty().withMessage('origin.address no puede estar vacío'),
  body('cargoDescription').optional().notEmpty().withMessage('cargoDescription no puede estar vacío'),
  body('status').optional().isIn(['pending', 'assigned', 'in_progress', 'completed', 'cancelled']).withMessage('status inválido')
];

// Validators for Drivers
const validateDriver = [
  body('name').notEmpty().withMessage('name requerido'),
  body('license').notEmpty().withMessage('license requerido'),
  body('licenseExpirationDate').isISO8601().withMessage('licenseExpirationDate debe ser ISO8601'),
  body('phone').optional().isMobilePhone().withMessage('phone inválido'),
  body('email').optional().isEmail().withMessage('email inválido')
];

const validateDriverUpdate = [
  body('name').optional().notEmpty().withMessage('name no puede estar vacío'),
  body('license').optional().notEmpty().withMessage('license no puede estar vacío'),
  body('licenseExpirationDate').optional().isISO8601().withMessage('licenseExpirationDate debe ser ISO8601'),
  body('phone').optional().isMobilePhone().withMessage('phone inválido'),
  body('email').optional().isEmail().withMessage('email inválido')
];

// Validators for Units
const validateUnit = [
  body('plateNumber').notEmpty().withMessage('plateNumber requerido'),
  body('model').notEmpty().withMessage('model requerido'),
  body('type').isIn(['truck', 'trailer', 'van', 'pickup']).withMessage('type inválido'),
  body('capacity').isFloat({ min: 0 }).withMessage('capacity debe ser un número positivo'),
  body('capacityUnit').isIn(['tons', 'kg', 'm3']).withMessage('capacityUnit inválido'),
  body('year').optional().isInt({ min: 1950, max: new Date().getFullYear() + 1 }).withMessage('year inválido'),
  body('brand').optional().notEmpty().withMessage('brand no puede estar vacío')
];

const validateUnitUpdate = [
  body('plateNumber').optional().notEmpty().withMessage('plateNumber no puede estar vacío'),
  body('model').optional().notEmpty().withMessage('model no puede estar vacío'),
  body('capacity').optional().isFloat({ min: 0 }).withMessage('capacity debe ser un número positivo'),
  body('status').optional().isIn(['active', 'inactive', 'maintenance', 'assigned']).withMessage('status inválido')
];

// Validators for Assignments
const validateAssignment = [
  body('orderId').isUUID().withMessage('orderId debe ser un UUID válido'),
  body('driverId').isUUID().withMessage('driverId debe ser un UUID válido'),
  body('unitId').isUUID().withMessage('unitId debe ser un UUID válido')
];

const validateAssignmentUpdate = [
  body('status').isIn(['pending', 'ready', 'started', 'completed', 'cancelled']).withMessage('status inválido')
];

// Validators for Documents
const validateDocument = [
  body('entityType').isIn(['driver', 'unit']).withMessage('entityType debe ser driver o unit'),
  body('entityId').isUUID().withMessage('entityId debe ser un UUID válido'),
  body('type').isIn(['license', 'insurance', 'registration', 'inspection', 'permit', 'medical_certificate', 'identification', 'other'])
    .withMessage('type inválido'),
  body('expirationDate').optional().isISO8601().withMessage('expirationDate debe ser ISO8601')
];

const validateDocumentUpdate = [
  body('status').isIn(['valid', 'expired', 'rejected', 'pending_review']).withMessage('status inválido'),
  body('expirationDate').optional().isISO8601().withMessage('expirationDate debe ser ISO8601')
];

// Validators for Billing
const validateBilling = [
  body('orderId').isUUID().withMessage('orderId debe ser un UUID válido'),
  body('invoiceNumber').optional().notEmpty().withMessage('invoiceNumber no puede estar vacío'),
  body('issueDate').optional().isISO8601().withMessage('issueDate debe ser ISO8601'),
  body('dueDate').optional().isISO8601().withMessage('dueDate debe ser ISO8601')
];

const validatePayment = [
  body('invoiceId').isUUID().withMessage('invoiceId debe ser un UUID válido'),
  body('amount').isFloat({ min: 0 }).withMessage('amount debe ser un número positivo'),
  body('paymentMethod').isIn(['credit_card', 'bank_transfer', 'cash', 'check']).withMessage('paymentMethod inválido'),
  body('referenceNumber').optional().notEmpty().withMessage('referenceNumber no puede estar vacío')
];

// Validators for Fleet Maintenance
const validateMaintenance = [
  body('unitId').isUUID().withMessage('unitId debe ser un UUID válido'),
  body('maintenanceType')
    .isIn(['oil_change', 'tire_rotation', 'inspection', 'repair', 'cleaning'])
    .withMessage('maintenanceType inválido'),
  body('description').notEmpty().withMessage('description requerido'),
  body('cost').isFloat({ min: 0 }).withMessage('cost debe ser un número positivo'),
  body('date').isISO8601().withMessage('date debe ser ISO8601'),
  body('nextMaintenanceDate').optional().isISO8601().withMessage('nextMaintenanceDate debe ser ISO8601')
];

const validateFuelLog = [
  body('unitId').isUUID().withMessage('unitId debe ser un UUID válido'),
  body('liters').isFloat({ min: 0 }).withMessage('liters debe ser un número positivo'),
  body('cost').isFloat({ min: 0 }).withMessage('cost debe ser un número positivo'),
  body('date').isISO8601().withMessage('date debe ser ISO8601'),
  body('odometer').optional().isInt({ min: 0 }).withMessage('odometer debe ser un número positivo')
];

module.exports = {
  validateTrackingUpdate,
  validateTripRoute,
  validateTripRouteUpdate,
  validateStatusUpdate,
  validateOrder,
  validateOrderUpdate,
  validateDriver,
  validateDriverUpdate,
  validateUnit,
  validateUnitUpdate,
  validateAssignment,
  validateAssignmentUpdate,
  validateDocument,
  validateDocumentUpdate,
  validateBilling,
  validatePayment,
  validateMaintenance,
  validateFuelLog
};
