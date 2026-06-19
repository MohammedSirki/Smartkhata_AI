const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    rawText: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['sale', 'purchase', 'expense', 'return'],
      required: true,
    },
    item: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    unitPrice: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    paymentMode: {
      type: String,
      enum: ['cash', 'upi', 'card', 'bank', 'credit', 'other'],
      default: 'cash',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ business: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
