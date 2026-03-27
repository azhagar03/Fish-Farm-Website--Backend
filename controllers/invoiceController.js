// controllers/invoiceController.js - Updated with accounting year, GST, customer balance
const Invoice = require('../models/Invoice');
const AccountingYear = require('../models/AccountingYear');
const Customer = require('../models/Customer');

// Get next invoice number for active accounting year
const getNextInvoiceNo = async () => {
  // $inc is atomic — even if all invoices are deleted, counter never goes back
  const activeYear = await AccountingYear.findOneAndUpdate(
    { isActive: true },
    { $inc: { invoiceCounter: 1 } },
    { new: true }           // returns the doc AFTER increment
  );

  if (!activeYear) {
    // Fallback: no accounting year configured — use a global sequence
    // Use a separate counter doc or just error out gracefully
    throw new Error('No active accounting year found. Please set one in Accounting Years.');
  }

  return {
    no: activeYear.invoiceCounter,   // this is now the incremented value
    yearId: activeYear._id,
    yearLabel: activeYear.label
  };
};

const calcTotals = (items, cgstPercent, sgstPercent, transport) => {
  let subtotal = 0;
  let totalDiscount = 0;
  const calcItems = items.map((item, idx) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    const disc = parseFloat(item.discount) || 0;
    const amount = parseFloat(((qty * rate) - disc).toFixed(2));
    subtotal += amount;
    totalDiscount += disc;
    return { ...item, slNo: idx + 1, amount };
  });
  subtotal = parseFloat(subtotal.toFixed(2));
  const cgstAmount = parseFloat(((subtotal * (cgstPercent || 0)) / 100).toFixed(2));
  const sgstAmount = parseFloat(((subtotal * (sgstPercent || 0)) / 100).toFixed(2));
  const totalGst = parseFloat((cgstAmount + sgstAmount).toFixed(2));
  const grandTotal = parseFloat((subtotal + totalGst).toFixed(2));
  const transportAmt = parseFloat(transport || 0);
  const netAmount = parseFloat((grandTotal + transportAmt).toFixed(2));
  return { calcItems, subtotal, totalDiscount: parseFloat(totalDiscount.toFixed(2)), cgstAmount, sgstAmount, totalGst, grandTotal, netAmount };
};

