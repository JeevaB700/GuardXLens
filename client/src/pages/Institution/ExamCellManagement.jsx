import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Calendar,
  Grid,
  Users,
  Printer,
  Plus,
  Trash2,
  Clock,
  Building,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  FileText,
  UserCheck,
  RefreshCw,
  Search,
  BookOpen,
  Edit3,
  Download,
  Copy,
  Save,
  Sun,
  Moon,
  Wand2,
  Layers,
  Sliders
} from 'lucide-react';
import API_BASE_URL from '../../config';

// ==========================================
// OFFICIAL KINGSTON COLLEGE EMBLEM & HEADER
// ==========================================
const KingstonHeader = ({ department, examTitle, subHeader, compact = false }) => (
  <div className="text-center" style={{ marginBottom: compact ? '10px' : '18px' }}>
    {/* Official Kingston Engineering College Logo */}
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: compact ? '6px' : '10px' }}>
      <img
        src="/kingston_logo.png"
        alt="Kingston Engineering College"
        style={{
          maxHeight: compact ? '68px' : '96px',
          maxWidth: '100%',
          objectFit: 'contain'
        }}
      />
    </div>

    <div style={{ fontSize: compact ? '0.62rem' : '0.74rem', color: '#334155', marginTop: '2px', fontWeight: 600 }}>
      (Approved by AICTE, New Delhi | Affiliated to Anna University, Chennai)
    </div>
    <div style={{ fontSize: compact ? '0.62rem' : '0.74rem', color: '#334155', fontWeight: 600 }}>
      Chittoor Main Road, Vellore – 632 059. • Accredited with 'A' Grade by NAAC
    </div>

    {/* Department */}
    <div style={{
      fontFamily: "'Times New Roman', Times, serif",
      fontSize: compact ? '0.85rem' : '1.05rem',
      fontWeight: 800,
      color: '#0f172a',
      letterSpacing: '0.05em',
      marginTop: '10px',
      textTransform: 'uppercase'
    }}>
      {department || 'DEPARTMENT OF INFORMATION TECHNOLOGY'}
    </div>

    {/* Title (GMT-2 / CAT-II / Model Exam) */}
    {examTitle && (
      <div style={{
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: compact ? '0.82rem' : '1rem',
        fontWeight: 900,
        color: '#0f172a',
        letterSpacing: '0.04em',
        marginTop: '6px',
        textTransform: 'uppercase'
      }}>
        {examTitle}
      </div>
    )}

    {subHeader && (
      <div style={{
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: '0.9rem',
        fontWeight: 800,
        color: '#0f172a',
        marginTop: '3px'
      }}>
        {subHeader}
      </div>
    )}
  </div>
);

