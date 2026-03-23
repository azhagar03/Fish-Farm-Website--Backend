// models/Invoice.js - Invoice schema matching the physical invoice format
const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  slNo: { type: Number },
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0.1 },
  pack: { type: String, default: 'Pcs' },
  rate: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  amount: { type: Number }  // auto-calculated: (quantity * rate) - discount
});

// Auto-calculate amount before saving each item
invoiceItemSchema.pre('save', function (next) {
  this.amount = (this.quantity * this.rate) - (this.discount || 0);
  next();
});

const invoiceSchema = new mongoose.Schema({
  invoiceNo: {
    type: Number,
    unique: true
  },
  invoiceDate: {
    type: Date,
    default: Date.now
  },
  buyerName: {
    type: String,
    required: [true, 'Buyer name is required'],
    trim: true
  },
  buyerAddress: {
    type: String,
    trim: true
  },
  buyerPhone: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    default: 'Tamil Nadu'
  },
  stateCode: {
    type: String,
    default: '33'
  },
  gstin: {
    type: String,
    default: '33ARIPM4129M1ZK'
  },
  items: [invoiceItemSchema],
  subtotal: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Partial'],
    default: 'Pending'
  },
  notes: { type: String }
}, {
  timestamps: true
});

// Auto-generate invoice number and calculate totals before saving
invoiceSchema.pre('save', async function (next) {
  // Auto invoice number
  if (!this.invoiceNo) {
    const last = await this.constructor.findOne({}, {}, { sort: { invoiceNo: -1 } });
    this.invoiceNo = last ? last.invoiceNo + 1 : 2284;
  }

  // Recalculate items amounts and totals
  let subtotal = 0;
  let totalDiscount = 0;
  this.items.forEach((item, idx) => {
    item.slNo = idx + 1;
    item.amount = parseFloat(((item.quantity * item.rate) - (item.discount || 0)).toFixed(2));
    subtotal += item.amount;
    totalDiscount += item.discount || 0;
  });

  this.subtotal = parseFloat(subtotal.toFixed(2));
  this.totalDiscount = parseFloat(totalDiscount.toFixed(2));
  this.grandTotal = this.subtotal; // No GST for now (can add)
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
