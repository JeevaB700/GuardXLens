import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Loader2, CheckCircle, BellRing, Info } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      if (res.data.success) {
        sessionStorage.setItem('token', res.data.token);
        sessionStorage.setItem('user', JSON.stringify(res.data.user));

        if (res.data.user.role === 'admin') navigate('/admin/dashboard');
        else if (res.data.user.role === 'institution') navigate('/institution/dashboard');
        else navigate('/student/dashboard');
      }
    } catch (error) {
      alert(error.response?.data?.message || "Login Failed");
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
              <div className="d-inline-flex align-items-center justify-content-center p-3 rounded-pill bg-primary bg-opacity-10 text-primary mb-4 animate-slide-up stagger-1">
                <ShieldCheck size={48} />
              </div>
              <h1 className="display-4 fw-bold mb-3 text-white animate-slide-up stagger-2">Welcome Back</h1>
              <p className="lead text-white-50 mb-5 animate-slide-up stagger-3">
                Securely access your GuardXLens dashboard to manage exams, view results, and ensure academic integrity.
              </p>

              <div className="card glass-panel border-0 shadow-lg animate-slide-up stagger-4">
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 text-white">
                    <BellRing size={20} className="text-warning" /> Latest Updates
                  </h5>
                  <ul className="list-unstyled text-white-50 small mb-0">
                    <li className="mb-3 d-flex align-items-start gap-2">
                      <CheckCircle size={16} className="text-success mt-1 flex-shrink-0" />
                      <span><strong>AI 2.0 Deployment:</strong> Enhanced gaze tracking algorithms are now live for all student exams.</span>
                    </li>
                    <li className="mb-3 d-flex align-items-start gap-2">
                      <CheckCircle size={16} className="text-success mt-1 flex-shrink-0" />
                      <span><strong>Analytics Dashboard:</strong> Institutions can now export detailed PDF reports.</span>
                    </li>
                    <li className="d-flex align-items-start gap-2">
                      <Info size={16} className="text-info mt-1 flex-shrink-0" />
                      <span><strong>Support:</strong> 24/7 technical assistance is available during exam hours.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="col-lg-5 animate-slide-up stagger-2">
            <div className="card glass-panel shadow-lg border-0">
              <div className="card-body p-4 p-md-5">
                <div className="text-center mb-4">
                  <h3 className="fw-bold mb-1 text-white">Sign In</h3>
                  <p className="text-white-50 small">Access your account</p>
                </div>

                <form onSubmit={handleSubmit}>
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
                  <div className="form-floating mb-3">
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

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check">
                      <input className="form-check-input bg-dark border-secondary" type="checkbox" id="rememberMe" />
                      <label className="form-check-label text-white-50 small" htmlFor="rememberMe">Remember me</label>
                    </div>
                    <Link to="/forgot-password" size={16} className="text-primary text-decoration-none small fw-bold">Forgot password?</Link>
                  </div>

                  <button disabled={loading} className="btn btn-primary w-100 py-3 fw-bold rounded d-flex justify-content-center align-items-center gap-2 shadow-sm btn-hover-scale">
                    {loading ? <Loader2 className="spinner-border spinner-border-sm" /> : (
                      <>Sign In <ArrowRight size={20} /></>
                    )}
                  </button>
                </form>

                <div className="text-center mt-4">
                  <p className="text-white-50 small mb-0">
                    Don't have an account? <Link to="/register" className="text-primary text-decoration-none fw-bold">Create Account</Link>
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

export default Login;
