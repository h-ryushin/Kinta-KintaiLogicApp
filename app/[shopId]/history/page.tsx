"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { HistoryItem } from '../../components/organisms/HistoryItem';

function HistoryContent() {
  const router = useRouter();
  const params = useParams();
  const shop = params?.shopId as string;
  const [groupedHistory, setGroupedHistory] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    if (!shop) return;
    setLoading(true);
    try {
      const historyRef = collection(db, "kintai", shop, "dailyData");
      const querySnapshot = await getDocs(historyRef);
      const rawData = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      rawData.sort((a, b) => b.id.localeCompare(a.id));
      const groups: any = {};
      rawData.forEach(item => {
        const [year, month] = item.id.split('-');
        const monthKey = `${year}年${month}月`;
        if (!groups[monthKey]) groups[monthKey] = { items: [], monthTotal: 0 };
        groups[monthKey].items.push(item);
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
      if (newSnap.exists() && !window.confirm(`${newDate} は既にあります。上書きしますか？`)) return;
      setLoading(true);
      await setDoc(newRef, { ...itemData, id: newDate, date: newDate, updatedAt: Date.now() });
      await deleteDoc(doc(db, "kintai", shop, "dailyData", oldDate));
      setTimeout(() => fetchHistory(), 500);
    } catch (e) { console.error(e); setLoading(false); }
  };

  const handleDelete = async (dateId: string) => {
    if (!window.confirm(`${dateId} を削除しますか？`)) return;
    setLoading(true);
    await deleteDoc(doc(db, "kintai", shop, "dailyData", dateId));
    setTimeout(() => fetchHistory(), 500);
  };

  useEffect(() => { fetchHistory(); }, [shop]);

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8 pb-32">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <button onClick={() => router.push(`/${shop}`)} className="p-3 bg-white rounded-2xl border active:scale-95 shadow-sm"><ArrowLeft size={20} className="text-slate-400" /></button>
          <div className="text-center"><h1 className="text-lg font-black text-slate-800 tracking-tight">履歴</h1><p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{shop === 'kosai' ? '湖西店' : '西駅店'}</p></div>
          <div className="w-11"></div>
        </header>
        {loading ? <Loader2 className="animate-spin mx-auto py-24 text-blue-500" size={32} /> : (
          Object.entries(groupedHistory).map(([month, data]: any) => (
            <section key={month} className="space-y-4">
              <div className="flex justify-between items-center px-2"><h2 className="text-xl font-black">{month}</h2><div className="bg-blue-50 px-4 py-2 rounded-2xl font-black text-blue-700 border">{data.monthTotal.toFixed(2)} H</div></div>
              <div className="grid gap-3">{data.items.map((item: any) => (
                <HistoryItem key={`${item.id}_${item.updatedAt || 0}`} item={item} onEditDate={handleEditDate} onDelete={handleDelete} onGoToDetail={() => router.push(`/${shop}?date=${item.id}`)} />
              ))}</div>
            </section>
          ))
        )}
      </div>
    </main>
  );
}

export default function Page() { return <Suspense fallback={<div>Loading...</div>}><HistoryContent /></Suspense>; }