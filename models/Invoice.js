// models/Invoice.js - Updated with GST, accounting year, customer linking
const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  slNo: { type: Number },
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0.1 },
  pack: { type: String, default: 'Pcs' },
  rate: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  amount: { type: Number }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNo: { type: Number },
  accountingYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AccountingYear' },
  accountingYearLabel: { type: String },
  invoiceDate: { type: Date, default: Date.now },

  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  buyerName: { type: String, required: true, trim: true },
  buyerAddress: { type: String, trim: true },
  buyerPhone: { type: String, trim: true },
  buyerCity: { type: String, trim: true },

  state: { type: String, default: 'Tamil Nadu' },
  stateCode: { type: String, default: '33' },
  gstin: { type: String, default: '33ARIPM4129M1ZK' },

  items: [invoiceItemSchema],
  subtotal: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },

  cgstPercent: { type: Number, default: 0 },
  sgstPercent: { type: Number, default: 0 },
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  totalGst: { type: Number, default: 0 },

  grandTotal: { type: Number, default: 0 },
  transport: { type: Number, default: 0 },
  netAmount: { type: Number, default: 0 },

  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Partial'],
    default: 'Pending'
  },
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 },

  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
