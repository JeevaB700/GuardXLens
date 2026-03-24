import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, FileCheck, AlertTriangle, Globe, Activity, Search, X } from 'lucide-react';
import API_BASE_URL from '../../config';

const DashboardHome = () => {
    const [stats, setStats] = useState({ students: 0, exams: 0, institutions: 0, violations: 0 });
    const [recentLogs, setRecentLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const fetchStats = async (search = "") => {
        try {
            const token = sessionStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            // If searching, we only care about logs
            if (search) {
                setIsSearching(true);
                const res = await axios.get(`${API_BASE_URL}/api/admin/logs?search=${search}`, config);
                setRecentLogs(res.data.logs || []);
                setIsSearching(false);
                return;
            }

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
            setRecentLogs(logsRes.data.logs?.slice(0, 10) || []);
        } catch (e) {
            console.error("Error fetching stats:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    // Debounced Search Effect
    useEffect(() => {
        if (searchTerm === "") {
            // If search is cleared, fetch initial stats/recent logs
            const delayDebounceFn = setTimeout(() => {
                fetchStats();
            }, 300);
            return () => clearTimeout(delayDebounceFn);
        } else {
            const delayDebounceFn = setTimeout(() => {
                fetchStats(searchTerm);
            }, 500); // 500ms debounce for typing
            return () => clearTimeout(delayDebounceFn);
        }
    }, [searchTerm]);

    if (loading) {
        return (
            <div className="vh-100 d-flex justify-content-center align-items-center bg-gradient-dark" data-bs-theme="dark">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    const StatCard = ({ title, value, icon: Icon, color, staggerClass }) => (
        <div className={`col-md-6 col-xl-3 ${staggerClass}`}>
            <div className="card glass-panel border-0 shadow-lg h-100 animate-slide-up hover-shadow-sm transition-all hover-lift">
                <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                        <div className={`p-3 rounded-circle bg-${color} bg-opacity-10 text-${color} me-3 shadow-sm`}>
                            <Icon size={24} />
                        </div>
                        <div>
                            <h6 className="card-subtitle text-white-50 mb-1 small text-uppercase tracking-wider">{title}</h6>
                            <h3 className="card-title fw-bold mb-0 text-white lh-1">{value}</h3>
                        </div>
                    </div>
                </div>
                <div className="card-footer bg-transparent border-0 pt-0 pb-3">
                    <div className="progress overflow-visible bg-white bg-opacity-5" style={{ height: '4px' }}>
                        <div className={`progress-bar bg-${color} rounded-pill shadow-sm`} style={{ width: '45%' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="container-fluid p-4 animate-fade-in bg-gradient-dark min-vh-100 overflow-hidden" data-bs-theme="dark">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                    <h1 className="h2 fw-bold mb-1 text-white">Dashboard Overview</h1>
                    <p className="text-white-50 mb-0">Monitor global system activity and security health.</p>
                </div>
                <div className="d-none d-md-flex align-items-center gap-2">
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill shadow-sm">
                        <span className="d-inline-block bg-success rounded-circle me-2 animate-pulse" style={{ width: 8, height: 8 }}></span>
                        System Online
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="row g-4 mb-5">
                <StatCard title="Institutions" value={stats.institutions} icon={Globe} color="primary" staggerClass="stagger-1" />
                <StatCard title="Total Students" value={stats.students} icon={Users} color="info" staggerClass="stagger-2" />
                <StatCard title="Active Exams" value={stats.exams} icon={FileCheck} color="success" staggerClass="stagger-3" />
                <StatCard title="Security Alerts" value={stats.violations} icon={AlertTriangle} color="danger" staggerClass="stagger-4" />
            </div>

            {/* Recent Activity Section */}
            <div className="card glass-panel border-0 shadow-lg animate-slide-up stagger-4 overflow-hidden">
                <div className="card-header bg-transparent border-bottom border-white border-opacity-10 py-4 px-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                    <h5 className="fw-bold mb-0 d-flex align-items-center gap-2 text-white">
                        <Activity size={20} className="text-primary" /> 
                        {searchTerm ? 'Search Results' : 'Recent System Activity'}
                    </h5>
                    
                    {/* SEARCH INPUT */}
                    <div className="position-relative" style={{ minWidth: '300px' }}>
                        <div className="input-group input-group-sm">
                            <span className="input-group-text bg-dark bg-opacity-50 border-white border-opacity-10 text-white-50 ps-3 pe-2">
                                <Search size={16} />
                            </span>
                            <input 
                                type="text" 
                                className="form-control form-control-dark font-sans shadow-none py-2 px-3 border-white border-opacity-10" 
                                placeholder="Search student name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button 
                                    className="btn btn-dark border-white border-opacity-10 bg-opacity-50 text-white-50 px-2"
                                    onClick={() => setSearchTerm("")}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        {isSearching && (
                            <div className="position-absolute end-0 top-100 mt-1 z-3">
                                <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="card-body p-0">
                    <div className="list-group list-group-flush bg-transparent">
                        {recentLogs.length === 0 ? (
                            <div className="text-center py-5 text-white-50">
                                <AlertTriangle size={48} className="mb-3 opacity-25" />
                                <p className="mb-0">No activity logs found {searchTerm && `matching "${searchTerm}"`}.</p>
                            </div>
                        ) : (
                            recentLogs.map((log, i) => (
                                <div key={i} className="list-group-item px-4 py-3 bg-transparent border-white border-opacity-5 d-flex align-items-center justify-content-between hover-bg-light-5 transition-all animate-fade-in">
                                    <div className="d-flex align-items-center gap-3 overflow-hidden">
                                        <div className={`p-2 rounded-3 bg-danger bg-opacity-10 text-danger border border-danger border-opacity-10`}>
                                            <AlertTriangle size={18} />
                                        </div>
                                        <div className="text-truncate">
                                            <p className="mb-0 fw-bold text-white fs-6">{log.action}</p>
                                            <div className="d-flex align-items-center gap-2 text-white-50 small text-truncate">
                                                <span className="fw-semibold text-primary">{log.studentId?.name || 'Anonymous User'}</span>
                                                <span className="opacity-25">&bull;</span>
                                                <span className="text-truncate">{log.examId?.title || 'Unknown Exam'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-end ms-3 flex-shrink-0">
                                        <div className="text-white small fw-bold">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        <div className="text-white-50" style={{ fontSize: '0.65rem' }}>{new Date(log.timestamp).toLocaleDateString()}</div>
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

export default DashboardHome;
