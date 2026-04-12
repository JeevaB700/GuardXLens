import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, FileCheck, AlertTriangle, Globe, Activity, Search, X, Shield, TrendingUp, Zap } from 'lucide-react';
import API_BASE_URL from '../../config';

const DashboardHome = () => {
    const [stats, setStats] = useState({ students: 0, exams: 0, institutions: 0, violations: 0 });
    const [recentLogs, setRecentLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const fetchStats = async (search = '') => {
        try {
            const token = sessionStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            if (search) {
                setIsSearching(true);
                const res = await axios.get(`${API_BASE_URL}/api/admin/logs?search=${search}`, config);
                setRecentLogs(res.data.logs || []);
                setIsSearching(false);
                return;
            }
            const [logsRes, instRes, studRes, examsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/admin/logs`, config),
                axios.get(`${API_BASE_URL}/api/auth/institutions`, config),
                axios.get(`${API_BASE_URL}/api/auth/all-students`, config),
                axios.get(`${API_BASE_URL}/api/student/exams`, config),
            ]);
            setStats({
                students: studRes.data.results?.length || 0,
                exams: examsRes.data.exams?.length || 0,
                institutions: instRes.data.institutions?.length || 0,
                violations: logsRes.data.totalCount || 0,
            });
            setRecentLogs(logsRes.data.logs?.slice(0, 10) || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchStats(); }, []);
    useEffect(() => {
        const delay = setTimeout(() => fetchStats(searchTerm), searchTerm ? 500 : 300);
        return () => clearTimeout(delay);
    }, [searchTerm]);

    if (loading) return (
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <div className="d-flex flex-column align-items-center gap-3">
                <div className="spinner-neon"></div>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Loading Dashboard</span>
            </div>
        </div>
    );

    const statCards = [
        { title: 'Institutions', value: stats.institutions, icon: Globe, accent: '#84cc16' },
        { title: 'Total Students', value: stats.students, icon: Users, accent: '#06b6d4' },
        { title: 'Active Exams', value: stats.exams, icon: FileCheck, accent: '#a78bfa' },
        { title: 'Security Alerts', value: stats.violations, icon: AlertTriangle, accent: '#ef4444' },
    ];

    return (
        <div className="animate-fade-in p-mobile-3" style={{ padding: '28px', maxWidth: '1300px' }} data-bs-theme="dark">

            {/* ===== HEADER ===== */}
            <div className="animate-slide-down d-flex justify-content-between align-items-start mb-5 flex-wrap gap-3">
                <div>
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <div className="status-dot status-dot-green"></div>
                        <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Super Admin</span>
                    </div>
                    <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>Dashboard Overview</h1>
                    <p style={{ color: 'rgba(226,232,240,0.4)', marginTop: '6px', marginBottom: 0, fontSize: '0.875rem' }}>
                        Monitor global system activity and security health.
                    </p>
                </div>
                <div className="d-flex align-items-center gap-2 py-2 px-3 rounded-3" style={{ background: 'rgba(132,204,22,0.08)', border: '1px solid rgba(132,204,22,0.2)' }}>
                    <div className="status-dot status-dot-green"></div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gx-neon)' }}>All Systems Online</span>
                </div>
            </div>

            {/* ===== STAT CARDS ===== */}
            <div className="row g-3 g-md-4 mb-5">
                {statCards.map((s, i) => (
                    <div key={s.title} className={`col-6 col-xl-3 animate-up stagger-${i + 1}`}>
                        <div className="stat-card-premium h-100 p-mobile-3" style={{
                            background: 'rgba(10,15,30,0.7)', backdropFilter: 'blur(16px)',
                            border: `1px solid ${s.accent}20`,
                            padding: '22px',
                        }}>
                            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: `radial-gradient(circle, ${s.accent}12, transparent)`, borderRadius: '50%', pointerEvents: 'none' }} />
                            <div className="d-flex align-items-center gap-3 mb-3">
                                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${s.accent}15`, border: `1px solid ${s.accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.accent, flexShrink: 0 }}>
                                    <s.icon size={19} />
                                </div>
                                <span className="d-none d-sm-inline" style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.title}</span>
                            </div>
                            <div style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, color: '#f8fafc', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                            {/* mini progress */}
                            <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', marginTop: '14px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: '45%', background: `linear-gradient(90deg, ${s.accent}, ${s.accent}80)`, borderRadius: '2px', boxShadow: `0 0 8px ${s.accent}60` }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ===== ACTIVITY LOG ===== */}
            <div className="animate-slide-up stagger-4">
                <div style={{ background: 'rgba(10,15,30,0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '18px', overflow: 'hidden' }}>

                    {/* Card header */}
                    <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                        <div className="d-flex align-items-center gap-2">
                            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(132,204,22,0.1)', border: '1px solid rgba(132,204,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Activity size={15} style={{ color: 'var(--gx-neon)' }} />
                            </div>
                            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                                {searchTerm ? 'Search Results' : 'Recent Security Activity'}
                            </h2>
                        </div>
                        {/* Search */}
                        <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                            <input
                                type="text" placeholder="Search by student name…"
                                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '10px', padding: '9px 34px 9px 34px', color: '#f1f5f9', fontSize: '0.8rem', outline: 'none', transition: 'all 0.3s ease' }}
                                onFocus={e => { e.target.style.borderColor = 'rgba(132,204,22,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(132,204,22,0.08)'; }}
                                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none'; }}
                            />
                            {isSearching && <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}><div className="spinner-border" role="status" style={{ width: '12px', height: '12px', borderWidth: '2px', borderColor: 'rgba(132,204,22,0.3)', borderTopColor: 'var(--gx-neon)' }}></div></div>}
                            {searchTerm && !isSearching && <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '2px' }}><X size={13} /></button>}
                        </div>
                    </div>

                    {/* Log list */}
                    <div>
                        {recentLogs.length === 0 ? (
                            <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center">
                                <Shield size={40} style={{ color: 'rgba(255,255,255,0.08)', marginBottom: '12px' }} />
                                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem', margin: 0 }}>
                                    {searchTerm ? `No logs matching "${searchTerm}".` : 'No security activity recorded yet.'}
                                </p>
                            </div>
                        ) : recentLogs.map((log, i) => (
                            <div key={i} style={{ padding: '14px 22px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', transition: 'background 0.2s ease' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <div className="d-flex align-items-center gap-3 overflow-hidden flex-grow-1">
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <AlertTriangle size={15} style={{ color: '#ef4444' }} />
                                    </div>
                                    <div style={{ overflow: 'hidden' }}>
                                        <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.action}</div>
                                        <div className="d-flex align-items-center gap-2 mt-1">
                                            <span style={{ fontSize: '0.72rem', color: 'var(--gx-neon)', fontWeight: 600 }}>{log.studentId?.name || 'Unknown'}</span>
                                            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem' }}>•</span>
                                            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.examId?.title || 'Unknown Exam'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-end flex-shrink-0">
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f1f5f9', fontFamily: 'JetBrains Mono, monospace' }}>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>{new Date(log.timestamp).toLocaleDateString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
