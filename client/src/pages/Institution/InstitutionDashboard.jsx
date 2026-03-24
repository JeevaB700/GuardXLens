import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, FileCheck, Plus, Activity, ArrowRight, WalletCards, BookOpen, TrendingUp } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import API_BASE_URL from '../../config';

const InstitutionDashboard = () => {
    const [stats, setStats] = useState({ students: 0, exams: 0 });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = sessionStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const sRes = await axios.get(`${API_BASE_URL}/api/auth/my-students`, config);
                const eRes = await axios.get(`${API_BASE_URL}/api/admin/institution-exams`, config);
                setStats({
                    students: sRes.data.students?.length || 0,
                    exams: eRes.data.exams?.length || 0
                });
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchDashboardData();
    }, [navigate]);

    if (loading) return (
        <div className="vh-100 d-flex justify-content-center align-items-center bg-gradient-dark text-white" data-bs-theme="dark">
            <div className="spinner-border text-primary" role="status"></div>
        </div>
    );

    return (
        <div className="container-fluid min-vh-100 p-4 bg-gradient-dark animate-fade-in" style={{ maxWidth: '1400px' }}>

            {/* Header Section */}
            <div className="mb-5">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                    <div>
                        <h1 className="h2 fw-bold mb-2 text-white">Institution Dashboard</h1>
                        <p className="text-white-50 mb-0">Manage your students and create assessments</p>
                    </div>
                    <Link to="/institution/create-exam" className="btn btn-primary btn-lg d-flex align-items-center gap-2 px-4 shadow-lg btn-hover-scale">
                        <Plus size={20} /> Create Assessment
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="row g-4 mb-5">
                {/* Students Card */}
                <div className="col-md-6 animate-slide-up stagger-1">
                    <div className="card glass-panel h-100 border-0 shadow-lg hover-lift cursor-pointer transition-all" onClick={() => navigate('/institution/students')}>
                        <div className="card-body p-4 p-md-5">
                            <div className="d-flex align-items-start justify-content-between mb-4">
                                <div className="p-3 rounded-3 bg-primary bg-opacity-25 text-primary shadow-sm">
                                    <Users size={32} />
                                </div>
                                <span className="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-25">Active</span>
                            </div>
                            <h3 className="h5 fw-bold text-white-50 text-uppercase small mb-2">Enrolled Students</h3>
                            <div className="d-flex align-items-end justify-content-between">
                                <h2 className="display-3 fw-bold mb-0 text-white">{stats.students}</h2>
                                <div className="text-primary fw-bold d-flex align-items-center gap-2 mb-2">
                                    View All <ArrowRight size={18} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Exams Card */}
                <div className="col-md-6 animate-slide-up stagger-2">
                    <div className="card glass-panel h-100 border-0 shadow-lg hover-lift cursor-pointer transition-all" onClick={() => navigate('/institution/active-exams')}>
                        <div className="card-body p-4 p-md-5">
                            <div className="d-flex align-items-start justify-content-between mb-4">
                                <div className="p-3 rounded-3 bg-success bg-opacity-25 text-success shadow-sm">
                                    <FileCheck size={32} />
                                </div>
                                <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25">Published</span>
                            </div>
                            <h3 className="h5 fw-bold text-white-50 text-uppercase small mb-2">Active Assessments</h3>
                            <div className="d-flex align-items-end justify-content-between">
                                <h2 className="display-3 fw-bold mb-0 text-white">{stats.exams}</h2>
                                <div className="text-success fw-bold d-flex align-items-center gap-2 mb-2">
                                    Manage <ArrowRight size={18} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card glass-panel border-0 shadow-lg animate-slide-up stagger-3">
                <div className="card-header bg-transparent border-bottom border-white border-opacity-10 py-4 px-4">
                    <h5 className="fw-bold mb-0 d-flex align-items-center gap-2 text-white">
                        <Activity size={20} className="text-warning" /> Quick Actions
                    </h5>
                </div>
                <div className="card-body p-4">
                    <div className="row g-4">

                        {/* Create Exam */}
                        <div className="col-md-4">
                            <div
                                className="p-4 rounded-3 glass-panel border border-white border-opacity-10 hover-bg-light-10 cursor-pointer transition-all h-100 d-flex flex-column"
                                onClick={() => navigate('/institution/create-exam')}
                            >
                                <div className="mb-3">
                                    <div className="d-inline-flex p-3 rounded-3 bg-success bg-opacity-25 text-success shadow-sm">
                                        <Plus size={24} />
                                    </div>
                                </div>
                                <h5 className="fw-bold text-white mb-2">Create New Exam</h5>
                                <p className="text-white-50 small mb-0">Draft a new assessment from scratch or use AI to generate questions</p>
                            </div>
                        </div>

                        {/* Review Results */}
                        <div className="col-md-4">
                            <div
                                className="p-4 rounded-3 glass-panel border border-white border-opacity-10 hover-bg-light-10 cursor-pointer transition-all h-100 d-flex flex-column"
                                onClick={() => navigate('/institution/students')}
                            >
                                <div className="mb-3">
                                    <div className="d-inline-flex p-3 rounded-3 bg-primary bg-opacity-25 text-primary shadow-sm">
                                        <TrendingUp size={24} />
                                    </div>
                                </div>
                                <h5 className="fw-bold text-white mb-2">Student Analytics</h5>
                                <p className="text-white-50 small mb-0">Monitor student performance and review exam results</p>
                            </div>
                        </div>

                        {/* Manage Exams */}
                        <div className="col-md-4">
                            <div
                                className="p-4 rounded-3 glass-panel border border-white border-opacity-10 hover-bg-light-10 cursor-pointer transition-all h-100 d-flex flex-column"
                                onClick={() => navigate('/institution/active-exams')}
                            >
                                <div className="mb-3">
                                    <div className="d-inline-flex p-3 rounded-3 bg-warning bg-opacity-25 text-warning shadow-sm">
                                        <WalletCards size={24} />
                                    </div>
                                </div>
                                <h5 className="fw-bold text-white mb-2">Edit Assessments</h5>
                                <p className="text-white-50 small mb-0">Update questions, settings, and configurations</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstitutionDashboard;
