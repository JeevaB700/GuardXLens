const mongoose = require('mongoose');

const scheduleItemSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  session: {
    type: String,
    enum: ['FN', 'AN'],
    required: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  subjectCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  subjectName: {
    type: String,
    required: true,
    trim: true
  },
  facultyName: {
    type: String,
    default: '',
    trim: true
  },
  className: {
    type: String,
    default: '',
    trim: true
  }
});

const timetableSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  department: {
    type: String,
    default: 'DEPARTMENT OF INFORMATION TECHNOLOGY',
    trim: true
  },
  examTitle: {
    type: String,
    required: true,
    trim: true
  },
  customDates: [{
    dateString: String, // e.g. "17-09-2025 WED (FN)"
    rawDate: Date,
    session: {
      type: String,
      enum: ['FN', 'AN'],
      default: 'FN'
    }
  }],
  academicYear: {
    type: String,
    default: '2025-2026',
    trim: true
  },
  semesterType: {
    type: String,
    enum: ['Odd', 'Even'],
    default: 'Odd'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  fnTiming: {
    start: { type: String, default: '09:30 AM' },
    end: { type: String, default: '12:30 PM' }
  },
  anTiming: {
    start: { type: String, default: '01:30 PM' },
    end: { type: String, default: '04:30 PM' }
  },
  schedules: [scheduleItemSchema],
  status: {
    type: String,
    enum: ['Draft', 'Published'],
    default: 'Draft'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Timetable', timetableSchema);
