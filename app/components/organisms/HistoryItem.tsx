"use client";
import { CalendarDays, Trash2, ChevronRight } from 'lucide-react';
import { IconButton } from '../atoms/IconButton';

export const HistoryItem = ({ item, onEditDate, onDelete, onGoToDetail }: any) => (
  <div className="bg-white rounded-[2rem] p-5 border border-slate-200 shadow-sm flex items-center justify-between hover:border-blue-200 transition-all group">
    <div className="flex items-center gap-4">
      <div className="relative bg-slate-50 p-3 rounded-2xl text-slate-400 group-hover:text-blue-500 transition-colors">
        <CalendarDays size={20} />
        <input 
          type="date" 
          className="absolute inset-0 opacity-0 cursor-pointer" 
          onChange={(e) => onEditDate(item.id, e.target.value, item)} 
        />
      </div>
      <div className="relative">
        <h3 className="font-black text-slate-700 text-[15px]">{item.id}</h3>
        <input 
          type="date" 
          className="absolute inset-0 opacity-0 cursor-pointer w-full" 
          onChange={(e) => onEditDate(item.id, e.target.value, item)} 
        />
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="text-right mr-1">
        <span className="text-2xl font-black text-slate-800 tabular-nums leading-none">{Number(item.totalHours || 0).toFixed(2)}</span>
        <span className="text-[10px] font-black opacity-20 ml-1 uppercase">hrs</span>
      </div>
      <IconButton onClick={() => onDelete(item.id)} className="text-slate-200 hover:text-red-500"><Trash2 size={18} /></IconButton>
      <IconButton onClick={onGoToDetail} className="text-slate-300 hover:text-blue-500"><ChevronRight size={22} /></IconButton>
    </div>
  </div>
);