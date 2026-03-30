"use client";

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Plus, Save, TrendingUp, Store, HelpCircle, History as HistoryIcon } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { StaffCard } from '../components/molecules/StaffCard';
import Link from 'next/link';

function AttendanceContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const shop = params.shopId as string;
  const dateParam = searchParams.get('date');
  const [date, setDate] = useState(dateParam || new Date().toISOString().split('T')[0]);
  const [showToast, setShowToast] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shopDisplayName = shop === 'kosai' ? '湖西店' : '西駅店';

  useEffect(() => {
    const loadSavedData = async () => {
      const docRef = doc(db, "kintai", shop, "dailyData", date);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().staffList) {
        setStaffList(docSnap.data().staffList);
      } else {
        setStaffList([
          { id: '1', name: '', startTime: '17:30', endTime: '20:00', breakMinutes: 0 },
          { id: '2', name: '', startTime: '19:00', endTime: '22:00', breakMinutes: 0 },
          { id: '3', name: '', startTime: '13:30', endTime: '15:30', breakMinutes: 0 },
        ]);
      }
    };
    loadSavedData();
  }, [date, shop]);

  // 🔥 精度復活版：音声入力ロジック
  const startListening = (staffId: string, onStart: () => void, onEnd: () => void) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.continuous = true;
    recognition.interimResults = false; // 👈 精度を出すために false に戻す

    const stopRecognition = () => {
      recognition.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };

    const resetTimer = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        stopRecognition(); // 3.5秒無音なら停止
      }, 3500);
    };

    recognition.onstart = () => {
      onStart();
      resetTimer();
    };

    recognition.onspeechstart = () => {
      // 喋り始めたらタイマーをリセットして粘る
      resetTimer();
    };

    recognition.onresult = (event: any) => {
      resetTimer(); // 結果が出た時もリセット
      
      const lastIndex = event.results.length - 1;
      const transcript = event.results[lastIndex][0].transcript.replace(/[０-９]/g, (s: string) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
      
      // 数字を抽出
      const times = transcript.match(/\d{1,2}/g);
      if (times && times.length >= 2) {
        const startH = times[0].padStart(2, '0');
        const startM = (times[1] && parseInt(times[1]) < 60) ? times[1].padStart(2, '0') : '00';
        
        let endH = "22", endM = "00";
        if (times.length >= 4) {
          endH = times[2].padStart(2, '0');
          endM = times[3].padStart(2, '0');
        } else if (times.length === 3) {
          endH = times[2].padStart(2, '0');
        } else if (times.length === 2) {
          endH = times[1].padStart(2, '0');
        }

        const start = `${startH}:${startM}`;
        const end = `${endH}:${endM}`;
        
        setStaffList(prev => prev.map(s => s.id === staffId ? { ...s, startTime: start, endTime: end } : s));
      }
    };

    recognition.onend = () => {
      onEnd();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };

    recognition.start();
  };

  const calculateHours = (s: any) => {
    const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    let start = toMin(s.startTime), end = toMin(s.endTime);
    if (end < start) end += 1440;
    const diff = end - start - s.breakMinutes;
    return diff > 0 ? Math.floor((diff / 60) * 100) / 100 : 0;
  };

  const dailyTotal = staffList.reduce((sum, staff) => sum + calculateHours(staff), 0);

  const handleSave = async () => {
    const docRef = doc(db, "kintai", shop, "dailyData", date);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && !window.confirm(`警告：${date} は既に保存済みです。上書きしますか？`)) return;
    await setDoc(docRef, { id: date, date, shop, totalHours: dailyTotal, staffList, updatedAt: Date.now() });
    setShowToast(true); setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans text-slate-900 overflow-x-hidden">
      <div className="max-w-4xl mx-auto space-y-6">
        {showToast && <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[150] bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl">保存完了！</div>}
        
        <header className="bg-white rounded-3xl border border-slate-200 p-6 flex justify-between items-center shadow-sm">
          <div>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 leading-none">Management</p>
            <h1 className="text-2xl font-black flex items-center gap-2"><Store size={20} className="text-blue-500" />{shopDisplayName}</h1>
          </div>
          <input type="date" value={date} onChange={(e) => { setDate(e.target.value); router.push(`/${shop}?date=${e.target.value}`); }} className="bg-slate-100 rounded-xl px-4 py-2 font-black outline-none border-none shadow-inner text-slate-700" />
        </header>

        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
          <HelpCircle size={18} className="text-slate-300" />
          <p className="text-[11px] text-slate-500 font-bold">「17時から21時」のように喋ると自動入力されます。<span className="text-slate-300 ml-2 font-normal">(3秒無音で完了)</span></p>
        </div>

        <div className="grid gap-3">
          {staffList.map((staff) => (
            <StaffCard key={staff.id} staff={staff} onUpdate={(id, f, v) => setStaffList(prev => prev.map(s => s.id === id ? { ...s, [f]: v } : s))} onDelete={() => setStaffList(prev => prev.filter(s => s.id !== staff.id))} onVoiceInput={startListening} calculateHours={calculateHours} />
          ))}
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex justify-between items-center shadow-2xl mt-4 border border-slate-800">
          <div className="flex items-center gap-5">
            <div className="bg-blue-600 p-4 rounded-3xl shadow-lg shadow-blue-500/20"><TrendingUp size={32} /></div>
            <div>
              <p className="text-blue-300 text-[10px] font-black mb-1 uppercase tracking-widest">Total Hours</p>
              <h2 className="text-5xl font-black tabular-nums">{dailyTotal.toFixed(2)} <span className="text-xl text-blue-400 font-bold">H</span></h2>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <button onClick={() => setStaffList(prev => [...prev, { id: Date.now().toString(), name: '', startTime: '17:30', endTime: '22:00', breakMinutes: 0 }])} className="bg-white border border-slate-200 text-slate-400 py-4 rounded-[2rem] font-bold active:scale-95 transition-all flex items-center justify-center gap-2"><Plus size={20} /><span>追加</span></button>
          <button onClick={handleSave} className="md:col-span-2 bg-blue-600 text-white py-4 rounded-[2rem] font-black shadow-xl shadow-blue-200 active:scale-95 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 text-lg"><Save size={24} /><span>保存する</span></button>
          <Link href={`/${shop}/history`} className="bg-slate-100 text-slate-500 py-4 rounded-[2rem] font-bold active:scale-95 transition-all flex items-center justify-center gap-2"><HistoryIcon size={18} /><span>履歴</span></Link>
        </div>

        <div className="h-40 w-full flex-shrink-0" aria-hidden="true" />
      </div>
    </main>
  );
}

export default function Page() { return <Suspense fallback={<div>Loading...</div>}><AttendanceContent /></Suspense>; }