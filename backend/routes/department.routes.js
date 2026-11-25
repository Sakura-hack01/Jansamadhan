const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { getDepartments, createDepartment, updateDepartment, deleteDepartment, seedDepartments } = require('../controllers/department.controller');

router.get('/', getDepartments);

router.use(protect, adminOnly);
router.post('/seed', seedDepartments);
router.post('/', createDepartment);
router.put('/:id', updateDepartment);
router.delete('/:id', deleteDepartment);

module.exports = router;
