import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from "../../api/axiosClient";
import { 
  QrCode, Scan, ShieldAlert, Wifi, AlertTriangle, Lightbulb, 
  Printer, CheckCircle2, XCircle, Clock, Search, LogOut, Monitor
} from 'lucide-react';

export default function StaffScanner() {
  const navigate = useNavigate();
  const staffName = localStorage.getItem('username') || 'Nhân Viên';
  
  const [scanCount, setScanCount] = useState(243);
  const [ledActive, setLedActive] = useState(false);
  
  const [schedule] = useState([
    { room: 'PHÒNG 2', title: 'Dune: Hành Tinh Cát - Phần II', status: 'ĐANG SOÁT VÉ', booked: 82, total: 140, badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
    { room: 'PHÒNG 5', title: 'The Holdovers', status: 'CHỜ BẮT ĐẦU', booked: 0, total: 95, badgeColor: 'bg-zinc-800 text-zinc-400 border border-zinc-700' },
    { room: 'IMAX 1', title: 'Oppenheimer', status: 'CHỜ BẮT ĐẦU', booked: 0, total: 220, badgeColor: 'bg-zinc-800 text-zinc-400 border border-zinc-700' }
  ]);

  const [scanLogs, setScanLogs] = useState([
    { id: 4492, status: 'VALID', room: 'Phòng 2', msg: 'Vé hợp lệ - Vào phòng', time: 'Vừa xong', color: 'border-green-500/30 bg-green-500/5', icon: <CheckCircle2 className="text-green-400" size={16} /> },
    { id: 4491, status: 'VALID', room: 'Phòng 2', msg: 'Vé hợp lệ - Vào phòng', time: '2 phút trước', color: 'border-green-500/30 bg-green-500/5', icon: <CheckCircle2 className="text-green-400" size={16} /> },
    { id: 4489, status: 'INVALID', room: 'Sai cổng', msg: 'Sai cổng kiểm soát', time: '5 phút trước', color: 'border-red-500/30 bg-red-500/5', icon: <XCircle className="text-red-400" size={16} /> }
  ]);

  const handleMockScan = () => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    setScanLogs(prev => [
      { id: randomId, time: 'Vừa xong', status: 'VALID', room: 'Phòng 2', msg: 'Vé hợp lệ - Vào phòng', color: 'border-green-500/30 bg-green-500/5', icon: <CheckCircle2 className="text-green-400" size={16} /> },
      ...prev
    ]);
    setScanCount(prev => prev + 1);
  };

  return (
    <div className="bg-[#131313] text-[#e4e2e1] min-h-screen flex flex-col w-full selection:bg-[#e9c176]/20 overflow-x-hidden">
      
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
          <div onClick={() => navigate('/login')} className="flex items-center gap-2 bg-[#e9c176]/10 border border-[#e9c176]/20 px-3 py-1.5 rounded-lg cursor-pointer">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-[10px] font-bold text-[#e9c176] uppercase font-mono">{staffName}</span>
          </div>
          <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="text-[#9a8f80] hover:text-red-400 p-1 cursor-pointer">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 p-4 md:p-6 w-full max-w-[1600px] mx-auto min-w-0 box-border items-start">
        
        <aside className="xl:col-span-3 bg-[#1f2020] border border-[#4e4639]/20 rounded-2xl p-4 md:p-5 flex flex-col gap-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-[#4e4639]/20 pb-3">
            <h3 className="text-sm font-bold text-[#e9c176] font-sans tracking-wide">LỊCH BẮT ĐẦU SUẤT CHIẾU</h3>
            <span className="text-[10px] font-mono text-green-400 flex items-center gap-1"><Wifi size={10} /> LIVE</span>
          </div>

          <div className="space-y-3">
            {schedule.map((s, i) => (
              <div key={i} className="bg-[#131313]/50 border border-[#4e4639]/20 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-mono text-[#9a8f80] font-bold">{s.room}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${s.badgeColor}`}>{s.status}</span>
                </div>
                <h4 className="text-xs md:text-sm font-bold text-white truncate">{s.title}</h4>
              </div>
            ))}
          </div>
        </aside>

        <main className="xl:col-span-6 bg-[#1f2020] border border-[#4e4639]/20 rounded-2xl p-5 md:p-6 flex flex-col items-center justify-center gap-6 shadow-xl">
          <div className="text-center space-y-1.5">
            <h2 className="text-xl md:text-2xl font-bold text-white font-sans tracking-wide">HỆ THỐNG ĐANG SẴN SÀNG</h2>
            <p className="text-[#9a8f80] text-xs">Đưa mã QR hoặc mã vạch trên vé của khách hàng vào khung quét</p>
          </div>

          <div className="w-full max-w-lg aspect-[16/10] bg-black rounded-2xl border border-[#4e4639]/40 relative overflow-hidden flex items-center justify-center shadow-inner">
            <div className="absolute top-8 left-8 w-8 h-8 border-t-4 border-l-4 border-[#e9c176] rounded-tl-md"></div>
            <div className="absolute top-8 right-8 w-8 h-8 border-t-4 border-r-4 border-[#e9c176] rounded-tr-md"></div>
            <div className="absolute bottom-8 left-8 w-8 h-8 border-b-4 border-l-4 border-[#e9c176] rounded-bl-md"></div>
            <div className="absolute bottom-8 right-8 w-8 h-8 border-b-4 border-r-4 border-[#e9c176] rounded-br-md"></div>
            <div className="w-4/5 h-[2px] bg-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 animate-bounce"></div>
            <QrCode className="text-[#9a8f80]/30" size={84} />
          </div>

          <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
            <button type="button" onClick={handleMockScan} className="bg-[#e9c176] text-[#261900] font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer">
              <Scan size={14} /> MÔ PHỎNG QUÉT VÉ
            </button>
            <button type="button" onClick={() => setLedActive(!ledActive)} className="border border-[#4e4639] py-3.5 rounded-xl text-xs font-bold text-[#e4e2e1]">
              LED: {ledActive ? "ON" : "OFF"}
            </button>
            <button type="button" className="border border-red-500/20 text-red-400 py-3.5 rounded-xl text-xs font-bold">
              BÁO SỰ CỐ
            </button>
          </div>
        </main>

        <aside className="xl:col-span-3 bg-[#1f2020] border border-[#4e4639]/20 rounded-2xl p-5 flex flex-col gap-5 shadow-xl">
          <div className="bg-[#131313]/60 border border-[#e9c176]/10 rounded-xl p-5 text-center shadow-inner">
            <span className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest block">VÉ ĐÃ SOÁT TRONG CA</span>
            <span className="text-4xl font-extrabold text-[#e9c176] font-mono block mt-1">{scanCount}</span>
          </div>

          <div className="flex flex-col flex-1 gap-3 min-w-0">
            <div className="flex items-center gap-2 border-b border-[#4e4639]/20 pb-2.5">
              <Clock className="text-[#e9c176]" size={14} />
              <h3 className="text-[10px] font-bold text-[#9a8f80] uppercase tracking-widest font-mono">NHẬT KÝ QUÉT GẦN ĐÂY</h3>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[290px] pr-1 custom-scrollbar">
              {scanLogs.map((log, index) => (
                <div key={index} className={`border rounded-xl p-3.5 flex items-start justify-between gap-3 ${log.color}`}>
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="mt-0.5">{log.icon}</div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">{log.msg}</span>
                      <span className="text-[10px] text-[#9a8f80] mt-1 font-mono">{log.time} • ID: #{log.id}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}