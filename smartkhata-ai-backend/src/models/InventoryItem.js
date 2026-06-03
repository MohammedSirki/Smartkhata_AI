const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    stock: {
      type: Number,
      default: 0,
    },
    costPrice: {
      type: Number,
      default: 0,
    },
    sellingPrice: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['healthy', 'low', 'critical'],
      default: 'healthy',
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
