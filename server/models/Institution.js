const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true }, // Official contact email
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Link to the Institution Admin user
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Institution', institutionSchema);