import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { User, Building, ArrowRight, Lock, Mail, Eye, EyeOff, ShieldCheck, Zap, CheckCircle, AlertCircle, Info } from 'lucide-react';
import API_BASE_URL from '../config';

const InputField = ({ label, icon: Icon, type = 'text', name, placeholder, onChange, required = true, children }) => (
    <div className="mb-3">
        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: '7px', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block' }}>{label}</label>
        <div style={{ position: 'relative' }}>
            {Icon && <Icon size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.22)', pointerEvents: 'none', zIndex: 1 }} />}
            {children || (
                <input
                    type={type} name={name} placeholder={placeholder} onChange={onChange} required={required}
                    style={{
                        width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                        borderRadius: '11px', padding: `11px 13px 11px ${Icon ? '38px' : '13px'}`, color: '#f1f5f9', fontSize: '0.875rem',
                        outline: 'none', transition: 'all 0.3s ease',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(132,204,22,0.45)'; e.target.style.boxShadow = '0 0 0 3px rgba(132,204,22,0.08)'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
                />
            )}
        </div>
    </div>
);

const Register = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [role, setRole] = useState(location.state?.role || 'student');
    const [formData, setFormData] = useState({ name: '', email: '', password: '', institutionId: '', institutionName: '', adminName: '' });
    const [institutions, setInstitutions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        document.title = 'GuardXLens | Create Account';
        if (role === 'student') {
            axios.get(`${API_BASE_URL}/api/auth/institutions`)
                .then(res => setInstitutions(res.data.institutions))
                .catch(err => console.error(err));
        }
    }, [role]);

    const handleChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); setError(''); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const endpoint = role === 'student' ? 'register' : 'register-institution';
        try {
            const res = await axios.post(`${API_BASE_URL}/api/auth/${endpoint}`, formData);
            if (res.data.success) {
                setSuccess(res.data.isPending ? res.data.message : 'Registration successful! Redirecting to login…');
                setTimeout(() => navigate('/login'), 2500);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally { setLoading(false); }
    };

    const featureList = [
        { icon: ShieldCheck, color: 'var(--gx-neon)', text: 'AI-powered proctoring with face & phone detection' },
        { icon: Zap, color: '#06b6d4', text: 'Instant exam creation with Gemini AI question generation' },
        { icon: CheckCircle, color: '#a78bfa', text: 'Real-time malpractice logs with 3-warning system' },
    ];

    return (
        <div className="min-vh-100 animate-fade-in" style={{ background: 'linear-gradient(135deg, #080c18 0%, #0a0f1e 50%, #080c18 100%)', display: 'flex', alignItems: 'center' }}>

            {/* Ambient glows */}
            <div style={{ position: 'fixed', top: '15%', right: '5%', width: '350px', height: '350px', background: 'radial-gradient(circle, rgba(132,204,22,0.04), transparent 70%)', borderRadius: '50%', pointerEvents: 'none', filter: 'blur(50px)' }} />
            <div style={{ position: 'fixed', bottom: '10%', left: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(139,92,246,0.04), transparent 70%)', borderRadius: '50%', pointerEvents: 'none', filter: 'blur(50px)' }} />

            <div className="container py-5">
                <div className="row justify-content-center align-items-center g-5">

                    {/* ===== LEFT PANEL ===== */}
                    <div className="col-lg-6 d-none d-lg-flex flex-column gap-4">
                        <div className="animate-slide-up stagger-1">
                            <div className="d-flex align-items-center gap-3 mb-4">
                                <div className="logo-cyber-glow p-2 rounded d-flex align-items-center justify-content-center" style={{ width: '54px', height: '54px' }}>
                                    <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                                <div>
                                    <h2 style={{ fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>GuardXLens</h2>
                                    <div className="d-flex align-items-center gap-1 mt-1">
                                        <div className="status-dot status-dot-green"></div>
                                        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Secure Platform</span>
                                    </div>
                                </div>
                            </div>
                            <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '16px' }}>
                                Join the <br /><span style={{ color: 'var(--gx-neon)' }}>Future</span> of Exams.
                            </h1>
                            <p style={{ color: 'rgba(226,232,240,0.5)', fontSize: '1rem', lineHeight: 1.7, maxWidth: '400px' }}>
                                AI-powered proctoring, watermark-based mobile blocking, and real-time malpractice detection — all in one platform.
                            </p>
                        </div>

                        {/* Feature list */}
                        <div className="animate-slide-up stagger-3 d-flex flex-column gap-3">
                            {featureList.map((f, i) => (
                                <div key={i} className="d-flex align-items-start gap-3 p-3 rounded-3" style={{
                                    background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
                                    transition: 'all 0.3s ease',
                                }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: `${f.color}15`, border: `1px solid ${f.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <f.icon size={15} style={{ color: f.color }} />
                                    </div>
                                    <span style={{ fontSize: '0.85rem', color: 'rgba(226,232,240,0.55)', lineHeight: 1.6, paddingTop: '6px' }}>{f.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ===== RIGHT PANEL: FORM ===== */}
                    <div className="col-md-10 col-lg-5 animate-slide-up stagger-2">
                        <div style={{
                            background: 'rgba(8,12,24,0.88)', backdropFilter: 'blur(30px)',
                            border: '1px solid rgba(132,204,22,0.13)', borderRadius: '24px',
                            padding: 'clamp(24px, 4vw, 40px)',
                            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05)',
                            position: 'relative', overflow: 'hidden',
                        }}>

                            {/* Sweep */}
                            <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'linear-gradient(to bottom, transparent, rgba(132,204,22,0.015) 50%, transparent)', transform: 'rotate(25deg)', animation: 'holoSweep 10s linear infinite', pointerEvents: 'none' }} />

                            {/* Header */}
                            <div className="text-center mb-4" style={{ position: 'relative' }}>
                                <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
                                    <div className="logo-cyber-glow d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', borderRadius: '10px', padding: '7px' }}>
                                        <img src="/logo.png" alt="" style={{ width: '100%', objectFit: 'contain' }} />
                                    </div>
                                    <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1.1rem' }}>GuardXLens</span>
                                </div>
                                <h2 style={{ fontWeight: 800, color: '#f8fafc', marginBottom: '4px', letterSpacing: '-0.02em' }}>Create Account</h2>
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem' }}>Register as a student or institution</p>
                            </div>

                            {/* Role Toggle */}
                            <div className="mb-4 p-1 rounded-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '4px' }}>
                                {[
                                    { key: 'student', icon: User, label: 'Student' },
                                    { key: 'institution', icon: Building, label: 'Institution' },
                                ].map(r => (
                                    <button
                                        key={r.key} type="button"
                                        onClick={() => { setRole(r.key); setError(''); }}
                                        style={{
                                            flex: 1, border: 'none', borderRadius: '9px', padding: '10px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                                            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.3s ease',
                                            background: role === r.key ? 'linear-gradient(135deg, var(--gx-neon), #a3e635)' : 'transparent',
                                            color: role === r.key ? '#050a00' : 'rgba(255,255,255,0.4)',
                                            boxShadow: role === r.key ? '0 4px 14px rgba(132,204,22,0.3)' : 'none',
                                        }}
                                    >
                                        <r.icon size={15} /> {r.label}
                                    </button>
                                ))}
                            </div>

                            {/* Alerts */}
                            {error && (
                                <div className="animate-slide-down mb-3 d-flex align-items-start gap-2 p-3 rounded-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '0.82rem' }}>
                                    <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} /> {error}
                                </div>
                            )}
                            {success && (
                                <div className="animate-slide-down mb-3 d-flex align-items-start gap-2 p-3 rounded-3" style={{ background: 'rgba(132,204,22,0.08)', border: '1px solid rgba(132,204,22,0.25)', color: 'var(--gx-neon)', fontSize: '0.82rem' }}>
                                    <CheckCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} /> {success}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                {role === 'student' ? (
                                    <>
                                        <InputField label="Full Name" icon={User} name="name" placeholder="Your full name" onChange={handleChange} />
                                        <div className="mb-3">
                                            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: '7px', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block' }}>Institution</label>
                                            <select
                                                name="institutionId" onChange={handleChange} required
                                                style={{
                                                    width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                                                    borderRadius: '11px', padding: '11px 13px', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none', transition: 'all 0.3s ease',
                                                }}
                                                onFocus={e => { e.target.style.borderColor = 'rgba(132,204,22,0.45)'; e.target.style.boxShadow = '0 0 0 3px rgba(132,204,22,0.08)'; }}
                                                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none'; }}
                                            >
                                                <option value="" style={{ background: '#0a0f1e' }}>— Select your institution —</option>
                                                {institutions.map(i => <option key={i._id} value={i._id} style={{ background: '#0a0f1e' }}>{i.name}</option>)}
                                            </select>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <InputField label="Institution Name" icon={Building} name="institutionName" placeholder="Your college or organization" onChange={handleChange} />
                                        <InputField label="Admin / Contact Name" icon={User} name="adminName" placeholder="Primary contact name" onChange={handleChange} />
                                        <div className="mb-3 p-3 rounded-3 d-flex align-items-start gap-2" style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)' }}>
                                            <Info size={13} style={{ color: '#06b6d4', flexShrink: 0, marginTop: '2px' }} />
                                            <p style={{ color: 'rgba(6,182,212,0.8)', fontSize: '0.75rem', margin: 0, lineHeight: 1.6 }}>
                                                Institution accounts require admin approval via email before activation.
                                            </p>
                                        </div>
                                    </>
                                )}

                                <InputField label="Email Address" icon={Mail} type="email" name="email" placeholder="name@example.com" onChange={handleChange} />

                                {/* Password with toggle */}
                                <div className="mb-4">
                                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: '7px', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block' }}>Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.22)', pointerEvents: 'none' }} />
                                        <input
                                            type={showPw ? 'text' : 'password'} name="password" placeholder="Create a strong password" onChange={handleChange} required
                                            style={{
                                                width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                                                borderRadius: '11px', padding: '11px 40px 11px 38px', color: '#f1f5f9', fontSize: '0.875rem',
                                                outline: 'none', transition: 'all 0.3s ease',
                                            }}
                                            onFocus={e => { e.target.style.borderColor = 'rgba(132,204,22,0.45)'; e.target.style.boxShadow = '0 0 0 3px rgba(132,204,22,0.08)'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
                                            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
                                        />
                                        <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: '4px', transition: 'color 0.2s' }}
                                            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
                                        >
                                            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit" disabled={loading || !!success}
                                    className="btn btn-primary w-100 fw-bold d-flex justify-content-center align-items-center gap-2"
                                    style={{ borderRadius: '12px', padding: '13px', fontSize: '0.92rem', letterSpacing: '0.02em', boxShadow: '0 8px 30px rgba(132,204,22,0.3)' }}
                                >
                                    {loading ? (
                                        <><div className="spinner-border spinner-border-sm" role="status" style={{ width: '15px', height: '15px', borderWidth: '2px', borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000' }}></div> Creating Account…</>
                                    ) : (
                                        <>Create Account <ArrowRight size={17} /></>
                                    )}
                                </button>
                            </form>

                            <div className="text-center mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem', margin: 0 }}>
                                    Already have an account?{' '}
                                    <Link to="/login" style={{ color: 'var(--gx-neon)', textDecoration: 'none', fontWeight: 700 }}>Sign In</Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
