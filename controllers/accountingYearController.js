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
    if (!year) return res.status(404).json({ success: false, message: 'No active year found' });
    res.json({ success: true, data: year });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Returns the NEXT invoice number that will be assigned (counter + 1)
// Used by frontend to preview invoice number before saving
const getNextInvoiceNoPreview = async (req, res) => {
  try {
    const year = await AccountingYear.findOne({ isActive: true });
    if (!year) return res.status(400).json({ success: false, message: 'No active accounting year found' });
    res.json({
      success: true,
      data: {
        nextNo: (year.invoiceCounter || 0) + 1,
        yearLabel: year.label,
        yearId: year._id,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createYear = async (req, res) => {
  try {
    const { startYear, setActive } = req.body;
    const sy = parseInt(startYear);
    if (!sy || sy < 2000 || sy > 2100) {
      return res.status(400).json({ success: false, message: 'Invalid start year' });
    }
    const endYear = sy + 1;
    const label = `${sy}-${endYear}`;

    const exists = await AccountingYear.findOne({ label });
    if (exists) return res.status(400).json({ success: false, message: `FY ${label} already exists` });

    if (setActive) {
      await AccountingYear.updateMany({}, { isActive: false });
    }

    const year = await AccountingYear.create({
      label,
      startYear: sy,
      endYear,
      startMonth: 4,
      isActive: !!setActive,
      invoiceCounter: 0   // Always starts at 0 — first invoice will get #1 via $inc
    });

    res.status(201).json({ success: true, data: year });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// KEY FIX: When activating a year, we DO NOT touch invoiceCounter at all.
// - Fresh year (invoiceCounter === 0): $inc in getNextInvoiceNo will give #1 automatically ✅
// - Previous year (invoiceCounter > 0): continues from where it left off ✅
// So just flip isActive — nothing else needed.
const setActiveYear = async (req, res) => {
  try {
    // Step 1: Deactivate all years
    await AccountingYear.updateMany({}, { isActive: false });

    // Step 2: Activate the requested year — counter stays untouched
    const year = await AccountingYear.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );

    if (!year) return res.status(404).json({ success: false, message: 'Year not found' });

    res.json({
      success: true,
      data: year,
      message: year.invoiceCounter === 0
        ? `FY ${year.label} activated — invoices will start from #1`
        : `FY ${year.label} activated — continuing from #${year.invoiceCounter + 1}`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getYearRevenue = async (req, res) => {
  try {
    const year = await AccountingYear.findById(req.params.id);
    if (!year) return res.status(404).json({ success: false, message: 'Year not found' });

    const startDate = new Date(year.startYear, 3, 1);        // April 1
    const endDate   = new Date(year.endYear, 2, 31, 23, 59, 59); // March 31

    const invoices = await Invoice.find({
      accountingYearId: year._id,   // ← filter by yearId, not just date range (more accurate)
      invoiceDate: { $gte: startDate, $lte: endDate }
    });

    const monthLabels = ['April','May','June','July','August','September','October','November','December','January','February','March'];
    const monthNums   = [4,5,6,7,8,9,10,11,12,1,2,3];

    const monthlyData = monthLabels.map((label, i) => {
      const m  = monthNums[i];
      const yr = m >= 4 ? year.startYear : year.endYear;
      const monthInvoices = invoices.filter(inv => {
        const d = new Date(inv.invoiceDate);
        return d.getMonth() + 1 === m && d.getFullYear() === yr;
      });
      return {
        month:   label,
        revenue: parseFloat(monthInvoices.reduce((s, inv) => s + (inv.netAmount || inv.grandTotal || 0), 0).toFixed(2)),
        gst:     parseFloat(monthInvoices.reduce((s, inv) => s + (inv.totalGst || 0), 0).toFixed(2)),
        count:   monthInvoices.length,
      };
    });

    res.json({
      success: true,
      data: {
        monthlyData,
        totalRevenue:  parseFloat(invoices.reduce((s, inv) => s + (inv.netAmount || inv.grandTotal || 0), 0).toFixed(2)),
        totalGst:      parseFloat(invoices.reduce((s, inv) => s + (inv.totalGst || 0), 0).toFixed(2)),
        invoiceCount:  invoices.length,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Migration helper: sync counter to match highest actual invoice in that year
const syncCounter = async (req, res) => {
  try {
    const year = await AccountingYear.findById(req.params.id);
    if (!year) return res.status(404).json({ success: false, message: 'Year not found' });

    const last = await Invoice.findOne({ accountingYearId: year._id }).sort({ invoiceNo: -1 });
    const maxNo = last ? last.invoiceNo : 0;

    if (maxNo > year.invoiceCounter) {
      year.invoiceCounter = maxNo;
      await year.save();
    }

    res.json({ success: true, data: { invoiceCounter: year.invoiceCounter, synced: maxNo > 0 } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllYears,
  getActiveYear,
  getNextInvoiceNoPreview,
  createYear,
  setActiveYear,
  getYearRevenue,
  syncCounter,
};