import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axiosClient.post('/auth/login', { username, password });
      
      // Lưu thông tin xác thực vào localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);
      localStorage.setItem('username', response.data.username);

      // Điều phối sang đúng trang mẫu của từng Role thực tế
      const role = response.data.role;
      if (role === 'ROLE_ADMIN') navigate('/admin-dashboard');
      else if (role === 'ROLE_MANAGER') navigate('/manager-dashboard');
      else if (role === 'ROLE_STAFF') navigate('/staff-scanner');
      else navigate('/customer-profile');

    } catch (err) {
      setError(err.response?.data || 'Đăng nhập thất bại, hãy thử lại!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white p-6">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 p-8 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold text-center text-amber-500 mb-2">CINEMA PLUS</h2>
        <p className="text-neutral-400 text-sm text-center mb-6">Hệ thống quản lý đặt vé rạp chiếu phim</p>
        
        {error && <div className="bg-red-500/10 border border-red-500 text-red-500 text-sm p-3 rounded-lg mb-4 text-center">{error}</div>}
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Tài khoản test</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="Nhập username..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">Mật khẩu</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold py-2.5 rounded-lg transition-colors cursor-pointer mt-2">Đăng Nhập Hệ Thống</button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;