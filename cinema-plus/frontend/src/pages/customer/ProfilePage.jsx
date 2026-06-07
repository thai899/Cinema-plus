import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import {
  Ticket, Star, Clock, MapPin, LogOut, Home, ChevronRight,
  CreditCard, Award, ShoppingBag, QrCode, X, Calendar
} from 'lucide-react';

const SEAT_TYPE_LABEL = { SINGLE: 'Thường', VIP: 'VIP', SWEETBOX_DOUBLE: 'Sweetbox' };
const SEAT_TYPE_COLOR = {
  SINGLE:          'bg-blue-500/20 text-blue-400 border-blue-500/30',
  VIP:             'bg-purple-500/20 text-purple-400 border-purple-500/30',
  SWEETBOX_DOUBLE: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

const fmtMoney  = (n) => Number(n).toLocaleString('vi-VN') + 'đ';
const fmtDate   = (s) => s ? new Date(s).toLocaleString('vi-VN') : '';
const fmtDateShort = (s) => s ? new Date(s).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' }) : '';

// Tính màu gradient thẻ thành viên theo hạng
const tierGradient = (tier) => {
  if (!tier) return 'from-slate-600 to-slate-500';
  if (tier.includes('PLATINUM')) return 'from-slate-300 to-slate-100';
  if (tier.includes('GOLD'))     return 'from-yellow-400 to-amber-300';
  if (tier.includes('SILVER'))   return 'from-slate-400 to-slate-300';
  return 'from-[#e9c176] to-amber-400';
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile,  setProfile]  = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selectedBooking,   setSelectedBooking]   = useState(null);
  const [selectedTicketIdx, setSelectedTicketIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'member'

  useEffect(() => {
    Promise.all([
      axiosClient.get('/api/users/profile').then(r => setProfile(r.data)).catch(() => {}),
      axiosClient.get('/api/users/bookings').then(r => setBookings(r.data || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  if (loading) return (
    <div className="min-h-screen bg-[#131313] flex justify-center items-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#e9c176] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#9a8f80] text-sm font-mono">Đang tải hồ sơ...</p>
      </div>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-[#131313] flex justify-center items-center text-white">
      <div className="text-center space-y-4">
        <QrCode size={56} className="mx-auto text-[#4e4639]" />
        <p className="text-[#9a8f80]">Vui lòng đăng nhập để xem trang cá nhân.</p>
        <button onClick={() => navigate('/login')} className="px-6 py-2.5 bg-[#e9c176] text-[#261900] rounded-xl font-bold text-sm cursor-pointer">
          Đăng Nhập
        </button>
      </div>
    </div>
  );

  const currentTicket = selectedBooking?.tickets?.[selectedTicketIdx];

  return (
    <div className="min-h-screen bg-[#131313] text-[#e4e2e1]">

      {/* HEADER */}
      <header className="bg-[#1b1c1c] border-b border-[#4e4639]/30 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-lg font-bold text-[#e9c176] uppercase font-serif tracking-wider">
              Cinema Plus
            </Link>
            <div className="hidden sm:flex items-center gap-1 text-[#9a8f80] text-xs">
              <ChevronRight size={14} />
              <span className="font-mono">Trang Cá Nhân</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-[#9a8f80] hover:text-[#e9c176] p-2 rounded-lg hover:bg-white/5 transition-all">
              <Home size={16} />
            </Link>
            <button onClick={handleLogout} className="text-[#9a8f80] hover:text-red-400 p-2 rounded-lg hover:bg-red-500/5 transition-all cursor-pointer">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">

        {/* PROFILE CARD */}
        <div className="bg-[#1f2020] border border-[#4e4639]/30 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-[#e9c176]/15 border border-[#e9c176]/30 flex items-center justify-center text-3xl font-bold text-[#e9c176] font-serif shrink-0">
            {(profile.fullName || profile.username || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white font-serif">{profile.fullName || profile.username}</h1>
            <p className="text-[#9a8f80] text-sm font-mono">@{profile.username}</p>
            {profile.email && <p className="text-[#9a8f80] text-xs mt-0.5">{profile.email}</p>}
          </div>
          <div className="flex gap-4 sm:gap-6 shrink-0">
            <div className="text-center">
              <p className="text-2xl font-black text-[#e9c176] font-mono">{profile.loyaltyPoints?.toLocaleString()}</p>
              <p className="text-[10px] text-[#9a8f80] uppercase tracking-wider mt-0.5">Điểm</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-white font-mono">{bookings.length}</p>
              <p className="text-[10px] text-[#9a8f80] uppercase tracking-wider mt-0.5">Đặt Vé</p>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-1 bg-[#1f2020] border border-[#4e4639]/20 rounded-2xl p-1.5">
          {[
            { key: 'bookings', label: 'Lịch Sử Đặt Vé', icon: <Ticket size={14} /> },
            { key: 'member',   label: 'Thẻ Thành Viên', icon: <Award size={14} />  },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-[#e9c176] text-[#261900] shadow-sm'
                  : 'text-[#9a8f80] hover:text-white'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* TAB: BOOKING HISTORY */}
        {activeTab === 'bookings' && (
          <div>
            {bookings.length === 0 ? (
              <div className="bg-[#1f2020] border border-[#4e4639]/20 rounded-2xl p-16 text-center">
                <ShoppingBag size={48} className="mx-auto mb-4 text-[#4e4639]" />
                <p className="text-[#9a8f80] text-base font-serif">Chưa có lịch sử đặt vé.</p>
                <button onClick={() => navigate('/')} className="mt-4 px-6 py-2.5 bg-[#e9c176] text-[#261900] rounded-xl font-bold text-sm cursor-pointer hover:bg-[#d9b166]">
                  Khám Phá Phim
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookings.map(booking => (
                  <div
                    key={booking.id}
                    onClick={() => { setSelectedBooking(booking); setSelectedTicketIdx(0); }}
                    className="bg-[#1f2020] border border-[#4e4639]/20 rounded-2xl p-5 cursor-pointer hover:border-[#e9c176]/40 hover:bg-[#1f2020]/80 transition-all duration-200 group"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                        booking.paymentStatus === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-[#353535] text-[#9a8f80] border-[#4e4639]/30'
                      }`}>
                        {booking.paymentStatus === 'PAID' ? '✓ Đã thanh toán' : booking.paymentStatus}
                      </span>
                      <span className="text-[10px] text-[#9a8f80] font-mono">{fmtDateShort(booking.bookingTime)}</span>
                    </div>

                    {/* Movie */}
                    <h3 className="text-base font-bold text-white group-hover:text-[#e9c176] transition-colors font-serif truncate mb-1">
                      {booking.movieTitle}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#9a8f80] mb-3">
                      {booking.cinemaName && <><MapPin size={10} className="shrink-0" /><span className="truncate">{booking.cinemaName}</span></>}
                      {booking.screenName && <span>· {booking.screenName}</span>}
                    </div>
                    {booking.startTime && (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#9a8f80] mb-3">
                        <Calendar size={10} className="shrink-0" />
                        <span>{fmtDate(booking.startTime)}</span>
                      </div>
                    )}

                    {/* Seats */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {booking.tickets?.slice(0, 5).map((t, i) => (
                        <span key={i} className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${SEAT_TYPE_COLOR[t.seatType] || 'bg-[#353535] text-[#9a8f80] border-[#4e4639]/30'}`}>
                          {t.seatRow}{t.seatNumber}
                        </span>
                      ))}
                      {(booking.tickets?.length || 0) > 5 && (
                        <span className="text-[10px] text-[#9a8f80]">+{booking.tickets.length - 5}</span>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center border-t border-[#4e4639]/20 pt-3">
                      <span className="font-bold text-emerald-400 font-mono text-sm">{fmtMoney(booking.totalAmount)}</span>
                      <button className="text-[10px] text-[#e9c176] font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                        <QrCode size={12} /> Xem QR
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: MEMBER CARD */}
        {activeTab === 'member' && (
          <div className="space-y-5">
            {/* Member Card Visual */}
            <div className={`rounded-2xl p-6 bg-gradient-to-br ${tierGradient(profile.memberTier)} text-gray-900 shadow-2xl relative overflow-hidden`}>
              <div className="absolute -top-4 -right-4 text-[120px] opacity-10 font-black leading-none select-none pointer-events-none">✦</div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-[10px] font-bold tracking-widest uppercase opacity-60">Cinema Plus</p>
                    <h3 className="text-2xl font-black mt-0.5">{profile.memberTier}</h3>
                  </div>
                  <Star size={28} fill="currentColor" className="opacity-30" />
                </div>
                <div className="mb-6">
                  <p className="text-[10px] uppercase opacity-60 mb-1">Điểm Tích Lũy</p>
                  <p className="text-4xl font-black font-mono">{(profile.loyaltyPoints || 0).toLocaleString()}</p>
                </div>
                <div className="flex justify-between items-end border-t border-black/10 pt-3">
                  <span className="text-xs font-mono font-bold opacity-70">{profile.memberId}</span>
                  <span className="text-xs font-bold opacity-50">Cinema Plus 2026</span>
                </div>
              </div>
            </div>

            {/* Loyalty progress */}
            {(() => {
              const pts = profile.loyaltyPoints || 0;
              const tiers = [
                { name: 'MEMBER',        min: 0,    max: 500,  color: 'bg-[#e9c176]' },
                { name: 'SILVER',        min: 500,  max: 2000, color: 'bg-slate-400' },
                { name: 'VIP GOLD',      min: 2000, max: 5000, color: 'bg-yellow-400' },
                { name: 'VVIP PLATINUM', min: 5000, max: 5000, color: 'bg-gray-200' },
              ];
              const currentTier = tiers.find(t => pts < t.max || t.max === 5000) || tiers[3];
              const progress = currentTier.max === 5000 ? 100 : Math.min(100, ((pts - currentTier.min) / (currentTier.max - currentTier.min)) * 100);
              const nextNeeded = Math.max(0, currentTier.max - pts);
              return (
                <div className="bg-[#1f2020] border border-[#4e4639]/20 rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[#9a8f80] uppercase tracking-wider">Tiến Độ Thăng Hạng</span>
                    <span className="text-[10px] font-mono text-[#e9c176]">{pts}/{currentTier.max === 5000 ? '∞' : currentTier.max} điểm</span>
                  </div>
                  <div className="h-2 bg-[#353535] rounded-full overflow-hidden">
                    <div className={`h-full ${currentTier.color} rounded-full transition-all duration-700`} style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-[11px] text-[#9a8f80]">
                    {currentTier.max === 5000
                      ? '🏆 Bạn đã đạt hạng cao nhất!'
                      : `Cần thêm ${nextNeeded.toLocaleString()} điểm để lên hạng tiếp theo`}
                  </p>
                </div>
              );
            })()}

            {/* Tier benefits */}
            <div className="bg-[#1f2020] border border-[#4e4639]/20 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-white mb-4">Đặc Quyền Hạng {profile.memberTier}</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Tích điểm 1đ/10.000đ', active: true },
                  { label: 'Ưu tiên ghế VIP',       active: (profile.loyaltyPoints || 0) >= 500 },
                  { label: 'Giảm 10% phí dịch vụ',  active: (profile.loyaltyPoints || 0) >= 2000 },
                  { label: 'Combo ẩm thực miễn phí', active: (profile.loyaltyPoints || 0) >= 5000 },
                ].map((benefit, i) => (
                  <div key={i} className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-medium ${
                    benefit.active
                      ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
                      : 'border-[#4e4639]/20 bg-[#131313]/30 text-[#4e4639]'
                  }`}>
                    <span>{benefit.active ? '✓' : '○'}</span>
                    {benefit.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QR TICKET MODAL */}
      {selectedBooking && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bg-white text-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#261900] to-[#3d2900] p-5 text-white relative">
              <button
                onClick={() => setSelectedBooking(null)}
                className="absolute top-4 right-4 text-white/60 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
              <p className="text-[#e9c176] text-[10px] font-bold uppercase tracking-widest font-mono mb-1">Cinema Plus · Vé Điện Tử</p>
              <h3 className="text-lg font-black font-serif leading-tight">{selectedBooking.movieTitle}</h3>
              {selectedBooking.startTime && (
                <p className="text-white/70 text-xs mt-1 flex items-center gap-1">
                  <Calendar size={11} /> {fmtDate(selectedBooking.startTime)}
                </p>
              )}
              {selectedBooking.cinemaName && (
                <p className="text-white/60 text-xs mt-0.5 flex items-center gap-1">
                  <MapPin size={11} /> {selectedBooking.cinemaName} {selectedBooking.screenName && `· ${selectedBooking.screenName}`}
                </p>
              )}
            </div>

            {/* Ticket Tabs */}
            {(selectedBooking.tickets?.length || 0) > 1 && (
              <div className="flex gap-1 p-3 bg-gray-50 border-b overflow-x-auto">
                {selectedBooking.tickets.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedTicketIdx(i)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      i === selectedTicketIdx
                        ? 'bg-[#261900] text-[#e9c176] shadow'
                        : 'text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {t.seatRow}{t.seatNumber}
                  </button>
                ))}
              </div>
            )}

            {/* QR Code */}
            {currentTicket && (
              <div className="p-6">
                <div className="flex justify-center mb-4 bg-gray-50 p-5 rounded-2xl border-2 border-dashed border-gray-200">
                  <QRCodeSVG
                    value={currentTicket.qrCode || `TICKET_${currentTicket.ticketId}`}
                    size={180}
                    bgColor="#f9fafb"
                    fgColor="#111827"
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <p className="text-center text-[10px] text-gray-400 font-mono mb-4 truncate">{currentTicket.qrCode}</p>

                <div className="space-y-2 text-sm">
                  {[
                    { label: 'Ghế', value: `${currentTicket.seatRow}${currentTicket.seatNumber} · ${SEAT_TYPE_LABEL[currentTicket.seatType] || currentTicket.seatType}` },
                    { label: 'Giá vé', value: fmtMoney(currentTicket.price), color: 'text-emerald-600 font-bold' },
                    { label: 'Trạng thái', value: currentTicket.status === 'VALID' ? '✓ Hợp lệ' : (currentTicket.status === 'USED' ? '✓ Đã soát' : currentTicket.status), color: currentTicket.status === 'VALID' ? 'text-emerald-600' : 'text-gray-500' },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                      <span className="text-gray-500">{item.label}</span>
                      <span className={`font-semibold ${item.color || ''}`}>{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3 text-center text-xs text-amber-700 font-medium">
                  📲 Xuất trình mã QR này tại cửa soát vé
                </div>
              </div>
            )}

            <div className="px-6 pb-6">
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-full py-3 bg-[#131313] text-white rounded-xl font-bold hover:bg-[#1f2020] transition-colors cursor-pointer text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
