import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, FileCheck, Plus, Activity, ArrowRight, WalletCards, TrendingUp, Zap, Shield, BookOpen } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import API_BASE_URL from '../../config';

const StatCard = ({ icon: Icon, iconColor, title, value, badge, actionLabel, onClick, delay, accent }) => (
  <div className={`col-12 col-xl-6 animate-up stagger-${delay}`}>
    <div
      className="stat-card-premium h-100 cursor-pointer p-mobile-3"
      onClick={onClick}
      style={{
        background: 'rgba(10,15,30,0.7)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${accent}22`,
        padding: '28px',
      }}
    >
      <div className="d-flex align-items-start justify-content-between mb-4">
        <div style={{
          width: '52px', height: '52px', borderRadius: '14px',
          background: `linear-gradient(135deg, ${accent}20, ${accent}08)`,
          border: `1px solid ${accent}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: iconColor,
        }}>
          <Icon size={22} />
        </div>
        <span style={{
          fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          background: `${accent}15`, color: iconColor, border: `1px solid ${accent}30`,
          padding: '3px 10px', borderRadius: '100px',
        }}>{badge}</span>
      </div>

      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)', marginBottom: '8px' }}>{title}</div>

      <div className="d-flex align-items-end justify-content-between">
        <div style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 900, color: '#f8fafc', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
        <div className="d-flex align-items-center gap-1 mb-2" style={{ color: iconColor, fontSize: '0.8rem', fontWeight: 600 }}>
          {actionLabel} <ArrowRight size={14} />
        </div>
      </div>
    </div>
  </div>
);

const ActionCard = ({ icon: Icon, iconColor, accent, title, desc, onClick, delay }) => (
  <div className={`col-md-4 animate-slide-up stagger-${delay}`}>
    <div
      className="cursor-pointer h-100"
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '14px',
        padding: '22px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = `${accent}0a`;
        e.currentTarget.style.borderColor = `${accent}25`;
        e.currentTarget.style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px',
        background: `${accent}15`, border: `1px solid ${accent}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: iconColor, marginBottom: '16px',
      }}>
        <Icon size={20} />
      </div>
      <h6 style={{ color: '#f1f5f9', fontWeight: 700, marginBottom: '6px', fontSize: '0.9rem' }}>{title}</h6>
      <p style={{ color: 'rgba(226,232,240,0.45)', fontSize: '0.8rem', lineHeight: 1.6, margin: 0 }}>{desc}</p>
    </div>
  </div>
);

const InstitutionDashboard = () => {
  const [stats, setStats] = useState({ students: 0, exams: 0 });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    setUserName(user.name || 'Institution');
    const fetchDashboardData = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [sRes, eRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/auth/my-students`, config),
          axios.get(`${API_BASE_URL}/api/admin/institution-exams`, config),
        ]);
        setStats({ students: sRes.data.students?.length || 0, exams: eRes.data.exams?.length || 0 });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchDashboardData();
  }, [navigate]);

  if (loading) return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'transparent' }}>
      <div className="d-flex flex-column align-items-center gap-3">
        <div className="spinner-neon"></div>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Loading Dashboard</span>
      </div>
    </div>
  );

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="animate-fade-in p-mobile-3" style={{ padding: '28px', maxWidth: '1300px' }} data-bs-theme="dark">

      {/* ========== HEADER ========== */}
      <div className="animate-slide-down d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-5">
        <div>
          <div className="d-flex align-items-center gap-2 mb-2">
            <div className="status-dot status-dot-green"></div>
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Institution Portal</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {greeting}, <span style={{ color: 'var(--gx-neon)' }}>{userName.split(' ')[0]}</span> 👋
          </h1>
          <p style={{ color: 'rgba(226,232,240,0.45)', marginTop: '6px', marginBottom: 0, fontSize: '0.9rem' }}>
            Here's your institution overview for today.
          </p>
        </div>
        <Link
          to="/institution/create-exam"
          className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2 btn-hover-scale fw-semibold"
          style={{ borderRadius: '12px', flexShrink: 0, boxShadow: '0 8px 25px rgba(132,204,22,0.35)', fontSize: '0.9rem' }}
        >
          <Plus size={18} /> Create Assessment
        </Link>
      </div>

      {/* ========== STAT CARDS ========== */}
      <div className="row g-4 mb-5">
        <StatCard
          icon={Users}
          iconColor="var(--gx-neon)"
          accent="#84cc16"
          title="Enrolled Students"
          value={stats.students}
          badge="Active"
          actionLabel="View All"
          onClick={() => navigate('/institution/students')}
          delay={1}
        />
        <StatCard
          icon={FileCheck}
          iconColor="var(--gx-cyan)"
          accent="#06b6d4"
          title="Active Assessments"
          value={stats.exams}
          badge="Published"
          actionLabel="Manage"
          onClick={() => navigate('/institution/active-exams')}
          delay={2}
        />
      </div>

      {/* ========== QUICK ACTIONS ========== */}
      <div className="animate-slide-up stagger-3">
        <div className="d-flex align-items-center gap-2 mb-3">
          <div style={{ width: '3px', height: '18px', background: 'linear-gradient(to bottom, var(--gx-neon), transparent)', borderRadius: '2px' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', margin: 0, letterSpacing: '-0.01em' }}>Quick Actions</h2>
        </div>

        <div style={{
          background: 'rgba(10,15,30,0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '18px',
          padding: '24px',
        }}>
          <div className="row g-3">
            <ActionCard
              icon={Plus}
              iconColor="#4ade80"
              accent="#22c55e"
              title="Create New Exam"
              desc="Draft a new assessment from scratch or upload a PDF/DOCX to let AI generate questions instantly."
              onClick={() => navigate('/institution/create-exam')}
              delay={4}
            />
            <ActionCard
              icon={TrendingUp}
              iconColor="var(--gx-neon)"
              accent="#84cc16"
              title="Student Analytics"
              desc="Monitor student performance, review exam results, and download detailed Excel reports."
              onClick={() => navigate('/institution/students')}
              delay={5}
            />
            <ActionCard
              icon={WalletCards}
              iconColor="#fbbf24"
              accent="#f59e0b"
              title="Edit Assessments"
              desc="Update questions, adjust timings, toggle AI proctoring settings, and reconfigure assessments."
              onClick={() => navigate('/institution/active-exams')}
              delay={6}
            />
          </div>
        </div>
      </div>

      {/* ========== INFO BANNER ========== */}
      <div className="animate-slide-up stagger-4 mt-4">
        <div className="d-flex align-items-start gap-3 p-4 rounded-3" style={{
          background: 'rgba(132,204,22,0.04)',
          border: '1px solid rgba(132,204,22,0.12)',
          borderRadius: '14px',
        }}>
          <Shield size={18} style={{ color: 'var(--gx-neon)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gx-neon)', marginBottom: '3px' }}>GuardXLens Security Active</div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(226,232,240,0.45)', lineHeight: 1.6 }}>
              All exams are protected with browser lockdown, screenshot prevention, AI proctoring (configurable), and malpractice logging. Students receive warnings before termination.
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default InstitutionDashboard;
