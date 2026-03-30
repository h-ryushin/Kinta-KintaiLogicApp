"use client";

import React, { useState } from 'react';
import { Trash2, Mic, User, Calculator } from 'lucide-react'; // 👈 Calculator を追加
import { IconButton } from '../atoms/IconButton';

interface StaffCardProps {
  staff: any;
  onUpdate: (id: string, field: string, value: any) => void;
  onDelete: () => void;
  onVoiceInput: (staffId: string, onStart: () => void, onEnd: () => void) => void;
  calculateHours: (staff: any) => number;
}

export const StaffCard: React.FC<StaffCardProps> = ({ 
  staff, 
  onUpdate, 
  onDelete, 
  onVoiceInput, 
  calculateHours 
}) => {
  const [isListening, setIsListening] = useState(false);

  const handleVoiceButtonClick = () => {
    onVoiceInput(
      staff.id, 
      () => setIsListening(true),
      () => setIsListening(false)
    );
  };

  const hours = calculateHours(staff);

  return (
    <div className={`bg-white rounded-3xl border ${isListening ? 'border-red-400 shadow-lg shadow-red-50' : 'border-slate-200'} p-4 shadow-sm hover:border-blue-200 transition-all duration-300`}>
      <div className="flex flex-col lg:flex-row items-end gap-4">
        
        {/* 名前入力エリア */}
        <div className="w-full lg:w-48">
          <label className="text-[10px] font-black text-slate-400 mb-1 block leading-none tracking-widest">NAME</label>
          <div className="relative mt-1">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
            <input 
              type="text" 
              value={staff.name} 
              onChange={(e) => onUpdate(staff.id, 'name', e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl pl-9 pr-4 py-2.5 text-sm font-bold outline-none placeholder:text-slate-200" 
              placeholder="スタッフ名"
            />
          </div>
        </div>

        {/* 勤務時間 & 音声入力エリア */}
        <div className="flex-1 w-full">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-black text-slate-400 leading-none tracking-widest">TIME</label>
            <button 
              onClick={handleVoiceButtonClick} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-all duration-300 active:scale-95 ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-slate-900 text-white hover:bg-slate-700'
              }`}
            >
              <Mic size={12} className={isListening ? "text-white" : "text-slate-400"} />
              <span>{isListening ? '録音中...' : '音声入力'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <input type="time" value={staff.startTime} onChange={(e) => onUpdate(staff.id, 'startTime', e.target.value)} className={`flex-1 ${isListening ? 'bg-red-50 text-red-600' : 'bg-slate-50'} border-none rounded-2xl p-2.5 text-sm font-black text-center transition-colors outline-none`} />
            <span className="text-slate-300 font-bold">~</span>
            <input type="time" value={staff.endTime} onChange={(e) => onUpdate(staff.id, 'endTime', e.target.value)} className={`flex-1 ${isListening ? 'bg-red-50 text-red-600' : 'bg-slate-50'} border-none rounded-2xl p-2.5 text-sm font-black text-center transition-colors outline-none`} />
          </div>
        </div>

        {/* 休憩・合計・削除エリア */}
        <div className="flex items-end gap-3 w-full lg:w-auto">
          {/* 休憩時間の修正 */}
          <div className="w-20">
            <label className="text-[10px] font-black text-slate-400 mb-1 block text-center leading-none tracking-widest">BREAK</label>
            <input 
              type="number" 
              value={staff.breakMinutes === 0 ? "0" : Number(staff.breakMinutes).toString()}
              inputMode="numeric"
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                onUpdate(staff.id, 'breakMinutes', val);
              }}
              className="w-full bg-slate-50 border-none rounded-2xl p-2.5 text-sm font-black text-center mt-1 outline-none appearance-none" 
            />
          </div>

          {/* 👈 ダサい「計」を爆速修正した合計表示 */}
          <div className="flex items-center gap-3 bg-blue-50/50 rounded-2xl px-5 py-2 border border-blue-100/50 shadow-inner shadow-blue-100/30 min-w-[120px]">
            {/* 数字をガツンと大きく */}
            <div className="text-right flex-1">
              <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">TOTAL</p>
              <span className="text-3xl font-black text-blue-700 tabular-nums leading-none">
                {hours.toFixed(2)}
              </span>
              <span className="text-xs font-black text-blue-400 ml-0.5">H</span>
            </div>
          </div>

          {/* 削除ボタン */}
          <IconButton onClick={onDelete} className="text-slate-200 hover:text-red-500 bg-slate-50 hover:bg-red-50 transition-all rounded-xl p-2 mt-1">
            <Trash2 size={18} />
          </IconButton>
        </div>
      </div>
    </div>
  );
};