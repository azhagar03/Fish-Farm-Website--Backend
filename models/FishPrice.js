// models/FishPrice.js - Live fish market price tracking
const mongoose = require('mongoose');

const fishPriceSchema = new mongoose.Schema({
  fishName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Ornamental', 'Food Fish', 'Tropical', 'Coldwater', 'Marine'],
    default: 'Ornamental'
  },
  currentPrice: {
    type: Number,
    required: true,
    min: 0
  },
  previousPrice: {
    type: Number,
    default: 0
  },
  unit: {
    type: String,
    default: 'per piece'
  },
  priceChange: {
    type: Number,
    default: 0  // positive = price went up, negative = price went down
  },
  availability: {
    type: String,
    enum: ['In Stock', 'Limited', 'Out of Stock'],
    default: 'In Stock'
  },
  origin: {
    type: String,
    default: 'Local'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate price change before saving
fishPriceSchema.pre('save', function (next) {
  if (this.previousPrice && this.previousPrice > 0) {
    this.priceChange = parseFloat(((this.currentPrice - this.previousPrice) / this.previousPrice * 100).toFixed(2));
  }
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('FishPrice', fishPriceSchema);
