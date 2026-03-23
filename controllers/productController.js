// controllers/productController.js
const Product = require('../models/Product');

// GET all products
const getAllProducts = async (req, res) => {
  try {
    const { category, isActive } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET single product
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST create product
const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT update product
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Seed sample products
const seedProducts = async (req, res) => {
  try {
    await Product.deleteMany({});
    const sampleProducts = [
      { name: 'RS188A TOPFILTER', category: 'Filter', price: 275, unit: 'Pcs', stock: 50 },
      { name: 'RS1000F FILTER', category: 'Filter', price: 240, unit: 'Pcs', stock: 30 },
      { name: 'XBL 400 SUNSUN FILTER', category: 'Filter', price: 1750, unit: 'Nos', stock: 15 },
      { name: 'HEATER 100W', category: 'Equipment', price: 160, unit: 'Nos', stock: 40 },
      { name: '4INCH IMPORTED NET', category: 'Accessories', price: 30, unit: 'Pcs', stock: 100 },
      { name: '5INCH IMPORTED NET', category: 'Accessories', price: 35, unit: 'Pcs', stock: 100 },
      { name: 'TRANSPORT', category: 'Transport', price: 150, unit: 'Round', stock: 999 },
      { name: 'AROWANA FISH', category: 'Fish', price: 5000, unit: 'Pcs', stock: 10 },
      { name: 'FLOWERHORN FISH', category: 'Fish', price: 1200, unit: 'Pcs', stock: 20 },
      { name: 'GOLDFISH', category: 'Fish', price: 50, unit: 'Pcs', stock: 200 },
      { name: 'OSCAR FISH', category: 'Fish', price: 150, unit: 'Pcs', stock: 50 },
      { name: 'GUPPY FISH', category: 'Fish', price: 20, unit: 'Pcs', stock: 500 },
      { name: 'FISH FEED PREMIUM', category: 'Feed', price: 120, unit: 'Kg', stock: 80 },
      { name: 'AQUARIUM SALT', category: 'Medicine', price: 45, unit: 'Kg', stock: 60 },
    ];
    const created = await Product.insertMany(sampleProducts);
    res.json({ success: true, message: `${created.length} products seeded`, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, seedProducts };
