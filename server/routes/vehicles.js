const express = require('express');
const router = express.Router();
const {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleCompliance,
  updateVehicleLocation,
  getAvailableVehicles,
} = require('../controllers/vehicleController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Available vehicles route (must be before /:id)
router.get('/available', getAvailableVehicles);

// Base routes
router.route('/')
  .get(getVehicles)
  .post(createVehicle);

// Individual vehicle routes
router.route('/:id')
  .get(getVehicle)
  .put(updateVehicle)
  .delete(deleteVehicle);

// Vehicle compliance
router.get('/:id/compliance', getVehicleCompliance);

// Update vehicle location
router.put('/:id/location', updateVehicleLocation);

module.exports = router;
