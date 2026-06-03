import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from "../../api/axiosClient";
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { 
  LayoutDashboard, Film, Ticket, Settings, LogOut, Menu, Search, Bell, 
  Users, HardDrive, ShieldAlert, Filter, UserPlus, Edit2, Lock, Unlock, 
  Terminal, Database, ShieldCheck, ChevronLeft, ChevronRight, TrendingUp, Cpu,
  Plus, Trash2, Upload, Armchair, Check, Calendar, Clock, Image, Video
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const terminalRef = useRef(null);
  const adminName = localStorage.getItem('username') || 'Admin Root';
  
  // Navigation & Sub-views tabs
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'movies', 'screens'

  // ==========================================
  // STATE DEFINITIONS
  // ==========================================
  // Tab 1: Dashboard States
  const [users, setUsers] = useState([]);
  const [systemMetrics, setSystemMetrics] = useState({
    activeUsers: '12.4k',
    serverStatus: 'Đang hoạt động',
    apiLoad: 35,
    securityAlerts: 0
  });
  const [logs, setLogs] = useState([]);

  // Tab 2: Movie Management States
  const [movies, setMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMovieModal, setShowMovieModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [movieForm, setMovieForm] = useState({
    title: '',
    description: '',
    duration: 120,
    releaseDate: '',
    endDate: '',
    posterUrl: '',
    trailerUrl: '',
    ageRating: 'T13',
    status: 'NOW_SHOWING',
    format: '2D'
  });

  // Tab 3: Screen & Seat Matrix States
  const [screens, setScreens] = useState([]);
  const [selectedScreen, setSelectedScreen] = useState(null);
  const [seats, setSeats] = useState([]);
  const [generatingSeats, setGeneratingSeats] = useState(false);
  const [showAddScreenModal, setShowAddScreenModal] = useState(false);
  const [newScreenName, setNewScreenName] = useState('');
  const [selectedCinemaId, setSelectedCinemaId] = useState(1);

  // ==========================================
  // REAL-TIME WEBSOCKET (STOMP) & INITIAL LOADS
  // ==========================================
  useEffect(() => {
    // 1. Fetch initial records
    fetchUsers();
    fetchMovies();
    fetchScreens();

    // 2. Establish live WebSocket STOMP connection for real-time audit logs
    const socket = new SockJS('http://localhost:8081/ws-cinema');
    const stompClient = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log("[STOMP]", str),
      onConnect: () => {
        console.log("🔔 [AUDIT WEBSOCKET] Connected successfully!");
        setLogs(prev => [
          ...prev,
          { 
            time: getFormattedTime(new Date()), 
            tag: 'HỆ THỐNG', 
            msg: 'Kết nối WebSocket kiểm tra lịch sử Audit logs thành công!', 
            color: 'text-emerald-400 font-semibold' 
          }
        ]);

        // Subscribe to real-time logs topic broadcasted by Spring AOP aspect
        stompClient.subscribe('/topic/logs', (message) => {
          const logPayload = JSON.parse(message.body);
          const logTime = logPayload.timestamp 
            ? getFormattedTime(new Date(logPayload.timestamp)) 
            : getFormattedTime(new Date());

          setLogs(prev => [
            ...prev,
            {
              time: logTime,
              tag: logPayload.username || 'ANONYMOUS',
              msg: `${logPayload.httpMethod} ${logPayload.uri} -> ${logPayload.actionName}`,
              color: logPayload.httpMethod === 'DELETE' ? 'text-red-400 font-bold' : 
                     logPayload.httpMethod === 'POST' ? 'text-emerald-400 font-medium' : 'text-[#e9c176]'
            }
          ]);
        });
      },
      onDisconnect: () => {
        console.log("❌ [AUDIT WEBSOCKET] Disconnected.");
      }
    });

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, []);

  // Auto-scroll terminal logs
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  // ==========================================
  // API FETCH & CORE FUNCTIONS
  // ==========================================
  const fetchUsers = async () => {
    try {
      const res = await axiosClient.get('/api/admin/users');
      if (res.data) setUsers(res.data);
    } catch (error) {
      console.error("Nạp dữ liệu tài khoản thất bại, sử dụng bản demo:", error);
    }
  };

  const fetchMovies = async () => {
    try {
      const res = await axiosClient.get('/api/admin/movies');
      if (res.data) setMovies(res.data);
    } catch (error) {
      console.error("Nạp dữ liệu phim thất bại:", error);
    }
  };

  const fetchScreens = async () => {
    try {
      const res = await axiosClient.get('/api/admin/screens');
      if (res.data) {
        setScreens(res.data);
        if (res.data.length > 0 && !selectedScreen) {
          handleSelectScreen(res.data[0]);
        }
      }
    } catch (error) {
      console.error("Nạp danh sách phòng chiếu thất bại:", error);
    }
  };

  // Toggle user active status using secure PATCH endpoint
  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    try {
      await axiosClient.patch(`/api/admin/users/${userId}/status`, { status: newStatus });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (err) {
      alert("Cập nhật trạng thái người dùng thất bại! Đảm bảo quyền admin.");
    }
  };

  // ==========================================
  // TAB 2: MOVIE CRUD METHODS
  // ==========================================
  const handleOpenMovieAdd = () => {
    setEditingMovie(null);
    setMovieForm({
      title: '',
      description: '',
      duration: 120,
      releaseDate: '',
      endDate: '',
      posterUrl: '',
      trailerUrl: '',
      ageRating: 'T13',
      status: 'NOW_SHOWING',
      format: '2D'
    });
    setShowMovieModal(true);
  };

  const handleOpenMovieEdit = (movie) => {
    setEditingMovie(movie);
    setMovieForm({
      title: movie.title,
      description: movie.description,
      duration: movie.duration,
      releaseDate: movie.releaseDate || '',
      endDate: movie.endDate || '',
      posterUrl: movie.posterUrl || '',
      trailerUrl: movie.trailerUrl || '',
      ageRating: movie.ageRating || 'T13',
      status: movie.status || 'NOW_SHOWING',
      format: movie.format || '2D'
    });
    setShowMovieModal(true);
  };

  const handlePosterUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploadingPoster(true);
    try {
      const res = await axiosClient.post('/api/admin/movies/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data && res.data.fileUrl) {
        setMovieForm(prev => ({ ...prev, posterUrl: res.data.fileUrl }));
      }
    } catch (err) {
      alert("Tải lên ảnh bìa phim thất bại! Chỉ nhận định dạng ảnh JPEG/PNG.");
    } finally {
      setUploadingPoster(false);
    }
  };

  const handleMovieFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMovie) {
        // Edit movie
        const res = await axiosClient.put(`/api/admin/movies/${editingMovie.id}`, movieForm);
        setMovies(prev => prev.map(m => m.id === editingMovie.id ? res.data : m));
      } else {
        // Add new movie
        const res = await axiosClient.post('/api/admin/movies', movieForm);
        setMovies(prev => [...prev, res.data]);
      }
      setShowMovieModal(false);
      fetchUsers(); // Refresh audit logs trigger
    } catch (err) {
      alert("Lỗi lưu trữ dữ liệu phim, vui lòng kiểm tra lại đầu vào!");
    }
  };

  const handleDeleteMovie = async (movieId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bộ phim này khỏi hệ thống chiếu?")) return;
    try {
      await axiosClient.delete(`/api/admin/movies/${movieId}`);
      setMovies(prev => prev.filter(m => m.id !== movieId));
      fetchUsers(); // Refresh audit logs trigger
    } catch (err) {
      alert("Không thể xóa phim này do đã phát sinh suất chiếu liên quan!");
    }
  };

  // ==========================================
  // TAB 3: SCREEN & SEAT OPERATIONS
  // ==========================================
  const handleSelectScreen = async (screen) => {
    setSelectedScreen(screen);
    try {
      const res = await axiosClient.get(`/api/admin/screens/${screen.id}/seats`);
      if (res.data) {
        setSeats(res.data);
      }
    } catch (err) {
      setSeats([]);
    }
  };

  const handleCreateScreen = async (e) => {
    e.preventDefault();
    if (!newScreenName.trim()) return;

    try {
      const payload = {
        name: newScreenName,
        totalSeats: 0,
        cinema: { id: selectedCinemaId },
        status: 'AVAILABLE'
      };
      const res = await axiosClient.post('/api/admin/screens', payload);
      setScreens(prev => [...prev, res.data]);
      setSelectedScreen(res.data);
      setSeats([]);
      setShowAddScreenModal(false);
      setNewScreenName('');
      fetchUsers(); // Triggers live audit logs
    } catch (err) {
      alert("Tạo phòng chiếu thất bại! Vui lòng kiểm tra ID chi nhánh rạp.");
    }
  };

  const handleGenerateSeatMatrix = async (screenId) => {
    setGeneratingSeats(true);
    try {
      await axiosClient.post(`/api/admin/screens/${screenId}/generate-seats`);
      alert("Tạo ma trận 90 ghế theo sơ đồ (SINGLE, VIP, SWEETBOX_DOUBLE) thành công!");
      fetchScreens(); // reload total_seats count
      // Refresh current seats
      const res = await axiosClient.get(`/api/admin/screens/${screenId}/seats`);
      if (res.data) setSeats(res.data);
      fetchUsers(); // Triggers live audit logs
    } catch (err) {
      alert("Không thể sinh ghế tự động! Vui lòng thử lại.");
    } finally {
      setGeneratingSeats(false);
    }
  };

  // Helper date/time utility
  const getFormattedTime = (date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };

  const filteredMovies = movies.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          {/* Menu Items */}
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`w-full rounded-xl flex items-center p-3.5 font-bold cursor-pointer transition-all text-left ${
              activeTab === 'dashboard' ? 'bg-[#e9c176] text-[#261900] shadow-md' : 'text-[#d1c5b4] hover:bg-[#353535]/50 hover:text-[#e9c176]'
            }`}
          >
            <LayoutDashboard className="mr-3 shrink-0" size={18} />
            <span className="text-sm">Bảng Điều Khiển</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('movies')} 
            className={`w-full rounded-xl flex items-center p-3.5 font-bold cursor-pointer transition-all text-left ${
              activeTab === 'movies' ? 'bg-[#e9c176] text-[#261900] shadow-md' : 'text-[#d1c5b4] hover:bg-[#353535]/50 hover:text-[#e9c176]'
            }`}
          >
            <Film className="mr-3 shrink-0" size={18} />
            <span className="text-sm">Quản Lý Phim</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('screens')} 
            className={`w-full rounded-xl flex items-center p-3.5 font-bold cursor-pointer transition-all text-left ${
              activeTab === 'screens' ? 'bg-[#e9c176] text-[#261900] shadow-md' : 'text-[#d1c5b4] hover:bg-[#353535]/50 hover:text-[#e9c176]'
            }`}
          >
            <Ticket className="mr-3 shrink-0" size={18} />
            <span className="text-sm">Cấu Hình Phòng & Ghế</span>
          </button>

          <div className="pt-8 mt-auto space-y-1">
            <button className="w-full text-[#d1c5b4] hover:bg-[#353535]/50 rounded-xl flex items-center p-3.5 text-sm font-medium text-left cursor-pointer transition-colors">
              <Settings className="mr-3 shrink-0" size={18} />
              <span>Cấu Hình Core</span>
            </button>
            <button 
              onClick={() => { localStorage.clear(); navigate('/login'); }} 
              className="w-full text-[#d1c5b4] hover:bg-red-500/10 hover:text-red-400 rounded-xl flex items-center p-3.5 text-sm font-medium text-left cursor-pointer transition-all"
            >
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

      {/* MAIN CANVAS */}
      <div className="lg:pl-64 flex flex-col w-full min-w-0">
        
        {/* HEADER */}
        <header className="sticky top-0 z-40 bg-[#131313]/90 backdrop-blur-md border-b border-[#4e4639]/30 flex justify-between items-center px-6 w-full h-20">
          <div className="flex items-center gap-4 min-w-0">
            <button type="button" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-white cursor-pointer p-1">
              <Menu size={24} />
            </button>
            <h2 className="text-lg md:text-xl font-bold text-[#e9c176] font-sans tracking-wide uppercase truncate">
              {activeTab === 'dashboard' && "Hệ Thống Kiểm Soát Chung"}
              {activeTab === 'movies' && "Hệ Thống Quản Lý Phim"}
              {activeTab === 'screens' && "Cấu Hình Sơ Đồ Phòng Chiếu"}
            </h2>
          </div>
          <div className="flex items-center gap-4 md:gap-6 shrink-0">
            <div className="hidden md:flex items-center bg-[#353535]/30 border border-[#4e4639]/50 rounded-full px-4 py-1.5 w-60">
              <Search className="text-[#9a8f80] mr-2 shrink-0" size={16} />
              <input 
                className="bg-transparent border-none outline-none text-xs text-white placeholder-[#9a8f80]/50 w-full focus:ring-0" 
                placeholder="Tìm kiếm..." 
                type="text"
                value={activeTab === 'movies' ? searchTerm : ''}
                onChange={(e) => {
                  if (activeTab === 'movies') setSearchTerm(e.target.value);
                }}
              />
            </div>
            <button className="relative text-[#d1c5b4] hover:text-[#e9c176] p-1 transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#e9c176] rounded-full animate-ping"></span>
            </button>
          </div>
        </header>

        {/* CONTAINER CONTENT */}
        <div className="p-4 md:p-8 flex flex-col gap-6 max-w-7xl w-full mx-auto min-w-0 box-border">
          
          {/* ==========================================
              TAB 1: SYSTEM DASHBOARD (LOCK USERS + LIVE AUDIT LOGS)
              ========================================== */}
          {activeTab === 'dashboard' && (
            <>
              {/* METRICS PANEL */}
              <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
                <div className="bg-[#1f2020] border border-[#e9c176]/10 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#9a8f80] uppercase tracking-wider">Tài Khoản Database</span>
                    <Users className="text-[#e9c176]" size={20} />
                  </div>
                  <span className="text-3xl font-bold text-white font-mono">{users.length || '4'}</span>
                  <span className="text-[11px] text-green-400 flex items-center mt-2 font-medium">
                    <TrendingUp size={12} className="mr-1" /> SQL Server Online
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
                    <span className="text-xs font-semibold text-[#9a8f80] uppercase tracking-wider">WebSocket Status</span>
                    <ShieldCheck className="text-emerald-400 animate-bounce" size={20} />
                  </div>
                  <span className="text-xl font-bold text-white font-mono block">STOMP CONNECTED</span>
                  <span className="text-[11px] text-[#9a8f80] mt-2 block font-medium">Listening on /topic/logs</span>
                </div>
              </section>

              {/* SPLIT SCREEN: USERS TABLE + REAL-TIME AUDIT LOGS */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start w-full min-w-0">
                {/* Users List */}
                <section className="xl:col-span-7 bg-[#1f2020] border border-[#4e4639]/30 rounded-2xl overflow-hidden flex flex-col shadow-xl min-w-0 w-full">
                  <div className="p-5 border-b border-[#4e4639]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-white font-serif tracking-wide">Quản Lý Trạng Thái Tài Khoản (SQL Server)</h3>
                      <p className="text-[11px] text-[#9a8f80] mt-0.5">Khóa/Mở khóa tức thời tài khoản thông qua Secure API Patch</p>
                    </div>
                  </div>

                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className="bg-[#131313]/50 text-[#9a8f80] text-[10px] uppercase tracking-wider font-bold border-b border-[#4e4639]/20">
                          <th className="px-6 py-3.5">Người Dùng</th>
                          <th className="px-6 py-3.5">Quyền Hạn</th>
                          <th className="px-6 py-3.5">Trạng Thái</th>
                          <th className="px-6 py-3.5 text-center">Bảo Mật</th>
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
                                user.role?.name === 'ROLE_ADMIN' || user.role === 'ROLE_ADMIN' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                user.role?.name === 'ROLE_MANAGER' || user.role === 'ROLE_MANAGER' ? 'bg-[#0164b4]/10 text-[#a4c9ff] border border-[#0164b4]/20' :
                                user.role?.name === 'ROLE_STAFF' || user.role === 'ROLE_STAFF' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                'bg-[#353535] text-[#d1c5b4]'
                              }`}>
                                {typeof user.role === 'object' ? user.role.name.replace('ROLE_', '') : user.role.replace('ROLE_', '')}
                              </span>
                            </td>
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${"ACTIVE".equalsIgnoreCase(user.status) ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]' : 'bg-red-500 animate-pulse'}`}></span>
                                <span className="text-xs font-medium">{"ACTIVE".equalsIgnoreCase(user.status) ? 'Hoạt động' : 'Đã Khóa'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-3.5 text-center">
                              <button 
                                onClick={() => toggleUserStatus(user.id, user.status)} 
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer ${
                                  "ACTIVE".equalsIgnoreCase(user.status)
                                    ? 'border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/20'
                                    : 'border-[#e9c176]/30 text-[#e9c176] bg-[#e9c176]/5 hover:bg-[#e9c176]/20'
                                }`}
                              >
                                {"ACTIVE".equalsIgnoreCase(user.status) ? (
                                  <><Lock size={10} /> KHÓA ACC</>
                                ) : (
                                  <><Unlock size={10} /> MỞ ACC</>
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Audit Logs terminal */}
                <section className="xl:col-span-5 bg-black/60 border border-[#4e4639]/30 rounded-2xl overflow-hidden flex flex-col shadow-xl h-[400px] w-full min-w-0">
                  <div className="p-4 bg-[#1f2020] border-b border-[#4e4639]/30 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <Terminal className="text-[#e9c176]" size={14} />
                      <h3 className="text-[10px] font-bold text-white uppercase tracking-widest font-mono">Live WebSocket Audit Logs (AOP)</h3>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-ping"></div>
                  </div>

                  <div ref={terminalRef} className="p-4 overflow-y-auto flex-1 font-mono text-[10px] leading-relaxed space-y-2 select-text break-all custom-scrollbar">
                    {logs.length > 0 ? (
                      logs.map((log, index) => (
                        <div key={index} className="flex gap-1.5 items-start">
                          <span className="text-[#9a8f80] shrink-0">[{log.time}]</span>
                          <span className={`${log.color} shrink-0`}>{log.tag}:</span>
                          <span className="text-[#d1c5b4]">{log.msg}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-stone-500 py-12 text-center text-[10px]">
                        [HỆ THỐNG] Đang lắng nghe hành vi ghi nhận của Admin/Manager qua AOP...
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </>
          )}

          {/* ==========================================
              TAB 2: MOVIE MANAGEMENT VIEW (CRUD + FILE UPLOAD)
              ========================================== */}
          {activeTab === 'movies' && (
            <section className="bg-[#1f2020] border border-[#4e4639]/30 rounded-2xl p-6 shadow-xl flex flex-col w-full min-w-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#4e4639]/20 pb-5 gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white font-serif tracking-wide">Quản Lý Thực Thể Phim (Movies Store)</h3>
                  <p className="text-xs text-[#9a8f80] mt-0.5">Nạp thêm phim mới, tải ảnh bìa lưu trữ server và thiết lập thông số chiếu</p>
                </div>
                <button 
                  onClick={handleOpenMovieAdd}
                  className="bg-[#e9c176] text-[#261900] font-bold rounded-xl px-4 py-2.5 text-xs hover:bg-[#d9b166] cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Plus size={14} /> THÊM PHIM MỚI
                </button>
              </div>

              {/* MOVIE GRID LIST */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
                {filteredMovies.map(movie => (
                  <div key={movie.id} className="bg-[#131313]/60 border border-[#4e4639]/30 hover:border-[#e9c176]/40 rounded-2xl overflow-hidden flex flex-col group transition-all duration-300 transform hover:-translate-y-1 shadow-lg">
                    {/* Poster Cover */}
                    <div className="relative aspect-[16/22] bg-[#1a1a1a] overflow-hidden flex items-center justify-center border-b border-[#4e4639]/30">
                      {movie.posterUrl ? (
                        <img 
                          src={`http://localhost:8081${movie.posterUrl}`} 
                          alt={movie.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1542204172-e7052809f852?w=500";
                          }}
                        />
                      ) : (
                        <Image className="text-stone-700" size={48} />
                      )}
                      {/* Age Rating Badge */}
                      <span className="absolute top-3 left-3 bg-[#e9c176] text-[#261900] font-mono font-extrabold text-[10px] px-2 py-0.5 rounded shadow-md">
                        {movie.ageRating || 'T13'}
                      </span>
                      {/* Format Badge */}
                      <span className="absolute top-3 right-3 bg-blue-600 text-white font-mono font-extrabold text-[10px] px-2 py-0.5 rounded shadow-md uppercase">
                        {movie.format || '2D'}
                      </span>
                      {/* Status Overlay */}
                      <span className={`absolute bottom-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded border shadow-md uppercase tracking-wider ${
                        movie.status === 'NOW_SHOWING' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        movie.status === 'COMING_SOON' ? 'bg-[#0164b4]/20 text-[#a4c9ff] border-[#0164b4]/30' :
                        'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}>
                        {movie.status === 'NOW_SHOWING' ? 'Đang chiếu' : 
                         movie.status === 'COMING_SOON' ? 'Sắp chiếu' : 'Dừng chiếu'}
                      </span>
                    </div>

                    {/* Movie Detail text */}
                    <div className="p-4 flex flex-col flex-1 gap-2 min-w-0">
                      <h4 className="font-bold text-white text-sm md:text-base font-sans line-clamp-1 group-hover:text-[#e9c176] transition-colors">{movie.title}</h4>
                      <p className="text-[11px] text-[#9a8f80] font-mono flex items-center gap-1">
                        <Clock size={12} /> {movie.duration} Phút
                      </p>
                      
                      {/* Actions */}
                      <div className="flex gap-2 mt-3 pt-3 border-t border-[#4e4639]/20 w-full shrink-0">
                        <button 
                          onClick={() => handleOpenMovieEdit(movie)}
                          className="flex-1 border border-[#e9c176]/30 text-[#e9c176] hover:bg-[#e9c176] hover:text-[#261900] font-bold rounded-lg py-1.5 text-[10px] cursor-pointer transition-all flex items-center justify-center gap-1 uppercase tracking-wider"
                        >
                          <Edit2 size={10} /> Sửa
                        </button>
                        <button 
                          onClick={() => handleDeleteMovie(movie.id)}
                          className="border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-lg p-2 cursor-pointer transition-all flex items-center justify-center"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ==========================================
              TAB 3: SCREEN & SEAT MATRIX DESIGNER VIEW
              ========================================== */}
          {activeTab === 'screens' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start w-full min-w-0">
              
              {/* Screen List Deck */}
              <section className="xl:col-span-4 bg-[#1f2020] border border-[#4e4639]/30 rounded-2xl p-5 shadow-xl flex flex-col gap-4 w-full min-w-0">
                <div className="flex justify-between items-center border-b border-[#4e4639]/20 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white font-sans tracking-wide">PHÒNG CHIẾU (SCREENS DECK)</h3>
                    <p className="text-[10px] text-[#9a8f80] mt-0.5">Click vào phòng để hiển thị sơ đồ ghế</p>
                  </div>
                  <button 
                    onClick={() => setShowAddScreenModal(true)}
                    className="w-7 h-7 bg-[#e9c176]/10 border border-[#e9c176]/20 rounded-lg flex items-center justify-center text-[#e9c176] hover:bg-[#e9c176] hover:text-[#261900] transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="space-y-3">
                  {screens.map(screen => {
                    const isSelected = selectedScreen && selectedScreen.id === screen.id;
                    return (
                      <div 
                        key={screen.id}
                        onClick={() => handleSelectScreen(screen)}
                        className={`border rounded-xl p-4 space-y-3 cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-[#e9c176]/10 border-[#e9c176] shadow-md ring-1 ring-[#e9c176]/20'
                            : 'bg-[#131313]/60 border-[#4e4639]/20 hover:border-[#4e4639]/60'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white uppercase">{screen.name}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                            screen.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }`}>
                            {screen.status === 'AVAILABLE' ? 'Sẵn sàng' : 'Bảo trì'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-[#9a8f80]">
                          <span className="font-mono">ID: {screen.id}</span>
                          <span>Đã nạp: <strong className="text-white font-mono">{screen.totalSeats || '0'} ghế</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Dynamic Interactive seating visualizer */}
              <section className="xl:col-span-8 bg-[#1f2020] border border-[#4e4639]/30 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col gap-6 w-full min-w-0">
                {selectedScreen ? (
                  <>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#4e4639]/20 pb-4 gap-4">
                      <div>
                        <h3 className="text-base font-bold text-white font-serif tracking-wide">
                          Sơ Đồ Ghế Chi Tiết: <span className="text-[#e9c176] uppercase font-sans">{selectedScreen.name}</span>
                        </h3>
                        <p className="text-[11px] text-[#9a8f80] mt-0.5">Biểu diễn cấu hình thực tế ghế SINGLE, VIP và SWEETBOX_DOUBLE</p>
                      </div>
                      
                      <button 
                        onClick={() => handleGenerateSeatMatrix(selectedScreen.id)}
                        disabled={generatingSeats}
                        className={`bg-[#e9c176] text-[#261900] font-bold rounded-xl px-4 py-2.5 text-xs hover:bg-[#d9b166] cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
                          generatingSeats && 'opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <Armchair size={14} /> {generatingSeats ? "ĐANG SINH MATRIX..." : "TỰ ĐỘNG TẠO MA TRẬN GHẾ"}
                      </button>
                    </div>

                    {/* Dynamic seat grid maps */}
                    {seats.length > 0 ? (
                      <div className="flex flex-col items-center gap-6 overflow-x-auto w-full select-none py-4">
                        {/* SCREEN INDICATOR */}
                        <div className="w-full max-w-md mx-auto text-center relative mb-8 shrink-0">
                          <div className="h-1 bg-gradient-to-r from-transparent via-[#e9c176]/50 to-transparent w-full"></div>
                          <span className="text-[9px] font-bold text-[#e9c176]/60 tracking-[0.25em] block mt-1.5 uppercase font-mono">MÀN HÌNH CHÍNH</span>
                        </div>

                        {/* SEATS LEGEND */}
                        <div className="flex flex-wrap gap-4 text-[10px] font-semibold text-[#9a8f80] uppercase justify-center mb-4 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <div className="w-3.5 h-3.5 rounded bg-[#353535] border border-stone-600"></div>
                            <span>SINGLE (Hàng A-E)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3.5 h-3.5 rounded bg-[#e9c176]/10 border border-[#e9c176]/50"></div>
                            <span className="text-[#e9c176]">VIP (Hàng F-H)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-7 h-3.5 rounded bg-red-500/10 border border-red-500/50"></div>
                            <span className="text-red-400">SWEETBOX DOUBLE (Hàng J)</span>
                          </div>
                        </div>

                        {/* SEAT GRID LAYOUT */}
                        <div className="flex flex-col gap-2 pt-2 min-w-[500px]">
                          {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J'].map(row => {
                            const rowSeats = seats.filter(s => s.seatRow === row);
                            if (rowSeats.length === 0) return null;

                            return (
                              <div key={row} className="flex items-center gap-3">
                                {/* Row label left */}
                                <span className="w-4 text-xs font-bold text-[#9a8f80] font-mono text-right">{row}</span>
                                
                                {/* Seats in this row */}
                                <div className="flex items-center gap-2">
                                  {rowSeats.map(seat => {
                                    const isVip = seat.type === 'VIP';
                                    const isDouble = seat.type === 'SWEETBOX_DOUBLE';

                                    return (
                                      <div 
                                        key={seat.id}
                                        className={`rounded text-[8px] font-bold font-mono flex items-center justify-center transition-all ${
                                          isDouble 
                                            ? 'w-10 h-6.5 bg-red-500/10 border border-red-500/50 text-red-400 shadow-sm shadow-red-500/5'
                                            : isVip
                                              ? 'w-6.5 h-6.5 bg-[#e9c176]/10 border border-[#e9c176]/50 text-[#e9c176] shadow-sm shadow-[#e9c176]/5'
                                              : 'w-6.5 h-6.5 bg-[#353535] border border-stone-600 text-stone-300'
                                        }`}
                                        title={`Ghế ${row}-${seat.seatNumber} (${seat.type})`}
                                      >
                                        {row}{seat.seatNumber}
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Row label right */}
                                <span className="w-4 text-xs font-bold text-[#9a8f80] font-mono">{row}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-16 bg-[#131313]/60 border border-[#4e4639]/20 rounded-2xl border-dashed">
                        <Armchair size={48} className="text-[#4e4639] mx-auto mb-3 animate-pulse" />
                        <h4 className="text-sm font-bold text-stone-400">Phòng chưa được khởi tạo ghế</h4>
                        <p className="text-xs text-[#9a8f80] max-w-xs mx-auto mt-1 leading-normal">Vui lòng click nút "Tự động tạo ma trận ghế" bên trên để sinh sơ đồ ghế lập tức!</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-20 text-[#9a8f80] text-sm font-serif">
                    Vui lòng tạo hoặc chọn một phòng chiếu bên tay trái để thiết lập sơ đồ ghế!
                  </div>
                )}
              </section>
            </div>
          )}

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

      {/* ==========================================
          MODALS AREA
          ========================================== */}
      {/* 1. Add / Edit Movie Modal */}
      {showMovieModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#1f2020] border border-[#e9c176]/20 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8 transform transition-all duration-300 scale-100">
            <div className="p-5 border-b border-[#4e4639]/30 bg-[#131313]/30 flex justify-between items-center">
              <h3 className="text-base font-bold text-white font-serif tracking-wide">
                {editingMovie ? "Cập Nhật Bộ Phim Chiếu" : "Nạp Phim Mới Vào Hệ Thống"}
              </h3>
              <button 
                onClick={() => setShowMovieModal(false)} 
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleMovieFormSubmit} className="p-6 space-y-4 text-xs md:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-bold text-[#9a8f80] uppercase tracking-wider block">Tên phim</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-[#131313] border border-[#4e4639]/70 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e9c176] transition-all"
                    value={movieForm.title}
                    onChange={(e) => setMovieForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#9a8f80] uppercase tracking-wider block">Thời lượng (Phút)</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    className="w-full bg-[#131313] border border-[#4e4639]/70 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e9c176] transition-all"
                    value={movieForm.duration}
                    onChange={(e) => setMovieForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  />
                </div>

                {/* Age Rating */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#9a8f80] uppercase tracking-wider block">Phân loại tuổi (Age Rating)</label>
                  <select 
                    className="w-full bg-[#131313] border border-[#4e4639]/70 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e9c176] transition-all"
                    value={movieForm.ageRating}
                    onChange={(e) => setMovieForm(prev => ({ ...prev, ageRating: e.target.value }))}
                  >
                    <option value="P">P (Mọi lứa tuổi)</option>
                    <option value="T13">T13 (Dưới 13 cấm xem)</option>
                    <option value="T16">T16 (Dưới 16 cấm xem)</option>
                    <option value="T18">T18 (Dưới 18 cấm xem)</option>
                  </select>
                </div>

                {/* Release date */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#9a8f80] uppercase tracking-wider block">Ngày khởi chiếu</label>
                  <input 
                    type="date" 
                    required
                    className="w-full bg-[#131313] border border-[#4e4639]/70 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e9c176] transition-all"
                    value={movieForm.releaseDate}
                    onChange={(e) => setMovieForm(prev => ({ ...prev, releaseDate: e.target.value }))}
                  />
                </div>

                {/* End date */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#9a8f80] uppercase tracking-wider block">Ngày kết thúc</label>
                  <input 
                    type="date" 
                    required
                    className="w-full bg-[#131313] border border-[#4e4639]/70 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e9c176] transition-all"
                    value={movieForm.endDate}
                    onChange={(e) => setMovieForm(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#9a8f80] uppercase tracking-wider block">Trạng thái chiếu</label>
                  <select 
                    className="w-full bg-[#131313] border border-[#4e4639]/70 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e9c176] transition-all"
                    value={movieForm.status}
                    onChange={(e) => setMovieForm(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="NOW_SHOWING">NOW_SHOWING (Đang chiếu)</option>
                    <option value="COMING_SOON">COMING_SOON (Sắp chiếu)</option>
                    <option value="END_OF_SHOW">END_OF_SHOW (Dừng chiếu)</option>
                  </select>
                </div>

                {/* Format */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#9a8f80] uppercase tracking-wider block">Định dạng (Format)</label>
                  <select 
                    className="w-full bg-[#131313] border border-[#4e4639]/70 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e9c176] transition-all"
                    value={movieForm.format}
                    onChange={(e) => setMovieForm(prev => ({ ...prev, format: e.target.value }))}
                  >
                    <option value="2D">2D</option>
                    <option value="3D">3D</option>
                    <option value="IMAX">IMAX</option>
                  </select>
                </div>

                {/* Trailer url */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#9a8f80] uppercase tracking-wider block">Trailer URL (Youtube Link)</label>
                  <input 
                    type="text" 
                    className="w-full bg-[#131313] border border-[#4e4639]/70 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e9c176] transition-all"
                    value={movieForm.trailerUrl}
                    onChange={(e) => setMovieForm(prev => ({ ...prev, trailerUrl: e.target.value }))}
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-bold text-[#9a8f80] uppercase tracking-wider block">Tóm tắt nội dung phim</label>
                  <textarea 
                    rows="3"
                    className="w-full bg-[#131313] border border-[#4e4639]/70 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e9c176] transition-all"
                    value={movieForm.description}
                    onChange={(e) => setMovieForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                {/* Poster upload and URL */}
                <div className="space-y-1.5 sm:col-span-2 border border-[#4e4639]/40 bg-[#131313]/25 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-20 h-28 bg-black/40 border border-[#4e4639]/50 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                    {movieForm.posterUrl ? (
                      <img 
                        src={`http://localhost:8081${movieForm.posterUrl}`} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image size={24} className="text-[#4e4639]" />
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <label className="text-[11px] font-bold text-[#9a8f80] uppercase tracking-wider block">Tải ảnh bìa phim (Poster)</label>
                    <div className="relative w-full">
                      <input 
                        type="file" 
                        accept="image/*"
                        id="poster-input"
                        className="hidden"
                        onChange={handlePosterUpload}
                      />
                      <label 
                        htmlFor="poster-input"
                        className="bg-[#353535] hover:bg-[#404040] border border-[#4e4639]/80 text-[#d1c5b4] hover:text-[#e9c176] rounded-xl px-4 py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Upload size={14} /> {uploadingPoster ? "Đang tải ảnh lên..." : "Chọn file ảnh bìa..."}
                      </label>
                    </div>
                    {movieForm.posterUrl && (
                      <span className="text-[10px] text-green-400 font-mono block select-all break-all mt-1">
                        URL: {movieForm.posterUrl}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-4 border-t border-[#4e4639]/20 flex justify-end gap-3 w-full shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowMovieModal(false)}
                  className="bg-[#353535] hover:bg-[#404040] text-white font-bold rounded-xl px-5 py-2.5 cursor-pointer transition-colors"
                >
                  HỦY BỎ
                </button>
                <button 
                  type="submit" 
                  disabled={uploadingPoster}
                  className={`bg-[#e9c176] text-[#261900] font-bold rounded-xl px-6 py-2.5 cursor-pointer hover:bg-[#d9b166] transition-colors ${
                    uploadingPoster && 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  {editingMovie ? "CẬP NHẬT PHIM" : "NẠP PHIM MỚI"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Screen Modal */}
      {showAddScreenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-[#1f2020] border border-[#e9c176]/20 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden transform transition-all duration-300">
            <div className="p-4.5 border-b border-[#4e4639]/30 bg-[#131313]/30 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white font-serif tracking-wide">Cấu Hình Phòng Chiếu Mới</h3>
              <button onClick={() => setShowAddScreenModal(false)} className="text-stone-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateScreen} className="p-5 space-y-4 text-xs md:text-sm">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#9a8f80] uppercase block">Tên phòng chiếu (Ví dụ: PHÒNG CHIẾU 6)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Nhập tên phòng chiếu..."
                  className="w-full bg-[#131313] border border-[#4e4639]/70 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e9c176] transition-all"
                  value={newScreenName}
                  onChange={(e) => setNewScreenName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#9a8f80] uppercase block">Chi Nhánh Rạp (Cinema ID)</label>
                <select 
                  className="w-full bg-[#131313] border border-[#4e4639]/70 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e9c176] transition-all"
                  value={selectedCinemaId}
                  onChange={(e) => setSelectedCinemaId(parseInt(e.target.value))}
                >
                  <option value="1">Cinema Plus - Trường Chinh (ID: 1)</option>
                  <option value="2">Cinema Plus - Nguyễn Văn Cừ (ID: 2)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#4e4639]/20 flex justify-end gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowAddScreenModal(false)}
                  className="bg-[#353535] hover:bg-[#404040] text-white rounded-xl px-4 py-2 hover:text-[#e9c176] cursor-pointer text-xs font-semibold"
                >
                  HỦY BỎ
                </button>
                <button 
                  type="submit" 
                  className="bg-[#e9c176] text-[#261900] rounded-xl px-4 py-2 font-bold hover:bg-[#d9b166] cursor-pointer text-xs"
                >
                  TẠO PHÒNG CHIẾU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}