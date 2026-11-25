const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { getSettings, updateSetting, bulkUpdateSettings, initDefaultSettings } = require('../controllers/settings.controller');

router.use(protect);
router.get('/', getSettings);
router.post('/init', adminOnly, initDefaultSettings);
router.put('/', adminOnly, updateSetting);
router.put('/bulk', adminOnly, bulkUpdateSettings);

module.exports = router;
