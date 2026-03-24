import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, FileCheck, AlertTriangle, Globe, Activity } from 'lucide-react';
import API_BASE_URL from '../../config';

const DashboardHome = () => {
    const [stats, setStats] = useState({ students: 0, exams: 0, institutions: 0, violations: 0 });
    const [recentLogs, setRecentLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // In a real app, these should be secured endpoints
                const token = sessionStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const [logsRes, instRes, studRes, examsRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/admin/logs`, config),
                    axios.get(`${API_BASE_URL}/api/auth/institutions`, config),
                    axios.get(`${API_BASE_URL}/api/auth/all-students`, config),
                    axios.get(`${API_BASE_URL}/api/student/exams`, config)
                ]);
                setStats({
                    students: studRes.data.results?.length || 0,
                    exams: examsRes.data.exams?.length || 0,
                    institutions: instRes.data.institutions?.length || 0,
                    violations: logsRes.data.logs?.length || 0,
                });
                setRecentLogs(logsRes.data.logs?.slice(0, 5) || []);
            } catch (e) {
                console.error("Error fetching stats:", e);
                // Fallback for demo if API fails
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center h-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    const StatCard = ({ title, value, icon: Icon, color, staggerClass }) => (
        <div className={`col-md-6 col-xl-3 ${staggerClass}`}>
            <div className="card glass-panel border-0 shadow-lg h-100 animate-slide-up hover-shadow-sm">
                <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                        <div className={`p-3 rounded-circle bg-${color} bg-opacity-10 text-${color} me-3`}>
                            <Icon size={24} />
                        </div>
                        <div>
                            <h6 className="card-subtitle text-white-50 mb-1 small">{title}</h6>
                            <h3 className="card-title fw-bold mb-0 text-white">{value}</h3>
                        </div>
                    </div>
                </div>
                <div className={`card-footer bg-transparent border-0 pt-0`}>
                    <small className="text-white-50">Updated just now</small>
                </div>
            </div>
        </div>
    );

    return (
        <div className="container-fluid p-4 animate-fade-in">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 fw-bold mb-1 text-white">Dashboard</h1>
                    <p className="text-white-50 mb-0">Welcome to the Super Admin Control Center.</p>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-success bg-opacity-10 text-success border border-success px-3 py-2 rounded-pill">
                        <span className="d-inline-block bg-success rounded-circle me-2" style={{ width: 8, height: 8 }}></span>
                        System Online
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="row g-4 mb-4">
                <StatCard title="Institutions" value={stats.institutions} icon={Globe} color="primary" staggerClass="stagger-1" />
                <StatCard title="Total Students" value={stats.students} icon={Users} color="info" staggerClass="stagger-2" />
                <StatCard title="Active Exams" value={stats.exams} icon={FileCheck} color="success" staggerClass="stagger-3" />
                <StatCard title="Security Alerts" value={stats.violations} icon={AlertTriangle} color="danger" staggerClass="stagger-4" />
            </div>

            {/* Recent Activity */}
            <div className="card glass-panel border-0 shadow-lg animate-slide-up stagger-4">
                <div className="card-header bg-transparent border-0 py-3 d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold mb-0 d-flex align-items-center gap-2 text-white">
                        <Activity size={20} className="text-primary" /> Recent Activity
                    </h5>
                    <button className="btn btn-sm btn-outline-light btn-hover-scale">View All</button>
                </div>
                <div className="card-body p-0">
                    <div className="list-group list-group-flush">
                        {recentLogs.length === 0 ? (
                            <div className="text-center p-5 text-white-50">
                                <Activity size={48} className="mb-3 opacity-25" />
                                <p>No recent activity recorded.</p>
                            </div>
                        ) : (
                            recentLogs.map((log, i) => (
                                <div key={i} className="list-group-item px-4 py-3 bg-transparent border-secondary border-opacity-10 d-flex align-items-center justify-content-between hover-bg-light-10 transition-all">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className={`rounded-circle p-2 bg-danger bg-opacity-10 text-danger`}>
                                            <AlertTriangle size={16} />
                                        </div>
                                        <div>
                                            <p className="mb-0 fw-medium text-white">{log.action}</p>
                                            <small className="text-white-50">
                                                User: <span className="fw-semibold">{log.studentId?.name || 'Unknown'}</span> &bull;
                                                Exam: <span className="fw-semibold">{log.examId?.title || 'Unknown'}</span>
                                            </small>
                                        </div>
                                    </div>
                                    <small className="text-white-50 text-nowrap">
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </small>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
