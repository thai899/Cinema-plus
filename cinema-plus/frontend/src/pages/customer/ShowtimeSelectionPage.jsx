import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Film } from 'lucide-react';

export default function ShowtimeSelectionPage() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchShowtimes();
  }, [movieId]);

  const fetchShowtimes = async () => {
    try {
      const res = await fetch(`http://localhost:8081/api/showtimes/movie/${movieId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setShowtimes(data);
        if (data.length > 0) {
          // Khởi tạo ngày được chọn là ngày đầu tiên có suất chiếu
          const dates = [...new Set(data.map(st => st.startTime ? st.startTime.split('T')[0] : ''))].filter(Boolean).sort();
          setSelectedDate(dates[0] || '');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Lấy thông tin phim từ record đầu tiên
  const movieInfo = useMemo(() => {
    if (showtimes.length === 0) return null;
    const first = showtimes[0];
    return {
      title: first.movieTitle,
      poster: first.moviePoster,
      format: first.movieFormat
    };
  }, [showtimes]);

  // Lấy danh sách các ngày có suất chiếu
  const availableDates = useMemo(() => {
    const dates = [...new Set(showtimes.map(st => st.startTime ? st.startTime.split('T')[0] : ''))].filter(Boolean);
    return dates.sort();
  }, [showtimes]);

  // Nhóm các suất chiếu theo Rạp (Cinema) trong ngày đang được chọn
  const showtimesByCinema = useMemo(() => {
    const filtered = showtimes.filter(st => st.startTime && st.startTime.startsWith(selectedDate));
    const grouped = {};
    filtered.forEach(st => {
      if (!grouped[st.cinemaId]) {
        grouped[st.cinemaId] = {
          name: st.cinemaName,
          address: st.cinemaAddress,
          showtimes: []
        };
      }
      grouped[st.cinemaId].showtimes.push(st);
    });
    // Sắp xếp các suất chiếu trong Rạp theo thời gian
    Object.values(grouped).forEach(cinema => {
      cinema.showtimes.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    });
    return grouped;
  }, [showtimes, selectedDate]);

  const handleSelectShowtime = (showtimeId) => {
    navigate(`/showtime/${showtimeId}/seats`);
  };

  const formatTime = (timeStr) => {
    return new Date(timeStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-300 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header Phim */}
      <div className="bg-gradient-to-b from-gray-900/90 to-[#0a0a0f] border-b border-white/5 pt-20 pb-8">
        <div className="max-w-5xl mx-auto px-6">
          <button onClick={() => navigate(-1)} className="text-stone-400 hover:text-orange-300 text-sm mb-6 flex items-center gap-1.5 transition-colors uppercase font-bold tracking-widest">
            ← Quay lại Trang Chủ
          </button>
          
          {movieInfo ? (
            <div className="flex flex-col md:flex-row items-start gap-8">
              {movieInfo.poster && (
                <img src={movieInfo.poster} alt={movieInfo.title} className="w-32 h-48 md:w-48 md:h-72 rounded-2xl object-cover shadow-2xl shadow-orange-500/10 border border-white/10" />
              )}
              <div className="flex-1 mt-4 md:mt-0">
                <div className="inline-block px-3 py-1 bg-orange-300/10 rounded-sm border border-orange-300/20 mb-4">
                  <span className="text-orange-300 text-xs font-bold uppercase tracking-[3px]">TICKETING</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold font-serif mb-4">{movieInfo.title}</h1>
                <div className="flex items-center gap-3">
                  <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold">{movieInfo.format}</span>
                  <span className="flex items-center gap-1 text-sm text-stone-400"><Film size={16} /> Tiêu chuẩn</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <h2 className="text-2xl text-stone-400">Không tìm thấy thông tin phim hoặc suất chiếu.</h2>
            </div>
          )}
        </div>
      </div>

      {movieInfo && (
        <div className="max-w-5xl mx-auto px-6 py-8">
          
          {/* Lọc ngày */}
          {availableDates.length > 0 && (
            <div className="mb-10">
              <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Calendar size={18} /> Chọn ngày</h3>
              <div className="flex flex-wrap gap-3">
                {availableDates.map(date => (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300 border ${
                      selectedDate === date 
                        ? 'bg-orange-300 text-yellow-950 border-orange-300 shadow-lg shadow-orange-300/20 scale-105'
                        : 'bg-white/5 border-white/10 text-stone-300 hover:bg-white/10 hover:border-orange-300/50'
                    }`}
                  >
                    {formatDate(date)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Danh sách rạp và suất chiếu */}
          <div className="space-y-8">
            {Object.keys(showtimesByCinema).length > 0 ? (
              Object.values(showtimesByCinema).map((cinema, idx) => (
                <div key={idx} className="bg-neutral-900/60 border border-white/5 rounded-2xl p-6">
                  <div className="flex items-start gap-4 mb-6 border-b border-white/5 pb-6">
                    <div className="bg-orange-300/10 p-3 rounded-xl border border-orange-300/20">
                      <MapPin className="text-orange-300" size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white font-serif">{cinema.name}</h3>
                      <p className="text-sm text-stone-400 mt-1">{cinema.address}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {cinema.showtimes.map(st => (
                      <button
                        key={st.id}
                        onClick={() => handleSelectShowtime(st.id)}
                        className="group flex flex-col items-center justify-center p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-orange-300 hover:border-orange-300 transition-all duration-300 cursor-pointer shadow-md"
                      >
                        <span className="text-lg font-bold text-white group-hover:text-yellow-950 transition-colors">
                          {formatTime(st.startTime)}
                        </span>
                        <span className="text-[10px] text-stone-400 group-hover:text-yellow-900 mt-1">
                          {st.roomName}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-neutral-900/60 rounded-2xl border border-white/5">
                <Clock className="mx-auto text-stone-500 mb-4" size={40} />
                <p className="text-stone-400">Không có suất chiếu nào trong ngày này.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
