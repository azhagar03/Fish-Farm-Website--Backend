// controllers/fishPriceController.js
const FishPrice = require('../models/FishPrice');

const getAllFishPrices = async (req, res) => {
  try {
    const prices = await FishPrice.find().sort({ fishName: 1 });
    res.json({ success: true, data: prices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateFishPrice = async (req, res) => {
  try {
    const existing = await FishPrice.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Fish price not found' });

    // Store previous price before updating
    req.body.previousPrice = existing.currentPrice;
    const updated = await FishPrice.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const seedFishPrices = async (req, res) => {
  try {
    await FishPrice.deleteMany({});
    const fishData = [
      { fishName: 'Arowana (Golden)', category: 'Ornamental', currentPrice: 5000, unit: 'per piece', availability: 'Limited', origin: 'Malaysia' },
      { fishName: 'Flowerhorn', category: 'Ornamental', currentPrice: 1200, unit: 'per piece', availability: 'In Stock', origin: 'Local' },
      { fishName: 'Oscar Fish', category: 'Tropical', currentPrice: 150, unit: 'per piece', availability: 'In Stock', origin: 'Local' },
      { fishName: 'Goldfish (Fancy)', category: 'Coldwater', currentPrice: 80, unit: 'per piece', availability: 'In Stock', origin: 'Local' },
      { fishName: 'Guppy (Pair)', category: 'Tropical', currentPrice: 40, unit: 'per pair', availability: 'In Stock', origin: 'Local' },
      { fishName: 'Discus Fish', category: 'Tropical', currentPrice: 800, unit: 'per piece', availability: 'Limited', origin: 'Brazil' },
      { fishName: 'Koi Fish', category: 'Coldwater', currentPrice: 500, unit: 'per piece', availability: 'In Stock', origin: 'Japan' },
      { fishName: 'Betta (Fighting)', category: 'Tropical', currentPrice: 100, unit: 'per piece', availability: 'In Stock', origin: 'Local' },
      { fishName: 'Angelfish', category: 'Tropical', currentPrice: 120, unit: 'per piece', availability: 'In Stock', origin: 'Local' },
      { fishName: 'Clownfish', category: 'Marine', currentPrice: 350, unit: 'per piece', availability: 'Limited', origin: 'Marine' },
      { fishName: 'Rohu (Rohu)', category: 'Food Fish', currentPrice: 180, unit: 'per kg', availability: 'In Stock', origin: 'Local' },
      { fishName: 'Catla', category: 'Food Fish', currentPrice: 200, unit: 'per kg', availability: 'In Stock', origin: 'Local' },
    ];
    const created = await FishPrice.insertMany(fishData);
    res.json({ success: true, message: `${created.length} fish prices seeded`, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllFishPrices, updateFishPrice, seedFishPrices };
