"use client";

import React from 'react';
import { TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface SalesChartProps {
  selectedMonth: string;
  filteredChartData: any[];
}

export function SalesChart({ selectedMonth, filteredChartData }: SalesChartProps) {
  const currentMonthDisplay = selectedMonth ? selectedMonth.split('-')[1] : '';

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
      <div>
        <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
          <TrendingUp size={20} className="text-blue-500" />人時売上高の推移 ({currentMonthDisplay}月分)
        </h2>
        <p className="text-[11px] text-slate-400 font-bold">破線の間（4,800円〜6,200円）が適正ゾーンです</p>
      </div>

      <div className="w-full h-72 sm:h-80 pr-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} domain={[2000, 'auto']} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderRadius: '1rem', border: 'none', color: '#fff' }}
              labelStyle={{ fontWeight: 'bold', fontSize: '12px', color: '#38bdf8' }}
              formatter={(value: any) => [`${value.toLocaleString()} 円`, '人時売上']}
            />
            <ReferenceLine y={5500} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '下限 5,500円', fill: '#ef4444', fontSize: 10, fontWeight: 'bold', position: 'insideBottomLeft' }} />
            <ReferenceLine y={6500} stroke="#10b981" strokeDasharray="4 4" label={{ value: '上限 6,500円', fill: '#10b981', fontSize: 10, fontWeight: 'bold', position: 'insideTopLeft' }} />
            <ReferenceLine y={8000} stroke="#10b981" strokeDasharray="4 4" label={{ value: '上限 8,000円', fill: '#10b981', fontSize: 10, fontWeight: 'bold', position: 'insideTopLeft' }} />
            
            {/* 🛠️ 【直線化】type="monotone" から type="linear" に変更して曲げないように固定！ */}
            <Line 
              type="linear"
              dataKey="salesEfficiency" 
              stroke="#2563eb" 
              strokeWidth={3} 
              dot={{ r: 5, strokeWidth: 2, fill: '#fff' }} 
              activeDot={{ r: 7, style: { fill: '#2563eb' } }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}