// controllers/invoiceController.js
const Invoice = require('../models/Invoice');

// ─── Real-time total calculation (no DB save) ─────────────────────────────────
const calculateInvoiceTotal = (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Items array required' });
    }

    let subtotal = 0;
    let totalDiscount = 0;

    const calculatedItems = items.map((item, idx) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const disc = parseFloat(item.discount) || 0;
      const amount = parseFloat(((qty * rate) - disc).toFixed(2));
      subtotal += amount;
      totalDiscount += disc;
      return { ...item, slNo: idx + 1, amount };
    });

    res.json({
      success: true,
      data: {
        items: calculatedItems,
        subtotal: parseFloat(subtotal.toFixed(2)),
        totalDiscount: parseFloat(totalDiscount.toFixed(2)),
        grandTotal: parseFloat(subtotal.toFixed(2))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET all invoices
const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ invoiceNo: -1 });
    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET single invoice
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST create invoice
const createInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.create(req.body);
    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT update invoice
const updateInvoice = async (req, res) => {
  try {
    // For update, recalculate totals manually
    if (req.body.items) {
      let subtotal = 0;
      req.body.items.forEach((item, idx) => {
        item.slNo = idx + 1;
        item.amount = parseFloat(((item.quantity * item.rate) - (item.discount || 0)).toFixed(2));
        subtotal += item.amount;
      });
      req.body.subtotal = parseFloat(subtotal.toFixed(2));
      req.body.grandTotal = req.body.subtotal;
    }

    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE invoice
const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, message: 'Invoice deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllInvoices, getInvoiceById, createInvoice, updateInvoice, deleteInvoice, calculateInvoiceTotal };
