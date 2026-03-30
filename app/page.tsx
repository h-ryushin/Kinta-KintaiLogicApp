"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Trash2, Save, Calculator, CheckCircle2, ArrowRight, Mic, User, TrendingUp, ChevronLeft, ChevronRight, Store } from 'lucide-react';
import Link from 'next/link';

// --- Firebase ---
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface StaffWork {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
}

function AttendanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const dateParam = searchParams.get('date');
  const shopParam = searchParams.get('shop') || 'nishieki'; 
  
  const [date, setDate] = useState(dateParam || new Date().toISOString().split('T')[0]);
  const [shop, setShop] = useState(shopParam);
  const [showToast, setShowToast] = useState(false);
  const [staffList, setStaffList] = useState<StaffWork[]>([]);

  const shopDisplayName = shop === 'nishieki' ? '西駅店' : '湖西店';

  useEffect(() => {
    const loadSavedData = async () => {
      const docRef = doc(db, "kintai", shop, "dailyData", date);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists() && docSnap.data().staffList) {
        setStaffList(docSnap.data().staffList);
      } else {
        setStaffList([
          { id: '1', name: '', startTime: '17:30', endTime: '20:00', breakMinutes: 0 },
          { id: '2', name: '', startTime: '19:00', endTime: '22:00', breakMinutes: 0 }
        ]);
      }
    };
    loadSavedData();
  }, [date, shop]);

  const updateURL = (newDate: string, newShop: string) => {
    router.push(`/?date=${newDate}&shop=${newShop}`);
  };

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
      const docRef = doc(db, "kintai", shop, "dailyData", date);
      await setDoc(docRef, { 
        id: date,      // 👈 ここ！中身のIDも今の日付にする
        date: date,    // 👈 日付フィールドも今の日付にする
        shop: shop,
        totalHours: dailyTotal, 
        staffList: staffList,
        updatedAt: Date.now() 
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (error) { console.error(error); }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8 pb-40">
      <div className="max-w-4xl mx-auto space-y-6">
        {showToast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-full animate-in fade-in">保存完了！</div>
        )}
        <header className="bg-white rounded-3xl border p-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl text-white"><Calculator size={24} /></div>
            <h1 className="text-xl font-black">勤怠計算</h1>
          </div>
          <input type="date" value={date} onChange={(e) => { setDate(e.target.value); updateURL(e.target.value, shop); }} className="bg-slate-100 rounded-xl px-4 py-1.5 font-black outline-none" />
        </header>

        <div className="flex bg-slate-200 p-1 rounded-2xl w-full max-w-[300px] mx-auto mb-6 shadow-inner">
          <button onClick={() => { setShop('nishieki'); updateURL(date, 'nishieki'); }} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${shop === 'nishieki' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500'}`}>西駅店</button>
          <button onClick={() => { setShop('kosai'); updateURL(date, 'kosai'); }} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${shop === 'kosai' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500'}`}>湖西店</button>
        </div>

        <div className="grid gap-3">
          {staffList.map((staff) => (
            <div key={staff.id} className="bg-white rounded-3xl border p-4 shadow-sm">
              <div className="flex flex-col lg:flex-row items-end gap-4">
                <div className="w-full lg:w-48"><label className="text-[10px] font-black text-slate-400 mb-1 block">名前</label><input type="text" value={staff.name} onChange={(e) => setStaffList(prev => prev.map(s => s.id === staff.id ? { ...s, name: e.target.value } : s))} className="w-full bg-slate-50 rounded-2xl px-4 py-2 text-sm font-bold outline-none" /></div>
                <div className="flex-1 w-full flex items-center gap-2">
                  <input type="time" value={staff.startTime} onChange={(e) => setStaffList(prev => prev.map(s => s.id === staff.id ? { ...s, startTime: e.target.value } : s))} className="flex-1 bg-slate-50 rounded-2xl p-2.5 text-sm font-black text-center" />
                  <span>〜</span>
                  <input type="time" value={staff.endTime} onChange={(e) => setStaffList(prev => prev.map(s => s.id === staff.id ? { ...s, endTime: e.target.value } : s))} className="flex-1 bg-slate-50 rounded-2xl p-2.5 text-sm font-black text-center" />
                </div>
                <div className="flex items-end gap-3 w-full lg:w-auto">
                  <div className="w-20"><label className="text-[10px] font-black text-slate-400 mb-1 block text-center">休憩</label><input type="number" value={staff.breakMinutes} onChange={(e) => setStaffList(prev => prev.map(s => s.id === staff.id ? { ...s, breakMinutes: parseInt(e.target.value) || 0 } : s))} className="w-full bg-slate-50 rounded-2xl p-2.5 text-sm font-black text-center outline-none" /></div>
                  <div className="flex-1 lg:w-28 bg-blue-50 rounded-2xl p-2.5 text-center border border-blue-100 font-black text-blue-700">{calculateHours(staff).toFixed(2)}</div>
                  <button onClick={() => setStaffList(prev => prev.length > 1 ? prev.filter(s => s.id !== staff.id) : prev)} className="p-2.5 text-slate-200 hover:text-red-500"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex justify-between items-center shadow-2xl mt-4">
          <div className="flex items-center gap-5">
            <div className="bg-blue-500 p-4 rounded-3xl"><TrendingUp size={32} /></div>
            <div><p className="text-blue-300 text-[10px] font-black uppercase mb-1">合計時間</p><h2 className="text-5xl font-black">{dailyTotal.toFixed(2)} <span className="text-xl">H</span></h2></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button onClick={() => setStaffList(prev => [...prev, { id: Date.now().toString(), name: '', startTime: '19:00', endTime: '22:00', breakMinutes: 0 }])} className="md:col-span-1 bg-white border-2 border-dashed border-slate-300 text-slate-400 py-4 rounded-3xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"><Plus size={20} /> 追加</button>
          <button onClick={handleSave} className="md:col-span-2 bg-blue-600 text-white py-4 rounded-3xl font-black shadow-xl active:scale-95"><Save size={24} /> 保存</button>
          <Link href={`/history?shop=${shop}`} className="md:col-span-1 bg-white border text-slate-600 py-4 rounded-3xl font-bold flex items-center justify-center gap-2 text-sm active:scale-95">履歴へ <ArrowRight size={16} /></Link>
        </div>
      </div>
    </main>
  );
}

export default function Page() { return <Suspense fallback={<div>Loading...</div>}><AttendanceContent /></Suspense>; }