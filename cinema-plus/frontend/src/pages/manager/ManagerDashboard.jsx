import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from "../../api/axiosClient";
import { 
  LayoutDashboard, Film, Ticket, Award, Settings, LogOut, Menu, Search, Bell, Plus,
  TrendingUp, Utensils, Armchair, AlertTriangle, Monitor, Users, Printer 
} from 'lucide-react';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const managerName = localStorage.getItem('username') || 'Quản lý';
  
  // Trạng thái hoạt ảnh CSS
  const [animate, setAnimate] = useState(false);

  const [metrics, setMetrics] = useState({
    ticketSales: '24,205',
    fbRevenue: '8,122',
    avgOccupancy: 78
  });

  const [inventory] = useState([
    { name: 'Bỏng ngô (Bơ & Caramel)', ratio: 85, status: 'Normal' },
    { name: 'Siro Nước ngọt (Post-mix)', ratio: 42, status: 'Warning' },
    { name: 'Vật phẩm giới hạn (Ly/Mũ phim)', ratio: 12, status: 'Low' },
    { name: 'Sốt phô mai Nacho', ratio: 68, status: 'Normal' }
  ]);

  useEffect(() => {
    const fetchManagerData = async () => {
      try {
        const metricsRes = await axiosClient.get('/api/manager/analytics');
        if (metricsRes.data) setMetrics(metricsRes.data);
      } catch (error) {
        console.log("Đang sử dụng dữ liệu rạp phim giả lập phục vụ Test UI");
      } finally {
        // Sau khi nạp dữ liệu xong (kể cả lỗi), bật hoạt ảnh trồi mượt lên
        setAnimate(true);
      }
    };
    fetchManagerData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="bg-[#131313] text-[#e4e2e1] min-h-screen font-sans selection:bg-[#e9c176]/30 selection:text-[#e9c176]">
      
      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col h-screen py-6 bg-[#1f2020] border-r border-[#4e4639]/20 shadow-lg w-64 fixed left-0 top-0 z-50">
        <div className="px-6 mb-10">
          <h1 className="text-xl font-bold text-[#e9c176] uppercase font-serif tracking-tight">Cinema Plus</h1>
          <p className="text-[#9a8f80] text-xs mt-1">Hệ Thống Điều Hành Báo Cáo</p>
        </div>

        <nav className="flex-1 px-2 space-y-1">
          <a className="bg-[#c5a059] text-[#261900] rounded-xl mx-2 my-1 flex items-center p-3.5 transition-all font-semibold shadow-md" href="#">
            <LayoutDashboard className="mr-3" size={18} />
            <span className="text-sm">Bảng Điều Khiển</span>
          </a>
          <a className="text-[#d1c5b4] hover:bg-[#353535]/50 hover:text-[#e9c176] rounded-xl mx-2 my-1 flex items-center p-3.5 transition-all text-sm font-medium" href="#">
            <Film className="mr-3" size={18} />
            <span>Quản Lý Phim</span>
          </a>
          <a className="text-[#d1c5b4] hover:bg-[#353535]/50 hover:text-[#e9c176] rounded-xl mx-2 my-1 flex items-center p-3.5 transition-all text-sm font-medium" href="#">
            <Ticket className="mr-3" size={18} />
            <span>Suất Chiếu & Vé</span>
          </a>
          <a className="text-[#d1c5b4] hover:bg-[#353535]/50 hover:text-[#e9c176] rounded-xl mx-2 my-1 flex items-center p-3.5 transition-all text-sm font-medium" href="#">
            <Award className="mr-3" size={18} />
            <span>Thành Viên Khách Hàng</span>
          </a>
          <a className="text-[#d1c5b4] hover:bg-[#353535]/50 hover:text-[#e9c176] rounded-xl mx-2 my-1 flex items-center p-3.5 transition-all text-sm font-medium" href="#">
            <Settings className="mr-3" size={18} />
            <span>Cài Đặt Hệ Thống</span>
          </a>
        </nav>

        <div className="px-4 py-6 border-t border-[#4e4639]/20">
          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#e9c176]/20 flex items-center justify-center border border-[#e9c176]/30 text-[#e9c176]">
              <Users size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-white truncate max-w-[140px]">{managerName}</p>
              <p className="text-[10px] text-[#e9c176] uppercase tracking-widest font-semibold mt-0.5">Trưởng Cụm Rạp</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full text-[#d1c5b4] hover:bg-red-500/10 hover:text-red-400 rounded-xl flex items-center p-3.5 transition-all text-sm font-medium cursor-pointer"
          >
            <LogOut className="mr-3" size={18} /> Đăng Xuất
          </button>
        </div>
      </aside>

      {/* HEADER */}
      <header className="bg-[#131313]/80 backdrop-blur-md sticky top-0 z-40 border-b border-[#4e4639]/30 shadow-sm flex justify-between items-center px-6 lg:pl-72 py-4 w-full h-20">
        <div className="flex items-center gap-4">
          <Menu className="lg:hidden text-white cursor-pointer" size={24} />
          <h2 className="text-xl md:text-2xl font-bold text-white font-serif tracking-wide">Tổng Quan Vận Hành Cụm Rạp</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8f80] mb-0.5" size={16} />
            <input className="bg-[#1f2020] border border-[#4e4639]/30 rounded-full py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#e9c176] transition-all w-64" placeholder="Tìm kiếm số liệu..." type="text"/>
          </div>
          <button className="w-10 h-10 flex items-center justify-center text-[#d1c5b4] hover:text-[#e9c176] transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button className="hidden sm:flex items-center gap-1.5 bg-[#e9c176] text-[#261900] px-4 py-2.5 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all cursor-pointer">
            <Plus size={16} /> Lên Lịch Chiếu Phim
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT CANVAS */}
      <main 
        className="lg:ml-64 p-6 lg:p-8 space-y-8 max-w-7xl mx-auto transition-all duration-700"
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? 'translateY(0)' : 'translateY(15px)'
        }}
      >
        
        {/* KHỐI 1: REVENUE CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#353535]/40 backdrop-blur-xl border border-[#e9c176]/10 p-6 rounded-2xl relative overflow-hidden group shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[#d1c5b4] text-xs font-bold uppercase tracking-wider">Doanh Thu Vé Xem Phim</p>
                <h3 className="text-3xl font-bold text-white mt-1.5 font-mono">${metrics.ticketSales}</h3>
                <p className="text-green-400 text-xs mt-1.5 flex items-center font-medium">
                  <TrendingUp size={14} className="mr-1" /> +12.4% so với tuần trước
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#e9c176]/10 text-[#e9c176]">
                <Ticket size={22} />
              </div>
            </div>
            <div className="h-14 w-full flex items-end gap-1.5 pt-2">
              {[30, 45, 25, 60, 40, 85, 75].map((h, i) => (
                <div key={i} className="flex-1 bg-[#e9c176]/20 group-hover:bg-[#e9c176]/40 transition-all rounded-t-md" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>

          <div className="bg-[#353535]/40 backdrop-blur-xl border border-[#e9c176]/10 p-6 rounded-2xl relative overflow-hidden group shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[#d1c5b4] text-xs font-bold uppercase tracking-wider">Doanh Thu Bỏng Nước (F&B)</p>
                <h3 className="text-3xl font-bold text-white mt-1.5 font-mono">${metrics.fbRevenue}</h3>
                <p className="text-[#a4c9ff] text-xs mt-1.5 flex items-center font-medium">
                  <TrendingUp size={14} className="mr-1" /> +4.1% so với tuần trước
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#a4c9ff]/10 text-[#a4c9ff]">
                <Utensils size={22} />
              </div>
            </div>
            <div className="h-14 w-full flex items-end gap-1.5 pt-2">
              {[20, 55, 35, 42, 80, 50, 70].map((h, i) => (
                <div key={i} className="flex-1 bg-[#a4c9ff]/20 group-hover:bg-[#a4c9ff]/40 transition-all rounded-t-md" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>

          <div className="bg-[#353535]/40 backdrop-blur-xl border border-[#e9c176]/10 p-6 rounded-2xl relative overflow-hidden group shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[#d1c5b4] text-xs font-bold uppercase tracking-wider">Tỷ Lệ Ghế Có Khách Trung Bình</p>
                <h3 className="text-3xl font-bold text-[#e9c176] mt-1.5 font-mono">{metrics.avgOccupancy}%</h3>
                <p className="text-xs mt-2 font-medium text-[#d1c5b4]">Cao điểm hôm nay: <span className="text-[#e9c176] font-bold">94%</span> (Phòng 3)</p>
              </div>
              <div className="p-3 rounded-xl bg-[#e9c176]/10 text-[#e9c176]">
                <Armchair size={22} />
              </div>
            </div>
            <div className="h-14 w-full flex items-center justify-center pt-2">
              <svg className="w-full h-8" viewBox="0 0 100 20">
                <path d="M0 15 Q 10 5, 20 12 T 40 8 T 60 15 T 80 5 T 100 12" fill="none" stroke="#e9c176" strokeWidth="2.5"></path>
              </svg>
            </div>
          </div>
        </section>

        {/* KHỐI 2: TIMELINE GRID */}
        <section className="bg-[#353535]/40 backdrop-blur-xl border border-[#e9c176]/10 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-6 border-b border-[#4e4639]/20 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-white font-serif tracking-wide">Trục Thời Gian Suất Chiếu Hàng Daily</h3>
              <p className="text-[#9a8f80] text-xs mt-0.5">Dữ liệu phân bổ hôm nay trên toàn bộ hệ thống Phòng Chiếu (5 phòng)</p>
            </div>
            <div className="flex bg-[#1f2020] rounded-xl p-1 border border-[#4e4639]/20">
              <button className="px-4 py-1.5 text-xs font-bold bg-[#e9c176] text-[#261900] rounded-lg">Dạng Trục</button>
              <button className="px-4 py-1.5 text-xs font-bold text-[#d1c5b4] hover:text-white rounded-lg">Dạng Danh Sách</button>
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-hidden">
            <div className="min-w-[1000px] p-6 relative">
              <div className="flex mb-4 border-b border-[#4e4639]/20 pb-2.5 ml-20">
                {['10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM', '12 AM'].map((time) => (
                  <div key={time} className="flex-1 text-center text-[11px] text-[#9a8f80] font-bold tracking-wider">{time}</div>
                ))}
              </div>

              <div className="space-y-5">
                <div className="flex items-center">
                  <div className="w-20 pr-4 text-right shrink-0">
                    <span className="text-sm font-bold text-white block">Phòng 1</span>
                    <span className="text-[10px] text-[#e9c176] font-semibold uppercase tracking-widest">IMAX</span>
                  </div>
                  <div className="flex-1 h-16 bg-[#1b1c1c] rounded-xl relative overflow-hidden border border-[#4e4639]/20">
                    <div className="absolute left-[5%] w-[18%] h-full bg-[#e9c176]/10 border-l-4 border-[#e9c176] p-2.5 cursor-pointer hover:bg-[#e9c176]/20 transition-all flex flex-col justify-center">
                      <span className="text-xs font-bold text-white truncate">Oppenheimer</span>
                      <span className="text-[10px] text-[#9a8f80] mt-0.5">10:30 - 13:40</span>
                    </div>
                    <div className="absolute left-[25%] w-[18%] h-full bg-[#e9c176]/10 border-l-4 border-[#e9c176] p-2.5 cursor-pointer hover:bg-[#e9c176]/20 transition-all flex flex-col justify-center">
                      <span className="text-xs font-bold text-white truncate">Oppenheimer</span>
                      <span className="text-[10px] text-[#9a8f80] mt-0.5">14:10 - 17:20</span>
                    </div>
                    <div className="absolute left-[47%] w-[18%] h-full bg-[#a4c9ff]/10 border-l-4 border-[#a4c9ff] p-2.5 cursor-pointer hover:bg-[#a4c9ff]/20 transition-all flex flex-col justify-center">
                      <span className="text-xs font-bold text-white truncate">Dune: Phần Hai</span>
                      <span className="text-[10px] text-[#9a8f80] mt-0.5">18:00 - 20:45</span>
                    </div>
                    <div className="absolute left-[68%] w-[18%] h-full bg-[#a4c9ff]/10 border-l-4 border-[#a4c9ff] p-2.5 cursor-pointer hover:bg-[#a4c9ff]/20 transition-all flex flex-col justify-center">
                      <span className="text-xs font-bold text-white truncate">Dune: Phần Hai</span>
                      <span className="text-[10px] text-[#9a8f80] mt-0.5">21:15 - 00:00</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-20 pr-4 text-right shrink-0">
                    <span className="text-sm font-bold text-white block">Phòng 2</span>
                    <span className="text-[10px] text-[#a4c9ff] font-semibold uppercase tracking-widest">4DX</span>
                  </div>
                  <div className="flex-1 h-16 bg-[#1b1c1c] rounded-xl relative overflow-hidden border border-[#4e4639]/20">
                    <div className="absolute left-[12%] w-[15%] h-full bg-red-500/10 border-l-4 border-red-500 p-2.5 cursor-pointer hover:bg-red-500/20 transition-all flex flex-col justify-center">
                      <span className="text-xs font-bold text-white truncate">Gran Turismo</span>
                      <span className="text-[10px] text-[#9a8f80] mt-0.5">11:00 - 13:15</span>
                    </div>
                    <div className="absolute left-[32%] w-[15%] h-full bg-red-500/10 border-l-4 border-red-500 p-2.5 cursor-pointer hover:bg-red-500/20 transition-all flex flex-col justify-center">
                      <span className="text-xs font-bold text-white truncate">Gran Turismo</span>
                      <span className="text-[10px] text-[#9a8f80] mt-0.5">14:00 - 16:15</span>
                    </div>
                    <div className="absolute left-[52%] w-[16%] h-full bg-purple-500/10 border-l-4 border-purple-400 p-2.5 cursor-pointer hover:bg-purple-500/20 transition-all flex flex-col justify-center">
                      <span className="text-xs font-bold text-white truncate">Poor Things</span>
                      <span className="text-[10px] text-[#9a8f80] mt-0.5">17:30 - 19:50</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-20 pr-4 text-right shrink-0">
                    <span className="text-sm font-bold text-white block">Phòng 3</span>
                    <span className="text-[10px] text-[#b0c6f9] font-semibold uppercase tracking-widest">Luxury</span>
                  </div>
                  <div className="flex-1 h-16 bg-[#1b1c1c] rounded-xl relative overflow-hidden border border-[#4e4639]/20">
                    <div className="absolute left-[35%] w-[42%] h-full bg-[#e9c176]/5 border-l-4 border-[#e9c176]/40 border-dashed p-2.5 cursor-pointer hover:bg-[#e9c176]/10 transition-all flex flex-col justify-center">
                      <span className="text-xs font-bold text-[#e9c176] truncate">Sự Kiện Thuê Rạp Riêng: Sony Corp</span>
                      <span className="text-[10px] text-[#9a8f80] mt-0.5">14:00 - 20:00</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* KHỐI 3: INVENTORY & QUICK ACTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="bg-[#353535]/40 backdrop-blur-xl border border-[#e9c176]/10 p-6 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white font-serif">Hệ Thống Giám Sát Kho Vật Tư</h3>
              <button className="text-[#e9c176] text-xs font-bold hover:underline cursor-pointer">Quản Lý Nhập Kho</button>
            </div>
            
            <div className="space-y-5">
              {inventory.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1.5 font-medium">
                    <span className="text-[#d1c5b4]">{item.name}</span>
                    <span className={item.status === 'Low' ? 'text-red-400 font-bold' : item.status === 'Warning' ? 'text-[#a4c9ff] font-bold' : 'text-white'}>
                      {item.ratio}% {item.status === 'Low' && ' - Sắp Hết'}
                    </span>
                  </div>
                  <div className="w-full bg-[#353535] rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${item.status === 'Low' ? 'bg-red-500' : item.status === 'Warning' ? 'bg-[#0164b4]' : 'bg-[#e9c176]'}`}
                      style={{ width: `${item.ratio}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* QUICK ACTIONS BUTTONS */}
          <section className="grid grid-cols-2 gap-4">
            <button className="bg-[#353535]/40 border border-[#e9c176]/10 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-[#e9c176]/10 transition-colors group cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-[#e9c176]/10 flex items-center justify-center text-[#e9c176] group-hover:scale-110 transition-transform">
                <Printer size={22} />
              </div>
              <span className="text-sm font-bold text-white">Xuất Báo Cáo Doanh Thu</span>
            </button>
            <button className="bg-[#353535]/40 border border-[#e9c176]/10 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-[#a4c9ff]/10 transition-colors group cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-[#a4c9ff]/10 flex items-center justify-center text-[#a4c9ff] group-hover:scale-110 transition-transform">
                <Users size={22} />
              </div>
              <span className="text-sm font-bold text-white">Xếp Ca Làm Nhân Viên</span>
            </button>
            <button className="bg-[#353535]/40 border border-[#e9c176]/10 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-red-500/10 border-red-500/20 text-red-400 transition-colors group cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                <AlertTriangle size={22} />
              </div>
              <span className="text-sm font-bold text-white">Phát Cảnh Báo Khân</span>
            </button>
            <button className="bg-[#353535]/40 border border-[#e9c176]/10 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-[#353535] transition-colors group cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-[#353535] flex items-center justify-center text-[#d1c5b4] group-hover:scale-110 transition-transform">
                <Monitor size={22} />
              </div>
              <span className="text-sm font-bold text-white">Tổng Đài Kỹ Thuật</span>
            </button>
          </section>
        </div>

        {/* KHỐI 4: LIVE SEAT DENSITY */}
        <section className="bg-[#353535]/40 backdrop-blur-xl border border-[#e9c176]/10 p-6 md:p-8 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-white font-serif tracking-wide">Mật Độ Khán Giả Trực Tuyến (Live)</h3>
              <p className="text-[#9a8f80] text-xs mt-0.5">Trạng thái số lượng ghế đang có người ngồi tại các phòng chiếu thời điểm hiện tại</p>
            </div>
            <div className="flex items-center gap-2 bg-[#e9c176]/10 border border-[#e9c176]/30 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#e9c176]">
              <div className="w-2 h-2 rounded-full bg-[#e9c176] animate-pulse"></div>
              <span>Theo Dõi Real-time</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
            <div className="space-y-2.5 text-center">
              <div className="aspect-square bg-[#1f2020] rounded-xl p-3 flex flex-wrap gap-1.5 items-center justify-center content-center border border-[#4e4639]/20">
                {[1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1].map((dot, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${dot === 1 ? 'bg-[#e9c176]' : 'bg-[#4e4639]'}`}></div>
                ))}
              </div>
              <p className="font-bold text-white text-sm">Phòng Chiếu 1</p>
              <span className="text-xs text-[#e9c176] font-semibold">Đã Đặt 75%</span>
            </div>

            <div className="space-y-2.5 text-center">
              <div className="aspect-square bg-[#1f2020] rounded-xl p-3 flex flex-wrap gap-1.5 items-center justify-center content-center border border-[#4e4639]/20">
                {[1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1].map((dot, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${dot === 1 ? 'bg-[#e9c176]' : 'bg-[#4e4639]'}`}></div>
                ))}
              </div>
              <p className="font-bold text-white text-sm">Phòng Chiếu 2</p>
              <span className="text-xs text-[#e9c176] font-semibold">Đã Đặt 92%</span>
            </div>

            <div className="space-y-2.5 text-center">
              <div className="aspect-square bg-[#1f2020] rounded-xl p-3 flex flex-wrap gap-1.5 items-center justify-center content-center border border-[#e9c176]/30">
                {[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1].map((dot, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-[#a4c9ff]"></div>
                ))}
              </div>
              <p className="font-bold text-white text-sm">Phòng Chiếu 3</p>
              <span className="text-xs text-[#a4c9ff] font-bold">Kín Ghế 100%</span>
            </div>

            <div className="space-y-2.5 text-center opacity-40">
              <div className="aspect-square bg-[#1f2020] rounded-xl p-3 flex items-center justify-center border border-[#4e4639]/20">
                <AlertTriangle size={24} className="text-[#9a8f80]" />
              </div>
              <p className="font-bold text-white text-sm">Phòng Chiếu 4</p>
              <span className="text-xs text-[#9a8f80] font-semibold">Đang Dọn Dẹp</span>
            </div>

            <div className="space-y-2.5 text-center">
              <div className="aspect-square bg-[#1f2020] rounded-xl p-3 flex flex-wrap gap-1.5 items-center justify-center content-center border border-[#4e4639]/20">
                {[1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0].map((dot, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${dot === 1 ? 'bg-[#e9c176]' : 'bg-[#4e4639]'}`}></div>
                ))}
              </div>
              <p className="font-bold text-white text-sm">Phòng Chiếu 5</p>
              <span className="text-xs text-[#e9c176] font-semibold">Đã Đặt 45%</span>
            </div>
          </div>
        </section>

      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 w-full lg:hidden bg-[#1f2020]/90 backdrop-blur-xl border-t border-[#4e4639]/30 shadow-lg flex justify-around items-center py-3 z-50 rounded-t-2xl">
        <a className="flex flex-col items-center justify-center text-[#e9c176] font-bold text-xs" href="#">
          <LayoutDashboard size={20} /> <span className="mt-1">Tổng Quan</span>
        </a>
        <a className="flex flex-col items-center justify-center text-[#9a8f80] text-xs hover:text-white" href="#">
          <Ticket size={20} /> <span className="mt-1">Vé Suất</span>
        </a>
        <a className="flex flex-col items-center justify-center text-[#9a8f80] text-xs hover:text-white" href="#">
          <Users size={20} /> <span className="mt-1">Nhân Sự</span>
        </a>
      </nav>

    </div>
  );
}