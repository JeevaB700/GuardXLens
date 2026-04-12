import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Loader2, CheckCircle, BellRing, Info, Lock, Mail, Eye, EyeOff, Zap } from 'lucide-react';
import API_BASE_URL from '../config';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = "GuardXLens | Sign In";
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, formData);
      if (res.data.success) {
        sessionStorage.setItem('token', res.data.token);
        sessionStorage.setItem('user', JSON.stringify(res.data.user));
        if (res.data.user.role === 'admin') navigate('/admin/dashboard');
        else if (res.data.user.role === 'institution') navigate('/institution/dashboard');
        else navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updates = [
    { icon: Zap, color: 'var(--gx-neon)', text: 'AI 2.0: Enhanced face & phone detection now live for all exams.' },
    { icon: CheckCircle, color: '#4ade80', text: 'Configurable camera proctoring toggle per exam for privacy control.' },
    { icon: Info, color: 'var(--gx-cyan)', text: 'Excel report downloads now available for all exam submissions.' },
  ];

  return (
    <div className="min-vh-100 animate-fade-in" style={{ background: 'linear-gradient(135deg, #080c18 0%, #0a0f1e 50%, #080c18 100%)', display: 'flex', alignItems: 'center' }}>

      {/* Ambient glows */}
      <div style={{ position: 'fixed', top: '10%', left: '5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(132,204,22,0.04) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', filter: 'blur(60px)' }} />
      <div style={{ position: 'fixed', bottom: '15%', right: '8%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', filter: 'blur(50px)' }} />

      <div className="container py-5">
        <div className="row justify-content-center align-items-center g-5">

          {/* ===== LEFT PANEL ===== */}
          <div className="col-lg-6 d-none d-lg-flex flex-column gap-4">

            {/* Logo + Title */}
            <div className="animate-slide-up stagger-1">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="logo-cyber-glow p-2 rounded d-flex align-items-center justify-content-center" style={{ width: '56px', height: '56px' }}>
                  <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div>
                <h2 className="glitch-text" data-text="GuardXLens" style={{ fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>GuardXLens</h2>
                  <div className="d-flex align-items-center gap-1 mt-1">
                    <div className="status-dot status-dot-green"></div>
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>All Systems Online</span>
                  </div>
                </div>
              </div>
              <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '16px' }}>
                Welcome <br /><span style={{ color: 'var(--gx-neon)' }}>Back.</span>
              </h1>
              <p style={{ color: 'rgba(226,232,240,0.5)', fontSize: '1rem', lineHeight: 1.7, maxWidth: '400px' }}>
                Securely access your GuardXLens dashboard to manage exams, monitor integrity, and view results.
              </p>
            </div>

            {/* Updates card */}
            <div className="animate-slide-up stagger-3" style={{
              background: 'rgba(10,15,30,0.7)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(132,204,22,0.12)', borderRadius: '16px', padding: '24px',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '80px', background: 'radial-gradient(circle at top right, rgba(132,204,22,0.08), transparent)', borderRadius: '0 16px 0 80px' }} />
              <div className="d-flex align-items-center gap-2 mb-4">
                <BellRing size={16} style={{ color: '#fbbf24' }} />
                <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.9rem' }}>What's New</span>
              </div>
              <div className="d-flex flex-column gap-3">
                {updates.map((u, i) => (
                  <div key={i} className="d-flex align-items-start gap-3">
                    <div style={{ flexShrink: 0, marginTop: '2px' }}>
                      <u.icon size={14} style={{ color: u.color }} />
                    </div>
                    <span style={{ fontSize: '0.82rem', color: 'rgba(226,232,240,0.55)', lineHeight: 1.6 }}>{u.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ===== RIGHT PANEL: FORM ===== */}
          <div className="col-md-10 col-lg-5 animate-slide-up stagger-2">
            <div style={{
              background: 'rgba(8,12,24,0.85)', backdropFilter: 'blur(30px)',
              border: '1px solid rgba(132,204,22,0.15)', borderRadius: '24px',
              padding: 'clamp(28px, 5vw, 48px)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05)',
              position: 'relative', overflow: 'hidden',
            }}>

              {/* Holographic sweep */}
              <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'linear-gradient(to bottom, transparent, rgba(132,204,22,0.02) 50%, transparent)', transform: 'rotate(30deg)', animation: 'holoSweep 8s linear infinite', pointerEvents: 'none' }} />

              {/* Form header */}
              <div className="text-center mb-5" style={{ position: 'relative' }}>
                <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
                  <div className="logo-cyber-glow d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px', borderRadius: '12px', padding: '8px' }}>
                    <img src="/logo.png" alt="" style={{ width: '100%', objectFit: 'contain' }} />
                  </div>
                  <span className="glitch-text" data-text="GuardXLens" style={{ fontWeight: 800, color: '#f8fafc', fontSize: '1.2rem' }}>GuardXLens</span>
                </div>
                <h2 style={{ fontWeight: 800, color: '#f8fafc', marginBottom: '6px', letterSpacing: '-0.02em' }}>Sign In</h2>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>Access your secure portal</p>
              </div>

              {/* Error alert */}
              {error && (
                <div className="animate-slide-down mb-4 d-flex align-items-center gap-2 p-3 rounded-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '0.85rem' }}>
                  <Info size={14} style={{ flexShrink: 0 }} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>

                {/* Email field */}
                <div className="mb-3">
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: '8px', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block' }}>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                    <input
                      type="email" name="email" id="email"
                      value={formData.email} onChange={handleChange}
                      placeholder="name@example.com" required
                      style={{
                        width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px', padding: '13px 14px 13px 42px', color: '#f1f5f9', fontSize: '0.9rem',
                        outline: 'none', transition: 'all 0.3s ease',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(132,204,22,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(132,204,22,0.1)'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>

                {/* Password field */}
                <div className="mb-4">
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: '8px', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
                    <input
                      type={showPw ? 'text' : 'password'} name="password" id="password"
                      value={formData.password} onChange={handleChange}
                      placeholder="Enter your password" required
                      style={{
                        width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px', padding: '13px 44px 13px 42px', color: '#f1f5f9', fontSize: '0.9rem',
                        outline: 'none', transition: 'all 0.3s ease',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(132,204,22,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(132,204,22,0.1)'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: '4px', transition: 'color 0.2s ease' }}
                      onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Forgot password */}
                <div className="d-flex justify-content-end mb-5">
                  <Link to="/forgot-password" style={{ fontSize: '0.82rem', color: 'var(--gx-neon)', textDecoration: 'none', fontWeight: 600 }}>Forgot password?</Link>
                </div>

                {/* Submit */}
                <button
                  type="submit" disabled={loading}
                  className="btn btn-primary w-100 fw-bold d-flex justify-content-center align-items-center gap-2"
                  style={{ borderRadius: '12px', padding: '14px', fontSize: '0.95rem', letterSpacing: '0.02em', boxShadow: '0 8px 30px rgba(132,204,22,0.35)' }}
                >
                  {loading ? (
                    <>
                      <div className="spinner-border spinner-border-sm" role="status" style={{ width: '16px', height: '16px', borderWidth: '2px', borderColor: 'rgba(0,0,0,0.3)', borderTopColor: '#000' }}></div>
                      Signing In...
                    </>
                  ) : (
                    <>Sign In <ArrowRight size={18} /></>
                  )}
                </button>
              </form>

              <div className="text-center mt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px' }}>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', margin: 0 }}>
                  Don't have an account?{' '}
                  <Link to="/register" style={{ color: 'var(--gx-neon)', textDecoration: 'none', fontWeight: 700 }}>Create Account</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
