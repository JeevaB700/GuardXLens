import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, CheckCircle, AlertTriangle, FileText, History, LogOut, TrendingUp, Award, Calendar, BookOpen, Zap, Shield } from 'lucide-react';
import API_BASE_URL from '../../config';

const StudentDashboard = () => {
    const [exams, setExams] = useState([]);
    const [results, setResults] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "GuardXLens | Student Dashboard";
    }, []);

    useEffect(() => {
        const userStr = sessionStorage.getItem('user');
        const token = sessionStorage.getItem('token');
        if (!userStr || !token) { navigate('/login'); return; }

        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);

        const fetchData = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const [examRes, resRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/student/exams`, config),
                    axios.get(`${API_BASE_URL}/api/student/results/${parsedUser.id}`, config)
                ]);
                const sortedExams = (examRes.data.exams || []).sort((a, b) => b._id.localeCompare(a._id));
                const sortedResults = (resRes.data.results || []).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
                setExams(sortedExams);
                setResults(sortedResults);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        fetchData();
    }, [navigate]);

    const totalTaken = results.length;
    const avgScore = totalTaken > 0
        ? Math.round(results.reduce((acc, curr) => acc + (curr.score / curr.totalMarks) * 100, 0) / totalTaken)
        : 0;
    const pendingExams = exams.filter(e => !e.hasAttempted && new Date() >= new Date(e.startTime) && new Date() <= new Date(e.endTime)).length;

    if (loading || !user) {
        return (
            <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #080c18, #0a0f1e)' }}>
                <div className="d-flex flex-column align-items-center gap-3">
                    <div className="spinner-neon"></div>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Loading</span>
                </div>
            </div>
        );
    }

    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    const statCards = [
        { icon: Zap, label: 'Available Now', value: pendingExams, accent: '#84cc16', desc: 'Ready to take' },
        { icon: TrendingUp, label: 'Avg. Score', value: `${avgScore}%`, accent: '#06b6d4', desc: 'Overall performance' },
        { icon: BookOpen, label: 'Completed', value: totalTaken, accent: '#a78bfa', desc: 'Exams attended' },
    ];

    return (
        <div className="min-vh-100 animate-fade-in" style={{ background: 'linear-gradient(135deg, #080c18 0%, #0a0f1e 100%)' }} data-bs-theme="dark">

            {/* ======= NAVBAR ======= */}
            <nav style={{
                background: 'rgba(6,10,20,0.92)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(132,204,22,0.12)',
                padding: '14px 24px',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
            }}>
                <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div className="d-flex align-items-center gap-2">
                        <div className="logo-cyber-glow rounded d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', padding: '4px' }}>
                            <img src="/logo.png" alt="GX" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1rem' }}>GuardXLens</span>
                        <span className="d-none d-md-inline" style={{ fontSize: '0.65rem', background: 'rgba(132,204,22,0.1)', color: 'var(--gx-neon)', border: '1px solid rgba(132,204,22,0.2)', padding: '2px 8px', borderRadius: '100px', fontWeight: 700, letterSpacing: '0.08em' }}>STUDENT</span>
                    </div>

                    <div className="d-flex align-items-center gap-2 gap-md-3">
                        <div className="d-none d-md-flex flex-column align-items-end">
                            <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.85rem' }}>{user.name}</span>
                            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem' }}>{user.email}</span>
                        </div>
                        <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.08)' }} className="d-none d-md-block" />
                        <button
                            onClick={() => navigate('/student/results')}
                            className="btn btn-sm d-flex align-items-center gap-2"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', borderRadius: '9px', fontSize: '0.8rem', fontWeight: 500 }}
                        >
                            <Award size={14} /> Results
                        </button>
                        <button
                            onClick={() => { sessionStorage.clear(); navigate('/login'); }}
                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', borderRadius: '9px', padding: '6px 10px', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center' }}
                            title="Logout"
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </nav>

            <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '28px 20px' }}>

                {/* ======= HEADER ======= */}
                <div className="animate-slide-down mb-5">
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <div className="status-dot status-dot-green"></div>
                        <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Student Dashboard</span>
                    </div>
                    <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
                        {greeting}, <span style={{ color: 'var(--gx-neon)' }}>{user.name?.split(' ')[0]}</span> 👋
                    </h1>
                </div>

                {/* ======= STATS ROW ======= */}
                <div className="row g-4 mb-5">
                    {statCards.map((s, i) => (
                        <div key={s.label} className={`col-md-4 animate-slide-up stagger-${i + 1}`}>
                            <div className="h-100" style={{
                                background: 'rgba(10,15,30,0.7)',
                                backdropFilter: 'blur(16px)',
                                border: `1px solid ${s.accent}22`,
                                borderRadius: '16px',
                                padding: '24px',
                                transition: 'all 0.3s ease',
                            }}>
                                <div className="d-flex align-items-center gap-3 mb-3">
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '12px',
                                        background: `${s.accent}15`, border: `1px solid ${s.accent}25`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: s.accent,
                                    }}>
                                        <s.icon size={20} />
                                    </div>
                                    <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{s.label}</div>
                                </div>
                                <div style={{ fontSize: '2.8rem', fontWeight: 900, color: '#f8fafc', lineHeight: 1, fontVariantNumeric: 'tabular-nums', marginBottom: '4px' }}>{s.value}</div>
                                <div style={{ fontSize: '0.78rem', color: 'rgba(226,232,240,0.4)' }}>{s.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="row g-4">

                    {/* ======= EXAM GRID ======= */}
                    <div className="col-lg-8">
                        <div className="d-flex align-items-center justify-content-between mb-4">
                            <div className="d-flex align-items-center gap-2">
                                <div style={{ width: '3px', height: '18px', background: 'linear-gradient(to bottom, var(--gx-neon), transparent)', borderRadius: '2px' }} />
                                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Your Assessments</h2>
                            </div>
                            <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', padding: '3px 10px', borderRadius: '100px', fontWeight: 600 }}>
                                {exams.length} total
                            </span>
                        </div>

                        {exams.length === 0 ? (
                            <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center" style={{
                                background: 'rgba(10,15,30,0.5)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '16px', minHeight: '200px'
                            }}>
                                <Calendar size={40} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: '12px' }} />
                                <h5 style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>No exams yet</h5>
                                <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: '0.85rem' }}>Your institution hasn't published any exams.</p>
                            </div>
                        ) : (
                            <div className="row g-3">
                                {exams.map((exam, index) => {
                                    const start = new Date(exam.startTime);
                                    const end = new Date(exam.endTime);
                                    let statusText = "Ready to start";
                                    let isPlayable = true;
                                    let statusColor = 'var(--gx-neon)';
                                    let statusBg = 'rgba(132,204,22,0.1)';

                                    if (exam.hasAttempted) {
                                        statusText = "Already Attended";
                                        isPlayable = false;
                                        statusColor = '#22c55e';
                                        statusBg = 'rgba(34,197,94,0.08)';
                                    } else if (now < start) {
                                        statusText = `Starts ${start.toLocaleString()}`;
                                        isPlayable = false;
                                        statusColor = 'rgba(255,255,255,0.3)';
                                        statusBg = 'rgba(255,255,255,0.03)';
                                    } else if (now > end) {
                                        statusText = "Expired";
                                        isPlayable = false;
                                        statusColor = '#ef4444';
                                        statusBg = 'rgba(239,68,68,0.08)';
                                    } else {
                                        statusText = `Ends ${end.toLocaleString()}`;
                                    }

                                    return (
                                        <div key={exam._id} className={`col-md-6 animate-slide-up stagger-${(index % 4) + 1}`}>
                                            <div className="h-100" style={{
                                                background: 'rgba(10,15,30,0.7)',
                                                backdropFilter: 'blur(16px)',
                                                border: isPlayable ? '1px solid rgba(132,204,22,0.15)' : '1px solid rgba(255,255,255,0.06)',
                                                borderRadius: '14px', padding: '20px',
                                                display: 'flex', flexDirection: 'column',
                                                transition: 'all 0.3s ease',
                                            }}>
                                                <div className="d-flex justify-content-between align-items-start mb-3">
                                                    <span style={{
                                                        fontSize: '0.65rem', fontWeight: 700,
                                                        background: 'rgba(132,204,22,0.1)',
                                                        color: 'var(--gx-neon)', border: '1px solid rgba(132,204,22,0.2)',
                                                        padding: '2px 8px', borderRadius: '100px',
                                                        textTransform: 'uppercase', letterSpacing: '0.08em',
                                                    }}>{exam.subject || 'General'}</span>
                                                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', fontFamily: 'JetBrains Mono, monospace' }}>#{exam._id.slice(-4)}</span>
                                                </div>

                                                <h5 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.95rem', marginBottom: '8px' }}>{exam.title}</h5>

                                                <div className="d-flex gap-3 mb-3" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                                                    <span><Clock size={11} style={{ marginRight: '4px' }} />{exam.duration} min</span>
                                                    <span><FileText size={11} style={{ marginRight: '4px' }} />{exam.totalMarks} marks</span>
                                                </div>

                                                <div className="mb-3 px-2 py-1 d-flex align-items-center gap-2" style={{
                                                    background: statusBg, borderRadius: '8px',
                                                    fontSize: '0.72rem', color: statusColor, fontWeight: 500,
                                                }}>
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor, flexShrink: 0, animation: isPlayable ? 'pulse 1.5s ease-in-out infinite' : 'none' }} />
                                                    {statusText}
                                                </div>

                                                <div style={{ marginTop: 'auto' }}>
                                                    <button
                                                        disabled={!isPlayable}
                                                        onClick={() => navigate(`/student/take-exam/${exam._id}`)}
                                                        className="btn w-100 fw-semibold d-flex align-items-center justify-content-center gap-2"
                                                        style={{
                                                            borderRadius: '10px',
                                                            fontSize: '0.85rem',
                                                            background: isPlayable ? 'linear-gradient(135deg, var(--gx-neon), #a3e635)' : 'rgba(255,255,255,0.04)',
                                                            color: isPlayable ? '#050a00' : 'rgba(255,255,255,0.25)',
                                                            border: isPlayable ? 'none' : '1px solid rgba(255,255,255,0.07)',
                                                            boxShadow: isPlayable ? '0 4px 20px rgba(132,204,22,0.3)' : 'none',
                                                            transition: 'all 0.3s ease',
                                                        }}
                                                    >
                                                        {exam.hasAttempted ? (
                                                            <><CheckCircle size={15} /> Completed</>
                                                        ) : isPlayable ? (
                                                            <><Play size={15} fill="currentColor" /> Start Exam</>
                                                        ) : (
                                                            'Not Available'
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ======= RECENT ACTIVITY ======= */}
                    <div className="col-lg-4">
                        <div className="d-flex align-items-center gap-2 mb-4">
                            <div style={{ width: '3px', height: '18px', background: 'linear-gradient(to bottom, var(--gx-cyan), transparent)', borderRadius: '2px' }} />
                            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Recent Activity</h2>
                        </div>

                        <div style={{
                            background: 'rgba(10,15,30,0.7)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: '16px', overflow: 'hidden',
                        }} className="animate-slide-up stagger-2">
                            {results.length === 0 ? (
                                <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center">
                                    <History size={32} style={{ color: 'rgba(255,255,255,0.12)', marginBottom: '10px' }} />
                                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.82rem', margin: 0 }}>No history yet</p>
                                </div>
                            ) : (
                                <>
                                    {results.slice(0, 5).map((r, i) => {
                                        const pct = Math.round((r.score / r.totalMarks) * 100);
                                        const passed = pct >= 40;
                                        return (
                                            <div key={i} style={{
                                                padding: '14px 18px',
                                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                transition: 'background 0.2s ease',
                                            }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.82rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {r.examId?.title || 'Unknown'}
                                                    </span>
                                                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
                                                        {new Date(r.submittedAt).toLocaleDateString()}
                                                    </span>
                                                </div>

                                                {r.isMalpractice ? (
                                                    <div className="d-flex align-items-center gap-1 mt-1">
                                                        <AlertTriangle size={11} style={{ color: '#ef4444' }} />
                                                        <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600 }}>Terminated — Malpractice</span>
                                                    </div>
                                                ) : (
                                                    <div className="d-flex align-items-center justify-content-between mt-2">
                                                        <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden', marginRight: '10px' }}>
                                                            <div style={{ height: '100%', width: `${pct}%`, background: passed ? 'linear-gradient(90deg, var(--gx-neon), #a3e635)' : 'linear-gradient(90deg, #f59e0b, #ef4444)', borderRadius: '2px', transition: 'width 1s ease' }} />
                                                        </div>
                                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: passed ? 'var(--gx-neon)' : '#f59e0b', flexShrink: 0 }}>
                                                            {r.score}/{r.totalMarks}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    <div style={{ padding: '12px 18px' }}>
                                        <button
                                            onClick={() => navigate('/student/results')}
                                            className="btn w-100 btn-sm fw-semibold"
                                            style={{ background: 'rgba(132,204,22,0.08)', border: '1px solid rgba(132,204,22,0.2)', color: 'var(--gx-neon)', borderRadius: '8px', fontSize: '0.8rem' }}
                                        >
                                            View All Results
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
