import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Download, ArrowLeft, Users, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import ExcelJS from 'exceljs';
import API_BASE_URL from '../../config';

const InstitutionExamResults = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [examInfo, setExamInfo] = useState(null);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const token = sessionStorage.getItem('token');
                const res = await axios.get(`${API_BASE_URL}/api/admin/exam-results/${examId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    setResults(res.data.results);
                    if (res.data.results.length > 0) {
                        setExamInfo(res.data.results[0].examId);
                    }
                }
            } catch (error) {
                console.error("Error fetching exam results:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [examId]);

    const handleDownloadReport = async () => {
        if (results.length === 0) return alert("No results to download.");

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

        // Header row styling
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

            // Get institution name from nested populate
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
                totalMarks: totalMarks,
                score: r.score,
                percentage: percentage,
                status: statusText
            });

            // Color Pass/Fail cell (column 12)
            const statusCell = row.getCell(12);
            if (r.isMalpractice) {
                statusCell.font = { bold: true, color: { argb: 'FFCC0000' } };
                statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEEEE' } };
            } else if (isPass) {
                statusCell.font = { bold: true, color: { argb: 'FF006600' } };
                statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEFFEE' } };
            } else {
                statusCell.font = { bold: true, color: { argb: 'FFCC6600' } };
                statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFAEE' } };
            }

            // Alternate row shading
            if (index % 2 === 1) {
                row.eachCell(cell => {
                    if (!cell.style.fill?.fgColor?.argb) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
                    }
                });
            }
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Exam_Report_${examInfo?.title?.replace(/\s+/g, '_') || 'Unknown'}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (loading) return <div className="vh-100 d-flex align-items-center justify-content-center bg-gradient-dark"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="container-fluid min-vh-100 p-4 bg-gradient-dark animate-fade-in" style={{ maxWidth: '1400px' }}>
            {/* Header */}
            <div className="card glass-panel border-0 shadow-lg mb-4 animate-slide-up stagger-1">
                <div className="card-body p-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                    <div className="d-flex align-items-center gap-3 w-100">
                        <button onClick={() => navigate('/institution/active-exams')} className="btn btn-outline-secondary border-0 text-white-50 hover-text-white">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="h3 fw-bold mb-1 text-white d-flex align-items-center gap-2">
                                <Users className="text-primary" /> Exam Analytics
                            </h1>
                            <p className="text-white-50 mb-0">
                                {examInfo?.title || 'Unknown Exam'} • {results.length} Submissions
                            </p>
                        </div>
                    </div>
                    <button onClick={handleDownloadReport} className="btn btn-success d-flex align-items-center gap-2 px-4 shadow-lg btn-hover-scale" disabled={results.length === 0}>
                        <Download size={18} /> Download Excel Report
                    </button>
                </div>
            </div>

            {/* Students Table */}
            <div className="card glass-panel border-0 shadow-lg animate-slide-up stagger-2">
                <div className="card-body p-0">
                    {results.length === 0 ? (
                        <div className="p-5 text-center text-white-50">
                            <Users size={48} className="mb-3 opacity-25" />
                            <h4>No submissions yet</h4>
                            <p>Once students complete this exam, their results will appear here.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-dark table-hover mb-0 align-middle">
                                <thead className="bg-dark bg-opacity-75">
                                    <tr>
                                        <th className="px-4 py-3 text-white-50 fw-semibold border-0">Student</th>
                                        <th className="py-3 text-white-50 fw-semibold border-0">Started At</th>
                                        <th className="py-3 text-white-50 fw-semibold border-0">Submitted At</th>
                                        <th className="py-3 text-white-50 fw-semibold text-center border-0">Score</th>
                                        <th className="py-3 text-white-50 fw-semibold text-center border-0">Status</th>
                                        <th className="px-4 py-3 text-end text-white-50 fw-semibold border-0">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((result) => {
                                        const passMarks = result.examId?.passMarks || 40;
                                        const isPass = !result.isMalpractice && (result.score >= passMarks);
                                        return (
                                            <tr key={result._id} onClick={() => navigate(`/institution/result-view/${result.studentId?._id}/${result._id}`, { state: { from: location.pathname } })} style={{ cursor: 'pointer' }}>
                                                <td className="px-4 py-3 border-secondary border-opacity-10">
                                                    <div className="fw-bold text-white mb-1">{result.studentId?.name || 'Unknown Student'}</div>
                                                    <div className="small text-white-50">{result.studentId?.email}</div>
                                                    <div className="small text-white-50 fst-italic">{result.studentId?.institutionId?.name || ''}</div>
                                                </td>
                                                <td className="py-3 border-secondary border-opacity-10 text-white-50 small">
                                                    {result.startedAt ? new Date(result.startedAt).toLocaleString() : '—'}
                                                </td>
                                                <td className="py-3 border-secondary border-opacity-10 text-white-50 small">
                                                    {new Date(result.submittedAt).toLocaleString()}
                                                </td>
                                                <td className="py-3 border-secondary border-opacity-10 text-center">
                                                    <span className="fw-bold fs-5 text-white">{result.score}</span>
                                                    <span className="text-white-50 mx-1">/</span>
                                                    <span className="small text-white-50">{result.examId?.totalMarks || 0}</span>
                                                </td>
                                                <td className="py-3 border-secondary border-opacity-10 text-center">
                                                    {result.isMalpractice ? (
                                                        <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-3 py-2 rounded-pill d-inline-flex align-items-center gap-2">
                                                            <AlertTriangle size={14} /> Void
                                                        </span>
                                                    ) : isPass ? (
                                                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill d-inline-flex align-items-center gap-2">
                                                            <CheckCircle size={14} /> Pass
                                                        </span>
                                                    ) : (
                                                        <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-3 py-2 rounded-pill d-inline-flex align-items-center gap-2">
                                                            <XCircle size={14} /> Fail
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 border-secondary border-opacity-10 text-end">
                                                    <button className="btn btn-sm btn-outline-primary border-opacity-50 btn-hover-scale px-3">
                                                        View Result
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
        </div>
    );
};

export default InstitutionExamResults;
