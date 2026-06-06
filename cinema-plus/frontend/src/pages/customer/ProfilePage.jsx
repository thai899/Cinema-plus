import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';

const SEAT_TYPE_LABEL = { SINGLE: 'Thường', VIP: 'VIP', SWEETBOX_DOUBLE: 'Sweetbox' };
const SEAT_TYPE_COLOR = { SINGLE: '#60a5fa', VIP: '#a78bfa', SWEETBOX_DOUBLE: '#f472b6' };

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedTicketIdx, setSelectedTicketIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    Promise.all([fetchProfile(), fetchBookings()])
      .finally(() => setLoading(false));
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('http://localhost:8081/api/users/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setProfile(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch('http://localhost:8081/api/users/bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setBookings(await res.json());
    } catch (e) { console.error(e); }
  };

  const formatCurrency = (amount) =>
    Number(amount).toLocaleString('vi-VN') + 'đ';

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  const getTierColor = (tier) => {
    if (tier?.includes('PLATINUM')) return 'from-gray-300 to-gray-100';
    if (tier?.includes('GOLD'))     return 'from-yellow-400 to-amber-300';
    if (tier?.includes('SILVER'))   return 'from-gray-400 to-gray-300';
    return 'from-blue-500 to-blue-400';
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex justify-center items-center">
      <div className="text-white text-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p>Đang tải thông tin...</p>
      </div>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-gray-900 flex justify-center items-center text-white">
      <div className="text-center">
        <p className="mb-4">Vui lòng đăng nhập để xem trang cá nhân.</p>
        <button onClick={() => navigate('/login')} className="px-6 py-2 bg-purple-600 rounded-lg">Đăng nhập</button>
      </div>
    </div>
  );

  const currentTicket = selectedBooking?.tickets?.[selectedTicketIdx];

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2">
          ← Trang chủ
        </button>
        <h1 className="text-lg font-bold">Trang Cá Nhân</h1>
        <button
          onClick={() => { localStorage.clear(); navigate('/login'); }}
          className="text-red-400 hover:text-red-300 text-sm"
        >Đăng xuất</button>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-8">

        {/* Profile + Member Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Info */}
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-2xl font-bold">
                {(profile.fullName || profile.username || '?')[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold">{profile.fullName || profile.username}</h2>
                <p className="text-gray-400 text-sm">@{profile.username}</p>
                {profile.email && <p className="text-gray-500 text-xs mt-0.5">{profile.email}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900/50 rounded-xl p-4 text-center">
                <p className="text-3xl font-black text-purple-400">{profile.loyaltyPoints}</p>
                <p className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-wider">Điểm tích lũy</p>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-4 text-center">
                <p className="text-lg font-bold text-yellow-400">{bookings.length}</p>
                <p className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-wider">Lần đặt vé</p>
              </div>
            </div>
          </div>

          {/* Member Card */}
          <div className={`rounded-2xl p-6 bg-gradient-to-br ${getTierColor(profile.memberTier)} text-gray-900 shadow-2xl relative overflow-hidden`}>
            <div className="absolute top-0 right-0 text-9xl opacity-10 font-black leading-none select-none">
              ✦
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-bold tracking-widest uppercase opacity-70 mb-1">Thẻ Thành Viên</p>
              <h3 className="text-2xl font-black">{profile.memberTier}</h3>
              <div className="mt-6 mb-4">
                <p className="text-[10px] uppercase opacity-60 mb-1">Điểm Tích Lũy</p>
                <p className="text-4xl font-black font-mono">{profile.loyaltyPoints.toLocaleString()}</p>
              </div>
              <div className="flex justify-between items-end border-t border-black/10 pt-3">
                <span className="text-xs font-mono font-bold opacity-80">{profile.memberId}</span>
                <span className="text-xs font-bold opacity-70">Cinema Plus 2026</span>
              </div>
            </div>
          </div>
        </div>

        {/* Booking History */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            🎟️ Lịch Sử Đặt Vé
            <span className="text-sm font-normal text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
              {bookings.length} đơn
            </span>
          </h2>

          {bookings.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-5xl mb-4">🎬</p>
              <p className="text-lg">Chưa có lịch sử đặt vé.</p>
              <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
                Khám Phá Phim
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {bookings.map(booking => (
                <div
                  key={booking.id}
                  onClick={() => { setSelectedBooking(booking); setSelectedTicketIdx(0); }}
                  className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-5 border border-gray-700/50 hover:border-purple-500/60 transition-all duration-300 cursor-pointer group hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-900/20"
                >
                  {/* Movie + Status */}
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      booking.paymentStatus === 'PAID'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {booking.paymentStatus === 'PAID' ? '✓ Đã thanh toán' : booking.paymentStatus}
                    </span>
                    <span className="text-xs text-gray-500">{formatDate(booking.bookingTime).split(',')[0]}</span>
                  </div>

                  <h3 className="text-lg font-bold group-hover:text-purple-400 transition-colors mb-1 truncate">
                    {booking.movieTitle}
                  </h3>
                  <p className="text-sm text-gray-400 mb-3 truncate">
                    {booking.cinemaName} {booking.screenName && `· ${booking.screenName}`}
                  </p>

                  {/* Seats */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {booking.tickets?.slice(0, 4).map((t, i) => (
                      <span key={i} className="text-xs font-bold px-2 py-0.5 rounded-md" style={{
                        background: (SEAT_TYPE_COLOR[t.seatType] || '#666') + '30',
                        color: SEAT_TYPE_COLOR[t.seatType] || '#aaa',
                        border: `1px solid ${SEAT_TYPE_COLOR[t.seatType] || '#666'}50`
                      }}>
                        {t.seatRow}{t.seatNumber}
                      </span>
                    ))}
                    {(booking.tickets?.length || 0) > 4 &&
                      <span className="text-xs text-gray-500">+{booking.tickets.length - 4} ghế</span>}
                  </div>

                  <div className="flex justify-between items-center border-t border-gray-700/50 pt-3">
                    <span className="font-bold text-green-400">{formatCurrency(booking.totalAmount)}</span>
                    <button className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1">
                      Xem QR →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QR Modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bg-white text-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-5 text-white text-center">
              <h3 className="text-xl font-black">{selectedBooking.movieTitle}</h3>
              <p className="text-purple-200 text-sm mt-1">{formatDate(selectedBooking.startTime)}</p>
              <p className="text-purple-300 text-xs mt-0.5">
                {selectedBooking.cinemaName} {selectedBooking.screenName && `· ${selectedBooking.screenName}`}
              </p>
            </div>

            {/* Ticket Tabs (nếu nhiều ghế) */}
            {selectedBooking.tickets?.length > 1 && (
              <div className="flex gap-1 p-3 bg-gray-50 border-b">
                {selectedBooking.tickets.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedTicketIdx(i)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      i === selectedTicketIdx
                        ? 'bg-purple-600 text-white shadow'
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
                <div className="flex justify-center mb-4 bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-200">
                  <QRCodeSVG
                    value={currentTicket.qrCode}
                    size={180}
                    bgColor="#f9fafb"
                    fgColor="#111827"
                    level="M"
                    includeMargin={true}
                  />
                </div>

                <div className="text-center mb-4">
                  <p className="text-xs text-gray-400 font-mono">{currentTicket.qrCode}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Ghế</span>
                    <span className="font-bold">{currentTicket.seatRow}{currentTicket.seatNumber}
                      <span className="ml-1 text-xs font-normal text-gray-400">
                        ({SEAT_TYPE_LABEL[currentTicket.seatType] || currentTicket.seatType})
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Giá vé</span>
                    <span className="font-bold text-green-600">{formatCurrency(currentTicket.price)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">Trạng thái</span>
                    <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${
                      currentTicket.status === 'VALID' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {currentTicket.status === 'VALID' ? '✓ Hợp lệ' : currentTicket.status}
                    </span>
                  </div>
                </div>

                <p className="text-center text-xs text-gray-400 mt-4 bg-gray-50 rounded-xl p-2">
                  📲 Xuất trình mã QR này tại quầy soát vé
                </p>
              </div>
            )}

            <div className="px-6 pb-6">
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
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
