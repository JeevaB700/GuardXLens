const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  type: { type: String, required: true }, // MCQ, SHORT, CODE

  // MCQ specific
  options: [{ type: String }],
  correctAnswers: [{ type: String }],

  // Coding specific
  allowedLanguages: { type: [String], default: ['java', 'python', 'c'] },
  testCases: [{
    input: { type: String },
    output: { type: String },
    isHidden: { type: Boolean, default: false }
  }],

  marks: { type: Number, default: 1 }
});

const examSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  duration: { type: Number, required: true },
  totalMarks: { type: Number, default: 0 },
  questions: [questionSchema],

  // --- NEW FIELD: Link Exam to Institution ---
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  // -------------------------------------------

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Exam', examSchema);