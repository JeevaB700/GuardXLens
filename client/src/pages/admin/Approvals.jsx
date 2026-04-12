import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Building, 
    Calendar, 
    Mail, 
    User, 
    ShieldCheck, 
    XCircle, 
    CheckCircle, 
    Clock, 
    Eye,
    Search,
    RefreshCw,
    X,
    ExternalLink
} from 'lucide-react';
import API_BASE_URL from '../../config';

const Approvals = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const res = await axios.get(`${API_BASE_URL}/api/admin/pending-institutions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setRequests(res.data.requests);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action, id) => {
        setProcessing(true);
        try {
            const token = sessionStorage.getItem('token');
            const endpoint = action === 'approve' ? 'approve-institution' : 'reject-institution';
            const res = await axios.post(`${API_BASE_URL}/api/admin/${endpoint}`, { id }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setSelectedRequest(null);
                fetchRequests();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed');
        } finally {
            setProcessing(false);
        }
    };

    const filteredRequests = requests.filter(req => 
        req.institutionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container-fluid p-4 animate-fade-in">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h2 className="glitch-text mb-1" data-text="Institution Approvals">Institution Approvals</h2>
                    <p className="text-secondary small mb-0">Manage and verify new institution registration requests.</p>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <div className="position-relative">
                        <Search size={16} className="position-absolute top-50 translate-middle-y ms-3 text-secondary" />
                        <input 
                            type="text" 
                            className="form-control bg-dark border-white border-opacity-10 text-white ps-5" 
                            placeholder="Search requests..."
                            style={{ borderRadius: '10px', fontSize: '0.9rem', width: '250px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={fetchRequests} className="btn btn-dark border border-white border-opacity-10 rounded-3">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="d-flex justify-content-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="glass-panel text-center py-5 rounded-4 border border-white border-opacity-10">
                    <Building size={48} className="text-secondary opacity-25 mb-3" />
                    <h5 className="text-white opacity-50">No pending requests found</h5>
                    <p className="text-secondary small">New registration requests will appear here for review.</p>
                </div>
            ) : (
                <div className="row g-3">
                    {filteredRequests.map(req => (
                        <div key={req._id} className="col-12">
                            <div className="stat-card-premium rounded-4 border border-white border-opacity-10 p-3 hover-lift">
                                <div className="row align-items-center">
                                    <div className="col-md-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="p-2 rounded-3" style={{ background: 'rgba(132, 204, 22, 0.1)', border: '1px solid rgba(132, 204, 22, 0.2)' }}>
                                                <Building size={20} style={{ color: 'var(--gx-neon)' }} />
                                            </div>
                                            <div>
                                                <h6 className="text-white mb-0 text-truncate" style={{ maxWidth: '200px' }}>{req.institutionName}</h6>
                                                <span className="text-secondary small d-flex align-items-center gap-1">
                                                    <Calendar size={12} /> {new Date(req.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="small text-secondary mb-1">Admin Contact</div>
                                        <div className="text-white d-flex align-items-center gap-2 small">
                                            <User size={14} className="text-secondary" /> {req.adminName}
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="small text-secondary mb-1">Official Email</div>
                                        <div className="text-white d-flex align-items-center gap-2 small">
                                            <Mail size={14} className="text-secondary" /> {req.email}
                                        </div>
                                    </div>
                                    <div className="col-md-3 text-md-end mt-3 mt-md-0">
                                        <button 
                                            onClick={() => setSelectedRequest(req)}
                                            className="btn btn-primary btn-sm rounded-3 px-3 d-inline-flex align-items-center gap-2"
                                        >
                                            <Eye size={14} /> Review Request
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* REVIEW MODAL */}
            {selectedRequest && (
                <div className="modal-overlay d-flex align-items-center justify-content-center">
                    <div 
                        className="glass-panel rounded-4 border border-white border-opacity-10 p-0 overflow-hidden animate-scale-up"
                        style={{ width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                    >
                        <div className="p-4 border-bottom border-white border-opacity-10 d-flex justify-content-between align-items-center">
                            <h5 className="text-white mb-0 d-flex align-items-center gap-2">
                                <ShieldCheck size={20} className="text-primary" /> Review Application
                            </h5>
                            <button onClick={() => setSelectedRequest(null)} className="btn btn-link text-secondary p-0">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-4">
                            <div className="mb-4 text-center">
                                <div className="p-3 rounded-circle d-inline-flex mb-3" style={{ background: 'rgba(132, 204, 22, 0.1)', border: '1px solid rgba(132, 204, 22, 0.2)' }}>
                                    <Building size={32} style={{ color: 'var(--gx-neon)' }} />
                                </div>
                                <h4 className="text-white mb-1">{selectedRequest.institutionName}</h4>
                                <div className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 py-1 px-2">
                                    <Clock size={12} className="me-1" /> Pending Verification
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="p-4 rounded-4" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                    <div className="small text-secondary mb-3 uppercase tracking-wider fw-bold" style={{ fontSize: '0.7rem' }}>Registration Details</div>
                                    <div className="d-flex flex-column gap-3">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="text-secondary small">Institution Name</span>
                                            <span className="text-white small fw-bold text-end ms-2">{selectedRequest.institutionName}</span>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="text-secondary small">Admin Name</span>
                                            <span className="text-white small fw-bold text-end ms-2">{selectedRequest.adminName}</span>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="text-secondary small">Email Address</span>
                                            <span className="text-white small fw-bold text-end ms-2">{selectedRequest.email}</span>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="text-secondary small">Submission Date</span>
                                            <span className="text-white small fw-bold text-end ms-2">{new Date(selectedRequest.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="d-grid grid-cols-2 gap-3 mt-4">
                                <button 
                                    className="btn btn-outline-danger rounded-3 d-flex align-items-center justify-content-center gap-2"
                                    onClick={() => handleAction('reject', selectedRequest._id)}
                                    disabled={processing}
                                >
                                    <XCircle size={16} /> Reject
                                </button>
                                <button 
                                    className="btn btn-primary rounded-3 d-flex align-items-center justify-content-center gap-2"
                                    onClick={() => handleAction('approve', selectedRequest._id)}
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <div className="spinner-border spinner-border-sm" />
                                    ) : (
                                        <><CheckCircle size={16} /> Approve Access</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(8px);
                    z-index: 1050;
                }
                .grid-cols-2 {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default Approvals;
