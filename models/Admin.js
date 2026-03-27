// models/Admin.js
const mongoose = require('mongoose');
const crypto = require('crypto');

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

adminSchema.methods.checkPassword = function(password) {
  const hash = crypto.createHash('sha256').update(password + 'muthupandi_salt_2026').digest('hex');
  return hash === this.passwordHash;
};

adminSchema.statics.hashPassword = function(password) {
  return crypto.createHash('sha256').update(password + 'muthupandi_salt_2026').digest('hex');
};

module.exports = mongoose.model('Admin', adminSchema);
