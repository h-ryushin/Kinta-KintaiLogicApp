"use client";

import React from 'react';
import { ChevronDown } from 'lucide-react';

interface DayData {
  monthKey: string;
  salesEfficiency: number;
}

interface MonthSelectorProps {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  availableMonths: string[];
  filteredChartData: DayData[];
  monthlyAverageEfficiency: number;
}

export function MonthSelector({
  selectedMonth,
  setSelectedMonth,
  availableMonths,
  filteredChartData,
  monthlyAverageEfficiency,
}: MonthSelectorProps) {
  
  const getAverageStatus = (avg: number) => {
    if (avg === 0) return { bg: 'bg-slate-100 text-slate-500', text: 'データなし' };
    if (avg < 4800) return { bg: 'bg-rose-50 border-rose-200 text-rose-600', text: '人件費過多（要調整）' };
    if (avg > 6200) return { bg: 'bg-amber-50 border-amber-200 text-amber-600', text: '人員不足（要補充）' };
    return { bg: 'bg-emerald-50 border-emerald-200 text-emerald-600', text: '月間平均：適正ゾーン内' };
  };

  const avgStatus = getAverageStatus(monthlyAverageEfficiency);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 月の切り替えセレクトボックス */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-1">Select Month</span>
          <h3 className="text-sm font-bold text-slate-400 mb-3">表示する月を選択</h3>
        </div>
        <div className="relative">
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full bg-slate-100 rounded-2xl px-4 py-3 font-black text-slate-700 outline-none border-none appearance-none cursor-pointer pr-10"
          >
            {availableMonths.map(m => {
              const [year, month] = m.split('-');
              return <option key={m} value={m}>{year}年 {month}月</option>;
            })}
          </select>
          <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* 選択された月の平均人時売上高 */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-xl flex flex-col justify-between md:col-span-2 border border-slate-800">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-1">Monthly Average</span>
            <h3 className="text-sm font-bold text-slate-400">選択された月の平均人時売上</h3>
          </div>
          {filteredChartData.length > 0 && (
            <div className={`px-3 py-1 rounded-full text-[10px] font-black border ${avgStatus.bg}`}>
              {avgStatus.text}
            </div>
          )}
        </div>
        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-xs font-bold text-slate-500">稼働 {filteredChartData.length} 日間の平均:</span>
          <h2 className="text-4xl font-black tabular-nums tracking-tight text-blue-400">
            {monthlyAverageEfficiency.toLocaleString()} <span className="text-sm font-bold text-slate-500">円 / H</span>
          </h2>
        </div>
      </div>
    </div>
  );
}