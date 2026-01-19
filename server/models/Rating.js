const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    ratedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ratedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      trim: true,
    },
    categories: {
      professionalism: {
        type: Number,
        min: 1,
        max: 5,
      },
      communication: {
        type: Number,
        min: 1,
        max: 5,
      },
      timeliness: {
        type: Number,
        min: 1,
        max: 5,
      },
      quality: {
        type: Number,
        min: 1,
        max: 5,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate ratings for the same job by the same user
ratingSchema.index({ job: 1, ratedBy: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
