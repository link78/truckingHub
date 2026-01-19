const express = require('express');
const {
  createRating,
  getUserRatings,
  getJobRatings,
} = require('../controllers/ratingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createRating);
router.get('/user/:userId', getUserRatings); // Public - anyone can view user ratings
router.get('/job/:jobId', protect, getJobRatings); // Protected - only authenticated users can view job ratings

module.exports = router;
