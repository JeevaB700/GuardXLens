import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle, ShieldQuestion } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
            if (res.data.success) {
                setSent(true);
            }
        } catch (error) {
            setError(error.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-vh-100 bg-gradient-dark d-flex align-items-center font-sans animate-fade-in text-light">
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-lg-5 col-md-8 animate-slide-up">
                        <div className="card glass-panel shadow-lg border-0">
                            <div className="card-body p-4 p-md-5">

                                {sent ? (
                                    <div className="text-center py-4">
                                        <div className="d-inline-flex align-items-center justify-content-center p-3 rounded-circle bg-success bg-opacity-10 text-success mb-4 animate-bounce-subtle">
                                            <CheckCircle size={48} />
                                        </div>
                                        <h3 className="fw-bold mb-3 text-white">Check Your Mail</h3>
                                        <p className="text-white-50 mb-4">
                                            We have sent password recovery instructions to <br />
                                            <strong className="text-primary">{email}</strong>
                                        </p>
                                        <Link to="/login" className="btn btn-primary w-100 py-3 rounded-pill btn-hover-scale d-flex align-items-center justify-content-center gap-2">
                                            <ArrowLeft size={18} /> Back to Login
                                        </Link>
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-center mb-4">
                                            <div className="d-inline-flex align-items-center justify-content-center p-3 rounded-circle bg-primary bg-opacity-10 text-primary mb-3">
                                                <ShieldQuestion size={32} />
                                            </div>
                                            <h3 className="fw-bold mb-1 text-white">Forgot Password?</h3>
                                            <p className="text-white-50 small">Enter your email for recovery instructions</p>
                                        </div>

                                        {error && (
                                            <div className="alert alert-danger bg-danger bg-opacity-10 border-danger border-opacity-25 text-danger small py-2 animate-shake">
                                                {error}
                                            </div>
                                        )}

                                        <form onSubmit={handleSubmit}>
                                            <div className="form-floating mb-4">
                                                <input
                                                    type="email"
                                                    className="form-control form-control-dark"
                                                    id="email"
                                                    placeholder="name@example.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                />
                                                <label htmlFor="email" className="text-white-50 d-flex align-items-center gap-2">
                                                    <Mail size={16} /> Email Address
                                                </label>
                                            </div>

                                            <button
                                                type="submit"
                                                className="btn btn-primary w-100 py-3 rounded-pill mb-4 btn-hover-scale fw-bold d-flex align-items-center justify-content-center gap-2"
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="animate-spin" size={18} /> Processing...
                                                    </>
                                                ) : (
                                                    "Send Instructions"
                                                )}
                                            </button>

                                            <div className="text-center">
                                                <Link to="/login" className="text-white-50 text-decoration-none small hover-text-white d-inline-flex align-items-center gap-2 transition-all">
                                                    <ArrowLeft size={14} /> Back to Sign In
                                                </Link>
                                            </div>
                                        </form>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
