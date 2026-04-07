import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Download, ArrowLeft, Users, AlertTriangle, CheckCircle, XCircle, FileSpreadsheet, Clock, BarChart3, Shield } from 'lucide-react';
import ExcelJS from 'exceljs';
import API_BASE_URL from '../../config';

const InstitutionExamResults = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [examInfo, setExamInfo] = useState(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const token = sessionStorage.getItem('token');
                const res = await axios.get(`${API_BASE_URL}/api/admin/exam-results/${examId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    setResults(res.data.results);
                    if (res.data.results.length > 0) setExamInfo(res.data.results[0].examId);
                }
            } catch (error) { console.error('Error fetching exam results:', error); }
            finally { setLoading(false); }
        };
        fetchResults();
    }, [examId]);

    const handleDownloadReport = async () => {
        if (results.length === 0) return alert('No results to download.');
        setDownloading(true);
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Exam Report');
            worksheet.columns = [
                { header: 'S.No', key: 'sno', width: 8 },
                { header: 'Student Name', key: 'name', width: 25 },
                { header: 'Student Mail ID', key: 'email', width: 30 },
                { header: 'Institution Name', key: 'institution', width: 25 },
                { header: 'Exam Start Time', key: 'examStart', width: 22 },
                { header: 'Exam End Time', key: 'examEnd', width: 22 },
                { header: 'Student Started At', key: 'startedAt', width: 22 },
                { header: 'Student Submitted At', key: 'submittedAt', width: 22 },
                { header: 'Marks Allotted', key: 'totalMarks', width: 15 },
                { header: 'Marks Obtained', key: 'score', width: 15 },
                { header: 'Percentage', key: 'percentage', width: 15 },
                { header: 'Pass/Fail', key: 'status', width: 18 }
            ];
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
            headerRow.height = 20;

            results.forEach((r, index) => {
                const student = r.studentId || {};
                const exam = r.examId || {};
                const totalMarks = exam.totalMarks || 0;
                const passMarks = exam.passMarks || 40;
                const percentage = totalMarks > 0 ? ((r.score / totalMarks) * 100).toFixed(2) + '%' : '0%';
                const isPass = !r.isMalpractice && (r.score >= passMarks);
                const statusText = r.isMalpractice ? 'MALPRACTICE (FAIL)' : (isPass ? 'PASS' : 'FAIL');
                const institutionName = student.institutionId?.name || 'N/A';
                const row = worksheet.addRow({
                    sno: index + 1,
                    name: student.name || 'Unknown',
                    email: student.email || 'N/A',
                    institution: institutionName,
                    examStart: exam.startTime ? new Date(exam.startTime).toLocaleString() : 'N/A',
                    examEnd: exam.endTime ? new Date(exam.endTime).toLocaleString() : 'N/A',
                    startedAt: r.startedAt ? new Date(r.startedAt).toLocaleString() : 'N/A',
                    submittedAt: r.submittedAt ? new Date(r.submittedAt).toLocaleString() : 'N/A',
                    totalMarks, score: r.score, percentage, status: statusText
                });
                const statusCell = row.getCell(12);
                if (r.isMalpractice) { statusCell.font = { bold: true, color: { argb: 'FFCC0000' } }; statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEEEE' } }; }
                else if (isPass) { statusCell.font = { bold: true, color: { argb: 'FF006600' } }; statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEFFEE' } }; }
                else { statusCell.font = { bold: true, color: { argb: 'FFCC6600' } }; statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFAEE' } }; }
                if (index % 2 === 1) row.eachCell(cell => { if (!cell.style.fill?.fgColor?.argb) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }; });
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `Exam_Report_${examInfo?.title?.replace(/\s+/g, '_') || 'Unknown'}.xlsx`;
            a.click(); window.URL.revokeObjectURL(url);
        } finally { setDownloading(false); }
    };

    // Summary stats
    const passed = results.filter(r => !r.isMalpractice && r.score >= (r.examId?.passMarks || 40)).length;
    const flagged = results.filter(r => r.isMalpractice).length;
    const avgScore = results.length > 0 ? Math.round(results.reduce((acc, r) => acc + (r.score / (r.examId?.totalMarks || 1)) * 100, 0) / results.length) : 0;

    if (loading) return (
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <div className="d-flex flex-column align-items-center gap-3">
                <div className="spinner-neon"></div>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Loading Results</span>
            </div>
        </div>
    );

    const card = { background: 'rgba(10,15,30,0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px' };

    return (
        <div className="animate-fade-in" style={{ padding: '28px', maxWidth: '1300px' }} data-bs-theme="dark">

            {/* ===== HEADER ===== */}
            <div className="animate-slide-down mb-5">
                <button onClick={() => navigate('/institution/active-exams')} className="d-flex align-items-center gap-2 mb-4" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.85rem', padding: 0, transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                >
                    <ArrowLeft size={16} /> Back to Exams
                </button>

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                    <div>
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <div className="status-dot status-dot-green"></div>
                            <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Exam Analytics</span>
                        </div>
                        <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
                            {examInfo?.title || 'Exam Results'}
                        </h1>
                        <p style={{ color: 'rgba(226,232,240,0.4)', marginTop: '6px', marginBottom: 0, fontSize: '0.875rem' }}>
                            {results.length} submission{results.length !== 1 ? 's' : ''} received
                        </p>
                    </div>
                    <button
                        onClick={handleDownloadReport}
                        disabled={results.length === 0 || downloading}
                        className="btn d-flex align-items-center gap-2 px-4 fw-semibold"
                        style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', borderRadius: '12px', padding: '11px 20px', fontSize: '0.875rem', transition: 'all 0.2s ease', boxShadow: '0 0 20px rgba(34,197,94,0.1)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.2)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(34,197,94,0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.12)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(34,197,94,0.1)'; }}
                    >
                        {downloading ? <div className="spinner-border spinner-border-sm" role="status" style={{ width: '14px', height: '14px', borderWidth: '2px', borderColor: 'rgba(34,197,94,0.3)', borderTopColor: '#22c55e' }}></div> : <FileSpreadsheet size={16} />}
                        Download Excel Report
                    </button>
                </div>
            </div>

            {/* ===== SUMMARY STATS ===== */}
            {results.length > 0 && (
                <div className="d-flex gap-3 mb-4 flex-wrap animate-slide-up stagger-1">
                    {[
                        { label: 'Total Submissions', value: results.length, accent: '#06b6d4', icon: Users },
                        { label: 'Passed', value: passed, accent: '#22c55e', icon: CheckCircle },
                        { label: 'Avg Score', value: `${avgScore}%`, accent: 'var(--gx-neon)', icon: BarChart3 },
                        { label: 'Flagged', value: flagged, accent: '#ef4444', icon: Shield },
                    ].map(s => (
                        <div key={s.label} style={{ flex: 1, minWidth: '110px', ...card, padding: '16px 18px', borderColor: `${s.accent}20` }}>
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <s.icon size={14} style={{ color: s.accent }} />
                                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</span>
                            </div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f8fafc', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* ===== RESULTS TABLE ===== */}
            <div className="animate-slide-up stagger-2" style={{ ...card, overflow: 'hidden' }}>
                {results.length === 0 ? (
                    <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center" style={{ minHeight: '260px' }}>
                        <Users size={48} style={{ color: 'rgba(255,255,255,0.08)', marginBottom: '16px' }} />
                        <h4 style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>No Submissions Yet</h4>
                        <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: '0.85rem', maxWidth: '280px' }}>Once students complete this exam, their results will appear here.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                    {['Student', 'Started At', 'Submitted At', 'Score', 'Status', 'Action'].map((h, i) => (
                                        <th key={h} style={{ padding: '14px 18px', fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: i >= 3 ? 'center' : 'left', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((result, idx) => {
                                    const passMarks = result.examId?.passMarks || 40;
                                    const isPass = !result.isMalpractice && (result.score >= passMarks);
                                    const pct = Math.round((result.score / (result.examId?.totalMarks || 1)) * 100);
                                    return (
                                        <tr key={result._id}
                                            onClick={() => navigate(`/institution/result-view/${result.studentId?._id}/${result._id}`, { state: { from: location.pathname } })}
                                            style={{ cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s ease' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '14px 18px' }}>
                                                <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.875rem', marginBottom: '2px' }}>{result.studentId?.name || 'Unknown'}</div>
                                                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>{result.studentId?.email}</div>
                                                {result.studentId?.institutionId?.name && (
                                                    <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', fontStyle: 'italic' }}>{result.studentId.institutionId.name}</div>
                                                )}
                                            </td>
                                            <td style={{ padding: '14px 18px', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                                                <div className="d-flex align-items-center gap-1">
                                                    <Clock size={11} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
                                                    {result.startedAt ? new Date(result.startedAt).toLocaleString() : '—'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 18px', color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                                                <div className="d-flex align-items-center gap-1">
                                                    <Clock size={11} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
                                                    {new Date(result.submittedAt).toLocaleString()}
                                                </div>
                                            </td>
                                            <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                                                <div style={{ fontWeight: 900, fontSize: '1.1rem', color: result.isMalpractice ? '#ef4444' : pct >= 40 ? 'var(--gx-neon)' : '#f59e0b', lineHeight: 1 }}>{result.score}</div>
                                                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>/ {result.examId?.totalMarks || 0}</div>
                                            </td>
                                            <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                                                {result.isMalpractice ? (
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', padding: '4px 10px', borderRadius: '100px', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                                                        <AlertTriangle size={10} /> Void
                                                    </span>
                                                ) : isPass ? (
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)', padding: '4px 10px', borderRadius: '100px', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                                                        <CheckCircle size={10} /> Pass
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)', padding: '4px 10px', borderRadius: '100px', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                                                        <XCircle size={10} /> Fail
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                                                <button style={{ background: 'rgba(132,204,22,0.08)', border: '1px solid rgba(132,204,22,0.2)', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', color: 'var(--gx-neon)', fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.2s ease', whiteSpace: 'nowrap' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(132,204,22,0.16)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(132,204,22,0.08)'}
                                                    onClick={e => { e.stopPropagation(); navigate(`/institution/result-view/${result.studentId?._id}/${result._id}`, { state: { from: location.pathname } }); }}
                                                >
                                                    View Detail
                                                </button>
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
    );
};

export default InstitutionExamResults;
