// models/Invoice.js
// ── CRITICAL FIX ─────────────────────────────────────────────────────────────
// OLD (WRONG):  invoiceNo: { type: Number, unique: true }
//               → invoiceNo #1 in year 2025-26 and #1 in year 2026-27 = DUPLICATE KEY ERROR
//
// NEW (CORRECT): compound unique index on { invoiceNo + accountingYearId }
//               → same number is allowed in different years ✅
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  slNo:        { type: Number },
  description: { type: String, required: true },
  quantity:    { type: Number, default: 0 },
  pack:        { type: String, default: 'Pcs' },
  rate:        { type: Number, default: 0 },
  discount:    { type: Number, default: 0 },
  amount:      { type: Number, default: 0 },
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  // ── Invoice number — NOT globally unique, unique per accounting year ──
  invoiceNo:           { type: Number, required: true },   // ← removed unique:true
  accountingYearId:    { type: mongoose.Schema.Types.ObjectId, ref: 'AccountingYear' },
  accountingYearLabel: { type: String },

  // ── Buyer info ──
  buyerName:    { type: String, required: true },
  buyerAddress: { type: String },
  buyerPhone:   { type: String },
  buyerCity:    { type: String },
  customerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },

  // ── GST / location ──
  state:     { type: String, default: 'Tamil Nadu' },
  stateCode: { type: String, default: '33' },
  gstin:     { type: String, default: '33ARIPM4129M1ZK' },

  // ── Items ──
  items: [invoiceItemSchema],

  // ── Totals ──
  subtotal:      { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  cgstPercent:   { type: Number, default: 0 },
  sgstPercent:   { type: Number, default: 0 },
  cgstAmount:    { type: Number, default: 0 },
  sgstAmount:    { type: Number, default: 0 },
  totalGst:      { type: Number, default: 0 },
  grandTotal:    { type: Number, default: 0 },
  transport:     { type: Number, default: 0 },
  netAmount:     { type: Number, default: 0 },

  // ── Payment ──
  paidAmount:    { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Partial'], default: 'Pending' },

  // ── Meta ──
  invoiceDate: { type: Date, default: Date.now },
  notes:       { type: String },

}, { timestamps: true });

// ── COMPOUND UNIQUE INDEX: same invoiceNo allowed in different years ──────────
// This replaces the old single-field unique:true on invoiceNo
invoiceSchema.index(
  { invoiceNo: 1, accountingYearId: 1 },
  { unique: true, name: 'invoiceNo_per_year' }
);

// ── Additional useful indexes ─────────────────────────────────────────────────
invoiceSchema.index({ invoiceDate: -1 });
invoiceSchema.index({ customerId: 1 });
invoiceSchema.index({ accountingYearId: 1 });
invoiceSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);