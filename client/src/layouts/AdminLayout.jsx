import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileCheck, Users, PlusCircle, LogOut, Menu, Globe, ChevronRight } from 'lucide-react';
import { Offcanvas } from 'react-bootstrap';

const NavItem = ({ to, icon: Icon, label, onClick, badge }) => (
  <li className="nav-item" style={{ marginBottom: '2px' }}>
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `sidebar-nav-item d-flex align-items-center gap-3 w-100 text-decoration-none ${isActive ? 'active' : ''}`
      }
      end
    >
      {({ isActive }) => (
        <>
          <div style={{
            width: '34px', height: '34px',
            borderRadius: '9px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.05)',
            flexShrink: 0,
            transition: 'all 0.3s ease',
          }}>
            <Icon size={16} />
          </div>
          <span style={{ flex: 1, fontSize: '0.875rem' }}>{label}</span>
          {badge && (
            <span style={{
              fontSize: '0.65rem', fontWeight: 700,
              background: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(132,204,22,0.2)',
              color: isActive ? 'rgba(0,0,0,0.7)' : 'var(--gx-neon)',
              padding: '1px 7px', borderRadius: '100px',
            }}>{badge}</span>
          )}
          {!badge && isActive && <ChevronRight size={14} style={{ opacity: 0.6 }} />}
        </>
      )}
    </NavLink>
  </li>
);

const AdminLayout = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [userName, setUserName] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setRole(user.role);
      setUserName(user.name || '');
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  const SidebarContent = ({ onNavigate }) => (
    <div className="d-flex flex-column h-100" style={{ overflow: 'hidden' }}>
      {/* Logo Area */}
      <div className="p-4" style={{ borderBottom: '1px solid rgba(132,204,22,0.1)' }}>
        <div className="d-flex align-items-center gap-3">
          <div className="logo-cyber-glow p-1 rounded d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px', flexShrink: 0 }}>
            <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <h6 className="mb-0 fw-bold text-white" style={{ letterSpacing: '-0.01em' }}>GuardXLens</h6>
            <div className="d-flex align-items-center gap-1 mt-1">
              <div className="status-dot status-dot-green"></div>
              <small style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.1em', fontWeight: 600 }}>
                {role} Portal
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* User Info Strip */}
      {userName && (
        <div className="px-4 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="d-flex align-items-center gap-2">
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(132,204,22,0.3), rgba(132,204,22,0.1))',
              border: '1px solid rgba(132,204,22,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700, color: 'var(--gx-neon)',
              flexShrink: 0,
            }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', textTransform: 'capitalize' }}>{role}</div>
            </div>
          </div>
        </div>
      )}

      {/* Nav Links */}
      <nav className="flex-grow-1 px-3 py-3" style={{ overflowY: 'auto' }}>
        <ul className="nav flex-column" style={{ gap: 0, listStyle: 'none', padding: 0, margin: 0 }}>
          {role === 'institution' && (
            <>
              <li className="px-2 mb-2 mt-1">
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Management</span>
              </li>
              <NavItem to="/institution/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={onNavigate} />
              <NavItem to="/institution/active-exams" icon={FileCheck} label="Active Exams" onClick={onNavigate} />
              <NavItem to="/institution/create-exam" icon={PlusCircle} label="Create Exam" onClick={onNavigate} />
              <NavItem to="/institution/students" icon={Users} label="My Students" onClick={onNavigate} />
            </>
          )}
          {role === 'admin' && (
            <>
              <li className="px-2 mb-2 mt-1">
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Overview</span>
              </li>
              <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={onNavigate} />
              <NavItem to="/admin/students" icon={Globe} label="Institutions" onClick={onNavigate} />
            </>
          )}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={handleLogout}
          className="btn w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
          style={{
            borderRadius: '10px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#fca5a5',
            fontSize: '0.875rem',
            transition: 'all 0.3s ease',
            padding: '0.6rem 1rem',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.18)';
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)';
            e.currentTarget.style.color = '#fca5a5';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)';
            e.currentTarget.style.color = '#fca5a5';
          }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="d-flex vh-100 overflow-hidden" data-bs-theme="dark" style={{ background: 'linear-gradient(135deg, #080c18 0%, #0a0f1e 100%)' }}>

      {/* Desktop Sidebar */}
      <aside
        className="d-none d-lg-flex flex-column"
        style={{
          width: '264px', minWidth: '264px',
          background: 'rgba(6, 10, 20, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(132,204,22,0.1)',
          boxShadow: '4px 0 30px rgba(0,0,0,0.5)',
          zIndex: 10,
        }}
      >
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow-1 d-flex flex-column overflow-hidden">

        {/* Mobile Header */}
        <header
          className="d-lg-none d-flex align-items-center justify-content-between p-3"
          style={{
            background: 'rgba(6,10,20,0.95)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(132,204,22,0.12)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            zIndex: 10,
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <div className="logo-cyber-glow p-1 rounded" style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span className="fw-bold text-white" style={{ fontSize: '0.95rem' }}>GuardXLens</span>
          </div>
          <button
            className="btn btn-sm d-flex align-items-center gap-1"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: '8px' }}
            onClick={() => setShowSidebar(true)}
          >
            <Menu size={18} />
          </button>
        </header>

        {/* Mobile Sidebar */}
        <Offcanvas
          show={showSidebar}
          onHide={() => setShowSidebar(false)}
          placement="start"
          className="text-white"
          data-bs-theme="dark"
          style={{ width: '264px', background: 'rgba(6,10,20,0.98)', backdropFilter: 'blur(20px)' }}
        >
          <Offcanvas.Header closeButton closeVariant="white" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <Offcanvas.Title className="fw-bold" style={{ fontSize: '0.95rem' }}>Navigation</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="p-0" style={{ height: '100%' }}>
            <SidebarContent onNavigate={() => setShowSidebar(false)} />
          </Offcanvas.Body>
        </Offcanvas>

        {/* Page Content */}
        <main className="flex-grow-1 overflow-auto custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
