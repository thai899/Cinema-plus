import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  LayoutDashboard, Film, Ticket, Award, Settings, LogOut, Menu, Search, Bell, Plus,
  TrendingUp, Utensils, Armchair, AlertTriangle, Monitor, Users, Printer, Calendar,
  Clock, Trash2, Edit2, Upload, Image, ChevronLeft, ChevronRight, UserCheck, Heart
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const managerName = localStorage.getItem('username') || 'Quản lý';
  const token = localStorage.getItem('token');
  
  // Tab navigation & state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'movies', 'screens', 'showtimes', 'staff'
  const [animate, setAnimate] = useState(false);
  
  // Tab 1: Dashboard metrics & analytics
  const [revenuePeriod, setRevenuePeriod] = useState('daily');
  const [revenueData, setRevenueData] = useState([]);
  const [loadingRevenue, setLoadingRevenue] = useState(true);
  const [metrics, setMetrics] = useState({
    ticketSales: '0',
    todayRevenue: '0',
    totalTickets: 0,
    fbRevenue: '24.500.000',
    avgOccupancy: 78,
    apiTraffic: 0
  });

  // Today's dynamic timeline showtimes & seat density states
  const [screenOccupancy, setScreenOccupancy] = useState({});

  // F&B Inventory state
  const [inventory, setInventory] = useState([
    { name: 'Bỏng ngô (Bơ & Caramel)', ratio: 85, status: 'Normal' },
    { name: 'Siro Nước ngọt (Post-mix)', ratio: 42, status: 'Warning' },
    { name: 'Vật phẩm giới hạn (Ly/Mũ phim)', ratio: 12, status: 'Low' },
    { name: 'Sốt phô mai Nacho', ratio: 68, status: 'Normal' }
  ]);

  // Tab 2: Movie Management States
  const [movies, setMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMovieModal, setShowMovieModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [movieForm, setMovieForm] = useState({
    title: '', description: '', duration: 120, releaseDate: '', endDate: '',
    posterUrl: '', trailerUrl: '', ageRating: 'T13', status: 'NOW_SHOWING', format: '2D'
  });

  // Tab 3: Screen & Seat Matrix States
  const [screens, setScreens] = useState([]);
  const [selectedScreen, setSelectedScreen] = useState(null);
  const [seats, setSeats] = useState([]);
  const [generatingSeats, setGeneratingSeats] = useState(false);
  const [showAddScreenModal, setShowAddScreenModal] = useState(false);
  const [newScreenName, setNewScreenName] = useState('');
  const [selectedCinemaId, setSelectedCinemaId] = useState(1);

  // Tab 4: Showtime States
  const [showtimes, setShowtimes] = useState([]);
  const [showAddShowtimeModal, setShowAddShowtimeModal] = useState(false);
  const [showtimeForm, setShowtimeForm] = useState({
    movieId: '', screenId: '', startTime: '', basePrice: ''
  });

  // Tab 5: Staff/Users States
  const [staffList, setStaffList] = useState([]);

  // simulated quick actions modal alerts
  const [simulatedAlert, setSimulatedAlert] = useState(null);

  // Get Today's Date String in local format (YYYY-MM-DD)
  const getTodayStr = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  useEffect(() => {
    fetchDashboard();
    fetchRevenue(revenuePeriod);
    fetchMovies();
    fetchScreens();
    fetchShowtimes();
    fetchStaff();
  }, []);

  useEffect(() => {
    fetchRevenue(revenuePeriod);
  }, [revenuePeriod]);

  // Dynamic calculations once screens and showtimes lists are loaded
  useEffect(() => {
    if (screens.length > 0 && showtimes.length > 0) {
      calculateLiveOccupancy(screens, showtimes);
    }
  }, [screens, showtimes]);

  const fetchDashboard = async () => {
    try {
      const res = await axiosClient.get('/analytics/dashboard');
      if (res.data) {
        setMetrics(prev => ({
          ...prev,
          ticketSales: res.data.totalRevenue ? Number(res.data.totalRevenue).toLocaleString('vi-VN') : '0',
          todayRevenue: res.data.todayRevenue ? Number(res.data.todayRevenue).toLocaleString('vi-VN') : '0',
          totalTickets: res.data.totalTickets || 0,
          apiTraffic: res.data.apiTraffic || 0
        }));
      }
    } catch (error) {
      console.error("Lỗi nạp dashboard stats", error);
    } finally {
      setAnimate(true);
    }
  };

  const fetchRevenue = async (period) => {
    setLoadingRevenue(true);
    try {
      const res = await axiosClient.get(`/analytics/revenue?period=${period}`);
      if (res.data) {
        setRevenueData(res.data.map(d => ({
          name: d.label,
          revenue: Number(d.amount),
          tickets: d.tickets
        })));
      }
    } catch (e) {
      console.error(e);
      setRevenueData([]);
    } finally {
      setLoadingRevenue(false);
    }
  };

  const fetchMovies = async () => {
    try {
      const res = await axiosClient.get('/admin/movies');
      if (res.data) setMovies(res.data);
    } catch (err) {
      console.error("Lỗi nạp danh sách phim", err);
    }
  };

  const fetchScreens = async () => {
    try {
      const res = await axiosClient.get('/admin/screens');
      if (res.data) {
        setScreens(res.data);
        if (res.data.length > 0 && !selectedScreen) {
          handleSelectScreen(res.data[0]);
        }
      }
    } catch (err) {
      console.error("Lỗi nạp phòng chiếu", err);
    }
  };

  const fetchShowtimes = async () => {
    try {
      const res = await axiosClient.get('/admin/showtimes');
      if (res.data) setShowtimes(res.data);
    } catch (err) {
      console.error("Lỗi nạp suất chiếu", err);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await axiosClient.get('/admin/users');
      if (res.data) {
        // Lọc tất cả nhân viên (ROLE_STAFF) và quản lý khác trong chi nhánh
        const staffs = res.data.filter(u => u.role?.name === 'ROLE_STAFF' || u.role === 'ROLE_STAFF');
        setStaffList(staffs);
      }
    } catch (err) {
      console.error("Lỗi nạp danh sách nhân viên", err);
    }
  };

  const calculateLiveOccupancy = async (screensList, showtimesList) => {
    const todayStr = getTodayStr();
    const occupancyMap = {};

    for (const scr of screensList) {
      // Find today's showtimes for this screen
      const todayShowtimes = showtimesList.filter(st => st.screenId === scr.id && st.startTime.startsWith(todayStr));
      
      if (todayShowtimes.length === 0) {
        occupancyMap[scr.id] = {
          percent: 0,
          status: 'Trống',
          dots: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        };
        continue;
      }

      // Sort by start time and pick active/closest
      todayShowtimes.sort((a, b) => a.startTime.localeCompare(b.startTime));
      const nowTimeStr = new Date().toTimeString().substring(0, 5); // "HH:MM"
      
      let targetSt = todayShowtimes.find(st => {
        const sTime = st.startTime.split('T')[1].substring(0, 5);
        const eTime = st.endTime.split('T')[1].substring(0, 5);
        return nowTimeStr >= sTime && nowTimeStr <= eTime;
      });

      if (!targetSt) {
        targetSt = todayShowtimes[0];
      }

      try {
        const res = await axiosClient.get(`/showtimes/${targetSt.id}/seats`);
        if (res.data) {
          const total = res.data.length;
          const booked = res.data.filter(s => s.status === 'BOOKED').length;
          const percent = total > 0 ? Math.round((booked / total) * 100) : 0;
          
          const activeDots = Math.round((percent / 100) * 12);
          const dots = Array.from({ length: 12 }, (_, i) => i < activeDots ? 1 : 0);

          occupancyMap[scr.id] = {
            percent,
            movieTitle: targetSt.movieTitle,
            status: `Đã Đặt ${percent}%`,
            dots
          };
        }
      } catch (err) {
        occupancyMap[scr.id] = {
          percent: 0,
          status: 'Offline',
          dots: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        };
      }
    }

    setScreenOccupancy(occupancyMap);
  };

  const handleSelectScreen = async (screen) => {
    setSelectedScreen(screen);
    try {
      const res = await axiosClient.get(`/admin/screens/${screen.id}/seats`);
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
      const res = await axiosClient.post('/admin/screens', payload);
      setScreens(prev => [...prev, res.data]);
      setSelectedScreen(res.data);
      setSeats([]);
      setShowAddScreenModal(false);
      setNewScreenName('');
      alert("✅ Tạo phòng chiếu thành công!");
      fetchScreens();
    } catch (err) {
      alert("Tạo phòng chiếu thất bại! Vui lòng kiểm tra lại ID rạp.");
    }
  };

  const handleGenerateSeatMatrix = async (screenId) => {
    setGeneratingSeats(true);
    try {
      await axiosClient.post(`/admin/screens/${screenId}/generate-seats`);
      alert("✅ Tạo ma trận 90 ghế theo sơ đồ (SINGLE, VIP, SWEETBOX_DOUBLE) thành công!");
      fetchScreens();
      const res = await axiosClient.get(`/admin/screens/${screenId}/seats`);
      if (res.data) setSeats(res.data);
    } catch (err) {
      alert("Không thể sinh ghế tự động! Vui lòng thử lại.");
    } finally {
      setGeneratingSeats(false);
    }
  };

  const handleOpenMovieAdd = () => {
    setEditingMovie(null);
    setMovieForm({
      title: '', description: '', duration: 120, releaseDate: '', endDate: '',
      posterUrl: '', trailerUrl: '', ageRating: 'T13', status: 'NOW_SHOWING', format: '2D'
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
      const res = await axiosClient.post('/admin/movies/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data && res.data.fileUrl) {
        setMovieForm(prev => ({ ...prev, posterUrl: res.data.fileUrl }));
      }
    } catch (err) {
      alert("Tải ảnh bìa phim thất bại! Yêu cầu file JPEG/PNG hợp lệ.");
    } finally {
      setUploadingPoster(false);
    }
  };

  const handleMovieFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMovie) {
        const res = await axiosClient.put(`/admin/movies/${editingMovie.id}`, movieForm);
        setMovies(prev => prev.map(m => m.id === editingMovie.id ? res.data : m));
        alert("✅ Cập nhật thông tin phim thành công!");
      } else {
        const res = await axiosClient.post('/admin/movies', movieForm);
        setMovies(prev => [...prev, res.data]);
        alert("✅ Thêm phim mới thành công!");
      }
      setShowMovieModal(false);
      fetchMovies();
    } catch (err) {
      alert("Lỗi lưu trữ dữ liệu phim. Kiểm tra lại thông số nhập!");
    }
  };

  const handleDeleteMovie = async (movieId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bộ phim này khỏi hệ thống rạp?")) return;
    try {
      await axiosClient.delete(`/admin/movies/${movieId}`);
      setMovies(prev => prev.filter(m => m.id !== movieId));
      alert("✅ Xóa phim thành công!");
    } catch (err) {
      alert("Không thể xóa phim này do đã phát sinh lịch chiếu liên quan!");
    }
  };

  const handleAddShowtime = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        movieId:   parseInt(showtimeForm.movieId),
        screenId:  parseInt(showtimeForm.screenId),
        startTime: showtimeForm.startTime,
        basePrice: parseFloat(showtimeForm.basePrice)
      };
      await axiosClient.post('/admin/showtimes', payload);
      alert('✅ Tạo suất chiếu mới thành công!');
      setShowAddShowtimeModal(false);
      setShowtimeForm({ movieId: '', screenId: '', startTime: '', basePrice: '' });
      fetchShowtimes();
    } catch (err) {
      alert(err.response?.data?.error || 'Tạo suất chiếu thất bại! Lịch chiếu bị trùng trong phòng này.');
    }
  };

  const handleDeleteShowtime = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa suất chiếu này?')) return;
    try {
      await axiosClient.delete(`/admin/showtimes/${id}`);
      setShowtimes(prev => prev.filter(s => s.id !== id));
      alert('✅ Xóa suất chiếu thành công!');
    } catch (err) {
      alert(err.response?.data?.error || 'Không thể xóa suất chiếu đã có khách đặt vé!');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const formatVND = (value) => {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'tr';
    if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
    return value.toLocaleString();
  };

  const getTimelineStyle = (startTimeStr, endTimeStr) => {
    const startPart = startTimeStr.split('T')[1];
    const endPart = endTimeStr.split('T')[1];
    if (!startPart || !endPart) return { display: 'none' };

    const [sHour, sMin] = startPart.split(':').map(Number);
    const [eHour, eMin] = endPart.split(':').map(Number);

    const startMinutes = sHour * 60 + sMin;
    let endMinutes = eHour * 60 + eMin;

    if (endMinutes < startMinutes) endMinutes = 1440; // cap at midnight

    // timeline limits: 10 AM to 12 AM (600 to 1440 mins)
    const tStart = 600;
    const tDuration = 840;

    const startClamped = Math.max(tStart, Math.min(1440, startMinutes));
    const endClamped = Math.max(tStart, Math.min(1440, endMinutes));

    if (endClamped <= startClamped) return { display: 'none' };

    const left = ((startClamped - tStart) / tDuration) * 100;
    const width = ((endClamped - startClamped) / tDuration) * 100;

    return {
      left: `${left}%`,
      width: `${width}%`
    };
  };

  const handleInventoryAdjust = (index, change) => {
    setInventory(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      const newRatio = Math.max(0, Math.min(100, item.ratio + change));
      const status = newRatio <= 15 ? 'Low' : newRatio <= 45 ? 'Warning' : 'Normal';
      return { ...item, ratio: newRatio, status };
    }));
  };

  const handlePrintReport = () => {
    setSimulatedAlert({
      title: "🖨️ Xuất Báo Cáo Doanh Thu",
      message: `Hệ thống đang xuất hóa đơn & báo cáo tổng hợp doanh thu rạp. Tổng doanh thu hiện tại: ${metrics.ticketSales}đ. Vui lòng kiểm tra khay máy in văn phòng!`
    });
  };

  const handleEmergencyAlert = () => {
    setSimulatedAlert({
      title: "🚨 BÁO ĐỘNG KHẨN HỆ THỐNG",
      message: "Hệ thống đã gửi tín hiệu khẩn cấp đến phòng an ninh và kích hoạt loa thông báo phòng chiếu."
    });
  };

  const handleServiceHotline = () => {
    setSimulatedAlert({
      title: "📞 Tổng Đài Kỹ Thuật",
      message: "Đang kết nối tới Trung tâm điều hành hạ tầng Cinema Plus (Hotline: 1900-8888). Vui lòng chuẩn bị mã máy chiếu rạp!"
    });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1f2020] border border-[#e9c176]/30 rounded-xl p-3 shadow-2xl text-sm">
          <p className="text-[#e9c176] font-bold mb-1">{label}</p>
          <p className="text-white">Doanh thu: <span className="font-mono font-bold text-[#e9c176]">{Number(payload[0].value).toLocaleString('vi-VN')}đ</span></p>
          {payload[0].payload.tickets !== undefined && (
            <p className="text-[#a4c9ff]">Số vé: <span className="font-bold">{payload[0].payload.tickets}</span></p>
          )}
        </div>
      );
    }
    return null;
  };

  const filteredMovies = movies.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todayStr = getTodayStr();

  return (
    <div className="bg-[#131313] text-[#e4e2e1] min-h-screen font-sans selection:bg-[#e9c176]/30 selection:text-[#e9c176] flex">
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 lg:flex flex-col bg-[#1f2020] border-r border-[#4e4639]/20 shadow-lg w-64 z-50 py-6 transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="px-6 mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#e9c176] uppercase font-serif tracking-tight">Cinema Plus</h1>
            <p className="text-[#9a8f80] text-xs mt-1">Điều Hành Báo Cáo</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-stone-400 hover:text-white text-lg">✕</button>
        </div>

        <nav className="flex-1 px-2 space-y-1">
          <button 
            onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
            className={`w-full text-left rounded-xl flex items-center p-3.5 transition-all text-sm font-semibold ${activeTab === 'dashboard' ? 'bg-[#e9c176] text-[#261900] shadow-md' : 'text-[#d1c5b4] hover:bg-[#353535]/50 hover:text-[#e9c176]'}`}
          >
            <LayoutDashboard className="mr-3" size={18} />
            <span>Bảng Điều Khiển</span>
          </button>
          <button 
            onClick={() => { setActiveTab('movies'); setSidebarOpen(false); }}
            className={`w-full text-left rounded-xl flex items-center p-3.5 transition-all text-sm font-semibold ${activeTab === 'movies' ? 'bg-[#e9c176] text-[#261900] shadow-md' : 'text-[#d1c5b4] hover:bg-[#353535]/50 hover:text-[#e9c176]'}`}
          >
            <Film className="mr-3" size={18} />
            <span>Quản Lý Phim</span>
          </button>
          <button 
            onClick={() => { setActiveTab('showtimes'); setSidebarOpen(false); }}
            className={`w-full text-left rounded-xl flex items-center p-3.5 transition-all text-sm font-semibold ${activeTab === 'showtimes' ? 'bg-[#e9c176] text-[#261900] shadow-md' : 'text-[#d1c5b4] hover:bg-[#353535]/50 hover:text-[#e9c176]'}`}
          >
            <Calendar className="mr-3" size={18} />
            <span>Suất Chiếu & Lịch Trình</span>
          </button>
          <button 
            onClick={() => { setActiveTab('screens'); setSidebarOpen(false); }}
            className={`w-full text-left rounded-xl flex items-center p-3.5 transition-all text-sm font-semibold ${activeTab === 'screens' ? 'bg-[#e9c176] text-[#261900] shadow-md' : 'text-[#d1c5b4] hover:bg-[#353535]/50 hover:text-[#e9c176]'}`}
          >
            <Armchair className="mr-3" size={18} />
            <span>Cấu Hình Phòng & Ghế</span>
          </button>
          <button 
            onClick={() => { setActiveTab('staff'); setSidebarOpen(false); }}
            className={`w-full text-left rounded-xl flex items-center p-3.5 transition-all text-sm font-semibold ${activeTab === 'staff' ? 'bg-[#e9c176] text-[#261900] shadow-md' : 'text-[#d1c5b4] hover:bg-[#353535]/50 hover:text-[#e9c176]'}`}
          >
            <Users className="mr-3" size={18} />
            <span>Đội Ngũ Nhân Sự</span>
          </button>
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

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-40 lg:hidden" />}

      {/* CONTENT CANVAS */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* HEADER */}
        <header className="bg-[#131313]/80 backdrop-blur-md sticky top-0 z-40 border-b border-[#4e4639]/30 shadow-sm flex justify-between items-center px-6 py-4 h-20">
          <div className="flex items-center gap-4">
            <Menu className="lg:hidden text-white cursor-pointer" size={24} onClick={() => setSidebarOpen(true)} />
            <h2 className="text-lg md:text-2xl font-bold text-white font-serif tracking-wide">
              {activeTab === 'dashboard' && "Tổng Quan Vận Hành Cụm Rạp"}
              {activeTab === 'movies' && "Quản Lý Bộ Sưu Tập Phim"}
              {activeTab === 'screens' && "Quản Lý Phòng Chiếu & Sơ Đồ Ghế"}
              {activeTab === 'showtimes' && "Quản Lý Suất Chiếu & Lịch Trình"}
              {activeTab === 'staff' && "Danh Sách Nhân Viên Quầy Vé"}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {activeTab === 'movies' && (
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8f80] mb-0.5" size={16} />
                <input 
                  className="bg-[#1f2020] border border-[#4e4639]/30 rounded-full py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#e9c176] transition-all w-64" 
                  placeholder="Tìm kiếm phim..." 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
            {activeTab === 'dashboard' && (
              <button 
                onClick={() => setActiveTab('showtimes')}
                className="hidden sm:flex items-center gap-1.5 bg-[#e9c176] text-[#261900] px-4 py-2.5 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Plus size={16} /> Lên Lịch Chiếu Phim
              </button>
            )}
          </div>
        </header>

        {/* MAIN CONTAINER */}
        <main className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full flex-1">
          
          {/* ==================== TAB 1: BẢNG ĐIỀU KHIỂN ==================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* METRIC CARDS */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#1f2020] border border-[#e9c176]/10 p-6 rounded-2xl relative overflow-hidden shadow-lg">
                  <p className="text-[#d1c5b4] text-xs font-bold uppercase tracking-wider">Tổng Doanh Thu Vé</p>
                  <h3 className="text-3xl font-bold text-white mt-1.5 font-mono">{metrics.ticketSales}đ</h3>
                  <p className="text-green-400 text-xs mt-1.5 flex items-center font-medium">
                    <TrendingUp size={14} className="mr-1" /> Doanh số vé rạp
                  </p>
                </div>

                <div className="bg-[#1f2020] border border-[#e9c176]/10 p-6 rounded-2xl relative overflow-hidden shadow-lg">
                  <p className="text-[#d1c5b4] text-xs font-bold uppercase tracking-wider">Doanh Thu Hôm Nay</p>
                  <h3 className="text-3xl font-bold text-[#e9c176] mt-1.5 font-mono">{metrics.todayRevenue}đ</h3>
                  <p className="text-green-400 text-xs mt-1.5 flex items-center font-medium">
                    <Calendar size={14} className="mr-1" /> {new Date().toLocaleDateString('vi-VN')}
                  </p>
                </div>

                <div className="bg-[#1f2020] border border-[#e9c176]/10 p-6 rounded-2xl relative overflow-hidden shadow-lg">
                  <p className="text-[#d1c5b4] text-xs font-bold uppercase tracking-wider">Tổng Vé Đã Bán</p>
                  <h3 className="text-3xl font-bold text-white mt-1.5 font-mono">{metrics.totalTickets}</h3>
                  <p className="text-[#a4c9ff] text-xs mt-1.5 flex items-center font-medium">
                    <Ticket size={14} className="mr-1" /> Toàn cụm rạp
                  </p>
                </div>

                <div className="bg-[#1f2020] border border-[#e9c176]/10 p-6 rounded-2xl relative overflow-hidden shadow-lg">
                  <p className="text-[#d1c5b4] text-xs font-bold uppercase tracking-wider">Doanh Thu Bắp Nước (F&B)</p>
                  <h3 className="text-3xl font-bold text-white mt-1.5 font-mono">{metrics.fbRevenue}đ</h3>
                  <p className="text-[#a4c9ff] text-xs mt-1.5 flex items-center font-medium">
                    <Utensils size={14} className="mr-1" /> Dịch vụ ăn uống
                  </p>
                </div>
              </section>

              {/* REVENUE CHART */}
              <section className="bg-[#1f2020] border border-[#e9c176]/10 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-6 border-b border-[#4e4639]/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white font-serif tracking-wide flex items-center gap-2">
                      📊 Biểu Đồ Doanh Thu
                    </h3>
                    <p className="text-[#9a8f80] text-xs mt-0.5">Dữ liệu thực từ hệ thống cơ sở dữ liệu</p>
                  </div>
                  <div className="flex bg-[#131313] rounded-xl p-1 border border-[#4e4639]/20">
                    <button 
                      onClick={() => setRevenuePeriod('daily')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${revenuePeriod === 'daily' ? 'bg-[#e9c176] text-[#261900]' : 'text-[#d1c5b4] hover:text-white'}`}
                    >
                      7 Ngày
                    </button>
                    <button 
                      onClick={() => setRevenuePeriod('weekly')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${revenuePeriod === 'weekly' ? 'bg-[#e9c176] text-[#261900]' : 'text-[#d1c5b4] hover:text-white'}`}
                    >
                      4 Tuần
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {loadingRevenue ? (
                    <div className="h-64 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-[#e9c176] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : revenueData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#e9c176" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#e9c176" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4e4639" opacity={0.3} />
                        <XAxis dataKey="name" stroke="#9a8f80" tick={{ fill: '#9a8f80', fontSize: 12 }} axisLine={{ stroke: '#4e4639' }} />
                        <YAxis stroke="#9a8f80" tick={{ fill: '#9a8f80', fontSize: 12 }} tickFormatter={formatVND} axisLine={{ stroke: '#4e4639' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="revenue" stroke="#e9c176" strokeWidth={2.5} fill="url(#revenueGradient)" dot={{ fill: '#e9c176', stroke: '#1f2020', strokeWidth: 2, r: 5 }} activeDot={{ fill: '#e9c176', stroke: '#fff', strokeWidth: 2, r: 7 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-gray-500">
                      <p className="text-4xl mb-3">📉</p>
                      <p className="text-sm">Chưa có dữ liệu đặt vé phát sinh.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* TIMELINE GRID */}
              <section className="bg-[#1f2020] border border-[#e9c176]/10 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-6 border-b border-[#4e4639]/20 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white font-serif tracking-wide">Trục Thời Gian Suất Chiếu Hàng Ngày (Hôm Nay)</h3>
                    <p className="text-[#9a8f80] text-xs mt-0.5">Thời lượng và khung giờ hoạt động các phòng chiếu (10:00 AM - 12:00 AM)</p>
                  </div>
                  <span className="text-xs bg-[#e9c176]/10 border border-[#e9c176]/30 px-3 py-1.5 rounded-lg text-[#e9c176] font-mono">{todayStr}</span>
                </div>

                <div className="overflow-x-auto">
                  <div className="min-w-[1000px] p-6 relative">
                    <div className="flex mb-4 border-b border-[#4e4639]/20 pb-2.5 ml-24">
                      {['10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM', '12 AM'].map((time) => (
                        <div key={time} className="flex-1 text-center text-[11px] text-[#9a8f80] font-bold tracking-wider">{time}</div>
                      ))}
                    </div>

                    <div className="space-y-5">
                      {screens.map(screen => {
                        const todayShowtimes = showtimes.filter(st => st.screenId === screen.id && st.startTime.startsWith(todayStr));
                        return (
                          <div key={screen.id} className="flex items-center">
                            <div className="w-24 pr-4 text-right shrink-0">
                              <span className="text-sm font-bold text-white block truncate">{screen.name}</span>
                              <span className="text-[9px] text-[#e9c176] font-semibold uppercase tracking-wider">
                                {screen.name.includes("IMAX") ? "IMAX" : screen.name.includes("4DX") ? "4DX" : screen.name.includes("Luxury") ? "LUXURY" : "STANDARD"}
                              </span>
                            </div>
                            <div className="flex-1 h-16 bg-[#131313] rounded-xl relative overflow-hidden border border-[#4e4639]/20 flex items-center justify-center">
                              {todayShowtimes.map(st => {
                                const style = getTimelineStyle(st.startTime, st.endTime);
                                return (
                                  <div 
                                    key={st.id} 
                                    style={style} 
                                    className="absolute h-full bg-[#e9c176]/10 border-l-4 border-[#e9c176] p-2.5 cursor-pointer hover:bg-[#e9c176]/20 transition-all flex flex-col justify-center overflow-hidden"
                                    onClick={() => {
                                      setActiveTab('showtimes');
                                    }}
                                    title={`${st.movieTitle} (${st.startTime.split('T')[1].substring(0, 5)} - ${st.endTime.split('T')[1].substring(0, 5)})`}
                                  >
                                    <span className="text-xs font-bold text-white truncate block">{st.movieTitle}</span>
                                    <span className="text-[10px] text-[#9a8f80] mt-0.5 font-mono block">
                                      {st.startTime.split('T')[1].substring(0, 5)} - {st.endTime.split('T')[1].substring(0, 5)}
                                    </span>
                                  </div>
                                );
                              })}
                              {todayShowtimes.length === 0 && (
                                <span className="text-stone-700 text-xs italic">Không có suất chiếu hôm nay</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>

              {/* INVENTORY & QUICK ACTIONS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* INVENTORY */}
                <section className="bg-[#1f2020] border border-[#e9c176]/10 p-6 rounded-2xl shadow-lg">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white font-serif">Hệ Thống Giám Sát Kho Vật Tư (F&B)</h3>
                      <p className="text-xs text-[#9a8f80]">Cập nhật trạng thái và điều chỉnh lượng hàng tồn thực tế</p>
                    </div>
                  </div>
                  
                  <div className="space-y-5">
                    {inventory.map((item, i) => (
                      <div key={i} className="bg-[#131313]/40 p-4.5 rounded-xl border border-[#4e4639]/10">
                        <div className="flex justify-between items-center text-sm mb-2 font-medium">
                          <span className="text-[#d1c5b4]">{item.name}</span>
                          <span className={item.status === 'Low' ? 'text-red-400 font-bold' : item.status === 'Warning' ? 'text-[#e9c176] font-bold' : 'text-emerald-400 font-bold'}>
                            {item.ratio}% {item.status === 'Low' && ' - Sắp Hết'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 bg-[#353535] rounded-full h-2.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${item.status === 'Low' ? 'bg-red-500' : item.status === 'Warning' ? 'bg-[#e9c176]' : 'bg-emerald-500'}`}
                              style={{ width: `${item.ratio}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleInventoryAdjust(i, -10)} className="w-7 h-7 bg-stone-800 hover:bg-stone-700 rounded-lg text-white font-bold text-sm cursor-pointer">-</button>
                            <button onClick={() => handleInventoryAdjust(i, 10)} className="w-7 h-7 bg-stone-800 hover:bg-stone-700 rounded-lg text-white font-bold text-sm cursor-pointer">+</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* QUICK ACTIONS */}
                <section className="grid grid-cols-2 gap-4">
                  <button onClick={handlePrintReport} className="bg-[#1f2020] border border-[#e9c176]/10 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-[#e9c176]/10 transition-colors group cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-[#e9c176]/10 flex items-center justify-center text-[#e9c176] group-hover:scale-110 transition-transform">
                      <Printer size={22} />
                    </div>
                    <span className="text-sm font-bold text-white">Xuất Báo Cáo Doanh Thu</span>
                  </button>
                  <button onClick={() => setActiveTab('staff')} className="bg-[#1f2020] border border-[#e9c176]/10 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-[#a4c9ff]/10 transition-colors group cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-[#a4c9ff]/10 flex items-center justify-center text-[#a4c9ff] group-hover:scale-110 transition-transform">
                      <Users size={22} />
                    </div>
                    <span className="text-sm font-bold text-white">Điều Phối Ca Nhân Viên</span>
                  </button>
                  <button onClick={handleEmergencyAlert} className="bg-[#1f2020] border border-red-500/20 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-red-500/10 text-red-400 transition-colors group cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                      <AlertTriangle size={22} />
                    </div>
                    <span className="text-sm font-bold text-white">Phát Cảnh Báo Khẩn</span>
                  </button>
                  <button onClick={handleServiceHotline} className="bg-[#1f2020] border border-[#4e4639]/50 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-stone-800 transition-colors group cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-stone-800 flex items-center justify-center text-[#d1c5b4] group-hover:scale-110 transition-transform">
                      <Monitor size={22} />
                    </div>
                    <span className="text-sm font-bold text-white">Tổng Đài Kỹ Thuật</span>
                  </button>
                </section>
              </div>

              {/* LIVE SEAT DENSITY */}
              <section className="bg-[#1f2020] border border-[#e9c176]/10 p-6 md:p-8 rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white font-serif tracking-wide">Mật Độ Khán Giả Trong Suất Chiếu Trực Tuyến</h3>
                    <p className="text-[#9a8f80] text-xs mt-0.5">Trạng thái đặt ghế thực tế dựa trên suất chiếu hiện tại của từng phòng chiếu</p>
                  </div>
                  <div className="flex items-center gap-2 bg-[#e9c176]/10 border border-[#e9c176]/30 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#e9c176]">
                    <div className="w-2 h-2 rounded-full bg-[#e9c176] animate-pulse" />
                    <span>Real-time DB Monitor</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {screens.map(screen => {
                    const data = screenOccupancy[screen.id] || { percent: 0, status: 'Trống', dots: [0,0,0,0,0,0,0,0,0,0,0,0] };
                    return (
                      <div key={screen.id} className="space-y-3 text-center bg-[#131313]/50 p-4 rounded-xl border border-[#4e4639]/10">
                        <div className="aspect-square bg-[#1f2020] rounded-xl p-3 flex flex-wrap gap-1.5 items-center justify-center content-center border border-[#4e4639]/20 max-w-[120px] mx-auto">
                          {data.dots.map((dot, idx) => (
                            <div key={idx} className={`w-2.5 h-2.5 rounded-full ${dot === 1 ? 'bg-[#e9c176]' : 'bg-[#4e4639]'}`} />
                          ))}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm truncate">{screen.name}</p>
                          {data.movieTitle && <p className="text-[10px] text-stone-500 truncate mt-0.5 font-medium">{data.movieTitle}</p>}
                        </div>
                        <span className={`text-xs block font-bold ${data.percent >= 80 ? 'text-[#a4c9ff]' : data.percent > 0 ? 'text-[#e9c176]' : 'text-stone-600'}`}>
                          {data.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {/* ==================== TAB 2: QUẢN LÝ PHIM ==================== */}
          {activeTab === 'movies' && (
            <section className="bg-[#1f2020] border border-[#4e4639]/30 rounded-2xl p-6 shadow-xl flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#4e4639]/20 pb-5 gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white font-serif tracking-wide">Danh Sách Phim</h3>
                  <p className="text-xs text-[#9a8f80] mt-0.5">Quản lý kho phim, tải ảnh poster và cấu hình chi tiết chiếu</p>
                </div>
                <button 
                  onClick={handleOpenMovieAdd}
                  className="bg-[#e9c176] text-[#261900] font-bold rounded-xl px-4 py-2.5 text-xs hover:bg-[#d9b166] cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Plus size={14} /> THÊM PHIM MỚI
                </button>
              </div>

              {/* MOVIE GRID LIST */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
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

          {/* ==================== TAB 3: CẤU HÌNH PHÒNG & GHẾ ==================== */}
          {activeTab === 'screens' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* Screen List */}
              <section className="xl:col-span-4 bg-[#1f2020] border border-[#4e4639]/30 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-[#4e4639]/20 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white font-sans tracking-wide">PHÒNG CHIẾU HỆ THỐNG</h3>
                    <p className="text-[10px] text-[#9a8f80] mt-0.5">Lựa chọn phòng để hiển thị sơ đồ ghế</p>
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
                          <span className="font-mono">Mã phòng: {screen.id}</span>
                          <span>Ghế trong DB: <strong className="text-white font-mono">{screen.totalSeats || '0'} ghế</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Seat matrix visualizar */}
              <section className="xl:col-span-8 bg-[#1f2020] border border-[#4e4639]/30 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col gap-6">
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
                        <Armchair size={14} /> {generatingSeats ? "ĐANG TẠO MA TRẬN..." : "TỰ ĐỘNG TẠO MA TRẬN GHẾ"}
                      </button>
                    </div>

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
                            <span className="text-red-400">SWEETBOX (Hàng J)</span>
                          </div>
                        </div>

                        {/* SEAT GRID LAYOUT */}
                        <div className="flex flex-col gap-2 pt-2 min-w-[500px]">
                          {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J'].map(row => {
                            const rowSeats = seats.filter(s => s.seatRow === row);
                            if (rowSeats.length === 0) return null;

                            return (
                              <div key={row} className="flex items-center gap-3">
                                <span className="w-4 text-xs font-bold text-[#9a8f80] font-mono text-right">{row}</span>
                                <div className="flex items-center gap-2">
                                  {rowSeats.map(seat => {
                                    const isVip = seat.type === 'VIP';
                                    const isDouble = seat.type === 'SWEETBOX_DOUBLE';

                                    return (
                                      <div 
                                        key={seat.id}
                                        className={`rounded text-[8px] font-bold font-mono flex items-center justify-center transition-all ${
                                          isDouble 
                                            ? 'w-10 h-6.5 bg-red-500/10 border border-red-500/50 text-red-400'
                                            : isVip
                                              ? 'w-6.5 h-6.5 bg-[#e9c176]/10 border border-[#e9c176]/50 text-[#e9c176]'
                                              : 'w-6.5 h-6.5 bg-[#353535] border border-stone-600 text-stone-300'
                                        }`}
                                        title={`Ghế ${row}-${seat.seatNumber} (${seat.type})`}
                                      >
                                        {row}{seat.seatNumber}
                                      </div>
                                    );
                                  })}
                                </div>
                                <span className="w-4 text-xs font-bold text-[#9a8f80] font-mono">{row}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-16 bg-[#131313]/60 border border-[#4e4639]/20 rounded-2xl border-dashed">
                        <Armchair size={48} className="text-[#4e4639] mx-auto mb-3 animate-pulse" />
                        <h4 className="text-sm font-bold text-stone-400">Phòng chưa được cấu hình ghế</h4>
                        <p className="text-xs text-[#9a8f80] max-w-xs mx-auto mt-1">Vui lòng click nút "Tự động tạo ma trận ghế" bên trên để sinh sơ đồ ghế lập tức!</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-20 text-[#9a8f80] text-sm font-serif">
                    Chọn một phòng chiếu bên tay trái để thiết lập sơ đồ ghế!
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ==================== TAB 4: QUẢN LÝ SUẤT CHIẾU ==================== */}
          {activeTab === 'showtimes' && (
            <section className="bg-[#1f2020] border border-[#4e4639]/30 rounded-2xl p-6 shadow-xl flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#4e4639]/20 pb-5 gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white font-serif tracking-wide">Quản Lý & Phân Bổ Suất Chiếu</h3>
                  <p className="text-xs text-[#9a8f80] mt-0.5">Xây dựng khung giờ chiếu cho các phòng rạp, hệ thống tự động kiểm tra trùng lịch</p>
                </div>
                <button 
                  onClick={() => setShowAddShowtimeModal(true)}
                  className="bg-[#e9c176] text-[#261900] font-bold rounded-xl px-4 py-2.5 text-xs hover:bg-[#d9b166] cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Plus size={14} /> TẠO SUẤT CHIẾU MỚI
                </button>
              </div>

              {/* SHOWTIMES TABLE LIST */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-[#131313]/50 text-[#9a8f80] text-[10px] uppercase tracking-wider font-bold border-b border-[#4e4639]/20">
                      <th className="px-6 py-4">Mã Suất</th>
                      <th className="px-6 py-4">Tên Phim</th>
                      <th className="px-6 py-4">Phòng Chiếu</th>
                      <th className="px-6 py-4">Thời Gian</th>
                      <th className="px-6 py-4">Giá Vé Cơ Bản</th>
                      <th className="px-6 py-4 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#4e4639]/10 text-xs md:text-sm">
                    {showtimes.map(st => {
                      const stDateStr = st.startTime.split('T')[0];
                      const stTimeStr = st.startTime.split('T')[1].substring(0, 5);
                      const enTimeStr = st.endTime.split('T')[1].substring(0, 5);
                      return (
                        <tr key={st.id} className="hover:bg-[#353535]/20 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-[#e9c176]">{st.id}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-white">{st.movieTitle}</span>
                              <span className="text-[10px] text-[#9a8f80] mt-0.5 font-mono">{st.movieFormat} · {st.duration} Phút</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-stone-200">{st.screenName}</span>
                          </td>
                          <td className="px-6 py-4 font-mono">
                            <div className="flex flex-col">
                              <span className="text-white font-semibold">{stTimeStr} - {enTimeStr}</span>
                              <span className="text-[10px] text-[#9a8f80] mt-0.5">{stDateStr}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-white font-bold">{Number(st.basePrice).toLocaleString()}đ</td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => handleDeleteShowtime(st.id)}
                              className="border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-lg p-2 cursor-pointer transition-all inline-flex items-center"
                              title="Xóa suất chiếu"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {showtimes.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-[#9a8f80] italic">Chưa có lịch trình suất chiếu nào được tạo</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ==================== TAB 5: DANH SÁCH NHÂN SỰ ==================== */}
          {activeTab === 'staff' && (
            <section className="bg-[#1f2020] border border-[#4e4639]/30 rounded-2xl p-6 shadow-xl flex flex-col">
              <div className="border-b border-[#4e4639]/20 pb-5 mb-6">
                <h3 className="text-lg font-bold text-white font-serif tracking-wide">Nhân Sự Quầy Vé (Staff Network)</h3>
                <p className="text-xs text-[#9a8f80] mt-0.5">Danh sách các tài khoản kiểm vé & hỗ trợ tại quầy rạp chiếu</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {staffList.map(staff => (
                  <div key={staff.id} className="bg-[#131313]/60 border border-[#4e4639]/30 rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden group shadow-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 uppercase text-sm">
                          {staff.username.substring(0, 2)}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-base font-sans leading-snug">{staff.fullName}</h4>
                          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mt-0.5">Nhân Viên Quầy Vé</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] text-emerald-400 font-bold">
                        <UserCheck size={10} /> Active
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-[#d1c5b4] border-t border-[#4e4639]/20 pt-4 font-medium">
                      <p className="flex justify-between"><span className="text-[#9a8f80]">Tên Đăng Nhập:</span> <span className="font-mono text-white">{staff.username}</span></p>
                      <p className="flex justify-between"><span className="text-[#9a8f80]">Hòm Thư:</span> <span className="text-stone-300 font-mono select-all truncate max-w-[170px]">{staff.email}</span></p>
                      <p className="flex justify-between"><span className="text-[#9a8f80]">Điện thoại:</span> <span className="font-mono text-white">{staff.phone || 'Chưa cung cấp'}</span></p>
                    </div>
                  </div>
                ))}
                {staffList.length === 0 && (
                  <div className="col-span-full text-center py-8 text-[#9a8f80] italic">Không có tài khoản nhân viên nào trên hệ thống</div>
                )}
              </div>
            </section>
          )}

        </main>

        {/* FOOTER */}
        <footer className="p-6 border-t border-[#4e4639]/20 flex justify-between items-center text-[#9a8f80] text-[10px] uppercase tracking-widest font-semibold bg-[#131313]">
          <div>Cinema Plus Operational Core</div>
          <div>© 2026 Cinema Plus. All Rights Reserved.</div>
        </footer>

      </div>

      {/* ==================== MODALS ==================== */}

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

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#9a8f80] uppercase tracking-wider block">Trailer URL (Youtube Link)</label>
                  <input 
                    type="text" 
                    className="w-full bg-[#131313] border border-[#4e4639]/70 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e9c176] transition-all"
                    value={movieForm.trailerUrl}
                    onChange={(e) => setMovieForm(prev => ({ ...prev, trailerUrl: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-bold text-[#9a8f80] uppercase tracking-wider block">Tóm tắt nội dung phim</label>
                  <textarea 
                    rows="3"
                    className="w-full bg-[#131313] border border-[#4e4639]/70 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e9c176] transition-all"
                    value={movieForm.description}
                    onChange={(e) => setMovieForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2 border border-[#4e4639]/40 bg-[#131313]/25 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-20 h-28 bg-black/40 border border-[#4e4639]/50 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                    {movieForm.posterUrl ? (
                      <img src={`http://localhost:8081${movieForm.posterUrl}`} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Image size={24} className="text-[#4e4639]" />
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <label className="text-[11px] font-bold text-[#9a8f80] uppercase tracking-wider block">Tải ảnh bìa phim (Poster)</label>
                    <div className="relative w-full">
                      <input type="file" accept="image/*" id="poster-input-manager" className="hidden" onChange={handlePosterUpload} />
                      <label 
                        htmlFor="poster-input-manager"
                        className="bg-[#353535] hover:bg-[#404040] border border-[#4e4639]/80 text-[#d1c5b4] hover:text-[#e9c176] rounded-xl px-4 py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Upload size={14} /> {uploadingPoster ? "Đang tải ảnh..." : "Chọn file ảnh..."}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

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
                  className={`bg-[#e9c176] text-[#261900] font-bold rounded-xl px-6 py-2.5 cursor-pointer hover:bg-[#d9b166] transition-colors ${uploadingPoster && 'opacity-50 cursor-not-allowed'}`}
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
                <label className="text-[11px] font-bold text-[#9a8f80] uppercase block">Tên phòng chiếu</label>
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
                  TẠO PHÒNG
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Showtime Modal */}
      {showAddShowtimeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-[#1f2020] border border-[#e9c176]/20 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#4e4639]/30 bg-[#131313]/30 flex justify-between items-center">
              <h3 className="text-base font-bold text-white font-serif">⏰ Tạo Suất Chiếu Mới</h3>
              <button onClick={() => setShowAddShowtimeModal(false)} className="text-stone-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAddShowtime} className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#9a8f80] uppercase block">Chọn Phim</label>
                <select
                  required
                  className="w-full bg-[#131313] border border-[#4e4639]/70 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e9c176]"
                  value={showtimeForm.movieId}
                  onChange={(e) => setShowtimeForm(prev => ({ ...prev, movieId: e.target.value }))}
                >
                  <option value="">-- Chọn phim --</option>
                  {movies.map(m => (
                    <option key={m.id} value={m.id}>{m.title} ({m.duration} phút)</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#9a8f80] uppercase block">Chọn Phòng Chiếu</label>
                <select
                  required
                  className="w-full bg-[#131313] border border-[#4e4639]/70 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e9c176]"
                  value={showtimeForm.screenId}
                  onChange={(e) => setShowtimeForm(prev => ({ ...prev, screenId: e.target.value }))}
                >
                  <option value="">-- Chọn phòng --</option>
                  {screens.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (ID: {s.id})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#9a8f80] uppercase block">Giờ Bắt Đầu</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full bg-[#131313] border border-[#4e4639]/70 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e9c176]"
                  value={showtimeForm.startTime}
                  onChange={(e) => setShowtimeForm(prev => ({ ...prev, startTime: e.target.value }))}
                />
                <p className="text-[10px] text-[#9a8f80]">⚡ Hệ thống tự động tính giờ kết thúc = Bắt đầu + Thời lượng phim + 15 phút dọn rạp.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#9a8f80] uppercase block">Giá Vé Cơ Bản (đ)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  placeholder="Ví dụ: 120000"
                  className="w-full bg-[#131313] border border-[#4e4639]/70 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#e9c176]"
                  value={showtimeForm.basePrice}
                  onChange={(e) => setShowtimeForm(prev => ({ ...prev, basePrice: e.target.value }))}
                />
              </div>
              <div className="pt-3 border-t border-[#4e4639]/20 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddShowtimeModal(false)}
                  className="bg-[#353535] hover:bg-[#404040] text-white rounded-xl px-4 py-2 cursor-pointer text-xs font-semibold">
                  HỦY
                </button>
                <button type="submit"
                  className="bg-[#e9c176] text-[#261900] rounded-xl px-5 py-2 font-bold hover:bg-[#d9b166] cursor-pointer text-xs">
                  TẠO SUẤT CHIẾU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Simulated Quick Action Alert Modal */}
      {simulatedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1f2020] border border-[#e9c176]/30 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <h3 className="text-lg font-bold text-[#e9c176] mb-3">{simulatedAlert.title}</h3>
            <p className="text-sm text-stone-300 mb-6 leading-relaxed">{simulatedAlert.message}</p>
            <button 
              onClick={() => setSimulatedAlert(null)}
              className="bg-[#e9c176] text-[#261900] rounded-xl px-6 py-2.5 font-bold hover:bg-[#d9b166] text-xs cursor-pointer transition-all active:scale-95"
            >
              XÁC NHẬN
            </button>
          </div>
        </div>
      )}

    </div>
  );
}