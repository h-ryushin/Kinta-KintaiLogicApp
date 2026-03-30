"use client";

import { useParams, useRouter, usePathname } from 'next/navigation';
import { Edit3, History as HistoryIcon } from 'lucide-react';

export const BottomNav = () => {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  
  const shop = params?.shopId as string;
  if (!shop) return null;

  // 正確な判定：URLの末尾が /history なら履歴モード
  const isHistoryPage = pathname.endsWith('/history');

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl border border-slate-200 p-2 rounded-[2.5rem] shadow-2xl flex items-center gap-2 z-[100]">
      <button 
        onClick={() => router.push(`/${shop}`)} 
        className={`flex items-center gap-2 px-8 py-3.5 rounded-full transition-all duration-300 ${
          !isHistoryPage 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
            : 'text-slate-400 hover:bg-slate-50'
        }`}
      >
        <Edit3 size={18} />
        <span className="text-xs font-black uppercase tracking-widest">Entry</span>
      </button>

      <button 
        onClick={() => router.push(`/${shop}/history`)} 
        className={`flex items-center gap-2 px-8 py-3.5 rounded-full transition-all duration-300 ${
          isHistoryPage 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
            : 'text-slate-400 hover:bg-slate-50'
        }`}
      >
        <HistoryIcon size={18} />
        <span className="text-xs font-black uppercase tracking-widest">History</span>
      </button>
    </nav>
  );
};