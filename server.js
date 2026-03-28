// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: [
    'https://fish-farm-website-frontend.onrender.com',
    'https://muthupandifishfarm.in',
    'https://www.muthupandifishfarm.in'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/fish-prices', require('./routes/fishPriceRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/accounting-years', require('./routes/accountingYearRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Muthupandi Fish Farm API is running 🐟' });
});

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB connected successfully');
    // Seed default admin
    const { seedAdmin } = require('./controllers/adminController');
    await seedAdmin();
    // Seed default accounting year if none exists
    const AccountingYear = require('./models/AccountingYear');
    const count = await AccountingYear.countDocuments();
    if (count === 0) {
      await AccountingYear.create({
        label: '2025-2026', startYear: 2025, endYear: 2026,
        startMonth: 4, isActive: true, invoiceCounter: 0
      });
      console.log('✅ Default accounting year 2025-2026 created');
    }
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on https://fish-farm-website-backend.onrender.com:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
