// routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  calculateInvoiceTotal
} = require('../controllers/invoiceController');

router.get('/', getAllInvoices);
router.get('/:id', getInvoiceById);
router.post('/', createInvoice);
router.post('/calculate', calculateInvoiceTotal);  // POST /api/invoices/calculate - real-time calc
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

module.exports = router;
