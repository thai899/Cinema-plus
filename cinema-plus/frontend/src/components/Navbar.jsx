import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#131313]/80 backdrop-blur-md border-b border-[#e9c176]/20 h-20">
      <div className="flex justify-between items-center px-6 md:px-16 h-full max-w-7xl mx-auto w-full">
        
        <div className="flex items-center gap-12">
          {/* Bấm vào Logo đá về trang chủ gốc */}
          <Link to="/" className="text-2xl font-bold text-[#e9c176] uppercase tracking-wider font-serif">Cinema Plus</Link>
          <div className="hidden md:flex gap-8 items-center text-sm font-medium text-[#d1c5b4]">
            <Link to="/" className="text-[#e9c176] font-bold border-b-2 border-[#e9c176] pb-1">Phim</Link>
            <a href="#" className="hover:text-[#e9c176] transition-colors">Rạp Chiếu</a>
            <a href="#" className="hover:text-[#e9c176] transition-colors">Ưu Đãi</a>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Điều khiển hiển thị Nút Đăng nhập hoặc Tên User tùy thuộc trạng thái Token */}
          {!token ? (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-bold text-[#d1c5b4] hover:text-white uppercase tracking-widest border border-[#4e4639] px-5 py-2.5 rounded-lg transition-colors">
                Đăng Nhập
              </Link>
              <Link to="/register" className="bg-[#e9c176] text-[#261900] text-sm font-bold px-5 py-2.5 rounded-lg hover:scale-105 transition-transform uppercase tracking-widest">
                Đăng Ký
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* Bấm vào ô tên tài khoản sẽ tự động chuyển hướng về trang cá nhân / trang quản lý */}
              <div 
                onClick={() => navigate('/')} 
                className="flex items-center gap-2 bg-[#e9c176]/10 border border-[#e9c176]/20 px-4 py-2 rounded-xl cursor-pointer hover:bg-[#e9c176]/20 transition-all"
              >
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-bold text-[#e9c176] uppercase">{username}</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}