import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Plus, Save, Trash2, FileText, BrainCircuit, X, CheckCircle,
    Code, Type, List, Wand2, ArrowLeft, Layers, Clock, CloudLightning
} from 'lucide-react';

const CreateExam = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [generating, setGenerating] = useState(null);

    const [examData, setExamData] = useState({
        title: '', subject: '', duration: 60, questions: []
    });

    const handleInputChange = (e) => setExamData({ ...examData, [e.target.name]: e.target.value });

    const handleQuestionChange = (index, field, value) => {
        const updated = [...examData.questions];
        updated[index][field] = value;
        setExamData({ ...examData, questions: updated });
    };

    const removeQuestion = (idx) => {
        setExamData({ ...examData, questions: examData.questions.filter((_, i) => i !== idx) });
    };

    // --- HANDLERS (Same as EditExam) ---

    // MCQ Handlers
    const handleOptionChange = (qIndex, oIndex, value) => {
        const updated = [...examData.questions];
        updated[qIndex].options[oIndex] = value;
        setExamData({ ...examData, questions: updated });
    };

    const toggleCorrectAnswer = (qIndex, value) => {
        const updated = [...examData.questions];
        const current = updated[qIndex].correctAnswers || [];
        if (current.includes(value)) {
            updated[qIndex].correctAnswers = current.filter(v => v !== value);
        } else {
            updated[qIndex].correctAnswers = [...current, value];
        }
        setExamData({ ...examData, questions: updated });
    };

    // Coding Handlers
    const toggleLanguage = (qIndex, lang) => {
        const updated = [...examData.questions];
        const currentLangs = updated[qIndex].allowedLanguages || [];
        if (currentLangs.includes(lang)) {
            updated[qIndex].allowedLanguages = currentLangs.filter(l => l !== lang);
        } else {
            updated[qIndex].allowedLanguages = [...currentLangs, lang];
        }
        setExamData({ ...examData, questions: updated });
    };

    const handleTestCaseChange = (qIndex, tcIndex, field, value) => {
        const updated = [...examData.questions];
        updated[qIndex].testCases[tcIndex][field] = value;
        setExamData({ ...examData, questions: updated });
    };

    const addTestCase = (qIndex) => {
        const updated = [...examData.questions];
        updated[qIndex].testCases.push({ input: '', output: '' });
        setExamData({ ...examData, questions: updated });
    };

    const removeTestCase = (qIndex, tcIndex) => {
        const updated = [...examData.questions];
        updated[qIndex].testCases = updated[qIndex].testCases.filter((_, i) => i !== tcIndex);
        setExamData({ ...examData, questions: updated });
    };

    // AI Generation
    const generateTestCases = async (qIndex) => {
        const q = examData.questions[qIndex];
        if (!q.questionText) return alert("Please enter question text first.");

        setGenerating(qIndex);
        try {
            const token = sessionStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/student/generate-test-cases',
                { questionText: q.questionText },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                const updated = [...examData.questions];
                updated[qIndex].testCases = res.data.testCases;
                setExamData({ ...examData, questions: updated });
            }
        } catch (e) {
            console.error(e);
            alert("AI Generation Failed");
        } finally {
            setGenerating(null);
        }
    };

    // Add Question Button Logic
    const addQuestion = (type) => {
        const base = { questionText: '', marks: 5, type };
        if (type === 'MCQ') {
            base.options = ['', '', '', ''];
            base.correctAnswers = [];
        } else if (type === 'CODE') {
            base.allowedLanguages = ['java', 'python', 'c'];
            base.testCases = [{ input: '', output: '' }];
        }
        setExamData({ ...examData, questions: [...examData.questions, base] });
    };

    // AI Upload Logic
    const handleFileUpload = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        setFile(selectedFile);
        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const token = sessionStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/student/extract-questions', formData, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                const safeQuestions = res.data.questions.map(q => ({
                    ...q,
                    type: q.type || 'SHORT',
                    options: q.options || (q.type === 'MCQ' ? ['', '', '', ''] : []),
                    correctAnswers: q.correctAnswers || (q.correctAnswer ? [q.correctAnswer] : []),
                    allowedLanguages: q.allowedLanguages || (q.type === 'CODE' ? ['java', 'python'] : []),
                    testCases: q.testCases || (q.type === 'CODE' ? [{ input: '', output: '' }] : [])
                }));
                // Append generated questions
                setExamData(prev => ({ ...prev, questions: [...prev.questions, ...safeQuestions] }));
            }
        } catch (error) {
            console.error(error);
            alert("Upload Failed");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        if (!examData.title || !examData.subject) return alert("Please fill title and subject");

        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            await axios.post('http://localhost:5000/api/admin/save', examData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/institution/dashboard');
        } catch (e) {
            console.error(e);
            alert("Save failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid p-4 animate-fade-in">

            {/* HEADER */}
            <div className="card glass-navbar border-0 shadow-lg mb-4 sticky-top z-3">
                <div className="card-body p-3 p-md-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                    <div className="d-flex align-items-center gap-3 w-100">
                        <button onClick={() => navigate('/institution/dashboard')} className="btn btn-outline-light border-0 text-white-50 hover-text-white">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="h4 fw-bold mb-0 d-flex align-items-center gap-2 text-white">
                                <Plus className="text-primary" size={24} /> Create Assessment
                            </h1>
                            <small className="text-white-50">Configure details or upload a document</small>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="btn btn-primary btn-lg d-flex align-items-center gap-2 px-4 shadow-lg hover-scale"
                    >
                        {loading ? <span className="spinner-border spinner-border-sm" /> : <><Save size={18} /> Publish Exam</>}
                    </button>
                </div>
            </div>

            <div className="row g-4">
                {/* LEFT COLUMN: CONFIG & UPLOAD */}
                <div className="col-lg-4">

                    {/* 1. BASIC DETAILS CARD */}
                    <div className="card glass-panel border-0 shadow-lg mb-4 animate-slide-up stagger-1">
                        <div className="card-header bg-transparent border-0 pt-4 px-4">
                            <h5 className="fw-bold mb-0 d-flex align-items-center gap-2 text-white">
                                <Layers className="text-warning" size={18} /> Basic Info
                            </h5>
                        </div>
                        <div className="card-body p-4 pt-2">
                            <div className="mb-3">
                                <label className="form-label text-white-50 small fw-bold text-uppercase">Exam Title</label>
                                <input
                                    name="title"
                                    onChange={handleInputChange}
                                    className="form-control form-control-dark"
                                    placeholder="e.g. Midterm Java"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label text-white-50 small fw-bold text-uppercase">Subject</label>
                                <input
                                    name="subject"
                                    onChange={handleInputChange}
                                    className="form-control form-control-dark"
                                    placeholder="e.g. Computer Science"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label text-white-50 small fw-bold text-uppercase">Duration (Mins)</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-transparent border-secondary text-white-50"><Clock size={16} /></span>
                                    <input
                                        type="number"
                                        name="duration"
                                        onChange={handleInputChange}
                                        className="form-control form-control-dark"
                                        defaultValue={60}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. AI UPLOAD CARD */}
                    <div className="card glass-panel shadow-lg border-0 text-center animate-slide-up stagger-2">
                        <div className="card-header bg-transparent border-0 pt-4 px-4">
                            <h5 className="fw-bold mb-0 d-flex justify-content-center align-items-center gap-2 text-white">
                                <BrainCircuit className="text-info" /> AI Auto-Generate
                            </h5>
                        </div>
                        <div className="card-body p-4">
                            <p className="text-white-50 small mb-4">Upload a course document (PDF/DOCX) and let our AI generate questions for you.</p>

                            <label className={`btn btn-outline-secondary border-dashed w-100 py-4 d-flex flex-column align-items-center ${isUploading ? 'disabled' : ''}`}>
                                {isUploading ? (
                                    <>
                                        <span className="spinner-border text-info mb-2" />
                                        <span className="text-info font-bold">Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <CloudLightning className="text-info mb-2" size={28} />
                                        <span className="fw-bold text-white">Click to Upload</span>
                                        <small className="text-white-50 mt-1">.pdf or .docx supported</small>
                                    </>
                                )}
                                <input type="file" className="d-none" accept=".pdf,.docx" onChange={handleFileUpload} disabled={isUploading} />
                            </label>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: QUESTIONS */}
                <div className="col-lg-8">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="fw-bold mb-0 d-flex align-items-center gap-2 text-white">
                            <FileText className="text-info" size={20} /> Questions ({examData.questions.length})
                        </h5>
                    </div>

                    {examData.questions.length === 0 ? (
                        <div className="card border-secondary border-dashed bg-transparent p-5 text-center text-white-50">
                            <div className="card-body">
                                <Plus size={40} className="mb-3 opacity-25" />
                                <h3 className="text-white">No questions added</h3>
                                <p>Upload a document to generate questions or start adding them manually below.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-4">
                            {examData.questions.map((q, i) => (
                                <div key={i} className="card glass-panel border-0 shadow-lg position-relative animate-fade-in stagger-1">
                                    <div className="card-body p-4">

                                        {/* Question Header */}
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <div className="d-flex align-items-center gap-3">
                                                <span className="badge bg-primary rounded-pill d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px' }}>{i + 1}</span>
                                                <span className="badge bg-transparent text-white-50 border border-secondary border-opacity-25">{q.type} Question</span>
                                            </div>
                                            <button onClick={() => removeQuestion(i)} className="btn btn-sm btn-outline-danger border-0 rounded-circle p-2 hover-bg-danger-soft">
                                                <Trash2 size={20} />
                                            </button>
                                        </div>

                                        {/* Question Text */}
                                        <div className="mb-4">
                                            <textarea
                                                value={q.questionText}
                                                onChange={(e) => handleQuestionChange(i, 'questionText', e.target.value)}
                                                className="form-control form-control-dark"
                                                rows="3"
                                                placeholder="Type your question here..."
                                            />
                                        </div>

                                        {/* --- TYPE SPECIFIC UI --- */}

                                        {/* 1. MCQ UI */}
                                        {q.type === 'MCQ' && (
                                            <div className="row g-3 animate-fade-in">
                                                {q.options.map((opt, oIndex) => (
                                                    <div key={oIndex} className="col-md-6">
                                                        <div className={`d-flex align-items-center gap-2 p-2 rounded-3 border ${(q.correctAnswers || []).includes(opt) && opt !== '' ? 'border-success bg-success bg-opacity-10' : 'border-white border-opacity-10 bg-dark bg-opacity-25'} transition-all`}>
                                                            <button
                                                                onClick={() => toggleCorrectAnswer(i, opt)}
                                                                className={`btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center border ${(q.correctAnswers || []).includes(opt) && opt !== '' ? 'btn-success text-white shadow-sm' : 'btn-outline-secondary border-opacity-25 border-white bg-transparent'}`}
                                                                style={{ width: '28px', height: '28px' }}
                                                            >
                                                                {(q.correctAnswers || []).includes(opt) && opt !== '' ? <CheckCircle size={16} /> : <div className="rounded-circle" style={{ width: '10px', height: '10px', border: '2px solid rgba(255,255,255,0.2)' }} />}
                                                            </button>
                                                            <input
                                                                value={opt}
                                                                onChange={(e) => handleOptionChange(i, oIndex, e.target.value)}
                                                                className="form-control bg-transparent border-0 shadow-none text-light"
                                                                placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* 2. CODING UI */}
                                        {q.type === 'CODE' && (
                                            <div className="d-flex flex-column gap-3 animate-fade-in">
                                                <div className="p-4 rounded-4 bg-dark bg-opacity-50 border border-white border-opacity-10">
                                                    <label className="text-white-50 small fw-bold text-uppercase mb-3 d-block">Allowed Languages</label>
                                                    <div className="d-flex gap-2">
                                                        {['java', 'python', 'c'].map(lang => (
                                                            <button
                                                                key={lang}
                                                                onClick={() => toggleLanguage(i, lang)}
                                                                className={`btn btn-sm d-flex align-items-center gap-2 btn-hover-scale px-3 py-2 ${q.allowedLanguages?.includes(lang) ? 'btn-primary' : 'btn-outline-secondary border-opacity-25 text-white-50'}`}
                                                            >
                                                                <span className="small fw-bold text-uppercase font-monospace">{lang}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="p-4 rounded-4 bg-dark bg-opacity-50 border border-white border-opacity-10">
                                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                                        <label className="text-white-50 small fw-bold text-uppercase">Test Cases</label>
                                                        <button
                                                            onClick={() => generateTestCases(i)}
                                                            disabled={generating === i}
                                                            className="btn btn-sm btn-outline-info d-flex align-items-center gap-2 btn-hover-scale border-opacity-25 text-info px-3"
                                                        >
                                                            {generating === i ? <span className="spinner-border spinner-border-sm" /> : <><Wand2 size={14} /> AI Generate</>}
                                                        </button>
                                                    </div>

                                                    {q.testCases?.map((tc, tcIndex) => (
                                                        <div key={tcIndex} className="input-group input-group-sm mb-3 shadow-sm border border-white border-opacity-10 rounded-pill overflow-hidden bg-black bg-opacity-25">
                                                            <span className="input-group-text bg-transparent border-0 text-white-50 small font-monospace px-3">IN</span>
                                                            <input
                                                                value={tc.input}
                                                                onChange={(e) => handleTestCaseChange(i, tcIndex, 'input', e.target.value)}
                                                                placeholder="Input"
                                                                className="form-control form-control-dark font-monospace border-0 bg-transparent text-light"
                                                            />
                                                            <span className="input-group-text bg-transparent border-0 text-white-50 small font-monospace px-3 border-start border-white border-opacity-10">OUT</span>
                                                            <input
                                                                value={tc.output}
                                                                onChange={(e) => handleTestCaseChange(i, tcIndex, 'output', e.target.value)}
                                                                placeholder="Output"
                                                                className="form-control form-control-dark font-monospace border-0 bg-transparent text-light"
                                                            />
                                                            <button onClick={() => removeTestCase(i, tcIndex)} className="btn btn-dark border-0 border-start border-white border-opacity-10 px-3 hover-text-danger">
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button onClick={() => addTestCase(i)} className="btn btn-sm btn-link text-primary text-decoration-none p-0 mt-2 d-flex align-items-center gap-2 btn-hover-scale ms-1">
                                                        <Plus size={16} /> <span className="small fw-bold text-uppercase">Add Manual Case</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Marks Footer */}
                                        <div className="d-flex justify-content-end mt-4 pt-3 border-top border-white border-opacity-10">
                                            <div className="d-flex align-items-center gap-3 bg-dark bg-opacity-50 px-3 py-1 rounded-pill border border-white border-opacity-10 shadow-sm">
                                                <span className="small text-white-50 fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Points</span>
                                                <input
                                                    type="number"
                                                    value={q.marks}
                                                    onChange={(e) => handleQuestionChange(i, 'marks', e.target.value)}
                                                    className="form-control form-control-sm bg-transparent border-0 fw-bold text-center p-0 shadow-none text-white"
                                                    style={{ width: '40px' }}
                                                />
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ADD BUTTONS FOOTER */}
                    <div className="row g-3 mt-4">
                        {[{ type: 'MCQ', icon: List, color: 'text-info' }, { type: 'SHORT', icon: Type, color: 'text-primary' }, { type: 'CODE', icon: Code, color: 'text-warning' }].map((btn, index) => (
                            <div key={btn.type} className={`col-md-4 animate-slide-up stagger-${index + 1}`}>
                                <button
                                    onClick={() => addQuestion(btn.type)}
                                    className={`w-100 btn glass-panel border border-white border-opacity-10 p-4 h-100 d-flex flex-column align-items-center gap-2 hover-shadow-lg transition-all btn-hover-scale ${btn.color}`}
                                >
                                    <btn.icon size={24} />
                                    <span className="fw-bold">Add {btn.type === 'CODE' ? 'Coding Problem' : btn.type === 'SHORT' ? 'Short Answer' : 'MCQ'}</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateExam;
