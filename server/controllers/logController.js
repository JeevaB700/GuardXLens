const ActivityLog = require('../models/ActivityLog');
const Exam = require('../models/Exam');
const User = require('../models/User'); // Import User for search

// 1. LOG ACTIVITY (Existing)
const logActivity = async (req, res) => {
  try {
    const { examId, action, details } = req.body;
    await ActivityLog.create({ studentId: req.user.id, examId, action, details });
    res.status(201).json({ success: true });
  } catch (e) { res.status(500).json({ message: "Log failed" }); }
};

// 2. GET ALL LOGS (Enhanced - For Super Admin)
const getLogs = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    
    if (search && search.trim() !== "") {
      // Find students whose name matches the search term (case-insensitive)
      const students = await User.find({ 
        name: { $regex: search.trim(), $options: 'i' } 
      }).select('_id');
      
      const studentIds = students.map(s => s._id);
      query.studentId = { $in: studentIds };
    }

    const logs = await ActivityLog.find(query)
      .populate('studentId', 'name email')
      .populate('examId', 'title')
      .sort({ timestamp: -1 })
      .limit(50); // Keep limit for safety, but now it's filtered
      
    res.json({ success: true, logs });
  } catch (e) { 
    console.error(e);
    res.status(500).json({ message: "Fetch failed" }); 
  }
};

// 3. GET STUDENTS WHO HAVE VIOLATIONS (For Institution Dashboard)
const getMalpracticeStudents = async (req, res) => {
    try {
        const institutionId = req.user.institutionId;
        const myExams = await Exam.find({ institutionId }).select('_id');
        const examIds = myExams.map(e => e._id);
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