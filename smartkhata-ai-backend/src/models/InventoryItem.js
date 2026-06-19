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
    normalizedName: {
      type: String,
      trim: true,
      default: '',
    },
    aliases: {
      type: [String],
      default: [],
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

const normalizeItemName = (name) => String(name || '')
  .toLowerCase()
  .trim()
  .replace(/\s+/g, ' ');

const getInventoryStatus = (stock) => {
  if (stock <= 20) return 'critical';
  if (stock <= 50) return 'low';
  return 'healthy';
};

inventoryItemSchema.pre('validate', function setStatus() {
  this.name = normalizeItemName(this.name);
  this.normalizedName = normalizeItemName(this.normalizedName || this.name);
  this.aliases = [...new Set((this.aliases || []).map(normalizeItemName).filter(Boolean))]
    .filter((alias) => alias !== this.normalizedName);
  this.status = getInventoryStatus(this.stock);
});

inventoryItemSchema.index({ user: 1, business: 1, normalizedName: 1 }, { unique: true });

inventoryItemSchema.statics.getInventoryStatus = getInventoryStatus;

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
