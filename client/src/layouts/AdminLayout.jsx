import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileCheck, Users, PlusCircle, LogOut, ShieldCheck, Menu, Globe, X } from 'lucide-react';
import { Offcanvas } from 'react-bootstrap';

const NavItem = ({ to, icon: Icon, label, onClick }) => (
  <li className="nav-item mb-1">
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-2 transition-all ${isActive
          ? 'bg-primary text-white fw-medium shadow-sm'
          : 'text-white-50 hover-bg-light-10'
        }`
      }
      end
    >
      <Icon size={18} /> <span>{label}</span>
    </NavLink>
  </li>
);

const AdminLayout = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setRole(user.role);
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  const SidebarContent = ({ onNavigate }) => (
    <div className="d-flex flex-column h-100">
      <div className="p-4 border-bottom border-white border-opacity-10 d-flex align-items-center gap-3">
        <div className="bg-white bg-opacity-10 p-1 rounded shadow-sm border border-white border-opacity-10">
          <img src="/logo.png" alt="Logo" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
        </div>
        <div>
          <h5 className="mb-0 fw-bold text-white">GuardXLens</h5>
          <small className="text-white-50 text-uppercase" style={{ fontSize: '0.7rem' }}>{role} Portal</small>
        </div>
      </div>

      <nav className="flex-grow-1 overflow-auto p-3">
        <ul className="nav nav-pills flex-column">
          {role === 'institution' && (
            <>
              <small className="text-white-50 text-uppercase px-3 mb-2 mt-2" style={{ fontSize: '0.75rem' }}>Management</small>
              <NavItem to="/institution/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={onNavigate} />
              <NavItem to="/institution/active-exams" icon={FileCheck} label="Active Exams" onClick={onNavigate} />
              <NavItem to="/institution/create-exam" icon={PlusCircle} label="Create Exam" onClick={onNavigate} />
              <NavItem to="/institution/students" icon={Users} label="My Students" onClick={onNavigate} />
            </>
          )}
          {role === 'admin' && (
            <>
              <small className="text-white-50 text-uppercase px-3 mb-2 mt-2" style={{ fontSize: '0.75rem' }}>Overview</small>
              <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={onNavigate} />
              <NavItem to="/admin/students" icon={Globe} label="Institutions" onClick={onNavigate} />
            </>
          )}
        </ul>
      </nav>

      <div className="p-3 border-top border-white border-opacity-10 mt-auto">
        <button
          onClick={handleLogout}
          className="btn btn-outline-danger border-opacity-75 w-100 d-flex align-items-center justify-content-center gap-2 hover-scale"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="d-flex vh-100 bg-gradient-dark overflow-hidden" data-bs-theme="dark">

      {/* Desktop Sidebar */}
      <aside className="d-none d-lg-block glass-navbar border-end border-white border-opacity-10" style={{ width: '280px', minWidth: '280px' }}>
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow-1 d-flex flex-column h-100 overflow-hidden">

        {/* Mobile Header */}
        <header className="d-lg-none glass-navbar border-bottom border-white border-opacity-10 p-3 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <img src="/logo.png" alt="Logo" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
            <span className="fw-bold text-white">GuardXLens</span>
          </div>
          <button className="btn btn-outline-light border-opacity-50 p-1" onClick={() => setShowSidebar(true)}>
            <Menu size={24} />
          </button>
        </header>

        {/* Mobile Sidebar (Offcanvas) */}
        <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} placement="start" className="bg-dark text-white" data-bs-theme="dark">
          <Offcanvas.Header closeButton closeVariant="white">
            <Offcanvas.Title>Menu</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="p-0">
            <SidebarContent onNavigate={() => setShowSidebar(false)} />
          </Offcanvas.Body>
        </Offcanvas>

        {/* Page Content */}
        <main className="flex-grow-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
