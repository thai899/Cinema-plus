import React from 'react';
import { Navigate } from 'react-router-dom';

const GuardedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role'); // Lấy quyền hiện tại từ bộ nhớ trình duyệt

  // Nếu chưa đăng nhập -> Đá ra trang login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Nếu đăng nhập rồi nhưng vào nhầm trang của Role khác -> Đá về trang chủ
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default GuardedRoute;