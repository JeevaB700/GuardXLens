import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Lock, ArrowRight, Loader2, CheckCircle, ShieldAlert } from 'lucide-react';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const { token } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError("Passwords do not match");
        }

        setLoading(true);
        setError('');
        try {
            const res = await axios.put(`http://localhost:5000/api/auth/reset-password/${token}`, { password });
            if (res.data.success) {
                setSuccess(true);
                setTimeout(() => navigate('/login'), 3000);
            }
        } catch (error) {
            setError(error.response?.data?.message || "Invalid or expired reset link.");
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

                                {success ? (
                                    <div className="text-center py-4">
                                        <div className="d-inline-flex align-items-center justify-content-center p-3 rounded-circle bg-success bg-opacity-10 text-success mb-4 animate-bounce-subtle">
                                            <CheckCircle size={48} />
                                        </div>
                                        <h3 className="fw-bold mb-3 text-white">Password Updated</h3>
                                        <p className="text-white-50 mb-4">
                                            Your password has been reset successfully. <br />
                                            Redirecting to login in 3 seconds...
                                        </p>
                                        <Link to="/login" className="btn btn-primary w-100 py-3 rounded-pill btn-hover-scale d-flex align-items-center justify-content-center gap-2">
                                            Login Now <ArrowRight size={18} />
                                        </Link>
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-center mb-4">
                                            <div className="d-inline-flex align-items-center justify-content-center p-3 rounded-circle bg-primary bg-opacity-10 text-primary mb-3">
                                                <Lock size={32} />
                                            </div>
                                            <h3 className="fw-bold mb-1 text-white">Reset Password</h3>
                                            <p className="text-white-50 small">Enter your new secure password</p>
                                        </div>

                                        {error && (
                                            <div className="alert alert-danger bg-danger bg-opacity-10 border-danger border-opacity-25 text-danger small py-2 animate-shake d-flex align-items-center gap-2">
                                                <ShieldAlert size={16} /> {error}
                                            </div>
                                        )}

                                        <form onSubmit={handleSubmit}>
                                            <div className="form-floating mb-3">
                                                <input
                                                    type="password"
                                                    className="form-control form-control-dark"
                                                    id="password"
                                                    placeholder="New Password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                />
                                                <label htmlFor="password" title="New Password" className="text-white-50 d-flex align-items-center gap-2">
                                                    <Lock size={16} /> New Password
                                                </label>
                                            </div>

                                            <div className="form-floating mb-4">
                                                <input
                                                    type="password"
                                                    className="form-control form-control-dark"
                                                    id="confirmPassword"
                                                    placeholder="Confirm Password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    required
                                                />
                                                <label htmlFor="confirmPassword" title="Confirm Password" className="text-white-50 d-flex align-items-center gap-2">
                                                    <Lock size={16} /> Confirm Password
                                                </label>
                                            </div>

                                            <button
                                                type="submit"
                                                className="btn btn-primary w-100 py-3 rounded-pill btn-hover-scale fw-bold d-flex align-items-center justify-content-center gap-2"
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="animate-spin" size={18} /> Updating...
                                                    </>
                                                ) : (
                                                    "Set New Password"
                                                )}
                                            </button>
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

export default ResetPassword;
