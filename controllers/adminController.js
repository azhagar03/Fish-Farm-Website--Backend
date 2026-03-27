// controllers/adminController.js
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken'); // ✅ ADD THIS

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log("LOGIN INPUT:", username, password); // 🔍 DEBUG

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password required'
      });
    }

    const admin = await Admin.findOne({
      username: username.trim(),
      isActive: true
    });

    console.log("DB ADMIN:", admin); // 🔍 DEBUG

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found'
      });
    }

    const isMatch = admin.checkPassword(password);
    console.log("PASSWORD MATCH:", isMatch); // 🔍 DEBUG

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        username: admin.username
      },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      data: {
        token,
        name: admin.name,
        username: admin.username
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

const createAdmin = async (req, res) => {
  try {
    const { username, password, name } = req.body;
    const existing = await Admin.findOne({ username });
    if (existing) return res.status(400).json({ success: false, message: 'Username already exists' });
    const passwordHash = Admin.hashPassword(password);
    const admin = await Admin.create({ username, passwordHash, name });
    res.status(201).json({ success: true, data: { id: admin._id, username: admin.username, name: admin.name } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const listAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({}, '-passwordHash').sort({ createdAt: -1 });
    res.json({ success: true, data: admins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    res.json({ success: true, message: 'Admin deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Seed default admin
const seedAdmin = async () => {
  const existing = await Admin.findOne({ username: 'fishfarmadmin@2026' });

  if (!existing) {
    const passwordHash = Admin.hashPassword('FishAdmin@2026');

    await Admin.create({
      username: 'fishfarmadmin@2026',
      passwordHash,
      name: 'Administrator',
      isActive: true
    });

    console.log('✅ Default admin created: fishfarmadmin@2026 / FishAdmin@2026');
  } else {
    console.log('ℹ️ Admin already exists');
  }
};

module.exports = { login, createAdmin, listAdmins, deleteAdmin, seedAdmin };
