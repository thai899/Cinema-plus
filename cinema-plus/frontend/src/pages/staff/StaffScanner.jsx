import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from "../../api/axiosClient";
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { Html5Qrcode } from "html5-qrcode";
import {
  QrCode, Scan, ShieldAlert, Wifi, WifiOff, CheckCircle2, XCircle,
  Clock, LogOut, Monitor, AlertTriangle, RefreshCw, Calendar,
  Ticket, Users, Shield, ChevronRight, RotateCcw, Hash, Film
} from 'lucide-react';

// ─── Helper: Format giờ Việt Nam ─────────────────────────────────────────────
const fmtTime = (d) =>
  `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`;

const fmtShowtime = (iso) => {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
};

// ─── Chip trạng thái suất chiếu ──────────────────────────────────────────────
const StatusBadge = ({ st }) => {
  const now = new Date();
  const start = new Date(st.startTime);
  const end   = new Date(st.endTime);
  if (now >= start && now <= end)
    return <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-[#e9c176]/20 text-[#e9c176] border border-[#e9c176]/30">● ĐANG SOÁT VÉ</span>;
  if (now < start)
    return <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700">CHỜ BẮT ĐẦU</span>;
  return <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-red-900/20 text-red-400 border border-red-800/30">ĐÃ KẾT THÚC</span>;
};

export default function StaffScanner() {
  const navigate  = useNavigate();
  const staffName = localStorage.getItem('username') || 'Nhân Viên';

  // ─── State ──────────────────────────────────────────────────────────────────
  const [schedule, setSchedule]               = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [selectedShowtime, setSelectedShowtime] = useState(null);

  const [cameraActive, setCameraActive]     = useState(false);
  const [scanResult, setScanResult]         = useState(null); // { type: 'VALID'|'INVALID'|'USED'|'ERROR', msg }
  const [scanCount, setScanCount]           = useState(0);
  const [scanLogs, setScanLogs]             = useState([]);

  const [wsConnected, setWsConnected]       = useState(false);
  const [incidentText, setIncidentText]     = useState('');
  const [showIncidentModal, setShowIncidentModal] = useState(false);

  const html5QrcodeRef = useRef(null);
  const logsEndRef     = useRef(null);
  const stompRef       = useRef(null);

  // ─── Fetch lịch suất chiếu hôm nay từ backend ─────────────────────────────
  const fetchTodaySchedule = useCallback(async () => {
    setScheduleLoading(true);
    try {
      const res = await axiosClient.get('/api/staff/showtimes/today');
      setSchedule(res.data || []);
      // Auto-select suất đang diễn ra hoặc đầu tiên trong ngày
      if (res.data && res.data.length > 0) {
        const now = new Date();
        const active = res.data.find(s => {
          const start = new Date(s.startTime);
          const end   = new Date(s.endTime);
          return now >= start && now <= end;
        });
        setSelectedShowtime(active || res.data[0]);
      }
    } catch {
      // Nếu không có suất chiếu hôm nay, dùng mock để demo
      setSchedule([]);
    } finally {
      setScheduleLoading(false);
    }
  }, []);

  useEffect(() => { fetchTodaySchedule(); }, [fetchTodaySchedule]);

  // ─── Auto-scroll log terminal ─────────────────────────────────────────────
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [scanLogs]);

  // ─── WebSocket STOMP ──────────────────────────────────────────────────────
  useEffect(() => {
    const socket = new SockJS('http://localhost:8081/ws-cinema');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: () => {},
      onConnect: () => {
        setWsConnected(true);
        pushLog({ type: 'SYS', msg: 'WebSocket kết nối thành công — đang lắng nghe sự kiện soát vé.', icon: <Shield className="text-emerald-400" size={14} /> });

        // Nhận xác nhận soát vé thật từ backend
        client.subscribe('/topic/tickets', (msg) => {
          const payload = JSON.parse(msg.body);
          const isValid = payload.status === 'VALID';
          setScanCount(prev => prev + (isValid ? 1 : 0));
          pushLog({
            type: payload.status,
            msg:  `#${payload.ticketId || '?'} — ${payload.message}`,
            icon: isValid
              ? <CheckCircle2 className="text-emerald-400" size={14} />
              : <XCircle className="text-red-400" size={14} />
          });
          // Cập nhật scanCount của suất đang chọn
          if (isValid) {
            setSchedule(prev => prev.map(s =>
              s.id === selectedShowtime?.id
                ? { ...s, scannedCount: (s.scannedCount || 0) + 1 }
                : s
            ));
          }
        });

        // Nhận Audit logs hệ thống
        client.subscribe('/topic/logs', (msg) => {
          const log = JSON.parse(msg.body);
          pushLog({
            type: 'AUDIT',
            msg: `[${log.username || 'N/A'}] ${log.httpMethod} ${log.uri}`,
            icon: <ShieldAlert className="text-amber-400" size={14} />
          });
        });
      },
      onDisconnect: () => {
        setWsConnected(false);
        pushLog({ type: 'SYS', msg: 'WebSocket mất kết nối. Đang thử lại...', icon: <WifiOff className="text-red-400" size={14} /> });
      }
    });
    stompRef.current = client;
    client.activate();
    return () => client.deactivate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushLog = (entry) => {
    setScanLogs(prev => [...prev, { ...entry, time: fmtTime(new Date()), id: Date.now() }]);
  };

  // ─── Camera QR Scanner ────────────────────────────────────────────────────
  useEffect(() => {
    if (!cameraActive) return;

    const scanner = new Html5Qrcode('qr-reader');
    html5QrcodeRef.current = scanner;
    setScanResult(null);

    scanner.start(
      { facingMode: 'environment' },
      {
        fps: 20,
        qrbox: (w, h) => {
          const s = Math.min(w, h) * 0.65;
          return { width: s, height: s };
        }
      },
      (decoded) => onScanSuccess(decoded),
      () => {}
    ).catch(() => {
      setCameraActive(false);
      setScanResult({ type: 'ERROR', msg: 'Không thể mở camera. Kiểm tra quyền truy cập thiết bị.' });
    });

    return () => stopCamera();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraActive]);

  const stopCamera = () => {
    if (html5QrcodeRef.current?.isScanning) {
      html5QrcodeRef.current.stop()
        .then(() => { html5QrcodeRef.current = null; })
        .catch(() => {});
    }
  };

  const onScanSuccess = async (decodedText) => {
    setCameraActive(false);
    stopCamera();

    if (!selectedShowtime) {
      setScanResult({ type: 'ERROR', msg: 'Chưa chọn suất chiếu! Vui lòng click chọn suất bên trái.' });
      return;
    }

    try {
      const res = await axiosClient.post('/api/staff/verify-ticket', {
        qrData: decodedText,
        currentShowtimeId: selectedShowtime.id
      });
      setScanResult({ type: 'VALID', msg: res.data?.message || 'Vé hợp lệ — Mời vào cửa!' });
    } catch (err) {
      const status = err.response?.data?.status || 'INVALID';
      const message = err.response?.data?.message || 'Vé không hợp lệ hoặc sai cổng kiểm soát!';
      setScanResult({ type: status, msg: message });
    }
  };

  // ─── Mock scan để demo nhanh ───────────────────────────────────────────────
  const handleMockScan = () => {
    const mockId = Math.floor(1000 + Math.random() * 9000);
    setScanCount(prev => prev + 1);
    setScanResult({ type: 'VALID', msg: `[MÔ PHỎNG] Vé #${mockId} — Mời vào cửa!` });
    pushLog({
      type: 'VALID',
      msg:  `[SIM] #${mockId} — Vé mô phỏng hệ thống`,
      icon: <CheckCircle2 className="text-emerald-400" size={14} />
    });
  };

  // ─── Scan result color map ────────────────────────────────────────────────
  const resultStyle = {
    VALID:   { bg: 'bg-emerald-500/10 border-emerald-500/40', text: 'text-emerald-400', icon: <CheckCircle2 size={32} className="text-emerald-400" /> },
    INVALID: { bg: 'bg-red-500/10 border-red-500/40',         text: 'text-red-400',     icon: <XCircle size={32} className="text-red-400" />         },
    USED:    { bg: 'bg-amber-500/10 border-amber-500/40',     text: 'text-amber-400',   icon: <AlertTriangle size={32} className="text-amber-400" />  },
    ERROR:   { bg: 'bg-zinc-800/50 border-zinc-600/40',       text: 'text-zinc-300',    icon: <AlertTriangle size={32} className="text-zinc-400" />   },
  };
  const rs = scanResult ? (resultStyle[scanResult.type] || resultStyle.ERROR) : null;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="bg-[#131313] text-[#e4e2e1] min-h-screen flex flex-col w-full selection:bg-[#e9c176]/20 overflow-x-hidden">

      {/* ── HEADER ── */}
      <header className="bg-[#1b1c1c] border-b border-[#4e4639]/30 flex justify-between items-center px-4 md:px-6 w-full h-16 shrink-0 z-40 sticky top-0">
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/" className="text-lg font-bold text-[#e9c176] uppercase font-serif tracking-wider shrink-0">
            Cinema Plus
          </Link>
          <div className="h-4 w-px bg-[#4e4639]/50 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-[#9a8f80] uppercase tracking-wider">
            <Monitor size={13} className="text-[#e9c176]" />
            <span>Trạm Kiểm Soát Vé</span>
          </div>
          {/* WS Status */}
          <div className={`hidden md:flex items-center gap-1.5 text-[9px] font-bold font-mono uppercase px-2 py-1 rounded-full border ${
            wsConnected
              ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5'
              : 'text-red-400 border-red-500/20 bg-red-500/5 animate-pulse'
          }`}>
            {wsConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
            {wsConnected ? 'SOCKET LIVE' : 'OFFLINE'}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-[#e9c176]/10 border border-[#e9c176]/20 px-3 py-1.5 rounded-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-bold text-[#e9c176] uppercase font-mono">{staffName}</span>
          </div>
          <button
            onClick={() => { localStorage.clear(); navigate('/login'); }}
            className="text-[#9a8f80] hover:text-red-400 p-2 rounded-lg hover:bg-red-500/5 cursor-pointer transition-all"
            title="Đăng xuất"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* ── MAIN GRID ── */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6 p-4 md:p-6 w-full max-w-[1700px] mx-auto min-w-0 box-border items-start">

        {/* ── CỘT TRÁI: LỊCH SUẤT CHIẾU HÔM NAY ── */}
        <aside className="xl:col-span-3 bg-[#1f2020] border border-[#4e4639]/20 rounded-2xl flex flex-col gap-0 shadow-xl overflow-hidden">
          <div className="flex justify-between items-center px-5 py-4 border-b border-[#4e4639]/20">
            <div>
              <h3 className="text-xs font-bold text-[#e9c176] font-sans tracking-wide uppercase">Lịch Suất Chiếu</h3>
              <p className="text-[10px] text-[#9a8f80] mt-0.5 font-mono">
                {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchTodaySchedule}
                className="text-[#9a8f80] hover:text-[#e9c176] p-1 cursor-pointer transition-colors"
                title="Tải lại lịch"
              >
                <RefreshCw size={13} className={scheduleLoading ? 'animate-spin' : ''} />
              </button>
              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                <Wifi size={10} /> LIVE
              </span>
            </div>
          </div>

          <div className="p-3 space-y-2 overflow-y-auto max-h-[500px]">
            {scheduleLoading ? (
              <div className="flex flex-col gap-2 py-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 rounded-xl bg-[#353535]/30 animate-pulse" />
                ))}
              </div>
            ) : schedule.length === 0 ? (
              <div className="text-center py-12 text-[#9a8f80] text-xs font-serif">
                <Calendar size={36} className="mx-auto mb-3 text-[#4e4639] opacity-60" />
                <p>Không có suất chiếu nào hôm nay.</p>
                <p className="text-[10px] mt-1 text-[#4e4639]">Admin hãy tạo suất chiếu mới trong Admin Panel.</p>
              </div>
            ) : (
              schedule.map((s) => {
                const isSelected = selectedShowtime?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedShowtime(s)}
                    className={`border rounded-xl p-3.5 space-y-2 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-[#e9c176]/10 border-[#e9c176]/60 shadow-[0_0_12px_rgba(233,193,118,0.1)] ring-1 ring-[#e9c176]/20'
                        : 'bg-[#131313]/50 border-[#4e4639]/20 hover:border-[#4e4639]/60 hover:bg-[#1a1a1a]'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className={`text-[10px] font-bold font-mono ${isSelected ? 'text-[#e9c176]' : 'text-[#9a8f80]'}`}>
                        {s.screenName} · #{s.id}
                      </span>
                      <StatusBadge st={s} />
                    </div>
                    <p className={`text-xs font-bold truncate transition-colors ${isSelected ? 'text-white' : 'text-stone-300'}`}>
                      {s.movieTitle}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-[#9a8f80] font-mono">
                      <span><Clock size={9} className="inline mr-1" />{fmtShowtime(s.startTime)} – {fmtShowtime(s.endTime)}</span>
                      <span className="text-emerald-400 font-bold">{s.scannedCount || 0} vé ✓</span>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-1 text-[9px] text-[#e9c176]/70 font-mono pt-1 border-t border-[#e9c176]/10">
                        <ChevronRight size={10} />
                        <span>Đang soát vé tại suất này</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ── CỘT GIỮA: CAMERA QR SCANNER ── */}
        <main className="xl:col-span-6 bg-[#1f2020] border border-[#4e4639]/20 rounded-2xl p-5 md:p-6 flex flex-col items-center gap-5 shadow-xl">
          {/* Title + selected showtime info */}
          <div className="text-center space-y-1 w-full">
            <h2 className="text-xl md:text-2xl font-bold text-white font-sans tracking-wide">Hệ Thống Kiểm Soát QR</h2>
            {selectedShowtime ? (
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="text-[#9a8f80] text-xs">Suất đang soát:</span>
                <span className="text-[#e9c176] font-bold text-xs font-mono">
                  {selectedShowtime.screenName} · {selectedShowtime.movieTitle} · {fmtShowtime(selectedShowtime.startTime)}
                </span>
              </div>
            ) : (
              <p className="text-amber-400 text-xs">⚠ Vui lòng chọn suất chiếu bên trái trước khi quét vé!</p>
            )}
          </div>

          {/* Camera box */}
          <div className="w-full max-w-lg aspect-[4/3] bg-[#0d0d0d] rounded-2xl border border-[#4e4639]/40 relative overflow-hidden flex items-center justify-center shadow-inner">
            <div
              id="qr-reader"
              className="w-full h-full text-[#e4e2e1] bg-black overflow-hidden flex items-center justify-center border-0
                [&_video]:!w-full [&_video]:!h-full [&_video]:!max-w-full [&_video]:!max-h-full [&_video]:!object-cover"
            />

            {/* Scan result overlay */}
            {!cameraActive && scanResult && rs && (
              <div className={`absolute inset-0 flex flex-col items-center justify-center z-20 border-2 rounded-2xl ${rs.bg}`}>
                {rs.icon}
                <p className={`mt-3 text-base font-bold text-center px-6 ${rs.text}`}>{scanResult.msg}</p>
                <p className="text-[10px] text-[#9a8f80] mt-2 font-mono">{scanResult.type}</p>
                <button
                  onClick={() => setScanResult(null)}
                  className="mt-4 text-[10px] font-bold text-[#9a8f80] hover:text-white border border-[#4e4639]/50 px-3 py-1 rounded-lg cursor-pointer"
                >
                  <RotateCcw size={10} className="inline mr-1" />Soát vé tiếp
                </button>
              </div>
            )}

            {/* Camera active: scan frame overlay */}
            {cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                <div className="w-52 h-52 md:w-64 md:h-64 relative bg-transparent shadow-[0_0_0_9999px_rgba(13,13,13,0.55)] rounded-xl border border-white/10">
                  <div className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-[#e9c176] rounded-tl-md" />
                  <div className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-[#e9c176] rounded-tr-md" />
                  <div className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-[#e9c176] rounded-bl-md" />
                  <div className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-[#e9c176] rounded-br-md" />
                  <div className="w-full h-[2px] bg-red-500 absolute top-1/2 animate-[scan_2s_ease-in-out_infinite_alternate] shadow-[0_0_12px_#ef4444]" />
                </div>
              </div>
            )}

            {/* Idle placeholder */}
            {!cameraActive && !scanResult && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d0d0d] z-10 pointer-events-none">
                <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-[#e9c176]/30 rounded-tl-md" />
                <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-[#e9c176]/30 rounded-tr-md" />
                <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-[#e9c176]/30 rounded-bl-md" />
                <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-[#e9c176]/30 rounded-br-md" />
                <QrCode className="text-[#4e4639]/50 animate-pulse" size={72} />
                <p className="text-[#4e4639]/70 text-xs mt-3 font-mono">Camera đang tắt</p>
              </div>
            )}
          </div>

          {/* Control buttons */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
            <button
              type="button"
              disabled={!selectedShowtime}
              onClick={() => setCameraActive(prev => !prev)}
              className={`font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
                !selectedShowtime
                  ? 'bg-[#353535] text-[#6b6b6b] cursor-not-allowed'
                  : cameraActive
                    ? 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20'
                    : 'bg-[#e9c176] text-[#261900] hover:bg-[#d9b166] shadow-md shadow-[#e9c176]/20'
              }`}
            >
              <Scan size={14} />
              {cameraActive ? 'TẮT CAMERA' : 'BẬT CAMERA'}
            </button>

            <button
              type="button"
              onClick={handleMockScan}
              className="border border-[#4e4639]/50 py-3.5 rounded-xl text-xs font-bold text-[#d1c5b4] hover:bg-white/5 hover:border-[#e9c176]/30 cursor-pointer transition-all"
            >
              MÔ PHỎNG
            </button>

            <button
              type="button"
              onClick={() => setShowIncidentModal(true)}
              className="border border-red-500/25 text-red-400 py-3.5 rounded-xl text-xs font-bold hover:bg-red-500/8 hover:border-red-500/40 cursor-pointer transition-all"
            >
              BÁO SỰ CỐ
            </button>
          </div>

          {/* Suất info bar */}
          {selectedShowtime && (
            <div className="w-full max-w-lg grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Phòng chiếu', value: selectedShowtime.screenName, icon: <Monitor size={12} /> },
                { label: 'Định dạng', value: selectedShowtime.movieFormat || '2D', icon: <Film size={12} /> },
                { label: 'Vé đã soát', value: (selectedShowtime.scannedCount || 0) + ' vé', icon: <Ticket size={12} /> },
              ].map((item, i) => (
                <div key={i} className="bg-[#131313]/60 border border-[#4e4639]/20 rounded-xl p-3">
                  <div className="flex items-center justify-center gap-1 text-[#9a8f80] mb-1">{item.icon}</div>
                  <div className="text-[10px] text-[#9a8f80] uppercase tracking-wider mb-0.5">{item.label}</div>
                  <div className="text-sm font-bold text-[#e9c176] font-mono">{item.value}</div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* ── CỘT PHẢI: STATS + NHẬT KÝ REALTIME ── */}
        <aside className="xl:col-span-3 flex flex-col gap-4">

          {/* Counter card */}
          <div className="bg-[#1f2020] border border-[#4e4639]/20 rounded-2xl p-5 shadow-xl text-center">
            <span className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest block mb-2">Vé Đã Soát Trong Ca</span>
            <span className="text-5xl font-extrabold text-[#e9c176] font-mono block leading-none">{scanCount}</span>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Users size={11} className="text-[#9a8f80]" />
              <span className="text-[10px] text-[#9a8f80]">Hôm nay · Ca hiện tại</span>
            </div>
          </div>

          {/* Live log terminal */}
          <div className="bg-[#1f2020] border border-[#4e4639]/20 rounded-2xl flex-1 flex flex-col overflow-hidden shadow-xl">
            <div className="px-5 py-3.5 border-b border-[#4e4639]/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Hash size={13} className="text-[#e9c176]" />
                <h3 className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest font-mono">Nhật Ký Kiểm Soát</h3>
              </div>
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400 animate-ping' : 'bg-red-400'}`} />
            </div>

            <div className="flex flex-col gap-2 p-3 overflow-y-auto max-h-[380px] custom-scrollbar">
              {scanLogs.length === 0 ? (
                <div className="text-center py-10 text-[#4e4639] text-xs font-mono">
                  Đang chờ sự kiện soát vé...
                </div>
              ) : (
                scanLogs.map((log) => {
                  const logStyle = {
                    VALID:   'border-emerald-500/25 bg-emerald-500/5',
                    INVALID: 'border-red-500/25 bg-red-500/5',
                    USED:    'border-amber-500/25 bg-amber-500/5',
                    SYS:     'border-[#4e4639]/30 bg-[#131313]/30',
                    AUDIT:   'border-[#0164b4]/20 bg-[#0164b4]/5',
                    ERROR:   'border-zinc-600/30 bg-zinc-800/20',
                  }[log.type] || 'border-[#4e4639]/20 bg-transparent';
                  return (
                    <div key={log.id} className={`border rounded-xl p-3 flex items-start gap-2.5 ${logStyle}`}>
                      <div className="mt-0.5 shrink-0">{log.icon || <Shield size={14} className="text-[#9a8f80]" />}</div>
                      <div className="flex flex-col min-w-0 w-full">
                        <span className="text-[11px] font-semibold text-white leading-tight break-words">{log.msg}</span>
                        <span className="text-[9px] text-[#9a8f80] mt-1 font-mono">{log.time}</span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </aside>
      </div>

      {/* ── INCIDENT REPORT MODAL ── */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="bg-[#1f2020] border border-red-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-red-500/20 bg-red-500/5 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white font-serif flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-400" /> Báo Cáo Sự Cố
              </h3>
              <button onClick={() => setShowIncidentModal(false)} className="text-stone-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-[#9a8f80]">Mô tả sự cố tại cổng kiểm soát. Báo cáo sẽ được ghi vào Audit Log hệ thống.</p>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#9a8f80] uppercase">Nội dung sự cố</label>
                <textarea
                  rows={4}
                  className="w-full bg-[#131313] border border-[#4e4639]/70 rounded-xl px-4 py-2.5 text-white outline-none focus:border-red-500/50 transition-all text-xs resize-none"
                  placeholder="Ví dụ: Khách hàng phản đối kết quả quét vé, mã QR bị mờ không đọc được..."
                  value={incidentText}
                  onChange={(e) => setIncidentText(e.target.value)}
                />
              </div>
              <div className="bg-[#131313]/60 border border-[#4e4639]/20 rounded-xl p-3 text-[10px] font-mono text-[#9a8f80] space-y-1">
                <div><span className="text-[#e9c176]">Nhân viên:</span> {staffName}</div>
                <div><span className="text-[#e9c176]">Suất chiếu:</span> {selectedShowtime ? `#${selectedShowtime.id} — ${selectedShowtime.movieTitle}` : 'Chưa chọn'}</div>
                <div><span className="text-[#e9c176]">Thời gian:</span> {new Date().toLocaleString('vi-VN')}</div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowIncidentModal(false)}
                  className="bg-[#353535] text-white rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer hover:bg-[#404040]"
                >
                  HỦY
                </button>
                <button
                  onClick={() => {
                    if (!incidentText.trim()) return;
                    pushLog({
                      type: 'AUDIT',
                      msg: `[BÁO SỰ CỐ] ${staffName}: ${incidentText}`,
                      icon: <AlertTriangle size={14} className="text-red-400" />
                    });
                    setIncidentText('');
                    setShowIncidentModal(false);
                    alert('✅ Báo cáo sự cố đã được ghi nhận vào nhật ký hệ thống!');
                  }}
                  className="bg-red-500 text-white rounded-xl px-5 py-2 font-bold text-xs cursor-pointer hover:bg-red-600"
                >
                  GỬI BÁO CÁO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes scan {
          from { top: 10%; }
          to   { top: 90%; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4e4639; border-radius: 4px; }
      `}</style>
    </div>
  );
}