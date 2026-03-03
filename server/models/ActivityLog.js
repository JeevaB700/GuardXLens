const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  action: { type: String, required: true }, // e.g., "TAB_SWITCH", "FULLSCREEN_EXIT"
  details: { type: String }, 
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);