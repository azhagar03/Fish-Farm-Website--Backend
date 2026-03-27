// controllers/accountingYearController.js
const AccountingYear = require('../models/AccountingYear');
const Invoice = require('../models/Invoice');

const getAllYears = async (req, res) => {
  try {
    const years = await AccountingYear.find().sort({ startYear: -1 });
    res.json({ success: true, data: years });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getActiveYear = async (req, res) => {
  try {
    const year = await AccountingYear.findOne({ isActive: true });
    res.json({ success: true, data: year });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// controllers/accountingYearController.js

const createYear = async (req, res) => {
  try {
    const { startYear, setActive } = req.body;
    const endYear = startYear + 1;
    const label = `${startYear}-${endYear}`;
    const exists = await AccountingYear.findOne({ label });
    if (exists) return res.status(400).json({ success: false, message: 'Year already exists' });

    if (setActive) {
      await AccountingYear.updateMany({}, { isActive: false });
    }
    const year = await AccountingYear.create({
      label,
      startYear,
      endYear,
      startMonth: 4,
      isActive: !!setActive,
      invoiceCounter: 0   // starts at 0; first invoice will be 1
    });
    res.status(201).json({ success: true, data: year });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const setActiveYear = async (req, res) => {
  try {
    await AccountingYear.updateMany({}, { isActive: false });
    const year = await AccountingYear.findByIdAndUpdate(
      req.params.id,
      { isActive: true },   // do NOT reset invoiceCounter — it holds history
      { new: true }
    );
    if (!year) return res.status(404).json({ success: false, message: 'Year not found' });
    res.json({ success: true, data: year });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getYearRevenue = async (req, res) => {
  try {
    const year = await AccountingYear.findById(req.params.id);
    if (!year) return res.status(404).json({ success: false, message: 'Year not found' });

    // Build date range: April startYear to March endYear
    const startDate = new Date(year.startYear, 3, 1); // April 1
    const endDate = new Date(year.endYear, 2, 31, 23, 59, 59); // March 31

    const invoices = await Invoice.find({
      invoiceDate: { $gte: startDate, $lte: endDate }
    });

    // Group by month
    const monthLabels = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];
    const monthNums = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

    const monthlyData = monthLabels.map((label, i) => {
      const m = monthNums[i];
      const yr = m >= 4 ? year.startYear : year.endYear;
      const monthInvoices = invoices.filter(inv => {
        const d = new Date(inv.invoiceDate);
        return d.getMonth() + 1 === m && d.getFullYear() === yr;
      });
      const revenue = monthInvoices.reduce((sum, inv) => sum + (inv.netAmount || inv.grandTotal || 0), 0);
      const gst = monthInvoices.reduce((sum, inv) => sum + (inv.totalGst || 0), 0);
      return { month: label, revenue, gst, count: monthInvoices.length };
    });

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.netAmount || inv.grandTotal || 0), 0);
    const totalGst = invoices.reduce((sum, inv) => sum + (inv.totalGst || 0), 0);

    res.json({ success: true, data: { monthlyData, totalRevenue, totalGst, invoiceCount: invoices.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllYears, getActiveYear, createYear, setActiveYear, getYearRevenue };
