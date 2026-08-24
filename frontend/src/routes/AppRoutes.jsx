import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

// Page imports
import LandingPage from '../pages/landing/LandingPage';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import PatientDashboard from '../pages/dashboard/PatientDashboard';
import DoctorDashboard from '../pages/dashboard/DoctorDashboard';
import DoctorPending from '../pages/dashboard/DoctorPending';
import AdminDashboard from '../pages/dashboard/AdminDashboard';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useAuthStore();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (user.role === 'doctor') {
    const path = window.location.pathname;
    if (!user.isApproved && !path.includes('doctor-pending')) {
      return <Navigate to="/doctor-pending" replace />;
    }
    if (user.isApproved && path.includes('doctor-pending')) {
      return <Navigate to="/doctor-dashboard" replace />;
    }
  }

  return children;
};

export default function AppRoutes() {
  const { user } = useAuthStore();

  const getHomeRedirect = () => {
    if (!user) return <LandingPage />;
    if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
    if (user.role === 'doctor') {
      return user.isApproved ? 
        <Navigate to="/doctor-dashboard" replace /> : 
        <LandingPage />;
    }
    return <Navigate to="/patient-dashboard" replace />;
  };

  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={getHomeRedirect()} />

      {/* Auth Routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Patient Dashboard */}
      <Route 
        path="/patient-dashboard" 
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Doctor Dashboard */}
      <Route 
        path="/doctor-dashboard" 
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Doctor Pending */}
      <Route 
        path="/doctor-pending" 
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorPending />
          </ProtectedRoute>
        } 
      />

      {/* Admin Dashboard */}
      <Route 
        path="/admin-dashboard" 
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
