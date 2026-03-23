"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Calendar, Clock, Store, ArrowLeft, Loader2, ChevronRight, Trash2, CalendarDays } from 'lucide-react';

// --- Firebase ---
import { db } from '@/lib/firebase';
import { collection, getDocs, query, doc, deleteDoc } from 'firebase/firestore';

function HistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const shopParam = searchParams.get('shop') || 'nishieki';
  const [shop, setShop] = useState(shopParam);
  const [groupedHistory, setGroupedHistory] = useState<Record<string, { items: any[], monthTotal: number }>>({});
  const [loading, setLoading] = useState(true);

  const shopDisplayName = shop === 'nishieki' ? '西駅店' : '湖西店';

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

  // ★ 削除機能を追加
  const handleDelete = async (dateId: string) => {
    if (!confirm(`${dateId} のデータを削除してもよろしいですか？`)) return;

    try {
      const docRef = doc(db, "kintai", shop, "dailyData", dateId);
      await deleteDoc(docRef);
      // 削除後、データを再取得して画面を更新
      fetchHistory(shop);
    } catch (error) {
      console.error("削除エラー:", error);
      alert("削除に失敗しました。");
    }
  };

  useEffect(() => { fetchHistory(shop); }, [shop]);

  const handleShopChange = (newShop: string) => {
    setShop(newShop);
    router.push(`/history?shop=${newShop}`);
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 p-4 sm:p-8 pb-20">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* ヘッダー */}
        <header className="flex items-center justify-between">
          <button 
            onClick={() => router.push(`/?shop=${shop}`)}
            className="p-3 bg-white hover:bg-slate-50 rounded-2xl transition-all shadow-sm border border-slate-200"
          >
            <ArrowLeft size={20} className="text-slate-400" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-black tracking-tight text-slate-800">勤務履歴</h1>
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{shopDisplayName}</p>
          </div>
          <div className="w-11"></div>
        </header>

        {/* 店舗切り替え（カラーはブルーに統一） */}
        <div className="flex bg-slate-200/50 p-1.5 rounded-[2rem] w-full shadow-inner border border-slate-200">
          <button 
            onClick={() => handleShopChange('nishieki')} 
            className={`flex-1 py-3 rounded-[1.6rem] text-xs font-black transition-all ${shop === 'nishieki' ? 'bg-white shadow-lg text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            西駅店
          </button>
          <button 
            onClick={() => handleShopChange('kosai')} 
            className={`flex-1 py-3 rounded-[1.6rem] text-xs font-black transition-all ${shop === 'kosai' ? 'bg-white shadow-lg text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            湖西店
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <p className="text-xs font-black text-slate-400 tracking-widest">LOADING...</p>
          </div>
        ) : Object.keys(groupedHistory).length > 0 ? (
          Object.entries(groupedHistory).map(([month, data]) => (
            <section key={month} className="space-y-4">
              {/* 月の見出し */}
              <div className="flex items-end justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-blue-500 rounded-full" />
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">{month}</h2>
                </div>
                <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-2xl text-right">
                  <p className="text-[9px] font-black text-blue-400 uppercase mb-1">Monthly Total</p>
                  <p className="text-lg font-black text-blue-700 leading-none">
                    {data.monthTotal.toFixed(2)} <span className="text-[10px]">H</span>
                  </p>
                </div>
              </div>

              {/* カードリスト */}
              <div className="grid gap-3">
                {data.items.map((item) => (
                  <div 
                    key={item.id} 
                    className="group bg-white rounded-[2rem] p-5 border border-slate-200 shadow-sm flex items-center justify-between hover:border-blue-200 transition-all relative overflow-hidden"
                  >
                    <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => router.push(`/?date=${item.id}&shop=${shop}`)}>
                      <div className="bg-slate-50 p-3 rounded-[1.2rem] text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                        <CalendarDays size={20} />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-black text-slate-700">{item.id}</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                          {shopDisplayName}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-baseline gap-1 text-slate-800">
                          <span className="text-2xl font-black tracking-tighter leading-none">{Number(item.totalHours || 0).toFixed(2)}</span>
                          <span className="text-[10px] font-black opacity-40">hrs</span>
                        </div>
                      </div>
                      
                      {/* ★ 削除ボタン（ゴミ箱アイコン） */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        className="p-2 text-slate-200 hover:text-red-500 transition-colors z-20"
                        title="削除"
                      >
                        <Trash2 size={18} />
                      </button>
                      
                      <div className="p-1 cursor-pointer" onClick={() => router.push(`/?date=${item.id}&shop=${shop}`)}>
                        <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 transition-all" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="bg-white rounded-[3rem] p-20 border-2 border-dashed border-slate-200 text-center">
            <p className="text-slate-500 font-black text-lg">履歴がまだありません</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold text-blue-500">Loading...</div>}>
      <HistoryContent />
    </Suspense>
  );
}