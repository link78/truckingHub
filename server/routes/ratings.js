const express = require('express');
const {
  createRating,
  getUserRatings,
  getJobRatings,
} = require('../controllers/ratingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createRating);
// NOTE: Public endpoint for marketplace transparency - users can see ratings before choosing truckers/dispatchers
// TODO: Consider privacy controls or rate limiting in production
router.get('/user/:userId', getUserRatings); // Public - marketplace transparency
router.get('/job/:jobId', protect, getJobRatings); // Protected - job participants only

module.exports = router;
