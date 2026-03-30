"use client";

import React, { useState } from 'react'; // 👈 useState を追加
import { Trash2, Mic, User } from 'lucide-react';
import { IconButton } from '../atoms/IconButton';

// 型定義
interface StaffCardProps {
  staff: any;
  onUpdate: (id: string, field: string, value: any) => void;
  onDelete: () => void;
  onVoiceInput: (staffId: string, onStart: () => void, onEnd: () => void) => void; // 👈 コールバックを追加
  calculateHours: (staff: any) => number;
}

export const StaffCard: React.FC<StaffCardProps> = ({ 
  staff, 
  onUpdate, 
  onDelete, 
  onVoiceInput, 
  calculateHours 
}) => {
  // 👈 ローカルで「録音中」の状態を管理する
  const [isListening, setIsListening] = useState(false);

  // 音声入力ボタンを押した時の動き
  const handleVoiceButtonClick = () => {
    // 親（page.tsx）の関数を呼ぶ。その時、録音開始/終了のタイミングで状態を変えるコールバックを渡す
    onVoiceInput(
      staff.id, 
      () => setIsListening(true), // 開始時に true にする
      () => setIsListening(false) // 終了時に false にする
    );
  };

  return (
    <div className={`bg-white rounded-3xl border ${isListening ? 'border-red-400 shadow-lg shadow-red-50' : 'border-slate-200'} p-4 shadow-sm hover:border-blue-200 transition-all duration-300`}>
      <div className="flex flex-col lg:flex-row items-end gap-4">
        
        {/* 名前入力 */}
        <div className="w-full lg:w-48">
          <label className="text-[10px] font-black text-slate-400 mb-1 block">名前</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
            <input 
              type="text" 
              value={staff.name} 
              onChange={(e) => onUpdate(staff.id, 'name', e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl pl-9 pr-4 py-2.5 text-sm font-bold outline-none" 
            />
          </div>
        </div>

        {/* 勤務時間と音声入力ボタン */}
        <div className="flex-1 w-full">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-black text-slate-400">勤務時間</label>
            
            {/* 👈 録音中（isListening）で見た目を激変させるボタン */}
            <button 
              onClick={handleVoiceButtonClick} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black transition-all duration-300 active:scale-95 ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' // 録音中：赤色で点滅
                  : 'bg-slate-900 text-white hover:bg-slate-700' // 通常：黒色
              }`}
            >
              {/* 👈 録音中（isListening）でアイコンと文字を変える */}
              {isListening ? (
                <>
                  <Mic size={12} className="text-white" />
                  <span>録音中...</span>
                </>
              ) : (
                <>
                  <Mic size={12} className="text-slate-400" />
                  <span>音声入力</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input type="time" value={staff.startTime} onChange={(e) => onUpdate(staff.id, 'startTime', e.target.value)} className={`flex-1 ${isListening ? 'bg-red-50' : 'bg-slate-50'} border-none rounded-2xl p-2.5 text-sm font-black text-center transition-colors`} />
            <span className="text-slate-300">〜</span>
            <input type="time" value={staff.endTime} onChange={(e) => onUpdate(staff.id, 'endTime', e.target.value)} className={`flex-1 ${isListening ? 'bg-red-50' : 'bg-slate-50'} border-none rounded-2xl p-2.5 text-sm font-black text-center transition-colors`} />
          </div>
        </div>

        {/* 休憩と合計、削除 */}
        <div className="flex items-end gap-3 w-full lg:w-auto">
          <div className="w-20">
            <label className="text-[10px] font-black text-slate-400 mb-1 block text-center">休憩</label>
            <input type="number" value={staff.breakMinutes} onChange={(e) => onUpdate(staff.id, 'breakMinutes', parseInt(e.target.value) || 0)} className="w-full bg-slate-50 border-none rounded-2xl p-2.5 text-sm font-black text-center outline-none" />
          </div>
          <div className="flex-1 lg:w-28 bg-blue-50 rounded-2xl p-2.5 text-center border border-blue-100 font-black text-blue-700">
            {calculateHours(staff).toFixed(2)}
          </div>
          <IconButton onClick={onDelete} className="text-slate-200 hover:text-red-500"><Trash2 size={18} /></IconButton>
        </div>
      </div>
    </div>
  );
};