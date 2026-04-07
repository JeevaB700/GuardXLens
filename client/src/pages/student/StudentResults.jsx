import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Target, Clock, CheckCircle, XCircle, AlertTriangle, ChevronRight, ArrowLeft, LayoutDashboard, FileText, ShieldAlert, Award, AlertCircle } from 'lucide-react';
import API_BASE_URL from '../../config';

const StudentResults = () => {
    const [results, setResults] = useState([]);
    const [selectedResult, setSelectedResult] = useState(null);
    const [selectedExamDetails, setSelectedExamDetails] = useState(null);
    const [selectedExamStats, setSelectedExamStats] = useState(null);
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
                const res = await axios.get(`${API_BASE_URL}/api/student/results/${JSON.parse(userStr).id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const sorted = (res.data.results || []).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
                setResults(sorted);
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
            const res = await axios.get(`${API_BASE_URL}/api/student/exam/${r.examId._id || r.examId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setSelectedExamDetails(res.data.exam);
                setSelectedExamStats(res.data.stats);
            }
        } catch (err) { console.error(err); }
        finally { setDetailsLoading(false); }
    };

    const getAnalytics = (result) => {
        if (!result) return {};
        const totalQ = result.answers.length;
        const correct = result.answers.filter(a => a.isCorrect).length;
        const wrong = totalQ - correct;
        const accuracy = Math.round((correct / totalQ) * 100) || 0;
        const percentage = Math.round((result.score / result.totalMarks) * 100) || 0;
        const totalMarks = result.totalMarks || 100;
        const avgPerc = Math.round(((selectedExamStats?.average || 0) / totalMarks) * 100);
        const highPerc = Math.round(((selectedExamStats?.highest || 0) / totalMarks) * 100);
        const lowPerc = Math.round(((selectedExamStats?.lowest || 0) / totalMarks) * 100);
        const barData = [
            { name: 'My Score', value: percentage, color: '#84cc16' },
            { name: 'Average', value: avgPerc, color: '#06b6d4' },
            { name: 'Highest', value: highPerc, color: '#22c55e' },
            { name: 'Lowest', value: lowPerc, color: '#ef4444' },
        ];
        const pieData = [
            { name: 'Correct', value: correct, color: '#22c55e' },
            { name: 'Incorrect', value: wrong, color: '#ef4444' },
        ];
        return { totalQ, correct, wrong, accuracy, percentage, barData, pieData };
    };

    const stats = getAnalytics(selectedResult);

    const getDetailedBreakdown = () => {
        if (!selectedResult || !selectedExamDetails) return [];
        return selectedResult.answers.map((ans, index) => {
            const questionData = selectedExamDetails.questions.find(q => q._id === ans.questionId) ||
                selectedExamDetails.questions[index];
            return { ...ans, questionText: questionData?.questionText || 'Question text unavailable', options: questionData?.options || [], correctAnswers: questionData?.correctAnswers || [], type: questionData?.type || 'UNKNOWN', marks: questionData?.marks || 0 };
        });
    };

    const detailedAnswers = getDetailedBreakdown();

    const card = {
        background: 'rgba(10,15,30,0.7)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px',
    };

    if (loading) return (
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #080c18, #0a0f1e)' }}>
            <div className="d-flex flex-column align-items-center gap-3">
                <div className="spinner-neon"></div>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Loading Results</span>
            </div>
        </div>
    );

    return (
        <div className="d-flex flex-column animate-fade-in" style={{ height: '100vh', background: 'linear-gradient(135deg, #080c18, #0a0f1e)', overflow: 'hidden' }} data-bs-theme="dark">

            {/* ===== TOP NAV ===== */}
            <nav style={{ background: 'rgba(6,10,20,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(132,204,22,0.12)', padding: '12px 24px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                <button onClick={() => navigate('/student/dashboard')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '9px', padding: '6px 14px', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 500, transition: 'all 0.2s ease' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'white'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                >
                    <ArrowLeft size={14} /> Dashboard
                </button>
                <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />
                <div className="d-flex align-items-center gap-2">
                    <FileText size={15} style={{ color: 'var(--gx-neon)' }} />
                    <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.9rem' }}>My Results</span>
                </div>
            </nav>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* ===== SIDEBAR ===== */}
                <div style={{
                    width: showDetails ? '300px' : '100%', maxWidth: showDetails ? '300px' : 'none',
                    minWidth: showDetails ? '300px' : 'unset',
                    display: showDetails ? 'flex' : 'flex',
                    flexDirection: 'column',
                    borderRight: '1px solid rgba(255,255,255,0.07)',
                    background: 'rgba(6,10,20,0.85)',
                }} className={showDetails ? 'd-none d-md-flex' : 'd-flex'}>

                    <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                            Exam History ({results.length})
                        </span>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }} className="custom-scrollbar">
                        {results.length === 0 ? (
                            <div className="text-center py-5">
                                <Award size={32} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '10px' }} />
                                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>No exams taken yet.</p>
                            </div>
                        ) : results.map((r) => {
                            const pct = Math.round((r.score / r.totalMarks) * 100);
                            const isSelected = selectedResult?._id === r._id;
                            const accent = r.isMalpractice ? '#ef4444' : pct >= 40 ? '#84cc16' : '#f59e0b';
                            return (
                                <div key={r._id} onClick={() => handleResultClick(r)}
                                    style={{
                                        padding: '12px 14px', borderRadius: '11px', marginBottom: '6px',
                                        cursor: 'pointer', transition: 'all 0.2s ease',
                                        background: isSelected ? `${accent}15` : 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${isSelected ? `${accent}35` : 'rgba(255,255,255,0.05)'}`,
                                    }}
                                    onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; } }}
                                    onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; } }}
                                >
                                    <div className="d-flex justify-content-between align-items-start mb-1">
                                        <span style={{ fontWeight: 600, color: isSelected ? '#f8fafc' : 'rgba(255,255,255,0.7)', fontSize: '0.82rem', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {r.examId?.title || 'Unknown Exam'}
                                        </span>
                                        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)' }}>{new Date(r.submittedAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        {r.isMalpractice ? (
                                            <span style={{ fontSize: '0.65rem', fontWeight: 700, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '2px 7px', borderRadius: '100px' }}>Void</span>
                                        ) : (
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: accent }}>{r.score}/{r.totalMarks} · {pct}%</span>
                                        )}
                                        <ChevronRight size={13} style={{ color: 'rgba(255,255,255,0.2)' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ===== MAIN PANEL ===== */}
                <div style={{ flex: 1, overflowY: 'auto', display: showDetails ? 'flex' : 'none', flexDirection: 'column' }} className="d-md-flex custom-scrollbar">

                    {/* Mobile back */}
                    {showDetails && (
                        <div className="d-md-none p-3 d-flex align-items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(6,10,20,0.9)', flexShrink: 0 }}>
                            <button onClick={() => setShowDetails(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', color: 'white' }}>
                                <ArrowLeft size={15} />
                            </button>
                            <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedResult?.examId?.title}</span>
                        </div>
                    )}

                    {selectedResult ? (
                        <div style={{ padding: '28px', maxWidth: '1000px' }}>

                            {/* Header card */}
                            <div className="animate-slide-down mb-4" style={{ ...card, padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.01em' }}>{selectedResult.examId?.title}</h2>
                                    <div className="d-flex flex-wrap gap-3 mt-2">
                                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <Clock size={12} /> {new Date(selectedResult.submittedAt).toLocaleString()}
                                        </span>
                                        {selectedResult.isMalpractice && (
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <ShieldAlert size={12} /> Academic Integrity Violation
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {!selectedResult.isMalpractice && (
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '3rem', fontWeight: 900, color: stats.percentage >= 40 ? 'var(--gx-neon)' : '#f59e0b', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{stats.percentage}%</div>
                                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Total Score</div>
                                    </div>
                                )}
                            </div>

                            {selectedResult.isMalpractice ? (
                                <div className="animate-scale-in text-center p-5" style={{ ...card, border: '1px solid rgba(239,68,68,0.2)' }}>
                                    <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 30px rgba(239,68,68,0.15)' }}>
                                        <ShieldAlert size={32} style={{ color: '#ef4444' }} />
                                    </div>
                                    <h3 style={{ fontWeight: 800, color: '#ef4444', marginBottom: '12px' }}>Result Voided</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '480px', margin: '0 auto', fontSize: '0.9rem', lineHeight: 1.7 }}>
                                        This exam attempt was flagged for multiple security violations (tab switching, fullscreen exit, etc.). Contact your administrator to review this flag.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Charts row */}
                                    <div className="row g-4 mb-4 animate-slide-up stagger-1">
                                        <div className="col-md-5">
                                            <div style={{ ...card, padding: '20px', height: '100%' }}>
                                                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px', textAlign: 'center' }}>Accuracy Breakdown</div>
                                                <div style={{ width: '100%', height: 180 }}>
                                                    <ResponsiveContainer>
                                                        <PieChart>
                                                            <Pie data={stats.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} stroke="none">
                                                                {stats.pieData?.map((e, i) => <Cell key={i} fill={e.color} />)}
                                                            </Pie>
                                                            <Tooltip 
                                                                contentStyle={{ background: '#0a0f1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '0.8rem' }} 
                                                                itemStyle={{ color: '#f8fafc' }}
                                                            />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <div className="d-flex justify-content-center gap-4 mt-2">
                                                    {[{ color: '#22c55e', label: `${stats.correct} Correct` }, { color: '#ef4444', label: `${stats.wrong} Wrong` }].map(l => (
                                                        <div key={l.label} className="d-flex align-items-center gap-2">
                                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                                                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>{l.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-7">
                                            <div style={{ ...card, padding: '20px', height: '100%' }}>
                                                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Peer Comparison (%)</div>
                                                <div style={{ minHeight: '170px' }}>
                                                    <ResponsiveContainer width="100%" height={170}>
                                                        <BarChart data={stats.barData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                                                            <XAxis type="number" hide domain={[0, 100]} />
                                                            <YAxis dataKey="name" type="category" width={75} axisLine={false} tickLine={false} style={{ fontSize: '0.72rem', fill: 'rgba(255,255,255,0.4)' }} />
                                                            <Tooltip 
                                                                cursor={{ fill: 'rgba(255,255,255,0.03)' }} 
                                                                contentStyle={{ background: '#0a0f1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '0.8rem' }} 
                                                                itemStyle={{ color: '#f8fafc' }}
                                                                labelStyle={{ color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}
                                                            />
                                                            <Bar dataKey="value" barSize={16} radius={[0, 6, 6, 0]}>
                                                                {stats.barData?.map((e, i) => <Cell key={i} fill={e.color} />)}
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick stats */}
                                    <div className="d-flex gap-3 mb-4 flex-wrap animate-slide-up stagger-2">
                                        {[
                                            { label: 'Total Questions', value: stats.totalQ, color: '#06b6d4' },
                                            { label: 'Correct', value: stats.correct, color: '#22c55e' },
                                            { label: 'Wrong', value: stats.wrong, color: '#ef4444' },
                                            { label: 'Accuracy', value: `${stats.accuracy}%`, color: 'var(--gx-neon)' },
                                        ].map(s => (
                                            <div key={s.label} style={{ flex: 1, minWidth: '80px', ...card, padding: '14px 16px', borderColor: `${s.color}20` }}>
                                                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                                                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>{s.label}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Question breakdown */}
                                    <div style={{ ...card }} className="animate-slide-up stagger-3">
                                        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Question Breakdown</h3>
                                            {detailsLoading && <div className="spinner-border spinner-border-sm" role="status" style={{ width: '14px', height: '14px', borderWidth: '2px', borderColor: 'rgba(132,204,22,0.3)', borderTopColor: 'var(--gx-neon)' }}></div>}
                                        </div>
                                        <div>
                                            {detailedAnswers.map((ans, i) => (
                                                <div key={i} style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                    <div className="d-flex gap-3">
                                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: ans.isCorrect ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', border: `1px solid ${ans.isCorrect ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: ans.isCorrect ? '#22c55e' : '#ef4444', flexShrink: 0, fontSize: '0.85rem' }}>
                                                            {i + 1}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
                                                                <div>
                                                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, background: ans.isCorrect ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: ans.isCorrect ? '#22c55e' : '#ef4444', border: `1px solid ${ans.isCorrect ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`, padding: '2px 8px', borderRadius: '100px', marginBottom: '8px', display: 'inline-block' }}>
                                                                        {ans.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                                                    </span>
                                                                    <p style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.875rem', margin: 0, lineHeight: 1.6 }}>{ans.questionText}</p>
                                                                </div>
                                                                <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', padding: '3px 10px', borderRadius: '100px', color: 'rgba(255,255,255,0.4)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                                                                    {ans.marksAwarded}/{ans.marks} pts
                                                                </span>
                                                            </div>

                                                            <div className="mt-2">
                                                                {ans.type === 'MCQ' && ans.options.length > 0 ? (
                                                                    <div className="d-flex flex-column gap-1">
                                                                        {ans.options.map((opt, idx) => {
                                                                            const studentAnswers = Array.isArray(ans.submittedAnswer) ? ans.submittedAnswer : [ans.submittedAnswer].filter(Boolean);
                                                                            const isSelected = studentAnswers.includes(opt);
                                                                            const isCorrectAns = (ans.correctAnswers || []).includes(opt);
                                                                            let bg = 'rgba(255,255,255,0.03)', border = 'rgba(255,255,255,0.07)', color = 'rgba(255,255,255,0.4)', icon = null;
                                                                            if (isSelected && isCorrectAns) { bg = 'rgba(34,197,94,0.1)'; border = 'rgba(34,197,94,0.3)'; color = '#22c55e'; icon = <CheckCircle size={14} />; }
                                                                            else if (isSelected && !isCorrectAns) { bg = 'rgba(239,68,68,0.1)'; border = 'rgba(239,68,68,0.3)'; color = '#ef4444'; icon = <XCircle size={14} />; }
                                                                            else if (!isSelected && isCorrectAns) { bg = 'rgba(34,197,94,0.05)'; border = 'rgba(34,197,94,0.15)'; color = 'rgba(34,197,94,0.6)'; }
                                                                            return (
                                                                                <div key={idx} style={{ padding: '8px 12px', borderRadius: '8px', background: bg, border: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', transition: 'all 0.15s ease' }}>
                                                                                    <span style={{ fontSize: '0.82rem', color, fontWeight: isSelected ? 600 : 400 }}>{opt}</span>
                                                                                    {icon && <span style={{ color, flexShrink: 0 }}>{icon}</span>}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                ) : (
                                                                    <div style={{ padding: '12px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)' }}>
                                                                        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>Your Answer</span>
                                                                        <code style={{ color: '#e2e8f0', fontSize: '0.82rem', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                                                            {ans.submittedAnswer?.toString() || <span style={{ color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>No answer provided</span>}
                                                                        </code>
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
                    ) : (
                        <div className="d-none d-md-flex h-100 flex-column align-items-center justify-content-center text-center" style={{ padding: '2rem' }}>
                            <LayoutDashboard size={48} style={{ color: 'rgba(255,255,255,0.08)', marginBottom: '16px' }} />
                            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.9rem' }}>Select an exam from the sidebar to view detailed analytics</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentResults;
