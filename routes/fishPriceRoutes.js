// routes/fishPriceRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllFishPrices,
  updateFishPrice,
  seedFishPrices
} = require('../controllers/fishPriceController');

router.get('/', getAllFishPrices);
router.get('/seed', seedFishPrices);
router.put('/:id', updateFishPrice);

module.exports = router;
