"use client";

import React from 'react';
import { Store } from 'lucide-react';
// 🟢 先頭に「@/」をつけることで、フォルダの階層が変わっても絶対にバグらない絶対パスでインポート！
import { CardContainer } from '@/components/atoms/CardContainer';
import { CapsLabel } from '@/components/atoms/CapsLabel';

interface HeaderSectionProps {
  shopDisplayName: string;
  date: string;
  onDateChange: (val: string) => void;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({
  shopDisplayName,
  date,
  onDateChange
}) => {
  return (
    <CardContainer className="flex justify-between items-center p-6">
      <div>
        <CapsLabel color="text-blue-500" className="mb-1">
          Management
        </CapsLabel>
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Store size={20} className="text-blue-500" />
          {shopDisplayName}
        </h1>
      </div>
      <input 
        type="date" 
        value={date} 
        onChange={(e) => onDateChange(e.target.value)} 
        className="bg-slate-100 rounded-xl px-4 py-2 font-black outline-none border-none shadow-inner text-slate-700 cursor-pointer" 
      />
    </CardContainer>
  );
};