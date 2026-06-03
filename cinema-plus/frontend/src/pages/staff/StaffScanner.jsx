import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from "../../api/axiosClient";
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { Html5Qrcode } from "html5-qrcode"; 
import { 
  QrCode, Scan, ShieldAlert, Wifi, CheckCircle2, XCircle, Clock, LogOut, Monitor
} from 'lucide-react';

export default function StaffScanner() {
  const navigate = useNavigate();
  const staffName = localStorage.getItem('username') || 'Nhân Viên';
  
  const [scanCount, setScanCount] = useState(243);
  const [cameraActive, setCameraActive] = useState(false); 
  const [selectedShowtimeId, setSelectedShowtimeId] = useState(101);
  const [scanLogs, setScanLogs] = useState([]); // Nhận logs động qua WebSocket
  
  const html5QrcodeRef = useRef(null); 

  // Danh sách Suất chiếu mẫu
  const [schedule] = useState([
    { id: 101, room: 'PHÒNG 2', title: 'Dune: Hành Tinh Cát - Phần II', status: 'ĐANG SOÁT VÉ', badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
    { id: 102, room: 'PHÒNG 5', title: 'The Holdovers', status: 'CHỜ BẮT ĐẦU', badgeColor: 'bg-zinc-800 text-zinc-400 border border-zinc-700' },
    { id: 103, room: 'IMAX 1', title: 'Oppenheimer', status: 'CHỜ BẮT ĐẦU', badgeColor: 'bg-zinc-800 text-zinc-400 border border-zinc-700' }
  ]);

  //  LUỒNG KẾT NỐI WEBSOCKET NHẬN LOGS THỜI GIAN THỰC
  useEffect(() => {
    const socket = new SockJS('http://localhost:8081/ws-cinema');
    const stompClient = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log(str),
      onConnect: () => {
        console.log("KẾT NỐI SOCKET CINEMA PLUS THÀNH CÔNG!");
        
        // 1. Đăng ký nhận thông báo soát vé thời gian thực từ backend
        stompClient.subscribe('/topic/tickets', (message) => {
          const liveTicket = JSON.parse(message.body);
          
          setScanLogs(prev => [
            { 
              id: liveTicket.ticketId, 
              time: 'Vừa xong', 
              status: liveTicket.status, 
              msg: liveTicket.message, 
              color: 'border-green-500/30 bg-green-500/5', 
              icon: <CheckCircle2 className="text-green-400" size={16} /> 
            },
            ...prev
          ]);
          setScanCount(prev => prev + 1);
        });

        // 2. Đăng ký nhận System Audit Logs thời gian thực
        stompClient.subscribe('/topic/logs', (message) => {
          const systemLog = JSON.parse(message.body);
          
          setScanLogs(prev => [
            { 
              id: Math.floor(Math.random() * 1000), 
              time: systemLog.time, 
              status: 'SYSTEM', 
              msg: `[${systemLog.user}] (${systemLog.ip}): ${systemLog.action}`, 
              color: 'border-amber-500/30 bg-amber-500/5', 
              icon: <ShieldAlert className="text-amber-400" size={16} /> 
            },
            ...prev
          ]);
        });
      }
    });

    stompClient.activate();

    return () => stompClient.deactivate();
  }, []);

  //  LUỒNG ĐIỀU KHIỂN CAMERA PHẦN CỨNG LAPTOP
  useEffect(() => {
    if (cameraActive) {
      const html5QrcodeScanner = new Html5Qrcode("reader");
      html5QrcodeRef.current = html5QrcodeScanner;

      html5QrcodeScanner.start(
        { facingMode: "environment" },
        {
          fps: 20,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const size = Math.min(viewfinderWidth, viewfinderHeight) * 0.65;
            return { width: size, height: size };
          }
        },
        onScanSuccess,
        () => {}
      ).catch(() => setCameraActive(false));
    }

    return () => stopCamera();
  }, [cameraActive, selectedShowtimeId]);

  const stopCamera = () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      html5QrcodeRef.current.stop().then(() => {
        html5QrcodeRef.current = null;
      }).catch(err => console.error(err));
    }
  };

  // Hàm xử lý khi camera quét trúng mã QR thành công
  const onScanSuccess = async (decodedText) => {
    setCameraActive(false);
    stopCamera();

    try {
      await axiosClient.post('/api/staff/verify-ticket', { 
        qrData: decodedText, 
        currentShowtimeId: selectedShowtimeId 
      });
    } catch (error) {
      alert(error.response?.data?.message || "Vé không hợp lệ hoặc sai cổng kiểm soát!");
    }
  };

  // Hàm mô phỏng giả lập nhanh dữ liệu
  const handleMockScan = () => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    setScanLogs(prev => [
      { id: randomId, time: 'Vừa xong', status: 'VALID', msg: 'Vé mô phỏng hệ thống - Phòng hợp lệ', color: 'border-green-500/30 bg-green-500/5', icon: <CheckCircle2 className="text-green-400" size={16} /> },
      ...prev
    ]);
    setScanCount(prev => prev + 1);
  };

  // 🟢 TOÀN BỘ KHỐI GIAO DIỆN RENDERING CHUẨN ĐÃ ĐƯỢC ĐÓNG NGOẶC AN TOÀN
  return (
    <div className="bg-[#131313] text-[#e4e2e1] min-h-screen flex flex-col w-full selection:bg-[#e9c176]/20 overflow-x-hidden">
      
      {/* HEADER BAR */}
      <header className="bg-[#1b1c1c] border-b border-[#4e4639]/30 flex justify-between items-center px-6 w-full h-16 shrink-0 z-40">
        <div className="flex items-center gap-6 min-w-0">
          <Link to="/" className="text-xl font-bold text-[#e9c176] uppercase font-serif tracking-wider shrink-0">CINEMA PLUS</Link>
          <div className="h-4 w-[1px] bg-[#4e4639]/50 hidden sm:block"></div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#9a8f80] uppercase tracking-wider truncate">
            <Monitor size={14} className="text-[#e9c176]" />
            <span> KIỂM SOÁT VÉ - CỬA SỐ 04</span>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2 bg-[#e9c176]/10 border border-[#e9c176]/20 px-3 py-1.5 rounded-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-[10px] font-bold text-[#e9c176] uppercase font-mono">{staffName}</span>
          </div>
          <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="text-[#9a8f80] hover:text-red-400 p-1 cursor-pointer">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* CANVAS GIAO DIỆN CHÍNH */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 p-4 md:p-6 w-full max-w-[1600px] mx-auto min-w-0 box-border items-start">
        
        {/* CỘT TRÁI: LỊCH SUẤT CHIẾU */}
        <aside className="xl:col-span-3 bg-[#1f2020] border border-[#4e4639]/20 rounded-2xl p-4 md:p-5 flex flex-col gap-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-[#4e4639]/20 pb-3">
            <h3 className="text-sm font-bold text-[#e9c176] font-sans tracking-wide">LỊCH BẮT ĐẦU SUẤT CHIẾU</h3>
            <span className="text-[10px] font-mono text-green-400 flex items-center gap-1"><Wifi size={10} /> LIVE</span>
          </div>

          <div className="space-y-3">
            {schedule.map((s) => {
              const isSelected = selectedShowtimeId === s.id;

              return (
                <div 
                  key={s.id} 
                  onClick={() => {
                    setSelectedShowtimeId(s.id);
                    console.log(`Hệ thống chuyển trục quét vé sang Suất chiếu ID: ${s.id}`);
                  }}
                  className={`border rounded-xl p-4 space-y-3 cursor-pointer transition-all duration-300 transform active:scale-95 ${
                    isSelected 
                      ? 'bg-[#e9c176]/10 border-[#e9c176] shadow-[0_0_15px_rgba(233,193,118,0.15)] ring-1 ring-[#e9c176]/30' 
                      : 'bg-[#131313]/50 border border-[#4e4639]/20 hover:border-[#4e4639]/60 hover:bg-[#131313]/80'
                  }`}
                >
                  <div className="flex justify-between items-center pointer-events-none">
                    <span className={`text-[11px] font-mono font-bold ${isSelected ? 'text-[#e9c176]' : 'text-[#9a8f80]'}`}>
                      {s.room} (ID: {s.id})
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                      isSelected ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : s.badgeColor
                    }`}>
                      {s.status}
                    </span>
                  </div>
                  <h4 className={`text-xs md:text-sm font-bold truncate transition-colors ${isSelected ? 'text-white' : 'text-stone-300'}`}>
                    {s.title}
                  </h4>
                </div>
              );
            })}
          </div>
        </aside>

        {/* CỘT GIỮA: CAMERA QUÉT MÃ QR */}
        <main className="xl:col-span-6 bg-[#1f2020] border border-[#4e4639]/20 rounded-2xl p-5 md:p-6 flex flex-col items-center justify-center gap-6 shadow-xl">
          <div className="text-center space-y-1.5">
            <h2 className="text-xl md:text-2xl font-bold text-white font-sans tracking-wide">HỆ THỐNG KIỂM SOÁT QR</h2>
            <p className="text-[#9a8f80] text-xs">Mở camera laptop để quét mã QR vé xem phim trực tuyến</p>
          </div>

          <div className="w-full max-w-lg aspect-[16/10] bg-[#131313] rounded-2xl border border-[#4e4639]/40 relative overflow-hidden flex items-center justify-center shadow-inner">
            <div 
              id="reader" 
              className="w-full h-full text-[#e4e2e1] bg-black overflow-hidden flex items-center justify-center border-0
                [&_video]:!w-full [&_video]:!h-full [&_video]:!max-w-full [&_video]:!max-h-full [&_video]:!object-cover"
            ></div>

            {/* KHUNG TIÊU CỰ CHÍNH TÂM + TIA LASER CHẠY LÊN XUỐNG */}
            {cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                <div className="w-56 h-56 md:w-64 md:h-64 relative bg-transparent shadow-[0_0_0_9999px_rgba(19,19,19,0.55)] rounded-xl border border-white/10">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#e9c176] rounded-tl-md"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#e9c176] rounded-tr-md"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#e9c176] rounded-bl-md"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#e9c176] rounded-br-md"></div>
                  
                  {/* TIA ĐỎ LASER CHẠY LÊN XUỐNG */}
                  <div className="w-full h-[2px] bg-red-500 absolute animate-scan-line-huit shadow-[0_0_12px_#ef4444]"></div>
                </div>
              </div>
            )}

            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#131313] z-10 pointer-events-none">
                <div className="absolute top-8 left-8 w-8 h-8 border-t-4 border-l-4 border-[#e9c176] rounded-tl-md"></div>
                <div className="absolute top-8 right-8 w-8 h-8 border-t-4 border-r-4 border-[#e9c176] rounded-tr-md"></div>
                <div className="absolute bottom-8 left-8 w-8 h-8 border-b-4 border-l-4 border-[#e9c176] rounded-bl-md"></div>
                <div className="absolute bottom-8 right-8 w-8 h-8 border-b-4 border-r-4 border-[#e9c176] rounded-br-md"></div>
                <QrCode className="text-[#4e4639]/40 animate-pulse" size={84} />
              </div>
            )}
          </div>

          {/* BỘ NÚT ĐIỀU KHIỂN */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
            <button 
              type="button" 
              onClick={() => setCameraActive(!cameraActive)} 
              className={`font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
                cameraActive ? 'bg-red-500 text-white hover:bg-red-600 shadow-md' : 'bg-[#e9c176] text-[#261900] hover:bg-[#d9b166]'
              }`}
            >
              <Scan size={14} /> {cameraActive ? "TẮT CAMERA" : "BẬT CAMERA QUÉT VÉ"}
            </button>

            <button type="button" onClick={handleMockScan} className="border border-[#4e4639] py-3.5 rounded-xl text-xs font-bold text-[#e4e2e1] hover:bg-white/5 cursor-pointer">
              QUÉT MÔ PHỎNG
            </button>
            <button type="button" className="border border-red-500/20 text-red-400 py-3.5 rounded-xl text-xs font-bold hover:bg-red-500/5">
              BÁO SỰ CỐ
            </button>
          </div>
        </main>

        {/* CỘT PHẢI: NHẬT KÝ KIỂM SOÁT REALTIME */}
        <aside className="xl:col-span-3 bg-[#1f2020] border border-[#4e4639]/20 rounded-2xl p-5 flex flex-col gap-5 shadow-xl">
          <div className="bg-[#131313]/60 border border-[#e9c176]/10 rounded-xl p-5 text-center shadow-inner">
            <span className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest block">VÉ ĐÃ SOÁT TRONG CA</span>
            <span className="text-4xl font-extrabold text-[#e9c176] font-mono block mt-1">{scanCount}</span>
          </div>

          <div className="flex flex-col flex-1 gap-3 min-w-0">
            <div className="flex items-center gap-2 border-b border-[#4e4639]/20 pb-2.5">
              <Clock className="text-[#e9c176]" size={14} />
              <h3 className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest font-mono">NHẬT KÝ KIỂM SOÁT REALTIME</h3>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[290px] pr-1 custom-scrollbar">
              {scanLogs.length > 0 ? (
                scanLogs.map((log, index) => (
                  <div key={index} className={`border rounded-xl p-3.5 flex items-start justify-between gap-3 ${log.color}`}>
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="mt-0.5 shrink-0">{log.icon}</div>
                      <div className="flex flex-col min-w-0 w-full">
                        <span className="text-xs font-bold text-white break-words leading-tight">{log.msg}</span>
                        <span className="text-[10px] text-[#9a8f80] mt-1.5 font-mono">{log.time} {log.status !== 'SYSTEM' && `• ID: #${log.id}`}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[#9a8f80] text-xs font-mono">
                  Đang chờ tín hiệu kết nối socket...
                </div>
              )}
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
} 