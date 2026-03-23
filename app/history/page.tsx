"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Calendar, Clock, Store, ArrowLeft, Loader2, ChevronRight, LayoutGrid, CalendarDays } from 'lucide-react';

// --- Firebase ---
import { db } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';

function HistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const shopParam = searchParams.get('shop') || 'nishieki';
  const [shop, setShop] = useState(shopParam);
  const [groupedHistory, setGroupedHistory] = useState<Record<string, { items: any[], monthTotal: number }>>({});
  const [loading, setLoading] = useState(true);

  // 店舗ごとのテーマカラー設定
  const isNishieki = shop === 'nishieki';
  const themeColor = isNishieki ? 'blue' : 'indigo';
  const shopDisplayName = isNishieki ? '西駅店' : '湖西店';

  const fetchHistory = async (currentShop: string) => {
    setLoading(true);
    try {
      const historyRef = collection(db, "kintai", currentShop, "dailyData");
      const querySnapshot = await getDocs(query(historyRef));
      
      const rawData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      rawData.sort((a, b) => b.id.localeCompare(a.id));

      const groups: Record<string, { items: any[], monthTotal: number }> = {};
      rawData.forEach(item => {
        const [year, month] = item.id.split('-');
        const monthKey = `${year}年${month}月`;
        
        if (!groups[monthKey]) {
          groups[monthKey] = { items: [], monthTotal: 0 };
        }
        groups[monthKey].items.push(item);
        groups[monthKey].monthTotal += Number(item.totalHours || 0);
      });

      setGroupedHistory(groups);
    } catch (error) {
      console.error("履歴取得エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(shop); }, [shop]);

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 p-4 sm:p-8 pb-20 font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* ガラスモフィズム風ヘッダー */}
        <header className="flex items-center justify-between">
          <button 
            onClick={() => router.push(`/?shop=${shop}`)}
            className="group p-3 bg-white hover:bg-slate-50 rounded-2xl transition-all shadow-sm border border-slate-200"
          >
            <ArrowLeft size={20} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-black tracking-tight text-slate-800">勤務履歴アーカイブ</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{shopDisplayName}</p>
          </div>
          <div className="w-11"></div>
        </header>

        {/* ネオモーフィズム風セグメントコントロール */}
        <div className="flex bg-slate-200/50 p-1.5 rounded-[2rem] w-full shadow-inner border border-slate-200">
          <button 
            onClick={() => { setShop('nishieki'); router.push(`/history?shop=nishieki`); }} 
            className={`flex-1 py-3 rounded-[1.6rem] text-xs font-black transition-all duration-300 ${isNishieki ? 'bg-white shadow-lg text-blue-600 scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
          >
            西駅店
          </button>
          <button 
            onClick={() => { setShop('kosai'); router.push(`/history?shop=kosai`); }} 
            className={`flex-1 py-3 rounded-[1.6rem] text-xs font-black transition-all duration-300 ${!isNishieki ? 'bg-white shadow-lg text-indigo-600 scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
          >
            湖西店
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className={`w-12 h-12 border-4 border-${themeColor}-100 border-t-${themeColor}-500 rounded-full animate-spin`} />
            <p className="text-xs font-black text-slate-400 animate-pulse tracking-widest">LOADING DATA...</p>
          </div>
        ) : Object.keys(groupedHistory).length > 0 ? (
          Object.entries(groupedHistory).map(([month, data]) => (
            <section key={month} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* 月の見出し ＆ 月合計 */}
              <div className="flex items-end justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-8 bg-${themeColor}-500 rounded-full`} />
                  <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">{month}</h2>
                    <p className="text-[10px] font-bold text-slate-400">{data.items.length} days recorded</p>
                  </div>
                </div>
                <div className={`bg-${themeColor}-50 border border-${themeColor}-100 px-4 py-2 rounded-2xl text-right`}>
                  <p className={`text-[9px] font-black text-${themeColor}-400 uppercase leading-none mb-1`}>Monthly Total</p>
                  <p className={`text-lg font-black text-${themeColor}-700 leading-none`}>
                    {data.monthTotal.toFixed(2)} <span className="text-[10px]">H</span>
                  </p>
                </div>
              </div>

              {/* カードリスト */}
              <div className="grid gap-3">
                {data.items.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => router.push(`/?date=${item.id}&shop=${shop}`)}
                    className="group bg-white rounded-[2rem] p-5 border border-slate-200 shadow-sm hover:shadow-xl hover:border-transparent hover:ring-2 hover:ring-blue-500/10 transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="bg-slate-50 p-3 rounded-[1.2rem] text-slate-400 group-hover:scale-110 transition-transform">
                          <CalendarDays size={22} />
                        </div>
                        <div>
                          <h3 className="text-[15px] font-black text-slate-700 group-hover:text-slate-900 transition-colors">{item.id}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                              <LayoutGrid size={10} /> {shopDisplayName}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-5">
                        <div className="text-right">
                          <div className="flex items-baseline gap-1 text-slate-800 group-hover:text-blue-600 transition-colors">
                            <span className="text-2xl font-black tracking-tighter leading-none">{Number(item.totalHours || 0).toFixed(2)}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">hrs</span>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                    {/* ホバー時の装飾 */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-blue-50/50 transition-colors z-0" />
                  </div>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="bg-white rounded-[3rem] p-20 border-2 border-dashed border-slate-200 text-center">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-black text-lg tracking-tight">記録が見つかりません</p>
            <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">No history found for this shop</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold">Loading...</div>}>
      <HistoryContent />
    </Suspense>
  );
}