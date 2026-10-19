const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getHalls,
  createHall,
  deleteHall,
  seedDefaultHalls,
  getStudentsWithAcademic,
  updateStudentAcademic,
  generateSampleStudents,
  generateTimetable,
  getTimetables,
  getTimetableById,
  deleteTimetable,
  generateSeatingAllocation,
  getSeatingAllocations,
  getSeatingAllocationById,
  updateInvigilator
} = require('../controllers/examCellController');

// All exam cell operations require an authenticated institution/admin
router.use(protect);

// Hall routes
router.get('/halls', getHalls);
router.post('/halls', createHall);
router.delete('/halls/:id', deleteHall);
router.post('/halls/seed', seedDefaultHalls);

// Student Academic Registry routes
router.get('/students', getStudentsWithAcademic);
router.put('/students/:id', updateStudentAcademic);
router.post('/students/seed-samples', generateSampleStudents);

// Timetable routes
router.post('/timetable/generate', generateTimetable);
router.get('/timetable', getTimetables);
router.get('/timetable/:id', getTimetableById);
router.delete('/timetable/:id', deleteTimetable);

// Seating routes
router.post('/seating/generate', generateSeatingAllocation);
router.get('/seating', getSeatingAllocations);
router.get('/seating/:id', getSeatingAllocationById);
router.put('/seating/invigilator', updateInvigilator);

module.exports = router;
