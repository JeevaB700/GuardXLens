import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    User, ChevronRight, FileText, AlertTriangle, X, Clock, ShieldAlert,
    ArrowLeft, GraduationCap, TrendingUp, CheckCircle, Search, Terminal,
    Edit3, Sparkles, Layers, Check, RefreshCw
} from 'lucide-react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import API_BASE_URL from '../../config';

/* ── Stat mini-card ─────────────────────────────────── */
const StatBadge = ({ icon: Icon, label, value, accent }) => (
    <div style={{
        background: `${accent}0d`, border: `1px solid ${accent}22`, borderRadius: '14px',
        padding: '16px 18px', flex: 1, minWidth: '100px',
    }}>
        <div style={{ color: accent, marginBottom: '8px' }}><Icon size={18} /></div>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f8fafc', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>{label}</div>
    </div>
);

const DEFAULT_DEPARTMENTS = [
    { code: 'ALL', name: 'All Departments' },
    { code: 'IT', name: 'Information Technology' },
    { code: 'CSE', name: 'Computer Science & Engineering' },
    { code: 'ECE', name: 'Electronics & Communication' },
    { code: 'MECH', name: 'Mechanical Engineering' },
    { code: 'EEE', name: 'Electrical & Electronics' },
    { code: 'AIDS', name: 'AI & Data Science' }
];

