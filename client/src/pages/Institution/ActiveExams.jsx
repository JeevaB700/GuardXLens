import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FileCheck, Edit, Trash2, Clock, Plus, ArrowLeft, Search, Layers, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ActiveExams = () => {
    const [activeExams, setActiveExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const token = sessionStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/admin/institution-exams', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setActiveExams(res.data.exams || []);
            } catch (e) { console.error("Error fetching exams", e); }
            finally { setLoading(false); }
        };
        fetchExams();
    }, []);

    const handleEditExam = (examId) => navigate(`/institution/edit-exam/${examId}`);

    const handleDeleteExam = async (examId) => {
        if (!window.confirm("Are you sure you want to delete this exam?")) return;
        try {
            const token = sessionStorage.getItem('token');
            const res = await axios.delete(`http://localhost:5000/api/admin/exam/${examId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) setActiveExams(activeExams.filter(exam => exam._id !== examId));
        } catch (e) { alert("Failed to delete exam"); }
    };

    const filteredExams = activeExams.filter(exam =>
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="vh-100 d-flex align-items-center justify-content-center bg-gradient-dark" data-bs-theme="dark">
            <div className="spinner-border text-primary" role="status"></div>
        </div>
    );

    return (
        <div className="container-fluid min-vh-100 p-4 bg-gradient-dark animate-fade-in" style={{ maxWidth: '1400px' }}>

            {/* Header */}
            <div className="card glass-panel border-0 shadow-lg mb-4 animate-slide-up stagger-1">
                <div className="card-body p-4 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                    <div>
                        <button onClick={() => navigate('/institution/dashboard')} className="btn btn-link text-decoration-none p-0 mb-3 d-flex align-items-center gap-2 text-white-50 hover-text-white border-0">
                            <ArrowLeft size={18} /> Back to Dashboard
                        </button>
                        <h1 className="h2 fw-bold d-flex align-items-center gap-3 mb-2 text-white">
                            <FileCheck className="text-primary" size={32} /> Active Assessments
                        </h1>
                        <p className="text-white-50 mb-0">Manage, edit, or delete your existing assessments</p>
                    </div>
                    <button onClick={() => navigate('/institution/create-exam')} className="btn btn-primary btn-lg d-flex align-items-center gap-2 shadow-lg btn-hover-scale px-4">
                        <Plus size={20} /> Create New
                    </button>
                </div>
            </div>

            {/* Search & Content */}
            <div className="card glass-panel border-0 shadow-lg animate-slide-up stagger-2">
                <div className="card-header bg-transparent border-bottom border-white border-opacity-10 p-4">
                    <div className="input-group input-group-lg">
                        <span className="input-group-text bg-dark bg-opacity-50 border-secondary border-opacity-25 text-white-50">
                            <Search size={20} />
                        </span>
                        <input
                            type="text"
                            placeholder="Search by title or subject..."
                            className="form-control form-control-dark text-light shadow-none focus-ring-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="card-body p-4">
                    <div className="d-flex flex-column gap-3">
                        {filteredExams.length === 0 ? (
                            <div className="text-center py-5 border border-secondary border-opacity-25 border-dashed rounded-3 text-white-50 animate-fade-in">
                                <FileCheck size={48} className="mb-3 opacity-25" />
                                <h4 className="text-white">No exams found</h4>
                                <p className="mb-0">{searchTerm ? "No exams match your search." : "You haven't created any exams yet."}</p>
                            </div>
                        ) : (
                            filteredExams.map((exam, index) => (
                                <div key={exam._id} className={`card glass-panel border border-white border-opacity-10 shadow-sm hover-shadow-lg transition-all animate-slide-up stagger-${(index % 5) + 1}`}>
                                    <div className="card-body p-4 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                                        <div className="flex-grow-1">
                                            <div className="d-flex align-items-center gap-3 mb-3">
                                                <h3 className="h5 fw-bold mb-0 text-white">{exam.title}</h3>
                                                <span className="badge bg-info bg-opacity-25 text-info border border-info border-opacity-25">{exam.subject}</span>
                                            </div>
                                            <div className="d-flex flex-wrap gap-2">
                                                <span className="d-flex align-items-center gap-2 bg-dark bg-opacity-50 px-3 py-2 rounded-pill text-white-50 small border border-secondary border-opacity-25">
                                                    <Clock size={14} className="text-primary" /> {exam.duration} mins
                                                </span>
                                                <span className="d-flex align-items-center gap-2 bg-dark bg-opacity-50 px-3 py-2 rounded-pill text-white-50 small border border-secondary border-opacity-25">
                                                    <Layers size={14} className="text-success" /> {exam.questions?.length || 0} Questions
                                                </span>
                                                <span className="d-flex align-items-center gap-2 bg-success bg-opacity-25 text-success px-3 py-2 rounded-pill fw-bold small border border-success border-opacity-25">
                                                    {exam.totalMarks} Marks
                                                </span>
                                            </div>
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button onClick={() => handleEditExam(exam._id)} className="btn btn-outline-primary d-flex align-items-center gap-2 btn-hover-scale border-opacity-50">
                                                <Edit size={16} /> Edit
                                            </button>
                                            <button onClick={() => handleDeleteExam(exam._id)} className="btn btn-outline-danger d-flex align-items-center justify-content-center btn-hover-scale border-opacity-50" style={{ width: '44px', height: '44px' }}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActiveExams;
