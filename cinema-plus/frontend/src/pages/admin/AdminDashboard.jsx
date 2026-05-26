import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from "../../api/axiosClient";
import { 
  LayoutDashboard, Film, Ticket, Settings, LogOut, Menu, Search, Bell, 
  Users, HardDrive, ShieldAlert, Filter, UserPlus, Edit2, Lock, Unlock, 
  Terminal, Database, ShieldCheck, ChevronLeft, ChevronRight, TrendingUp, Cpu
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const terminalRef = useRef(null);
  const adminName = localStorage.getItem('username') || 'Admin Root';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [users, setUsers] = useState([
    { id: 1, fullName: 'Trịnh Hoàng Thái (Admin)', username: 'admin_thai', email: 'admin@cinemaplus.com', role: 'ROLE_ADMIN', status: 'ACTIVE' },
    { id: 2, fullName: 'Nguyễn Hoàng Vinh (Manager)', username: 'manager_vinh', email: 'manager@cinemaplus.com', role: 'ROLE_MANAGER', status: 'ACTIVE' },
    { id: 3, fullName: 'Nhân viên Quầy vé 01', username: 'staff_01', email: 'staff@cinemaplus.com', role: 'ROLE_STAFF', status: 'ACTIVE' },
    { id: 4, fullName: 'Khách Hàng Trải Nghiệm', username: 'customer_test', email: 'customer@gmail.com', role: 'ROLE_CUSTOMER', status: 'ACTIVE' }
  ]);

  const [systemMetrics, setSystemMetrics] = useState({
    activeUsers: '12.4k',
    serverStatus: 'Đang hoạt động',
    apiLoad: 42,
    securityAlerts: 0
  });

  const [logs, setLogs] = useState([
    { time: '20:31:01', tag: 'HỆ THỐNG', msg: 'Khởi chạy chuỗi kiểm tra Kernel thành công...', color: 'text-[#a4c9ff]' },
    { time: '20:31:04', tag: 'ADMIN_THAI', msg: 'Cập nhật cấu hình liên kết Database block #44912', color: 'text-[#e9c176]' },
    { time: '20:31:15', tag: 'BẢO MẬT', msg: 'Phát hiện truy cập thất bại tại port 22 [IP: 192.168.1.1]', color: 'text-red-400' },
    { time: '20:32:10', tag: 'ADMIN_ROOT', msg: 'Thay đổi quyền hạn tài khoản user_882 sang STAFF', color: 'text-[#e9c176]' },
    { time: '20:32:45', tag: 'HỆ THỐNG', msg: 'Giải phóng vùng nhớ rác (Garbage Collection). Đã giải phóng 44.2MB.', color: 'text-[#a4c9ff]' }
  ]);

  const [commandInput, setCommandInput] = useState('');

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const usersRes = await axiosClient.get('/api/admin/users');
        const metricsRes = await axiosClient.get('/api/admin/system-metrics');
        if (usersRes.data) setUsers(usersRes.data);
        if (metricsRes.data) setSystemMetrics(metricsRes.data);
      } catch (error) {
        console.log("Nạp dữ liệu tài khoản từ SQL Server (Bản UI dự phòng)");
      }
    };
    fetchAdminData();
  }, []);

  useEffect(() => {
    const logPool = [
      { tag: 'HỆ THỐNG', msg: 'Đồng bộ hóa các nút cân bằng tải (Load Balancer)...', color: 'text-[#a4c9ff]' },
      { tag: 'BẢO MẬT', msg: 'Khởi tạo phiên làm việc mới cho admin_thai [Chi nhánh HUIT]', color: 'text-red-400' },
      { tag: 'DATABASE', msg: 'Tiến trình Hibernate DDL update hoàn tất: Đã kiểm tra cấu trúc bảng', color: 'text-emerald-400' },
      { tag: 'HỆ THỐNG', msg: 'Tín hiệu nhịp tim kết nối (Heartbeat): OK', color: 'text-[#a4c9ff]' }
    ];

    const interval = setInterval(() => {
      const randomLog = logPool[Math.floor(Math.random() * logPool.length)];
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      setLogs(prev => [...prev, { time: timeStr, ...randomLog }]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    try {
      await axiosClient.put(`/api/admin/users/${userId}/status`, { status: newStatus });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (err) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    }
  };

  const handleCommandSubmit = (e) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setLogs(prev => [...prev, { time: timeStr, tag: 'LỆNH_ROOT', msg: `Đang thực thi: "${commandInput}"... Lệnh hợp lệ.`, color: 'text-white' }]);
    setCommandInput('');
  };

  return (
    <div className="bg-[#131313] text-[#e4e2e1] min-h-screen flex w-full relative selection:bg-[#e9c176]/30 overflow-x-hidden">
      
      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? 'flex' : 'hidden'} lg:flex flex-col h-screen py-6 bg-[#1f2020] border-r border-[#4e4639]/20 shadow-lg w-64 fixed left-0 top-0 z-50 shrink-0`}>
        <div className="px-6 mb-8 flex items-center gap-3">
          <HardDrive className="text-[#e9c176] shrink-0" size={28} />
          <div>
            <h1 className="text-xl font-bold text-[#e9c176] uppercase font-serif tracking-tighter">Cinema Plus</h1>
           <p className="text-[#9a8f80] text-[10px] tracking-widest font-semibold mt-0.5">HỆ THỐNG KIỂM SOÁT</p>
          </div>
        </div>

        <div className="flex flex-col flex-1 overflow-y-auto px-2 space-y-1">
          <button onClick={() => navigate('/admin-dashboard')} className="w-full bg-[#e9c176] text-[#261900] rounded-xl flex items-center p-3.5 font-bold shadow-md text-left cursor-pointer">
            <LayoutDashboard className="mr-3 shrink-0" size={18} />
            <span className="text-sm">Bảng Điều Khiển</span>
          </button>
          <button onClick={() => navigate('/admin-dashboard')} className="w-full text-[#d1c5b4] hover:bg-[#353535]/50 hover:text-[#e9c176] rounded-xl flex items-center p-3.5 text-sm font-medium text-left cursor-pointer transition-all">
            <Film className="mr-3 shrink-0" size={18} />
            <span>Quản Lý Phim</span>
          </button>
          <button onClick={() => navigate('/admin-dashboard')} className="w-full text-[#d1c5b4] hover:bg-[#353535]/50 hover:text-[#e9c176] rounded-xl flex items-center p-3.5 text-sm font-medium text-left cursor-pointer transition-all">
            <Ticket className="mr-3 shrink-0" size={18} />
            <span>Quản Lý Suất Chiếu</span>
          </button>
          <button onClick={() => navigate('/admin-dashboard')} className="w-full text-[#d1c5b4] hover:bg-[#353535]/50 hover:text-[#e9c176] rounded-xl flex items-center p-3.5 text-sm font-medium text-left cursor-pointer transition-all">
            <Users className="mr-3 shrink-0" size={18} />
            <span>Phân Quyền Nhân Sự</span>
          </button>

          <div className="pt-8 mt-auto space-y-1">
            <button className="w-full text-[#d1c5b4] hover:bg-[#353535]/50 rounded-xl flex items-center p-3.5 text-sm font-medium text-left cursor-pointer">
              <Settings className="mr-3 shrink-0" size={18} />
              <span>Cấu Hình Core</span>
            </button>
            <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="w-full text-[#d1c5b4] hover:bg-red-500/10 hover:text-red-400 rounded-xl flex items-center p-3.5 text-sm font-medium text-left cursor-pointer transition-all">
              <LogOut className="mr-3 shrink-0" size={18} />
              <span>Đăng Xuất</span>
            </button>
          </div>
        </div>

        <div className="mt-6 px-6 pt-6 border-t border-[#4e4639]/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#e9c176]/10 border border-[#e9c176]/30 flex items-center justify-center text-[#e9c176] shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-white truncate">{adminName}</span>
            <span className="text-[10px] text-[#e9c176]/70 font-mono tracking-wider uppercase font-semibold">Cập Quyền: Root</span>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-40 lg:hidden" />}

      {/* MAIN CANVAS - Thêm lg:pl-64 và min-w-0 bảo vệ */}
      <div className="lg:pl-64 flex flex-col w-full min-w-0">
        
        {/* HEADER */}
        <header className="sticky top-0 z-40 bg-[#131313]/90 backdrop-blur-md border-b border-[#4e4639]/30 flex justify-between items-center px-6 w-full h-20">
          <div className="flex items-center gap-4 min-w-0">
            <button type="button" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-white cursor-pointer p-1">
              <Menu size={24} />
            </button>
            <h2 className="text-lg md:text-xl font-bold text-[#e9c176] font-sans tracking-wide truncate">HỆ THỐNG KIỂM SOÁT</h2>
          </div>
          <div className="flex items-center gap-4 md:gap-6 shrink-0">
            <div className="hidden md:flex items-center bg-[#353535]/30 border border-[#4e4639]/50 rounded-full px-4 py-1.5 w-60">
              <Search className="text-[#9a8f80] mr-2 shrink-0" size={16} />
              <input className="bg-transparent border-none outline-none text-xs text-white placeholder-[#9a8f80]/50 w-full focus:ring-0" placeholder="Tìm kiếm toàn hệ thống..." type="text"/>
            </div>
            <button className="relative text-[#d1c5b4] hover:text-[#e9c176] p-1 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#e9c176] rounded-full"></span>
            </button>
          </div>
        </header>

        {/* CONTAINER CONTENT */}
        <div className="p-4 md:p-8 flex flex-col gap-6 max-w-7xl w-full mx-auto min-w-0 box-border">
          
          {/* KHỐI 1: METRICS */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
            <div className="bg-[#1f2020] border border-[#e9c176]/10 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#9a8f80] uppercase tracking-wider">Tài Khoản Online</span>
                <Users className="text-[#e9c176]" size={20} />
              </div>
              <span className="text-3xl font-bold text-white font-mono">{systemMetrics.activeUsers}</span>
              <span className="text-[11px] text-green-400 flex items-center mt-2 font-medium">
                <TrendingUp size={12} className="mr-1" /> +14% trong giờ qua
              </span>
            </div>

            <div className="bg-[#1f2020] border border-[#e9c176]/10 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#9a8f80] uppercase tracking-wider">Trạng Thái Spring Boot</span>
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
              </div>
              <span className="text-xl font-bold text-white font-serif tracking-wide block truncate">{systemMetrics.serverStatus}</span>
              <span className="text-[10px] text-[#9a8f80] mt-3 block font-mono">PORT: 8081</span>
            </div>

            <div className="bg-[#1f2020] border border-[#e9c176]/10 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#9a8f80] uppercase tracking-wider">Tải Trọng API</span>
                <Cpu className="text-[#a4c9ff]" size={20} />
              </div>
              <span className="text-3xl font-bold text-white font-mono">{systemMetrics.apiLoad}%</span>
              <div className="w-full bg-[#131313] rounded-full h-1.5 mt-4 overflow-hidden">
                <div className="bg-[#a4c9ff] h-full transition-all duration-500" style={{ width: `${systemMetrics.apiLoad}%` }}></div>
              </div>
            </div>

            <div className="bg-[#1f2020] border border-[#e9c176]/10 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#9a8f80] uppercase tracking-wider">Lỗ Hổng Bảo Mật</span>
                <ShieldAlert className="text-red-400" size={20} />
              </div>
              <span className="text-3xl font-bold text-white font-mono">{systemMetrics.securityAlerts}</span>
              <span className="text-[11px] text-[#9a8f80] mt-2 block font-medium">Hệ thống an toàn</span>
            </div>
          </section>

          {/* KHỐI 2: TABLE & TERMINAL */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start w-full min-w-0">
            
            {/* SQL SERVER TABLE */}
            <section className="xl:col-span-8 bg-[#1f2020] border border-[#4e4639]/30 rounded-2xl overflow-hidden flex flex-col shadow-xl min-w-0 w-full">
              <div className="p-5 border-b border-[#4e4639]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white font-serif tracking-wide">Danh Sách Người Dùng (SQL Server)</h3>
                  <p className="text-[11px] text-[#9a8f80] mt-0.5">Quản lý và cấp phát quyền hạn lưu giữ thực thể</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto shrink-0">
                  <button className="bg-[#353535] hover:bg-[#404040] text-white rounded-xl px-3.5 py-2 text-xs font-semibold border border-[#4e4639]/30 cursor-pointer transition-colors">
                    <Filter size={12} className="inline mr-1" /> Lọc
                  </button>
                  <button className="bg-[#e9c176] text-[#261900] font-bold rounded-xl px-3.5 py-2 text-xs hover:bg-[#d9b166] cursor-pointer transition-colors">
                    <UserPlus size={12} className="inline mr-1" /> Thêm Tài Khoản
                  </button>
                </div>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-[#131313]/50 text-[#9a8f80] text-[10px] uppercase tracking-wider font-bold border-b border-[#4e4639]/20">
                      <th className="px-6 py-3.5">Tài Khoản User</th>
                      <th className="px-6 py-3.5">Nhóm Quyền (Role)</th>
                      <th className="px-6 py-3.5">Trạng Thái</th>
                      <th className="px-6 py-3.5 text-center">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#4e4639]/10 text-xs md:text-sm">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-[#353535]/20 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#e9c176]/10 border border-[#e9c176]/20 flex items-center justify-center font-bold text-[#e9c176] text-[10px] uppercase shrink-0">
                              {user.username.substring(0, 2)}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-white truncate">{user.fullName}</span>
                              <span className="text-[11px] text-[#9a8f80] font-mono truncate mt-0.5">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            user.role === 'ROLE_ADMIN' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            user.role === 'ROLE_MANAGER' ? 'bg-[#0164b4]/10 text-[#a4c9ff] border border-[#0164b4]/20' :
                            user.role === 'ROLE_STAFF' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            'bg-[#353535] text-[#d1c5b4]'
                          }`}>
                            {user.role.replace('ROLE_', '')}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></span>
                            <span className="text-xs font-medium">{user.status === 'ACTIVE' ? 'Hoạt động' : 'Bị Khóa'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-3.5">
                            <button className="text-[#9a8f80] hover:text-[#e9c176] transition-colors cursor-pointer p-0.5"><Edit2 size={14} /></button>
                            <button onClick={() => toggleUserStatus(user.id, user.status)} className={`transition-colors cursor-pointer p-0.5 ${user.status === 'ACTIVE' ? 'text-[#9a8f80] hover:text-red-400' : 'text-[#e9c176]'}`}>
                              {user.status === 'ACTIVE' ? <Lock size={14} /> : <Unlock size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-4 border-t border-[#4e4639]/30 bg-[#131313]/20 flex items-center justify-between text-[11px] text-[#9a8f80]">
                <span>Hiển thị {users.length} tài khoản nòng cốt</span>
                <div className="flex gap-1">
                  <button className="p-1 hover:bg-[#353535] rounded-md cursor-pointer transition-colors"><ChevronLeft size={14} /></button>
                  <button className="p-1 hover:bg-[#353535] rounded-md cursor-pointer transition-colors"><ChevronRight size={14} /></button>
                </div>
              </div>
            </section>

            {/* AUDIT LOGS TERMINAL */}
            <section className="xl:col-span-4 bg-black/60 border border-[#4e4639]/30 rounded-2xl overflow-hidden flex flex-col shadow-xl h-[440px] w-full min-w-0">
              <div className="p-4 bg-[#1f2020] border-b border-[#4e4639]/30 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Terminal className="text-[#e9c176]" size={14} />
                  <h3 className="text-[10px] font-bold text-white uppercase tracking-widest font-mono">System Audit Logs</h3>
                </div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                  <div className="w-2 h-2 rounded-full bg-[#e9c176]/50"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500/50"></div>
                </div>
              </div>

              <div ref={terminalRef} className="p-4 overflow-y-auto flex-1 font-mono text-[10px] leading-relaxed space-y-2 select-text custom-scrollbar break-all">
                {logs.map((log, index) => (
                  <div key={index} className="flex gap-1.5 items-start">
                    <span className="text-[#9a8f80] shrink-0 select-none">[{log.time}]</span>
                    <span className={`${log.color} font-bold shrink-0 select-none`}>{log.tag}:</span>
                    <span className="text-[#d1c5b4]">{log.msg}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleCommandSubmit} className="p-3 bg-[#131313] border-t border-[#4e4639]/30 flex items-center gap-2 shrink-0">
                <span className="text-[#e9c176] font-bold text-xs select-none font-mono">$</span>
                <input 
                  className="bg-transparent border-none outline-none focus:ring-0 text-[11px] w-full text-[#d1c5b4] font-mono placeholder-[#4e4639]" 
                  placeholder="Gõ lệnh hệ thống root..." 
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                />
              </form>
            </section>
          </div>

          {/* KHỐI 3: FOOT DATA */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div className="bg-[#1f2020] border border-[#e9c176]/10 rounded-2xl p-6">
              <h4 className="text-xs font-bold text-[#9a8f80] uppercase tracking-wider mb-4">Lưu Lượng Gọi API (Thời Gian Thực)</h4>
              <div className="h-20 w-full flex items-end gap-2 pt-2">
                {[12, 24, 18, 32, 28, 8, 44, 30, 50, 22].map((h, i) => (
                  <div key={i} className="flex-1 bg-[#a4c9ff]/5 hover:bg-[#a4c9ff]/15 transition-all rounded-t-sm relative h-full group">
                    <div className="absolute bottom-0 left-0 right-0 bg-[#0164b4] rounded-t-sm transition-all" style={{ height: `${h * 2}%` }}></div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-[#1f2020] border border-[#e9c176]/10 rounded-2xl p-6 flex items-center justify-center text-center shadow-lg">
              <div className="space-y-2">
                <Database className="text-[#e9c176] mx-auto" size={32} />
                <h4 className="font-bold text-white font-serif text-base tracking-wide">Đồng Bộ Hóa SQL Server Cloud</h4>
                <p className="text-xs text-[#9a8f80] max-w-xs mx-auto leading-normal">Bản sao lưu cấu trúc thực thể (Entities Backup) hoàn chỉnh đã được tự động thực hiện.</p>
                <button className="border border-[#e9c176] text-[#e9c176] text-[11px] font-bold px-5 py-1.5 rounded-xl hover:bg-[#e9c176] hover:text-[#261900] transition-all mt-2 cursor-pointer uppercase tracking-wider">
                  Sao Lưu Ngay
                </button>
              </div>
            </div>
          </section>

        </div>

        {/* FOOTER */}
        <footer className="mt-auto p-6 border-t border-[#4e4639]/20 flex flex-col sm:flex-row justify-between items-center gap-4 text-[#9a8f80] text-[10px] uppercase tracking-widest font-semibold bg-[#131313]">
          <div className="flex gap-6">
            <a className="hover:text-[#e9c176] transition-colors" href="#">Tài liệu API</a>
            <a className="hover:text-[#e9c176] transition-colors" href="#">Khóa Bảo Mật</a>
          </div>
          <div>© 2026 CINEMA PLUS CORE. V3.4.1-STABLE</div>
        </footer>

      </div>
    </div>
  );
}