const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a service title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a service description'],
    },
    category: {
      type: String,
      enum: ['maintenance', 'fueling', 'roadside_assistance', 'tire_service', 'repair', 'other'],
      required: true,
    },
    pricing: {
      basePrice: {
        type: Number,
        required: true,
      },
      pricingType: {
        type: String,
        enum: ['fixed', 'hourly', 'quote'],
        default: 'fixed',
      },
      currency: {
        type: String,
        default: 'USD',
      },
    },
    availability: {
      isAvailable: {
        type: Boolean,
        default: true,
      },
      workingHours: {
        monday: { start: String, end: String },
        tuesday: { start: String, end: String },
        wednesday: { start: String, end: String },
        thursday: { start: String, end: String },
        friday: { start: String, end: String },
        saturday: { start: String, end: String },
        sunday: { start: String, end: String },
      },
      is24_7: {
        type: Boolean,
        default: false,
      },
    },
    serviceArea: {
      cities: [String],
      states: [String],
      radius: Number, // in miles
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    bookings: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for searching services
serviceSchema.index({ category: 1, 'availability.isAvailable': 1 });

module.exports = mongoose.model('Service', serviceSchema);
