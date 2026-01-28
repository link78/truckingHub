const mongoose = require('mongoose');
const crypto = require('crypto');

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

// Generate secure unique transaction ID using crypto
transactionSchema.pre('save', async function (next) {
  if (!this.transactionId) {
    const randomBytes = crypto.randomBytes(6).toString('hex').toUpperCase();
    this.transactionId = `TXN-${Date.now()}-${randomBytes}`;
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
