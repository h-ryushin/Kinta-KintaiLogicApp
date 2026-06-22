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
  // 組数と人数のState
  const [tomorrowGroups, setTomorrowGroups] = useState<string>('');
  const [tomorrowPeople, setTomorrowPeople] = useState<string>('');
  
  const [copied, setCopied] = useState<boolean>(false);

  // 🟢 全角数字を半角数字に変換するコンバーター
  const zenToHanDigits = (str: string): string => {
    return str.replace(/[０-９]/g, (s) => {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
  };

  // 組数が「0」の時は「ありません」の文章を自動生成
  const generateReportText = () => {
    const baseText = `お疲れ様です。`;
    const efficiencyText = `\n\n人売 ${latestDayData.salesEfficiency.toLocaleString()} 円`;
    
    if (tomorrowGroups === '0') {
      return `${baseText}\n明日の予約はありません。${efficiencyText}`;
    } else {
      const groups = tomorrowGroups || '◯';
      const people = tomorrowPeople || '◯';
      return `${baseText}\n明日の予約は ${groups}組 ${people}名 です。${efficiencyText}`;
    }
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(generateReportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">Daily Report Machine</span>
        <h3 className="text-base font-black text-slate-800 mt-2">本日 ({latestDayData.displayDate}) のデータの報告</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-3">
        
        {/* 入力エリア */}
        <div className="grid grid-cols-2 gap-2 flex items-center">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400">明日の予約組数</label>
            <div className="relative flex items-center">
              <input 
                type="text"
                inputMode="numeric"
                placeholder="例: 3"
                value={tomorrowGroups}
                // 🟢 入力中は全角数字も受け付けるように制限を緩める（数字・全角数字以外を排除）
                onChange={(e) => setTomorrowGroups(e.target.value.replace(/[^0-9０-９]/g, ''))}
                // 🟢 入力が終わってフォーカスが外れた瞬間に全角を半角にピシッと変換！
                onBlur={(e) => {
                  const cleaned = zenToHanDigits(e.target.value);
                  setTomorrowGroups(cleaned);
                }}
                className="w-full bg-slate-50 rounded-xl pl-4 pr-8 py-2.5 font-bold text-slate-800 outline-none border border-slate-200 focus:border-blue-500 transition-colors text-sm"
              />
              <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">組</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400">明日の予約人数</label>
            <div className="relative flex items-center">
              <input 
                type="text"
                inputMode="numeric"
                placeholder="例: 12"
                value={tomorrowPeople}
                disabled={tomorrowGroups === '0'} 
                // 🟢 人数側も入力中は全角数字を許可
                onChange={(e) => setTomorrowPeople(e.target.value.replace(/[^0-9０-９]/g, ''))}
                // 🟢 フォーカスアウト時に半角へ美しくクレンジング
                onBlur={(e) => {
                  const cleaned = zenToHanDigits(e.target.value);
                  setTomorrowPeople(cleaned);
                }}
                className={`w-full rounded-xl pl-4 pr-8 py-2.5 font-bold outline-none border transition-colors text-sm ${tomorrowGroups === '0' ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-slate-50 text-slate-800 border-slate-200 focus:border-blue-500'}`}
              />
              <span className="absolute right-3 text-xs font-bold text-slate-400 pointer-events-none">名</span>
            </div>
          </div>
        </div>

        {/* プレビュー画面 */}
        <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs leading-relaxed whitespace-pre-wrap shadow-inner relative border border-slate-800 min-h-[90px] flex items-center">
          <span className="absolute top-2 right-2 text-[9px] font-black uppercase text-slate-600 tracking-wider">Preview</span>
          <div className="w-full">{generateReportText()}</div>
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