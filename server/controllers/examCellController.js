const ExamHall = require('../models/ExamHall');
const Timetable = require('../models/Timetable');
const SeatingAllocation = require('../models/SeatingAllocation');
const User = require('../models/User');

// ==========================================
// 1. EXAM HALLS MANAGEMENT
// ==========================================

// Get all halls for the institution
const getHalls = async (req, res) => {
  try {
    const institutionId = req.user.institutionId;
    const halls = await ExamHall.find({ institutionId, isActive: true }).sort({ hallNumber: 1 });
    res.json({ success: true, halls });
  } catch (error) {
    console.error('Error fetching halls:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch exam halls' });
  }
};

// Create a new exam hall
const createHall = async (req, res) => {
  try {
    const institutionId = req.user.institutionId;
    const { hallNumber, block, floor, rows, columns, seatsPerBench } = req.body;

    if (!hallNumber || !rows || !columns) {
      return res.status(400).json({ success: false, message: 'Hall Number, Rows, and Columns are required' });
    }

    const totalCapacity = Number(rows) * Number(columns) * (Number(seatsPerBench) || 2);

    const hall = await ExamHall.create({
      institutionId,
      hallNumber: hallNumber.trim(),
      block: block || 'Main Block',
      floor: floor || 'Ground Floor',
      rows: Number(rows),
      columns: Number(columns),
      seatsPerBench: Number(seatsPerBench) || 2,
      totalCapacity
    });

    res.status(201).json({ success: true, hall, message: 'Exam hall added successfully' });
  } catch (error) {
    console.error('Error creating hall:', error);
    res.status(500).json({ success: false, message: 'Failed to create exam hall' });
  }
};

// Delete an exam hall
const deleteHall = async (req, res) => {
  try {
    const { id } = req.params;
    await ExamHall.findByIdAndUpdate(id, { isActive: false });
    res.json({ success: true, message: 'Exam hall removed' });
  } catch (error) {
    console.error('Error deleting hall:', error);
    res.status(500).json({ success: false, message: 'Failed to delete hall' });
  }
};

// Auto-seed default halls for immediate testing
const seedDefaultHalls = async (req, res) => {
  try {
    const institutionId = req.user.institutionId;
    const existing = await ExamHall.countDocuments({ institutionId, isActive: true });
    if (existing > 0) {
      return res.json({ success: true, message: 'Halls already exist for this institution' });
    }

    const defaultHalls = [
      { hallNumber: '405', block: 'Main IT Block', floor: '4th Floor', rows: 7, columns: 3, seatsPerBench: 2, totalCapacity: 42 },
      { hallNumber: '406', block: 'Main IT Block', floor: '4th Floor', rows: 6, columns: 3, seatsPerBench: 2, totalCapacity: 36 },
      { hallNumber: '404', block: 'Main IT Block', floor: '4th Floor', rows: 7, columns: 3, seatsPerBench: 2, totalCapacity: 42 },
      { hallNumber: 'LH-101', block: 'Main Academic Block', floor: '1st Floor', rows: 5, columns: 3, seatsPerBench: 2, totalCapacity: 30 }
    ];

    const hallsToCreate = defaultHalls.map(h => ({ ...h, institutionId }));
    await ExamHall.insertMany(hallsToCreate);

    const halls = await ExamHall.find({ institutionId, isActive: true });
    res.json({ success: true, halls, message: 'Kingston examination halls created successfully' });
  } catch (error) {
    console.error('Error seeding halls:', error);
    res.status(500).json({ success: false, message: 'Failed to seed sample halls' });
  }
};

// ==========================================
// 2. STUDENT ACADEMIC REGISTRY & SEEDING
// ==========================================

// Get students with academic info
const getStudentsWithAcademic = async (req, res) => {
  try {
    const institutionId = req.user.institutionId;
    const students = await User.find({ institutionId, role: 'student' })
      .select('name email registerNumber department year semester section')
      .sort({ department: 1, registerNumber: 1, name: 1 });
    res.json({ success: true, students });
  } catch (error) {
    console.error('Error getting students:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch students' });
  }
};

// Update single student academic details
const updateStudentAcademic = async (req, res) => {
  try {
    const { id } = req.params;
    const { registerNumber, department, year, semester, section } = req.body;

    const student = await User.findByIdAndUpdate(
      id,
      { registerNumber, department, year, semester, section },
      { new: true }
    ).select('-password');

    res.json({ success: true, student, message: 'Student academic details updated' });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ success: false, message: 'Failed to update student' });
  }
};

