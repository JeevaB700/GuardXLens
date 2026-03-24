import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Building, User, ChevronRight, ArrowLeft, GraduationCap, TrendingUp, CheckCircle, Search, Filter, ShieldAlert, FileText, Clock, AlertTriangle } from 'lucide-react';
import API_BASE_URL from '../../config';

const AdminStudents = () => {
    const [view, setView] = useState('institutions');
    const [institutions, setInstitutions] = useState([]);
    const [students, setStudents] = useState([]);
    const [results, setResults] = useState([]);
    const [selectedInst, setSelectedInst] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [malpracticeList, setMalpracticeList] = useState([]);
    const [logModalOpen, setLogModalOpen] = useState(false);
    const [studentLogs, setStudentLogs] = useState([]);
    const [allStudentLogs, setAllStudentLogs] = useState([]);
    const [logStudentName, setLogStudentName] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = sessionStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const [instRes, malRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/auth/institutions`),
                    axios.get(`${API_BASE_URL}/api/admin/malpractice-students`, config)
                ]);
                if (instRes.data.success) setInstitutions(instRes.data.institutions);
                if (malRes.data.success) setMalpracticeList(malRes.data.studentIds);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const handleInstClick = async (inst) => {
        setLoading(true);
        setSelectedInst(inst);
        try {
            const token = sessionStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/admin/students/${inst._id}`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) { setStudents(res.data.students); setView('students'); }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleStudentClick = async (student) => {
        setLoading(true);
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
            
            if (res.data.success) {
                const sortedResults = (res.data.results || []).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
                setResults(sortedResults);
                if (logsRes.data.success) setAllStudentLogs(logsRes.data.logs || []);
                setView('results');
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const goBackToInstitutions = () => { setView('institutions'); setSelectedInst(null); };
    const goBackToStudents = () => { setView('students'); setSelectedStudent(null); };

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
        const validResults = results.filter(r => !r.isMalpractice);
        if (!validResults.length) return { avg: 0, passed: 0, total: results.length };

        const total = results.length;
        const passed = validResults.filter(r => (r.score / r.totalMarks) >= 0.4).length;
        const avg = Math.round(validResults.reduce((acc, curr) => acc + (curr.score / curr.totalMarks) * 100, 0) / validResults.length);
        return { avg, passed, total };
    };
    const stats = selectedStudent ? calculateStats() : {};

    if (loading) return <div className="d-flex justify-content-center align-items-center h-100"><div className="spinner-border text-primary" /></div>;

    return (
        <div className="container-fluid p-0 animate-fade-in">

            {/* SECURITY LOGS MODAL */}
            {logModalOpen && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content glass-panel border border-danger border-opacity-50 shadow-lg">
                            <div className="modal-header bg-danger bg-opacity-10 border-bottom border-danger border-opacity-25">
                                <h5 className="modal-title d-flex align-items-center gap-2 text-white"><ShieldAlert size={20} className="text-danger" /> Security Logs: {logStudentName}</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setLogModalOpen(false)}></button>
                            </div>
                            <div className="modal-body p-4 custom-scrollbar" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                                {studentLogs.length === 0 ? <p className="text-white-50 text-center">No logs found.</p> :
                                    studentLogs.map((log, i) => (
                                        <div key={i} className="p-3 mb-2 rounded glass-panel border border-danger border-opacity-25 d-flex gap-3 animate-slide-up">
                                            <AlertTriangle size={18} className="text-danger flex-shrink-0 mt-1" />
                                            <div className="w-100">
                                                <div className="d-flex justify-content-between mb-1">
                                                    <strong className="text-danger small text-uppercase">{log.action || "Violation"}</strong>
                                                    <small className="text-white-50 font-monospace" style={{ fontSize: '0.75rem' }}>{new Date(log.timestamp).toLocaleString()}</small>
                                                </div>
                                                <p className="mb-1 small text-light fw-medium"><span className="text-white-50 fw-normal">Exam:</span> {log.examId?.title}</p>
                                                <code className="d-block p-2 rounded bg-black bg-opacity-50 border border-secondary border-opacity-20 small text-danger">{log.details}</code>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW 1: INSTITUTIONS LIST */}
            {view === 'institutions' && (
                <>
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
                        <div>
                            <h2 className="h4 fw-bold mb-1 text-white">Registered Institutions</h2>
                            <p className="text-white-50 small">Select an institution to view enrolled students.</p>
                        </div>
                        <div className="input-group" style={{ maxWidth: '300px' }}>
                            <span className="input-group-text bg-transparent border-secondary text-white-50"><Search size={18} /></span>
                            <input type="text" className="form-control form-control-dark" placeholder="Search institutions..." />
                        </div>
                    </div>
                    <div className="row g-4">
                        {institutions.map((inst, idx) => (
                            <div key={inst._id} className={`col-md-6 col-lg-4 animate-slide-up stagger-${Math.min(idx + 1, 4)}`}>
                                <div onClick={() => handleInstClick(inst)} className="card glass-panel h-100 border-0 shadow-lg cursor-pointer hover-shadow-sm transition-all">
                                    <div className="card-body p-4 d-flex align-items-start gap-4">
                                        <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-3">
                                            <Building size={24} />
                                        </div>
                                        <div className="flex-grow-1">
                                            <h5 className="fw-bold mb-1 text-white">{inst.name}</h5>
                                            <p className="text-white-50 small mb-2">{inst.email}</p>
                                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">Active</span>
                                        </div>
                                        <ChevronRight className="text-white-50" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* VIEW 2: STUDENTS LIST */}
            {view === 'students' && selectedInst && (
                <>
                    <button onClick={goBackToInstitutions} className="btn btn-link text-decoration-none p-0 mb-4 d-flex align-items-center gap-2 text-white-50 hover-text-white transition-all">
                        <ArrowLeft size={18} /> Back to Institutions
                    </button>

                    <div className="card glass-panel shadow-lg border-0 mb-4 animate-slide-up">
                        <div className="card-body p-4 d-flex align-items-center gap-4">
                            <div className="p-3 bg-primary rounded-3 text-white"><Building size={32} /></div>
                            <div>
                                <h2 className="h4 fw-bold mb-0 text-white">{selectedInst.name}</h2>
                                <p className="text-white-50 mb-0 small">{students.length} Students Enrolled • {selectedInst.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card glass-panel border-0 shadow-lg animate-slide-up stagger-1">
                        <div className="card-header bg-transparent border-secondary border-opacity-10 py-3">
                            <h6 className="fw-bold mb-0 text-white">Enrolled Students</h6>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-dark-theme align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th className="ps-4 border-secondary border-opacity-10">Name</th>
                                        <th className="border-secondary border-opacity-10">Email</th>
                                        <th className="border-secondary border-opacity-10">Status</th>
                                        <th className="text-end pe-4 border-secondary border-opacity-10">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.length === 0 && <tr><td colSpan="4" className="text-center py-5 text-white-50">No students found.</td></tr>}
                                    {students.map(s => (
                                        <tr key={s._id} onClick={() => handleStudentClick(s)} className="cursor-pointer">
                                            <td className="ps-4">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="rounded-circle bg-primary bg-opacity-25 d-flex align-items-center justify-content-center text-white fw-medium" style={{ width: '40px', height: '40px' }}>
                                                        {s.name.charAt(0)}
                                                    </div>
                                                    <span className="fw-medium text-white">{s.name}</span>
                                                </div>
                                            </td>
                                            <td className="text-white-50">{s.email}</td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">Active</span>
                                                    {malpracticeList.includes(s._id) && (
                                                        <button onClick={(e) => handleAlertClick(e, s)} className="btn btn-sm btn-outline-danger border-0 bg-danger bg-opacity-10 text-danger p-1 line-height-1 btn-hover-scale">
                                                            <ShieldAlert size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-end pe-4"><ChevronRight size={18} className="text-white-50" /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* VIEW 3: STUDENT RESULTS */}
            {view === 'results' && selectedStudent && (
                <>
                    <button onClick={goBackToStudents} className="btn btn-link text-decoration-none p-0 mb-4 d-flex align-items-center gap-2 text-white-50 hover-text-white transition-all">
                        <ArrowLeft size={18} /> Back to Students
                    </button>

                    <div className="d-flex align-items-center justify-content-between mb-4 animate-fade-in">
                        <div>
                            <h2 className="h4 fw-bold mb-1 text-white">{selectedStudent.name}</h2>
                            <small className="text-white-50">Student ID: {selectedStudent._id}</small>
                        </div>
                        <button className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2 btn-hover-scale"><ShieldAlert size={16} /> Report Issue</button>
                    </div>

                    <div className="row g-4 mb-4">
                        <div className="col-md-4 animate-slide-up stagger-1">
                            <div className="card glass-panel border-0 shadow-lg h-100 hover-shadow-sm">
                                <div className="card-body d-flex align-items-center gap-3">
                                    <div className="p-3 rounded bg-info bg-opacity-10 text-info"><GraduationCap size={24} /></div>
                                    <div><small className="text-white-50 fw-bold d-block">TOTAL EXAMS</small><span className="h4 mb-0 fw-bold text-white">{stats.total}</span></div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4 animate-slide-up stagger-2">
                            <div className="card glass-panel border-0 shadow-lg h-100 hover-shadow-sm">
                                <div className="card-body d-flex align-items-center gap-3">
                                    <div className="p-3 rounded bg-warning bg-opacity-10 text-warning"><TrendingUp size={24} /></div>
                                    <div><small className="text-white-50 fw-bold d-block">AVG SCORE</small><span className="h4 mb-0 fw-bold text-white">{stats.avg}%</span></div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4 animate-slide-up stagger-3">
                            <div className="card glass-panel border-0 shadow-lg h-100 hover-shadow-sm">
                                <div className="card-body d-flex align-items-center gap-3">
                                    <div className="p-3 rounded bg-success bg-opacity-10 text-success"><CheckCircle size={24} /></div>
                                    <div><small className="text-white-50 fw-bold d-block">PASSED</small><span className="h4 mb-0 fw-bold text-white">{stats.passed}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card glass-panel border-0 shadow-lg animate-slide-up stagger-4">
                        <div className="card-header bg-transparent border-secondary border-opacity-10 py-3">
                            <h5 className="fw-bold mb-0 text-white">Exam History</h5>
                        </div>
                        <div className="card-body p-0">
                            {results.length === 0 ? <p className="p-5 text-center text-white-50">No exams taken yet.</p> : (
                                <div className="table-responsive">
                                    <table className="table table-dark-theme align-middle mb-0">
                                        <thead>
                                            <tr>
                                                <th className="ps-4 border-secondary border-opacity-10">Exam Title</th>
                                                <th className="border-secondary border-opacity-10">Date Submitted</th>
                                                <th className="border-secondary border-opacity-10">Status</th>
                                                <th className="border-secondary border-opacity-10">Score</th>
                                                <th className="text-end pe-4 border-secondary border-opacity-10">Result</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.map((r, idx) => {
                                                const percentage = Math.round((r.score / r.totalMarks) * 100) || 0;
                                                const isPass = percentage >= 40;
                                                return (
                                                    <tr key={idx}>
                                                        <td className="ps-4">
                                                            <div className="fw-medium text-white">{r.examId?.title || "Unknown"}</div>
                                                        </td>
                                                        <td className="text-white-50"><small><Clock size={14} className="me-1" />{new Date(r.submittedAt).toLocaleDateString()}</small></td>
                                                        <td>
                                                            {(r.violationCount >= 3 || r.isMalpractice) ? (
                                                                <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 py-1 px-2 fw-bold text-uppercase">
                                                                    <AlertTriangle size={12} className="me-1" /> Malpractice
                                                                </span>
                                                            ) : r.violationCount > 0 ? (
                                                                <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 py-1 px-2">
                                                                    Flagged
                                                                </span>
                                                            ) : (
                                                                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">Clean Record</span>
                                                            )}
                                                        </td>
                                                        <td><span className="fw-bold text-white">{r.score}</span> <span className="text-white-50 small">/ {r.totalMarks}</span></td>
                                                        <td className="text-end pe-4">
                                                            <span className={`badge ${(r.violationCount > 0 || r.isMalpractice || !isPass) ? 'bg-danger' : 'bg-success'}`}>
                                                                {(r.violationCount >= 3 || r.isMalpractice) ? 'VOID' : `${percentage}%`}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminStudents;
