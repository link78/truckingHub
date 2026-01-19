const express = require('express');
const {
  createRating,
  getUserRatings,
  getJobRatings,
} = require('../controllers/ratingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createRating);
router.get('/user/:userId', getUserRatings); // Public - marketplace transparency (consider adding privacy controls)
router.get('/job/:jobId', protect, getJobRatings); // Protected - job participants only

module.exports = router;
