import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Lock, Cpu, Eye, CheckCircle, Zap, Shield, BarChart3, Code2, Globe, Star } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = "GuardXLens | AI-Powered Secure Exam Platform";
  }, []);

  const features = [
    {
      icon: Lock,
      color: 'primary',
      iconColor: 'var(--gx-neon)',
      title: 'Browser Lockdown',
      desc: 'Full-screen enforcement, tab-switch detection, keyboard shortcut blocking, and copy-paste prevention with real-time malpractice logging.',
      delay: 1,
    },
    {
      icon: Cpu,
      color: 'cyan',
      iconColor: 'var(--gx-cyan)',
      title: 'AI Question Generator',
      desc: 'Upload lecture notes (PDF/DOCX) and let our Gemini AI engine instantly generate MCQs, short answers, and coding problems.',
      delay: 2,
    },
    {
      icon: Eye,
      color: 'purple',
      iconColor: '#a78bfa',
      title: 'Live AI Proctoring',
      desc: 'Real-time face detection, multi-person alerts, mobile phone detection, and gaze tracking powered by a custom YOLO model.',
      delay: 3,
    },
    {
      icon: Shield,
      color: 'warning',
      iconColor: '#fbbf24',
      title: 'Watermark Security',
      desc: 'A persistent, visible Security Beacon watermark overlays every exam screen — blocking AI photo cheating via mobile cameras.',
      delay: 4,
    },
    {
      icon: Code2,
      color: 'danger',
      iconColor: '#f87171',
      title: 'Live Code Execution',
      desc: 'Built-in Monaco editor with multi-language support. Run and test code against AI-generated test cases in real time.',
      delay: 5,
    },
    {
      icon: BarChart3,
      color: 'success',
      iconColor: '#4ade80',
      title: 'Detailed Analytics',
      desc: 'Per-exam and per-student analytics with Excel export, malpractice logs, and AI-generated performance insights.',
      delay: 6,
    },
  ];

  const stats = [
    { value: 'AI', label: 'Face Tracking' },
    { value: 'Live', label: 'Security Logging' },
    { value: '3', label: 'Warning System' },
    { value: 'Real-Time', label: 'Detection Speed' },
  ];

  return (
    <div className="d-flex flex-column min-vh-100 text-white font-sans" style={{ background: 'linear-gradient(135deg, #080c18 0%, #0a0f1e 40%, #080c18 100%)' }}>

      {/* ============ NAVBAR ============ */}
      <nav className="navbar navbar-expand-md navbar-dark py-3 sticky-top" style={{
        background: 'rgba(6, 10, 20, 0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(132, 204, 22, 0.12)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)'
      }}>
        <div className="container">
          <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="logo-cyber-glow p-1 rounded d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
              <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span className="h5 mb-0 fw-bold text-white glitch-text" data-text="GuardXLens">GuardXLens</span>
            <span className="badge ms-1" style={{ fontSize: '0.55rem', background: 'rgba(132,204,22,0.15)', color: 'var(--gx-neon)', border: '1px solid rgba(132,204,22,0.3)', letterSpacing: '0.1em' }}>v2.0</span>
          </div>

          <div className="d-flex gap-2 ms-auto align-items-center">
            <button onClick={() => navigate('/login')} className="btn btn-link text-white-50 text-decoration-none fw-medium d-none d-md-block hover-text-white" style={{ fontSize: '0.9rem' }}>
              Login
            </button>
            <button onClick={() => navigate('/register')} className="btn btn-primary btn-hover-scale d-flex align-items-center gap-2 px-4 shadow-lg" style={{ borderRadius: '10px', boxShadow: '0 0 20px rgba(132,204,22,0.3)' }}>
              Get Started <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* ============ HERO SECTION ============ */}
      <header className="container d-flex flex-column align-items-center justify-content-center flex-grow-1 text-center py-5" style={{ paddingTop: '80px !important', paddingBottom: '80px !important' }}>

        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: '15%', left: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(132,204,22,0.05) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '25%', right: '8%', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', filter: 'blur(40px)' }} />

        <div className="row justify-content-center w-100 position-relative">
          <div className="col-lg-9 col-xl-8">

            {/* Badge */}
            <div className="animate-slide-down d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill mb-5" style={{ background: 'rgba(132,204,22,0.08)', border: '1px solid rgba(132,204,22,0.25)', backdropFilter: 'blur(10px)' }}>
              <div className="status-dot status-dot-green"></div>
              <span style={{ color: 'var(--gx-neon)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                AI Proctoring 2.0 — Now Live
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="animate-slide-up fw-black mb-4" style={{ fontSize: 'clamp(2.8rem, 7vw, 5.5rem)', lineHeight: 1.08, letterSpacing: '-0.02em' }}>
              <span className="d-block" style={{ color: '#f8fafc' }}>Secure Exams.</span>
              <span className="d-block neon-glow-text" style={{ color: 'var(--gx-neon)' }}>
                &nbsp;Uncompromised
              </span>
              <span className="d-block" style={{ color: '#f8fafc' }}>Integrity.</span>
            </h1>

            {/* Subtitle */}
            <p className="animate-slide-up stagger-2 lead mb-5 mx-auto" style={{ color: 'rgba(226,232,240,0.65)', maxWidth: '620px', fontSize: '1.15rem', lineHeight: 1.7, animationDelay: '0.15s' }}>
              The world's most advanced AI-powered examination platform.
              Detect malpractice with{' '}
              <span style={{ color: '#f1f5f9', fontWeight: 600 }}>advanced precision</span>{' '}
              using real-time behavioral analysis, watermark-based mobile blocking, and automated audit logs.
            </p>

            {/* CTA Buttons */}
            <div className="animate-slide-up stagger-3 d-flex flex-column flex-sm-row gap-3 justify-content-center mb-6" style={{ animationDelay: '0.25s', marginBottom: '3.5rem' }}>
              <button
                onClick={() => navigate('/register', { state: { role: 'institution' } })}
                className="btn btn-primary btn-lg px-5 py-3 fw-bold d-flex align-items-center justify-content-center gap-2"
                style={{ borderRadius: '12px', fontSize: '1rem', boxShadow: '0 8px 30px rgba(132,204,22,0.4)' }}
              >
                <Globe size={18} />
                Deploy for Institution
              </button>
              <button
                onClick={() => navigate('/login')}
                className="btn btn-lg px-5 py-3 fw-bold d-flex align-items-center justify-content-center gap-2"
                style={{
                  borderRadius: '12px', fontSize: '1rem',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#f8fafc',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 0 20px rgba(255,255,255,0.05)'
                }}
              >
                Student Login <ArrowRight size={18} />
              </button>
            </div>

            {/* Stats Row */}
            <div className="animate-slide-up stagger-4 d-flex flex-wrap justify-content-center gap-4 gap-md-5" style={{ animationDelay: '0.35s' }}>
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="fw-black" style={{ fontSize: '1.8rem', color: 'var(--gx-neon)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(226,232,240,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Trust indicators */}
            <div className="animate-fade-in d-flex flex-wrap justify-content-center gap-3 mt-5" style={{ animationDelay:'0.5s' }}>
              {['No-Face Detection', 'Multi-Face Alert', 'Screenshot Block', 'Copy-Paste Prevention'].map(t => (
                <div key={t} className="d-flex align-items-center gap-1" style={{ fontSize: '0.78rem', color: 'rgba(226,232,240,0.5)', fontWeight: 500 }}>
                  <CheckCircle size={13} style={{ color: 'var(--gx-neon)', flexShrink: 0 }} />
                  {t}
                </div>
              ))}
            </div>

          </div>
        </div>
      </header>

      {/* Divider */}
      <div className="divider-neon mx-auto" style={{ width: '80%', maxWidth: '900px' }} />

      {/* ============ FEATURES GRID ============ */}
      <section className="py-5" style={{ background: 'rgba(0,0,0,0.2)' }}>
        <div className="container py-4">
          <div className="text-center mb-5">
            <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3" style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}>
              <Zap size={12} style={{ color: 'var(--gx-cyan)' }} />
              <span style={{ color: 'var(--gx-cyan)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Feature Arsenal</span>
            </div>
            <h2 className="animate-slide-up fw-bold" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '-0.02em' }}>
              Everything you need to <span style={{ color: 'var(--gx-neon)' }}>secure exams</span>
            </h2>
            <p style={{ color: 'rgba(226,232,240,0.5)', maxWidth: '500px', margin: '0 auto', fontSize: '0.95rem' }}>
              A complete, integrated shield — from the browser to the camera.
            </p>
          </div>

          <div className="row g-4">
            {features.map((f) => (
              <div key={f.title} className={`col-md-6 col-lg-4 animate-slide-up stagger-${f.delay}`}>
                <div
                  className="h-100 glass-panel glass-panel-hover cyber-hologram"
                  style={{ borderRadius: '16px', padding: '28px', cursor: 'default', position: 'relative', overflow: 'hidden' }}
                >
                  {/* Decorative corner */}
                  <div style={{ position: 'absolute', top: 0, right: 0, width: '60px', height: '60px', background: `radial-gradient(circle at top right, ${f.iconColor}10, transparent)`, borderRadius: '0 16px 0 60px' }} />

                  <div className="icon-box mb-4" style={{
                    background: `linear-gradient(135deg, ${f.iconColor}20, ${f.iconColor}05)`,
                    border: `1px solid ${f.iconColor}30`,
                    color: f.iconColor,
                    width: '52px', height: '52px', borderRadius: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <f.icon size={22} />
                  </div>

                  <h3 className="fw-bold mb-2" style={{ fontSize: '1rem', color: '#f1f5f9' }}>{f.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'rgba(226,232,240,0.55)', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA BANNER ============ */}
      <section className="py-5">
        <div className="container py-3">
          <div className="text-center p-5 rounded-4 position-relative overflow-hidden" style={{
            background: 'linear-gradient(135deg, rgba(132,204,22,0.08), rgba(6,182,212,0.05))',
            border: '1px solid rgba(132,204,22,0.2)',
            backdropFilter: 'blur(20px)',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(132,204,22,0.05), transparent 70%)', pointerEvents: 'none' }} />
            <ShieldCheck size={48} className="mb-4 mx-auto d-block" style={{ color: 'var(--gx-neon)', filter: 'drop-shadow(0 0 15px rgba(132,204,22,0.5))' }} />
            <h2 className="fw-bold mb-3 position-relative" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', letterSpacing: '-0.02em' }}>
              Ready to defend your exams?
            </h2>
            <p className="mb-4 mx-auto position-relative" style={{ color: 'rgba(226,232,240,0.55)', maxWidth: '480px' }}>
              Join institutions that trust GuardXLens for tamper-proof, AI-monitored examinations.
            </p>
            <div className="d-flex gap-3 justify-content-center position-relative">
              <button onClick={() => navigate('/register')} className="btn btn-primary btn-hover-scale px-5 py-2 fw-bold" style={{ borderRadius: '10px', boxShadow: '0 8px 30px rgba(132,204,22,0.4)' }}>
                Register Institution
              </button>
              <button onClick={() => navigate('/login')} className="btn btn-outline-light border-opacity-25 px-5 py-2 fw-semibold" style={{ borderRadius: '10px' }}>
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="py-4" style={{ background: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(132,204,22,0.08)' }}>
        <div className="container">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <div className="logo-cyber-glow p-1 rounded d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <span className="fw-semibold" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>GuardXLens</span>
            </div>
            <p style={{ color: 'rgba(226,232,240,0.3)', fontSize: '0.8rem', margin: 0 }}>
              © 2026 GuardXLens. Securing education, one exam at a time.
            </p>
            <div className="d-flex gap-3">
              {['Privacy', 'Terms', 'Support'].map(l => (
                <span key={l} style={{ color: 'rgba(226,232,240,0.35)', fontSize: '0.8rem', cursor: 'pointer' }}>{l}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;