const ExamCellManagement = () => {
  const [activeTab, setActiveTab] = useState('timetable'); // 'timetable', 'halls', 'seating', 'print', 'students'
  const [printDocType, setPrintDocType] = useState('timetable'); // 'timetable', 'seating_chart', 'attendance_sheet'
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Data states
  const [timetables, setTimetables] = useState([]);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [halls, setHalls] = useState([]);
  const [students, setStudents] = useState([]);
  const [seatingAllocations, setSeatingAllocations] = useState([]);
  const [activeAllocation, setActiveAllocation] = useState(null);
  const [selectedHallForAttendance, setSelectedHallForAttendance] = useState(null);
  const [selectedHallForBenchPlan, setSelectedHallForBenchPlan] = useState('ALL');

  // Form states for Timetable Generator (Clean from scratch)
  const [ttDepartment, setTtDepartment] = useState('');
  const [ttExamTitle, setTtExamTitle] = useState('');
  const [ttAcademicYear, setTtAcademicYear] = useState('');

  // Helper to format date + session into label
  const computeSlotLabel = (rawDate, session = 'FN') => {
    if (!rawDate) return `(Select Date) (${session})`;
    const parts = String(rawDate).split('T')[0].split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const dt = new Date(y, m, d);
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const dayName = isNaN(dt.getDay()) ? '' : days[dt.getDay()];
      const dd = String(d).padStart(2, '0');
      const mm = String(m + 1).padStart(2, '0');
      const yy = String(y);
      return `${dd}-${mm}-${yy} ${dayName} (${session})`;
    }
    return `${rawDate} (${session})`;
  };

  // Dates array for timetable columns (starts with 1 empty slot ready for user input)
  const [scheduleDates, setScheduleDates] = useState([
    { id: 'd1', label: '', rawDate: '', session: 'FN' }
  ]);

  const getDayName = (rawDate) => {
    if (!rawDate) return '';
    const parts = String(rawDate).split('T')[0].split('-');
    if (parts.length === 3) {
      const dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return isNaN(dt.getDay()) ? '' : days[dt.getDay()];
    }
    return '';
  };

  // Classes/Years rows (starts with 1 empty class row ready for user input)
  const [scheduleClasses, setScheduleClasses] = useState([
    {
      classId: 'c1',
      className: '',
      classCode: '',
      year: 1,
      sem: 1,
      dept: '',
      subjects: {
        'd1': { code: '', title: '', faculty: '' }
      }
    }
  ]);

  // Hall form state (clean)
  const [hallForm, setHallForm] = useState({
    hallNumber: '',
    block: '',
    floor: '',
    rows: 5,
    columns: 4,
    seatsPerBench: 2
  });

  // Seating Generator selector state (clean)
  const [seatingForm, setSeatingForm] = useState({
    timetableId: '',
    date: '',
    session: 'FN'
  });

  // Search filter for students
  const [studentSearch, setStudentSearch] = useState('');

  // Auth Header helper
  const getAuthHeader = () => {
    const token = sessionStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
  };

  // Initial Data Fetch
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const config = getAuthHeader();
      const [hallsRes, ttRes, seatingRes, studentsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/exam-cell/halls`, config),
        axios.get(`${API_BASE_URL}/api/exam-cell/timetable`, config),
        axios.get(`${API_BASE_URL}/api/exam-cell/seating`, config),
        axios.get(`${API_BASE_URL}/api/exam-cell/students`, config)
      ]);

      if (hallsRes.data.success) setHalls(hallsRes.data.halls || []);
      if (ttRes.data.success) {
        const fetchedTt = ttRes.data.timetables || [];
        setTimetables(fetchedTt);
        if (fetchedTt.length > 0 && !selectedTimetable) {
          setSelectedTimetable(fetchedTt[0]);
          setSeatingForm(prev => ({
            ...prev,
            timetableId: fetchedTt[0]._id,
            date: fetchedTt[0].startDate ? new Date(fetchedTt[0].startDate).toISOString().split('T')[0] : '2025-09-17'
          }));
        }
      }
      if (seatingRes.data.success) {
        const allocs = seatingRes.data.allocations || [];
        setSeatingAllocations(allocs);
        if (allocs.length > 0 && !activeAllocation) {
          fetchAllocationDetail(allocs[0]._id);
        }
      }
      if (studentsRes.data.success) setStudents(studentsRes.data.students || []);
    } catch (err) {
      console.error(err);
      showFeedback('error', 'Failed to load Exam Cell information');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FLEXIBLE TIMETABLE SLOT & CLASS HANDLERS
  // ==========================================

  // Update date of a specific slot
  const updateSlotDate = (slotId, newDate) => {
    setScheduleDates(prev => prev.map(s => {
      if (s.id !== slotId) return s;
      return {
        ...s,
        rawDate: newDate,
        label: computeSlotLabel(newDate, s.session)
      };
    }));
  };

  // Update session (FN or AN) of a specific slot
  const updateSlotSession = (slotId, newSession) => {
    setScheduleDates(prev => prev.map(s => {
      if (s.id !== slotId) return s;
      return {
        ...s,
        session: newSession,
        label: computeSlotLabel(s.rawDate, newSession)
      };
    }));
  };

  // Add single new exam slot (automatically chooses next working day)
  const addExamSlot = () => {
    setScheduleDates(prev => {
      const lastSlot = prev[prev.length - 1];
      let nextDateStr = new Date().toISOString().split('T')[0];
      let nextSession = 'FN';
      if (lastSlot && lastSlot.rawDate) {
        const [y, m, d] = lastSlot.rawDate.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        dt.setDate(dt.getDate() + 1);
        if (dt.getDay() === 0) dt.setDate(dt.getDate() + 1); // Skip Sunday
        const ny = dt.getFullYear();
        const nm = String(dt.getMonth() + 1).padStart(2, '0');
        const nd = String(dt.getDate()).padStart(2, '0');
        nextDateStr = `${ny}-${nm}-${nd}`;
        nextSession = lastSlot.session || 'FN';
      }
      const newId = `slot_${Date.now()}`;
      const newSlot = {
        id: newId,
        rawDate: nextDateStr,
        session: nextSession,
        label: computeSlotLabel(nextDateStr, nextSession)
      };

      // Populate empty subjects for all existing classes
      setScheduleClasses(classes => classes.map(c => ({
        ...c,
        subjects: {
          ...c.subjects,
          [newId]: { code: '', title: '', faculty: '' }
        }
      })));

      return [...prev, newSlot];
    });
    showFeedback('success', 'Added new exam slot. Select date and session in the header.');
  };

  // Remove an exam slot
  const removeExamSlot = (slotId) => {
    if (scheduleDates.length <= 1) {
      showFeedback('error', 'Timetable must contain at least one exam slot.');
      return;
    }
    setScheduleDates(prev => prev.filter(s => s.id !== slotId));
    showFeedback('success', 'Exam slot removed.');
  };

  // Add new class / semester row
  const addClassRow = () => {
    const newClassId = `c_${Date.now()}`;
    const newClass = {
      classId: newClassId,
      className: 'NEW CLASS',
      classCode: 'NEW IT',
      year: 3,
      sem: 5,
      dept: 'IT',
      subjects: {}
    };
    scheduleDates.forEach(d => {
      newClass.subjects[d.id] = { code: '', title: '', faculty: '' };
    });
    setScheduleClasses(prev => [...prev, newClass]);
    showFeedback('success', 'Added new Class/Year row.');
  };

  // Add Multi-Department Set (IT, CSE, AIDS, ECE, MECH)
  const addMultiDeptSet = () => {
    const defaultDepts = [
      { name: 'II CSE', dept: 'CSE', year: 2, sem: 3 },
      { name: 'II IT', dept: 'IT', year: 2, sem: 3 },
      { name: 'II AIDS', dept: 'AIDS', year: 2, sem: 3 },
      { name: 'II ECE', dept: 'ECE', year: 2, sem: 3 },
      { name: 'II MECH', dept: 'MECH', year: 2, sem: 3 }
    ];

    const newRows = defaultDepts.map((dInfo, idx) => {
      const newClassId = `c_${Date.now()}_${idx}`;
      const row = {
        classId: newClassId,
        className: dInfo.name,
        classCode: dInfo.name,
        year: dInfo.year,
        sem: dInfo.sem,
        dept: dInfo.dept,
        subjects: {}
      };
      scheduleDates.forEach(d => {
        row.subjects[d.id] = { code: '', title: '', faculty: '' };
      });
      return row;
    });

    setScheduleClasses(prev => [...prev, ...newRows]);
    showFeedback('success', 'Added 5 Department rows: CSE, IT, AIDS, ECE, MECH!');
  };

  // Remove class row
  const removeClassRow = (classId) => {
    if (scheduleClasses.length <= 1) {
      showFeedback('error', 'At least one class row is required.');
      return;
    }
    setScheduleClasses(prev => prev.filter(c => c.classId !== classId));
  };

  // Update class name
  const updateClassName = (classId, newName) => {
    setScheduleClasses(prev => prev.map(c => c.classId === classId ? { ...c, className: newName } : c));
  };

  // Update class department
  const updateClassDept = (classId, newDept) => {
    setScheduleClasses(prev => prev.map(c => c.classId === classId ? { ...c, dept: newDept } : c));
  };

  // Helper to update a cell in the schedule grid
  const updateCellSubject = (classId, dateId, field, value) => {
    setScheduleClasses(prev => prev.map(c => {
      if (c.classId !== classId) return c;
      return {
        ...c,
        subjects: {
          ...c.subjects,
          [dateId]: {
            ...c.subjects[dateId],
            [field]: value
          }
        }
      };
    }));
  };

  // Load an existing timetable from database into editor
  const handleLoadSavedTimetable = (ttId) => {
    const found = timetables.find(t => t._id === ttId);
    if (!found) return;
    setSelectedTimetable(found);
    setTtDepartment(found.department || 'DEPARTMENT OF INFORMATION TECHNOLOGY');
    setTtExamTitle(found.examTitle || '');
    setTtAcademicYear(found.academicYear || '2025-2026');

    if (found.customDates && found.customDates.length > 0) {
      const loadedSlots = found.customDates.map((cd, idx) => {
        const rawDate = cd.rawDate ? new Date(cd.rawDate).toISOString().split('T')[0] : '2025-09-17';
        const session = cd.session || 'FN';
        return {
          id: `slot_${idx}_${Date.now()}`,
          rawDate,
          session,
          label: cd.dateString || computeSlotLabel(rawDate, session)
        };
      });
      setScheduleDates(loadedSlots);

      if (found.schedules && found.schedules.length > 0) {
        const classMap = {};
        found.schedules.forEach(s => {
          const cName = s.className || `${s.year === 2 ? 'II' : s.year === 3 ? 'III' : 'IV'} ${s.department || 'IT'}`;
          if (!classMap[cName]) {
            classMap[cName] = {
              classId: `c_${Object.keys(classMap).length + 1}`,
              className: cName,
              classCode: cName,
              year: s.year || 3,
              sem: s.semester || 5,
              dept: s.department || 'IT',
              subjects: {}
            };
          }
          const sDateStr = new Date(s.date).toISOString().split('T')[0];
          const matchedSlot = loadedSlots.find(ls => ls.rawDate === sDateStr && ls.session === s.session);
          if (matchedSlot) {
            classMap[cName].subjects[matchedSlot.id] = {
              code: s.subjectCode || '',
              title: s.subjectName || '',
              faculty: s.facultyName || ''
            };
          }
        });
        if (Object.keys(classMap).length > 0) {
          setScheduleClasses(Object.values(classMap));
        }
      }
    }
    showFeedback('success', `Loaded timetable: ${found.examTitle}`);
  };

  // Start fresh blank timetable
  const handleStartBlankTimetable = () => {
    setTtExamTitle('CAT-II EXAMINATION SCHEDULE');
    const todayStr = new Date().toISOString().split('T')[0];
    const initialSlot = {
      id: `slot_${Date.now()}`,
      rawDate: todayStr,
      session: 'FN',
      label: computeSlotLabel(todayStr, 'FN')
    };
    setScheduleDates([initialSlot]);
    setScheduleClasses([
      {
        classId: 'c1',
        className: 'II YEAR',
        classCode: 'II IT',
        year: 2,
        sem: 3,
        dept: 'IT',
        subjects: { [initialSlot.id]: { code: '', title: '', faculty: '' } }
      },
      {
        classId: 'c2',
        className: 'III YEAR',
        classCode: 'III IT',
        year: 3,
        sem: 5,
        dept: 'IT',
        subjects: { [initialSlot.id]: { code: '', title: '', faculty: '' } }
      }
    ]);
    showFeedback('success', 'Created new blank timetable template.');
  };

  // Helper to extract unique (date, session) examination slots from a timetable
  const getAvailableExamSessions = (tt) => {
    if (!tt) return [];
    const sessionMap = new Map();

    if (tt.schedules && tt.schedules.length > 0) {
      tt.schedules.forEach(s => {
        if (!s.subjectCode || s.subjectCode === '-' || s.subjectCode === 'NM') return;
        const rawDate = new Date(s.date).toISOString().split('T')[0];
        const session = s.session || 'FN';
        const key = `${rawDate}__${session}`;
        if (!sessionMap.has(key)) {
          sessionMap.set(key, {
            rawDate,
            session,
            label: computeSlotLabel(rawDate, session),
            classes: []
          });
        }
        const entry = sessionMap.get(key);
        const cLabel = s.className || `${s.year} ${s.department}`;
        if (!entry.classes.includes(cLabel)) {
          entry.classes.push(cLabel);
        }
      });
    } else if (tt.customDates && tt.customDates.length > 0) {
      tt.customDates.forEach(cd => {
        const rawDate = cd.rawDate ? new Date(cd.rawDate).toISOString().split('T')[0] : '';
        if (!rawDate) return;
        const session = cd.session || 'FN';
        const key = `${rawDate}__${session}`;
        if (!sessionMap.has(key)) {
          sessionMap.set(key, {
            rawDate,
            session,
            label: cd.dateString || computeSlotLabel(rawDate, session),
            classes: []
          });
        }
      });
    }

    return Array.from(sessionMap.values()).sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  };

  // 1. SAVE TIMETABLE
  const handleSaveTimetable = async () => {
    if (!ttExamTitle || !ttExamTitle.trim()) {
      showFeedback('error', 'Please enter an Examination Title');
      return;
    }
    if (scheduleDates.length === 0) {
      showFeedback('error', 'Please add at least one exam date slot');
      return;
    }

    setLoading(true);
    try {
      const config = getAuthHeader();

      // Flatten grid into directSchedules with exact session & date
      const directSchedules = [];
      scheduleClasses.forEach(cls => {
        scheduleDates.forEach(dt => {
          const sub = cls.subjects[dt.id];
          if (sub && sub.code && sub.code !== '-') {
            directSchedules.push({
              date: dt.rawDate,
              session: dt.session || 'FN',
              department: cls.dept || 'IT',
              className: cls.className,
              year: cls.year || 3,
              semester: cls.sem || 5,
              subjectCode: sub.code.trim().toUpperCase(),
              subjectName: sub.title || sub.code,
              facultyName: sub.faculty || ''
            });
          }
        });
      });

      const payload = {
        examTitle: ttExamTitle,
        department: ttDepartment,
        academicYear: ttAcademicYear,
        customDates: scheduleDates.map(d => ({
          dateString: d.label,
          rawDate: new Date(d.rawDate),
          session: d.session || 'FN'
        })),
        startDate: scheduleDates[0]?.rawDate || new Date(),
        endDate: scheduleDates[scheduleDates.length - 1]?.rawDate || new Date(),
        directSchedules
      };

      const res = await axios.post(`${API_BASE_URL}/api/exam-cell/timetable/generate`, payload, config);
      if (res.data.success) {
        showFeedback('success', 'Timetable schedule saved & published successfully!');
        setSelectedTimetable(res.data.timetable);
        setTimetables(prev => [res.data.timetable, ...prev.filter(t => t._id !== res.data.timetable._id)]);
        setSeatingForm(prev => ({
          ...prev,
          timetableId: res.data.timetable._id,
          date: scheduleDates[0]?.rawDate || new Date().toISOString().split('T')[0],
          session: scheduleDates[0]?.session || 'FN'
        }));
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Error saving timetable');
    } finally {
      setLoading(false);
    }
  };

  // 2. HALL ACTIONS
  const handleCreateHall = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/api/exam-cell/halls`, hallForm, getAuthHeader());
      if (res.data.success) {
        showFeedback('success', `Exam Hall ${hallForm.hallNumber} added!`);
        setHalls(prev => [...prev, res.data.hall]);
        setHallForm({
          hallNumber: '',
          block: 'Main IT Block',
          floor: '4th Floor',
          rows: 7,
          columns: 3,
          seatsPerBench: 2
        });
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Could not create hall');
    }
  };

  const handleSeedHalls = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE_URL}/api/exam-cell/halls/seed`, {}, getAuthHeader());
      if (res.data.success) {
        showFeedback('success', res.data.message || 'Kingston Halls 404, 405, 406 seeded!');
        const updated = await axios.get(`${API_BASE_URL}/api/exam-cell/halls`, getAuthHeader());
        setHalls(updated.data.halls || []);
      }
    } catch (err) {
      showFeedback('error', 'Failed to seed halls');
    } finally {
      setLoading(false);
    }
  };

  // 3. SEATING ALLOCATION
  const handleGenerateSeating = async () => {
    if (!seatingForm.timetableId || !seatingForm.date || !seatingForm.session) {
      showFeedback('error', 'Please select Timetable, Date, and Session');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/exam-cell/seating/generate`, seatingForm, getAuthHeader());
      if (res.data.success) {
        showFeedback('success', res.data.message);
        setActiveAllocation(res.data.allocation);
        if (res.data.allocation?.halls?.length > 0) {
          setSelectedHallForAttendance(res.data.allocation.halls[0]);
        }
        const updated = await axios.get(`${API_BASE_URL}/api/exam-cell/seating`, getAuthHeader());
        setSeatingAllocations(updated.data.allocations || []);
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Could not generate seating allocation');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllocationDetail = async (id) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/exam-cell/seating/${id}`, getAuthHeader());
      if (res.data.success) {
        setActiveAllocation(res.data.allocation);
        if (res.data.allocation?.halls?.length > 0) {
          setSelectedHallForAttendance(res.data.allocation.halls[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 4. STUDENT SEEDING
  const handleGenerateSampleStudents = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/exam-cell/students/seed-samples`, {}, getAuthHeader());
      if (res.data.success) {
        showFeedback('success', res.data.message);
        const studs = await axios.get(`${API_BASE_URL}/api/exam-cell/students`, getAuthHeader());
        setStudents(studs.data.students || []);
      }
    } catch (err) {
      showFeedback('error', 'Could not generate sample students');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s =>
    (s.name || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.registerNumber || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.department || '').toLowerCase().includes(studentSearch.toLowerCase())
  );

  const handlePrintDocument = () => {
    const printArea = document.getElementById('printable-official-area');
    if (!printArea) {
      window.print();
      return;
    }

    const isLandscape = printDocType === 'timetable';

    try {
      const existingFrame = document.getElementById('gx-print-frame');
      if (existingFrame) existingFrame.remove();

      const iframe = document.createElement('iframe');
      iframe.id = 'gx-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = isLandscape ? '1120px' : '850px';
      iframe.style.height = '1200px';
      iframe.style.border = 'none';
      iframe.style.zIndex = '-9999';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Kingston Engineering College - ${printDocType.toUpperCase()}</title>
            <style>
              @page {
                size: ${isLandscape ? 'A4 landscape' : 'A4 portrait'};
                margin: 6mm 8mm;
              }
              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              html, body {
                margin: 0;
                padding: 0;
                background: #ffffff !important;
                color: #000000 !important;
                font-family: 'Times New Roman', Times, serif, Arial, sans-serif;
              }
              table {
                border-collapse: collapse;
                width: 100%;
              }
              th, td {
                color: #000000 !important;
              }
              .d-print-none {
                display: none !important;
              }
              .official-print-page {
                box-shadow: none !important;
                border: none !important;
                padding: 8px !important;
                margin: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
              }
            </style>
          </head>
          <body>
            ${printArea.innerHTML}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          try {
            iframe.remove();
          } catch (e) {}
        }, 3000);
      }, 350);
    } catch (err) {
      console.warn('Iframe print fallback to window.print', err);
      window.print();
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>

      {/* FEEDBACK TOAST */}
      {feedback.message && (
        <div
          className="animate-slide-down"
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '12px',
            background: feedback.type === 'error' ? 'rgba(239,68,68,0.95)' : 'rgba(132,204,22,0.95)',
            color: feedback.type === 'error' ? '#fff' : '#0a0f1e',
            fontWeight: 700,
            fontSize: '0.875rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {feedback.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          {feedback.message}
        </div>
      )}

      {/* HEADER SECTION (EXCLUDED FROM PRINT) */}
      <div className="d-print-none mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="status-dot status-dot-green"></span>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
                Kingston Engineering College (Affiliated to Anna University)
              </span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
              Examination Cell & Timetable Logistics
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', margin: '4px 0 0 0', fontSize: '0.85rem' }}>
              Official Kingston format timetables, seating arrangements, and pre-printed candidate attendance sheets
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              onClick={() => { setActiveTab('print'); setPrintDocType('timetable'); }}
              className="btn btn-sm d-flex align-items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, rgba(132,204,22,0.2), rgba(132,204,22,0.1))',
                border: '1px solid rgba(132,204,22,0.4)',
                color: 'var(--gx-neon)',
                fontWeight: 700,
                borderRadius: '10px',
                padding: '8px 16px'
              }}
            >
              <Printer size={15} /> Official Print Center
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="d-flex gap-2 mt-4 pb-2 border-bottom border-secondary border-opacity-10 overflow-auto">
          {[
            { id: 'timetable', label: '1. Timetable Generator', icon: Calendar },
            { id: 'halls', label: '2. Exam Halls & Rooms', icon: Building },
            { id: 'seating', label: '3. Seating Allocation Engine', icon: Grid },
            { id: 'print', label: '4. Official Print Center (Kingston Format)', icon: Printer }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="btn btn-sm d-flex align-items-center gap-2 text-nowrap"
                style={{
                  background: isActive ? 'rgba(132,204,22,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isActive ? 'rgba(132,204,22,0.4)' : 'rgba(255,255,255,0.06)'}`,
                  color: isActive ? 'var(--gx-neon)' : 'rgba(255,255,255,0.6)',
                  fontWeight: isActive ? 700 : 500,
                  borderRadius: '10px',
                  padding: '9px 16px',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SIMPLE & EASY TIMETABLE BUILDER */}
      {/* ========================================================================= */}
      {activeTab === 'timetable' && (
        <div className="animate-fade-in d-print-none">

          {/* 1. SIMPLE EXAM DETAILS CARD */}
          <div
            className="p-3 p-md-4 mb-4"
            style={{
              background: 'rgba(15,23,42,0.85)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px'
            }}
          >
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <div>
                <h5 style={{ fontWeight: 800, color: '#f8fafc', margin: 0, fontSize: '1.15rem' }}>
                  Exam Timetable Details
                </h5>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                  Enter exam title, pick dates and sessions (FN/AN), and fill in subjects for each year.
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
                {timetables.length > 0 && (
                  <select
                    className="form-select form-select-sm"
                    value={selectedTimetable?._id || ''}
                    onChange={e => handleLoadSavedTimetable(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.8rem', minWidth: '200px' }}
                  >
                    <option value="">-- Load Saved Timetable --</option>
                    {timetables.map(t => (
                      <option key={t._id} value={t._id}>{t.examTitle}</option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={handleStartBlankTimetable}
                  className="btn btn-sm btn-outline-secondary"
                  style={{ borderRadius: '8px', fontSize: '0.78rem' }}
                >
                  Start New
                </button>
                <button
                  type="button"
                  onClick={handleSaveTimetable}
                  disabled={loading}
                  className="btn btn-sm fw-bold d-flex align-items-center gap-2"
                  style={{ background: 'linear-gradient(135deg, var(--gx-neon), #65a30d)', color: '#080c18', borderRadius: '8px', padding: '7px 16px', fontSize: '0.82rem' }}
                >
                  <Save size={15} /> Save Timetable
                </button>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-5">
                <label className="form-label mb-1" style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>EXAM TITLE</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={ttExamTitle}
                  onChange={e => setTtExamTitle(e.target.value)}
                  placeholder="e.g. CAT-II EXAMINATION SCHEDULE"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700 }}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label mb-1" style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>DEPARTMENT</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={ttDepartment}
                  onChange={e => setTtDepartment(e.target.value)}
                  placeholder="e.g. DEPARTMENT OF INFORMATION TECHNOLOGY"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700 }}
                />
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label mb-1" style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>ACADEMIC YEAR</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={ttAcademicYear}
                  onChange={e => setTtAcademicYear(e.target.value)}
                  placeholder="2025-2026"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700 }}
                />
              </div>
            </div>
          </div>

          {/* 2. THE SIMPLE & INTUITIVE TIMETABLE GRID */}
          <div
            style={{
              background: 'rgba(15,23,42,0.85)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '20px',
              overflow: 'hidden'
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <Calendar size={18} style={{ color: 'var(--gx-neon)' }} />
                <h6 style={{ fontWeight: 800, color: '#f8fafc', margin: 0, fontSize: '0.95rem' }}>
                  Exam Schedule Table
                </h6>
              </div>
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setActiveTab('print'); setPrintDocType('timetable'); }}
                  className="btn btn-sm d-flex align-items-center gap-1"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: '8px' }}
                >
                  <Printer size={14} /> Print Preview
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-bordered table-dark mb-0 align-middle" style={{ borderColor: 'rgba(255,255,255,0.12)', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.4)', textAlign: 'center' }}>
                    <th style={{ width: '150px', padding: '12px', verticalAlign: 'middle', background: 'rgba(0,0,0,0.5)', color: '#94a3b8' }}>
                      Class / Year
                    </th>
                    {scheduleDates.map((d, sIdx) => {
                      const dayName = getDayName(d.rawDate);
                      return (
                        <th key={d.id} style={{ minWidth: '190px', padding: '10px 8px', verticalAlign: 'top', background: 'rgba(10,15,30,0.7)' }}>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span style={{ fontSize: '0.72rem', color: 'var(--gx-neon)', fontWeight: 700 }}>
                              Day {sIdx + 1} {dayName && `• ${dayName}`}
                            </span>
                            {scheduleDates.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeExamSlot(d.id)}
                                className="btn btn-sm btn-link p-0 text-danger"
                                title="Remove this date"
                                style={{ lineHeight: 1 }}
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>

                          {/* Date Picker */}
                          <input
                            type="date"
                            value={d.rawDate || ''}
                            onChange={e => updateSlotDate(d.id, e.target.value)}
                            className="form-control form-control-sm mb-1 fw-bold text-center"
                            style={{
                              fontSize: '0.78rem',
                              padding: '3px 6px',
                              background: 'rgba(255,255,255,0.08)',
                              color: '#fff',
                              border: '1px solid rgba(255,255,255,0.18)',
                              borderRadius: '6px'
                            }}
                          />

                          {/* Session Selector (FN / AN) */}
                          <select
                            value={d.session || 'FN'}
                            onChange={e => updateSlotSession(d.id, e.target.value)}
                            className="form-select form-select-sm fw-bold text-center"
                            style={{
                              fontSize: '0.74rem',
                              padding: '3px 6px',
                              borderRadius: '6px',
                              background: d.session === 'AN' ? 'rgba(245,158,11,0.2)' : 'rgba(56,189,248,0.2)',
                              color: d.session === 'AN' ? '#fbbf24' : '#38bdf8',
                              border: `1px solid ${d.session === 'AN' ? 'rgba(245,158,11,0.4)' : 'rgba(56,189,248,0.4)'}`
                            }}
                          >
                            <option value="FN" style={{ background: '#0f172a', color: '#fff' }}>☀️ FN (Forenoon 09:30 AM)</option>
                            <option value="AN" style={{ background: '#0f172a', color: '#fff' }}>🌙 AN (Afternoon 01:30 PM)</option>
                          </select>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {scheduleClasses.map(cls => (
                    <tr key={cls.classId}>
                      {/* Class Label Column */}
                      <td style={{ padding: '10px', background: 'rgba(0,0,0,0.3)', verticalAlign: 'middle', textAlign: 'center' }}>
                        <input
                          type="text"
                          value={cls.className}
                          onChange={e => updateClassName(cls.classId, e.target.value)}
                          className="form-control form-control-sm text-center fw-bold mb-1"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            borderBottom: '1px solid rgba(56,189,248,0.4)',
                            color: '#38bdf8',
                            fontSize: '0.85rem'
                          }}
                        />
                        <div className="d-flex align-items-center justify-content-center gap-1">
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Dept:</span>
                          <input
                            type="text"
                            value={cls.dept}
                            onChange={e => updateClassDept(cls.classId, e.target.value)}
                            className="text-center"
                            style={{ width: '45px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.68rem', borderRadius: '4px' }}
                          />
                          {scheduleClasses.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeClassRow(cls.classId)}
                              className="btn btn-sm btn-link p-0 text-danger ms-1"
                              title="Delete this class row"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Subject Cells */}
                      {scheduleDates.map(d => {
                        const sub = cls.subjects[d.id] || { code: '', title: '', faculty: '' };
                        return (
                          <td key={d.id} style={{ padding: '8px', verticalAlign: 'top', background: sub.code === '-' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.02)' }}>
                            <input
                              type="text"
                              value={sub.code}
                              placeholder="Code (e.g. CS3391)"
                              onChange={e => updateCellSubject(cls.classId, d.id, 'code', e.target.value)}
                              className="form-control form-control-sm mb-1"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                borderBottom: '1px solid rgba(255,255,255,0.15)',
                                color: sub.code === '-' ? '#94a3b8' : '#f8fafc',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                padding: '2px 0'
                              }}
                            />
                            <input
                              type="text"
                              value={sub.title}
                              placeholder="Subject Name"
                              onChange={e => updateCellSubject(cls.classId, d.id, 'title', e.target.value)}
                              className="form-control form-control-sm mb-1"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#cbd5e1',
                                fontSize: '0.72rem',
                                padding: '2px 0'
                              }}
                            />
                            <input
                              type="text"
                              value={sub.faculty}
                              placeholder="Faculty (optional)"
                              onChange={e => updateCellSubject(cls.classId, d.id, 'faculty', e.target.value)}
                              className="form-control form-control-sm"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#f87171',
                                fontSize: '0.68rem',
                                fontStyle: 'italic',
                                padding: '2px 0'
                              }}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions */}
            <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-secondary border-opacity-10">
              <div className="d-flex gap-2">
                <button
                  type="button"
                  onClick={addExamSlot}
                  className="btn btn-sm d-flex align-items-center gap-1"
                  style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8', borderRadius: '8px' }}
                >
                  <Plus size={14} /> Add Exam Date
                </button>
                <button
                  type="button"
                  onClick={addClassRow}
                  className="btn btn-sm d-flex align-items-center gap-1"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: '8px' }}
                >
                  <Plus size={14} /> Add Class Row
                </button>
              </div>
              <button
                type="button"
                onClick={handleSaveTimetable}
                disabled={loading}
                className="btn btn-sm fw-bold d-flex align-items-center gap-2"
                style={{ background: 'linear-gradient(135deg, var(--gx-neon), #65a30d)', color: '#080c18', borderRadius: '8px', padding: '7px 18px' }}
              >
                <Save size={15} /> Save Timetable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EXAM HALLS (INCLUDING 404, 405, 406) */}
      {/* ========================================================================= */}
      {activeTab === 'halls' && (
        <div className="row g-4 animate-fade-in d-print-none">
          <div className="col-12 col-lg-4">
            <div style={{ background: 'rgba(10,15,30,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '22px' }}>
              <div className="d-flex align-items-center gap-2 mb-3">
                <Building size={18} style={{ color: '#38bdf8' }} />
                <h5 style={{ fontWeight: 800, color: '#f8fafc', margin: 0, fontSize: '1.05rem' }}>Add Examination Hall</h5>
              </div>

              <form onSubmit={handleCreateHall}>
                <div className="mb-3">
                  <label className="form-label" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Hall Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 404, 405, 406"
                    className="form-control form-control-sm"
                    value={hallForm.hallNumber}
                    onChange={e => setHallForm({ ...hallForm, hallNumber: e.target.value })}
                    required
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  />
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Building Block</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={hallForm.block}
                      onChange={e => setHallForm({ ...hallForm, block: e.target.value })}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Floor</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={hallForm.floor}
                      onChange={e => setHallForm({ ...hallForm, floor: e.target.value })}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                    />
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                  <div className="row g-2">
                    <div className="col-4">
                      <label className="form-label mb-1" style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>Rows</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        className="form-control form-control-sm"
                        value={hallForm.rows}
                        onChange={e => setHallForm({ ...hallForm, rows: parseInt(e.target.value) || 1 })}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label mb-1" style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>Cols</label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        className="form-control form-control-sm"
                        value={hallForm.columns}
                        onChange={e => setHallForm({ ...hallForm, columns: parseInt(e.target.value) || 1 })}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                      />
                    </div>
                    <div className="col-4">
                      <label className="form-label mb-1" style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>Seats/Bench</label>
                      <input
                        type="number"
                        min="1"
                        max="3"
                        className="form-control form-control-sm"
                        value={hallForm.seatsPerBench}
                        onChange={e => setHallForm({ ...hallForm, seatsPerBench: parseInt(e.target.value) || 2 })}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-center" style={{ fontSize: '0.75rem', color: 'var(--gx-neon)', fontWeight: 700 }}>
                    Capacity: {hallForm.rows * hallForm.columns * hallForm.seatsPerBench} Candidates
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn w-100 fw-bold d-flex align-items-center justify-content-center gap-2 mb-2"
                  style={{ background: 'rgba(56,189,248,0.2)', border: '1px solid rgba(56,189,248,0.4)', color: '#38bdf8', borderRadius: '12px', padding: '10px' }}
                >
                  <Plus size={16} /> Save Examination Room
                </button>


              </form>
            </div>
          </div>

          <div className="col-12 col-lg-8">
            <div style={{ background: 'rgba(10,15,30,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '22px' }}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 style={{ fontWeight: 800, color: '#f8fafc', margin: 0, fontSize: '1.05rem' }}>Active Exam Halls ({halls.length})</h5>
              </div>

              <div className="row g-3">
                {halls.map((hall, idx) => (
                  <div key={idx} className="col-12 col-md-6">
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '16px' }}>
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <span style={{ fontWeight: 900, color: '#f8fafc', fontSize: '1.2rem' }}>Hall {hall.hallNumber}</span>
                        <span className="badge" style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)' }}>
                          {hall.totalCapacity} Seats
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                        {hall.block} • {hall.floor}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
                        Grid: {hall.rows} Rows × {hall.columns} Columns ({hall.seatsPerBench} per bench)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SEATING ALLOCATION ENGINE */}
      {/* ========================================================================= */}
      {activeTab === 'seating' && (
        <div className="animate-fade-in d-print-none">
          <div className="p-3 mb-4" style={{ background: 'rgba(10,15,30,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px' }}>
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-4">
                <label className="form-label mb-1" style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Select Schedule</label>
                <select
                  className="form-select form-select-sm"
                  value={seatingForm.timetableId}
                  onChange={e => {
                    const newTtId = e.target.value;
                    const matchedTt = timetables.find(t => t._id === newTtId);
                    const avSess = getAvailableExamSessions(matchedTt);
                    setSeatingForm(prev => ({
                      ...prev,
                      timetableId: newTtId,
                      date: avSess[0]?.rawDate || prev.date,
                      session: avSess[0]?.session || prev.session
                    }));
                  }}
                  style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                >
                  <option value="">-- Choose Timetable --</option>
                  {timetables.map(t => (
                    <option key={t._id} value={t._id}>{t.examTitle} ({t.department?.split(' ')[2] || 'IT'})</option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label mb-1" style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Examination Date</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={seatingForm.date}
                  onChange={e => setSeatingForm({ ...seatingForm, date: e.target.value })}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                />
              </div>

              <div className="col-12 col-md-2">
                <label className="form-label mb-1" style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Session</label>
                <select
                  className="form-select form-select-sm"
                  value={seatingForm.session}
                  onChange={e => setSeatingForm({ ...seatingForm, session: e.target.value })}
                  style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                >
                  <option value="FN">FN (09:30 AM - 12:30 PM)</option>
                  <option value="AN">AN (01:30 PM - 04:30 PM)</option>
                </select>
              </div>

              <div className="col-12 col-md-3 d-flex align-items-end">
                <button
                  type="button"
                  onClick={handleGenerateSeating}
                  disabled={loading}
                  className="btn btn-sm w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, var(--gx-neon), #65a30d)',
                    color: '#080c18',
                    borderRadius: '10px',
                    padding: '9px 16px',
                    height: '34px'
                  }}
                >
                  <Grid size={15} /> Run Seating Allocation
                </button>
              </div>
            </div>

            {/* Quick Scheduled Slot Selector Chips from Chosen Timetable */}
            {(() => {
              const activeTt = timetables.find(t => t._id === seatingForm.timetableId);
              const availableSlots = getAvailableExamSessions(activeTt);
              if (!availableSlots || availableSlots.length === 0) return null;
              return (
                <div className="mt-3 pt-3 border-top border-secondary border-opacity-10">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>
                      Scheduled Exam Slots in this Timetable (Click to Select):
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--gx-neon)', fontWeight: 600 }}>
                      {availableSlots.length} Exam Slots Found
                    </span>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {availableSlots.map((slot, sIdx) => {
                      const isSelected = seatingForm.date === slot.rawDate && seatingForm.session === slot.session;
                      const isFn = slot.session === 'FN';
                      return (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => setSeatingForm(prev => ({ ...prev, date: slot.rawDate, session: slot.session }))}
                          className="btn btn-sm d-flex align-items-center gap-2 text-start"
                          style={{
                            background: isSelected
                              ? (isFn ? 'rgba(56,189,248,0.25)' : 'rgba(245,158,11,0.25)')
                              : 'rgba(255,255,255,0.04)',
                            border: isSelected
                              ? `1.5px solid ${isFn ? '#38bdf8' : '#f59e0b'}`
                              : '1px solid rgba(255,255,255,0.1)',
                            color: isSelected
                              ? (isFn ? '#38bdf8' : '#fbbf24')
                              : 'rgba(255,255,255,0.7)',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            fontWeight: isSelected ? 800 : 500,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>{isFn ? '☀️' : '🌙'} {slot.label}</span>
                          {slot.classes?.length > 0 && (
                            <span className="badge" style={{ background: 'rgba(0,0,0,0.35)', fontSize: '0.65rem' }}>
                              {slot.classes.join(', ')}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          {activeAllocation ? (
            <div className="d-flex flex-column gap-4">
              <div className="p-3 d-flex justify-content-between align-items-center" style={{ background: 'rgba(132,204,22,0.06)', border: '1px solid rgba(132,204,22,0.2)', borderRadius: '14px' }}>
                <div>
                  <h6 style={{ fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                    {activeAllocation.examTitle} — {new Date(activeAllocation.date).toDateString()} ({activeAllocation.session})
                  </h6>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
                    Total Candidates Allocated: {activeAllocation.totalStudentsAllocated} across {activeAllocation.halls?.length || 0} Halls (Halls 405, 406, 404)
                  </span>
                </div>
                <div className="d-flex gap-2">
                  <button
                    onClick={() => { setActiveTab('print'); setPrintDocType('seating_chart'); }}
                    className="btn btn-sm d-flex align-items-center gap-1"
                    style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', borderRadius: '8px' }}
                  >
                    <Printer size={13} /> View Seating Chart
                  </button>
                  <button
                    onClick={() => { setActiveTab('print'); setPrintDocType('attendance_sheet'); }}
                    className="btn btn-sm d-flex align-items-center gap-1"
                    style={{ background: 'linear-gradient(135deg, var(--gx-neon), #65a30d)', color: '#080c18', fontWeight: 700, borderRadius: '8px' }}
                  >
                    <UserCheck size={13} /> Candidate Attendance Sheets
                  </button>
                  <button
                    onClick={() => { setActiveTab('print'); setPrintDocType('visual_bench_plan'); setSelectedHallForBenchPlan('ALL'); }}
                    className="btn btn-sm d-flex align-items-center gap-1"
                    style={{ background: 'rgba(56,189,248,0.2)', border: '1px solid rgba(56,189,248,0.4)', color: '#38bdf8', fontWeight: 700, borderRadius: '8px' }}
                  >
                    <Grid size={13} /> Print Door Bench Plan
                  </button>
                </div>
              </div>

              {/* Hall-wise Visual Arrangement */}
              {activeAllocation.halls?.map((hall, hIdx) => (
                <div key={hIdx} style={{ background: 'rgba(10,15,30,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '20px' }}>
                  <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary border-opacity-10">
                    <div>
                      <h5 style={{ fontWeight: 900, color: '#f8fafc', margin: 0 }}>Hall {hall.hallNumber}</h5>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                        Occupancy: {hall.occupiedCount} / {hall.totalCapacity} • Block: {hall.block}
                      </span>
                    </div>
                    <div>
                      <button
                        onClick={() => {
                          setActiveTab('print');
                          setPrintDocType('visual_bench_plan');
                          setSelectedHallForBenchPlan(hall.hallNumber);
                        }}
                        className="btn btn-sm d-flex align-items-center gap-1"
                        style={{ background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)', color: '#38bdf8', fontSize: '0.75rem', borderRadius: '8px', padding: '5px 12px', fontWeight: 700 }}
                      >
                        <Printer size={12} /> Print Hall {hall.hallNumber} Bench Plan
                      </button>
                    </div>
                  </div>

                  {/* Register Number Range Strip (Matching Image 3) */}
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {hall.registerNumberRanges?.map((rng, rIdx) => (
                      <div
                        key={rIdx}
                        style={{
                          background: 'rgba(56,189,248,0.1)',
                          border: '1px solid rgba(56,189,248,0.25)',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '0.75rem'
                        }}
                      >
                        <strong className="text-info">{rng.className || rng.department}</strong>:{' '}
                        <span className="font-monospace text-white">{rng.startRegNo}</span> to{' '}
                        <span className="font-monospace text-white">{rng.endRegNo}</span> ({rng.count} students)
                      </div>
                    ))}
                  </div>

                  {/* Visual Bench Matrix */}
                  <div className="p-3" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '14px', overflowX: 'auto' }}>
                    <div className="text-center pb-2 mb-3" style={{ borderBottom: '2px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', fontWeight: 700 }}>
                      [ BLACKBOARD / INVIGILATOR DAIS ]
                    </div>
                    <div className="d-flex flex-column gap-2">
                      {Array.from({ length: hall.rows }).map((_, rIdx) => {
                        const rowNum = rIdx + 1;
                        const rowBenches = hall.benches.filter(b => b.row === rowNum);
                        return (
                          <div key={rowNum} className="d-flex gap-2 justify-content-center flex-wrap">
                            {rowBenches.map((bench, bIdx) => (
                              <div
                                key={bIdx}
                                style={{
                                  background: 'rgba(15,23,42,0.85)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  borderRadius: '8px',
                                  padding: '6px 8px',
                                  minWidth: '190px'
                                }}
                              >
                                <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700, marginBottom: '4px' }}>
                                  B-{bench.benchNumber}
                                </div>
                                <div className="d-flex gap-1">
                                  {bench.seats?.map((seat, sIdx) => (
                                    <div
                                      key={sIdx}
                                      style={{
                                        flex: 1,
                                        background: seat.className?.includes('III') ? 'rgba(56,189,248,0.15)' : 'rgba(168,85,247,0.15)',
                                        border: `1px solid ${seat.className?.includes('III') ? 'rgba(56,189,248,0.3)' : 'rgba(168,85,247,0.3)'}`,
                                        borderRadius: '5px',
                                        padding: '4px'
                                      }}
                                    >
                                      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: seat.className?.includes('III') ? '#38bdf8' : '#c084fc' }}>
                                        {seat.className || seat.department}
                                      </div>
                                      <div className="font-monospace" style={{ fontSize: '0.62rem', color: '#f8fafc' }}>
                                        {seat.registerNumber}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-5" style={{ background: 'rgba(10,15,30,0.5)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '16px' }}>
              <Grid size={40} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '12px' }} />
              <h6 style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>No Seating Allocated For This Date</h6>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: OFFICIAL PRINT CENTER (EXACT KINGSTON COLLEGE DOCUMENTS) */}
      {/* ========================================================================= */}
      {activeTab === 'print' && (
        <div className="animate-fade-in">
          {/* Print Selector Toolbar (Hidden during print) */}
          <div className="d-print-none p-3 mb-4 d-flex flex-wrap justify-content-between align-items-center gap-3" style={{ background: 'rgba(10,15,30,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px' }}>
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Select Document to Print:</span>
              <div className="btn-group btn-group-sm">
                <button
                  type="button"
                  onClick={() => setPrintDocType('timetable')}
                  className={`btn ${printDocType === 'timetable' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  style={{ fontWeight: 700 }}
                >
                  1. Timetable Document (Images 1, 2, 4)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintDocType('seating_chart')}
                  className={`btn ${printDocType === 'seating_chart' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  style={{ fontWeight: 700 }}
                >
                  2. Seating Chart (Notice Board)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintDocType('attendance_sheet')}
                  className={`btn ${printDocType === 'attendance_sheet' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  style={{ fontWeight: 700 }}
                >
                  3. Pre-Printed Signature Sheet
                </button>
                <button
                  type="button"
                  onClick={() => setPrintDocType('visual_bench_plan')}
                  className={`btn ${printDocType === 'visual_bench_plan' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  style={{ fontWeight: 700 }}
                >
                  4. Visual Bench Layout (Door Notice)
                </button>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              {printDocType === 'attendance_sheet' && activeAllocation && (
                <select
                  className="form-select form-select-sm"
                  value={selectedHallForAttendance?.hallNumber || ''}
                  onChange={e => {
                    const h = activeAllocation.halls.find(x => x.hallNumber === e.target.value);
                    setSelectedHallForAttendance(h);
                  }}
                  style={{ background: 'rgba(15,23,42,0.9)', color: '#fff', fontSize: '0.78rem' }}
                >
                  {activeAllocation.halls?.map(h => (
                    <option key={h.hallNumber} value={h.hallNumber}>Hall {h.hallNumber} Attendance Sheet</option>
                  ))}
                </select>
              )}
              {printDocType === 'visual_bench_plan' && activeAllocation && (
                <select
                  className="form-select form-select-sm"
                  value={selectedHallForBenchPlan || 'ALL'}
                  onChange={e => setSelectedHallForBenchPlan(e.target.value)}
                  style={{ background: 'rgba(15,23,42,0.9)', color: '#fff', fontSize: '0.78rem' }}
                >
                  <option value="ALL">All Halls (Door Notice Batch)</option>
                  {activeAllocation.halls?.map(h => (
                    <option key={h.hallNumber} value={h.hallNumber}>Hall {h.hallNumber} Bench Plan</option>
                  ))}
                </select>
              )}
              <button
                onClick={handlePrintDocument}
                className="btn btn-sm d-flex align-items-center gap-2 fw-bold"
                style={{ background: 'linear-gradient(135deg, var(--gx-neon), #65a30d)', color: '#080c18', borderRadius: '10px', padding: '8px 18px' }}
              >
                <Printer size={16} /> Print Official A4 Document
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* PRINTABLE OFFICIAL CONTAINER */}
          {/* ======================================================== */}
          <div id="printable-official-area">
          {/* DOCUMENT 1: MASTER TIMETABLE (EXACT MATCH FOR IMAGES 1, 2, 4) */}
          {/* ======================================================== */}
          {printDocType === 'timetable' && (
            <div className="official-print-page" style={{ background: '#ffffff', color: '#000000', padding: '36px', borderRadius: '8px', maxWidth: '1100px', margin: '0 auto', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
              <KingstonHeader
                department={ttDepartment}
                examTitle={ttExamTitle}
              />

              <div style={{ marginTop: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#fbf3d5', borderBottom: '1.5px solid #000' }}>
                      <th style={{ border: '1.5px solid #000', padding: '10px 6px', textAlign: 'center', width: '90px', fontFamily: "'Times New Roman', serif", fontWeight: 900 }}>
                        YEAR / DATE
                      </th>
                      {scheduleDates.map(d => (
                        <th key={d.id} style={{ border: '1.5px solid #000', padding: '8px 4px', textAlign: 'center', fontFamily: "'Times New Roman', serif", fontWeight: 800 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 900 }}>{d.label}</div>
                          <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#1e3a8a', marginTop: '3px' }}>
                            SESSION: {d.session || 'FN'}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleClasses.map(cls => (
                      <tr key={cls.classId} style={{ borderBottom: '1.5px solid #000' }}>
                        <td style={{ border: '1.5px solid #000', padding: '10px 6px', textAlign: 'center', fontWeight: 900, fontFamily: "'Times New Roman', serif", verticalAlign: 'middle', background: '#fafafa' }}>
                          {cls.className}
                        </td>
                        {scheduleDates.map(d => {
                          const sub = cls.subjects[d.id] || { code: '-', title: '', faculty: '' };
                          const isDash = sub.code === '-' || sub.code === 'NM';
                          return (
                            <td key={d.id} style={{ border: '1.5px solid #000', padding: '10px 6px', textAlign: 'center', verticalAlign: 'middle' }}>
                              {isDash ? (
                                <div style={{ fontWeight: 700, color: '#333' }}>{sub.code}</div>
                              ) : (
                                <div>
                                  <div style={{ fontWeight: 800, color: '#000', fontFamily: "'Times New Roman', serif", lineHeight: 1.3 }}>
                                    {sub.code} – {sub.title}
                                  </div>
                                  {sub.faculty && (
                                    <div style={{ color: '#800020', fontStyle: 'normal', fontSize: '0.78rem', marginTop: '3px', fontWeight: 700 }}>
                                      ({sub.faculty})
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: '16px', fontSize: '0.75rem', fontWeight: 700, color: '#334155', fontStyle: 'italic', textAlign: 'center' }}>
                  * Examination Timings: Forenoon (FN): 09:30 A.M. to 12:30 P.M. | Afternoon (AN): 01:30 P.M. to 04:30 P.M.
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* DOCUMENT 2: SEATING ARRANGEMENT CHART (EXACT MATCH FOR IMAGE 3) */}
          {/* ======================================================== */}
          {printDocType === 'seating_chart' && (
            <div className="official-print-page" style={{ background: '#ffffff', color: '#000000', padding: '36px', borderRadius: '8px', maxWidth: '900px', margin: '0 auto', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
              <KingstonHeader
                department={ttDepartment}
                examTitle="SEATING ARRANGEMENT(GMTs)"
                subHeader="GMTs"
              />

              <div style={{ marginTop: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #000', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#d1d5db', borderBottom: '2px solid #000' }}>
                      <th style={{ border: '1.5px solid #000', padding: '8px', textAlign: 'center', width: '60px', fontWeight: 900 }}>S.NO</th>
                      <th style={{ border: '1.5px solid #000', padding: '8px', textAlign: 'center', width: '100px', fontWeight: 900 }}>HALL NO</th>
                      <th style={{ border: '1.5px solid #000', padding: '8px', textAlign: 'center', width: '120px', fontWeight: 900 }}>CLASS</th>
                      <th style={{ border: '1.5px solid #000', padding: '8px', textAlign: 'center', fontWeight: 900 }}>REG NO</th>
                      <th style={{ border: '1.5px solid #000', padding: '8px', textAlign: 'center', width: '90px', fontWeight: 900 }}>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Render from real allocation if available, or official Kingston standard */}
                    {activeAllocation?.halls && activeAllocation.halls.length > 0 ? (
                      (() => {
                        let serial = 1;
                        let grandTotal = 0;
                        const rows = [];
                        activeAllocation.halls.forEach((hall) => {
                          const ranges = hall.registerNumberRanges || [];
                          grandTotal += (hall.occupiedCount || 0);

                          if (ranges.length === 0) {
                            rows.push(
                              <tr key={serial} style={{ borderBottom: '1.5px solid #000' }}>
                                <td style={{ border: '1.5px solid #000', padding: '8px', textAlign: 'center', fontWeight: 700 }}>{serial++}</td>
                                <td style={{ border: '1.5px solid #000', padding: '8px', textAlign: 'center', fontWeight: 900 }}>{hall.hallNumber}</td>
                                <td style={{ border: '1.5px solid #000', padding: '8px', textAlign: 'center', fontWeight: 700 }}>All Departments</td>
                                <td style={{ border: '1.5px solid #000', padding: '8px', textAlign: 'center', fontFamily: 'monospace' }}>Allotted</td>
                                <td style={{ border: '1.5px solid #000', padding: '8px', textAlign: 'center', fontWeight: 700 }}>{hall.occupiedCount}</td>
                              </tr>
                            );
                          } else {
                            ranges.forEach((rng, rIdx) => {
                              rows.push(
                                <tr key={`${hall.hallNumber}-${rIdx}`} style={{ borderBottom: rIdx === ranges.length - 1 ? '2px solid #000' : '1px solid #cbd5e1' }}>
                                  {rIdx === 0 && (
                                    <>
                                      <td rowSpan={ranges.length} style={{ border: '1.5px solid #000', padding: '8px', textAlign: 'center', fontWeight: 700, verticalAlign: 'middle', background: '#f8fafc' }}>
                                        {serial++}
                                      </td>
                                      <td rowSpan={ranges.length} style={{ border: '1.5px solid #000', padding: '8px', textAlign: 'center', fontWeight: 900, verticalAlign: 'middle', background: '#f8fafc' }}>
                                        <div style={{ fontSize: '1rem' }}>{hall.hallNumber}</div>
                                        {ranges.length > 1 && (
                                          <div style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 700, marginTop: '2px' }}>
                                            Total: {hall.occupiedCount}
                                          </div>
                                        )}
                                      </td>
                                    </>
                                  )}
                                  <td style={{ border: '1.5px solid #000', padding: '8px', textAlign: 'center', fontWeight: 800 }}>
                                    {rng.className || rng.department}
                                    {rng.subjectCode && (
                                      <span style={{ fontSize: '0.72rem', display: 'block', color: '#475569', fontWeight: 600 }}>({rng.subjectCode})</span>
                                    )}
                                  </td>
                                  <td style={{ border: '1.5px solid #000', padding: '8px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem' }}>
                                    {rng.startRegNo} to {rng.endRegNo}
                                  </td>
                                  <td style={{ border: '1.5px solid #000', padding: '8px', textAlign: 'center', fontWeight: 800 }}>{rng.count}</td>
                                </tr>
                              );
                            });
                          }
                        });
                        return (
                          <>
                            {rows}
                            <tr style={{ background: '#f1f5f9', borderTop: '2px solid #000' }}>
                              <td colSpan="4" style={{ border: '1.5px solid #000', padding: '8px 12px', textAlign: 'right', fontWeight: 900 }}>
                                GRAND TOTAL CANDIDATES:
                              </td>
                              <td style={{ border: '1.5px solid #000', padding: '8px', textAlign: 'center', fontWeight: 900, fontSize: '1.05rem' }}>
                                {grandTotal}
                              </td>
                            </tr>
                          </>
                        );
                      })()
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ padding: '36px', textAlign: 'center', color: '#64748b', fontStyle: 'italic', fontSize: '0.9rem' }}>
                          No seating allocation data found. Run seating allocation from the Seating tab to generate this chart.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* DOCUMENT 3: PRE-PRINTED STUDENT ATTENDANCE & SIGNATURE SHEET */}
          {/* ======================================================== */}
          {printDocType === 'attendance_sheet' && (
            <div className="official-print-page" style={{ background: '#ffffff', color: '#000000', padding: '36px', borderRadius: '8px', maxWidth: '950px', margin: '0 auto', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
              <KingstonHeader
                department={ttDepartment}
                examTitle="CANDIDATE ATTENDANCE & SIGNATURE SHEET"
                subHeader={selectedTimetable?.examTitle || ttExamTitle}
                compact={true}
              />

              {/* Hall & Examination Strip */}
              <div style={{ border: '1.5px solid #000', padding: '8px 12px', marginBottom: '14px', background: '#f8fafc', fontSize: '0.8rem' }}>
                <div className="row g-2">
                  <div className="col-4">
                    <strong>HALL NUMBER:</strong> <span style={{ fontSize: '1rem', fontWeight: 900 }}>{selectedHallForAttendance?.hallNumber || '—'}</span>
                  </div>
                  <div className="col-4">
                    <strong>DATE / SESSION:</strong> {activeAllocation?.date ? new Date(activeAllocation.date).toLocaleDateString() : '—'} ({activeAllocation?.session || '—'})
                  </div>
                  <div className="col-4">
                    <strong>TOTAL ALLOTTED:</strong> <span style={{ fontWeight: 800 }}>{selectedHallForAttendance?.occupiedCount || 0} Students</span>
                  </div>
                </div>
              </div>

              {/* Student Attendance Grid */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #000', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ background: '#e2e8f0', borderBottom: '1.5px solid #000' }}>
                    <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center', width: '35px' }}>S.NO</th>
                    <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center', width: '65px' }}>DESK NO</th>
                    <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left', width: '120px' }}>REGISTER NUMBER</th>
                    <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'left', minWidth: '160px' }}>STUDENT NAME</th>
                    <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center', width: '65px' }}>CLASS</th>
                    <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center', width: '130px' }}>ANSWER BOOKLET NO.</th>
                    <th style={{ border: '1px solid #000', padding: '5px', textAlign: 'center', width: '130px' }}>STUDENT SIGNATURE</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const hall = selectedHallForAttendance || activeAllocation?.halls?.[0];
                    let count = 1;
                    const rows = [];

                    if (hall && hall.benches) {
                      hall.benches.forEach(b => {
                        b.seats?.forEach(seat => {
                          rows.push(
                            <tr key={count} style={{ height: '28px', borderBottom: '1px solid #000' }}>
                              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontWeight: 600 }}>{count++}</td>
                              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontWeight: 700 }}>B-{b.benchNumber}</td>
                              <td style={{ border: '1px solid #000', padding: '4px', fontFamily: 'monospace', fontWeight: 800 }}>{seat.registerNumber}</td>
                              <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 600 }}>{seat.studentName}</td>
                              <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontWeight: 700 }}>{seat.className || '—'}</td>
                              <td style={{ border: '1px solid #000', padding: '4px' }}></td>
                              <td style={{ border: '1px solid #000', padding: '4px' }}></td>
                            </tr>
                          );
                        });
                      });
                    }

                    if (rows.length === 0) {
                      rows.push(
                        <tr key="empty">
                          <td colSpan="7" style={{ padding: '36px', textAlign: 'center', color: '#64748b', fontStyle: 'italic', fontSize: '0.9rem' }}>
                            No candidate attendance records found. Please run seating allocation from the Seating tab first.
                          </td>
                        </tr>
                      );
                    }

                    return rows;
                  })()}
                </tbody>
              </table>

              {/* Bottom Signatures & Verification */}
              <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderTop: '1px solid #cbd5e1', paddingTop: '15px' }}>
                <div>
                  <div><strong>Total Allotted:</strong> {selectedHallForAttendance?.occupiedCount || 42}</div>
                  <div><strong>Total Present:</strong> _______</div>
                  <div><strong>Total Absent:</strong> _______</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderTop: '1px solid #000', width: '180px', paddingTop: '4px', fontWeight: 700 }}>
                    Invigilator Signature
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderTop: '1px solid #000', width: '180px', paddingTop: '4px', fontWeight: 700 }}>
                    Chief Superintendent
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* DOCUMENT 4: VISUAL BENCH SEATING PLAN (DOOR NOTICE) */}
          {/* ======================================================== */}
          {printDocType === 'visual_bench_plan' && (
            (() => {
              const hallsToPrint = (() => {
                if (activeAllocation?.halls && activeAllocation.halls.length > 0) {
                  if (selectedHallForBenchPlan && selectedHallForBenchPlan !== 'ALL') {
                    const matched = activeAllocation.halls.filter(h => h.hallNumber === selectedHallForBenchPlan);
                    return matched.length > 0 ? matched : activeAllocation.halls;
                  }
                  return activeAllocation.halls;
                }

                return [];
              })();

              if (hallsToPrint.length === 0) {
                return (
                  <div className="official-print-page p-5 text-center" style={{ background: '#ffffff', color: '#64748b', borderRadius: '8px', maxWidth: '900px', margin: '0 auto', fontStyle: 'italic', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                    <h5 style={{ fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>No Bench Seating Plan Available</h5>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>
                      Please configure examination halls and generate a seating allocation first from the <strong>Seating Allocation Engine</strong> tab.
                    </p>
                  </div>
                );
              }

              return (
                <div>
                  {hallsToPrint.map((hall, hIdx) => (
                    <div
                      key={hIdx}
                      className="official-print-page bench-plan-page"
                      style={{
                        background: '#ffffff',
                        color: '#000000',
                        padding: '24px 30px',
                        borderRadius: '8px',
                        maxWidth: '1100px',
                        margin: '0 auto 30px auto',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                        pageBreakAfter: hIdx < hallsToPrint.length - 1 ? 'always' : 'auto',
                        breakAfter: hIdx < hallsToPrint.length - 1 ? 'page' : 'auto'
                      }}
                    >
                      <KingstonHeader
                        department={ttDepartment || 'CENTRAL EXAMINATIONS WING'}
                        examTitle={`${activeAllocation?.examTitle || ttExamTitle} — BENCH SEATING PLAN`}
                        subHeader="HALL DOOR NOTICE"
                      />

                      {/* Hall Meta Header */}
                      <div style={{
                        border: '2px solid #000',
                        padding: '10px 16px',
                        margin: '14px 0 10px 0',
                        background: '#f8fafc',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontSize: '1.35rem', fontWeight: 900 }}>HALL {hall.hallNumber}</div>
                          <div style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 600 }}>
                            Block: {hall.block || 'Computing Sciences Wing'} {hall.floor ? `• Floor: ${hall.floor}` : ''}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.15rem', fontWeight: 900 }}>
                            Occupancy: {hall.occupiedCount} / {hall.totalCapacity || hall.occupiedCount}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>
                            {new Date(activeAllocation?.date || seatingForm.date).toDateString()} • {activeAllocation?.session || seatingForm.session}
                          </div>
                        </div>
                      </div>

                      {/* Class / Department Register Number Range Strip (Matching User Screenshot) */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                        {hall.registerNumberRanges?.map((rng, rIdx) => (
                          <div
                            key={rIdx}
                            style={{
                              border: '1.5px solid #000',
                              padding: '4px 12px',
                              borderRadius: '4px',
                              fontSize: '0.82rem',
                              background: '#f1f5f9',
                              fontWeight: 700
                            }}
                          >
                            <span style={{ color: '#0369a1' }}>{rng.className || rng.department}</span>:{' '}
                            <span style={{ fontFamily: 'monospace' }}>{rng.startRegNo}</span> to{' '}
                            <span style={{ fontFamily: 'monospace' }}>{rng.endRegNo}</span> ({rng.count} students)
                          </div>
                        ))}
                      </div>

                      {/* Dais / Blackboard Banner */}
                      <div style={{
                        textAlign: 'center',
                        border: '1.5px solid #000',
                        background: '#e2e8f0',
                        padding: '6px',
                        fontWeight: 900,
                        fontSize: '0.8rem',
                        letterSpacing: '0.1em',
                        marginBottom: '14px'
                      }}>
                        [ BLACKBOARD / INVIGILATOR DAIS ]
                      </div>

                      {/* Visual Bench Matrix (Matching User Screenshot) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Array.from({ length: hall.rows }).map((_, rIdx) => {
                          const rowNum = rIdx + 1;
                          const rowBenches = hall.benches.filter(b => b.row === rowNum);
                          return (
                            <div
                              key={rowNum}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${hall.columns || 4}, 1fr)`,
                                gap: '8px'
                              }}
                            >
                              {rowBenches.map((bench, bIdx) => (
                                <div
                                  key={bIdx}
                                  style={{
                                    border: '1.5px solid #000',
                                    borderRadius: '6px',
                                    padding: '5px 6px',
                                    background: '#ffffff'
                                  }}
                                >
                                  <div style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 900,
                                    borderBottom: '1px solid #cbd5e1',
                                    paddingBottom: '2px',
                                    marginBottom: '4px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    color: '#0f172a'
                                  }}>
                                    <span>B-{bench.benchNumber}</span>
                                    <span style={{ fontSize: '0.62rem', color: '#64748b' }}>R{bench.row}-C{bench.col}</span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    {bench.seats?.map((seat, sIdx) => {
                                      const isDeptA = seat.className?.includes('III') || seat.department === 'IT';
                                      return (
                                        <div
                                          key={sIdx}
                                          style={{
                                            flex: 1,
                                            border: '1px solid #64748b',
                                            borderRadius: '4px',
                                            padding: '3px 4px',
                                            background: isDeptA ? '#eff6ff' : '#faf5ff',
                                            textAlign: 'center'
                                          }}
                                        >
                                          <div style={{
                                            fontSize: '0.65rem',
                                            fontWeight: 800,
                                            color: isDeptA ? '#0369a1' : '#7e22ce',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                          }}>
                                            {seat.className || seat.department}
                                          </div>
                                          <div style={{
                                            fontFamily: 'monospace',
                                            fontSize: '0.68rem',
                                            fontWeight: 900,
                                            color: '#000000'
                                          }}>
                                            {seat.registerNumber}
                                          </div>
                                        </div>
                                      );
                                    })}
                                    {(!bench.seats || bench.seats.length === 0) && (
                                      <div style={{ flex: 1, fontSize: '0.65rem', color: '#94a3b8', textAlign: 'center', padding: '4px' }}>
                                        Vacant
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>

                      {/* Signatures & Verification Block */}
                      <div style={{
                        marginTop: '22px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.8rem',
                        borderTop: '1.5px solid #000',
                        paddingTop: '12px'
                      }}>
                        <div>
                          <div><strong>Total Benches:</strong> {hall.benches?.length || (hall.rows * hall.columns)}</div>
                          <div><strong>Total Candidates Allocated:</strong> {hall.occupiedCount}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ borderTop: '1px solid #000', width: '180px', paddingTop: '4px', fontWeight: 700 }}>
                            Hall Invigilator Signature
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ borderTop: '1px solid #000', width: '180px', paddingTop: '4px', fontWeight: 700 }}>
                            Chief Superintendent
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          )}
          </div>
        </div>
      )}

      {/* PRINT STYLESHEET OVERRIDE */}
      <style>{`
        @media print {
          *, *::before, *::after {
            animation: none !important;
            transition: none !important;
            opacity: 1 !important;
            box-shadow: none !important;
            text-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body, #root, #root > div, .vh-100, main, .overflow-hidden, .overflow-auto {
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            position: static !important;
            background: #ffffff !important;
            color: #000000 !important;
            display: block !important;
            opacity: 1 !important;
          }
          .d-print-none, header, aside, .sidebar-nav-item, nav, .btn, .offcanvas {
            display: none !important;
          }
          #printable-official-area {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .official-print-page {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .bench-plan-page {
            page-break-after: always !important;
            break-after: page !important;
          }
          @page {
            size: ${printDocType === 'timetable' || printDocType === 'visual_bench_plan' ? 'A4 landscape' : 'A4 portrait'};
            margin: 8mm;
          }
        }
      `}</style>
    </div>
  );
};

export default ExamCellManagement;
