import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const PRICE_ADDITIONS = { SINGLE: 0, VIP: 30000, SWEETBOX_DOUBLE: 80000 };
const TYPE_LABEL = { SINGLE: 'Thường', VIP: 'VIP', SWEETBOX_DOUBLE: 'Sweetbox' };

export default function SeatSelectionPage() {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [stompClient, setStompClient] = useState(null);
  const [timer, setTimer] = useState(300);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [showtimeInfo, setShowtimeInfo] = useState(null);
  const [booking, setBooking] = useState(false);
  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchSeats();
    fetchShowtimeInfo();
    connectWebSocket();
    return () => { if (stompClient) stompClient.disconnect(); };
  }, [showtimeId]);

  useEffect(() => {
    let interval = null;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0) {
      alert("Thời gian giữ ghế đã hết! Vui lòng chọn lại.");
      window.location.reload();
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  const fetchShowtimeInfo = async () => {
    try {
      const res = await fetch(`http://localhost:8081/api/showtimes/${showtimeId}/info`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setShowtimeInfo(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchSeats = async () => {
    try {
      const res = await fetch(`http://localhost:8081/api/showtimes/${showtimeId}/seats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setSeats(await res.json());
    } catch (e) { console.error("Error fetching seats", e); }
  };

  const connectWebSocket = () => {
    const socket = new SockJS('http://localhost:8081/ws-cinema');
    const client = Stomp.over(socket);
    client.debug = () => {};
    client.connect({}, () => {
      setStompClient(client);
      client.subscribe(`/topic/showtime/${showtimeId}`, (message) => {
        const payload = JSON.parse(message.body);
        updateSeatStatus(payload.seatId, payload.action === 'LOCK' ? 'LOCKED' : 'AVAILABLE', payload.username);
      });
    });
  };

  const updateSeatStatus = (seatId, newStatus, lockedBy) => {
    setSeats(prev => prev.map(seat =>
      seat.id === seatId ? { ...seat, status: newStatus, lockedBy } : seat
    ));
  };

  const toggleSeat = async (seat) => {
    if (seat.status === 'BOOKED') return;
    if (seat.status === 'LOCKED' && seat.lockedBy !== username) return;
    const isSelecting = seat.status === 'AVAILABLE';
    try {
      const endpoint = isSelecting ? 'lock' : 'unlock';
      const res = await fetch(`http://localhost:8081/api/showtimes/${showtimeId}/seats/${seat.id}/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        if (isSelecting) {
          setSelectedSeats(prev => [...prev, seat]);
          if (!isTimerActive) { setIsTimerActive(true); setTimer(300); }
        } else {
          const newSel = selectedSeats.filter(s => s.id !== seat.id);
          setSelectedSeats(newSel);
          if (newSel.length === 0) setIsTimerActive(false);
        }
      } else {
        alert("Ghế này đã bị người khác chọn rồi!");
        fetchSeats();
      }
    } catch (e) { console.error(e); }
  };

  const handleBook = async () => {
    if (selectedSeats.length === 0 || booking) return;
    setBooking(true);
    try {
      const res = await fetch('http://localhost:8081/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          showtimeId,
          seatIds: selectedSeats.map(s => s.id),
          paymentMethod: 'VNPAY'
        })
      });
      if (res.ok) {
        const data = await res.json();
        alert(`🎬 Đặt vé thành công!\n\nTổng tiền: ${formatCurrency(data.totalAmount)}\nĐiểm tích lũy: +${data.pointsEarned} điểm\n\nVui lòng kiểm tra vé trong trang cá nhân.`);
        navigate('/profile');
      } else {
        alert("Lỗi đặt vé. Vui lòng thử lại.");
        setBooking(false);
      }
    } catch (e) {
      console.error(e);
      setBooking(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatCurrency = (amount) => Number(amount).toLocaleString('vi-VN') + 'đ';

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('vi-VN', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const calcSeatPrice = (type) => {
    const base = showtimeInfo?.basePrice || 0;
    return base + (PRICE_ADDITIONS[type] || 0);
  };

  // Tổng tiền dựa trên ghế đã chọn
  const totalAmount = useMemo(() =>
    selectedSeats.reduce((sum, seat) => sum + calcSeatPrice(seat.type), 0),
    [selectedSeats, showtimeInfo]
  );

  // Nhóm ghế theo hàng để render sơ đồ
  const seatsByRow = useMemo(() => {
    const groups = {};
    seats.forEach(seat => {
      if (!groups[seat.seatRow]) groups[seat.seatRow] = [];
      groups[seat.seatRow].push(seat);
    });
    // Sắp xếp theo seatNumber trong mỗi hàng
    Object.keys(groups).forEach(row => groups[row].sort((a, b) => a.seatNumber - b.seatNumber));
    return groups;
  }, [seats]);

  const rowKeys = Object.keys(seatsByRow).sort();

  const getSeatColor = (seat) => {
    if (seat.status === 'BOOKED') return 'bg-gray-700/60 text-gray-500 cursor-not-allowed border-gray-600';
    if (seat.status === 'LOCKED') {
      if (seat.lockedBy === username) return 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 border-emerald-400 scale-105';
      return 'bg-amber-600/60 text-amber-200 cursor-not-allowed border-amber-500/50';
    }
    if (seat.type === 'VIP') return 'bg-purple-600/80 hover:bg-purple-500 text-white border-purple-400/60 hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-1';
    if (seat.type === 'SWEETBOX_DOUBLE') return 'bg-pink-600/80 hover:bg-pink-500 text-white border-pink-400/60 hover:shadow-lg hover:shadow-pink-500/30 hover:-translate-y-1';
    return 'bg-blue-600/70 hover:bg-blue-500 text-white border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-1';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* Timer cố định */}
      {isTimerActive && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-2.5 rounded-2xl backdrop-blur-xl border font-mono font-bold text-lg flex items-center gap-2 transition-all ${
          timer <= 60 ? 'bg-red-500/20 border-red-500/60 text-red-400 animate-pulse' : 'bg-gray-800/80 border-gray-600/40 text-white'
        }`}>
          <span className="text-sm">⏳</span> {formatTime(timer)}
        </div>
      )}

      {/* Header thông tin phim */}
      <div className="bg-gradient-to-b from-gray-900/90 to-transparent border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white text-sm mb-3 flex items-center gap-1.5 transition-colors">
            ← Quay lại
          </button>
          {showtimeInfo ? (
            <div className="flex items-start gap-5">
              {showtimeInfo.moviePoster && (
                <img src={showtimeInfo.moviePoster} alt="" className="w-16 h-24 rounded-xl object-cover shadow-lg border border-white/10 hidden sm:block" />
              )}
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                  {showtimeInfo.movieTitle}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-400">
                  <span className="bg-purple-500/20 text-purple-300 px-2.5 py-0.5 rounded-lg font-bold text-xs border border-purple-500/30">
                    {showtimeInfo.format}
                  </span>
                  <span>🎬 {showtimeInfo.screenName}</span>
                  <span>🕐 {formatDateTime(showtimeInfo.startTime)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-16 bg-gray-800/50 rounded-xl animate-pulse" />
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Sơ đồ ghế */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/40 p-6 shadow-2xl">
              {/* Màn hình */}
              <div className="relative mb-10">
                <div className="w-[80%] mx-auto h-2 bg-gradient-to-r from-transparent via-blue-400/80 to-transparent rounded-full shadow-[0_0_30px_rgba(96,165,250,0.3)]" />
                <p className="text-center text-[11px] text-gray-500 mt-2 tracking-[0.3em] uppercase font-medium">Màn hình</p>
              </div>

              {/* Grid ghế theo hàng */}
              <div className="space-y-2 mb-8">
                {rowKeys.map(row => (
                  <div key={row} className="flex items-center gap-2">
                    <span className="w-6 text-center text-xs font-bold text-gray-500 shrink-0">{row}</span>
                    <div className="flex gap-1.5 flex-1 justify-center">
                      {seatsByRow[row].map(seat => (
                        <button
                          key={seat.id}
                          onClick={() => toggleSeat(seat)}
                          title={`${seat.seatRow}${seat.seatNumber} · ${TYPE_LABEL[seat.type] || seat.type} · ${formatCurrency(calcSeatPrice(seat.type))}`}
                          className={`h-8 rounded-t-lg rounded-b-sm font-semibold text-[11px] border transition-all duration-300 cursor-pointer ${getSeatColor(seat)} ${
                            seat.type === 'SWEETBOX_DOUBLE' ? 'w-16 min-w-16' : 'w-8 min-w-8'
                          }`}
                          disabled={seat.status === 'BOOKED' || (seat.status === 'LOCKED' && seat.lockedBy !== username)}
                        >
                          {seat.seatNumber}
                        </button>
                      ))}
                    </div>
                    <span className="w-6 text-center text-xs font-bold text-gray-500 shrink-0">{row}</span>
                  </div>
                ))}
              </div>

              {/* Chú thích */}
              <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] bg-gray-900/60 p-3 rounded-xl border border-gray-700/30">
                <div className="flex items-center gap-1.5"><div className="w-4 h-3 bg-blue-600/70 rounded-sm border border-blue-400/50" /> Thường</div>
                <div className="flex items-center gap-1.5"><div className="w-4 h-3 bg-purple-600/80 rounded-sm border border-purple-400/60" /> VIP (+30K)</div>
                <div className="flex items-center gap-1.5"><div className="w-7 h-3 bg-pink-600/80 rounded-sm border border-pink-400/60" /> Sweetbox (+80K)</div>
                <div className="flex items-center gap-1.5"><div className="w-4 h-3 bg-emerald-500 rounded-sm border border-emerald-400" /> Đang chọn</div>
                <div className="flex items-center gap-1.5"><div className="w-4 h-3 bg-gray-700/60 rounded-sm border border-gray-600" /> Đã bán</div>
                <div className="flex items-center gap-1.5"><div className="w-4 h-3 bg-amber-600/60 rounded-sm border border-amber-500/50" /> Đang giữ</div>
              </div>
            </div>
          </div>

          {/* Sidebar — Tóm tắt đơn hàng */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/40 p-6 shadow-2xl sticky top-20">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                🛒 Đơn Hàng
              </h3>

              {selectedSeats.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-3xl mb-2">🎭</p>
                  <p className="text-sm">Chọn ghế ngồi để bắt đầu</p>
                </div>
              ) : (
                <>
                  {/* Bảng giá */}
                  <div className="bg-gray-900/60 rounded-xl p-3 mb-4 text-xs">
                    <p className="text-gray-400 font-bold uppercase tracking-wider mb-2">Bảng giá</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-gray-400">
                        <span>Thường</span>
                        <span className="text-white font-mono">{formatCurrency(calcSeatPrice('SINGLE'))}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>VIP</span>
                        <span className="text-purple-400 font-mono">{formatCurrency(calcSeatPrice('VIP'))}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Sweetbox</span>
                        <span className="text-pink-400 font-mono">{formatCurrency(calcSeatPrice('SWEETBOX_DOUBLE'))}</span>
                      </div>
                    </div>
                  </div>

                  {/* Danh sách ghế đã chọn */}
                  <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
                    {selectedSeats.map(seat => (
                      <div key={seat.id} className="flex justify-between items-center bg-gray-900/50 rounded-lg px-3 py-2 border border-gray-700/30">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            seat.type === 'VIP' ? 'bg-purple-500' : seat.type === 'SWEETBOX_DOUBLE' ? 'bg-pink-500' : 'bg-blue-500'
                          }`} />
                          <span className="font-bold text-sm">{seat.seatRow}{seat.seatNumber}</span>
                          <span className="text-[10px] text-gray-500">({TYPE_LABEL[seat.type]})</span>
                        </div>
                        <span className="text-sm font-mono font-bold text-white">{formatCurrency(calcSeatPrice(seat.type))}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tổng tiền */}
                  <div className="border-t border-gray-700/50 pt-4 mb-5">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-gray-400 text-xs">Tổng cộng ({selectedSeats.length} ghế)</p>
                        <p className="text-2xl font-black text-emerald-400 font-mono mt-0.5">{formatCurrency(totalAmount)}</p>
                      </div>
                      <div className="text-right text-[10px] text-gray-500">
                        <p>+{Math.floor(totalAmount / 10000)} điểm</p>
                        <p>tích lũy</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <button
                onClick={handleBook}
                disabled={selectedSeats.length === 0 || booking}
                className={`w-full py-3.5 rounded-xl font-bold text-base transition-all duration-300 ${
                  selectedSeats.length > 0 && !booking
                    ? 'bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {booking ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang xử lý...
                  </span>
                ) : selectedSeats.length > 0 ? (
                  `Thanh Toán · ${formatCurrency(totalAmount)}`
                ) : (
                  'Chọn ghế để tiếp tục'
                )}
              </button>

              <p className="text-center text-[10px] text-gray-600 mt-3">
                Thanh toán qua VNPAY · Vé không hoàn trả
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
