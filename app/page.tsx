"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Trash2, Save, Calculator, CheckCircle2, ArrowRight, Mic, User, TrendingUp } from 'lucide-react';
import Link from 'next/link';

// --- Firebase ---
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface StaffWork {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
}

function AttendanceContent() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');
  const [date, setDate] = useState(dateParam || new Date().toISOString().split('T')[0]);
  const [showToast, setShowToast] = useState(false);
  const [activeListeningId, setActiveListeningId] = useState<string | null>(null);
  
  const [staffList, setStaffList] = useState<StaffWork[]>([
    { id: '1', name: '', startTime: '19:00', endTime: '22:00', breakMinutes: 0 }
  ]);

  const calculateHours = (s: StaffWork) => {
    const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    let start = toMin(s.startTime), end = toMin(s.endTime);
    if (end < start) end += 1440;
    const diff = end - start - s.breakMinutes;
    return diff > 0 ? Math.floor((diff / 60) * 100) / 100 : 0;
  };

  const dailyTotal = staffList.reduce((sum, staff) => sum + calculateHours(staff), 0);

  const handleSave = async () => {
    try {
      const docRef = doc(db, "kintai", date);
      await setDoc(docRef, { 
        totalHours: dailyTotal,
        updatedAt: new Date()
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (error) {
      console.error("保存失敗:", error);
    }
  };

  const updateStaff = (id: string, field: keyof StaffWork, value: any) => {
    setStaffList(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // --- 音声入力ロジック（完全復活） ---
  const startListening = (staffId: string) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Chrome推奨です");

    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.onstart = () => setActiveListeningId(staffId);
    recognition.onend = () => setActiveListeningId(null);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
        .replace(/[０-９]/g, (s: string) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
        .replace(/[：:。、.？?]/g, '');

      setStaffList(prev => prev.map(staff => {
        if (staff.id !== staffId) return staff;
        let updated = { ...staff };
        const parseTime = (keywords: string[], isStart: boolean) => {
          const regex = new RegExp(`(?:(\\d+)\\s*時)?\\s*(\\d+)?\\s*分?\\s*(?:${keywords.join('|')})|(?:${keywords.join('|')})\\s*(?:(\\d+)\\s*時)?\\s*(\\d+)?\\s*分?`);
          const m = transcript.match(regex);
          if (m) {
            let h = parseInt(m[1] || m[3]);
            const min = m[2] || m[4] || "00";
            if (!isNaN(h)) {
              if (isStart && h < 15) h += 12;
              if (!isStart && h >= 8 && h < 12) h += 12;
              return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
            }
          }
          return null;
        };
        const st = parseTime(["入り", "出勤", "開始"], true);
        const et = parseTime(["上がり", "退勤", "終了"], false);
        if (st) updated.startTime = st; 
        if (et) updated.endTime = et;
        const breakMatch = transcript.match(/(\d+)\s*(時間|分)?\s*休憩/);
        if (breakMatch) {
          const val = parseInt(breakMatch[1]);
          updated.breakMinutes = transcript.includes(breakMatch[1] + "時間") ? val * 60 : val;
        }
        return updated;
      }));
    };
    recognition.start();
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-8 pb-40 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {showToast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
            <CheckCircle2 className="text-green-500" size={18} />
            <span className="font-bold text-sm">クラウドに保存しました</span>
          </div>
        )}

        <header className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg"><Calculator size={24} /></div>
            <h1 className="text-xl font-black tracking-tight">勤怠クラウド入力</h1>
          </div>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-slate-50 border-none rounded-2xl px-4 py-2 text-sm font-bold outline-none cursor-pointer" />
        </header>

        <div className="grid gap-3">
          {staffList.map((staff) => (
            <div key={staff.id} className="bg-white rounded-3xl border border-slate-200/60 p-4 shadow-sm hover:border-blue-200 transition-all">
              <div className="flex flex-col lg:flex-row items-end gap-4">
                <div className="w-full lg:w-48">
                  <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase">Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input type="text" placeholder="名前" value={staff.name} onChange={(e) => updateStaff(staff.id, 'name', e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl pl-9 pr-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Duty Hours</label>
                    <button onClick={() => startListening(staff.id)} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black transition-all ${activeListeningId === staff.id ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                      <Mic size={10} /> {activeListeningId === staff.id ? '録音中...' : '音声入力'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="time" value={staff.startTime} onChange={(e) => updateStaff(staff.id, 'startTime', e.target.value)} className="flex-1 bg-slate-50 border-none rounded-2xl p-2.5 text-sm font-black text-center focus:ring-2 focus:ring-blue-500 outline-none" />
                    <span className="text-slate-300">→</span>
                    <input type="time" value={staff.endTime} onChange={(e) => updateStaff(staff.id, 'endTime', e.target.value)} className="flex-1 bg-slate-50 border-none rounded-2xl p-2.5 text-sm font-black text-center focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div className="flex items-end gap-3 w-full lg:w-auto">
                  <div className="w-20">
                    <label className="text-[10px] font-black text-slate-400 mb-1 block text-center uppercase">Break</label>
                    <input type="number" value={staff.breakMinutes} onChange={(e) => updateStaff(staff.id, 'breakMinutes', parseInt(e.target.value) || 0)} className="w-full bg-slate-50 border-none rounded-2xl p-2.5 text-sm font-black text-center outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="flex-1 lg:w-28 bg-blue-50 rounded-2xl p-2.5 text-center">
                    <div className="text-[8px] font-black text-blue-300 uppercase mb-1">Total</div>
                    <div className="text-xl font-black text-blue-700">{calculateHours(staff).toFixed(2)}</div>
                  </div>
                  <button onClick={() => setStaffList(prev => prev.length > 1 ? prev.filter(s => s.id !== staff.id) : prev)} className="p-2.5 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex justify-between items-center shadow-2xl">
          <div className="flex items-center gap-5">
            <div className="bg-blue-500 p-4 rounded-3xl"><TrendingUp size={32} /></div>
            <div>
              <p className="text-blue-300 text-xs font-black uppercase tracking-widest mb-1">Daily Total</p>
              <h2 className="text-5xl font-black tracking-tighter">{dailyTotal.toFixed(2)} <span className="text-xl text-blue-400">h</span></h2>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button onClick={() => setStaffList(prev => [...prev, { id: Date.now().toString(), name: '', startTime: '19:00', endTime: '22:00', breakMinutes: 0 }])} className="md:col-span-1 bg-white border-2 border-dashed border-slate-300 text-slate-400 py-4 rounded-3xl font-bold flex items-center justify-center gap-2 hover:border-blue-500 transition-all"><Plus size={20} /> 追加</button>
          <button onClick={handleSave} className="md:col-span-2 bg-blue-600 text-white py-4 rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-blue-700 shadow-xl transition-all active:scale-[0.98]"><Save size={24} /> 合計を保存</button>
          <Link href="/history" className="md:col-span-1 bg-white border border-slate-200 text-slate-600 py-4 rounded-3xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-all text-sm">履歴を見る <ArrowRight size={16} /></Link>
        </div>
      </div>
    </main>
  );
}

export default function Page() { return <Suspense fallback={<div>Loading...</div>}><AttendanceContent /></Suspense>; }