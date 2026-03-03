import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Lock, Cpu, Eye, CheckCircle } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="d-flex flex-column min-vh-100 bg-dark text-white font-sans">

      {/* --- NAVBAR --- */}
      <nav className="navbar navbar-expand-md navbar-dark bg-dark py-3 border-bottom border-secondary sticky-top">
        <div className="container">
          <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="p-2 rounded bg-primary d-flex align-items-center justify-content-center">
              <ShieldCheck className="text-white" size={24} />
            </div>
            <span className="h4 mb-0 fw-bold text-white">GuardXLens</span>
          </div>

          <div className="d-flex gap-3 ms-auto">
            <button onClick={() => navigate('/login')} className="btn btn-link text-white text-decoration-none fw-medium d-none d-md-block">
              Login
            </button>
            <button onClick={() => navigate('/register')} className="btn btn-primary d-flex align-items-center gap-2 px-4">
              Get Started <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="container d-flex flex-column align-items-center justify-content-center flex-grow-1 text-center py-5">
        <div className="row justify-content-center w-100">
          <div className="col-lg-10 col-xl-8">

            {/* Badge */}
            <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill bg-dark border border-secondary mb-4">
              <span className="badge bg-info rounded-circle p-1"> </span>
              <span className="text-info small fw-bold text-uppercase">AI Proctoring 2.0</span>
            </div>

            {/* Main Title */}
            <h1 className="display-3 fw-bold mb-4 text-white">
              Secure Exams. <br className="d-none d-md-block" />
              <span className="text-primary">Uncompromised Integrity.</span>
            </h1>

            {/* Subtitle */}
            <p className="lead text-secondary mb-5 mx-auto" style={{ maxWidth: '650px' }}>
              The world's most advanced AI-powered examination platform.
              Detect malpractice with <span className="text-white fw-semibold">99.9% accuracy</span> using real-time behavior analysis and automated audit logs.
            </p>

            {/* CTA Buttons */}
            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center mb-5">
              <button onClick={() => navigate('/register', { state: { role: 'institution' } })} className="btn btn-primary btn-lg px-5 py-3 fs-6 fw-bold">
                Deploy for Institution
              </button>
              <button onClick={() => navigate('/login')} className="btn btn-outline-light btn-lg px-5 py-3 fs-6 fw-bold">
                Student Login
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="d-flex flex-wrap justify-content-center gap-4 gap-md-5 text-secondary small fw-medium mt-4">
              <div className="d-flex align-items-center gap-2"><CheckCircle size={16} className="text-success" /> 10k+ Exams Conducted</div>
              <div className="d-flex align-items-center gap-2"><CheckCircle size={16} className="text-success" /> 99.9% Uptime</div>
              <div className="d-flex align-items-center gap-2"><CheckCircle size={16} className="text-success" /> SOC2 Compliant</div>
            </div>

          </div>
        </div>
      </header>

      {/* --- FEATURES GRID --- */}
      <section className="bg-secondary bg-opacity-10 py-5">
        <div className="container py-4">
          <div className="row g-4">

            {/* Feature 1 */}
            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm bg-dark text-white">
                <div className="card-body p-4">
                  <div className="p-3 rounded bg-primary bg-opacity-10 mb-4 d-inline-block text-primary">
                    <Lock size={32} />
                  </div>
                  <h3 className="h4 fw-bold mb-3">Browser Lockdown</h3>
                  <p className="text-secondary mb-0">Prevents tab switching, copy-pasting, and keyboard shortcuts. Forces full-screen mode for total focus.</p>
                </div>
              </div>
            </div>

            {/* Feature 2 (Highlighted) */}
            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-primary shadow bg-dark text-white">
                <div className="card-body p-4">
                  <div className="p-3 rounded bg-info bg-opacity-10 mb-4 d-inline-block text-info">
                    <Cpu size={32} />
                  </div>
                  <h3 className="h4 fw-bold mb-3">AI Question Generator</h3>
                  <p className="text-secondary mb-0">Upload your lecture notes (PDF/DOCX) and let our Gemini AI engine generate MCQs and coding problems instantly.</p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm bg-dark text-white">
                <div className="card-body p-4">
                  <div className="p-3 rounded bg-warning bg-opacity-10 mb-4 d-inline-block text-warning">
                    <Eye size={32} />
                  </div>
                  <h3 className="h4 fw-bold mb-3">Live Proctoring</h3>
                  <p className="text-secondary mb-0">Real-time student monitoring including face detection, gaze tracking, and multiple person detection alerts.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-4 border-top border-secondary bg-dark text-center text-secondary small">
        <div className="container">
          <p className="mb-0">&copy; 2026 GuardXLens. Built for the Future of Education.</p>
        </div>
      </footer>

    </div>
  );
};

export default Home;
