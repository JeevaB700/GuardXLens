import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { User, ChevronRight, FileText, AlertTriangle, X, Clock, ShieldAlert, ArrowLeft, GraduationCap, TrendingUp, CheckCircle, Search, Shield, Terminal } from 'lucide-react';
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
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    useEffect(() => {
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
            } catch (error) { console.error(error); }
            finally { setLoading(false); }
        };
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

    const calculateStats = () => {
        if (!results.length) return { avg: 0, passed: 0, total: 0 };
        const total = results.length;
        const passed = results.filter(r => (r.score / (r.totalMarks || 1)) >= 0.4).length;
        const avg = Math.round(results.reduce((acc, curr) => acc + (curr.score / (curr.totalMarks || 1)) * 100, 0) / total);
        return { avg, passed, total };
    };

    const stats = selectedStudent ? calculateStats() : {};
    const filteredStudents = (students || []).filter(s =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <div className="d-flex flex-column align-items-center gap-3">
                <div className="spinner-neon"></div>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Loading Students</span>
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in" style={{ padding: '28px', maxWidth: '1300px' }} data-bs-theme="dark">

            {/* ===== LOG MODAL ===== */}
            {logModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setLogModalOpen(false)}>
                    <div className="animate-scale-in" style={{ background: 'rgba(10,15,30,0.97)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '20px', width: '100%', maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(239,68,68,0.1)' }} onClick={e => e.stopPropagation()}>
                        {/* Modal header */}
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
                        {/* Modal body */}
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

            {/* ===== STUDENT DETAIL VIEW ===== */}
            {selectedStudent ? (
                <div className="animate-fade-in">
                    <button onClick={() => setSelectedStudent(null)} className="d-flex align-items-center gap-2 mb-4" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, transition: 'color 0.2s ease', padding: 0 }}
                        onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                    >
                        <ArrowLeft size={16} /> Back to Directory
                    </button>

                    {/* Profile card */}
                    <div className="animate-slide-down mb-4" style={{ background: 'rgba(10,15,30,0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '24px' }}>
                        <div className="d-flex align-items-center gap-4 flex-wrap">
                            <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'linear-gradient(135deg, rgba(132,204,22,0.2), rgba(132,204,22,0.05))', border: '1px solid rgba(132,204,22,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: 'var(--gx-neon)', flexShrink: 0 }}>
                                {selectedStudent.name?.charAt(0) || 'S'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.01em' }}>{selectedStudent.name}</h2>
                                <div className="d-flex flex-wrap gap-2 mt-2">
                                    <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>{selectedStudent.email}</span>
                                    <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', padding: '2px 8px', borderRadius: '100px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                                        ID #{selectedStudent._id?.slice(-6).toUpperCase()}
                                    </span>
                                    {malpracticeList.includes(selectedStudent._id) && (
                                        <span style={{ fontSize: '0.65rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '2px 8px', borderRadius: '100px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                            <ShieldAlert size={10} /> FLAGGED
                                        </span>
                                    )}
                                </div>
                            </div>
                            {allStudentLogs.length > 0 && (
                                <button onClick={() => { setLogStudentName(selectedStudent.name); setStudentLogs(allStudentLogs); setLogModalOpen(true); }}
                                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', color: '#fca5a5', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                                >
                                    <ShieldAlert size={14} /> {allStudentLogs.length} Security Log{allStudentLogs.length !== 1 ? 's' : ''}
                                </button>
                            )}
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
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Activity History</h3>
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
                /* ===== STUDENT DIRECTORY ===== */
                <div className="animate-fade-in">
                    {/* Header */}
                    <div className="animate-slide-down d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-5">
                        <div>
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <div className="status-dot status-dot-green"></div>
                                <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Institution</span>
                            </div>
                            <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>Student Directory</h1>
                            <p style={{ color: 'rgba(226,232,240,0.4)', marginTop: '6px', marginBottom: 0, fontSize: '0.875rem' }}>
                                {students.length} student{students.length !== 1 ? 's' : ''} enrolled — click to view performance
                            </p>
                        </div>
                        {/* Search */}
                        <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                            <Search size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                            <input
                                type="text" placeholder="Search by name or email…"
                                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '11px', padding: '10px 13px 10px 38px', color: '#f1f5f9', fontSize: '0.85rem', outline: 'none', transition: 'all 0.3s ease' }}
                                onFocus={e => { e.target.style.borderColor = 'rgba(132,204,22,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(132,204,22,0.08)'; }}
                                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>
                    </div>

                    {/* Students list */}
                    {filteredStudents.length === 0 ? (
                        <div className="d-flex flex-column align-items-center justify-content-center py-5" style={{ background: 'rgba(10,15,30,0.5)', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: '16px', minHeight: '220px' }}>
                            <User size={40} style={{ color: 'rgba(255,255,255,0.08)', marginBottom: '12px' }} />
                            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem', margin: 0 }}>{searchTerm ? 'No students match your search.' : 'No students enrolled yet.'}</p>
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-2 animate-slide-up stagger-1">
                            {filteredStudents.map((student, i) => {
                                const isFlagged = malpracticeList.includes(student._id);
                                return (
                                    <div key={student._id}
                                        onClick={() => handleStudentClick(student)}
                                        style={{ background: 'rgba(10,15,30,0.65)', backdropFilter: 'blur(14px)', border: `1px solid ${isFlagged ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '13px', padding: '14px 18px', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', animationDelay: `${i * 0.03}s` }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = isFlagged ? 'rgba(239,68,68,0.3)' : 'rgba(132,204,22,0.2)'; e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.background = 'rgba(10,15,30,0.85)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = isFlagged ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.background = 'rgba(10,15,30,0.65)'; }}
                                    >
                                        <div className="d-flex align-items-center gap-3 overflow-hidden flex-grow-1">
                                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: isFlagged ? 'rgba(239,68,68,0.12)' : 'rgba(132,204,22,0.1)', border: `1px solid ${isFlagged ? 'rgba(239,68,68,0.25)' : 'rgba(132,204,22,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', color: isFlagged ? '#ef4444' : 'var(--gx-neon)', flexShrink: 0 }}>
                                                {student.name?.charAt(0) || 'S'}
                                            </div>
                                            <div style={{ overflow: 'hidden' }}>
                                                <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.email}</div>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                                            {isFlagged && (
                                                <button onClick={e => handleAlertClick(e, student)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600, transition: 'all 0.2s ease' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                                                    onClick={e => handleAlertClick(e, student)}
                                                >
                                                    <ShieldAlert size={13} /> Logs
                                                </button>
                                            )}
                                            <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.2)' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default InstitutionStudents;
