"use client";

import React, { useState, useEffect } from 'react';
import { CircleDollarSign } from 'lucide-react';
import { CardContainer } from '@/components/atoms/CardContainer';
import { CapsLabel } from '@/components/atoms/CapsLabel';

interface SalesDashboardProps {
  sales: number;
  onSalesChange: (val: number) => void;
  salesEfficiency: number;
}

export const SalesDashboard: React.FC<SalesDashboardProps> = ({
  sales = 0,
  onSalesChange,
  salesEfficiency = 0,
}) => {
  // salesが0の時は空文字、そうじゃない時は現在の売上を表示
  const [inputValue, setInputValue] = useState<string>(sales === 0 ? "" : sales.toString());

  useEffect(() => {
    setInputValue(sales === 0 ? "" : sales.toString());
  }, [sales]);

  const safeSalesEfficiency = Number(salesEfficiency) || 0;

  // 全角➔半角数字変換コンバーター
  const zenToHan = (str: string): string => {
    return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      
      {/* 💰 左側：今日の売上入力 */}
      {/* 🟢 修正：h-[140px] を追加して高さを固定 */}
      <CardContainer className="flex flex-col justify-between h-[140px]">
        <div>
          <CapsLabel color="text-emerald-500" className="mb-1">Today's Sales</CapsLabel>
          <h3 className="text-sm font-bold text-slate-400">今日の売上高</h3>
        </div>
        <div className="my-2 relative flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 focus-within:border-emerald-500 focus-within:bg-white transition-all">
          <input
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => {
              if (sales === 0) setInputValue('');
            }}
            onBlur={(e) => {
              const converted = zenToHan(e.target.value);
              const cleanNumStr = converted.replace(/\D/g, '');
              
              if (cleanNumStr === '') {
                setInputValue(sales === 0 ? "" : sales.toString());
              } else {
                setInputValue(cleanNumStr);
                onSalesChange(Number(cleanNumStr));
              }
            }}
            placeholder="例: 300000"
            className="w-full bg-transparent font-black text-left text-2xl text-slate-800 outline-none tracking-tight pr-8"
          />
          <span className="text-sm font-bold text-slate-400 absolute right-4 pointer-events-none">円</span>
        </div>
      </CardContainer>

      {/* 📊 右側：人時売上高 */}
      {/* 🟢 修正：ベタ書きされていた不要なスタイル指定を削除し、左側と完全に揃えた CardContainer に統合！ */}
      <CardContainer className="flex flex-col justify-between h-[140px] relative">
        <div className="flex justify-between items-start">
          <div>
            <CapsLabel color="text-blue-500" className="mb-1">Productivity</CapsLabel>
            <h3 className="text-sm font-bold text-slate-400">現在の人時売上高</h3>
          </div>
          <CircleDollarSign size={20} className="text-blue-400" />
        </div>
        
        {/* 🟢 修正：数字のフォント色をパッと明るい「text-blue-600」にして下部をスッキリ整列 */}
        <div className="pb-1 flex items-baseline gap-1">
          <span className="text-4xl font-black text-blue-600 tabular-nums tracking-tight">
            {safeSalesEfficiency.toLocaleString()}
          </span>
          <span className="text-xs font-black text-blue-400 select-none">
            円 / H
          </span>
        </div>
      </CardContainer>

    </div>
  );
};