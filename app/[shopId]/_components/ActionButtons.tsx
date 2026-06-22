"use client";

import React from 'react';
import { Plus, Save, History as HistoryIcon } from 'lucide-react';
import Link from 'next/link';

interface ActionButtonsProps {
  shop: string;
  setStaffList: React.Dispatch<React.SetStateAction<any[]>>;
  onSave: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  shop,
  setStaffList,
  onSave
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-8">
      {/* 🟢 バイト追加ボタン */}
      <button
        onClick={() => setStaffList(prev => [...prev, { id: Date.now().toString(), name: '', startTime: '18:00', endTime: '21:00', breakMinutes: 0, role: 'alba' }])}
        className="bg-white border border-slate-200 text-slate-500 py-4 rounded-[2rem] font-bold active:scale-95 transition-all flex items-center justify-center gap-2 text-sm hover:bg-slate-50"
      >
        <Plus size={16} /><span>バイト追加</span>
      </button>

      {/* 🟢 パート追加ボタン */}
      <button
        onClick={() => setStaffList(prev => [...prev, { id: Date.now().toString(), name: '', startTime: '13:30', endTime: '15:30', breakMinutes: 0, role: 'part' }])}
        className="bg-white border border-orange-200 text-orange-600 py-4 rounded-[2rem] font-bold active:scale-95 transition-all flex items-center justify-center gap-2 text-sm hover:bg-orange-50/50"
      >
        <Plus size={16} /><span>パート追加</span>
      </button>

      {/* 🔵 保存するボタン */}
      <button 
        onClick={onSave} 
        className="md:col-span-2 bg-blue-600 text-white py-4 rounded-[2rem] font-black shadow-xl shadow-blue-200 active:scale-95 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 text-lg"
      >
        <Save size={24} /><span>保存する</span>
      </button>

      {/* ⚪ 履歴ボタン */}
      <Link 
        href={`/${shop}/history`} 
        className="bg-slate-100 text-slate-500 py-4 rounded-[2rem] font-bold active:scale-95 transition-all flex items-center justify-center gap-2 text-sm hover:bg-slate-200"
      >
        <HistoryIcon size={16} /><span>履歴</span>
      </Link>
    </div>
  );
};