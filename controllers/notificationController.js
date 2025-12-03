// controllers/notificationController.js
const { Notification } = require('../models');
const { Op } = require('sequelize');

// List notifications
const listNotifications = async (userId, options = {}) => {
  const { page = 1, limit = 10, unreadOnly = false } = options;
  const offset = (page - 1) * limit;
  
  const where = { userId };
  if (unreadOnly) where.isRead = false;
  
  const { count, rows } = await Notification.findAndCountAll({
    where,
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

// Get single notification
const getNotification = async (id, userId) => {
  const notification = await Notification.findOne({
    where: { id, userId }
  });
  
  if (!notification) throw new Error('Notification not found');
  
  return notification;
};

// Mark as read
const markAsRead = async (id, userId) => {
  const notification = await Notification.findOne({
    where: { id, userId }
  });
  
  if (!notification) throw new Error('Notification not found');
  
  await notification.update({ isRead: true });
  
  return notification;
};

// Delete notification
const deleteNotification = async (id, userId) => {
  const notification = await Notification.findOne({
    where: { id, userId }
  });
  
  if (!notification) throw new Error('Notification not found');
  
  await notification.destroy();
};

// Set preferences
const setPreferences = async (userId, preferences) => {
  const { emailEnabled, pushEnabled, smsEnabled, notificationTypes } = preferences;
  
  // In a real app, you'd store this in a NotificationPreference model
  // For now, we'll return the preferences
  
  return {
    userId,
    emailEnabled: emailEnabled || false,
    pushEnabled: pushEnabled || true,
    smsEnabled: smsEnabled || false,
    notificationTypes: notificationTypes || ['trip_status', 'order_update', 'driver_alert'],
    message: 'Preferences saved'
  };
};

module.exports = {
  listNotifications,
  getNotification,
  markAsRead,
  deleteNotification,
  setPreferences
};
