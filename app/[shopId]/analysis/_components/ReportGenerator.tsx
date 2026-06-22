"use client";

import React, { useState } from 'react';
import { Copy, ClipboardCheck } from 'lucide-react';

interface ReportGeneratorProps {
  latestDayData: {
    displayDate: string;
    salesEfficiency: number;
  };
}

export function ReportGenerator({ latestDayData }: ReportGeneratorProps) {
  const [tomorrowReservation, setTomorrowReservation] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyReport = () => {
    const reportText = `お疲れ様です。\n明日の予約は ${tomorrowReservation || '0'} 名です。\n\n人売 ${latestDayData.salesEfficiency.toLocaleString()} 円`;
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">Daily Report Machine</span>
        <h3 className="text-base font-black text-slate-800 mt-2">本日 ({latestDayData.displayDate}) のデータを大将に報告</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-3">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400">明日の予約人数を入力</label>
          <input 
            type="text"
            inputMode="numeric"
            placeholder="例: 15"
            value={tomorrowReservation}
            onChange={(e) => setTomorrowReservation(e.target.value)}
            className="w-full bg-slate-50 rounded-xl px-4 py-2.5 font-bold text-slate-800 outline-none border border-slate-200 focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-xs leading-relaxed whitespace-pre-wrap shadow-inner relative border border-slate-800">
          <span className="absolute top-2 right-2 text-[9px] font-black uppercase text-slate-600 tracking-wider">Preview</span>
          {`お疲れ様です。\n明日の予約は ${tomorrowReservation || '◯◯'} です。\n\n人売 ${latestDayData.salesEfficiency.toLocaleString()} 円`}
        </div>
      </div>
      <button 
        onClick={handleCopyReport}
        className={`w-full py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 text-sm transition-all shadow-lg active:scale-[0.98] ${copied ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
      >
        {copied ? <ClipboardCheck size={18} /> : <Copy size={18} />}
        <span>{copied ? 'コピーしました！' : '日報テキストをコピーする'}</span>
      </button>
    </div>
  );
}