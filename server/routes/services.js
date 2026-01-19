const express = require('express');
const {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
} = require('../controllers/serviceController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// NOTE: GET endpoints are intentionally public for marketplace browsing
// TODO: Add rate limiting in production to prevent abuse/DDoS
router
  .route('/')
  .get(getServices) // Public - marketplace browsing
  .post(protect, authorize('service_provider'), createService);

router
  .route('/:id')
  .get(getService) // Public - service details
  .put(protect, updateService)
  .delete(protect, deleteService);

module.exports = router;
