"use client";

import React, { useState, useEffect } from 'react';
import { History, Calendar, Clock, ChevronRight, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StaffWork {
  startTime: string;
  endTime: string;
  breakMinutes: number;
}

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState<{date: string, total: string}[]>([]);
  const router = useRouter();

  const loadHistory = () => {
    const allKeys = Object.keys(localStorage)
      .filter(key => key.startsWith('kintai-'))
      .sort()
      .reverse();

    const data = allKeys.map(key => {
      const dateStr = key.replace('kintai-', '');
      try {
        const staffList: StaffWork[] = JSON.parse(localStorage.getItem(key) || '[]');
        const dayTotal = staffList.reduce((sum, staff) => {
          const start = staff.startTime.split(':').map(Number);
          let end = staff.endTime.split(':').map(Number);
          let totalMins = (end[0] * 60 + end[1]) - (start[0] * 60 + start[1]) - staff.breakMinutes;
          if (totalMins < 0) totalMins += 24 * 60; // 日またぎ計算
          const hours = totalMins > 0 ? Math.floor((totalMins / 60) * 100) / 100 : 0;
          return sum + hours;
        }, 0);
        return { date: dateStr, total: dayTotal.toFixed(2) };
      } catch (e) {
        return { date: dateStr, total: "0.00" };
      }
    });
    setHistoryData(data);
  };

  useEffect(() => { loadHistory(); }, []);

  const deleteHistory = (e: React.MouseEvent, date: string) => {
    e.stopPropagation(); // 行全体のタップイベント（編集へ移動）を阻止
    if (confirm(`${date} のデータを削除しますか？`)) {
      localStorage.removeItem(`kintai-${date}`);
      loadHistory();
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <History className="text-blue-600" /> 履歴
        </h1>

        {historyData.map((item) => (
          <div 
            key={item.date} 
            onClick={() => router.push(`/?date=${item.date}`)} // タップで入力画面へ（編集モード）
            className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex items-center justify-between hover:border-blue-400 cursor-pointer transition-all active:scale-95"
          >
            <div className="flex items-center gap-4">
              <Calendar size={18} className="text-slate-400" />
              <div>
                <p className="text-sm font-bold text-slate-800">{item.date}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Date</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-xl font-black text-blue-600">{item.total}h</span>
              </div>
              <button 
                onClick={(e) => deleteHistory(e, item.date)}
                className="p-2 text-slate-300 hover:text-red-500 rounded-lg"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}