const InstitutionStudents = () => {
    const [students, setStudents] = useState([]);
    const [malpracticeList, setMalpracticeList] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [results, setResults] = useState([]);
    const [logModalOpen, setLogModalOpen] = useState(false);
    const [studentLogs, setStudentLogs] = useState([]);
    const [logStudentName, setLogStudentName] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [allStudentLogs, setAllStudentLogs] = useState([]);
    
    // Department & Semester segregation states
    const [selectedDept, setSelectedDept] = useState('ALL');
    const [selectedYearFilter, setSelectedYearFilter] = useState('ALL');

    // Edit Student Modal state
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        _id: '',
        name: '',
        email: '',
        registerNumber: '',
        department: 'IT',
        year: 2,
        semester: 4,
        section: 'A'
    });
    const [savingEdit, setSavingEdit] = useState(false);
    const [toastMessage, setToastMessage] = useState({ type: '', text: '' });

    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const showToast = (type, text) => {
        setToastMessage({ type, text });
        setTimeout(() => setToastMessage({ type: '', text: '' }), 4000);
    };

    const fetchData = async () => {
        try {
            const token = sessionStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [studRes, malRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/auth/my-students`, config),
                axios.get(`${API_BASE_URL}/api/admin/malpractice-students`, config),
            ]);
            const allStudents = studRes.data.students || [];
            setStudents(allStudents);
            setMalpracticeList(malRes.data.studentIds || []);
            const targetId = searchParams.get('id');
            if (targetId) {
                const student = allStudents.find(s => s._id === targetId);
                if (student) handleStudentClick(student);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [searchParams]);

    const handleStudentClick = async (student) => {
        setSelectedStudent(student);
        setResults([]);
        setAllStudentLogs([]);
        try {
            const token = sessionStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [res, logsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/student/results/${student._id}`, config),
                axios.get(`${API_BASE_URL}/api/admin/student-logs/${student._id}`, config),
            ]);
            if (res.data.success) setResults(res.data.results || []);
            if (logsRes.data.success) setAllStudentLogs(logsRes.data.logs || []);
        } catch (error) { console.error(error); }
    };

    const handleAlertClick = async (e, student) => {
        e.stopPropagation();
        setLogStudentName(student.name);
        setLogModalOpen(true);
        setStudentLogs([]);
        try {
            const token = sessionStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/admin/student-logs/${student._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.success) setStudentLogs(res.data.logs || []);
        } catch (error) { console.error(error); }
    };

    // Open Edit Modal
    const handleOpenEdit = (e, student) => {
        e.stopPropagation();
        setEditForm({
            _id: student._id,
            name: student.name || '',
            email: student.email || '',
            registerNumber: student.registerNumber || '',
            department: (student.department || 'IT').toUpperCase(),
            year: student.year || 2,
            semester: student.semester || 4,
            section: student.section || 'A'
        });
        setEditModalOpen(true);
    };

    // Save Student Edit
    const handleSaveEdit = async (e) => {
        e.preventDefault();
        setSavingEdit(true);
        try {
            const token = sessionStorage.getItem('token');
            const res = await axios.put(`${API_BASE_URL}/api/auth/students/${editForm._id}`, editForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                showToast('success', `Student ${editForm.name} updated successfully!`);
                setStudents(prev => prev.map(s => s._id === editForm._id ? { ...s, ...res.data.student } : s));
                if (selectedStudent && selectedStudent._id === editForm._id) {
                    setSelectedStudent(prev => ({ ...prev, ...res.data.student }));
                }
                setEditModalOpen(false);
            }
        } catch (err) {
            console.error(err);
            showToast('error', err.response?.data?.message || 'Failed to update student.');
        } finally {
            setSavingEdit(false);
        }
    };

    // Seed sample Kingston IT Candidates
    const handleSeedKingstonIT = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/exam-cell/students/seed-samples`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                showToast('success', res.data.message || 'Seeded Kingston IT candidates (II, III, IV IT)!');
                await fetchData();
            }
        } catch (err) {
            console.error(err);
            showToast('error', 'Could not seed Kingston students.');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = () => {
        if (!results.length) return { avg: 0, passed: 0, total: 0 };
        const total = results.length;
        const passed = results.filter(r => (r.score / (r.totalMarks || 1)) >= 0.4).length;
        const avg = Math.round(results.reduce((acc, curr) => acc + (curr.score / (curr.totalMarks || 1)) * 100, 0) / total);
        return { avg, passed, total };
    };

    const stats = selectedStudent ? calculateStats() : {};

    // Filter students by search
    const searchedStudents = (students || []).filter(s =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.registerNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter by department
    const deptFilteredStudents = selectedDept === 'ALL'
        ? searchedStudents
        : searchedStudents.filter(s => (s.department || '').toUpperCase() === selectedDept.toUpperCase());

    // Segregate by Semester & Year inside the department
    const groupDefinitions = [
        { key: 'sem4_yr2', label: 'II Year (4th Semester)', year: 2, sem: 4, badge: '2nd Year' },
        { key: 'sem3_yr2', label: 'II Year (3rd Semester)', year: 2, sem: 3, badge: '2nd Year' },
        { key: 'sem6_yr3', label: 'III Year (6th Semester)', year: 3, sem: 6, badge: '3rd Year' },
        { key: 'sem5_yr3', label: 'III Year (5th Semester)', year: 3, sem: 5, badge: '3rd Year' },
        { key: 'sem8_yr4', label: 'IV Year (8th Semester)', year: 4, sem: 8, badge: 'Final Year' },
        { key: 'sem7_yr4', label: 'IV Year (7th Semester)', year: 4, sem: 7, badge: 'Final Year' },
        { key: 'sem2_yr1', label: 'I Year (2nd Semester)', year: 1, sem: 2, badge: '1st Year' },
        { key: 'sem1_yr1', label: 'I Year (1st Semester)', year: 1, sem: 1, badge: '1st Year' },
        { key: 'other', label: 'Unassigned Semester / Direct Entry', year: null, sem: null, badge: 'General' }
    ];

    // Helper to bucket students into their respective Year/Semester groups
    const groupedStudents = groupDefinitions.map(def => {
        let matching = [];
        if (def.key === 'other') {
            matching = deptFilteredStudents.filter(s => {
                const known = groupDefinitions.some(d => d.key !== 'other' && s.year === d.year && s.semester === d.sem);
                return !known;
            });
        } else {
            matching = deptFilteredStudents.filter(s => s.year === def.year && s.semester === def.sem);
        }
        return {
            ...def,
            students: matching
        };
    }).filter(group => group.students.length > 0 || (selectedDept !== 'ALL' && [4, 5, 7].includes(group.sem)));

    if (loading) return (
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <div className="d-flex flex-column align-items-center gap-3">
                <div className="spinner-neon"></div>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Loading Students Directory</span>
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in" style={{ padding: '28px', maxWidth: '1440px', margin: '0 auto' }} data-bs-theme="dark">

            {/* TOAST FEEDBACK */}
            {toastMessage.text && (
                <div style={{
                    position: 'fixed', top: '24px', right: '24px', zIndex: 10000,
                    background: toastMessage.type === 'error' ? 'rgba(239,68,68,0.95)' : 'rgba(132,204,22,0.95)',
                    color: toastMessage.type === 'error' ? '#fff' : '#080c18',
                    padding: '12px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                    <Check size={16} /> {toastMessage.text}
                </div>
            )}

            {/* ===== EDIT STUDENT MODAL ===== */}
            {editModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setEditModalOpen(false)}>
                    <div className="animate-scale-in" style={{ background: 'rgba(10,15,30,0.98)', border: '1px solid rgba(132,204,22,0.3)', borderRadius: '20px', width: '100%', maxWidth: '580px', boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 20px rgba(132,204,22,0.15)' }} onClick={e => e.stopPropagation()}>
                        
                        <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div className="d-flex align-items-center gap-2">
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(132,204,22,0.15)', border: '1px solid rgba(132,204,22,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gx-neon)' }}>
                                    <Edit3 size={17} />
                                </div>
                                <div>
                                    <h5 style={{ fontWeight: 800, color: '#f8fafc', margin: 0, fontSize: '1rem' }}>Edit Student Profile</h5>
                                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>Academic & Identity Details</span>
                                </div>
                            </div>
                            <button onClick={() => setEditModalOpen(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}>
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} style={{ padding: '24px' }}>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label text-white-50 small fw-bold text-uppercase">Full Name</label>
                                    <input
                                        type="text" required
                                        className="form-control form-control-dark"
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-white-50 small fw-bold text-uppercase">Email Address</label>
                                    <input
                                        type="email" required
                                        className="form-control form-control-dark"
                                        value={editForm.email}
                                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-white-50 small fw-bold text-uppercase">Register Number</label>
                                    <input
                                        type="text" required
                                        placeholder="e.g. 511322205001"
                                        className="form-control form-control-dark font-monospace text-warning border-warning border-opacity-25"
                                        value={editForm.registerNumber}
                                        onChange={e => setEditForm({ ...editForm, registerNumber: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label text-white-50 small fw-bold text-uppercase">Department</label>
                                    <select
                                        className="form-select form-control-dark"
                                        value={editForm.department}
                                        onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                                        style={{ background: 'rgba(15,23,42,0.9)', color: '#fff' }}
                                    >
                                        <option value="IT">IT - Information Technology</option>
                                        <option value="CSE">CSE - Computer Science</option>
                                        <option value="ECE">ECE - Electronics & Comm</option>
                                        <option value="MECH">MECH - Mechanical Engg</option>
                                        <option value="EEE">EEE - Electrical Engg</option>
                                        <option value="AIDS">AIDS - AI & Data Science</option>
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label text-white-50 small fw-bold text-uppercase">Year</label>
                                    <select
                                        className="form-select form-control-dark"
                                        value={editForm.year}
                                        onChange={e => setEditForm({ ...editForm, year: Number(e.target.value) })}
                                        style={{ background: 'rgba(15,23,42,0.9)', color: '#fff' }}
                                    >
                                        <option value={1}>1st Year</option>
                                        <option value={2}>2nd Year</option>
                                        <option value={3}>3rd Year</option>
                                        <option value={4}>4th Year</option>
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label text-white-50 small fw-bold text-uppercase">Semester</label>
                                    <select
                                        className="form-select form-control-dark"
                                        value={editForm.semester}
                                        onChange={e => setEditForm({ ...editForm, semester: Number(e.target.value) })}
                                        style={{ background: 'rgba(15,23,42,0.9)', color: '#fff' }}
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                            <option key={s} value={s}>Sem {s}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label text-white-50 small fw-bold text-uppercase">Section</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-dark text-center"
                                        value={editForm.section}
                                        onChange={e => setEditForm({ ...editForm, section: e.target.value.toUpperCase() })}
                                    />
                                </div>
                            </div>

                            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-secondary border-opacity-10">
                                <button
                                    type="button"
                                    onClick={() => setEditModalOpen(false)}
                                    className="btn btn-outline-secondary btn-sm px-3"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingEdit}
                                    className="btn btn-sm d-flex align-items-center gap-2 fw-bold"
                                    style={{
                                        background: 'linear-gradient(135deg, var(--gx-neon), #65a30d)',
                                        color: '#080c18', borderRadius: '8px', padding: '8px 18px'
                                    }}
                                >
                                    {savingEdit ? <RefreshCw size={14} className="spin" /> : <Check size={14} />}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== SECURITY LOGS MODAL ===== */}
            {logModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setLogModalOpen(false)}>
                    <div className="animate-scale-in" style={{ background: 'rgba(10,15,30,0.97)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '20px', width: '100%', maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(239,68,68,0.1)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div className="d-flex align-items-center gap-2">
                                <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ShieldAlert size={16} style={{ color: '#ef4444' }} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.9rem' }}>Security Logs</div>
                                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>{logStudentName}</div>
                                </div>
                            </div>
                            <button onClick={() => setLogModalOpen(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}>
                                <X size={16} />
                            </button>
                        </div>
                        <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }} className="custom-scrollbar">
                            {studentLogs.length === 0 ? (
                                <div className="text-center py-4" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem' }}>No security logs found.</div>
                            ) : studentLogs.map((log, i) => (
                                <div key={i} style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '12px', padding: '14px', marginBottom: '10px', display: 'flex', gap: '12px' }}>
                                    <AlertTriangle size={15} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{log.action || 'Violation'}</span>
                                            <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'JetBrains Mono, monospace' }}>{new Date(log.timestamp).toLocaleString()}</span>
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}><span style={{ color: 'rgba(255,255,255,0.35)' }}>Exam: </span>{log.examId?.title || 'Deleted Exam'}</div>
                                        <code style={{ display: 'block', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '6px', padding: '8px 10px', fontSize: '0.75rem', color: '#fca5a5', wordBreak: 'break-all' }}>{log.details}</code>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== STUDENT DETAIL VIEW (ACTIVE WHEN STUDENT CLICKED) ===== */}
            {selectedStudent ? (
                <div className="animate-fade-in">
                    <button onClick={() => setSelectedStudent(null)} className="d-flex align-items-center gap-2 mb-4" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, transition: 'color 0.2s ease', padding: 0 }}
                        onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                    >
                        <ArrowLeft size={16} /> Back to Department Directory
                    </button>

                    {/* Profile card */}
                    <div className="animate-slide-down mb-4" style={{ background: 'rgba(10,15,30,0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '24px' }}>
                        <div className="d-flex align-items-center justify-content-between gap-4 flex-wrap">
                            <div className="d-flex align-items-center gap-3">
                                <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'linear-gradient(135deg, rgba(132,204,22,0.2), rgba(132,204,22,0.05))', border: '1px solid rgba(132,204,22,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: 'var(--gx-neon)', flexShrink: 0 }}>
                                    {selectedStudent.name?.charAt(0) || 'S'}
                                </div>
                                <div>
                                    <div className="d-flex align-items-center gap-2">
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>{selectedStudent.name}</h2>
                                        <span className="badge bg-primary bg-opacity-25 text-info">{selectedStudent.department || 'IT'}</span>
                                        <span className="badge bg-secondary bg-opacity-25 text-light">{selectedStudent.year === 2 ? 'II IT' : selectedStudent.year === 3 ? 'III IT' : selectedStudent.year === 4 ? 'IV IT' : 'I Year'}</span>
                                    </div>
                                    <div className="d-flex flex-wrap gap-2 mt-2">
                                        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>{selectedStudent.email}</span>
                                        <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#facc15', padding: '2px 8px', borderRadius: '100px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                                            Reg: {selectedStudent.registerNumber || 'Not Set'}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', padding: '2px 8px', borderRadius: '100px' }}>
                                            Semester {selectedStudent.semester || 4} - Sec {selectedStudent.section || 'A'}
                                        </span>
                                        {malpracticeList.includes(selectedStudent._id) && (
                                            <span style={{ fontSize: '0.65rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '2px 8px', borderRadius: '100px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <ShieldAlert size={10} /> FLAGGED
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="d-flex align-items-center gap-2">
                                <button
                                    onClick={(e) => handleOpenEdit(e, selectedStudent)}
                                    className="btn btn-sm d-flex align-items-center gap-2"
                                    style={{
                                        background: 'rgba(255,255,255,0.08)',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        color: '#fff', borderRadius: '10px', padding: '8px 14px'
                                    }}
                                >
                                    <Edit3 size={14} /> Edit Details
                                </button>
                                {allStudentLogs.length > 0 && (
                                    <button onClick={() => { setLogStudentName(selectedStudent.name); setStudentLogs(allStudentLogs); setLogModalOpen(true); }}
                                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', color: '#fca5a5', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <ShieldAlert size={14} /> {allStudentLogs.length} Security Log{allStudentLogs.length !== 1 ? 's' : ''}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="d-flex gap-3 mb-4 flex-wrap animate-slide-up stagger-1">
                        <StatBadge icon={GraduationCap} label="Total Exams" value={stats.total} accent="#06b6d4" />
                        <StatBadge icon={TrendingUp} label="Avg. Score" value={`${stats.avg}%`} accent="var(--gx-neon)" />
                        <StatBadge icon={CheckCircle} label="Passed" value={`${stats.passed}/${stats.total}`} accent="#22c55e" />
                    </div>

                    {/* Activity history */}
                    <div className="animate-slide-up stagger-2">
                        <div className="d-flex align-items-center gap-2 mb-3">
                            <div style={{ width: '3px', height: '18px', background: 'linear-gradient(to bottom, var(--gx-neon), transparent)', borderRadius: '2px' }} />
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Activity & Assessment History</h3>
                        </div>
                        {results.length === 0 ? (
                            <div className="d-flex flex-column align-items-center justify-content-center py-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: '16px' }}>
                                <FileText size={36} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '10px' }} />
                                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem', margin: 0 }}>No exam history recorded yet.</p>
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-2">
                                {results.map((r, idx) => {
                                    const pct = Math.round((r.score / (r.totalMarks || 1)) * 100) || 0;
                                    const isMal = r.violationCount >= 3 || r.isMalpractice;
                                    const isPass = pct >= 40;
                                    const accent = isMal ? '#ef4444' : isPass ? '#22c55e' : '#f59e0b';
                                    return (
                                        <div key={idx}
                                            onClick={() => navigate(`/institution/result-view/${selectedStudent._id}/${r._id}`, { state: { from: location.pathname + location.search } })}
                                            style={{ background: 'rgba(10,15,30,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '13px', padding: '14px 18px', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = `${accent}25`; e.currentTarget.style.transform = 'translateX(4px)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                                        >
                                            <div className="d-flex align-items-center gap-3 overflow-hidden flex-grow-1">
                                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${accent}12`, border: `1px solid ${accent}25`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: accent }}>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 900, lineHeight: 1 }}>{pct}%</span>
                                                    <span style={{ fontSize: '0.55rem', fontWeight: 600, opacity: 0.7 }}>SCORE</span>
                                                </div>
                                                <div style={{ overflow: 'hidden', minWidth: 0 }}>
                                                    <h6 style={{ fontWeight: 700, color: '#f1f5f9', margin: 0, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.examId?.title || 'Deleted Exam'}</h6>
                                                    <div className="d-flex flex-wrap gap-2 mt-1">
                                                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Clock size={10} /> {new Date(r.submittedAt).toLocaleDateString()}
                                                        </span>
                                                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Terminal size={10} /> {r.examId?.subject || 'General'}
                                                        </span>
                                                        {isMal && (
                                                            <span style={{ fontSize: '0.65rem', fontWeight: 700, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', padding: '1px 7px', borderRadius: '100px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                                                <ShieldAlert size={9} /> Malpractice
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

            ) : (
                /* ===== MAIN DIRECTORY: SEGREGATED BY DEPARTMENT & SEMESTER/YEAR ===== */
                <div className="animate-fade-in">

                    {/* Header with Title and Search */}
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3 mb-4">
                        <div>
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <span className="status-dot status-dot-green"></span>
                                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
                                    Institution Academic Registry
                                </span>
                            </div>
                            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
                                Student Directory & Academic Roster
                            </h1>
                            <p style={{ color: 'rgba(226,232,240,0.4)', marginTop: '4px', marginBottom: 0, fontSize: '0.85rem' }}>
                                Segregated by Department and Semester/Year with Anna University Register Numbers
                            </p>
                        </div>

                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            {/* Search bar */}
                            <div style={{ position: 'relative', width: '260px' }}>
                                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                                <input
                                    type="text" placeholder="Search name, reg no, dept…"
                                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '9px 12px 9px 36px', color: '#f1f5f9', fontSize: '0.82rem', outline: 'none' }}
                                />
                            </div>

                            {/* Seed Kingston Candidates */}
                            <button
                                onClick={handleSeedKingstonIT}
                                disabled={loading}
                                className="btn btn-sm d-flex align-items-center gap-2"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(132,204,22,0.2), rgba(132,204,22,0.1))',
                                    border: '1px solid rgba(132,204,22,0.4)',
                                    color: 'var(--gx-neon)',
                                    fontWeight: 700,
                                    borderRadius: '10px',
                                    padding: '8px 14px'
                                }}
                            >
                                <Sparkles size={14} /> Seed Kingston IT Roster
                            </button>
                        </div>
                    </div>

                    {/* ======================================================== */}
                    {/* DEPARTMENT TABS (LEVEL 1 SEGREGATION) */}
                    {/* ======================================================== */}
                    <div className="mb-4">
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <Layers size={14} style={{ color: 'var(--gx-neon)' }} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                Filter By Department:
                            </span>
                        </div>
                        <div className="d-flex gap-2 pb-2 overflow-auto custom-scrollbar">
                            {DEFAULT_DEPARTMENTS.map(dept => {
                                const isSelected = selectedDept === dept.code;
                                const count = dept.code === 'ALL'
                                    ? searchedStudents.length
                                    : searchedStudents.filter(s => (s.department || '').toUpperCase() === dept.code).length;

                                return (
                                    <button
                                        key={dept.code}
                                        onClick={() => setSelectedDept(dept.code)}
                                        className="btn btn-sm d-flex align-items-center gap-2 text-nowrap"
                                        style={{
                                            background: isSelected ? 'rgba(132,204,22,0.18)' : 'rgba(255,255,255,0.04)',
                                            border: `1px solid ${isSelected ? 'rgba(132,204,22,0.4)' : 'rgba(255,255,255,0.08)'}`,
                                            color: isSelected ? 'var(--gx-neon)' : 'rgba(255,255,255,0.65)',
                                            fontWeight: isSelected ? 800 : 500,
                                            borderRadius: '10px',
                                            padding: '8px 14px',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <span>{dept.code}</span>
                                        <span style={{
                                            fontSize: '0.65rem', padding: '1px 7px', borderRadius: '100px',
                                            background: isSelected ? 'var(--gx-neon)' : 'rgba(255,255,255,0.08)',
                                            color: isSelected ? '#000' : 'rgba(255,255,255,0.5)',
                                            fontWeight: 800
                                        }}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ======================================================== */}
                    {/* SEMESTER & YEAR SECTIONS (LEVEL 2 SEGREGATION) */}
                    {/* ======================================================== */}
                    {groupedStudents.length === 0 ? (
                        <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center" style={{
                            background: 'rgba(10,15,30,0.5)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '16px', minHeight: '220px'
                        }}>
                            <User size={40} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '12px' }} />
                            <h5 style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>No students found in this department</h5>
                            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>
                                Click "Seed Kingston IT Roster" above to populate sample Anna University registered students.
                            </p>
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-4">
                            {groupedStudents.map((grp) => (
                                <div
                                    key={grp.key}
                                    style={{
                                        background: 'rgba(10,15,30,0.7)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    {/* Sub-header for Year & Semester */}
                                    <div style={{
                                        padding: '14px 20px',
                                        background: 'linear-gradient(90deg, rgba(255,255,255,0.03), transparent)',
                                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: '8px'
                                    }}>
                                        <div className="d-flex align-items-center gap-2">
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gx-neon)' }} />
                                            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                                                {grp.label}
                                            </h3>
                                            <span style={{
                                                fontSize: '0.65rem',
                                                background: 'rgba(132,204,22,0.15)',
                                                border: '1px solid rgba(132,204,22,0.3)',
                                                color: 'var(--gx-neon)',
                                                padding: '2px 8px',
                                                borderRadius: '100px',
                                                fontWeight: 700
                                            }}>
                                                {grp.badge}
                                            </span>
                                        </div>

                                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                                            {grp.students.length} student{grp.students.length !== 1 ? 's' : ''} enrolled
                                        </span>
                                    </div>

                                    {/* Student rows in this group */}
                                    {grp.students.length === 0 ? (
                                        <div className="p-4 text-center" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem' }}>
                                            No candidates currently enrolled in {grp.label}.
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-dark table-hover mb-0" style={{ fontSize: '0.82rem', background: 'transparent' }}>
                                                <thead style={{ background: 'rgba(0,0,0,0.25)', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', fontSize: '0.68rem' }}>
                                                    <tr>
                                                        <th className="py-2 px-3" style={{ width: '45px' }}>#</th>
                                                        <th className="py-2 px-3" style={{ minWidth: '150px' }}>Register Number</th>
                                                        <th className="py-2 px-3" style={{ minWidth: '180px' }}>Student Name</th>
                                                        <th className="py-2 px-3" style={{ minWidth: '180px' }}>Email</th>
                                                        <th className="py-2 px-3" style={{ width: '90px' }}>Dept</th>
                                                        <th className="py-2 px-3" style={{ width: '80px' }}>Class</th>
                                                        <th className="py-2 px-3" style={{ width: '80px' }}>Sec</th>
                                                        <th className="py-2 px-3 text-end" style={{ width: '180px' }}>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {grp.students.map((student, sIdx) => {
                                                        const isFlagged = malpracticeList.includes(student._id);
                                                        return (
                                                            <tr key={student._id || sIdx} style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                                                <td className="py-2 px-3 text-secondary align-middle">{sIdx + 1}</td>
                                                                <td className="py-2 px-3 align-middle">
                                                                    <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#facc15', fontWeight: 800 }}>
                                                                        {student.registerNumber || '—'}
                                                                    </span>
                                                                </td>
                                                                <td className="py-2 px-3 align-middle text-white fw-semibold">
                                                                    <div className="d-flex align-items-center gap-2">
                                                                        <span>{student.name}</span>
                                                                        {isFlagged && (
                                                                            <span style={{ fontSize: '0.6rem', color: '#ef4444', fontWeight: 800, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', padding: '1px 6px', borderRadius: '4px' }}>
                                                                                FLAGGED
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="py-2 px-3 align-middle text-secondary">{student.email}</td>
                                                                <td className="py-2 px-3 align-middle text-info fw-bold">{student.department || 'IT'}</td>
                                                                <td className="py-2 px-3 align-middle text-secondary">
                                                                    {student.year === 2 ? 'II IT' : student.year === 3 ? 'III IT' : student.year === 4 ? 'IV IT' : 'I IT'}
                                                                </td>
                                                                <td className="py-2 px-3 align-middle text-secondary">{student.section || 'A'}</td>
                                                                <td className="py-2 px-3 align-middle text-end">
                                                                    <div className="d-flex align-items-center justify-content-end gap-2">
                                                                        <button
                                                                            onClick={() => handleStudentClick(student)}
                                                                            className="btn btn-sm d-flex align-items-center gap-1"
                                                                            style={{
                                                                                background: 'rgba(255,255,255,0.06)',
                                                                                border: '1px solid rgba(255,255,255,0.1)',
                                                                                color: 'rgba(255,255,255,0.8)',
                                                                                fontSize: '0.72rem',
                                                                                padding: '4px 8px',
                                                                                borderRadius: '6px'
                                                                            }}
                                                                            title="View Exam Results & Malpractice History"
                                                                        >
                                                                            <FileText size={12} /> Results
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => handleOpenEdit(e, student)}
                                                                            className="btn btn-sm d-flex align-items-center gap-1"
                                                                            style={{
                                                                                background: 'rgba(132,204,22,0.12)',
                                                                                border: '1px solid rgba(132,204,22,0.3)',
                                                                                color: 'var(--gx-neon)',
                                                                                fontSize: '0.72rem',
                                                                                padding: '4px 8px',
                                                                                borderRadius: '6px'
                                                                            }}
                                                                            title="Edit Student Details"
                                                                        >
                                                                            <Edit3 size={12} /> Edit
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default InstitutionStudents;
