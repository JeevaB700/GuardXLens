import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FileCheck, Edit, Trash2, Clock, Plus, Search, Layers, Users, Camera, CameraOff, ChevronRight, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config';

const ActiveExams = () => {
    const [activeExams, setActiveExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const token = sessionStorage.getItem('token');
                const res = await axios.get(`${API_BASE_URL}/api/admin/institution-exams`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setActiveExams(res.data.exams || []);
            } catch (e) { console.error("Error fetching exams", e); }
            finally { setLoading(false); }
        };
        fetchExams();
    }, []);

    const handleEditExam = (examId) => navigate(`/institution/edit-exam/${examId}`);

    const handleDeleteExam = async (examId) => {
        if (!window.confirm("Are you sure you want to permanently delete this exam?")) return;
        setDeletingId(examId);
        try {
            const token = sessionStorage.getItem('token');
            const res = await axios.delete(`${API_BASE_URL}/api/admin/exam/${examId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) setActiveExams(prev => prev.filter(e => e._id !== examId));
        } catch (e) { alert("Failed to delete exam"); }
        finally { setDeletingId(null); }
    };

    const filteredExams = activeExams.filter(exam =>
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getExamStatus = (exam) => {
        const now = new Date();
        const start = new Date(exam.startTime);
        const end = new Date(exam.endTime);
        if (now < start) return { label: 'Upcoming', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.2)', dot: true };
        if (now > end)   return { label: 'Expired',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.2)',  dot: false };
        return              { label: 'Live',     color: '#84cc16', bg: 'rgba(132,204,22,0.1)', border: 'rgba(132,204,22,0.2)', dot: true };
    };

    if (loading) return (
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <div className="d-flex flex-column align-items-center gap-3">
                <div className="spinner-neon"></div>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Loading Assessments</span>
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in" style={{ padding: '28px', maxWidth: '1300px' }} data-bs-theme="dark">

            {/* ===== HEADER ===== */}
            <div className="animate-slide-down d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-5">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <div className="status-dot status-dot-green"></div>
                        <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Institution</span>
                    </div>
                    <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
                        Active Assessments
                    </h1>
                    <p style={{ color: 'rgba(226,232,240,0.4)', marginTop: '6px', marginBottom: 0, fontSize: '0.875rem' }}>
                        {activeExams.length} exam{activeExams.length !== 1 ? 's' : ''} created — click any to view results
                    </p>
                </div>
                <button
                    onClick={() => navigate('/institution/create-exam')}
                    className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 btn-hover-scale fw-semibold"
                    style={{ borderRadius: '12px', flexShrink: 0, boxShadow: '0 8px 25px rgba(132,204,22,0.35)', fontSize: '0.9rem' }}
                >
                    <Plus size={18} /> Create New Exam
                </button>
            </div>

            {/* ===== SEARCH ===== */}
            <div className="animate-slide-up stagger-1 mb-4">
                <div style={{ position: 'relative', maxWidth: '480px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                    <input
                        type="text"
                        placeholder="Search by title or subject…"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                            borderRadius: '12px', padding: '11px 14px 11px 42px', color: '#f1f5f9', fontSize: '0.875rem',
                            outline: 'none', transition: 'all 0.3s ease',
                        }}
                        onFocus={e => { e.target.style.borderColor = 'rgba(132,204,22,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(132,204,22,0.08)'; }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none'; }}
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>×</button>
                    )}
                </div>
            </div>

            {/* ===== EXAM LIST ===== */}
            {filteredExams.length === 0 ? (
                <div className="animate-scale-in d-flex flex-column align-items-center justify-content-center py-5 text-center" style={{
                    background: 'rgba(10,15,30,0.5)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '20px', minHeight: '280px'
                }}>
                    <FileCheck size={48} style={{ color: 'rgba(255,255,255,0.08)', marginBottom: '16px' }} />
                    <h4 style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
                        {searchTerm ? 'No matches found' : 'No exams yet'}
                    </h4>
                    <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: '0.85rem', maxWidth: '280px' }}>
                        {searchTerm ? 'Try a different search term.' : 'Create your first secure assessment to get started.'}
                    </p>
                    {!searchTerm && (
                        <button onClick={() => navigate('/institution/create-exam')} className="btn btn-primary btn-sm px-4 mt-2" style={{ borderRadius: '10px' }}>
                            <Plus size={14} className="me-1" /> Create Exam
                        </button>
                    )}
                </div>
            ) : (
                <div className="d-flex flex-column gap-3 animate-slide-up stagger-2">
                    {filteredExams.map((exam, index) => {
                        const status = getExamStatus(exam);
                        const isDeleting = deletingId === exam._id;
                        return (
                            <div
                                key={exam._id}
                                onClick={() => navigate(`/institution/exam-results/${exam._id}`)}
                                style={{
                                    background: 'rgba(10,15,30,0.7)', backdropFilter: 'blur(16px)',
                                    border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px',
                                    padding: '20px 22px', cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                                    opacity: isDeleting ? 0.5 : 1,
                                    animationDelay: `${index * 0.04}s`,
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = 'rgba(132,204,22,0.2)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">

                                    {/* Left: info */}
                                    <div className="flex-grow-1 min-w-0">
                                        <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                                            <h3 style={{ fontSize: '0.975rem', fontWeight: 700, color: '#f1f5f9', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                                                {exam.title}
                                            </h3>
                                            {/* Status badge */}
                                            <span style={{
                                                fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                                                background: status.bg, color: status.color, border: `1px solid ${status.border}`,
                                                padding: '2px 9px', borderRadius: '100px', display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0,
                                            }}>
                                                {status.dot && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: status.color, animation: 'pulse 1.5s ease-in-out infinite' }} />}
                                                {status.label}
                                            </span>
                                            {/* Subject badge */}
                                            <span style={{
                                                fontSize: '0.68rem', fontWeight: 600,
                                                background: 'rgba(6,182,212,0.1)', color: '#06b6d4',
                                                border: '1px solid rgba(6,182,212,0.2)', padding: '2px 9px', borderRadius: '100px',
                                            }}>{exam.subject}</span>
                                            {/* Camera badge */}
                                            <span style={{
                                                fontSize: '0.68rem', fontWeight: 600,
                                                background: exam.cameraMonitoring ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.05)',
                                                color: exam.cameraMonitoring ? '#a78bfa' : 'rgba(255,255,255,0.3)',
                                                border: `1px solid ${exam.cameraMonitoring ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.08)'}`,
                                                padding: '2px 8px', borderRadius: '100px',
                                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                            }}>
                                                {exam.cameraMonitoring ? <Camera size={10} /> : <CameraOff size={10} />}
                                                {exam.cameraMonitoring ? 'AI Proctoring' : 'Standard'}
                                            </span>
                                        </div>

                                        {/* Meta pills */}
                                        <div className="d-flex flex-wrap gap-2">
                                            {[
                                                { icon: Clock, value: `${exam.duration} min` },
                                                { icon: Layers, value: `${exam.questions?.length || 0} questions` },
                                                { icon: FileCheck, value: `${exam.totalMarks} marks` },
                                            ].map((m, i) => (
                                                <span key={i} style={{
                                                    fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500,
                                                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                                                    padding: '3px 10px', borderRadius: '100px',
                                                }}>
                                                    <m.icon size={11} /> {m.value}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right: actions */}
                                    <div className="d-flex align-items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => handleEditExam(exam._id)}
                                            disabled={isDeleting}
                                            style={{
                                                background: 'rgba(132,204,22,0.08)', border: '1px solid rgba(132,204,22,0.2)',
                                                color: 'var(--gx-neon)', borderRadius: '10px', padding: '8px 16px',
                                                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(132,204,22,0.16)'; e.currentTarget.style.transform = 'scale(1.04)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(132,204,22,0.08)'; e.currentTarget.style.transform = 'scale(1)'; }}
                                        >
                                            <Edit size={14} /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteExam(exam._id)}
                                            disabled={isDeleting}
                                            style={{
                                                background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)',
                                                color: '#fca5a5', borderRadius: '10px', padding: '8px 12px',
                                                fontSize: '0.8rem', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', transition: 'all 0.2s ease',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; e.currentTarget.style.transform = 'scale(1.04)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; e.currentTarget.style.transform = 'scale(1)'; }}
                                        >
                                            {isDeleting ? <div className="spinner-border spinner-border-sm" style={{ width: '14px', height: '14px', borderWidth: '2px' }} role="status" /> : <Trash2 size={14} />}
                                        </button>
                                        <div style={{ color: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center' }}>
                                            <ChevronRight size={18} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ActiveExams;
