const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { getSummaryReport, getDepartmentReport, getOfficerReport } = require('../controllers/report.controller');

router.use(protect, adminOnly);

router.get('/summary', getSummaryReport);
router.get('/departments', getDepartmentReport);
router.get('/officers', getOfficerReport);

module.exports = router;
