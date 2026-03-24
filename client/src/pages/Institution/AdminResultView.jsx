import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Target, Clock, CheckCircle, XCircle, AlertTriangle, ArrowLeft, FileText, ShieldAlert, Award, Terminal, History, ChevronRight, Lock } from 'lucide-react';
import API_BASE_URL from '../../config';

const AdminResultView = () => {
    const { studentId, resultId } = useParams();
    const [result, setResult] = useState(null);
    const [examDetails, setExamDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const token = sessionStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                
                // Fetch all results for this student and find the specific one
                const res = await axios.get(`${API_BASE_URL}/api/student/results/${studentId}`, config);
                const foundResult = res.data.results.find(r => r._id === resultId);
                
                if (foundResult) {
                    setResult(foundResult);
                    // Fetch full exam details
                    const examRes = await axios.get(`${API_BASE_URL}/api/student/exam/${foundResult.examId._id || foundResult.examId}`, config);
                    if (examRes.data.success) {
                        setExamDetails(examRes.data.exam);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [studentId, resultId]);

    const getDetailedBreakdown = () => {
        if (!result || !examDetails) return [];
        return result.answers.map((ans, index) => {
            const questionData = examDetails.questions.find(q => q._id === ans.questionId) || examDetails.questions[index];
            return {
                ...ans,
                questionText: questionData?.questionText || "Question text unavailable",
                options: questionData?.options || [],
                correctAnswers: questionData?.correctAnswers || [],
                type: questionData?.type || 'UNKNOWN',
                marks: questionData?.marks || 0
            };
        });
    };

    const detailedAnswers = getDetailedBreakdown();

    if (loading) return <div className="vh-100 d-flex align-items-center justify-content-center bg-gradient-dark text-white"><div className="spinner-border text-primary" role="status"></div></div>;
    if (!result) return <div className="vh-100 d-flex align-items-center justify-content-center bg-gradient-dark text-white"><h3>Result Not Found</h3></div>;

    const percentage = Math.round((result.score / result.totalMarks) * 100) || 0;

    return (
        <div className="d-flex flex-column min-vh-100 bg-gradient-dark font-sans text-light animate-fade-in" data-bs-theme="dark">
            
            {/* TOP NAVBAR (Unified with Dashboard) */}
            <nav className="navbar navbar-dark glass-navbar px-4 py-2 sticky-top flex-shrink-0">
                <div className="container-fluid d-flex align-items-center justify-content-between flex-nowrap">
                    <div className="d-flex align-items-center gap-3">
                        <button onClick={() => navigate(-1)} className="btn btn-link text-white-50 p-1 hover-text-white transition-all shadow-none" title="Back">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="vr text-secondary opacity-50 d-none d-sm-block"></div>
                        <span className="navbar-brand fw-bold d-none d-sm-flex align-items-center gap-2 mb-0 ms-1">
                            <div className="bg-white bg-opacity-10 rounded p-1 d-flex align-items-center justify-content-center shadow-lg border border-white border-opacity-10" style={{ width: '28px', height: '28px' }}>
                                <img src="/logo.png" alt="GX" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                            <span className="fs-6">GuardXLens</span>
                        </span>
                    </div>
                    
                    <div className="text-center flex-grow-1 mx-2">
                        <h6 className="mb-0 fw-bold border-bottom border-primary border-opacity-25 pb-1 d-inline-block px-3">Answer Sheet Review</h6>
                    </div>

                    <div className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 py-2 px-3 d-none d-md-block">
                        PROCTORING VERIFIED
                    </div>
                </div>
            </nav>

            <div className="container py-4 flex-grow-1" style={{ maxWidth: '1000px' }}>
                
                {/* Result Summary Header Card */}
                <div className="card border-0 shadow-lg mb-5 glass-panel animate-slide-up overflow-hidden">
                    <div className="card-body p-0">
                        <div className="d-flex flex-column flex-md-row">
                            <div className={`p-4 d-flex flex-column align-items-center justify-content-center border-md-end border-white border-opacity-10 bg-white bg-opacity-5`} style={{ minWidth: '180px' }}>
                                <div className={`display-4 fw-bold mb-0 ${result.isMalpractice ? 'text-danger' : 'text-primary'}`}>{percentage}%</div>
                                <div className="text-white-50 small fw-bold text-uppercase tracking-wider">Overall Score</div>
                            </div>
                            <div className="p-4 flex-grow-1">
                                <h2 className="h4 fw-bold mb-2 text-white">{result.examId?.title}</h2>
                                <div className="d-flex flex-wrap gap-4 text-white-50 small mb-3">
                                    <span className="d-flex align-items-center gap-1"><Clock size={14} className="text-primary" /> {new Date(result.submittedAt).toLocaleString()}</span>
                                    <span className="d-flex align-items-center gap-1"><Award size={14} className="text-primary" /> {result.score} / {result.totalMarks} Total Marks</span>
                                </div>
                                {result.isMalpractice && (
                                    <div className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 p-2 px-3 d-flex align-items-center gap-2 animate-pulse w-fit">
                                        <ShieldAlert size={16} /> 
                                        <span className="fw-bold">SECURITY VIOLATION DETECTED</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 text-white">
                        <FileText size={20} className="text-primary" /> Detailed Response Analysis
                    </h5>
                    
                    <div className="d-flex flex-column gap-4">
                        {detailedAnswers.map((ans, i) => (
                            <div key={i} className="card glass-panel border-0 shadow-sm animate-slide-up stagger-2 overflow-hidden">
                                <div className="card-body p-3 p-md-4">
                                    <div className="d-flex align-items-start gap-2 gap-sm-4">
                                        {/* Question Number Indicator */}
                                        <div className={`flex-shrink-0 d-flex align-items-center justify-content-center rounded-circle fw-bold fs-5 shadow-sm transition-all ${ans.isCorrect ? 'bg-success bg-gradient' : 'bg-danger bg-gradient'} text-white`} style={{ width: '42px', height: '42px' }}>
                                            {i + 1}
                                        </div>

                                        <div className="flex-grow-1 min-w-0">
                                            {/* Status and Score Row */}
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span className={`badge ${ans.isCorrect ? 'bg-success-subtle text-success border border-success' : 'bg-danger-subtle text-danger border border-danger'} bg-opacity-10 py-1 px-3`}>
                                                    {ans.isCorrect ? 'Correct' : 'Incorrect'}
                                                </span>
                                                <span className="text-white-50 small fw-mono bg-dark bg-opacity-50 px-2 py-1 rounded border border-white border-opacity-5">
                                                    {ans.marksAwarded} / {ans.marks}
                                                </span>
                                            </div>

                                            {/* Question Text */}
                                            <h6 className="mb-4 fw-bold text-white lh-base pe-2" style={{ fontSize: '1.05rem' }}>{ans.questionText}</h6>

                                            {/* Answers Section */}
                                            <div className="mt-2">
                                                {ans.type === 'MCQ' ? (
                                                    <div className="d-flex flex-column gap-2">
                                                        {ans.options.map((opt, idx) => {
                                                            const studentAnswers = Array.isArray(ans.submittedAnswer) ? ans.submittedAnswer : [ans.submittedAnswer].filter(x => x);
                                                            const isSelected = studentAnswers.includes(opt);
                                                            const isCorrectAnswer = (ans.correctAnswers || []).includes(opt);
                                                            
                                                            let borderClass = 'border-white border-opacity-10';
                                                            let bgClass = 'bg-white bg-opacity-5';
                                                            let textClass = 'text-white-50';
                                                            if (isSelected && isCorrectAnswer) { borderClass = 'border-success'; bgClass = 'bg-success bg-opacity-10'; textClass = 'text-success fw-bold'; }
                                                            else if (isSelected && !isCorrectAnswer) { borderClass = 'border-danger'; bgClass = 'bg-danger bg-opacity-10'; textClass = 'text-danger fw-bold'; }
                                                            else if (!isSelected && isCorrectAnswer) { borderClass = 'border-success border-opacity-50 border-dashed'; textClass = 'text-success opacity-75'; }

                                                            return (
                                                                <div key={idx} className={`p-2 px-3 rounded-3 border d-flex justify-content-between align-items-center transition-all ${borderClass} ${bgClass}`}>
                                                                    <span className={`small ${textClass}`}>{opt}</span>
                                                                    <div className="d-flex gap-2">
                                                                        {isCorrectAnswer && <CheckCircle size={14} className="text-success opacity-50" title="Correct Answer" />}
                                                                        {isSelected && (isCorrectAnswer ? <CheckCircle size={16} className="text-success" /> : <XCircle size={16} className="text-danger" />)}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="p-3 bg-black bg-opacity-30 rounded-3 border border-white border-opacity-10">
                                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                                            <small className="text-secondary text-uppercase fw-bold tracking-wider" style={{ fontSize: '0.65rem' }}>Submitted Answer</small>
                                                            <History size={14} className="text-white-25" />
                                                        </div>
                                                        <div className="font-monospace text-light small overflow-auto custom-scrollbar" style={{ whiteSpace: 'pre-wrap', maxHeight: '300px', lineHeight: '1.6' }}>
                                                            {ans.submittedAnswer?.toString() || <span className="text-muted fst-italic opacity-50">No answer provided by student</span>}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminResultView;
