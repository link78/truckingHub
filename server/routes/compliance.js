const express = require('express');
const router = express.Router();
const {
  getComplianceRecords,
  getComplianceRecord,
  createComplianceRecord,
  updateComplianceRecord,
  deleteComplianceRecord,
  getComplianceSummary,
  checkAllCompliance,
  verifyComplianceRecord,
} = require('../controllers/complianceController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Dashboard summary route (must be before /:id)
router.get('/dashboard/summary', getComplianceSummary);

// Check all compliance (admin only)
router.post('/check-all', checkAllCompliance);

// Base routes
router.route('/')
  .get(getComplianceRecords)
  .post(createComplianceRecord);

// Individual compliance record routes
router.route('/:id')
  .get(getComplianceRecord)
  .put(updateComplianceRecord)
  .delete(deleteComplianceRecord);

// Verify compliance record
router.put('/:id/verify', verifyComplianceRecord);

module.exports = router;
