const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a job title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a job description'],
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    postedByRole: {
      type: String,
      enum: ['dispatcher', 'shipper'],
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['available', 'claimed', 'in_progress', 'delivered', 'cancelled', 'completed'],
      default: 'available',
    },
    pickup: {
      location: {
        type: String,
        required: true,
      },
      address: String,
      city: String,
      state: String,
      zipCode: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
      date: {
        type: Date,
        required: true,
      },
    },
    delivery: {
      location: {
        type: String,
        required: true,
      },
      address: String,
      city: String,
      state: String,
      zipCode: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
      date: {
        type: Date,
        required: true,
      },
    },
    cargo: {
      type: {
        type: String,
        required: true,
      },
      weight: Number,
      volume: Number,
      quantity: Number,
      specialRequirements: [String],
    },
    payment: {
      amount: {
        type: Number,
        required: true,
      },
      currency: {
        type: String,
        default: 'USD',
      },
      paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending',
      },
    },
    distance: {
      type: Number, // in miles
    },
    estimatedDuration: {
      type: Number, // in hours
    },
    requirements: {
      truckType: String,
      minCapacity: Number,
      certifications: [String],
    },
    bids: [
      {
        trucker: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        amount: Number,
        message: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    statusHistory: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        notes: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ postedBy: 1 });
jobSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('Job', jobSchema);
