import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ShieldCheck, User, Building, ArrowRight, Loader2, Lock, CheckCircle } from 'lucide-react';
import API_BASE_URL from '../config';

const Register = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [role, setRole] = useState(location.state?.role || 'student');
    const [formData, setFormData] = useState({
        name: '', email: '', password: '',
        institutionId: '', institutionName: '', adminName: ''
    });

    const [institutions, setInstitutions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (role === 'student') {
            axios.get(`${API_BASE_URL}/api/auth/institutions`)
                .then(res => setInstitutions(res.data.institutions))
                .catch(err => console.error(err));
        }
    }, [role]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const endpoint = role === 'student' ? 'register' : 'register-institution';
        try {
            const res = await axios.post(`${API_BASE_URL}/api/auth/${endpoint}`, formData);
            if (res.data.success) {
                if (res.data.isPending) {
                    alert(res.data.message);
                } else {
                    alert("Registration Successful! Please Login.");
                }
                navigate('/login');
            }
        } catch (error) {
            console.error(error);
            alert("Registration Failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 bg-gradient-dark d-flex align-items-center font-sans animate-fade-in">
            <div className="container py-5">
                <div className="row justify-content-center align-items-center g-5">

                    {/* Left Side: Brand/Hero */}
                    <div className="col-lg-6 d-none d-lg-block">
                        <div className="pe-lg-5">
                            <div className="animate-slide-up stagger-1 mb-4">
                                <div className="d-inline-flex align-items-center justify-content-center p-2 rounded logo-cyber-glow shadow-lg">
                                    <img src="/logo.png" alt="Logo" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
                                </div>
                            </div>
                            <h1 className="display-4 fw-bold mb-3 text-white animate-slide-up stagger-2">Join GuardXLens</h1>
                            <p className="lead text-white-50 mb-5 animate-slide-up stagger-3">
                                Advanced Procturing System for Secure & Reliable Online Assessments. Join thousands of students and institutions today.
                            </p>

                            <div className="row g-4">
                                <div className="col-md-6 animate-slide-up stagger-4">
                                    <div className="card h-100 border-0 shadow-lg glass-panel hover-shadow-sm">
                                        <div className="card-body p-4">
                                            <div className="p-2 bg-success bg-opacity-10 text-success rounded-circle d-inline-block mb-3">
                                                <Lock size={24} />
                                            </div>
                                            <h5 className="fw-bold mb-2 text-white">Secure & Private</h5>
                                            <p className="small text-white-50 mb-0">End-to-end encryption for all exam data and personal information.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6 animate-slide-up stagger-4" style={{ animationDelay: '0.45s' }}>
                                    <div className="card h-100 border-0 shadow-lg glass-panel hover-shadow-sm">
                                        <div className="card-body p-4">
                                            <div className="p-2 bg-info bg-opacity-10 text-info rounded-circle d-inline-block mb-3">
                                                <CheckCircle size={24} />
                                            </div>
                                            <h5 className="fw-bold mb-2 text-white">Easy Onboarding</h5>
                                            <p className="small text-white-50 mb-0">Get started in minutes with our intuitive interface and support.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Register Form */}
                    <div className="col-lg-5 animate-slide-up stagger-2">
                        <div className="card glass-panel shadow-lg border-0">
                            <div className="card-body p-4 p-md-5">
                                <div className="text-center mb-4 d-flex flex-column align-items-center">
                                    {/* Unified Branding Header */}
                                    <div className="d-flex align-items-center justify-content-center gap-3 mb-3">
                                        <div className="p-2 rounded-circle logo-cyber-glow shadow d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                                            <img src="/logo.png" alt="Logo" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
                                        </div>
                                        <h2 className="fw-bold text-white mb-0" style={{ letterSpacing: '0.5px' }}>GuardXLens</h2>
                                    </div>
                                    <h3 className="fw-bold mb-1 text-white">Create Account</h3>
                                    <p className="text-white-50 small">Sign up for a new account</p>
                                </div>

                                {/* Role Toggle */}
                                <div className="d-flex bg-white bg-opacity-5 rounded p-1 mb-4 border border-white border-opacity-10">
                                    <button
                                        type="button"
                                        onClick={() => setRole('student')}
                                        className={`btn w-50 border-0 rounded py-2 d-flex align-items-center justify-content-center gap-2 transition-all ${role === 'student' ? 'bg-primary text-white shadow-sm fw-bold' : 'bg-transparent text-primary hover-bg-light-10'}`}
                                    >
                                        <User size={18} /> Student
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole('institution')}
                                        className={`btn w-50 border-0 rounded py-2 d-flex align-items-center justify-content-center gap-2 transition-all ${role === 'institution' ? 'bg-primary text-white shadow-sm fw-bold' : 'bg-transparent text-primary hover-bg-light-10'}`}
                                    >
                                        <Building size={18} /> Institution
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    {role === 'student' ? (
                                        <>
                                            <div className="form-floating mb-3">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-dark"
                                                    id="name"
                                                    name="name"
                                                    placeholder="Full Name"
                                                    onChange={handleChange}
                                                    required
                                                />
                                                <label htmlFor="name" className="text-white-50">Full Name</label>
                                            </div>
                                            <div className="form-floating mb-3">
                                                <select
                                                    className="form-select form-control-dark"
                                                    id="institutionId"
                                                    name="institutionId"
                                                    onChange={handleChange}
                                                    required
                                                >
                                                    <option value="" className="bg-dark">Select Institution</option>
                                                    {institutions.map(i => <option key={i._id} value={i._id} className="bg-dark">{i.name}</option>)}
                                                </select>
                                                <label htmlFor="institutionId" className="text-white-50">Institution</label>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="form-floating mb-3">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-dark"
                                                    id="institutionName"
                                                    name="institutionName"
                                                    placeholder="Institution Name"
                                                    onChange={handleChange}
                                                    required
                                                />
                                                <label htmlFor="institutionName" className="text-white-50">Institution Name</label>
                                            </div>
                                            <div className="form-floating mb-3">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-dark"
                                                    id="adminName"
                                                    name="adminName"
                                                    placeholder="Admin Name"
                                                    onChange={handleChange}
                                                    required
                                                />
                                                <label htmlFor="adminName" className="text-white-50">Admin Name</label>
                                            </div>
                                        </>
                                    )}

                                    <div className="form-floating mb-3">
                                        <input
                                            type="email"
                                            className="form-control form-control-dark"
                                            id="email"
                                            name="email"
                                            placeholder="name@example.com"
                                            onChange={handleChange}
                                            required
                                        />
                                        <label htmlFor="email" className="text-white-50">Email Address</label>
                                    </div>
                                    <div className="form-floating mb-4">
                                        <input
                                            type="password"
                                            className="form-control form-control-dark"
                                            id="password"
                                            name="password"
                                            placeholder="Password"
                                            onChange={handleChange}
                                            required
                                        />
                                        <label htmlFor="password" className="text-white-50">Password</label>
                                    </div>

                                    <button disabled={loading} className="btn btn-primary btn-pulse-neon w-100 py-3 fw-bold rounded d-flex justify-content-center align-items-center gap-2 border-0 shadow-lg">
                                        {loading ? <Loader2 className="spinner-border spinner-border-sm" /> : (
                                            <>Register <ArrowRight size={20} /></>
                                        )}
                                    </button>
                                </form>

                                <div className="text-center mt-4">
                                    <p className="text-white-50 small mb-0">
                                        Already have an account? <Link to="/login" className="text-primary text-decoration-none fw-bold">Sign in</Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
