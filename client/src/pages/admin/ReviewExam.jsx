import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Save, Trash2, Plus, Code, ArrowLeft, CheckCircle, Type, List, Sparkles, FileText, Layers, Clock, Zap } from 'lucide-react';
import API_BASE_URL from '../../config';

const ReviewExam = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get data passed from CreateExam page
  const initialQuestions = location.state?.questions || [];
  const examMeta = {
    title: location.state?.title || "Untitled Exam",
    subject: location.state?.subject || "General",
    duration: location.state?.duration || 60
  };

  const [questions, setQuestions] = useState(initialQuestions);
  const [saving, setSaving] = useState(false);

  // Function to update a specific question field
  const updateQuestion = (index, field, value) => {
    const newQuestions = [...questions];

    // Special Logic: If switching TO Coding type, ensure arrays exist
    if (field === 'type' && value === 'CODE') {
      if (!newQuestions[index].allowedLanguages) {
        newQuestions[index].allowedLanguages = ['java', 'python', 'c'];
      }
      if (!newQuestions[index].testCases) {
        newQuestions[index].testCases = [{ input: "", output: "" }];
      }
    }

    // Special Logic: If switching TO MCQ, ensure options exist
    if (field === 'type' && value === 'MCQ') {
      if (!newQuestions[index].options || newQuestions[index].options.length === 0) {
        newQuestions[index].options = ["Option A", "Option B", "Option C", "Option D"];
        newQuestions[index].correctAnswers = ["Option A"];
      }
    }

    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  // Function to delete a question
  const deleteQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  // Function to add a new manual question
  const addQuestion = (type) => {
    const newQ = {
      questionText: "New Question",
      marks: 5,
      type: type,
    };

    if (type === 'MCQ') {
      newQ.options = ["Option A", "Option B", "Option C", "Option D"];
      newQ.correctAnswers = ["Option A"];
    }

    if (type === 'CODE') {
      newQ.allowedLanguages = ['java', 'python', 'c'];
      newQ.testCases = [{ input: "", output: "" }];
    }

    setQuestions([...questions, newQ]);
  };

  // SAVE TO DATABASE
  const handleSaveExam = async () => {
    if (questions.length === 0) {
      alert("You cannot save an empty exam.");
      return;
    }

    setSaving(true);

    try {
      const examData = {
        title: examMeta.title,
        subject: examMeta.subject,
        duration: examMeta.duration,
        questions: questions
      };

      const token = sessionStorage.getItem('token');

      if (!token) {
        alert("You are not logged in. Please login again.");
        setSaving(false);
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/admin/save`,
        examData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        alert("Exam Saved Successfully! 🚀");
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        if (user.role === 'institution') {
          navigate('/institution/dashboard');
        } else {
          navigate('/admin/dashboard');
        }
      }

    } catch (error) {
      console.error("Save Failed:", error);
      alert("Failed to save exam. Check backend console.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen relative font-sans overflow-x-hidden selection:bg-neonCyan selection:text-black pb-24">

      {/* BACKGROUND FX */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 glass-panel p-6 border border-white/10 sticky top-4 z-50 backdrop-blur-xl bg-black/60 shadow-2xl rounded-2xl">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button onClick={() => navigate(-1)} className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 text-gray-400 transition-colors group btn-hover-scale">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <FileText className="text-neonCyan" /> Review Exam
              </h1>
              <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                <span className="flex items-center gap-1"><Layers size={12} /> {examMeta.subject}</span>
                <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                <span className="flex items-center gap-1"><Clock size={12} /> {examMeta.duration} Mins</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveExam}
            disabled={saving}
            className="w-full md:w-auto bg-neonCyan text-black font-bold px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50 disabled:cursor-not-allowed group btn-hover-scale"
          >
            {saving ? <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> Saving...</> : <><Save className="w-5 h-5 group-hover:scale-110 transition-transform" /> Confirm & Save</>}
          </button>
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          <AnimatePresence>
            {questions.map((q, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="glass-panel p-8 rounded-2xl group border border-white/10 hover:border-white/20 transition-all hover:-translate-y-1 relative"
              >
                {/* Question Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0">
                    {index + 1}
                  </div>

                  <div className="flex-1">
                    <textarea
                      value={q.questionText}
                      onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
                      className="w-full bg-black/20 text-lg font-medium text-white border-b border-white/10 focus:border-neonCyan focus:outline-none resize-none overflow-hidden rounded-t-lg px-2 py-1 transition-colors hover:bg-white/5"
                      rows={2}
                      placeholder="Enter question text here..."
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Type Selector Dropdown */}
                    <div className="relative">
                      <select
                        value={q.type}
                        onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                        className="appearance-none bg-black/40 text-xs font-bold text-neonCyan uppercase px-4 py-2 pr-8 rounded-xl border border-white/10 focus:border-neonCyan focus:outline-none cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <option value="MCQ">MCQ</option>
                        <option value="SHORT">Short Answer</option>
                        <option value="CODE">Coding</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neonCyan">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteQuestion(index)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors btn-hover-scale"
                      title="Remove Question"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Dynamic Content based on Type */}
                <div className="pl-0 md:pl-14 space-y-4">

                  {/* MCQ OPTIONS */}
                  {q.type === 'MCQ' && (
                    <div className="row row-cols-1 md:row-cols-2 gap-4">
                      {q.options?.map((opt, optIndex) => {
                        const isCorrect = (q.correctAnswers || []).includes(opt);
                        return (
                          <div key={optIndex} className={`flex items-center gap-3 bg-black/20 p-3 rounded-xl border transition-all ${isCorrect ? 'border-green-500/50 bg-green-500/10' : 'border-white/5 hover:border-white/10'}`}>
                            <div
                              className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-all flex-shrink-0
                                ${isCorrect ? 'bg-green-500 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'border-gray-500 hover:border-neonCyan'}`}
                              onClick={() => {
                                let newCorrect = [...(q.correctAnswers || [])];
                                if (newCorrect.includes(opt)) {
                                  newCorrect = newCorrect.filter(v => v !== opt);
                                } else {
                                  newCorrect.push(opt);
                                }
                                updateQuestion(index, 'correctAnswers', newCorrect);
                              }}
                            >
                              {isCorrect && <CheckCircle className="w-3 h-3 text-black" />}
                            </div>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOptions = [...q.options];
                                newOptions[optIndex] = e.target.value;
                                updateQuestion(index, 'options', newOptions);
                              }}
                              className="flex-1 bg-transparent rounded-lg px-2 py-1 text-sm text-gray-300 focus:outline-none placeholder-gray-600 w-full"
                              placeholder={`Option ${optIndex + 1}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* SHORT ANSWER PREVIEW */}
                  {q.type === 'SHORT' && (
                    <div className="bg-white/5 p-6 rounded-xl border border-dashed border-white/10 text-sm text-gray-500 flex items-center justify-center gap-2 italic">
                      <Type className="w-4 h-4" />
                      <span>Student will type a text answer here...</span>
                    </div>
                  )}

                  {/* CODING PREVIEW */}
                  {q.type === 'CODE' && (
                    <div className="bg-black/40 p-5 rounded-xl border border-white/5 space-y-6">

                      {/* Language Restrictions */}
                      <div>
                        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-3 block">Allowed Languages</span>
                        <div className="flex gap-4">
                          {['java', 'python', 'c'].map(lang => (
                            <label key={lang} className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg border transition-all ${q.allowedLanguages?.includes(lang) ? 'bg-neonCyan/10 border-neonCyan text-neonCyan' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}>
                              <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${q.allowedLanguages?.includes(lang) ? 'bg-neonCyan border-neonCyan' : 'border-gray-500'}`}>
                                {q.allowedLanguages?.includes(lang) && <CheckCircle size={10} className="text-black" />}
                              </div>
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={q.allowedLanguages?.includes(lang) || false}
                                onChange={(e) => {
                                  const currentLangs = q.allowedLanguages || [];
                                  let newLangs;
                                  if (e.target.checked) newLangs = [...currentLangs, lang];
                                  else newLangs = currentLangs.filter(l => l !== lang);
                                  updateQuestion(index, 'allowedLanguages', newLangs);
                                }}
                              />
                              <span className="text-xs font-bold uppercase">{lang}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Test Cases Editor */}
                      <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Test Cases</span>
                          <div className="flex gap-3">
                            <button
                              onClick={async () => {
                                if (!q.questionText || q.questionText.length < 5) {
                                  alert("Please type a valid question first!");
                                  return;
                                }
                                try {
                                  const res = await axios.post(`${API_BASE_URL}/api/admin/generate-testcases`, {
                                    questionText: q.questionText
                                  });
                                  if (res.data.success) {
                                    updateQuestion(index, 'testCases', res.data.testCases);
                                  }
                                } catch (e) {
                                  alert("AI Generation Failed. Check Backend Console.");
                                }
                              }}
                              className="flex items-center gap-1.5 text-xs bg-neonCyan/10 text-neonCyan px-3 py-1.5 rounded-lg border border-neonCyan/20 hover:bg-neonCyan hover:text-black transition-all font-bold btn-hover-scale"
                            >
                              <Sparkles className="w-3 h-3" /> AI Generate
                            </button>
                            <button
                              onClick={() => {
                                const newCases = [...(q.testCases || []), { input: "", output: "" }];
                                updateQuestion(index, 'testCases', newCases);
                              }}
                              className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 px-3 py-1.5 hover:bg-blue-500/10 rounded-lg transition-all"
                            >
                              <Plus className="w-3 h-3" /> Add Manual
                            </button>
                          </div>
                        </div>

                        {q.testCases?.map((tc, tcIndex) => (
                          <div key={tcIndex} className="row row-cols-2 gap-4 mb-3">
                            <div>
                              <label className="text-[10px] text-gray-500 uppercase mb-1 block">Input</label>
                              <textarea
                                rows={1}
                                value={tc.input}
                                onChange={(e) => {
                                  const newCases = [...q.testCases];
                                  newCases[tcIndex].input = e.target.value;
                                  updateQuestion(index, 'testCases', newCases);
                                }}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-neonCyan outline-none transition-colors"
                                placeholder="stdin"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-500 uppercase mb-1 block">Expected Output</label>
                              <textarea
                                rows={1}
                                value={tc.output}
                                onChange={(e) => {
                                  const newCases = [...q.testCases];
                                  newCases[tcIndex].output = e.target.value;
                                  updateQuestion(index, 'testCases', newCases);
                                }}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-green-400 font-mono focus:border-green-500/50 outline-none transition-colors"
                                placeholder="stdout"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-end justify-end mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3 bg-black/20 px-3 py-2 rounded-lg border border-white/5">
                      <span className="text-xs text-gray-500 uppercase font-bold">Marks</span>
                      <input
                        type="number"
                        value={q.marks}
                        onChange={(e) => updateQuestion(index, 'marks', parseInt(e.target.value) || 0)}
                        className="w-12 bg-transparent text-sm text-white focus:outline-none text-center font-bold"
                      />
                    </div>
                  </div>

                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add New Question Section */}
          <div className="row row-cols-1 md:row-cols-3 gap-4 pb-8">
            <button onClick={() => addQuestion('MCQ')} className="p-6 bg-white/5 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-neonCyan/50 hover:text-neonCyan hover:bg-neonCyan/5 transition-all group btn-hover-scale">
              <div className="p-3 bg-neonCyan/10 rounded-xl group-hover:scale-110 transition-transform"><List size={24} /></div>
              <span className="font-bold text-white">Add MCQ</span>
            </button>
            <button onClick={() => addQuestion('SHORT')} className="p-6 bg-white/5 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-blue-500/50 hover:text-blue-500 hover:bg-blue-500/5 transition-all group btn-hover-scale">
              <div className="p-3 bg-blue-500/10 rounded-xl group-hover:scale-110 transition-transform"><Type size={24} /></div>
              <span className="font-bold text-white">Add Short Answer</span>
            </button>
            <button onClick={() => addQuestion('CODE')} className="p-6 bg-white/5 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-purple-500/50 hover:text-purple-500 hover:bg-purple-500/5 transition-all group btn-hover-scale">
              <div className="p-3 bg-purple-500/10 rounded-xl group-hover:scale-110 transition-transform"><Code size={24} /></div>
              <span className="font-bold text-white">Add Coding Problem</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ReviewExam;