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

router
  .route('/')
  .get(getServices) // Public - marketplace browsing (consider rate limiting in production)
  .post(protect, authorize('service_provider'), createService);

router
  .route('/:id')
  .get(getService) // Public - service details (consider rate limiting in production)
  .put(protect, updateService)
  .delete(protect, deleteService);

module.exports = router;
