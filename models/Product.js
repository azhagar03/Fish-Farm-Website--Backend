// models/Product.js - Product/Item schema for the fish farm shop
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['Fish', 'Filter', 'Equipment', 'Feed', 'Medicine', 'Accessories', 'Transport', 'Other'],
    default: 'Other'
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  unit: {
    type: String,
    enum: ['Pcs', 'Nos', 'Kg', 'Ltr', 'Round', 'Set', 'Pair','Tank','Dozen','Glass','Meter','Big','Group','Free'],
    default: 'Pcs'
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  image: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
