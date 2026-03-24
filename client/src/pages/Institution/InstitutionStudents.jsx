import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { User, ChevronRight, FileText, AlertTriangle, X, Clock, ShieldAlert, ArrowLeft, GraduationCap, TrendingUp, CheckCircle, Search, Shield, Terminal } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = sessionStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const [studRes, malRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/auth/my-students`, config),
                    axios.get(`${API_BASE_URL}/api/admin/malpractice-students`, config)
                ]);
                
                const allStudents = studRes.data.students || [];
                setStudents(allStudents);
                setMalpracticeList(malRes.data.studentIds || []);

                // STATE RECOVERY: Check if a student ID is in the URL
                const targetId = searchParams.get('id');
                if (targetId) {
                    const student = allStudents.find(s => s._id === targetId);
                    if (student) {
                        handleStudentClick(student);
                    }
                }
            } catch (error) { console.error(error); }
            finally { setLoading(false); }
        };
        fetchData();
    }, [searchParams]);

    const [allStudentLogs, setAllStudentLogs] = useState([]);

    const handleStudentClick = async (student) => {
        setSelectedStudent(student);
        setResults([]);
        setAllStudentLogs([]);
        try {
            const token = sessionStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            const [res, logsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/student/results/${student._id}`, config),
                axios.get(`${API_BASE_URL}/api/admin/student-logs/${student._id}`, config)
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
                headers: { Authorization: `Bearer ${token}` }
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
                                                <p className="mb-1 small text-light"><span className="text-white-50">Exam:</span> {log.examId?.title || "Deleted Exam"}</p>
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
                        <div className="card-body p-4">
                            <div className="d-flex flex-column flex-md-row gap-4 align-items-center align-items-md-start">
                                <div className="rounded-circle bg-primary bg-opacity-25 d-flex align-items-center justify-content-center text-primary h3 fw-bold shadow-sm border border-primary border-opacity-25" style={{ width: '64px', height: '64px' }}>
                                    {selectedStudent.name?.charAt(0) || "S"}
                                </div>
                                <div className="text-center text-md-start">
                                    <h2 className="h4 fw-bold mb-1 text-white">{selectedStudent.name}</h2>
                                    <div className="d-flex flex-wrap gap-3 justify-content-center justify-content-md-start align-items-center mt-2">
                                        <span className="text-white-50 small d-flex align-items-center gap-2">
                                            <User size={14} className="text-primary" /> {selectedStudent.email}
                                        </span>
                                        <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25">ID: {selectedStudent._id?.slice(-6).toUpperCase()}</span>
                                        {malpracticeList.includes(selectedStudent._id) &&
                                            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 d-flex align-items-center gap-1"><ShieldAlert size={12} /> FLAGGED</span>
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="row g-3 mb-4">
                        {[
                            { label: 'Total Exams', val: stats.total, icon: GraduationCap, color: 'info' },
                            { label: 'Avg Score', val: `${stats.avg}%`, icon: TrendingUp, color: 'primary' },
                            { label: 'Passed', val: `${stats.passed} / ${stats.total}`, icon: CheckCircle, color: 'success' }
                        ].map((s, i) => (
                            <div key={i} className="col-4 animate-slide-up" style={{ animationDelay: `${(i + 1) * 0.1}s` }}>
                                <div className="card glass-panel border-0 shadow-sm h-100">
                                    <div className="card-body p-3 text-center">
                                        <div className={`text-${s.color} mb-1`}><s.icon size={20} /></div>
                                        <div className="h5 fw-bold mb-0 text-white">{s.val}</div>
                                        <div className="text-white-50" style={{ fontSize: '0.65rem' }}>{s.label}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* History */}
                    <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 text-white"><FileText className="text-primary" size={20} /> Activity History</h5>
                    <div className="d-flex flex-column gap-2">
                        {results.length === 0 ? (
                            <div className="text-center py-5 border border-white border-opacity-5 border-dashed rounded-3 text-white-50 glass-panel">No exam history recorded.</div>
                        ) : (
                            results.map((r, idx) => {
                                const percentage = Math.round((r.score / (r.totalMarks || 1)) * 100) || 0;
                                const isPass = percentage >= 40;
                                
                                return (
                                    <div 
                                        key={idx} 
                                        onClick={() => navigate(`/institution/result-view/${selectedStudent._id}/${r._id}`)}
                                        className="card glass-panel border border-white border-opacity-5 shadow-sm hover-bg-light-5 cursor-pointer transition-all animate-slide-up"
                                    >
                                        <div className="card-body p-3 d-flex align-items-center justify-content-between">
                                            <div className="d-flex align-items-center gap-3 overflow-hidden">
                                                <div className={`p-2 rounded bg-${(r.violationCount > 0 || r.isMalpractice || !isPass) ? 'danger' : 'success'} bg-opacity-10 text-${(r.violationCount > 0 || r.isMalpractice || !isPass) ? 'danger' : 'success'} border border-${(r.violationCount > 0 || r.isMalpractice || !isPass) ? 'danger' : 'success'} border-opacity-10 d-flex flex-column align-items-center justify-content-center`} style={{ minWidth: '50px', height: '50px' }}>
                                                    <span className="fw-bold lh-1">{percentage}%</span>
                                                    <span style={{ fontSize: '0.6rem' }}>Score</span>
                                                </div>
                                                <div className="text-truncate">
                                                    <h6 className="fw-bold mb-0 text-white">{r.examId?.title || "Deleted Exam"}</h6>
                                                    <div className="d-flex flex-wrap align-items-center gap-x-3 gap-y-1 text-white-50 mt-1" style={{ fontSize: '0.75rem' }}>
                                                        <span className="d-flex align-items-center gap-1"><Clock size={12} /> {new Date(r.submittedAt).toLocaleDateString()}</span>
                                                        <span className="d-flex align-items-center gap-1"><Terminal size={12} /> {r.examId?.subject || 'CS'}</span>
                                                        {(r.violationCount >= 3 || r.isMalpractice) && (
                                                            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 py-1 px-2 fw-bold text-uppercase">
                                                                <ShieldAlert size={12} className="me-1" /> Malpractice
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight size={18} className="text-white-25" />
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

                    <div className="row g-2">
                        {filteredStudents.length === 0 ? <p className="text-center text-white-50 py-5">No students found.</p> :
                            filteredStudents.map((student, i) => (
                                <div key={student._id} className={`col-12 animate-slide-up stagger-${(i % 5) + 1}`}>
                                    <div
                                        onClick={() => handleStudentClick(student)}
                                        className="card glass-panel border border-white border-opacity-5 shadow-sm hover-shadow-lg cursor-pointer transition-all"
                                    >
                                        <div className="card-body p-3 d-flex justify-content-between align-items-center">
                                            <div className="d-flex align-items-center gap-3 overflow-hidden">
                                                <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center fw-bold text-primary border border-primary border-opacity-10" style={{ width: '42px', height: '42px' }}>
                                                    {student.name?.charAt(0) || "S"}
                                                </div>
                                                <div className="text-truncate">
                                                    <h6 className="fw-bold mb-0 text-white">{student.name}</h6>
                                                    <small className="text-white-50">{student.email}</small>
                                                </div>
                                            </div>
                                            <div className="d-flex align-items-center gap-2">
                                                {malpracticeList.includes(student._id) && (
                                                    <button onClick={(e) => handleAlertClick(e, student)} className="btn btn-sm btn-outline-danger border-0 bg-danger bg-opacity-10 text-danger p-2 rounded-circle">
                                                        <ShieldAlert size={16} />
                                                    </button>
                                                )}
                                                <ChevronRight size={18} className="text-white-25" />
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
