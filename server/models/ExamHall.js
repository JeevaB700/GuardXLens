const mongoose = require('mongoose');

const examHallSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  hallNumber: {
    type: String,
    required: true,
    trim: true
  },
  block: {
    type: String,
    default: 'Main Block',
    trim: true
  },
  floor: {
    type: String,
    default: 'Ground Floor',
    trim: true
  },
  rows: {
    type: Number,
    required: true,
    min: 1,
    default: 5
  },
  columns: {
    type: Number,
    required: true,
    min: 1,
    default: 3
  },
  seatsPerBench: {
    type: Number,
    default: 2,
    min: 1,
    max: 3
  },
  totalCapacity: {
    type: Number,
    default: 30
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-compute total capacity before saving
examHallSchema.pre('save', function (next) {
  this.totalCapacity = this.rows * this.columns * this.seatsPerBench;
  next();
});

module.exports = mongoose.model('ExamHall', examHallSchema);
