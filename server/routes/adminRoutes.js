const express = require('express');
const multer = require('multer');
const { extractQuestions, saveExam, generateTestCases, getAllStudentResults, getExamsByInstitution, updateExam, deleteExam } = require('../controllers/examController');
// 1. IMPORT PROTECT MIDDLEWARE
const { protect } = require('../middleware/authMiddleware');
const { getStudentsByInstitutionId } = require('../controllers/authController');
const { getLogs, getMalpracticeStudents, getStudentLogs } = require('../controllers/logController');
const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// AI Extraction Route (Can remain open or protected, better protected)
router.post('/extract', upload.single('file'), extractQuestions);
router.post('/generate-testcases', generateTestCases);

// 2. PROTECT THE SAVE ROUTE
// This ensures req.user is populated so we can get the institutionId
router.post('/save', protect, saveExam);
router.get('/students', getAllStudentResults);

router.get('/logs', getLogs);
router.get('/institution-exams', protect, getExamsByInstitution);
router.get('/students/:institutionId', protect, getStudentsByInstitutionId);

// --- ADD THIS NEW ROUTE ---
router.put('/exam/:id', protect, updateExam);
router.delete('/exam/:id', protect, deleteExam); // <--- NEW DELETE ROUTE

// 1. Get list of bad students
router.get('/malpractice-students', protect, getMalpracticeStudents);

// 2. Get specific logs for a student
router.get('/student-logs/:studentId', protect, getStudentLogs);

module.exports = router;