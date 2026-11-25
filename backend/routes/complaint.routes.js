const router = require('express').Router();
const { protect, adminOnly, officerOrAdmin } = require('../middleware/auth.middleware');
const {
  createComplaint, getComplaints, getComplaint, trackComplaint,
  updateStatus, assignComplaint, escalateComplaint, submitFeedback,
  addComment, deleteComplaint, getStats
} = require('../controllers/complaint.controller');

// Public
router.get('/track/:complaintNumber', trackComplaint);

// Protected
router.use(protect);

router.route('/')
  .get(getComplaints)
  .post(createComplaint);

router.get('/stats', getStats);

router.route('/:id')
  .get(getComplaint)
  .delete(adminOnly, deleteComplaint);

router.put('/:id/status', officerOrAdmin, updateStatus);
router.put('/:id/assign', adminOnly, assignComplaint);
router.put('/:id/escalate', adminOnly, escalateComplaint);
router.post('/:id/feedback', submitFeedback);
router.post('/:id/comment', officerOrAdmin, addComment);

module.exports = router;
