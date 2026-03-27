// routes/accountingYearRoutes.js
const express = require('express');
const router = express.Router();
const { getAllYears, getActiveYear, createYear, setActiveYear, getYearRevenue } = require('../controllers/accountingYearController');

router.get('/', getAllYears);
router.get('/active', getActiveYear);
router.post('/', createYear);
router.put('/:id/activate', setActiveYear);
router.get('/:id/revenue', getYearRevenue);

module.exports = router;
