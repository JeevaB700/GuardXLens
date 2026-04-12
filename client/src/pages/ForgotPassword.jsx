import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, ShieldQuestion, AlertCircle, Send } from 'lucide-react';
import API_BASE_URL from '../config';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    React.useEffect(() => {
        document.title = 'GuardXLens | Reset Password';
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
            if (res.data.success) setSent(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally { setLoading(false); }
    };

    return (
        <div className="min-vh-100 animate-fade-in d-flex align-items-center justify-content-center" style={{ background: 'linear-gradient(135deg, #080c18 0%, #0a0f1e 50%, #080c18 100%)', padding: '2rem 1rem' }}>

            {/* Ambient glow */}
            <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '500px', height: '300px', background: 'radial-gradient(ellipse, rgba(132,204,22,0.04), transparent 70%)', borderRadius: '50%', pointerEvents: 'none', filter: 'blur(50px)' }} />

            <div className="animate-slide-up" style={{ width: '100%', maxWidth: '440px' }}>
                <div style={{
                    background: 'rgba(8,12,24,0.88)', backdropFilter: 'blur(30px)',
                    border: '1px solid rgba(132,204,22,0.13)', borderRadius: '24px',
                    padding: 'clamp(28px, 5vw, 48px)',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
                    position: 'relative', overflow: 'hidden',
                }}>
                    {/* Holographic sweep */}
                    <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'linear-gradient(to bottom, transparent, rgba(132,204,22,0.015) 50%, transparent)', transform: 'rotate(25deg)', animation: 'holoSweep 10s linear infinite', pointerEvents: 'none' }} />

                    {sent ? (
                        /* ===== SUCCESS STATE ===== */
                        <div className="text-center animate-scale-in" style={{ position: 'relative' }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                background: 'rgba(132,204,22,0.1)', border: '1px solid rgba(132,204,22,0.3)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 24px',
                                boxShadow: '0 0 40px rgba(132,204,22,0.15)',
                                animation: 'neonPulse 2.5s ease-in-out infinite',
                            }}>
                                <CheckCircle size={36} style={{ color: 'var(--gx-neon)' }} />
                            </div>

                            <h2 style={{ fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', marginBottom: '10px' }}>Email Sent!</h2>
                            <p style={{ color: 'rgba(226,232,240,0.5)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '8px' }}>
                                Password recovery instructions have been sent to
                            </p>
                            <div className="mb-5 py-2 px-3 d-inline-block rounded-3" style={{ background: 'rgba(132,204,22,0.08)', border: '1px solid rgba(132,204,22,0.2)' }}>
                                <span style={{ color: 'var(--gx-neon)', fontWeight: 700, fontSize: '0.9rem' }}>{email}</span>
                            </div>

                            <p style={{ color: 'rgba(226,232,240,0.35)', fontSize: '0.78rem', marginBottom: '24px', lineHeight: 1.6 }}>
                                Didn't receive it? Check your spam folder or wait a few minutes before trying again.
                            </p>

                            <Link
                                to="/login"
                                className="btn btn-primary w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
                                style={{ borderRadius: '12px', padding: '13px', fontSize: '0.92rem', boxShadow: '0 8px 30px rgba(132,204,22,0.3)' }}
                            >
                                <ArrowLeft size={17} /> Back to Sign In
                            </Link>
                        </div>
                    ) : (
                        /* ===== FORM STATE ===== */
                        <div style={{ position: 'relative' }}>
                            {/* Header */}
                            <div className="text-center mb-5">
                                <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
                                    <div className="logo-cyber-glow d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', borderRadius: '10px', padding: '7px' }}>
                                        <img src="/logo.png" alt="" style={{ width: '100%', objectFit: 'contain' }} />
                                    </div>
                                    <span className="glitch-text" data-text="GuardXLens" style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1.1rem' }}>GuardXLens</span>
                                </div>
                                <div style={{
                                    width: '64px', height: '64px', borderRadius: '18px', margin: '0 auto 20px',
                                    background: 'rgba(132,204,22,0.08)', border: '1px solid rgba(132,204,22,0.2)',
                                    display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center'
                                }}>
                                    <ShieldQuestion size={28} style={{ color: 'var(--gx-neon)' }} />
                                </div>
                                <h2 style={{ fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em', marginBottom: '8px' }}>Forgot Password?</h2>
                                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', margin: 0 }}>
                                    Enter your email and we'll send recovery instructions.
                                </p>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="animate-slide-down mb-4 d-flex align-items-center gap-2 p-3 rounded-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '0.82rem' }}>
                                    <AlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                {/* Email */}
                                <div className="mb-5">
                                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: '8px', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block' }}>Email Address</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                                        <input
                                            type="email" value={email}
                                            onChange={e => { setEmail(e.target.value); setError(''); }}
                                            placeholder="name@example.com" required
                                            style={{
                                                width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '12px', padding: '13px 14px 13px 42px', color: '#f1f5f9', fontSize: '0.9rem',
                                                outline: 'none', transition: 'all 0.3s ease',
                                            }}
                                            onFocus={e => { e.target.style.borderColor = 'rgba(132,204,22,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(132,204,22,0.1)'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
                                            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit" disabled={loading}
                                    className="btn btn-primary w-100 fw-bold d-flex align-items-center justify-content-center gap-2 mb-4"
                                    style={{ borderRadius: '12px', padding: '14px', fontSize: '0.92rem', boxShadow: '0 8px 30px rgba(132,204,22,0.3)' }}
                                >
                                    {loading ? (
                                        <><div className="spinner-border spinner-border-sm" role="status" style={{ width: '15px', height: '15px', borderWidth: '2px', borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000' }}></div> Sending…</>
                                    ) : (
                                        <><Send size={16} /> Send Recovery Email</>
                                    )}
                                </button>

                                <div className="text-center">
                                    <Link
                                        to="/login"
                                        className="d-inline-flex align-items-center gap-2 text-decoration-none transition-all"
                                        style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.83rem', fontWeight: 500 }}
                                        onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                                    >
                                        <ArrowLeft size={14} /> Back to Sign In
                                    </Link>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
