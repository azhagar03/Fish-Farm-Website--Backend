// routes/accountingYearRoutes.js
const express = require('express');
const router  = express.Router();
const {
  getAllYears,
  getActiveYear,
  getNextInvoiceNoPreview,
  createYear,
  setActiveYear,
  getYearRevenue,
  syncCounter,
} = require('../controllers/accountingYearController');

// ── Static routes FIRST (before /:id) ──
router.get('/',                 getAllYears);
router.get('/active',           getActiveYear);           // MUST be before /:id
router.get('/next-invoice-no',  getNextInvoiceNoPreview); // MUST be before /:id
router.post('/',                createYear);

// ── Dynamic :id routes AFTER ──
router.put('/:id/activate',     setActiveYear);
router.get('/:id/revenue',      getYearRevenue);
router.post('/:id/sync',        syncCounter);

module.exports = router;