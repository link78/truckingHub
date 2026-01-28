const express = require('express');
const router = express.Router();
const {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  downloadDocument,
  reviewDocument,
  shareDocument,
  getJobDocuments,
  getVehicleDocuments,
} = require('../controllers/documentController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Special routes (must be before /:id)
router.get('/job/:jobId', getJobDocuments);
router.get('/vehicle/:vehicleId', getVehicleDocuments);

// Base routes
router.route('/')
  .get(getDocuments)
  .post(createDocument);

// Individual document routes
router.route('/:id')
  .get(getDocument)
  .put(updateDocument)
  .delete(deleteDocument);

// Document actions
router.get('/:id/download', downloadDocument);
router.put('/:id/review', reviewDocument);
router.put('/:id/share', shareDocument);

module.exports = router;