// Bulk import or quick sample student generator (Matching Kingston Engineering College exact Reg No formats)
const generateSampleStudents = async (req, res) => {
  try {
    const institutionId = req.user.institutionId;
    const bcrypt = require('bcryptjs');
    const defaultPassword = await bcrypt.hash('student123', 10);

    // Matching Kingston Engineering College real formats from GMT/CAT documents
    const studentBatches = [
      // III IT (Joined 2022) - e.g. 511322205001 to 511322205060
      { dept: 'IT', year: 3, sem: 5, prefix: '511322205', count: 60, namePrefix: 'III IT Candidate' },
      // II IT (Joined 2023) - e.g. 511323205001 to 511323205060
      { dept: 'IT', year: 2, sem: 3, prefix: '511323205', count: 60, namePrefix: 'II IT Candidate' },
      // IV IT (Joined 2021) - e.g. 511321205001 to 511321205040
      { dept: 'IT', year: 4, sem: 7, prefix: '511321205', count: 40, namePrefix: 'IV IT Candidate' },
      // CSE
      { dept: 'CSE', year: 3, sem: 5, prefix: '511322104', count: 30, namePrefix: 'CSE Student' }
    ];

    let createdCount = 0;
    const sampleStudents = [];

    for (const batch of studentBatches) {
      for (let i = 1; i <= batch.count; i++) {
        const paddedIndex = String(i).padStart(3, '0');
        const regNo = `${batch.prefix}${paddedIndex}`;
        const email = `${batch.dept.toLowerCase()}_${batch.year}_${paddedIndex}@kingston.edu.in`;

        // Check if already exists
        const exists = await User.findOne({ email });
        if (!exists) {
          sampleStudents.push({
            name: `${batch.namePrefix} ${paddedIndex}`,
            email,
            password: defaultPassword,
            role: 'student',
            institutionId,
            registerNumber: regNo,
            department: batch.dept,
            year: batch.year,
            semester: batch.sem,
            section: i <= 30 ? 'A' : 'B'
          });
        }
      }
    }

    if (sampleStudents.length > 0) {
      await User.insertMany(sampleStudents);
      createdCount = sampleStudents.length;
    }

    const totalStudents = await User.countDocuments({ institutionId, role: 'student' });

    res.json({
      success: true,
      message: `Generated ${createdCount} Kingston IT/CSE candidates with real register numbers! Total enrolled: ${totalStudents}`,
      createdCount,
      totalStudents
    });
  } catch (error) {
    console.error('Error generating sample students:', error);
    res.status(500).json({ success: false, message: 'Failed to generate sample students' });
  }
};

// ==========================================
// 3. TIMETABLE GENERATOR ENGINE (FN/AN)
// ==========================================

// Generate conflict-free timetable across branches
const generateTimetable = async (req, res) => {
  try {
    const institutionId = req.user.institutionId;
    const {
      examTitle,
      department,
      customDates,
      academicYear,
      semesterType,
      startDate,
      endDate,
      fnTiming,
      anTiming,
      directSchedules,
      departmentCurricula
    } = req.body;

    if (!examTitle) {
      return res.status(400).json({ success: false, message: 'Exam Title is required' });
    }

    let schedules = [];

    // If direct schedules are passed (e.g. from the Kingston tabular editor)
    if (directSchedules && Array.isArray(directSchedules) && directSchedules.length > 0) {
      schedules = directSchedules.map(s => ({
        date: new Date(s.date),
        session: s.session || 'FN',
        department: s.department || 'IT',
        className: s.className || '',
        year: Number(s.year) || 3,
        semester: Number(s.semester) || 5,
        subjectCode: (s.subjectCode || '').toUpperCase().trim(),
        subjectName: (s.subjectName || '').trim(),
        facultyName: (s.facultyName || '').trim()
      }));
    } else if (departmentCurricula && Array.isArray(departmentCurricula) && departmentCurricula.length > 0) {
      // 1. Calculate valid examination dates (excluding Sundays)
      const validDates = [];
      let curDate = new Date(startDate || Date.now());
      const stopDate = new Date(endDate || Date.now() + 6 * 86400000);

      while (curDate <= stopDate) {
        if (curDate.getDay() !== 0) validDates.push(new Date(curDate));
        curDate.setDate(curDate.getDate() + 1);
      }

      departmentCurricula.forEach((curr, deptIdx) => {
        const { department: dName, year, semester, subjects, className } = curr;
        const preferredSession = (deptIdx % 2 === 0) ? 'FN' : 'FN';

        subjects.forEach((sub, subIdx) => {
          const dateIndex = subIdx % (validDates.length || 1);
          const examDate = validDates[dateIndex] || new Date();

          schedules.push({
            date: examDate,
            session: preferredSession,
            department: dName || 'IT',
            className: className || `${year === 2 ? 'II' : year === 3 ? 'III' : 'IV'} ${dName || 'IT'}`,
            year: Number(year) || 3,
            semester: Number(semester) || 5,
            subjectCode: (sub.code || '').toUpperCase().trim(),
            subjectName: (sub.name || '').trim(),
            facultyName: (sub.facultyName || '').trim()
          });
        });
      });
    }

    // Save Timetable
    const timetable = await Timetable.create({
      institutionId,
      examTitle,
      department: department || 'DEPARTMENT OF INFORMATION TECHNOLOGY',
      customDates: customDates || [],
      academicYear: academicYear || '2025-2026',
      semesterType: semesterType || 'Odd',
      startDate: new Date(startDate || Date.now()),
      endDate: new Date(endDate || Date.now() + 6 * 86400000),
      fnTiming: fnTiming || { start: '09:30 AM', end: '12:30 PM' },
      anTiming: anTiming || { start: '01:30 PM', end: '04:30 PM' },
      schedules,
      status: 'Published'
    });

    res.status(201).json({
      success: true,
      timetable,
      message: `Schedule created successfully with ${schedules.length} examination slots!`
    });
  } catch (error) {
    console.error('Error generating timetable:', error);
    res.status(500).json({ success: false, message: 'Failed to generate timetable' });
  }
};

