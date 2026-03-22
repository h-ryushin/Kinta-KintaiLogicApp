"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, ArrowLeft, Trash2, History as HistoryIcon } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

interface DailySummary {
  date: string;
  totalHours: number;
}

interface MonthlyGroup {
  month: string;
  days: DailySummary[];
  monthTotal: number;
}

export default function HistoryPage() {
  const [groups, setGroups] = useState<MonthlyGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "kintai"));
      const allRecords: DailySummary[] = [];
      querySnapshot.forEach((doc) => {
        allRecords.push({ date: doc.id, totalHours: doc.data().totalHours || 0 });
      });

      // 日付を古い順 (3/1 -> 3/2)
      allRecords.sort((a, b) => a.date.localeCompare(b.date));

      const groupMap: { [key: string]: MonthlyGroup } = {};
      allRecords.forEach(record => {
        const [year, month] = record.date.split('-');
        const monthKey = `${year}/${month}`;
        if (!groupMap[monthKey]) groupMap[monthKey] = { month: monthKey, days: [], monthTotal: 0 };
        groupMap[monthKey].days.push(record);
        groupMap[monthKey].monthTotal += record.totalHours;
      });

      const sortedGroups = Object.values(groupMap).sort((a, b) => b.month.localeCompare(a.month));
      setGroups(sortedGroups);
    } catch (error) {
      console.error("履歴取得失敗:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleDelete = async (date: string) => {
    if (!confirm(`${date} のデータを削除しますか？`)) return;
    try {
      await deleteDoc(doc(db, "kintai", date));
      fetchHistory();
    } catch (error) { console.error("削除失敗:", error); }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-8 pb-40">
      <div className="max-w-xl mx-auto space-y-8">
        <header className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ArrowLeft size={20} /></Link>
            <div className="bg-slate-900 p-3 rounded-2xl text-white"><HistoryIcon size={24} /></div>
            <h1 className="text-xl font-black tracking-tight">勤務実績</h1>
          </div>
        </header>

        {loading ? (
          <div className="text-center py-20 font-black text-slate-300">読み込み中...</div>
        ) : (
          <div className="space-y-10">
            {groups.map((group) => (
              <div key={group.month} className="space-y-4">
                <div className="flex justify-between items-end px-4">
                  <h2 className="text-2xl font-black text-slate-800">{group.month.split('/')[1]}月</h2>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block">Monthly</span>
                    <span className="text-xl font-black text-blue-600">{group.monthTotal.toFixed(2)}h</span>
                  </div>
                </div>
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                  {group.days.map((day, idx) => (
                    <div key={day.date} className={`flex justify-between items-center p-5 ${idx !== group.days.length - 1 ? 'border-b border-slate-50' : ''}`}>
                      <span className="font-bold text-slate-600">{day.date.replace(/-/g, '/')}</span>
                      <div className="flex items-center gap-6">
                        <span className="text-lg font-black text-slate-800">{day.totalHours.toFixed(2)}<span className="text-xs ml-1 text-slate-400">h</span></span>
                        <button onClick={() => handleDelete(day.date)} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}