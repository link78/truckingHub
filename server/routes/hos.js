const express = require('express');
const router = express.Router();
const {
  getHOSLogs,
  getHOSLog,
  createHOSLog,
  updateHOSLog,
  deleteHOSLog,
  addDutyStatus,
  completeHOSLog,
  certifyHOSLog,
  getHOSSummary,
  reviewHOSLog,
} = require('../controllers/hosController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Summary route (must be before /:id)
router.get('/summary', getHOSSummary);

// Base routes
router.route('/')
  .get(getHOSLogs)
  .post(createHOSLog);

// Individual HOS log routes
router.route('/:id')
  .get(getHOSLog)
  .put(updateHOSLog)
  .delete(deleteHOSLog);

// HOS log actions
router.post('/:id/status', addDutyStatus);
router.post('/:id/complete', completeHOSLog);
router.post('/:id/certify', certifyHOSLog);
router.put('/:id/review', reviewHOSLog);

module.exports = router;
