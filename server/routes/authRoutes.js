const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    registerStudent, registerInstitution, approveInstitution, loginUser,
    getInstitutions, getAllStudents, getMyStudents,
    forgotPassword, resetPassword
} = require('../controllers/authController');

router.post('/register', registerStudent);
router.post('/register-institution', registerInstitution);
router.get('/approve-institution', approveInstitution);
router.post('/login', loginUser);

router.get('/institutions', getInstitutions);
router.get('/all-students', getAllStudents); // Used by Admin Dashboard
router.get('/my-students', protect, getMyStudents); // Used by Inst Dashboard

// Password Recovery
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

module.exports = router;