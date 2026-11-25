const Notification = require('../models/Notification');

exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const { notifications, total, unreadCount } = await Notification.findByUser(req.user.id, {
      page,
      limit,
      unreadOnly: unreadOnly === 'true',
    });

    res.json({ success: true, data: notifications, unreadCount, pagination: { total, page: Number(page) } });
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    await Notification.markAsRead(req.params.id);
    res.json({ success: true, message: 'Marked as read.' });
  } catch (error) {
    next(error);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.markAllAsRead(req.user.id);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    await Notification.deleteById(req.params.id);
    res.json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    next(error);
  }
};
