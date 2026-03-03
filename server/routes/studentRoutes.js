const express = require('express');
const router = express.Router();
const multer = require('multer'); // Import Multer for file uploads
const upload = multer({ dest: 'uploads/' }); // Configure temp upload folder

const {
    getAllExams, getExamForStudent, submitExam, getStudentResults,
    generateTestCases, extractQuestions // <--- IMPORT THIS
} = require('../controllers/examController');
const { executeCode } = require('../controllers/codeController');
const { protect } = require('../middleware/authMiddleware');

// Student Dashboard calls this to list exams
router.get('/exams', protect, getAllExams);

// Exam taking & Submission
router.get('/exam/:id', protect, getExamForStudent);
router.post('/execute', protect, executeCode);
router.post('/submit', protect, submitExam);
router.get('/results/:studentId', getStudentResults);

// AI Features
router.post('/generate-test-cases', generateTestCases);

// --- FIX: ADD THIS MISSING ROUTE ---
router.post('/extract-questions', protect, upload.single('file'), extractQuestions);

module.exports = router;