import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Save, Trash2, ArrowLeft, Plus, CheckCircle, Code, Type, List, Wand2, X, FileEdit, Clock, Layers } from 'lucide-react';
import API_BASE_URL from '../../config';

const EditExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);

  const [examData, setExamData] = useState({
    title: '',
    subject: '',
    duration: 60,
    startTime: '',
    endTime: '',
    passMarks: 40,
    questions: []
  });

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/api/student/exam/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          const exam = res.data.exam;
          const toLocalDT = (iso) => {
            if (!iso) return '';
            const d = new Date(iso);
            return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          };
          exam.startTime = toLocalDT(exam.startTime);
          exam.endTime = toLocalDT(exam.endTime);
          const sanitizedQuestions = exam.questions.map(q => ({
            ...q,
            testCases: q.testCases || [],
            allowedLanguages: q.allowedLanguages || ['java', 'python', 'c'],
            options: q.options || ['', '', '', ''],
            correctAnswers: q.correctAnswers || (q.correctAnswer ? [q.correctAnswer] : [])
          }));
          setExamData({ ...exam, questions: sanitizedQuestions });
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchExam();
  }, [id]);

  const handleInputChange = (e) => setExamData({ ...examData, [e.target.name]: e.target.value });

  const handleQuestionChange = (index, field, value) => {
    const updated = [...examData.questions];
    updated[index][field] = value;
    setExamData({ ...examData, questions: updated });
  };

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

  const generateTestCases = async (qIndex) => {
    const q = examData.questions[qIndex];
    if (!q.questionText) return alert("Please enter question text first.");
    setGenerating(qIndex);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/student/generate-test-cases`, { questionText: q.questionText });
      if (res.data.success) {
        const updated = [...examData.questions];
        updated[qIndex].testCases = res.data.testCases;
        setExamData({ ...examData, questions: updated });
      }
    } catch (e) { alert("AI Generation Failed"); }
    finally { setGenerating(null); }
  };

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

  const removeQuestion = (index) => {
    const updated = examData.questions.filter((_, i) => i !== index);
    setExamData({ ...examData, questions: updated });
  };

  const handleSave = async () => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/admin/exam/${id}`, examData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Exam updated successfully!");
      navigate('/institution/dashboard');
    } catch (error) { alert("Failed to update exam."); }
  };

  if (loading) return <div className="vh-100 d-flex align-items-center justify-content-center bg-gradient-dark text-white" data-bs-theme="dark"><div className="spinner-border text-primary" role="status"></div></div>;

  return (
    <div className="container-fluid min-vh-100 p-4 bg-gradient-dark animate-fade-in" style={{ maxWidth: '1200px' }}>

      {/* HEADER */}
      <div className="card glass-navbar border-0 shadow-lg mb-4 sticky-top z-3 animate-slide-up stagger-1">
        <div className="card-body p-3 p-md-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-3 w-100">
            <button onClick={() => navigate('/institution/dashboard')} className="btn btn-outline-secondary border-0">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="h4 fw-bold mb-0 d-flex align-items-center gap-2">
                <FileEdit className="text-primary" /> Edit Exam
              </h1>
              <small className="text-muted">Update questions and configurations</small>
            </div>
          </div>
          <button onClick={handleSave} className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm btn-hover-scale">
            <Save size={18} /> Save Changes
          </button>
        </div>
      </div>

      {/* EXAM DETAILS CARD */}
      <div className="card glass-panel border-0 shadow-lg mb-4 animate-slide-up stagger-2">
        <div className="card-header bg-transparent border-bottom border-white border-opacity-10 pt-4 px-4">
          <h2 className="h5 fw-bold mb-0 dflex align-items-center gap-2 text-white">
            <Layers className="text-warning" /> Exam Configuration
          </h2>
        </div>
        <div className="card-body p-4 pt-2">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label text-white-50 small fw-bold text-uppercase">Title</label>
              <input name="title" value={examData.title} onChange={handleInputChange} className="form-control form-control-dark text-light" placeholder="e.g. Final Assessment" />
            </div>
            <div className="col-md-4">
              <label className="form-label text-white-50 small fw-bold text-uppercase">Subject</label>
              <input name="subject" value={examData.subject} onChange={handleInputChange} className="form-control form-control-dark text-light" placeholder="e.g. Computer Science" />
            </div>
            <div className="col-md-4">
              <label className="form-label text-white-50 small fw-bold text-uppercase">Duration (Mins)</label>
              <div className="input-group">
                <span className="input-group-text bg-dark bg-opacity-50 border-secondary border-opacity-25 text-white-50"><Clock size={16} /></span>
                <input name="duration" type="number" value={examData.duration} onChange={handleInputChange} className="form-control form-control-dark text-light" />
              </div>
            </div>
            <div className="col-md-4 mt-3">
              <label className="form-label text-white-50 small fw-bold text-uppercase">Start Time</label>
              <input name="startTime" type="datetime-local" value={examData.startTime || ''} onChange={handleInputChange} className="form-control form-control-dark text-light" />
            </div>
            <div className="col-md-4 mt-3">
              <label className="form-label text-white-50 small fw-bold text-uppercase">End Time (Emergency Edit)</label>
              <input name="endTime" type="datetime-local" value={examData.endTime || ''} onChange={handleInputChange} className="form-control form-control-dark text-light" />
            </div>
            <div className="col-md-4 mt-3">
              <label className="form-label text-white-50 small fw-bold text-uppercase">Pass Marks</label>
              <input name="passMarks" type="number" value={examData.passMarks || ''} onChange={handleInputChange} className="form-control form-control-dark text-light" />
            </div>
          </div>
        </div>
      </div>

      {/* QUESTIONS LIST */}
      <div className="d-flex flex-column gap-4">
        {examData.questions.map((q, i) => (
          <div key={i} className={`card glass-panel border border-white border-opacity-10 shadow-lg position-relative transition-all animate-slide-up stagger-${(i % 5) + 1}`}>
            <div className="card-body p-4 p-md-5">

              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-3">
                  <span className="d-flex align-items-center justify-content-center bg-primary bg-opacity-75 rounded text-white fw-bold shadow-sm" style={{ width: '40px', height: '40px' }}>{i + 1}</span>
                  <span className="badge bg-info bg-opacity-25 text-info border border-info border-opacity-25">{q.type} Question</span>
                </div>
                <button onClick={() => removeQuestion(i)} className="btn btn-outline-danger btn-sm border-opacity-50 rounded-circle p-2 hover-scale" title="Remove Question">
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="mb-4">
                <textarea
                  value={q.questionText}
                  onChange={(e) => handleQuestionChange(i, 'questionText', e.target.value)}
                  className="form-control fs-5 form-control-dark text-light"
                  style={{ minHeight: '120px' }}
                  placeholder="Type your question here..."
                />
              </div>

              {/* MCQ UI */}
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

              {/* CODING UI */}
              {q.type === 'CODE' && (
                <div className="d-flex flex-column gap-3 animate-fade-in">
                  <div className="p-4 rounded-4 bg-dark bg-opacity-50 border border-white border-opacity-10">
                    <label className="text-white-50 small fw-bold text-uppercase mb-3 d-block">Allowed Languages</label>
                    <div className="d-flex gap-2">
                      {['java', 'python', 'c'].map(lang => (
                        <button
                          key={lang}
                          className={`btn btn-sm d-flex align-items-center gap-2 btn-hover-scale px-3 py-2 ${q.allowedLanguages.includes(lang) ? 'btn-primary' : 'btn-outline-secondary border-opacity-25 text-white-50'}`}
                          onClick={() => toggleLanguage(i, lang)}
                        >
                          <span className="small fw-bold text-uppercase font-monospace">{lang}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-4 bg-dark bg-opacity-50 border border-white border-opacity-10">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <label className="text-white-50 small fw-bold text-uppercase">Test Cases</label>
                      <button onClick={() => generateTestCases(i)} disabled={generating === i} className="btn btn-sm btn-outline-info d-flex align-items-center gap-2 btn-hover-scale border-opacity-25 text-info px-3">
                        {generating === i ? <span className="spinner-border spinner-border-sm" /> : <><Wand2 size={14} /> AI Generate</>}
                      </button>
                    </div>

                    {q.testCases.map((tc, tcIndex) => (
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
                        <button onClick={() => removeTestCase(i, tcIndex)} className="btn btn-dark border-0 border-start border-white border-opacity-10 px-3 hover-text-danger"><X size={16} /></button>
                      </div>
                    ))}
                    <button onClick={() => addTestCase(i)} className="btn btn-sm btn-link text-primary text-decoration-none p-0 d-flex align-items-center gap-2 mt-2 btn-hover-scale ms-1">
                      <Plus size={16} /> <span className="small fw-bold text-uppercase">Add Manual Case</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Marks Footer */}
              <div className="mt-4 pt-3 border-top border-white border-opacity-10 d-flex justify-content-end">
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

      {/* ADD BUTTONS FOOTER */}
      <div className="row g-3 mt-2">
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
  );
};

export default EditExam;
