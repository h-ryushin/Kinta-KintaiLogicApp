import React from 'react';
import { AlertTriangle, CheckCircle2, Calendar, Trash2 } from 'lucide-react';

// 💡 画面ごとに違う「タイトル」「メッセージ」「ボタンを押した時の関数」などを仕入れる
interface ConfirmModalProps {
  show: boolean;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'edit' | 'delete';
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({ show, title, message, type, onCancel, onConfirm }: ConfirmModalProps) {
  // もし show びフラグが false だったら何も表示しない（画面から消す）
  if (!show) return null;

  // 🎨 タイプによってアイコンと背景色を自動で切り替える賢い仕組み
  const getIconConfig = () => {
    switch (type) {
      case 'delete':
        return { icon: <Trash2 size={28} />, bg: 'bg-red-50 text-red-500', btnBg: 'bg-red-500 shadow-red-200' };
      case 'warning':
        return { icon: <AlertTriangle size={28} />, bg: 'bg-amber-50 text-amber-500', btnBg: 'bg-amber-500 shadow-amber-200' };
      case 'edit':
        return { icon: <Calendar size={28} />, bg: 'bg-blue-50 text-blue-500', btnBg: 'bg-blue-600 shadow-blue-200' };
      default: // info や success
        return { icon: <CheckCircle2 size={28} />, bg: 'bg-blue-50 text-blue-500', btnBg: 'bg-blue-600 shadow-blue-200' };
    }
  };

  const config = getIconConfig();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
        
        {/* 動的に色とアイコンが変わる部分 */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${config.bg}`}>
          {config.icon}
        </div>
        
        <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
        <p className="text-sm font-bold text-slate-500 leading-relaxed mb-8">{message}</p>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="py-4 rounded-2xl bg-slate-100 text-slate-500 font-black active:scale-95 transition-all"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className={`py-4 rounded-2xl text-white font-black active:scale-95 transition-all shadow-lg ${config.btnBg}`}
          >
            確定する
          </button>
        </div>
      </div>
    </div>
  );
}