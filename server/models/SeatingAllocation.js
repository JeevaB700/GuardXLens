const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  seatPosition: {
    type: Number, // 1 (Left) or 2 (Right)
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  studentName: { type: String, required: true },
  registerNumber: { type: String, required: true },
  department: { type: String, required: true },
  className: { type: String, default: '' },
  semester: { type: Number },
  subjectCode: { type: String, required: true },
  subjectName: { type: String, required: true }
});

const benchSchema = new mongoose.Schema({
  row: { type: Number, required: true },
  col: { type: Number, required: true },
  benchNumber: { type: Number, required: true },
  seats: [seatSchema]
});

const hallAllocationSchema = new mongoose.Schema({
  hallId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamHall',
    required: true
  },
  hallNumber: { type: String, required: true },
  block: { type: String, default: 'Main Block' },
  rows: { type: Number, required: true },
  columns: { type: Number, required: true },
  seatsPerBench: { type: Number, default: 2 },
  totalCapacity: { type: Number, required: true },
  occupiedCount: { type: Number, default: 0 },
  benches: [benchSchema],
  departmentsPresent: [{ type: String }],
  registerNumberRanges: [{
    department: { type: String },
    className: { type: String },
    subjectCode: { type: String },
    startRegNo: { type: String },
    endRegNo: { type: String },
    count: { type: Number }
  }],
  invigilatorName: { type: String, default: 'Unassigned' }
});

const seatingAllocationSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  timetableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Timetable'
  },
  examTitle: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  session: {
    type: String,
    enum: ['FN', 'AN'],
    required: true
  },
  halls: [hallAllocationSchema],
  totalStudentsAllocated: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SeatingAllocation', seatingAllocationSchema);
