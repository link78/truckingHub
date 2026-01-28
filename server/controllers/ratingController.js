const Rating = require('../models/Rating');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create a rating
// @route   POST /api/ratings
// @access  Private
exports.createRating = async (req, res) => {
  try {
    const { job, ratedUser, rating, review, categories } = req.body;

    // Check if already rated
    const existingRating = await Rating.findOne({
      job,
      ratedBy: req.user.id,
    });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'You have already rated this job',
      });
    }

    const newRating = await Rating.create({
      job,
      ratedUser,
      ratedBy: req.user.id,
      rating,
      review,
      categories,
    });

    // Update user's average rating
    const ratings = await Rating.find({ ratedUser });
    const avgRating = ratings.reduce((acc, item) => acc + item.rating, 0) / ratings.length;

    await User.findByIdAndUpdate(ratedUser, {
      rating: avgRating.toFixed(2),
      reviewCount: ratings.length,
    });

    // Notify rated user
    await Notification.create({
      recipient: ratedUser,
      sender: req.user.id,
      type: 'new_rating',
      title: 'New Rating Received',
      message: `You received a ${rating}-star rating`,
      link: `/profile/${ratedUser}`,
    });

    res.status(201).json({
      success: true,
      data: newRating,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get ratings for a user
// @route   GET /api/ratings/user/:userId
// @access  Public
exports.getUserRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({ ratedUser: req.params.userId })
      .populate('ratedBy', 'name company role')
      .populate('job', 'title')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: ratings.length,
      data: ratings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get ratings for a job
// @route   GET /api/ratings/job/:jobId
// @access  Private
exports.getJobRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({ job: req.params.jobId })
      .populate('ratedUser', 'name company role')
      .populate('ratedBy', 'name company role');

    res.status(200).json({
      success: true,
      count: ratings.length,
      data: ratings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
