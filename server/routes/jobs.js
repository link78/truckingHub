const express = require('express');
const {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  claimJob,
  updateJobStatus,
  placeBid,
} = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router
  .route('/')
  .get(protect, getJobs)
  .post(protect, authorize('dispatcher', 'shipper'), createJob);

router
  .route('/:id')
  .get(protect, getJob)
  .put(protect, updateJob)
  .delete(protect, deleteJob);

router.post('/:id/claim', protect, authorize('trucker'), claimJob);
router.put('/:id/status', protect, updateJobStatus);
router.post('/:id/bid', protect, authorize('trucker'), placeBid);

module.exports = router;
