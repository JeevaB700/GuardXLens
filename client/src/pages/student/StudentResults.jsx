import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Target, Clock, CheckCircle, XCircle, AlertTriangle, ChevronRight, ArrowLeft, LayoutDashboard, FileText, ShieldAlert, Award, AlertCircle } from 'lucide-react';

const StudentResults = () => {
    const [results, setResults] = useState([]);
    const [selectedResult, setSelectedResult] = useState(null);
    const [selectedExamDetails, setSelectedExamDetails] = useState(null); // Full exam content
    const [selectedExamStats, setSelectedExamStats] = useState(null); // Aggregated stats
    const [showDetails, setShowDetails] = useState(false);
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const userStr = sessionStorage.getItem('user');
        const token = sessionStorage.getItem('token');
        if (!userStr || !token) { navigate('/login'); return; }

        const fetchResults = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/student/results/${JSON.parse(userStr).id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Sort results by submittedAt (descending)
                const sortedResults = (res.data.results || []).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
                setResults(sortedResults);

                // Don't auto-select to avoid heavy fetching on load, let user click
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchResults();
    }, [navigate]);

    const handleResultClick = async (r) => {
        setSelectedResult(r);
        setShowDetails(true);
        setDetailsLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            // Fetch full exam details to get the questions/options texts
            const res = await axios.get(`http://localhost:5000/api/student/exam/${r.examId._id || r.examId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setSelectedExamDetails(res.data.exam);
                setSelectedExamStats(res.data.stats);
            }
        } catch (error) {
            console.error("Failed to fetch exam details", error);
        } finally {
            setDetailsLoading(false);
        }
    };

    const getAnalytics = (result) => {
        if (!result) return {};
        const totalQ = result.answers.length;
        const correct = result.answers.filter(a => a.isCorrect).length;
        const wrong = totalQ - correct;
        const accuracy = Math.round((correct / totalQ) * 100) || 0;
        const percentage = Math.round((result.score / result.totalMarks) * 100) || 0;

        const barData = [
            { name: 'My Score', value: percentage, color: '#3b82f6' },
            { name: 'Avg Score', value: selectedExamStats?.average || 0, color: '#94a3b8' },
            { name: 'Highest', value: selectedExamStats?.highest || 0, color: '#22c55e' },
            { name: 'Lowest', value: selectedExamStats?.lowest || 0, color: '#ef4444' },
        ];

        const pieData = [
            { name: 'Correct', value: correct, color: '#22c55e' },
            { name: 'Incorrect', value: wrong, color: '#ef4444' },
        ];

        return { totalQ, correct, wrong, accuracy, percentage, barData, pieData };
    };

    const stats = getAnalytics(selectedResult);

    // Helper to merge result answer with exam question
    const getDetailedBreakdown = () => {
        if (!selectedResult || !selectedExamDetails) return [];
        return selectedResult.answers.map((ans, index) => {
            // Find corresponding question in exam details. 
            // Note: index overlap is assumed if IDs match or simplistic order. 
            // Better to find by ID if possible. Result answers usually store qId.
            const questionData = selectedExamDetails.questions.find(q => q._id === ans.questionId) ||
                selectedExamDetails.questions[index]; // Fallback

            return {
                ...ans,
                questionText: questionData?.questionText || "Question text unavailable",
                options: questionData?.options || [],
                correctAnswers: questionData?.correctAnswers || [], // Need this for highlighting
                type: questionData?.type || 'UNKNOWN',
                marks: questionData?.marks || 0
            };
        });
    };

    const detailedAnswers = getDetailedBreakdown();

    if (loading) return <div className="vh-100 d-flex align-items-center justify-content-center bg-gradient-dark text-white" data-bs-theme="dark"> <div className="spinner-border text-primary" role="status"></div></div>;

    return (
        <div className="d-flex flex-column vh-100 bg-gradient-dark font-sans overflow-hidden text-light animate-fade-in" data-bs-theme="dark">

            {/* TOP NAVBAR */}
            <nav className="navbar navbar-dark glass-navbar px-4 py-2 flex-shrink-0">
                <div className="d-flex align-items-center gap-3">
                    <button onClick={() => navigate('/student/dashboard')} className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 border-0 text-white-50 hover-text-white btn-hover-scale">
                        <ArrowLeft size={16} /> Dashboard
                    </button>
                    <div className="vr text-secondary opacity-50"></div>
                    <span className="navbar-brand mb-0 h1 fs-6 fw-bold">My Results</span>
                </div>
            </nav>

            <div className="flex-grow-1 d-flex overflow-hidden">

                {/* --- LEFT SIDEBAR (Exam List) --- */}
                {/* FIX: Use col-md-auto or specific width class to prevent flexing too much */}
                <div className={`d-flex flex-column glass-panel border-end h-100 ${showDetails ? 'd-none d-md-flex' : 'd-flex w-100'}`} style={{ width: showDetails ? '300px' : '100%', maxWidth: showDetails ? '300px' : 'none', borderRightColor: 'rgba(255,255,255,0.1) !important' }}>
                    <div className="p-3 border-bottom border-secondary border-opacity-25 bg-transparent">
                        <h6 className="mb-0 fw-bold text-secondary text-uppercase small">Exam History</h6>
                    </div>

                    <div className="flex-grow-1 overflow-auto custom-scrollbar p-2">
                        {results.length === 0 && (
                            <div className="text-center mt-5 text-muted">
                                <Award size={32} className="opacity-25 mb-2" />
                                <p className="small">No exams taken yet.</p>
                            </div>
                        )}
                        {results.map((r) => (
                            <div
                                key={r._id}
                                onClick={() => handleResultClick(r)}
                                className={`d-flex flex-column gap-1 p-3 rounded mb-2 cursor-pointer transition-all border ${selectedResult?._id === r._id ? 'bg-primary-subtle text-primary border-primary-subtle bg-opacity-10' : 'bg-transparent border-transparent hover-bg-light-10 border-light border-opacity-10'}`}
                            >
                                <div className="d-flex justify-content-between align-items-start">
                                    <span className={`fw-bold text-truncate small ${selectedResult?._id === r._id ? 'text-primary' : 'text-white'}`} style={{ maxWidth: '70%' }}>
                                        {r.examId?.title || "Unknown Exam"}
                                    </span>
                                    <span style={{ fontSize: '0.7rem' }} className="text-white-50">{new Date(r.submittedAt).toLocaleDateString()}</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mt-1">
                                    {r.isMalpractice ? (
                                        <span className="badge bg-danger text-white border border-danger p-1 px-2" style={{ fontSize: '0.65rem' }}>Void/Malpractice</span>
                                    ) : (
                                        <span className={`badge ${selectedResult?._id === r._id ? 'bg-primary text-white' : 'bg-secondary bg-opacity-25 text-white-50'} border-0`} style={{ fontSize: '0.7rem' }}>
                                            {r.score}/{r.totalMarks} Flags
                                        </span>
                                    )}
                                    <ChevronRight size={14} className="text-white-50 opacity-50" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- RIGHT MAIN CONTENT --- */}
                <div className={`flex-grow-1 h-100 overflow-hidden bg-transparent position-relative d-flex flex-column ${showDetails ? 'd-flex w-100' : 'd-none d-md-flex'}`}>

                    {/* Mobile Back Header */}
                    {showDetails && (
                        <div className="d-md-none p-3 glass-panel border-bottom border-light border-opacity-10 d-flex align-items-center gap-2 flex-shrink-0">
                            <button onClick={() => setShowDetails(false)} className="btn btn-sm btn-outline-light border-0"><ArrowLeft size={16} /></button>
                            <span className="fw-bold text-truncate text-white">{selectedResult?.examId?.title}</span>
                        </div>
                    )}

                    {/* CONTENT SCROLL AREA */}
                    {selectedResult ? (
                        <div className="overflow-auto p-4 custom-scrollbar h-100">
                            <div className="container-fluid p-0" style={{ maxWidth: '1000px' }}>

                                {/* Header Card */}
                                <div className="card border-0 shadow-lg mb-4 glass-panel animate-slide-up stagger-1">
                                    <div className="card-body p-4 d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
                                        <div>
                                            <h2 className="h4 fw-bold mb-2 text-white">{selectedResult.examId?.title}</h2>
                                            <div className="d-flex gap-3 text-white-50 small">
                                                <span className="d-flex align-items-center gap-1"><Clock size={14} className="text-primary" /> Submitted: {new Date(selectedResult.submittedAt).toLocaleString()}</span>
                                                {selectedResult.isMalpractice && <span className="text-danger fw-bold d-flex align-items-center gap-1"><ShieldAlert size={14} /> Academic Integrity Violation</span>}
                                            </div>
                                        </div>
                                        {!selectedResult.isMalpractice && (
                                            <div className="text-end">
                                                <div className="display-4 fw-bold text-primary lh-1">{stats.percentage}%</div>
                                                <span className="text-secondary small text-uppercase fw-bold">Total Score</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedResult.isMalpractice ? (
                                    <div className="alert alert-danger d-flex flex-column align-items-center text-center p-5 shadow-lg border-danger border-opacity-25 bg-danger bg-opacity-10 text-light rounded-4">
                                        <div className="bg-danger bg-opacity-25 p-3 rounded-circle mb-3 shadow-sm text-danger"><ShieldAlert size={48} /></div>
                                        <h3 className="fw-bold text-danger">Result Voided</h3>
                                        <p className="text-white-50" style={{ maxWidth: '500px' }}>
                                            This exam attempt was flagged for multiple security violations (e.g., tab switching, fullscreen exit). Only an administrator can review and potentially revoke this status.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Analytics Grid */}
                                        <div className="row g-4 mb-4">

                                            {/* Accuracy PIE Chart */}
                                            <div className="col-md-5 animate-slide-up stagger-2">
                                                <div className="card border-0 shadow-sm h-100 glass-panel">
                                                    <div className="card-body p-3 d-flex flex-column align-items-center justify-content-center">
                                                        <h6 className="text-secondary text-uppercase fw-bold mb-3 small w-100 text-center">Accuracy Breakdown</h6>
                                                        <div style={{ width: '100%', height: 200 }}>
                                                            <ResponsiveContainer>
                                                                <PieChart>
                                                                    <Pie
                                                                        data={stats.pieData}
                                                                        dataKey="value"
                                                                        nameKey="name"
                                                                        cx="50%"
                                                                        cy="50%"
                                                                        innerRadius={60}
                                                                        outerRadius={80}
                                                                        paddingAngle={5}
                                                                        stroke="none"
                                                                    >
                                                                        {stats.pieData.map((entry, index) => (
                                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                                        ))}
                                                                    </Pie>
                                                                    <Tooltip
                                                                        contentStyle={{ backgroundColor: '#1e1e1e', borderRadius: '8px', border: '1px solid #333', color: '#fff' }}
                                                                        itemStyle={{ color: '#fff' }}
                                                                    />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                        <div className="d-flex gap-4 mt-2">
                                                            <div className="d-flex align-items-center gap-2 small">
                                                                <div className="rounded-circle" style={{ width: 8, height: 8, background: '#22c55e' }}></div>
                                                                <span className="text-white-50">{stats.correct} Correct</span>
                                                            </div>
                                                            <div className="d-flex align-items-center gap-2 small">
                                                                <div className="rounded-circle" style={{ width: 8, height: 8, background: '#ef4444' }}></div>
                                                                <span className="text-white-50">{stats.wrong} Wrong</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Performance BAR Chart */}
                                            <div className="col-md-7 animate-slide-up stagger-3">
                                                <div className="card border-0 shadow-sm h-100 glass-panel">
                                                    <div className="card-body p-3 d-flex flex-column">
                                                        <h6 className="text-secondary text-uppercase fw-bold mb-3 small">Peer Comparison (Score %)</h6>
                                                        <div className="flex-grow-1" style={{ minHeight: '180px' }}>
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <BarChart data={stats.barData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                                                    <XAxis type="number" hide domain={[0, 100]} />
                                                                    <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} style={{ fontSize: '0.75rem', fill: 'rgba(255,255,255,0.5)' }} />
                                                                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e1e1e', borderRadius: '8px', border: '1px solid #333', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                                                                    <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                                                                        {stats.barData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                                                    </Bar>
                                                                </BarChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Detailed Q&A */}
                                        <div className="card border-0 shadow-sm glass-panel animate-slide-up stagger-4">
                                            <div className="card-header bg-transparent border-bottom border-secondary border-opacity-25 p-3 d-flex justify-content-between align-items-center">
                                                <h6 className="fw-bold mb-0 text-white">Question Breakdown</h6>
                                                {detailsLoading && <div className="spinner-border spinner-border-sm text-secondary" role="status"></div>}
                                            </div>
                                            <div className="list-group list-group-flush bg-transparent">
                                                {detailedAnswers.map((ans, i) => (
                                                    <div key={i} className="list-group-item p-4 border-secondary border-opacity-10 bg-transparent text-light">
                                                        <div className="d-flex align-items-start gap-4">

                                                            {/* Question Number Badge */}
                                                            <div className={`flex-shrink-0 d-flex align-items-center justify-content-center rounded-circle fw-bold fs-5 shadow-sm ${ans.isCorrect ? 'bg-success text-white' : 'bg-danger text-white'}`} style={{ width: '40px', height: '40px' }}>
                                                                {i + 1}
                                                            </div>

                                                            <div className="flex-grow-1">
                                                                {/* Question Header */}
                                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                                    <div className="w-100">
                                                                        <span className={`badge mb-2 ${ans.isCorrect ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'} bg-opacity-10`}>
                                                                            {ans.isCorrect ? 'Correct Answer' : 'Incorrect'}
                                                                        </span>
                                                                        <h6 className="mb-2 fw-bold text-white lh-base">{ans.questionText}</h6>
                                                                    </div>
                                                                    <span className="badge bg-dark bg-opacity-50 text-secondary border border-secondary border-opacity-25 ms-3">{ans.marksAwarded} / {ans.marks} Marks</span>
                                                                </div>

                                                                {/* Options / Answer Display */}
                                                                <div className="mt-3">
                                                                    {ans.type === 'MCQ' && ans.options.length > 0 ? (
                                                                        <div className="d-flex flex-column gap-2">
                                                                            {ans.options.map((opt, idx) => {
                                                                                const studentAnswers = Array.isArray(ans.submittedAnswer) ? ans.submittedAnswer : [ans.submittedAnswer].filter(x => x);
                                                                                const isSelected = studentAnswers.includes(opt);
                                                                                const isCorrectAnswer = (ans.correctAnswers || []).includes(opt);

                                                                                let borderClass = 'border-white border-opacity-10';
                                                                                let bgClass = 'bg-transparent';
                                                                                let textClass = 'text-white-50';
                                                                                let icon = null;

                                                                                if (isSelected && isCorrectAnswer) {
                                                                                    borderClass = 'border-success';
                                                                                    bgClass = 'bg-success bg-opacity-10';
                                                                                    textClass = 'text-success fw-bold';
                                                                                    icon = <CheckCircle size={16} className="text-success" />;
                                                                                } else if (isSelected && !isCorrectAnswer) {
                                                                                    borderClass = 'border-danger';
                                                                                    bgClass = 'bg-danger bg-opacity-10';
                                                                                    textClass = 'text-danger fw-bold';
                                                                                    icon = <XCircle size={16} className="text-danger" />;
                                                                                } else if (!isSelected && isCorrectAnswer) {
                                                                                    borderClass = 'border-success border-opacity-50 border-dashed';
                                                                                    textClass = 'text-success-emphasis opacity-75';
                                                                                    icon = <CheckCircle size={14} className="text-success opacity-50" />;
                                                                                }

                                                                                return (
                                                                                    <div key={idx} className={`p-2 px-3 rounded-3 border d-flex justify-content-between align-items-center transition-all ${borderClass} ${bgClass}`}>
                                                                                        <span className={`small ${textClass}`}>{opt}</span>
                                                                                        {icon}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="p-3 bg-dark bg-opacity-50 rounded border border-secondary border-opacity-25">
                                                                            <small className="text-secondary text-uppercase fw-bold d-block mb-1">Your Answer:</small>
                                                                            <div className="font-monospace text-light small" style={{ whiteSpace: 'pre-wrap' }}>
                                                                                {ans.submittedAnswer?.toString() || <span className="text-white-50 fst-italic">No Answer Provided</span>}
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
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="d-none d-md-flex h-100 flex-column align-items-center justify-content-center text-white-50">
                            <LayoutDashboard size={48} className="opacity-25 mb-3" />
                            <p>Select an exam to view detailed analytics</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentResults;
