const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Store the actual answers provided by student
  answers: [{
    questionId: { type: String },
    submittedAnswer: { type: mongoose.Schema.Types.Mixed }, // String for MCQ, Code for coding
    isCorrect: { type: Boolean, default: false },
    marksAwarded: { type: Number, default: 0 }
  }],

  score: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  isMalpractice: { type: Boolean, default: false },

  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Result', resultSchema);