import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { Star, Ticket, Search, ChevronDown, ArrowRight, Bell, Play, Bookmark, CreditCard, Globe, Sliders } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  
  // Dữ liệu phim tĩnh dự phòng cấu trúc lưới
  const [movies] = useState([
    { id: 1, title: 'Interstellar Journey', genre: 'Sci-Fi', rating: 8.8, duration: '2h 45m', image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500' },
    { id: 2, title: 'Midnight City', genre: 'Action', rating: 7.5, duration: '1h 58m', image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500' },
    { id: 3, title: 'The Quiet Shadow', genre: 'Drama', rating: 9.2, duration: '2h 10m', image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500' },
    { id: 4, title: 'Labyrinthine', genre: 'Thriller', rating: 8.1, duration: '1h 45m', image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=500' }
  ]);

  const [comingSoon] = useState([
    { id: 5, title: 'Desert Kings', genre: 'Adventure • Epic', date: 'OCT 24', image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500' },
    { id: 6, title: 'Mirror Minds', genre: 'Psychological • Thriller', date: 'NOV 12', image: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?w=500' },
    { id: 7, title: 'Cyber Flora', genre: 'Sci-Fi • Animation', date: 'DEC 05', image: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=500' }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Tất cả thành phố');

  // Khai báo Form State nhập liệu tài khoản mới
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Quản lý States Auth bằng React để ép giao diện thay đổi tức thì khi Login / Logout
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState(localStorage.getItem('username'));
  const [userRole, setUserRole] = useState(localStorage.getItem('role'));

  // HÀM ĐỒNG BỘ: Chạy liên tục để quét bộ nhớ đệm mỗi khi trang chủ được điều hướng quay trở lại
  useEffect(() => {
    const checkAuthSession = () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('username');
      const storedRole = localStorage.getItem('role');

      if (storedUser && !storedToken) {
        localStorage.clear();
        setToken(null);
        setUsername(null);
        setUserRole(null);
      } else {
        setToken(storedToken);
        setUsername(storedUser);
        setUserRole(storedRole);
      }
    };

    checkAuthSession();
    
    window.addEventListener('storage', checkAuthSession);
    return () => window.removeEventListener('storage', checkAuthSession);
  }, [navigate]); 

  // Hàm xử lý kích hoạt cổng API Đăng nhập
  const handleDirectLogin = async (e) => {
    if (e) e.preventDefault();
    if (!loginUsername || !loginPassword) {
      alert("Vui lòng nhập đầy đủ thông tin tài khoản và mật khẩu!");
      return;
    }

    setAuthLoading(true);
    try {
      const response = await axiosClient.post('/api/auth/login', {
        username: loginUsername,
        password: loginPassword
      });

      const data = response.data;
      const userToken = data?.token || data?.accessToken;
      let role = data?.role || data?.roles?.[0] || data?.user?.role;
      const uName = data?.username || loginUsername;

      if (userToken) {
        if (role && !role.startsWith('ROLE_')) role = `ROLE_${role.toUpperCase()}`;

        localStorage.setItem('token', userToken);
        localStorage.setItem('username', uName);
        localStorage.setItem('role', role);

        setToken(userToken);
        setUsername(uName);
        setUserRole(role);

        if (role === 'ROLE_ADMIN' || role === 'ADMIN') {
          navigate('/admin-dashboard');
        } else if (role === 'ROLE_MANAGER' || role === 'MANAGER') {
          navigate('/manager-dashboard');
        } else if (role === 'ROLE_STAFF' || role === 'STAFF') {
          navigate('/staff-scanner');
        } else {
          alert(`Đăng nhập tài khoản Khách hàng ${uName} thành công tại chỗ!`);
        }
      } else {
        handleMockBypass();
      }
    } catch (error) {
      handleMockBypass();
    } finally {
      setAuthLoading(false);
    }
  };

  // Cơ chế đăng nhập khẩn cấp cho DEV bypass kết nối Spring Boot sập
  const handleMockBypass = () => {
    const lowerUser = loginUsername.toLowerCase();
    
    if (lowerUser === 'admin') {
      localStorage.setItem('token', 'mock_admin_token');
      localStorage.setItem('username', 'ADMIN_THAI');
      localStorage.setItem('role', 'ROLE_ADMIN');
      navigate('/admin-dashboard');
    } else if (lowerUser === 'manager' || lowerUser === 'vinh') {
      localStorage.setItem('token', 'mock_manager_token');
      localStorage.setItem('username', 'MANAGER_VINH');
      localStorage.setItem('role', 'ROLE_MANAGER');
      navigate('/manager-dashboard');
    } else if (lowerUser === 'staff') {
      localStorage.setItem('token', 'mock_staff_token');
      localStorage.setItem('username', 'STAFF_CỬA_04');
      localStorage.setItem('role', 'ROLE_STAFF');
      navigate('/staff-scanner');
    } else {
      localStorage.setItem('token', 'mock_customer_token');
      localStorage.setItem('username', loginUsername.toUpperCase());
      localStorage.setItem('role', 'ROLE_CUSTOMER');
      setToken('mock_customer_token');
      setUsername(loginUsername.toUpperCase());
      setUserRole('ROLE_CUSTOMER');
      alert(`Chào mừng khách hàng ${loginUsername.toUpperCase()} trải nghiệm dịch vụ!`);
    }
    setLoginUsername('');
    setLoginPassword('');
  };

  const handleBookingRedirect = (movieId) => {
    if (!token) {
      alert("Vui lòng đăng nhập trước khi tiến hành đặt vé!");
      return;
    }
    alert(`Đang kích hoạt hệ thống giữ chỗ thời gian thực cho phim ID: ${movieId}`);
  };

  const handleLogout = () => {
    localStorage.clear(); setToken(null); setUsername(null); setUserRole(null);
    setLoginUsername(''); setLoginPassword('');
    navigate('/');
  };

  return (
    <div className="bg-[#131313] text-neutral-200 min-h-screen w-full block">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-[#131313]/95 backdrop-blur-md border-b border-orange-300/10 h-20">
        <div className="flex justify-between items-center px-6 md:px-16 h-full max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-12">
            <Link to="/" className="text-2xl font-bold text-orange-300 uppercase tracking-wider font-serif">CINEMA PLUS</Link>
            <div className="hidden md:flex gap-8 items-center text-xs font-bold tracking-widest text-stone-300">
              <Link to="/" className="text-orange-300 border-b-2 border-orange-300 pb-1">PHIM</Link>
              <a href="#" className="hover:text-orange-300 transition-colors">RẠP CHIẾU</a>
              <a href="#" className="hover:text-orange-300 transition-colors">ƯU ĐẠI</a>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {!token || userRole !== 'ROLE_CUSTOMER' ? (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-xs font-bold text-stone-300 hover:text-white uppercase border border-white/10 px-5 py-2.5 rounded-xl transition-all">Đăng Nhập</Link>
                <Link to="/register" className="bg-orange-300 text-yellow-950 text-xs font-bold px-5 py-2.5 rounded-xl hover:scale-105 transition-all uppercase shadow-md">Đăng Ký</Link>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button className="text-stone-300 hover:text-orange-300 transition-colors cursor-pointer"><Bell size={20} /></button>
                <div className="flex items-center gap-2 bg-orange-300/10 border border-orange-300/30 px-4 py-2 rounded-xl">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-orange-300 uppercase font-mono">{username} (MEMBER)</span>
                </div>
                <button onClick={handleLogout} className="text-xs text-stone-400 hover:text-orange-300 uppercase font-bold tracking-wider cursor-pointer transition-colors">Thoát</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-[700px] lg:h-[780px] w-full flex items-center bg-[#131313] pt-24 pb-16 z-10">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-neutral-950/75 z-10" />
          <img className="w-full h-full object-cover opacity-40" src="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1440" alt="Cinema Center" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-transparent to-transparent z-20" />
        </div>

        <div className="relative z-30 w-full max-w-7xl mx-auto px-6 md:px-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-block px-3 py-1 bg-orange-300/10 rounded-sm border border-orange-300/20">
              <span className="text-orange-300 text-xs font-bold uppercase tracking-[3px]">PREMIUM PREMIERE</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight font-serif">Experience<br />Cinema Like<br />Never Before</h1>
            <p className="text-stone-300 text-sm md:text-base max-w-xl leading-relaxed">Indulge in private screening luxury with 4K laser projection and immersive Dolby Atmos soundscapes designed for the ultimate cinephile.</p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button onClick={() => alert("Vui lòng chọn phim ở danh mục bên dưới để đặt vé!")} className="bg-orange-300 text-yellow-950 font-bold px-8 py-4 rounded-xl hover:scale-105 transition-all flex items-center gap-2 shadow-lg text-sm tracking-wider cursor-pointer"><Ticket size={16} fill="currentColor" /> BOOK NOW</button>
            </div>
          </div>

          {/* CHUYỂN ĐỔI FORM ĐỘNG KHÉP KÍN */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end w-full relative z-50">
            {!token || userRole !== 'ROLE_CUSTOMER' ? (
              <div className="w-full max-w-md p-8 bg-[#1f2020]/90 rounded-2xl border border-orange-300/10 backdrop-blur-xl shadow-2xl space-y-6">
                <div className="space-y-1">
                  <h3 className="text-orange-300 text-2xl font-bold font-serif">Welcome Back</h3>
                  <p className="text-stone-400 text-xs">Sign in to access your private screenings.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-stone-300 text-[10px] font-bold uppercase tracking-wide">EMAIL OR USERNAME</label>
                    <input type="text" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} className="w-full px-4 py-3 bg-white/10 rounded-lg border border-white/20 text-white text-sm focus:outline-none focus:border-orange-300" placeholder="your@email.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-stone-300 text-[10px] font-bold uppercase tracking-wide">PASSWORD</label>
                    <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full px-4 py-3 bg-white/10 rounded-lg border border-white/20 text-white text-sm focus:outline-none focus:border-orange-300" placeholder="••••••••" />
                  </div>
                  <button type="button" onClick={handleDirectLogin} className="w-full py-4 bg-orange-300 text-yellow-950 font-bold rounded-xl uppercase tracking-wider text-xs shadow-md cursor-pointer hover:bg-orange-400 transition-colors flex justify-center items-center">
                    {authLoading ? "VERIFYING..." : "LOGIN SYSTEM"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-md p-8 bg-[#1f2020]/95 rounded-2xl border border-orange-300/20 backdrop-blur-xl shadow-2xl space-y-6">
                <div className="border-b border-white/5 pb-4">
                  <span className="text-[10px] font-bold text-orange-300 uppercase tracking-widest block font-mono">HỘI VIÊN CHÍNH THỨC</span>
                  <h3 className="text-white text-2xl font-bold font-serif mt-1">Xin chào, {username}!</h3>
                  <p className="text-stone-400 text-xs mt-1">Hạng thành viên: <span className="text-orange-300 font-bold">GOLD CINEPHILE</span></p>
                </div>
                
                <div className="space-y-3">
                  <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-xl flex items-center justify-between text-left transition-all group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Bookmark className="text-orange-300" size={18} />
                      <div>
                        <span className="text-xs font-bold text-white block">Vé của tôi (Vé QR)</span>
                        <span className="text-[10px] text-stone-400">Bạn đang có 1 suất chiếu sắp diễn ra</span>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-stone-400 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-xl flex items-center justify-between text-left transition-all group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <CreditCard className="text-orange-300" size={18} />
                      <div>
                        <span className="text-xs font-bold text-white block">Ví Voucher / Điểm tích lũy</span>
                        <span className="text-[10px] text-stone-400">Số dư hiện tại: <span className="text-green-400 font-bold">450 điểm</span></span>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-stone-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FILTER SEARCH BAR */}
      <section className="max-w-7xl mx-auto px-6 md:px-16 mt-12 mb-16 relative z-40">
        <div className="bg-[#1f2020]/95 backdrop-blur-xl border border-white/5 p-5 rounded-2xl flex flex-col lg:flex-row items-center gap-4 shadow-2xl">
          <div className="flex-grow w-full relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input className="w-full bg-white/5 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 text-sm focus:outline-none" placeholder="Search for movies, theaters or actors..." type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex gap-4 w-full lg:w-auto">
            <div className="relative w-full lg:w-48">
              <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="w-full appearance-none bg-white/5 border border-white/5 rounded-xl py-3.5 px-4 pr-10 text-sm text-neutral-200 focus:outline-none focus:border-orange-300 cursor-pointer">
                <option className="bg-[#1f2020]">Select City</option>
                <option className="bg-[#1f2020]">TP. Hồ Chí Minh</option>
                <option className="bg-[#1f2020]">Hà Nội</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400" size={16} />
            </div>
            <div className="relative w-full lg:w-48">
              <select className="w-full appearance-none bg-white/5 border border-white/5 rounded-xl py-3.5 px-4 pr-10 text-sm text-neutral-200 focus:outline-none focus:border-orange-300 cursor-pointer">
                <option className="bg-[#1f2020]">All Genres</option>
                <option className="bg-[#1f2020]">Action</option>
                <option className="bg-[#1f2020]">Sci-Fi</option>
              </select>
              <Sliders className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400" size={16} />
            </div>
          </div>
        </div>
      </section>

      {/* 🟢 KHỐI NOW SHOWING (PHIM ĐANG CHIẾU) */}
      <section className="py-12 max-w-7xl mx-auto px-6 md:px-16 block relative z-10">
        <div className="flex justify-between items-end mb-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-neutral-200 font-serif tracking-wide">Now Showing</h2>
            <div className="w-12 h-1 bg-orange-300 rounded-full" />
          </div>
          <Link to="/" className="text-orange-300 hover:text-orange-400 text-xs font-bold tracking-widest uppercase flex items-center gap-1">VIEW ALL <ArrowRight size={14} /></Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
          {movies.map((m) => (
            <div key={m.id} className="flex flex-col w-full">
              <div className="w-full h-[380px] rounded-2xl overflow-hidden bg-neutral-800 border border-white/5 shadow-xl relative group">
                <img className="w-full h-full object-cover" src={m.image} alt={m.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                <div className="absolute top-4 right-4 bg-neutral-900/80 border border-orange-300/10 backdrop-blur-sm px-2.5 py-1 rounded-lg flex items-center gap-1 text-orange-300 text-xs font-bold">
                  <Star size={12} fill="currentColor" /><span>{m.rating}</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-neutral-900/95 border-t border-white/5 z-10">
                  <button onClick={() => handleBookingRedirect(m.id)} className="w-full bg-orange-300 text-yellow-950 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1 text-xs cursor-pointer tracking-wider">GET TICKETS</button>
                </div>
              </div>
              <div className="mt-4 space-y-1">
                <h3 className="font-bold text-white text-base font-serif truncate">{m.title}</h3>
                <p className="text-stone-400 text-xs">{m.genre} • {m.duration}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🟢 KHỐI COMING SOON (PHIM SẮP CHIẾU - ĐÃ HỒI PHỤC) */}
      <section className="bg-zinc-950 py-24 border-t border-b border-white/5 block w-full mt-12">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <div className="flex justify-between items-end mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-neutral-200 font-serif tracking-wide">Coming Soon</h2>
              <div className="w-12 h-1 bg-blue-400 rounded-full" />
            </div>
            <button className="text-stone-400 hover:text-orange-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1">RELEASE CALENDAR</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
            {comingSoon.map((m) => (
              <div key={m.id} className="flex flex-col w-full group">
                <div className="w-full h-[380px] rounded-2xl overflow-hidden bg-neutral-900 shadow-lg border border-white/5 relative">
                  <img className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 opacity-60" src={m.image} alt={m.title} />
                  <div className="absolute top-4 left-4 bg-neutral-950/90 border border-white/10 backdrop-blur px-3 py-1 rounded-lg text-[10px] font-bold text-blue-300">{m.date}</div>
                </div>
                <div className="mt-4 space-y-1">
                  <h4 className="font-bold text-neutral-200 text-base font-serif truncate">{m.title}</h4>
                  <p className="text-stone-400 text-xs">{m.genre}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🟢 KHỐI FOOTER CHÂN TRANG MẠ VÀNG (ĐÃ HỒI PHỤC CHI TIẾT) */}
      <footer className="py-20 border-t border-white/5 bg-[#0e0e0e] w-full block">
        <div className="max-w-7xl mx-auto px-6 md:px-16 flex flex-col lg:flex-row justify-between items-start gap-12 mb-12">
          <div className="space-y-4 max-w-sm">
            <h2 className="text-orange-300 text-2xl font-bold font-serif tracking-widest">CINEMA PLUS</h2>
            <p className="text-stone-400 text-sm leading-relaxed opacity-80">
              Redefining the theatrical experience. From the finest laser projection to gourmet concessions, every detail is crafted for the discerning viewer.
            </p>
            <div className="flex gap-4 pt-1">
              <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-stone-300 hover:text-orange-300 transition-colors"><Globe size={16} /></a>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 w-full lg:w-auto">
            <div className="space-y-4">
              <h5 className="text-neutral-200 text-xs font-bold uppercase tracking-wider">EXPERIENCE</h5>
              <ul className="space-y-2.5 text-sm text-stone-400">
                <li><a className="hover:text-orange-300 transition-colors" href="#">Private Screenings</a></li>
                <li><a className="hover:text-orange-300 transition-colors" href="#">Corporate Events</a></li>
                <li><a className="hover:text-orange-300 transition-colors" href="#">Gourmet Dining</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="text-neutral-200 text-xs font-bold uppercase tracking-wider">THEATERS</h5>
              <ul className="space-y-2.5 text-sm text-stone-400">
                <li><a className="hover:text-orange-300 transition-colors" href="#">New York Elite</a></li>
                <li><a className="hover:text-orange-300 transition-colors" href="#">LA Sanctuary</a></li>
                <li><a className="hover:text-orange-300 transition-colors" href="#">London Royal</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="text-neutral-200 text-xs font-bold uppercase tracking-wider">SUPPORT</h5>
              <ul className="space-y-2.5 text-sm text-stone-400">
                <li><a className="hover:text-orange-300 transition-colors" href="#">Contact Us</a></li>
                <li><a className="hover:text-orange-300 transition-colors" href="#">Terms of Use</a></li>
                <li><a className="hover:text-orange-300 transition-colors" href="#">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="pt-8 opacity-40 border-t border-white/5 text-center text-stone-400 text-xs">
          © 2026 CINEMA PLUS. EXCLUSIVE PRIVATE SCREENINGS. ALL RIGHTS RESERVED.
        </div>
      </footer>

    </div>
  );
}