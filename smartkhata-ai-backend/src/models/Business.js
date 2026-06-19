const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required.'],
      trim: true,
    },
    gstNumber: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    currency: {
      type: String,
      default: 'INR',
    },
    language: {
      type: String,
      default: 'English',
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Business', businessSchema);
