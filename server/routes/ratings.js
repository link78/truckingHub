const express = require('express');
const {
  createRating,
  getUserRatings,
  getJobRatings,
} = require('../controllers/ratingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createRating);
router.get('/user/:userId', getUserRatings);
router.get('/job/:jobId', protect, getJobRatings);

module.exports = router;
