const express = require('express');
const router = express.Router();
const {
  getAutomationRules,
  getAutomationRule,
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  toggleAutomationRule,
  executeAutomationRule,
  getAutomationStats,
} = require('../controllers/automationController');
const { protect } = require('../middleware/auth');

// All routes are protected (admin only)
router.use(protect);

// Stats route (must be before /:id)
router.get('/stats', getAutomationStats);

// Base routes
router.route('/')
  .get(getAutomationRules)
  .post(createAutomationRule);

// Individual automation rule routes
router.route('/:id')
  .get(getAutomationRule)
  .put(updateAutomationRule)
  .delete(deleteAutomationRule);

// Automation rule actions
router.put('/:id/toggle', toggleAutomationRule);
router.post('/:id/execute', executeAutomationRule);

module.exports = router;
