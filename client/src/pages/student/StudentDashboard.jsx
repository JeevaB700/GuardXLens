import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, CheckCircle, AlertTriangle, FileText, History, LogOut, TrendingUp, Award, Calendar } from 'lucide-react';
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

                // Sort exams by _id (descending) or createdAt if available
                const sortedExams = (examRes.data.exams || []).sort((a, b) => b._id.localeCompare(a._id));
                // Sort results by submittedAt (descending)
                const sortedResults = (resRes.data.results || []).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

                setExams(sortedExams);
                setResults(sortedResults);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        fetchData();
    }, [navigate]);

    // Derived Stats
    const totalTaken = results.length;
    const avgScore = totalTaken > 0
        ? Math.round(results.reduce((acc, curr) => acc + (curr.score / curr.totalMarks) * 100, 0) / totalTaken)
        : 0;
    const pendingExams = exams.length;

    if (loading || !user) {
        return (
            <div className="vh-100 d-flex align-items-center justify-content-center bg-gradient-dark">
                <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
            </div>
        );
    }

    return (
        <div className="min-vh-100 bg-gradient-dark font-sans d-flex flex-column text-light animate-fade-in" data-bs-theme="dark">

            {/* NAVBAR */}
            <nav className="navbar navbar-expand-lg navbar-dark glass-navbar px-4 py-3 sticky-top">
                <div className="container-fluid d-flex align-items-center justify-content-between flex-nowrap">
                    <span className="navbar-brand fw-bold d-flex align-items-center gap-2 mb-0">
                        <div className="bg-white bg-opacity-10 rounded p-1 d-flex align-items-center justify-content-center shadow-lg border border-white border-opacity-10" style={{ width: '32px', height: '32px' }}>
                            <img src="/logo.png" alt="GX" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <span className="fs-5">GuardXLens</span>
                    </span>

                    <div className="d-flex align-items-center gap-2 gap-md-4">
                        <div className="d-none d-md-flex flex-column text-end">
                            <span className="text-white fw-medium small">{user.name}</span>
                            <span className="text-white-50 small" style={{ fontSize: '0.75rem' }}>{user.email}</span>
                        </div>
                        <div className="vr text-secondary d-none d-md-block opacity-50"></div>
                        <button onClick={() => navigate('/student/results')} className="btn btn-outline-light btn-sm d-flex align-items-center gap-2 border-opacity-25 py-1 px-2 px-md-3">
                            <Award size={14} className="d-none d-sm-block" /> <span style={{ fontSize: '0.8rem' }}>Results</span>
                        </button>
                        <button onClick={() => { sessionStorage.clear(); navigate('/login'); }} className="btn btn-link text-white-50 p-1 hover-text-danger" title="Logout">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </nav>

            <div className="container py-5 flex-grow-1">

                {/* HERO STATS */}
                <div className="row g-4 mb-5">
                    <div className="col-md-4 animate-slide-up stagger-1">
                        <div className="card border-0 shadow-lg bg-primary bg-gradient text-white h-100 overflow-hidden position-relative hover-lift">
                            <div className="card-body p-4 position-relative z-1">
                                <h3 className="h6 text-uppercase text-white-50 fw-bold mb-1">Available Exams</h3>
                                <div className="display-4 fw-bold text-white">{pendingExams}</div>
                                <p className="mb-0 mt-2 small text-white-50">Ready to take</p>
                            </div>
                            <FileText size={120} className="position-absolute bottom-0 end-0 text-white opacity-10 mb-n4 me-n4" />
                        </div>
                    </div>
                    <div className="col-md-4 animate-slide-up stagger-2">
                        <div className="card border-0 shadow-lg glass-panel h-100 hover-lift">
                            <div className="card-body p-4 d-flex flex-column justify-content-center">
                                <div className="d-flex align-items-center gap-3 mb-2">
                                    <div className="p-3 rounded bg-success-subtle text-success border border-success-subtle bg-opacity-10"><TrendingUp size={24} /></div>
                                    <div>
                                        <h3 className="h6 text-uppercase text-white-50 fw-bold mb-0">Average Score</h3>
                                        <div className="h2 fw-bold mb-0 text-white">{avgScore}%</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4 animate-slide-up stagger-3">
                        <div className="card border-0 shadow-lg glass-panel h-100 hover-lift">
                            <div className="card-body p-4 d-flex flex-column justify-content-center">
                                <div className="d-flex align-items-center gap-3 mb-2">
                                    <div className="p-3 rounded bg-info-subtle text-info border border-info-subtle bg-opacity-10"><History size={24} /></div>
                                    <div>
                                        <h3 className="h6 text-uppercase text-white-50 fw-bold mb-0">Completed</h3>
                                        <div className="h2 fw-bold mb-0 text-white">{totalTaken}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row g-5">

                    {/* LEFT: EXAM GRID */}
                    <div className="col-lg-8">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="fw-bold mb-0 text-white">Assessments</h4>
                            <span className="badge bg-secondary bg-opacity-25 text-light border border-secondary border-opacity-25">{exams.length} Total</span>
                        </div>

                        {exams.length === 0 ? (
                            <div className="text-center py-5 rounded border border-secondary border-dashed glass-panel">
                                <div className="mb-3 text-secondary opacity-50"><Calendar size={48} /></div>
                                <h5 className="text-secondary">No exams scheduled</h5>
                                <p className="small text-muted">Check back later for new assessments.</p>
                            </div>
                        ) : (
                            <div className="row g-3">
                                {exams.map((exam, index) => (
                                    <div key={exam._id} className={`col-md-6 animate-slide-up stagger-${(index % 4) + 1}`}>
                                        <div className="card h-100 border-0 shadow-sm hover-shadow-sm transition-all glass-panel">
                                            <div className="card-body p-4 d-flex flex-column">
                                                <div className="d-flex justify-content-between align-items-start mb-3">
                                                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill bg-opacity-10">{exam.subject || 'General'}</span>
                                                    <small className="text-muted font-monospace bg-dark bg-opacity-50 px-2 rounded">#{exam._id.slice(-4)}</small>
                                                </div>

                                                <h5 className="card-title fw-bold text-white mb-1">{exam.title}</h5>
                                                <p className="card-text text-white-50 small border-bottom border-secondary border-opacity-25 pb-3 mb-3">
                                                    Duration: {exam.duration} mins • Marks: {exam.totalMarks}
                                                </p>

                                                <div className="mt-auto pt-2">
                                                    <button onClick={() => navigate(`/student/take-exam/${exam._id}`)} className="btn btn-primary w-100 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-lg btn-hover-scale">
                                                        Start Exam <Play size={16} fill="currentColor" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* RIGHT: RECENT HISTORY */}
                    <div className="col-lg-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h4 className="fw-bold mb-0 text-white">Recent Activity</h4>
                        </div>

                        <div className="card border-0 shadow-lg glass-panel animate-slide-up stagger-2">
                            <div className="list-group list-group-flush bg-transparent">
                                {results.length === 0 ? (
                                    <div className="p-5 text-center text-muted">
                                        <History size={32} className="opacity-25 mb-2" />
                                        <p className="small m-0">No history available</p>
                                    </div>
                                ) : (
                                    results.slice(0, 5).map((r, i) => (
                                        <div key={i} className="list-group-item p-3 border-secondary border-opacity-10 bg-transparent text-light">
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <span className="fw-bold text-white text-truncate" style={{ maxWidth: '160px' }}>{r.examId?.title || 'Unknown'}</span>
                                                <span className="text-secondary small" style={{ fontSize: '0.75rem' }}>{new Date(r.submittedAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center gap-1">
                                                    {r.isMalpractice ? (
                                                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle bg-opacity-10 d-flex align-items-center gap-1 px-2 py-1">
                                                            <AlertTriangle size={10} /> Void
                                                        </span>
                                                    ) : (
                                                        <span className={`badge border bg-opacity-10 ${r.score >= (r.totalMarks * 0.4) ? 'bg-success-subtle text-success border-success-subtle' : 'bg-warning-subtle text-warning border-warning-subtle'}`}>
                                                            {r.score} / {r.totalMarks}
                                                        </span>
                                                    )}
                                                </div>
                                                <button onClick={() => navigate('/student/results')} className="btn btn-link btn-sm p-0 text-secondary text-decoration-none small hover-text-white">View</button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            {results.length > 5 && (
                                <div className="card-footer bg-transparent border-top border-secondary border-opacity-10 text-center p-2">
                                    <button onClick={() => navigate('/student/results')} className="btn btn-link btn-sm text-decoration-none text-white-50 hover-text-white">View All History</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
