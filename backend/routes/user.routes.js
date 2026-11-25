const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { getUsers, getUser, updateProfile, updateUser, deleteUser, getUserStats, getOfficersByDepartment } = require('../controllers/user.controller');

router.use(protect);

router.get('/stats', adminOnly, getUserStats);
router.get('/officers/:departmentId', adminOnly, getOfficersByDepartment);
router.put('/profile', updateProfile);

router.get('/', adminOnly, getUsers);
router.route('/:id')
  .get(adminOnly, getUser)
  .put(adminOnly, updateUser)
  .delete(adminOnly, deleteUser);

module.exports = router;
