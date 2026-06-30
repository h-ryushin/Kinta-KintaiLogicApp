"use client";

import React from 'react';
import { CalendarDays, Trash2, ChevronRight } from 'lucide-react';
import { IconButton } from '../../../../components/atoms/IconButton'; // 既存のパスに合わせてね

interface HistoryItemProps {
  item: any;
  onEditDate: (oldDate: string, newDate: string, itemData: any) => void;
  onDelete: (dateId: string) => void;
  onGoToDetail: () => void;
}

export const HistoryItem = ({ item, onEditDate, onDelete, onGoToDetail }: HistoryItemProps) => (
  <div className="bg-white rounded-[2rem] p-5 border border-slate-200 shadow-sm flex items-center justify-between hover:border-blue-200 transition-all group">
    <div className="flex items-center gap-4">
      {/* 左側のカレンダーアイコン（タップで日付編集が走る透明input入り） */}
      <div className="relative bg-slate-50 p-3 rounded-2xl text-slate-400 group-hover:text-blue-500 transition-colors">
        <CalendarDays size={20} />
        <input
          type="date"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={(e) => onEditDate(item.id, e.target.value, item)}
        />
      </div>
      {/* 日付のテキスト（ここをタップしても日付編集ができる） */}
      <div className="relative">
        <h3 className="font-black text-slate-700 text-[15px]">{item.id}</h3>
        <input
          type="date"
          className="absolute inset-0 opacity-0 cursor-pointer w-full"
          onChange={(e) => onEditDate(item.id, e.target.value, item)}
        />
      </div>
    </div>
    
    {/* 右側の時間表示 ＆ アクションボタン群 */}
    <div className="flex items-center gap-3">
      <div className="text-right mr-1">
        <span className="text-2xl font-black text-slate-800 tabular-nums leading-none">
          {Number(item.totalHours || 0).toFixed(2)}
        </span>
        <span className="text-[10px] font-black opacity-20 ml-1 uppercase">hrs</span>
      </div>
      <IconButton onClick={() => onDelete(item.id)} className="text-slate-200 hover:text-red-500">
        <Trash2 size={18} />
      </IconButton>
      <IconButton onClick={onGoToDetail} className="text-slate-300 hover:text-blue-500">
        <ChevronRight size={22} />
      </IconButton>
    </div>
  </div>
);