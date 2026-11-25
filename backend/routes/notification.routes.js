const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { getNotifications, markAsRead, markAllAsRead, deleteNotification } = require('../controllers/notification.controller');

router.use(protect);
router.get('/', getNotifications);
router.put('/mark-all-read', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
