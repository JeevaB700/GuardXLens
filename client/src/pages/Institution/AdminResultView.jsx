import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Target, Clock, CheckCircle, XCircle, AlertTriangle, ArrowLeft, FileText, ShieldAlert, Award } from 'lucide-react';
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
        <div className="d-flex flex-column min-vh-100 bg-gradient-dark font-sans text-light animate-fade-in p-4" data-bs-theme="dark">
            <div className="container" style={{ maxWidth: '1000px' }}>
                
                <button onClick={() => navigate(-1)} className="btn btn-link text-decoration-none p-0 mb-4 d-flex align-items-center gap-2 text-white-50 hover-text-white border-0 btn-hover-scale">
                    <ArrowLeft size={18} /> Back
                </button>

                <div className="card border-0 shadow-lg mb-4 glass-panel animate-slide-up">
                    <div className="card-body p-4 d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
                        <div>
                            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 mb-2">Student Answer Sheet</span>
                            <h2 className="h4 fw-bold mb-2 text-white">{result.examId?.title}</h2>
                            <div className="d-flex flex-wrap gap-3 text-white-50 small">
                                <span className="d-flex align-items-center gap-1"><Clock size={14} className="text-primary" /> {new Date(result.submittedAt).toLocaleString()}</span>
                                {result.isMalpractice && <span className="text-danger fw-bold d-flex align-items-center gap-1"><ShieldAlert size={14} /> Security Violation Flagged</span>}
                            </div>
                        </div>
                        <div className="text-end">
                            <div className={`display-4 fw-bold lh-1 ${result.isMalpractice ? 'text-danger' : 'text-primary'}`}>{percentage}%</div>
                            <span className="text-secondary small text-uppercase fw-bold">{result.score} / {result.totalMarks} Marks</span>
                        </div>
                    </div>
                </div>

                <div className="card border-0 shadow-sm glass-panel animate-slide-up stagger-2">
                    <div className="card-header bg-transparent border-bottom border-white border-opacity-10 p-3">
                        <h6 className="fw-bold mb-0 text-white">Detailed Response Analysis</h6>
                    </div>
                    <div className="list-group list-group-flush bg-transparent">
                        {detailedAnswers.map((ans, i) => (
                            <div key={i} className="list-group-item p-4 border-white border-opacity-10 bg-transparent text-light">
                                <div className="d-flex align-items-start gap-4">
                                    <div className={`flex-shrink-0 d-flex align-items-center justify-content-center rounded-circle fw-bold fs-5 shadow-sm ${ans.isCorrect ? 'bg-success text-white' : 'bg-danger text-white'}`} style={{ width: '40px', height: '40px' }}>
                                        {i + 1}
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div className="w-100">
                                                <span className={`badge mb-2 ${ans.isCorrect ? 'bg-success-subtle text-success border border-success' : 'bg-danger-subtle text-danger border border-danger'} bg-opacity-10`}>
                                                    {ans.isCorrect ? 'Correct' : 'Incorrect'}
                                                </span>
                                                <h6 className="mb-2 fw-bold text-white lh-base">{ans.questionText}</h6>
                                            </div>
                                            <span className="badge bg-dark bg-opacity-50 text-secondary border border-white border-opacity-10 ms-3">{ans.marksAwarded} / {ans.marks}</span>
                                        </div>

                                        <div className="mt-3">
                                            {ans.type === 'MCQ' ? (
                                                <div className="d-flex flex-column gap-2">
                                                    {ans.options.map((opt, idx) => {
                                                        const studentAnswers = Array.isArray(ans.submittedAnswer) ? ans.submittedAnswer : [ans.submittedAnswer].filter(x => x);
                                                        const isSelected = studentAnswers.includes(opt);
                                                        const isCorrectAnswer = (ans.correctAnswers || []).includes(opt);
                                                        
                                                        let borderClass = 'border-white border-opacity-10';
                                                        let bgClass = 'bg-transparent';
                                                        let textClass = 'text-white-50';
                                                        if (isSelected && isCorrectAnswer) { borderClass = 'border-success'; bgClass = 'bg-success bg-opacity-10'; textClass = 'text-success fw-bold'; }
                                                        else if (isSelected && !isCorrectAnswer) { borderClass = 'border-danger'; bgClass = 'bg-danger bg-opacity-10'; textClass = 'text-danger fw-bold'; }
                                                        else if (!isSelected && isCorrectAnswer) { borderClass = 'border-success border-opacity-50 border-dashed'; textClass = 'text-success opacity-75'; }

                                                        return (
                                                            <div key={idx} className={`p-2 px-3 rounded-3 border d-flex justify-content-between align-items-center ${borderClass} ${bgClass}`}>
                                                                <span className={`small ${textClass}`}>{opt}</span>
                                                                {isSelected && (isCorrectAnswer ? <CheckCircle size={16} className="text-success" /> : <XCircle size={16} className="text-danger" />)}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="p-3 bg-dark bg-opacity-50 rounded border border-white border-opacity-10">
                                                    <small className="text-white-50 text-uppercase fw-bold d-block mb-1">Submitted Answer:</small>
                                                    <div className="font-monospace text-light small overflow-auto" style={{ whiteSpace: 'pre-wrap', maxHeight: '300px' }}>
                                                        {ans.submittedAnswer?.toString() || <span className="text-muted fst-italic">No Answer</span>}
                                                    </div>
                                                </div>
                                            )}
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
