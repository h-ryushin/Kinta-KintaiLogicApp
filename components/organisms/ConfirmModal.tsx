"use client";

import React from 'react';
import { AlertTriangle, Calendar, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  show: boolean;
  title: string;
  message: string;
  type?: 'edit' | 'delete' | 'warning' | 'success' | 'info';
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({ show, title, message, type = 'edit', onCancel, onConfirm }: ConfirmModalProps) {
  if (!show) return null;

  // 💡 削除なら赤、上書き(edit)なら警告を促す「黄色」に自動で切り替える
  const isDelete = type === 'delete';
  const isEdit = type === 'edit' || type === 'warning';

  const getIconConfig = () => {
    if (isDelete) {
      return { 
        icon: <Trash2 size={28} />, 
        bg: 'bg-red-50 text-red-500 border border-red-100', 
        btnBg: 'bg-red-500 shadow-red-200 hover:bg-red-600' 
      };
    }
    if (isEdit) {
      // 🟡 上書き保存・編集のときは黄色の警告マークとボタン色にする
      return { 
        icon: <AlertTriangle size={28} />, 
        bg: 'bg-amber-50 text-amber-500 border border-amber-100', 
        btnBg: 'bg-amber-500 shadow-amber-200 hover:bg-amber-600' 
      };
    }
    return { 
      icon: <Calendar size={28} />, 
      bg: 'bg-blue-50 text-blue-500 border border-blue-100', 
      btnBg: 'bg-blue-600 shadow-blue-200 hover:bg-blue-700' 
    };
  };

  const config = getIconConfig();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100/80 flex flex-col items-center text-center">
        
        {/* 動的に警告の黄色や削除の赤に変わるアイコン枠 */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${config.bg}`}>
          {config.icon}
        </div>
        
        <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">{title}</h3>
        <p className="text-sm font-bold text-slate-400 leading-relaxed mb-8 px-2">{message}</p>
        
        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            onClick={onCancel}
            className="py-4 rounded-2xl bg-slate-100 text-slate-500 font-black active:scale-95 transition-all text-sm hover:bg-slate-200/80"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className={`py-4 rounded-2xl text-white font-black active:scale-95 transition-all shadow-lg text-sm ${config.btnBg}`}
          >
            確定する
          </button>
        </div>
      </div>
    </div>
  );
}