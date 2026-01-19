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
  .get(getServices) // Public - anyone can browse services
  .post(protect, authorize('service_provider'), createService);

router
  .route('/:id')
  .get(getService) // Public - anyone can view service details
  .put(protect, updateService)
  .delete(protect, deleteService);

module.exports = router;
