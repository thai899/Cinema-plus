import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar.jsx';
import axiosClient from '../../api/axiosClient';
import { 
  Star, Clock, Ticket, Search, Sliders, ChevronDown, Calendar, ArrowRight, Loader2,
  QrCode, History, Award, Film, LogOut, Utensils, Zap, Bell
} from 'lucide-react';

export default function CustomerProfile() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [comingSoon, setComingSoon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Tất cả');
  
  // Lấy tên khách hàng hoạt động từ LocalStorage khi đăng nhập thành công
  const customerName = localStorage.getItem('username') || 'Khách Hàng';

  // Trạng thái dữ liệu thẻ thành viên và lịch sử giao dịch điện tử
  const [customerData, setCustomerData] = useState({
    memberTier: 'VVIP PLATINUM',
    points: '4,500',
    memberId: 'CP-2026-8892',
    upcomingTickets: [
      { id: 991, movie: 'Oppenheimer', time: '20:00 - Hôm nay', room: 'PHÒNG CHIẾU 1', seats: 'Ghế H-12, H-13', code: 'QR-OPP-8821' }
    ],
    history: [
      { id: 4502, movie: 'Dune: Hành Tinh Cát - Phần II', date: '20/05/2026', amount: '240.000đ', type: 'Vé xem phim' },
      { id: 4311, movie: 'Combo Bắp Ngọt + 2 Pepsi', date: '20/05/2026', amount: '125.000đ', type: 'Bắp nước (F&B)' }
    ]
  });

  // 1. Gọi hệ thống API bốc tách danh sách phim từ SQL Server thông qua Spring Boot
  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        const nowShowingRes = await axiosClient.get('/api/movies/now-showing');
        const comingSoonRes = await axiosClient.get('/api/movies/coming-soon');
        const profileRes = await axiosClient.get('/api/customer/profile');
        
        setMovies(nowShowingRes.data || []);
        setComingSoon(comingSoonRes.data || []);
        setCustomerData(profileRes.data);
      } catch (error) {
        console.log("Nạp dữ liệu rạp phim dự phòng (Mô phỏng dữ liệu trục giao diện)");
        setMovies([
          { id: 1, title: 'Neon Requiem', genre: 'Khoa Học Viễn Tưởng', rating: 9.1, duration: '2h 14m', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC38xK7oFvVE1wuk41pYo2Faa7TXIx7L44Cq7z4t7ajpGC0c5PhiYvzmqiwuV9D0Zn1cPZhh_hdDWnbigQ4OZl-wTYHLupQvUBmMfxPX6g4IVKCfpwMur5DwdB-oSG7SL6cKUih8dEWXnIvEa1r2vlQnYZQz2auTp_VPiNeiTN4DaYVWujvUymzn3fAwcETDtAraGpNjK3AOA_TM_k3XVsMyLYpIukLSouzYcBzqTFhdQ_DQ4OtEufc5O4x2OZkpajFzkE5qeVJNxM' },
          { id: 2, title: 'The Last Meridian', genre: 'Kinh Dị - Giật Gân', rating: 8.7, duration: '1h 58m', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7nd8pNLlHpsOoyN15n5DqZ6lGWSv-f1EZKPSY1kmSOO5zKR8bZuSiDFN7Dbb8l7o51Bm3Whym5Qtp8k5rrz9nv-Ikv-zRRV0gFbgNbPiPZ00Dtbxxx5Aj3GQ9gj6ixmzqQvzp4HgVkLs1w7sct4rEjukYnfjFo9vXbIKRfPnpYhboZ6MlS-Dt-Lsvz_HBPrD9EvI5Q1N0buDUdNduzHHkQkJNUmbHIl3b5KLx4xHgqIDdK9qf7UGruwKrmFv9IUdi8QAGpHXc9d4' },
          { id: 3, title: 'Solaris Dreams', genre: 'Tâm Lý - Chính Kịch', rating: 8.4, duration: '2h 31m', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDs-OOcdKNnhhrsbwwub828tgh7HZHkrrLo8_HAt4lBU-KWtXtOnimca2ztr8EVkEtV-YQUooLZiV4JXUYvpV3XWpncrg82aEqAODAd2LwESsXRhelrXHBltzavoKX5T8Fe0xYDo56PlOXvORAMlUngR4PeU0wHB7znsDntj6tHK9PqSfKNcVMbSW4QAGXy9ETJ_XydXudcmN-rwhzm3ipemt7JPyorRk8Zml_pWd-G0UOjOukkTAB8wivQt97QDF9E0_zk68onF1w' },
          { id: 4, title: 'Iron Cascade', genre: 'Hành Động - Phiêu Lưu', rating: 7.9, duration: '2h 05m', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZDg2gxIPWLg7BiiDE-8juwP0qiMzYzeHgytv3UgSg90cZNOOPs15ngSuDG79PuH0cG1sCNfgYMlTezPsGt0JpQoFvennaJ8n21nSGR8Rg89KuxgafxO_08BeVjh7I3X8aQVc6QTGDjZ-q6equTi3jfZP6pFzqcxAyuY4Q4efsd5xNQyQi-l4Xp_jUjJlprrvisenalH8cKw5ZtArsnihtxF6ZIGXKLBYEQj1OEJ8mB_x2jiwIHNz5Vzq5DhESnQh0T2xa7I4N5ng' }
        ]);
        setComingSoon([
          { id: 5, title: 'Desert Kings', genre: 'Phiêu Lưu', date: '24 THÁNG 10', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmRvQAdmM-x6ibKu5hxcD_5D8t1980zO5AxahN-SZ1Dwbf0mb7DETVCig2RyIYEhlSoL3EiKZ1uHlyUBwfDzvdiuYJC_CsecOUPQjBkkEN7kNnJjGbaIrCgtecanHgnGUjCoZ9uwcjcn3-kQc54UfincQ4JrUgFWAwRHOVpN7RfHC01LiCZR9pyoht2guNoq6I5DkA3_Eq2bkkxCsc8OWIrtPz6eYiTznQRja0fwq2-9gmRDzjPyDTFbPsopVG3DuHPkUqCpMqRIM' },
          { id: 6, title: 'Mirror Minds', genre: 'Tâm Lý Giật Gân', date: '12 THÁNG 11', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUfmaCIXeVLHcsnwN0SCZj8aXrBsNB5MUTBmAI9jAKRMuXZBIh7dcA9sArHo0VbGYoKpZdEZKRXWsRrG6pTARIgt2JzgpSETFW0SX8GRm7XdwWBR1v8dBncj8o1GZHbsP97NdWUT9B_qhXqPSX-adh10RdqIaFNqWq5v_5Ee25Qtpgv2d9CHRs_74BbUX5d_lNp4fTIYKl75HqiipOWvV-xYG1EqACVijq4vahwjI0mVjD2IfiErkSWtB6-TgoOCmJJsWNQZh_pwY' },
          { id: 7, title: 'Cyber Flora', genre: 'Hoạt Họa Viễn Tưởng', date: '05 THÁNG 12', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCYMjZzqfpgpY_ReZ764GAfBI_avLg-pBWMpRjQ-9L0Hi5vwqd2cAoCgnV07p6bdJQsqYe6CjQ3WD2SfJFIUhT7hs1YBaAWUFeeNvmoXCYIuBCC5hDlWICsBC1_Zvl_ldWP0CYNBmjmq9D5mxcwBPPRUx3sugr4u3Mbh5LwfJTQK1jne8R_PpkiXUtOme49kp_LuK_ByrgZoEp2MrOg1drz4sdUQbshn3BHBBkcAB3bgSxxz_gDZtYnPpUM98wOEaVU6xL5Lb5IxXY' },
          { id: 8, title: 'Silent Harbor', genre: 'Hình Sự Đua Xe', date: '20 THÁNG 01', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAu0Ytz09i3GqHt5W4JKrmsRoeoOdhNCKljvCcXKqTbneKmN5tJHS8McBQTzahW47dUQMmrUjdFRSGfNwW2lMt6mTBN6D02x4_WCVbCrMoLyUL2id-zlIkgOQx2OTEaNen3TcDL7_e7Jx3eJk6zk79BG2OsuM9GQZVkXhV1ohiNUo3rT-M4d4MnJyjWW5DZyNyOC5EDYzuDGJZUGXBjX8T7a7p3-eXd7Ph0fqd5hdW1dCQuJhleYl1Y1dKWGpIGhdGT9mPYb-hOyo0' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPortalData();
  }, []);

  // 2. Kích hoạt hiệu ứng Staggered Animation trồi lên mượt mà khi load xong dữ liệu
  useEffect(() => {
    if (!loading) {
      const cards = document.querySelectorAll('.movie-card-animate');
      cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.5s ease-out';
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, 80 * index);
      });
    }
  }, [loading]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="bg-[#131313] min-h-screen flex flex-col justify-center items-center text-[#e9c176]">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-medium tracking-widest text-sm text-[#d1c5b4]">Đang nạp cổng thông tin đặc quyền thành viên...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#131313] text-[#e4e2e1] min-h-screen font-sans selection:bg-[#e9c176] selection:text-[#4e3700] overflow-y-auto overflow-x-hidden">
      <Navbar />

      {/* KHỐI 1: HERO VIEW - CHỈNH SỬA CHIỀU CAO LINH HOẠT KHÔNG DÙNG FIX CỨNG H-SCREEN TRÁNH TREO KHỐI */}
      <section className="relative min-h-[550px] md:h-[620px] w-full overflow-hidden flex items-center bg-[#131313]">
        <div className="absolute inset-0 z-0">
          <img className="w-full h-full object-cover opacity-50" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7c3jPlzTsb-ESXzJtt70TRfNeuTzRppMEP2rjQGjBKGft0HK636EOYjgoD40tgy5dbZwAyGP1Iv9CrSHJlpoHdyADPljjus3RmmJ_KksefBwl4Nl_iRadbPhm-7g6-xM4evt7Di7fwtLcFn-jqJ6pA5fh-Vu9dQHu0kIRwREXSv7e6H7jmkezINl4MuiO-qirvvh2trmM6MSFNynFmwL1CGLqlTSc2ErJL90FqPcoGkQftkqODhv9OFinP2eplwqQo5YepVG0qws" alt="Không gian Điện ảnh" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-[#131313]/50 to-transparent"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-16 pt-24 pb-32">
          <div className="max-w-3xl space-y-4">
            <span className="inline-block px-4 py-1 rounded-full bg-[#e9c176]/20 text-[#e9c176] border border-[#e9c176]/30 text-xs font-bold tracking-widest uppercase animate-pulse">
              Thành viên đặc quyền hoạt động
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-white font-serif tracking-tight leading-tight">
              Chào mừng trở lại, <span className="text-[#e9c176] uppercase">{customerName}</span>!
            </h1>
            <p className="text-[#d1c5b4] text-base md:text-lg max-w-xl leading-relaxed">
              Suất chiếu VIP của bạn đã sẵn sàng. Hãy kiểm tra thẻ thành viên, vé điện tử QR Code soát cửa hoặc chọn thêm các bộ phim mới đang chiếu dưới quầy nhé.
            </p>
          </div>
        </div>
      </section>

      {/* KHỐI 2: TRUNG TÂM TAB CHỨC NĂNG BENTO MỚI (Được dâng cao lên đè mờ vào phần Hero) */}
      <section className="relative -mt-24 z-30 max-w-7xl mx-auto px-6 md:px-16 space-y-6 clear-both block">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Trái: Thẻ Thành Viên Cao Cấp (Mạ vàng) */}
          <div className="lg:col-span-4 bg-gradient-to-br from-[#c5a059] to-[#5d4201] p-6 rounded-2xl shadow-2xl text-[#261900] flex flex-col justify-between h-[280px] border border-white/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Award size={150} />
            </div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase opacity-70">Thẻ Thành Viên Điện Tử</p>
                <h3 className="text-2xl font-extrabold tracking-tight mt-1 font-serif">{customerData.memberTier}</h3>
              </div>
              <Zap size={22} fill="currentColor" />
            </div>
            <div className="mt-6">
              <p className="text-[11px] font-bold opacity-60 uppercase">Điểm Tích Lũy Rạp Phim</p>
              <h2 className="text-4xl font-black font-mono tracking-tighter mt-1">{customerData.points} <span className="text-xs font-bold opacity-80">Điểm</span></h2>
            </div>
            <div className="flex justify-between items-end border-t border-black/10 pt-4 text-xs font-mono font-bold opacity-80">
              <span>MÃ THẺ: {customerData.memberId}</span>
              <span className="flex items-center gap-1 cursor-pointer hover:underline"><QrCode size={14} /> Mã QR</span>
            </div>
          </div>

          {/* Phải: QR Code Vé Xem Phim Chuẩn Bị Chiếu */}
          <div className="lg:col-span-8 bg-[#1f2020]/90 backdrop-blur-xl border border-[#e9c176]/10 p-6 rounded-2xl shadow-2xl flex flex-col justify-between min-h-[280px]">
            <div className="flex items-center gap-2 pb-3 border-b border-[#4e4639]/20">
              <Ticket className="text-[#e9c176]" size={18} />
              <h3 className="text-sm font-bold text-white font-serif uppercase tracking-wider">Vé Xem Phim Sắp Đến Giờ Chiếu (QR Vé Vào Cửa)</h3>
            </div>
            
            <div className="flex-1 flex flex-col sm:flex-row items-center gap-6 py-4">
              {customerData.upcomingTickets.length > 0 ? (
                <>
                  <div className="bg-white p-3 rounded-xl shrink-0 shadow-lg flex flex-col items-center justify-center cursor-pointer hover:bg-amber-50 transition-colors">
                    <QrCode size={110} className="text-black" />
                    <span className="text-[9px] font-mono text-gray-500 font-bold mt-1">{customerData.upcomingTickets[0].code}</span>
                  </div>
                  <div className="space-y-2 w-full text-center sm:text-left">
                    <span className="inline-block bg-[#0164b4] text-white text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider">Suất chiếu hôm nay</span>
                    <h4 className="text-xl font-bold text-white tracking-wide">{customerData.upcomingTickets[0].movie}</h4>
                    <p className="text-sm text-[#d1c5b4] font-medium flex items-center justify-center sm:justify-start gap-1.5">
                      <Clock size={14} className="text-[#e9c176]" /> {customerData.upcomingTickets[0].time}
                    </p>
                    <p className="text-xs text-[#9a8f80] font-semibold">
                      {customerData.upcomingTickets[0].room} | <span className="text-[#e9c176]">{customerData.upcomingTickets[0].seats}</span>
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-[#9a8f80] py-6 text-sm">
                  <Film size={36} className="mb-2 opacity-40" />
                  Bạn chưa có lịch đặt vé suất chiếu nào sắp diễn ra.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Thanh Lịch Sử Giao Dịch & Nút Đăng Xuất */}
        <div className="bg-[#1f2020]/40 backdrop-blur-xl border border-[#4e4639]/20 p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#353535] rounded-xl text-[#e9c176]"><History size={18} /></div>
            <div>
              <h4 className="text-sm font-bold text-white">Lịch sử hoạt động mua sắm</h4>
              <p className="text-xs text-[#9a8f80] mt-0.5">Mới nhất: {customerData.history[0]?.movie} ({customerData.history[0]?.amount})</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-xs font-bold text-red-400 hover:bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer">
            <LogOut size={14} /> ĐĂNG XUẤT TÀI KHOẢN
          </button>
        </div>
      </section>

      {/* KHỐI 3: THANH TÌM KIẾM & BỘ LỌC PHIM PHÍA DƯỚI TAB */}
      <section className="relative mt-12 max-w-7xl mx-auto px-6 md:px-16 clear-both block z-10">
        <div className="bg-[#333333]/40 backdrop-blur-xl border border-[#e9c176]/10 p-5 rounded-2xl flex flex-col lg:flex-row items-center gap-4 shadow-xl">
          <div className="flex-grow w-full relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#d1c5b4]" size={20} />
            <input 
              className="w-full bg-[#353535]/30 border border-[#4e4639]/40 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-[#9a8f80] focus:outline-none focus:border-[#e9c176] transition-colors text-sm" 
              placeholder="Tìm tên phim, thể loại hoặc diễn viên..." 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-4 w-full lg:w-auto">
            <div className="relative w-full lg:w-48">
              <select 
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full appearance-none bg-[#353535]/50 border border-[#4e4639]/40 rounded-xl py-3.5 px-4 pr-10 text-sm text-white focus:outline-none focus:border-[#e9c176] cursor-pointer"
              >
                <option className="bg-[#131313]">Tất cả thành phố</option>
                <option className="bg-[#131313]">TP. Hồ Chí Minh</option>
                <option className="bg-[#131313]">Hà Nội</option>
                <option className="bg-[#131313]">Đà Nẵng</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#d1c5b4]" size={16} />
            </div>
            <div className="relative w-full lg:w-48">
              <select className="w-full appearance-none bg-[#353535]/50 border border-[#4e4639]/40 rounded-xl py-3.5 px-4 pr-10 text-sm text-white focus:outline-none focus:border-[#e9c176] cursor-pointer">
                <option className="bg-[#131313]">Tất cả thể loại</option>
                <option className="bg-[#131313]">Hành Động</option>
                <option className="bg-[#131313]">Viễn Tưởng</option>
                <option className="bg-[#131313]">Kinh Dị</option>
              </select>
              <Sliders className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#d1c5b4]" size={16} />
            </div>
          </div>
        </div>
      </section>

      {/* KHỐI 4: DANH SÁCH PHIM ĐANG CHIẾU (NOW PLAYING - Đã fix bọc khối độc lập hoàn chỉnh) */}
      <section className="py-24 max-w-7xl mx-auto px-6 md:px-16 relative block clear-both z-10">
        <div className="flex justify-between items-end mb-12">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] mb-2 text-[#e9c176]">Đặt Vé Suất Chiếu Hôm Nay</p>
            <h2 className="text-4xl font-bold text-white tracking-wide font-serif">PHIM ĐANG CHIẾU</h2>
            <div className="h-1 w-16 bg-[#e9c176] rounded-full mt-2"></div>
          </div>
          <button className="text-[#e9c176] hover:underline text-sm font-medium flex items-center gap-1 cursor-pointer">
            XEM TẤT CẢ <ArrowRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {movies.map((m) => (
            <div key={m.id} className="movie-card-animate group relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#1f2020] transition-all duration-300 hover:-translate-y-2 shadow-xl border border-white/5">
              <img className="w-full h-full object-cover" src={m.image} alt={m.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-[#131313]/30 to-transparent opacity-80"></div>
              
              <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-6 group-hover:translate-y-0 transition-transform duration-300 bg-[#1f2020]/95 backdrop-blur-md border-t border-white/10 z-10">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-white text-base leading-tight group-hover:text-[#e9c176] transition-colors truncate max-w-[150px]">{m.title}</h3>
                  <div className="flex items-center gap-1 text-[#a4c9ff] shrink-0 font-mono text-sm">
                    <Star size={14} fill="currentColor" className="text-[#e9c176]" />
                    <span>{m.rating}</span>
                  </div>
                </div>
                <p className="text-[#d1c5b4] text-xs mb-4">{m.genre} • {m.duration}</p>
                <button 
                  onClick={() => navigate(`/booking/${m.id}`)}
                  className="w-full bg-[#e9c176] text-[#261900] py-2.5 rounded-xl font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-1 text-sm cursor-pointer"
                >
                  <Ticket size={16} /> CHỌN GHẾ
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* KHỐI 5: DANH SÁCH PHIM SẮP CHIẾU (COMING SOON - Được cô lập bọc nền tránh đè chữ) */}
      <section className="bg-[#1b1c1c] py-24 border-t border-b border-[#4e4639]/20 relative block clear-both w-full z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-16">
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] mb-2 text-[#a4c9ff]">Siêu phẩm chuẩn bị ra mắt</p>
              <h2 className="text-4xl font-bold text-white tracking-wide font-serif">PHIM SẮP CHIẾU</h2>
              <div className="h-1 w-16 bg-[#a4c9ff] rounded-full mt-2"></div>
            </div>
            <button className="text-[#d1c5b4] hover:text-[#e9c176] transition-colors text-sm font-medium flex items-center gap-2 cursor-pointer">
              LỊCH KHỞI CHIẾU <Calendar size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {comingSoon.map((m) => (
              <div key={m.id} className="movie-card-animate group flex flex-col gap-4">
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#1f2020] shadow-md border border-white/5">
                  <img className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" src={m.image} alt={m.title} />
                  <div className="absolute top-4 left-4 bg-[#131313]/90 backdrop-blur px-3 py-1 rounded-lg border border-[#4e4639]/40 text-xs font-bold text-[#a4c9ff]">
                    {m.date || 'SẮP CHIẾU'}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-white text-base mb-1 group-hover:text-[#a4c9ff] transition-colors truncate">{m.title}</h4>
                  <p className="text-[#d1c5b4] text-xs mb-3">{m.genre} • Dự kiến chiếu</p>
                  <button className="w-full border border-[#a4c9ff] text-[#a4c9ff] py-2.5 rounded-xl text-xs font-bold hover:bg-[#a4c9ff] hover:text-[#001c39] transition-all flex items-center justify-center gap-1 cursor-pointer">
                    <Bell size={14} /> NHẬN THÔNG BÁO
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KHỐI 6: CHÂN TRANG FOOTER ĐỘC LẬP HOÀN TOÀN TẠI ĐÁY WEB */}
      <footer className="bg-[#0e0e0e] w-full py-16 border-t border-[#4e4639]/30 relative block clear-both z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-16 flex flex-col lg:flex-row justify-between items-start gap-12">
          <div className="space-y-4 max-w-sm">
            <h2 className="text-2xl font-bold text-[#e9c176] uppercase tracking-widest font-serif">Cinema Plus</h2>
            <p className="text-[#d1c5b4] text-sm leading-relaxed">
              Tái định nghĩa trải nghiệm điện ảnh. Từ hệ thống chiếu laser 4K đỉnh cao cho đến quầy ẩm thực bắp nước cao cấp, mọi chi tiết đều được tinh chọn tỉ mỉ.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 w-full lg:w-auto">
            <div className="space-y-4">
              <h5 className="text-white font-bold text-sm tracking-wider uppercase">Dịch Vụ</h5>
              <ul className="space-y-2 text-sm text-[#d1c5b4]">
                <li><a className="hover:text-[#e9c176] transition-colors" href="#">Phòng Chiếu Thượng Lưu</a></li>
                <li><a className="hover:text-[#e9c176] transition-colors" href="#">Sự Kiện Thuê Trọn Vị Trí</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="text-white font-bold text-sm tracking-wider uppercase">Hệ Thống Rạp</h5>
              <ul className="space-y-2 text-sm text-[#d1c5b4]">
                <li><a className="hover:text-[#e9c176] transition-colors" href="#">Cinema Plus HUIT</a></li>
                <li><a className="hover:text-[#e9c176] transition-colors" href="#">Cinema Plus Sài Gòn</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="text-white font-bold text-sm tracking-wider uppercase">Hỗ Trợ</h5>
              <ul className="space-y-2 text-sm text-[#d1c5b4]">
                <li><a className="hover:text-[#e9c176] transition-colors" href="#">Liên Hệ Ban Quản Lý</a></li>
                <li><a className="hover:text-[#e9c176] transition-colors" href="#">Câu Hỏi Thường Gặp</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-[#4e4639]/10 text-center text-[#9a8f80] text-xs">
          <p>© 2026 Cinema Plus. Bảo lưu mọi quyền.</p>
        </div>
      </footer>

    </div>
  );
}