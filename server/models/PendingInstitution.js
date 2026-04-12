const mongoose = require('mongoose');

const pendingInstitutionSchema = new mongoose.Schema({
  institutionName: { type: String, required: true },
  adminName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PendingInstitution', pendingInstitutionSchema);
