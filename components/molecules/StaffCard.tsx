"use client";

import React, { useState, useEffect } from 'react';
import { Trash2, Mic, AlertCircle } from 'lucide-react';
import { CapsLabel } from '../atoms/CapsLabel';

interface Staff {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  role: 'alba' | 'part';
}

interface StaffCardProps {
  staff: Staff;
  index: number;
  onUpdate: (id: string, field: keyof Staff, value: any) => void;
  onDelete: (id: string) => void;
  calculateHours: (staff: Staff) => number;
  isListening: boolean;
  startListening: (id: string) => void;
}

export const StaffCard: React.FC<StaffCardProps> = ({
  staff,
  index,
  onUpdate,
  onDelete,
  calculateHours,
  isListening,
  startListening,
}) => {
  const totalHours = calculateHours(staff);

  const [localName, setLocalName] = useState(staff.name);
  const [localStart, setLocalStart] = useState(staff.startTime);
  const [localEnd, setLocalEnd] = useState(staff.endTime);
  const [localBreak, setLocalBreak] = useState(staff.breakMinutes === 0 ? "" : staff.breakMinutes.toString());

  const [startError, setStartError] = useState(false);
  const [endError, setEndError] = useState(false);

  useEffect(() => { setLocalName(staff.name); }, [staff.name]);
  useEffect(() => { setLocalStart(staff.startTime); setStartError(false); }, [staff.startTime]);
  useEffect(() => { setLocalEnd(staff.endTime); setEndError(false); }, [staff.endTime]);
  useEffect(() => { setLocalBreak(staff.breakMinutes === 0 ? "" : staff.breakMinutes.toString()); }, [staff.breakMinutes]);

  const zenToHan = (str: string): string => {
    return str.replace(/[Ａ-Ｚａ-ｚ０-９：]/g, (s) => {
      if (s === '：') return ':';
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
  };

  const formatTimeInput = (value: string): string => {
    const converted = zenToHan(value);
    const digits = converted.replace(/[^0-9]/g, '');
    if (digits.length === 4) {
      const hh = digits.substring(0, 2);
      const mm = digits.substring(2, 4);
      return `${hh}:${mm}`;
    }
    return converted;
  };

  const validateTime = (value: string): boolean => {
    if (!value) return false;
    const hasColon = value.includes(':');
    const [hh, mm] = value.split(':');
    const isValidStructure = hasColon && hh && mm && hh.length === 2 && mm.length === 2;
    if (!isValidStructure) return false;
    const hNum = Number(hh);
    const mNum = Number(mm);
    return hNum >= 0 && hNum < 24 && mNum >= 0 && mNum < 60;
  };

  return (
    <div className={`bg-white rounded-[2rem] p-5 border shadow-sm transition-all flex flex-col gap-2 relative ${isListening ? 'border-red-400 ring-2 ring-red-100 bg-red-50/5' : (startError || endError) ? 'border-rose-400 bg-rose-50/5' : 'border-slate-200 hover:border-slate-300'}`}>
      
      {/* 🟢 横並びコンテンツのコンテナ */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">
        
        {/* 👤 ① 通し番号＆名前入力枠 */}
        <div className="flex-1 min-w-[200px] space-y-1">
          <div className="flex items-center gap-2 pl-1">
            {/* 🟢 ナンバリングをカードの中にインラインで綺麗に配置！ */}
            <span className="bg-slate-100 text-slate-500 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-slate-200/60 tabular-nums shrink-0">
              {index + 1}
            </span>
            <CapsLabel>Name</CapsLabel>
          </div>
          <input
            type="text"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onFocus={() => setLocalName('')}
            onBlur={(e) => {
              const val = e.target.value.trim();
              if (val === '') {
                setLocalName(staff.name);
              } else {
                onUpdate(staff.id, 'name', val);
              }
            }}
            placeholder="スタッフ名"
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all text-sm"
          />
        </div>

        {/* 🛠️ 入力系 ＆ 結果系コンテナ */}
        <div className="flex flex-wrap items-center gap-4 flex-[2]">

          {/* ⏰ ② Time */}
          <div className="flex-1 min-w-[200px] space-y-1">
            <CapsLabel className="pl-1">Time</CapsLabel>
            <div className={`flex items-center bg-slate-50 border rounded-2xl p-1 gap-1 focus-within:bg-white transition-all ${startError || endError ? 'border-rose-400 bg-rose-50/30 focus-within:border-rose-500' : 'border-slate-100 focus-within:border-blue-400'}`}>
              <input
                type="text"
                value={localStart}
                onChange={(e) => setLocalStart(e.target.value)}
                onFocus={() => setLocalStart('')}
                onBlur={(e) => {
                  const formatted = formatTimeInput(e.target.value.trim());
                  if (validateTime(formatted)) {
                    setStartError(false);
                    setLocalStart(formatted);
                    onUpdate(staff.id, 'startTime', formatted);
                  } else {
                    setStartError(true);
                    setLocalStart(formatted);
                  }
                }}
                placeholder="17:30"
                className={`w-full bg-transparent text-center font-black text-sm focus:outline-none py-2 ${startError ? 'text-rose-600 font-bold' : 'text-slate-800'}`}
              />
              <span className="text-slate-300 font-bold text-xs select-none">~</span>
              <input
                type="numeric"
                value={localEnd}
                onChange={(e) => setLocalEnd(e.target.value)}
                onFocus={() => setLocalEnd('')}
                onBlur={(e) => {
                  const formatted = formatTimeInput(e.target.value.trim());
                  if (validateTime(formatted)) {
                    setEndError(false);
                    setLocalEnd(formatted);
                    onUpdate(staff.id, 'endTime', formatted);
                  } else {
                    setEndError(true);
                    setLocalEnd(formatted);
                  }
                }}
                placeholder="22:00"
                className={`w-full bg-transparent text-center font-black text-sm focus:outline-none py-2 ${endError ? 'text-rose-600 font-bold' : 'text-slate-800'}`}
              />
            </div>
          </div>

          {/* 🎙️ 音声入力ボタン */}
          <div className="pt-5">
            <button
              onClick={() => startListening(staff.id)}
              className={`p-3 rounded-2xl border transition-all active:scale-95 flex items-center justify-center shadow-sm ${isListening ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-200' : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'}`}
            >
              <Mic size={16} className={isListening ? 'animate-bounce' : ''} />
            </button>
          </div>

          {/* ☕ ③ Break */}
          <div className="w-24 space-y-1">
            <CapsLabel className="text-center block">Break</CapsLabel>
            <div className="relative flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-2 py-2.5 focus-within:border-blue-400 focus-within:bg-white transition-all">
              <input
                type="text"
                inputMode="numeric"
                value={localBreak}
                onChange={(e) => setLocalBreak(e.target.value.replace(/[^0-9]/g, ''))}
                onFocus={() => setLocalBreak('')}
                onBlur={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  if (val === '') {
                    setLocalBreak(staff.breakMinutes === 0 ? "" : staff.breakMinutes.toString());
                  } else {
                    onUpdate(staff.id, 'breakMinutes', Number(val));
                  }
                }}
                placeholder="0"
                className="w-full bg-transparent font-black text-center text-slate-800 outline-none text-sm pr-4"
              />
              <span className="absolute right-3 text-xs font-bold text-slate-400 select-none pointer-events-none">分</span>
            </div>
          </div>

          {/* 📊 ④ Total */}
          <div className="w-24 text-center space-y-1 bg-blue-50/40 border border-blue-100/30 rounded-2xl p-2 md:bg-transparent md:border-none md:p-0">
            <CapsLabel color="text-blue-500" className="text-center">Total</CapsLabel>
            <span className="text-xl font-black text-blue-600 tabular-nums tracking-tight block mt-1">
              {totalHours.toFixed(2)} <span className="text-[10px] font-bold text-blue-400">H</span>
            </span>
          </div>

          {/* 🗑️ ⑤ 削除ボタン */}
          <div className="flex items-center justify-center pt-4 md:pt-5 ml-auto">
            <button
              onClick={() => onDelete(staff.id)}
              className="text-slate-300 hover:text-rose-500 p-2.5 rounded-xl hover:bg-rose-50 active:scale-95 transition-all"
              title="スタッフを削除"
            >
              <Trash2 size={16} />
            </button>
          </div>

        </div>
      </div>

      {/* エラー警告メッセージ */}
      {(startError || endError) && (
        <div className="flex items-center gap-1.5 text-rose-500 font-bold text-[11px] pl-2 animate-in fade-in duration-150 pt-1">
          <AlertCircle size={14} />
          <span>不正な時刻形式です。「17:30」や「4桁の数字（1730）」で入力してください。</span>
        </div>
      )}

    </div>
  );
};