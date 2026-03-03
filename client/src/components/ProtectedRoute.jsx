import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles, children }) => {
  const userString = sessionStorage.getItem('user');
  const token = sessionStorage.getItem('token');

  // 1. STRICT CHECK: If no token or user data, Force Logout
  if (!token || !userString) {
    // Optional: Clear any partial garbage data
    sessionStorage.clear();
    return <Navigate to="/" replace />;
  }

  const user = JSON.parse(userString);

  // 2. ROLE CHECK: If user has wrong role, redirect to their correct dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
    if (user.role === 'institution') return <Navigate to="/institution/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    
    // Fallback
    return <Navigate to="/" replace />;
  }

  // 3. Render the protected content
  // If children are provided (like in App.jsx), render them.
  // Otherwise, render Outlet for nested routes.
  return children ? children : <Outlet />;
};

export default ProtectedRoute;