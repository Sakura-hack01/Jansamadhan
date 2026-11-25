const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { getCenters, seedCenters, createCenter } = require('../controllers/center.controller');

router.get('/', getCenters);
router.post('/seed', protect, adminOnly, seedCenters);
router.post('/', protect, adminOnly, createCenter);

module.exports = router;
