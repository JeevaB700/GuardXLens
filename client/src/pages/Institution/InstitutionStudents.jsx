import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { User, ChevronRight, FileText, AlertTriangle, X, Clock, ShieldAlert, ArrowLeft, GraduationCap, TrendingUp, CheckCircle, Search, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config';

const InstitutionStudents = () => {
    const [students, setStudents] = useState([]);
    const [malpracticeList, setMalpracticeList] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [results, setResults] = useState([]);
    const [logModalOpen, setLogModalOpen] = useState(false);
    const [studentLogs, setStudentLogs] = useState([]);
    const [logStudentName, setLogStudentName] = useState("");
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = sessionStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const [studRes, malRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/auth/my-students`, config),
                    axios.get(`${API_BASE_URL}/api/admin/malpractice-students`, config)
                ]);
                if (studRes.data.success) setStudents(studRes.data.students);
                if (malRes.data.success) setMalpracticeList(malRes.data.studentIds);
            } catch (error) { console.error(error); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const handleStudentClick = async (student) => {
        setSelectedStudent(student);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/student/results/${student._id}`);
            if (res.data.success) setResults(res.data.results);
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
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) setStudentLogs(res.data.logs);
        } catch (error) { console.error(error); }
    };

    const calculateStats = () => {
        if (!results.length) return { avg: 0, passed: 0, total: 0 };
        const total = results.length;
        const passed = results.filter(r => (r.score / r.totalMarks) >= 0.4).length;
        const avg = Math.round(results.reduce((acc, curr) => acc + (curr.score / curr.totalMarks) * 100, 0) / total);
        return { avg, passed, total };
    };

    const stats = selectedStudent ? calculateStats() : {};
    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="vh-100 d-flex align-items-center justify-content-center bg-gradient-dark" data-bs-theme="dark">
            <div className="spinner-border text-primary" role="status"></div>
        </div>
    );

    return (
        <div className="container-fluid min-vh-100 p-4 bg-gradient-dark animate-fade-in" style={{ maxWidth: '1400px' }}>

            {/* MODAL */}
            {logModalOpen && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content bg-dark border border-danger border-opacity-50 shadow-lg">
                            <div className="modal-header bg-danger bg-opacity-25 border-bottom border-danger border-opacity-25">
                                <h5 className="modal-title d-flex align-items-center gap-2 text-white"><ShieldAlert size={20} className="text-danger" /> Security Logs: {logStudentName}</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setLogModalOpen(false)}></button>
                            </div>
                            <div className="modal-body p-4" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                                {studentLogs.length === 0 ? <p className="text-white-50 text-center">No logs found.</p> :
                                    studentLogs.map((log, i) => (
                                        <div key={i} className="p-3 mb-2 rounded glass-panel border border-danger border-opacity-25 d-flex gap-3">
                                            <AlertTriangle size={18} className="text-danger flex-shrink-0 mt-1" />
                                            <div className="w-100">
                                                <div className="d-flex justify-content-between mb-1">
                                                    <strong className="text-danger small text-uppercase">{log.action || "Violation"}</strong>
                                                    <small className="text-white-50 font-monospace">{new Date(log.timestamp).toLocaleString()}</small>
                                                </div>
                                                <p className="mb-1 small text-light"><span className="text-white-50">Exam:</span> {log.examId?.title}</p>
                                                <code className="d-block p-2 rounded bg-dark bg-opacity-50 border border-secondary border-opacity-25 small text-danger">{log.details}</code>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN CONTENT */}
            {selectedStudent ? (
                <div className="animate-fade-in">
                    <button onClick={() => setSelectedStudent(null)} className="btn btn-link text-decoration-none p-0 mb-4 d-flex align-items-center gap-2 text-white-50 hover-text-white border-0 btn-hover-scale">
                        <ArrowLeft size={18} /> Back to Directory
                    </button>

                    {/* Profile Card */}
                    <div className="card glass-panel border-0 shadow-lg mb-4 animate-slide-up stagger-1">
                        <div className="card-body p-4 p-md-5">
                            <div className="d-flex flex-column flex-md-row gap-4 align-items-center align-items-md-start">
                                <div className="rounded-circle bg-primary bg-opacity-75 d-flex align-items-center justify-content-center text-white display-4 fw-bold shadow-sm" style={{ width: '100px', height: '100px' }}>
                                    {selectedStudent.name.charAt(0)}
                                </div>
                                <div className="text-center text-md-start">
                                    <h2 className="fw-bold mb-1 text-white">{selectedStudent.name}</h2>
                                    <p className="text-white-50 mb-3 d-flex align-items-center justify-content-center justify-content-md-start gap-2">
                                        <User size={16} className="text-primary" /> {selectedStudent.email}
                                    </p>
                                    <div className="d-flex gap-2 justify-content-center justify-content-md-start">
                                        <span className="badge bg-secondary bg-opacity-25 text-secondary border border-secondary border-opacity-25">ID: {selectedStudent._id.slice(-6).toUpperCase()}</span>
                                        {malpracticeList.includes(selectedStudent._id) &&
                                            <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-25 d-flex align-items-center gap-1"><ShieldAlert size={12} /> FLAGGED</span>
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="row g-4 mb-4">
                        <div className="col-md-4 animate-slide-up stagger-2">
                            <div className="card glass-panel border-0 shadow-lg h-100">
                                <div className="card-body p-4 d-flex align-items-center gap-3">
                                    <div className="p-3 rounded-3 bg-info bg-opacity-25 text-info shadow-sm"><GraduationCap size={28} /></div>
                                    <div><small className="text-white-50 fw-bold text-uppercase">Exams</small><h3 className="h4 fw-bold mb-0 text-white">{stats.total}</h3></div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4 animate-slide-up stagger-3">
                            <div className="card glass-panel border-0 shadow-lg h-100">
                                <div className="card-body p-4 d-flex align-items-center gap-3">
                                    <div className="p-3 rounded-3 bg-primary bg-opacity-25 text-primary shadow-sm"><TrendingUp size={28} /></div>
                                    <div><small className="text-white-50 fw-bold text-uppercase">Avg. Score</small><h3 className="h4 fw-bold mb-0 text-white">{stats.avg}%</h3></div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4 animate-slide-up stagger-4">
                            <div className="card glass-panel border-0 shadow-lg h-100">
                                <div className="card-body p-4 d-flex align-items-center gap-3">
                                    <div className="p-3 rounded-3 bg-success bg-opacity-25 text-success shadow-sm"><CheckCircle size={28} /></div>
                                    <div><small className="text-white-50 fw-bold text-uppercase">Passed</small><h3 className="h4 fw-bold mb-0 text-white">{stats.passed} <span className="fs-6 text-white-50 fw-normal">/ {stats.total}</span></h3></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* History */}
                    <h4 className="fw-bold mb-4 d-flex align-items-center gap-2 text-white"><FileText className="text-primary" size={24} /> Student Activity History</h4>
                    <div className="d-flex flex-column gap-4">
                        {results.length === 0 ? (
                            <div className="text-center py-5 border border-white border-opacity-10 border-dashed rounded-4 text-white-50 glass-panel">No exam history recorded.</div>
                        ) : (
                            results.map((r, idx) => {
                                const percentage = Math.round((r.score / r.totalMarks) * 100) || 0;
                                const isPass = percentage >= 40;
                                const violationCount = r.violationCount || 0;
                                
                                return (
                                    <div key={idx} className={`card glass-panel border-0 shadow-lg animate-slide-up stagger-${(idx % 5) + 1} overflow-hidden`}>
                                        <div className="card-body p-0">
                                            <div className="d-flex flex-column flex-md-row">
                                                {/* Left Section: Score Indicator */}
                                                <div className={`p-4 d-flex flex-column align-items-center justify-content-center border-md-end border-white border-opacity-10 bg-white bg-opacity-5`} style={{ minWidth: '150px' }}>
                                                    <div className={`h2 fw-bold mb-0 ${r.isMalpractice ? 'text-danger' : isPass ? 'text-success' : 'text-warning'}`}>{percentage}%</div>
                                                    <small className="text-white-50 fw-bold">{r.score} / {r.totalMarks}</small>
                                                    <div className={`badge mt-2 ${isPass ? 'bg-success' : 'bg-warning'} bg-opacity-10 text-${isPass ? 'success' : 'warning'} border border-${isPass ? 'success' : 'warning'} border-opacity-25`}>
                                                        {isPass ? 'PASSED' : 'FAILED'}
                                                    </div>
                                                </div>

                                                {/* Middle Section: Exam Info & Security */}
                                                <div className="p-4 flex-grow-1">
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <div>
                                                            <h5 className="fw-bold mb-1 text-white">{r.examId?.title || "Deleted Exam"}</h5>
                                                            <div className="d-flex align-items-center gap-3 text-white-50 small">
                                                                <span className="d-flex align-items-center gap-1"><Clock size={12} /> {new Date(r.submittedAt).toLocaleDateString()}</span>
                                                                <span className="d-flex align-items-center gap-1"><Terminal size={12} /> {r.examId?.subject || 'General'}</span>
                                                            </div>
                                                        </div>
                                                        {r.isMalpractice || violationCount > 0 ? (
                                                            <div className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 p-2 d-flex align-items-center gap-1 animate-pulse">
                                                                <ShieldAlert size={14} /> 
                                                                <span>{r.isMalpractice ? 'TERMINATED' : `${violationCount} VIOLATIONS`}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 p-2 d-flex align-items-center gap-1">
                                                                <Shield size={14} /> SECURE
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Quick Violation Log Summary */}
                                                    {(r.violationLogs && r.violationLogs.length > 0) && (
                                                        <div className="mt-3 p-2 rounded bg-black bg-opacity-25 border border-white border-opacity-5">
                                                            <div className="text-secondary text-uppercase fw-bold mb-1" style={{ fontSize: '0.6rem' }}>Integrity Logs</div>
                                                            <div className="d-flex flex-wrap gap-2">
                                                                {r.violationLogs.slice(0, 3).map((log, i) => (
                                                                    <span key={i} className="text-white-50" style={{ fontSize: '0.65rem' }}>• {log.type.replace(/_/g, ' ')}</span>
                                                                ))}
                                                                {r.violationLogs.length > 3 && <span className="text-primary" style={{ fontSize: '0.65rem' }}>+{r.violationLogs.length - 3} more</span>}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right Section: Actions */}
                                                <div className="p-4 d-flex align-items-center justify-content-center bg-white bg-opacity-5 border-md-start border-white border-opacity-10">
                                                    <button 
                                                        onClick={() => navigate(`/institution/result-view/${selectedStudent._id}/${r._id}`)}
                                                        className="btn btn-outline-primary btn-sm px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-2 hover-bg-primary hover-text-white transition-all"
                                                    >
                                                        Review Submission <ChevronRight size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            ) : (
                <div className="animate-fade-in">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3 glass-panel p-4 rounded-3 shadow-lg border-0 animate-slide-up stagger-1">
                        <div>
                            <h1 className="h2 fw-bold mb-1 text-white">Student Directory</h1>
                            <p className="text-white-50 mb-0">Manage enrolled students and monitor integrity</p>
                        </div>
                        <div className="input-group" style={{ maxWidth: '400px' }}>
                            <span className="input-group-text bg-dark bg-opacity-50 border-secondary border-opacity-25 text-white-50"><Search size={18} /></span>
                            <input
                                type="text"
                                className="form-control form-control-dark text-light shadow-none"
                                placeholder="Search students..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="row g-3">
                        {filteredStudents.length === 0 ? <p className="text-center text-white-50 py-5">No students found.</p> :
                            filteredStudents.map((student, i) => (
                                <div key={student._id} className={`col-12 animate-slide-up stagger-${(i % 5) + 1}`}>
                                    <div
                                        onClick={() => handleStudentClick(student)}
                                        className="card glass-panel border border-white border-opacity-10 shadow-sm hover-shadow-lg cursor-pointer transition-all hover-lift"
                                    >
                                        <div className="card-body p-3 d-flex justify-content-between align-items-center">
                                            <div className="d-flex align-items-center gap-3 overflow-hidden">
                                                <div className="rounded-circle bg-primary bg-opacity-25 d-flex align-items-center justify-content-center fw-bold text-primary border border-primary border-opacity-25" style={{ width: '48px', height: '48px' }}>
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div className="text-truncate">
                                                    <h6 className="fw-bold mb-0 text-white">{student.name}</h6>
                                                    <small className="text-white-50">{student.email}</small>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center gap-2">
                                                {malpracticeList.includes(student._id) && (
                                                    <button onClick={(e) => handleAlertClick(e, student)} className="btn btn-sm btn-outline-danger border-opacity-50 bg-danger bg-opacity-10 text-danger btn-hover-scale">
                                                        <ShieldAlert size={18} />
                                                    </button>
                                                )}
                                                <ChevronRight size={18} className="text-white-50" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstitutionStudents;