// Get all timetables
const getTimetables = async (req, res) => {
  try {
    const institutionId = req.user.institutionId;
    const timetables = await Timetable.find({ institutionId }).sort({ createdAt: -1 });
    res.json({ success: true, timetables });
  } catch (error) {
    console.error('Error fetching timetables:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch timetables' });
  }
};

// Get single timetable
const getTimetableById = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable) return res.status(404).json({ success: false, message: 'Timetable not found' });
    res.json({ success: true, timetable });
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch timetable' });
  }
};

// Delete timetable
const deleteTimetable = async (req, res) => {
  try {
    const { id } = req.params;
    await Timetable.findByIdAndDelete(id);
    await SeatingAllocation.deleteMany({ timetableId: id });
    res.json({ success: true, message: 'Timetable and associated seating allocations deleted' });
  } catch (error) {
    console.error('Error deleting timetable:', error);
    res.status(500).json({ success: false, message: 'Failed to delete timetable' });
  }
};

// ==========================================================
// 4. CROSS-BRANCH SEATING ALLOCATION ENGINE (ANTI-MALPRACTICE)
// ==========================================================

const generateSeatingAllocation = async (req, res) => {
  try {
    const institutionId = req.user.institutionId;
    const { timetableId, date, session, hallIds } = req.body;

    if (!timetableId || !date || !session) {
      return res.status(400).json({ success: false, message: 'Timetable ID, Date, and Session are required' });
    }

    const timetable = await Timetable.findById(timetableId);
    if (!timetable) return res.status(404).json({ success: false, message: 'Timetable not found' });

    // 1. Identify which departments/subjects have an exam on this date and session
    const targetDateStr = new Date(date).toISOString().split('T')[0];
    const sessionSchedules = timetable.schedules.filter(s => {
      const sDateStr = new Date(s.date).toISOString().split('T')[0];
      return sDateStr === targetDateStr && s.session === session && s.subjectCode && s.subjectCode !== '-' && s.subjectCode !== 'NM';
    });

    if (sessionSchedules.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No active examinations are scheduled for ${session} session on ${new Date(date).toDateString()}`
      });
    }

    // 2. Fetch available examination halls
    let query = { institutionId, isActive: true };
    if (hallIds && hallIds.length > 0) {
      query._id = { $in: hallIds };
    }
    const halls = await ExamHall.find(query).sort({ hallNumber: 1 });

    if (halls.length === 0) {
      return res.status(400).json({ success: false, message: 'No active examination halls found. Please add halls first.' });
    }

    // 3. For each scheduled department/subject, fetch registered students
    const departmentQueues = {};

    for (const sched of sessionSchedules) {
      const classLabel = sched.className || `${sched.year === 2 ? 'II' : sched.year === 3 ? 'III' : 'IV'} ${sched.department}`;
      const students = await User.find({
        institutionId,
        role: 'student',
        department: sched.department,
        year: sched.year
      }).sort({ registerNumber: 1, name: 1 });

      const key = `${sched.department}_${sched.year}_${sched.subjectCode}`;
      departmentQueues[key] = {
        department: sched.department,
        className: classLabel,
        year: sched.year,
        semester: sched.semester,
        subjectCode: sched.subjectCode,
        subjectName: sched.subjectName,
        students: students.map(s => ({
          studentId: s._id,
          studentName: s.name,
          registerNumber: s.registerNumber || `REG-${s._id.toString().slice(-6)}`,
          department: sched.department,
          className: classLabel,
          year: sched.year,
          semester: sched.semester,
          subjectCode: sched.subjectCode,
          subjectName: sched.subjectName
        }))
      };
    }

    // If an institution doesn't have students registered yet for this branch, create mock student roster
    // with exact Kingston Engineering College register numbers!
    for (const key of Object.keys(departmentQueues)) {
      const item = departmentQueues[key];
      if (item.students.length === 0) {
        return res.status(400).json({
          success: false,
          message: `No registered students found for ${item.className} (${item.department}). Please add students in 'My Students' before running seating allocation.`
        });
      }
    }

    // 4. THE CROSS-BRANCH INTERLEAVING ALLOCATION ENGINE
    // Anti-Malpractice Algorithm:
    // On each bench: Seat 1 (Left) & Seat 2 (Right) are interleaved so students:
    // 1. Belong to DIFFERENT classes/departments
    // 2. Write DIFFERENT subjects whenever possible
    const keys = Object.keys(departmentQueues);
    const allocatedHalls = [];
    let totalAllocatedStudents = 0;

    let hallIndex = 0;
    let currentHall = halls[hallIndex];

    while (currentHall && keys.some(k => departmentQueues[k].students.length > 0)) {
      const benches = [];
      const hallDepartments = new Set();
      const regNoTracker = {}; // key: className -> { className, department, startRegNo, endRegNo, count, subjectCode, subjectName }
      let benchCounter = 1;
      let hallOccupiedSeats = 0;

      for (let r = 1; r <= currentHall.rows; r++) {
        for (let c = 1; c <= currentHall.columns; c++) {
          const benchSeats = [];

          // Each bench has seatsPerBench (normally 2)
          for (let seatPos = 1; seatPos <= (currentHall.seatsPerBench || 2); seatPos++) {
            let assignedStudent = null;

            // Pick candidate queue with alternating offset by row and seat position
            let targetKeyIndex = (seatPos - 1 + (r % 2)) % keys.length;

            // Attempt 1: Look for a queue with a DIFFERENT class AND a DIFFERENT subject on this bench
            for (let attempt = 0; attempt < keys.length; attempt++) {
              const k = keys[(targetKeyIndex + attempt) % keys.length];
              const q = departmentQueues[k];

              const sameClassOnBench = benchSeats.some(s => s.className === q.className);
              const sameSubjOnBench = benchSeats.some(s => s.subjectCode && s.subjectCode === q.subjectCode);

              if (q.students.length > 0 && !sameClassOnBench && !sameSubjOnBench) {
                assignedStudent = q.students.shift();
                break;
              }
            }

            // Attempt 2: If no queue has a different subject, at least choose a DIFFERENT class
            if (!assignedStudent) {
              for (let attempt = 0; attempt < keys.length; attempt++) {
                const k = keys[(targetKeyIndex + attempt) % keys.length];
                const q = departmentQueues[k];

                const sameClassOnBench = benchSeats.some(s => s.className === q.className);

                if (q.students.length > 0 && !sameClassOnBench) {
                  assignedStudent = q.students.shift();
                  break;
                }
              }
            }

            // Attempt 3: If only one class remains with students, assign from that remaining queue
            if (!assignedStudent) {
              for (let attempt = 0; attempt < keys.length; attempt++) {
                const k = keys[(targetKeyIndex + attempt) % keys.length];
                const q = departmentQueues[k];
                if (q.students.length > 0) {
                  assignedStudent = q.students.shift();
                  break;
                }
              }
            }

            if (assignedStudent) {
              benchSeats.push({
                seatPosition: seatPos,
                studentId: assignedStudent.studentId,
                studentName: assignedStudent.studentName,
                registerNumber: assignedStudent.registerNumber,
                department: assignedStudent.department,
                className: assignedStudent.className,
                semester: assignedStudent.semester,
                subjectCode: assignedStudent.subjectCode,
                subjectName: assignedStudent.subjectName
              });

              hallDepartments.add(assignedStudent.department);
              hallOccupiedSeats++;
              totalAllocatedStudents++;

              // Track register number range for Notice Board Chart (by className, matching Kingston Image 3!)
              const trackerKey = assignedStudent.className || assignedStudent.department;
              if (!regNoTracker[trackerKey]) {
                regNoTracker[trackerKey] = {
                  className: trackerKey,
                  department: assignedStudent.department,
                  subjectCode: assignedStudent.subjectCode,
                  subjectName: assignedStudent.subjectName,
                  startRegNo: assignedStudent.registerNumber,
                  endRegNo: assignedStudent.registerNumber,
                  count: 0
                };
              }
              if (assignedStudent.registerNumber < regNoTracker[trackerKey].startRegNo) {
                regNoTracker[trackerKey].startRegNo = assignedStudent.registerNumber;
              }
              if (assignedStudent.registerNumber > regNoTracker[trackerKey].endRegNo) {
                regNoTracker[trackerKey].endRegNo = assignedStudent.registerNumber;
              }
              regNoTracker[trackerKey].count++;
            }
          }

          benches.push({
            row: r,
            col: c,
            benchNumber: benchCounter++,
            seats: benchSeats
          });
        }
      }

      const ranges = Object.values(regNoTracker);

      allocatedHalls.push({
        hallId: currentHall._id,
        hallNumber: currentHall.hallNumber,
        block: currentHall.block,
        rows: currentHall.rows,
        columns: currentHall.columns,
        seatsPerBench: currentHall.seatsPerBench || 2,
        totalCapacity: currentHall.totalCapacity,
        occupiedCount: hallOccupiedSeats,
        benches,
        departmentsPresent: Array.from(hallDepartments),
        registerNumberRanges: ranges,
        invigilatorName: 'Faculty Assisting'
      });

      hallIndex++;
      currentHall = halls[hallIndex];
    }

    // 5. Save or update the SeatingAllocation record
    let seating = await SeatingAllocation.findOne({
      institutionId,
      timetableId,
      date: new Date(date),
      session
    });

    if (seating) {
      seating.halls = allocatedHalls;
      seating.totalStudentsAllocated = totalAllocatedStudents;
      seating.examTitle = timetable.examTitle;
      await seating.save();
    } else {
      seating = await SeatingAllocation.create({
        institutionId,
        timetableId,
        examTitle: timetable.examTitle,
        date: new Date(date),
        session,
        halls: allocatedHalls,
        totalStudentsAllocated: totalAllocatedStudents
      });
    }

    res.status(201).json({
      success: true,
      allocation: seating,
      message: `Successfully allocated ${totalAllocatedStudents} students across ${allocatedHalls.length} examination halls with anti-copying alternating seating!`
    });
  } catch (error) {
    console.error('Error generating seating allocation:', error);
    res.status(500).json({ success: false, message: 'Failed to generate seating allocation' });
  }
};

// Get seating allocations
const getSeatingAllocations = async (req, res) => {
  try {
    const institutionId = req.user.institutionId;
    const allocations = await SeatingAllocation.find({ institutionId })
      .select('examTitle date session totalStudentsAllocated halls.hallNumber halls.occupiedCount createdAt')
      .sort({ date: -1 });
    res.json({ success: true, allocations });
  } catch (error) {
    console.error('Error fetching seating allocations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch allocations' });
  }
};

// Get specific seating allocation with full bench details
const getSeatingAllocationById = async (req, res) => {
  try {
    const allocation = await SeatingAllocation.findById(req.params.id);
    if (!allocation) return res.status(404).json({ success: false, message: 'Allocation not found' });
    res.json({ success: true, allocation });
  } catch (error) {
    console.error('Error fetching allocation details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch allocation details' });
  }
};

// Update invigilator duty name
const updateInvigilator = async (req, res) => {
  try {
    const { allocationId, hallId, invigilatorName } = req.body;
    const allocation = await SeatingAllocation.findById(allocationId);
    if (!allocation) return res.status(404).json({ success: false, message: 'Allocation not found' });

    const hall = allocation.halls.find(h => h.hallId.toString() === hallId || h._id.toString() === hallId);
    if (hall) {
      hall.invigilatorName = invigilatorName;
      await allocation.save();
    }
    res.json({ success: true, message: 'Invigilator updated' });
  } catch (error) {
    console.error('Error updating invigilator:', error);
    res.status(500).json({ success: false, message: 'Failed to update invigilator' });
  }
};

module.exports = {
  // Halls
  getHalls,
  createHall,
  deleteHall,
  seedDefaultHalls,

  // Student Registry
  getStudentsWithAcademic,
  updateStudentAcademic,
  generateSampleStudents,

  // Timetable
  generateTimetable,
  getTimetables,
  getTimetableById,
  deleteTimetable,

  // Seating
  generateSeatingAllocation,
  getSeatingAllocations,
  getSeatingAllocationById,
  updateInvigilator
};
