import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- COMPONENTS ---
import ProtectedRoute from './components/ProtectedRoute'; // Ensure this path exists
import CyberBackground from './components/CyberBackground';

// --- LAYOUTS ---
import AdminLayout from './layouts/AdminLayout';

import Home from './pages/Home';

// --- PAGES: AUTH ---
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// --- PAGES: SUPER ADMIN ---
import DashboardHome from './pages/admin/DashboardHome';
import AdminStudents from './pages/admin/AdminStudents';

// --- PAGES: INSTITUTION ---
import InstitutionDashboard from './pages/Institution/InstitutionDashboard';
import CreateExam from './pages/admin/CreateExam';
import InstitutionStudents from './pages/Institution/InstitutionStudents';
import EditExam from './pages/Institution/EditExam';
import ActiveExams from './pages/Institution/ActiveExams';
import AdminResultView from './pages/Institution/AdminResultView';
import InstitutionExamResults from './pages/Institution/InstitutionExamResults';

// --- PAGES: STUDENT ---
import StudentDashboard from './pages/student/StudentDashboard';
import TakeExam from './pages/student/TakeExam';
import StudentResults from './pages/student/StudentResults';

function App() {
    return (
        <Router>
            <CyberBackground />
            <Routes>
                {/* PUBLIC ROUTES */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />

                {/* --- STUDENT ROUTES (Flattened & Fixed) --- */}
                <Route path="/student/dashboard" element={
                    <ProtectedRoute allowedRoles={['student']}>
                        <StudentDashboard />
                    </ProtectedRoute>
                } />

                {/* FIXED: Path is now 'take-exam' to match StudentDashboard */}
                <Route path="/student/take-exam/:id" element={
                    <ProtectedRoute allowedRoles={['student']}>
                        <TakeExam />
                    </ProtectedRoute>
                } />

                <Route path="/student/results" element={
                    <ProtectedRoute allowedRoles={['student']}>
                        <StudentResults />
                    </ProtectedRoute>
                } />

                {/* --- INSTITUTION ROUTES --- */}
                <Route path="/institution" element={
                    <ProtectedRoute allowedRoles={['institution']}>
                        <AdminLayout />
                    </ProtectedRoute>
                }>
                    <Route path="dashboard" element={<InstitutionDashboard />} />
                    <Route path="active-exams" element={<ActiveExams />} />
                    <Route path="create-exam" element={<CreateExam />} />
                    <Route path="edit-exam/:id" element={<EditExam />} />
                    <Route path="students" element={<InstitutionStudents />} />
                    <Route path="result-view/:studentId/:resultId" element={<AdminResultView />} />
                    <Route path="exam-results/:examId" element={<InstitutionExamResults />} />
                    <Route index element={<Navigate to="dashboard" replace />} />
                </Route>

                {/* --- SUPER ADMIN ROUTES --- */}
                <Route path="/admin" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <AdminLayout />
                    </ProtectedRoute>
                }>
                    <Route path="dashboard" element={<DashboardHome />} />
                    <Route path="students" element={<AdminStudents />} />
                    <Route index element={<Navigate to="dashboard" replace />} />
                </Route>

                {/* Fallback for unknown routes */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;