import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import TrackComplaintPage from './pages/TrackComplaintPage';
import LandingPage from './pages/LandingPage';
import GrievanceCentersMapPage from './pages/GrievanceCentersMapPage';
import PradarshakAssistant from './components/PradarshakAssistant';

// Dashboard layouts
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminComplaints from './pages/admin/AdminComplaints';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDepartments from './pages/admin/AdminDepartments';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import AdminDelivery from './pages/admin/AdminDelivery';

import OfficerLayout from './pages/officer/OfficerLayout';
import OfficerDashboard from './pages/officer/OfficerDashboard';
import OfficerComplaints from './pages/officer/OfficerComplaints';
import OfficerDelivery from './pages/officer/OfficerDelivery';

import UserLayout from './pages/user/UserLayout';
import UserDashboard from './pages/user/UserDashboard';
import FileComplaint from './pages/user/FileComplaint';
import MyComplaints from './pages/user/MyComplaints';
import ComplaintDetail from './pages/user/ComplaintDetail';
import UserDelivery from './pages/user/UserDelivery';
import UserProfile from './pages/user/UserProfile';
import UserNotifications from './pages/user/UserNotifications';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={`/${user?.role}`} replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <PageLoader />;
  if (isAuthenticated) return <Navigate to={`/${user?.role}`} replace />;
  return children;
};

const PageLoader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', background: '#f8f9fa'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 60, height: 60, border: '3px solid rgba(0,0,128,0.15)',
        borderTop: '3px solid #000080', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'
      }} />
      <p style={{ color: '#6c757d', fontSize: 14, fontWeight: 500 }}>Loading JanSamadhan...</p>
    </div>
  </div>
);

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/centers" element={<GrievanceCentersMapPage />} />
      <Route path="/track/:complaintNumber" element={<TrackComplaintPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Auth routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="complaints" element={<AdminComplaints />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="departments" element={<AdminDepartments />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="delivery" element={<AdminDelivery />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Officer routes */}
      <Route path="/officer" element={<ProtectedRoute allowedRoles={['officer']}><OfficerLayout /></ProtectedRoute>}>
        <Route index element={<OfficerDashboard />} />
        <Route path="complaints" element={<OfficerComplaints />} />
        <Route path="delivery" element={<OfficerDelivery />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="notifications" element={<UserNotifications />} />
      </Route>

      {/* User routes */}
      <Route path="/user" element={<ProtectedRoute allowedRoles={['user']}><UserLayout /></ProtectedRoute>}>
        <Route index element={<UserDashboard />} />
        <Route path="file-complaint" element={<FileComplaint />} />
        <Route path="complaints" element={<MyComplaints />} />
        <Route path="complaints/:id" element={<ComplaintDetail />} />
        <Route path="delivery" element={<UserDelivery />} />
        <Route path="centers" element={<GrievanceCentersMapPage embedded />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="notifications" element={<UserNotifications />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={
        isAuthenticated
          ? <Navigate to={`/${user?.role}`} replace />
          : <Navigate to="/login" replace />
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#212529',
              border: '1px solid #dee2e6',
              borderRadius: '10px',
              fontSize: '14px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            },
            success: { iconTheme: { primary: '#138808', secondary: '#fff' } },
            error: { iconTheme: { primary: '#dc3545', secondary: '#fff' } },
          }}
        />
        <AppRoutes />
        <PradarshakAssistant />
      </AuthProvider>
    </Router>
  );
}
