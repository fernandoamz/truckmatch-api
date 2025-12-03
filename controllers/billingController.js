// controllers/billingController.js
const { Order, Billing, Payment } = require('../models');
const { Op, sequelize } = require('sequelize');

// Get order billing
const getOrderBilling = async (orderId) => {
  const order = await Order.findByPk(orderId);
  if (!order) throw new Error('Order not found');
  
  let billing = await Billing.findOne({ where: { orderId } });
  if (!billing) {
    billing = await Billing.create({
      orderId,
      totalAmount: order.rate || 0,
      status: 'draft'
    });
  }
  
  return billing;
};

// Generate invoice
const generateInvoice = async (data) => {
  const { orderId, invoiceNumber, issueDate, dueDate, notes } = data;
  
  const order = await Order.findByPk(orderId);
  if (!order) throw new Error('Order not found');
  
  let billing = await Billing.findOne({ where: { orderId } });
  if (!billing) {
    billing = await Billing.create({
      orderId,
      totalAmount: order.rate || 0
    });
  }
  
  await billing.update({
    invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
    issueDate: issueDate || new Date(),
    dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    notes,
    status: 'sent'
  });
  
  return billing;
};

// List invoices
const listInvoices = async (options = {}) => {
  const { page = 1, limit = 10, status } = options;
  const offset = (page - 1) * limit;
  
  const where = {};
  if (status) where.status = status;
  
  const { count, rows } = await Billing.findAndCountAll({
    where,
    include: [{ model: Order, attributes: ['id', 'orderNumber'] }],
    order: [['createdAt', 'DESC']],
    offset,
    limit: parseInt(limit)
  });
  
  return {
    data: rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  };
};

// Register payment
const registerPayment = async (data) => {
  const { invoiceId, amount, paymentMethod, referenceNumber, notes } = data;
  
  const billing = await Billing.findByPk(invoiceId);
  if (!billing) throw new Error('Invoice not found');
  
  const payment = await Payment.create({
    billingId: invoiceId,
    amount,
    paymentMethod,
    referenceNumber,
    notes,
    status: 'completed'
  });
  
  // Update billing status if fully paid
  const totalPaid = await Payment.sum('amount', {
    where: { billingId: invoiceId, status: 'completed' }
  });
  
  if (totalPaid >= billing.totalAmount) {
    await billing.update({ status: 'paid' });
  }
  
  return payment;
};

// Get payment history
const getPaymentHistory = async (options = {}) => {
  const { page = 1, limit = 10, orderId } = options;
  const offset = (page - 1) * limit;
  
  const where = {};
  if (orderId) {
    const billing = await Billing.findOne({ where: { orderId } });
    if (billing) where.billingId = billing.id;
  }
  
  const { count, rows } = await Payment.findAndCountAll({
    where,
    include: [{ model: Billing, attributes: ['id', 'invoiceNumber'] }],
    order: [['createdAt', 'DESC']],
    offset,
    limit: parseInt(limit)
  });
  
  return {
    data: rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  };
};

// Adjust rate
const adjustRate = async (orderId, data) => {
  const { newRate, reason } = data;
  
  const order = await Order.findByPk(orderId);
  if (!order) throw new Error('Order not found');
  
  const oldRate = order.rate;
  await order.update({ rate: newRate });
  
  let billing = await Billing.findOne({ where: { orderId } });
  if (billing) {
    await billing.update({
      totalAmount: newRate,
      notes: `Rate adjusted from ${oldRate} to ${newRate}. Reason: ${reason || 'No reason provided'}`
    });
  }
  
  return { order, message: 'Rate adjusted' };
};

module.exports = {
  getOrderBilling,
  generateInvoice,
  listInvoices,
  registerPayment,
  getPaymentHistory,
  adjustRate
};
