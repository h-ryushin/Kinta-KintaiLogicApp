"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Trash2, CalendarDays, ChevronRight } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';

interface HistoryItem {
  id: string; 
  date: string;
  totalHours: number;
  updatedAt: number;
}

function HistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopParam = searchParams.get('shop') || 'nishieki';
  const [shop, setShop] = useState(shopParam);
  const [groupedHistory, setGroupedHistory] = useState<Record<string, { items: HistoryItem[], monthTotal: number }>>({});
  const [loading, setLoading] = useState(true);

  const fetchHistory = async (currentShop: string) => {
    setLoading(true);
    try {
      const historyRef = collection(db, "kintai", currentShop, "dailyData");
      const querySnapshot = await getDocs(historyRef);
      const rawData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as HistoryItem[];
      
      rawData.sort((a, b) => b.id.localeCompare(a.id));
      const groups: Record<string, { items: HistoryItem[], monthTotal: number }> = {};
      rawData.forEach(item => {
        const dateId = item.id; // 👈 IDを日付として使う
        const [year, month] = dateId.split('-');
        if (!year || !month) return;
        const monthKey = `${year}年${month}月`;
        if (!groups[monthKey]) groups[monthKey] = { items: [], monthTotal: 0 };
        groups[monthKey].items.push({ ...item, date: dateId });
        groups[monthKey].monthTotal += Number(item.totalHours || 0);
      });
      setGroupedHistory(groups);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleEditDate = async (oldDate: string, newDate: string, itemData: any) => {
    if (!newDate || newDate === oldDate) return;

    try {
      const newRef = doc(db, "kintai", shop, "dailyData", newDate);
      const newSnap = await getDoc(newRef);
      if (newSnap.exists() && !window.confirm(`${newDate} のデータを上書きして移動しますか？`)) return;

      setLoading(true);
      // 1. 新しい日付で保存。このとき、中身の id と date も新しい日付に書き換える！
      await setDoc(newRef, { 
        ...itemData, 
        id: newDate,    // 👈 ここ重要！
        date: newDate,  // 👈 ここ重要！
        updatedAt: Date.now() 
      });
      
      // 2. 古い日付を削除
      await deleteDoc(doc(db, "kintai", shop, "dailyData", oldDate));
      
      // 3. 反映を待って再取得
      setTimeout(() => fetchHistory(shop), 300);
    } catch (error) { console.error(error); setLoading(false); }
  };

  const handleDelete = async (dateId: string) => {
    if (!window.confirm(`${dateId} を完全に消去しますか？`)) return;
    try {
      setLoading(true);
      await deleteDoc(doc(db, "kintai", shop, "dailyData", dateId));
      setTimeout(() => fetchHistory(shop), 300);
    } catch (error) { console.error(error); setLoading(false); }
  };

  useEffect(() => { fetchHistory(shop); }, [shop]);

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8 pb-20">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <button onClick={() => router.push(`/?shop=${shop}`)} className="p-3 bg-white rounded-2xl border active:scale-90"><ArrowLeft size={20} /></button>
          <div className="text-center"><h1 className="text-lg font-black text-slate-800">勤務履歴</h1><p className="text-[10px] font-bold text-blue-500 uppercase">{shop === 'nishieki' ? '西駅店' : '湖西店'}</p></div>
          <div className="w-11"></div>
        </header>

        <div className="flex bg-slate-200/50 p-1.5 rounded-[2rem] border">
          <button onClick={() => { setShop('nishieki'); router.push(`/history?shop=nishieki`); }} className={`flex-1 py-3 rounded-[1.6rem] text-xs font-black transition-all ${shop === 'nishieki' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>西駅店</button>
          <button onClick={() => { setShop('kosai'); router.push(`/history?shop=kosai`); }} className={`flex-1 py-3 rounded-[1.6rem] text-xs font-black transition-all ${shop === 'kosai' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>湖西店</button>
        </div>

        {loading ? <Loader2 className="animate-spin mx-auto py-24 text-blue-500" size={32} /> : (
          Object.entries(groupedHistory).map(([month, data]) => (
            <section key={month} className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <h2 className="text-xl font-black text-slate-800">{month}</h2>
                <div className="bg-blue-50 px-4 py-2 rounded-2xl text-lg font-black text-blue-700">{data.monthTotal.toFixed(2)} H</div>
              </div>
              <div className="grid gap-3">
                {data.items.map((item) => (
                  <div key={`${item.id}_${item.updatedAt}`} className="bg-white rounded-[2rem] p-5 border flex items-center justify-between shadow-sm hover:border-blue-200 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="relative bg-slate-50 p-3 rounded-2xl text-slate-400">
                        <CalendarDays size={20} />
                        <input type="date" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleEditDate(item.id, e.target.value, item)} />
                      </div>
                      <h3 className="font-black text-slate-700 text-[15px] cursor-pointer relative">
                        {item.id}
                        <input type="date" className="absolute inset-0 opacity-0 cursor-pointer w-full" onChange={(e) => handleEditDate(item.id, e.target.value, item)} />
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right mr-1">
                        <span className="text-2xl font-black text-slate-800">{item.totalHours.toFixed(2)}</span>
                        <span className="text-[10px] font-black opacity-30 ml-1">HRS</span>
                      </div>
                      <button onClick={() => handleDelete(item.id)} className="text-slate-200 hover:text-red-500 p-2"><Trash2 size={18} /></button>
                      <button onClick={() => router.push(`/?date=${item.id}&shop=${shop}`)} className="text-slate-300 hover:text-blue-500 p-1"><ChevronRight size={22} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </main>
  );
}

export default function HistoryPage() { return <Suspense fallback={<div>Loading...</div>}><HistoryContent /></Suspense>; }