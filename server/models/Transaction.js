const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    payer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    payee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    type: {
      type: String,
      enum: ['payment', 'refund', 'bonus'],
      default: 'payment',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'bank_transfer', 'wallet', 'cash'],
      default: 'credit_card',
    },
    transactionId: {
      type: String,
      unique: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique transaction ID
transactionSchema.pre('save', async function (next) {
  if (!this.transactionId) {
    this.transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
