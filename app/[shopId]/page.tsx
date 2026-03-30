"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Plus, Save, Calculator, History as HistoryIcon, TrendingUp, Store } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { StaffCard } from '../components/molecules/StaffCard';

function AttendanceContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const shop = params.shopId as string;
  const dateParam = searchParams.get('date');
  const [date, setDate] = useState(dateParam || new Date().toISOString().split('T')[0]);
  const [showToast, setShowToast] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);

  const shopDisplayName = shop === 'kosai' ? '湖西店' : '西駅店';

  useEffect(() => {
    const loadSavedData = async () => {
      const docRef = doc(db, "kintai", shop, "dailyData", date);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().staffList) {
        setStaffList(docSnap.data().staffList);
      } else {
        // 🔥 初期設定：ここ、絶対変えてないよ！
        setStaffList([
          { id: '1', name: '', startTime: '17:30', endTime: '20:00', breakMinutes: 0 },
          { id: '2', name: '', startTime: '19:00', endTime: '22:00', breakMinutes: 0 },
          { id: '3', name: '', startTime: '13:30', endTime: '15:30', breakMinutes: 0 },
        ]);
      }
    };
    loadSavedData();
  }, [date, shop]);

  // 音声入力の解析ロジック
  const startListening = (staffId: string, onStart: () => void, onEnd: () => void) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    
    recognition.onstart = () => onStart();
    recognition.onend = () => onEnd();

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.replace(/[０-９]/g, (s: string) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
      const times = transcript.match(/\d{1,2}/g);
      if (times && times.length >= 2) {
        const start = `${times[0].padStart(2, '0')}:${(times[1] || '00').padStart(2, '0')}`;
        let endH = times.length >= 4 ? times[2] : (times.length === 3 ? times[2] : times[1]);
        let endM = times.length >= 4 ? times[3] : '00';
        const end = `${endH.padStart(2, '0')}:${endM.padStart(2, '0')}`;
        setStaffList(prev => prev.map(s => s.id === staffId ? { ...s, startTime: start, endTime: end } : s));
      }
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

  // 🔥 修正版：保存処理（上書きチェック付き）
  const handleSave = async () => {
    try {
      const docRef = doc(db, "kintai", shop, "dailyData", date);
      const docSnap = await getDoc(docRef);

      // すでにデータがある場合は確認ダイアログを出す
      if (docSnap.exists()) {
        const confirmSave = window.confirm(
          `警告：${date} のデータは既に保存されています。上書きしてもよろしいですか？`
        );
        if (!confirmSave) return; // キャンセルなら何もしない
      }

      await setDoc(docRef, { 
        id: date, 
        date: date, 
        shop: shop, 
        totalHours: dailyTotal, 
        staffList: staffList, 
        updatedAt: Date.now() 
      });

      setShowToast(true); 
      setTimeout(() => setShowToast(false), 2000);
    } catch (error) {
      console.error("保存失敗:", error);
      alert("保存中にエラーが発生しました。");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8 pb-48">
      <div className="max-w-4xl mx-auto space-y-6">
        {showToast && <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[150] bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl">保存完了！</div>}
        
        <header className="bg-white rounded-3xl border border-slate-200 p-6 flex justify-between items-center shadow-sm">
          <div>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 leading-none">Management</p>
            <h1 className="text-2xl font-black flex items-center gap-2"><Store size={20} className="text-blue-500" />{shopDisplayName}</h1>
          </div>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => { setDate(e.target.value); router.push(`/${shop}?date=${e.target.value}`); }} 
            className="bg-slate-100 rounded-xl px-4 py-2 font-black outline-none border-none" 
          />
        </header>

        <div className="grid gap-3">
          {staffList.map((staff) => (
            <StaffCard 
              key={staff.id} 
              staff={staff} 
              onUpdate={(id, f, v) => setStaffList(prev => prev.map(s => s.id === id ? { ...s, [f]: v } : s))} 
              onDelete={() => setStaffList(prev => prev.filter(s => s.id !== staff.id))} 
              onVoiceInput={startListening} 
              calculateHours={calculateHours} 
            />
          ))}
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex justify-between items-center shadow-2xl mt-4">
          <div className="flex items-center gap-5">
            <div className="bg-blue-600 p-4 rounded-3xl"><TrendingUp size={32} /></div>
            <div>
              <p className="text-blue-300 text-[10px] font-black mb-1 uppercase tracking-widest">Total Hours</p>
              <h2 className="text-5xl font-black tabular-nums">{dailyTotal.toFixed(2)} <span className="text-xl text-blue-400 font-bold">H</span></h2>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <button onClick={() => setStaffList(prev => [...prev, { id: Date.now().toString(), name: '', startTime: '17:30', endTime: '22:00', breakMinutes: 0 }])} className="bg-white border-2 border-dashed border-slate-300 text-slate-400 py-4 rounded-[2rem] font-bold active:scale-95 transition-all flex items-center justify-center gap-2"><Plus size={20} /><span>追加</span></button>
          <button onClick={handleSave} className="md:col-span-2 bg-blue-600 text-white py-4 rounded-[2rem] font-black shadow-xl shadow-blue-100 active:scale-95 transition-all flex items-center justify-center gap-3 text-lg"><Save size={24} /><span>保存する</span></button>
          <button onClick={() => router.push(`/${shop}/history`)} className="bg-slate-100 text-slate-500 py-4 rounded-[2rem] font-bold active:scale-95 transition-all flex items-center justify-center gap-2"><HistoryIcon size={18} /><span>履歴</span></button>
        </div>
      </div>
    </main>
  );
}

export default function Page() { return <Suspense fallback={<div>Loading...</div>}><AttendanceContent /></Suspense>; }