const calculateInvoiceTotal = (req, res) => {
  try {
    const { items, cgstPercent, sgstPercent, transport } = req.body;
    if (!items || !Array.isArray(items)) return res.status(400).json({ success: false, message: 'Items array required' });
    const result = calcTotals(items, cgstPercent, sgstPercent, transport);
    res.json({ success: true, data: { items: result.calcItems, subtotal: result.subtotal, totalDiscount: result.totalDiscount, cgstAmount: result.cgstAmount, sgstAmount: result.sgstAmount, totalGst: result.totalGst, grandTotal: result.grandTotal, netAmount: result.netAmount } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAllInvoices = async (req, res) => {
  try {
    const { startDate, endDate, period, customerId } = req.query;
    let filter = {};
    if (customerId) filter.customerId = customerId;

    const now = new Date();
    if (period === 'day') {
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      filter.invoiceDate = { $gte: start };
    } else if (period === 'week') {
      const start = new Date(now); start.setDate(now.getDate() - 7);
      filter.invoiceDate = { $gte: start };
    } else if (period === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      filter.invoiceDate = { $gte: start };
    } else if (period === 'year') {
      const start = new Date(now.getFullYear(), 0, 1);
      filter.invoiceDate = { $gte: start };
    } else if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) filter.invoiceDate.$gte = new Date(startDate);
      if (endDate) { const ed = new Date(endDate); ed.setHours(23, 59, 59); filter.invoiceDate.$lte = ed; }
    }

    const invoices = await Invoice.find(filter).sort({ invoiceNo: -1 });
    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createInvoice = async (req, res) => {
  try {
    const { items, cgstPercent, sgstPercent, transport, paidAmount, customerId, ...rest } = req.body;

    let no, yearId, yearLabel;
    try {
      ({ no, yearId, yearLabel } = await getNextInvoiceNo());
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }

    const result = calcTotals(items || [], cgstPercent, sgstPercent, transport);
    const paid = parseFloat(paidAmount || 0);
    const balance = parseFloat((result.netAmount - paid).toFixed(2));

    let paymentStatus = 'Pending';
    if (paid >= result.netAmount) paymentStatus = 'Paid';
    else if (paid > 0) paymentStatus = 'Partial';

    const invoice = await Invoice.create({
      ...rest,
      invoiceNo: no,
      accountingYearId: yearId,
      accountingYearLabel: yearLabel,
      items: result.calcItems,
      subtotal: result.subtotal,
      totalDiscount: result.totalDiscount,
      cgstPercent: parseFloat(cgstPercent || 0),
      sgstPercent: parseFloat(sgstPercent || 0),
      cgstAmount: result.cgstAmount,
      sgstAmount: result.sgstAmount,
      totalGst: result.totalGst,
      grandTotal: result.grandTotal,
      transport: parseFloat(transport || 0),
      netAmount: result.netAmount,
      paidAmount: paid,
      balanceAmount: balance < 0 ? 0 : balance,
      paymentStatus,
      customerId: customerId || null
    });

    if (customerId) {
      const customer = await Customer.findById(customerId);
      if (customer) {
        customer.balanceAmount = parseFloat((customer.balanceAmount + (balance < 0 ? 0 : balance)).toFixed(2));
        customer.totalPurchased = parseFloat((customer.totalPurchased + result.netAmount).toFixed(2));
        await customer.save();
      }
    }

    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Reset counter to match actual highest invoice in that year (migration helper)
const syncCounter = async (req, res) => {
  try {
    const year = await AccountingYear.findById(req.params.id);
    if (!year) return res.status(404).json({ success: false, message: 'Year not found' });

    const last = await Invoice.findOne({ accountingYearId: year._id }).sort({ invoiceNo: -1 });
    const maxNo = last ? last.invoiceNo : 0;

    // Only move counter forward, never back
    if (maxNo > year.invoiceCounter) {
      year.invoiceCounter = maxNo;
      await year.save();
    }

    res.json({ success: true, data: { invoiceCounter: year.invoiceCounter } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Add to exports:


const updateInvoice = async (req, res) => {
  try {
    const { items, cgstPercent, sgstPercent, transport, paidAmount, ...rest } = req.body;
    const result = items ? calcTotals(items, cgstPercent, sgstPercent, transport) : null;
    const paid = parseFloat(paidAmount || 0);

    let updateData = { ...rest };
    if (result) {
      const balance = parseFloat((result.netAmount - paid).toFixed(2));
      let paymentStatus = 'Pending';
      if (paid >= result.netAmount) paymentStatus = 'Paid';
      else if (paid > 0) paymentStatus = 'Partial';

      updateData = {
        ...updateData,
        items: result.calcItems,
        subtotal: result.subtotal,
        totalDiscount: result.totalDiscount,
        cgstPercent: parseFloat(cgstPercent || 0),
        sgstPercent: parseFloat(sgstPercent || 0),
        cgstAmount: result.cgstAmount,
        sgstAmount: result.sgstAmount,
        totalGst: result.totalGst,
        grandTotal: result.grandTotal,
        transport: parseFloat(transport || 0),
        netAmount: result.netAmount,
        paidAmount: paid,
        balanceAmount: balance < 0 ? 0 : balance,
        paymentStatus
      };
    }

    const invoice = await Invoice.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

    // Update customer balance if linked
    if (invoice.customerId) {
      const customer = await Customer.findById(invoice.customerId);
      if (customer) {
        customer.balanceAmount = parseFloat((customer.balanceAmount - invoice.balanceAmount).toFixed(2));
        customer.totalPurchased = parseFloat((customer.totalPurchased - invoice.netAmount).toFixed(2));
        if (customer.balanceAmount < 0) customer.balanceAmount = 0;
        if (customer.totalPurchased < 0) customer.totalPurchased = 0;
        await customer.save();
      }
    }

    res.json({ success: true, message: 'Invoice deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getSalesReport = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const now = new Date();
    let filter = {};

    if (period === 'day') {
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      filter.invoiceDate = { $gte: start };
    } else if (period === 'week') {
      const start = new Date(now); start.setDate(now.getDate() - 7);
      filter.invoiceDate = { $gte: start };
    } else if (period === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      filter.invoiceDate = { $gte: start };
    } else if (period === 'year') {
      const start = new Date(now.getFullYear(), 0, 1);
      filter.invoiceDate = { $gte: start };
    } else if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) filter.invoiceDate.$gte = new Date(startDate);
      if (endDate) { const ed = new Date(endDate); ed.setHours(23, 59, 59); filter.invoiceDate.$lte = ed; }
    }

    const invoices = await Invoice.find(filter).sort({ invoiceDate: 1 });
    const totalSales = invoices.reduce((s, i) => s + (i.netAmount || 0), 0);
    const totalGst = invoices.reduce((s, i) => s + (i.totalGst || 0), 0);
    const totalCgst = invoices.reduce((s, i) => s + (i.cgstAmount || 0), 0);
    const totalSgst = invoices.reduce((s, i) => s + (i.sgstAmount || 0), 0);
    const totalPaid = invoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
    const totalBalance = invoices.reduce((s, i) => s + (i.balanceAmount || 0), 0);

    res.json({ success: true, data: { invoices, totalSales, totalGst, totalCgst, totalSgst, totalPaid, totalBalance, count: invoices.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllInvoices, syncCounter, getInvoiceById, createInvoice, updateInvoice, deleteInvoice, calculateInvoiceTotal, getSalesReport };

