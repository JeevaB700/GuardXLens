const express = require('express');
const multer = require('multer');
const { extractQuestions, saveExam, generateTestCases, getAllStudentResults, getExamsByInstitution, updateExam, deleteExam, getResultsByExam } = require('../controllers/examController');
// 1. IMPORT PROTECT MIDDLEWARE
const { protect } = require('../middleware/authMiddleware');
const { 
  getStudentsByInstitutionId, 
  getPendingInstitutions, 
  approveInstitution, 
  rejectInstitution, 
  deleteStudent, 
  deleteInstitution,
  adminCreateStudent 
} = require('../controllers/authController');
const { getLogs, getMalpracticeStudents, getStudentLogs } = require('../controllers/logController');
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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
router.get('/exam-results/:examId', protect, getResultsByExam);

// 1. Get list of bad students
router.get('/malpractice-students', protect, getMalpracticeStudents);

// 2. Get specific logs for a student
router.get('/student-logs/:studentId', protect, getStudentLogs);

// --- INSTITUTION APPROVALS ---
router.get('/pending-institutions', protect, getPendingInstitutions);
router.post('/approve-institution', protect, approveInstitution);
router.post('/reject-institution', protect, rejectInstitution);

// --- DELETIONS ---
router.delete('/student/:id', protect, deleteStudent);
router.delete('/institution/:id', protect, deleteInstitution);

// --- MANUAL CREATION ---
router.post('/create-student', protect, adminCreateStudent);

module.exports = router;