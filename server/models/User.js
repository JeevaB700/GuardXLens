const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'institution', 'student'], // Added 'institution' role
    default: 'student'
  },
  // Link user to a specific institution (Required for students & institution admins)
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    default: null
  },
  // Academic details for Exam Management & Seating
  registerNumber: { type: String, default: '' },
  department: { type: String, default: '' }, // e.g., CSE, ECE, MECH, EEE, IT, AIDS
  year: { type: Number, default: 1 }, // 1, 2, 3, 4
  semester: { type: Number, default: 1 }, // 1 to 8
  section: { type: String, default: 'A' },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);