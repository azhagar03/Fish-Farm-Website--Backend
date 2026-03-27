// models/AccountingYear.js
const mongoose = require('mongoose');

const accountingYearSchema = new mongoose.Schema({
  label: { type: String, required: true, unique: true }, // e.g. "2025-2026"
  startMonth: { type: Number, default: 4 },  // April = 4
  startYear: { type: Number, required: true }, // e.g. 2025
  endYear: { type: Number, required: true },   // e.g. 2026
  isActive: { type: Boolean, default: false },
  invoiceCounter: { type: Number, default: 0 }, // last used invoice number in this year
}, { timestamps: true });

module.exports = mongoose.model('AccountingYear', accountingYearSchema);
