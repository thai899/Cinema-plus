import SeatSelectionPage from "./pages/customer/SeatSelectionPage";
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StaffTerminal from "./pages/staff/StaffScanner"; 
import ManagerDashboard from "./pages/manager/ManagerDashboard"; 
import AdminDashboard from "./pages/admin/AdminDashboard";
import SeatSelectionPage from "./pages/customer/SeatSelectionPage";
import ShowtimeSelectionPage from "./pages/customer/ShowtimeSelectionPage";
import ProfilePage from "./pages/customer/ProfilePage";

const RoleBasedGuard = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!token) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (userRole === 'ROLE_ADMIN') return <Navigate to="/admin-dashboard" replace />;
    if (userRole === 'ROLE_MANAGER') return <Navigate to="/manager-dashboard" replace />;
    if (userRole === 'ROLE_STAFF') return <Navigate to="/staff-scanner" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function App() {
  return (
    <Router>
      <Routes>
        {/* 🟢 KHẮC PHỤC CHÍ MẠNG: Cho phép cả khách chưa login lẫn khách đã login đều ở chung trang chủ "/" */}
        <Route path="/" element={<HomePage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/customer/seats" element={<SeatSelectionPage />}/>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/movie/:movieId/showtimes" element={
          <RoleBasedGuard allowedRoles={['ROLE_CUSTOMER']}>
            <ShowtimeSelectionPage />
          </RoleBasedGuard>
        } />
        <Route path="/showtime/:showtimeId/seats" element={<SeatSelectionPage />} />
        <Route path="/profile" element={
          <RoleBasedGuard allowedRoles={['ROLE_CUSTOMER']}>
            <ProfilePage />
          </RoleBasedGuard>
        } />

        {/* Các trang quản trị điều hành giữ nguyên bảo vệ Guard */}
        <Route path="/admin-dashboard" element={
          <RoleBasedGuard allowedRoles={['ROLE_ADMIN']}>
            <AdminDashboard />
          </RoleBasedGuard>
        } />
        
        <Route path="/manager-dashboard" element={
          <RoleBasedGuard allowedRoles={['ROLE_MANAGER']}>
            <ManagerDashboard />
          </RoleBasedGuard>
        } />
        
        <Route path="/staff-scanner" element={
          <RoleBasedGuard allowedRoles={['ROLE_STAFF']}>
            <StaffTerminal />
          </RoleBasedGuard>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}