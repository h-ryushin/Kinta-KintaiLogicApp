"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Calendar, Clock, Store, ArrowLeft, Loader2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// --- Firebase ---
import { db } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';

function HistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URLから表示する店舗を取得（デフォルトは西駅店）
  const shopParam = searchParams.get('shop') || 'nishieki';
  const [shop, setShop] = useState(shopParam);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const shopDisplayName = shop === 'nishieki' ? '西駅店' : '湖西店';

  // データを取得する関数
  const fetchHistory = async (currentShop: string) => {
    setLoading(true);
    try {
      // kintai > [店舗名] > dailyData コレクションを取得
      const historyRef = collection(db, "kintai", currentShop, "dailyData");
      const querySnapshot = await getDocs(query(historyRef));
      
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id, // 日付 (YYYY-MM-DD)
        ...doc.data()
      }));

      // 日付の新しい順に並び替え
      data.sort((a, b) => b.id.localeCompare(a.id));
      setHistoryData(data);
    } catch (error) {
      console.error("履歴取得エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(shop);
  }, [shop]);

  const handleShopChange = (newShop: string) => {
    setShop(newShop);
    router.push(`/history?shop=${newShop}`);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-8 pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* ヘッダー */}
        <header className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.push(`/?shop=${shop}`)}
            className="p-2 hover:bg-white rounded-2xl transition-all text-slate-400 hover:text-blue-600 shadow-sm border border-transparent hover:border-slate-200"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
            <Calendar className="text-blue-600" size={20} /> 勤務履歴
          </h1>
          <div className="w-10"></div>
        </header>

        {/* 店舗切り替えタブ */}
        <div className="flex bg-slate-200 p-1 rounded-2xl w-full shadow-inner mb-8">
          <button 
            onClick={() => handleShopChange('nishieki')} 
            className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${shop === 'nishieki' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            西駅店
          </button>
          <button 
            onClick={() => handleShopChange('kosai')} 
            className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${shop === 'kosai' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            湖西店
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end px-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {shopDisplayName} の保存済みデータ
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <Loader2 className="animate-spin" size={32} />
              <p className="text-sm font-bold tracking-tighter">読み込み中...</p>
            </div>
          ) : historyData.length > 0 ? (
            historyData.map((item) => (
              <div key={item.id} className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm hover:border-blue-300 transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-50 p-3 rounded-2xl text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800 tracking-tight">{item.id}</h3>
                      <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase">
                        <Store size={10} /> {shopDisplayName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-1 text-blue-600 justify-end">
                        <span className="text-3xl font-black tracking-tighter">{Number(item.totalHours || 0).toFixed(2)}</span>
                        <span className="text-[10px] font-black mt-2">H</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => router.push(`/?date=${item.id}&shop=${shop}`)}
                      className="p-2 text-slate-300 hover:text-blue-500 transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-[2.5rem] p-16 border-2 border-dashed border-slate-200 text-center">
              <p className="text-slate-400 font-bold text-sm">履歴がまだありません</p>
              <button 
                onClick={() => router.push(`/?shop=${shop}`)}
                className="mt-4 text-xs font-black text-blue-500 hover:underline"
              >
                最初のデータを入力する
              </button>
            </div>
          )}
        </div>
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