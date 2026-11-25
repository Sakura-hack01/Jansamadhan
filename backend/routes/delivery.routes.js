const router = require('express').Router();
const { protect, adminOnly, officerOrAdmin } = require('../middleware/auth.middleware');
const {
  createDelivery, getDeliveries, getDelivery, trackDelivery,
  updateDeliveryStatus, rateDelivery, getDeliveryStats
} = require('../controllers/delivery.controller');

router.get('/track/:orderNumber', trackDelivery);

router.use(protect);

router.get('/stats', adminOnly, getDeliveryStats);

router.route('/')
  .get(getDeliveries)
  .post(createDelivery);

router.route('/:id')
  .get(getDelivery);

router.put('/:id/status', officerOrAdmin, updateDeliveryStatus);
router.post('/:id/rate', rateDelivery);

module.exports = router;
