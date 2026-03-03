const ActivityLog = require('../models/ActivityLog');
const Exam = require('../models/Exam');

// 1. LOG ACTIVITY (Existing)
const logActivity = async (req, res) => {
  try {
    const { examId, action, details } = req.body;
    await ActivityLog.create({ studentId: req.user.id, examId, action, details });
    res.status(201).json({ success: true });
  } catch (e) { res.status(500).json({ message: "Log failed" }); }
};

// 2. GET ALL LOGS (Existing - For Super Admin)
const getLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find().populate('studentId', 'name').populate('examId', 'title').sort({ timestamp: -1 }).limit(50);
    res.json({ success: true, logs });
  } catch (e) { res.status(500).json({ message: "Fetch failed" }); }
};

// --- NEW FUNCTIONS ---

// 3. GET STUDENTS WHO HAVE VIOLATIONS (For Institution Dashboard)
const getMalpracticeStudents = async (req, res) => {
    try {
        const institutionId = req.user.institutionId;
        
        // A. Find all exams created by this institution
        const myExams = await Exam.find({ institutionId }).select('_id');
        const examIds = myExams.map(e => e._id);

        // B. Find logs related to these exams
        // We use .distinct() to get just the list of student IDs who have logs
        const flaggedStudentIds = await ActivityLog.find({ examId: { $in: examIds } }).distinct('studentId');

        res.json({ success: true, studentIds: flaggedStudentIds });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Error fetching flagged students" });
    }
};

// 4. GET LOGS FOR A SPECIFIC STUDENT (For the Popup)
const getStudentLogs = async (req, res) => {
    try {
        const { studentId } = req.params;
        const logs = await ActivityLog.find({ studentId })
            .populate('examId', 'title')
            .sort({ timestamp: -1 });
            
        res.json({ success: true, logs });
    } catch (e) {
        res.status(500).json({ message: "Error fetching student logs" });
    }
};

module.exports = { logActivity, getLogs, getMalpracticeStudents, getStudentLogs };