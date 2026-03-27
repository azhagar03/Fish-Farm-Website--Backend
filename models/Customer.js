// models/Customer.js
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true, default: 'Tamil Nadu' },
  balanceAmount: { type: Number, default: 0 }, // outstanding balance
  totalPurchased: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
