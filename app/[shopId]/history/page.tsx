"use client";

import React, { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, Calendar, Trash2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { HistoryItem } from '../../components/organisms/HistoryItem';

function HistoryContent() {
  const router = useRouter();
  const params = useParams();
  const shop = params?.shopId as string;
  const [groupedHistory, setGroupedHistory] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  
  // 🔥 ポップアップの状態管理
  const [modal, setModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'edit' | 'delete';
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'edit'
  });

  const fetchHistory = useCallback(async () => {
    if (!shop) return;
    setLoading(true);
    try {
      const historyRef = collection(db, "kintai", shop, "dailyData");
      const querySnapshot = await getDocs(historyRef);
      const rawData = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      rawData.sort((a, b) => b.id.localeCompare(a.id));
      const groups: any = {};
      rawData.forEach(item => {
        if (!item.id || !item.id.includes('-')) return;
        const [year, month] = item.id.split('-');
        const monthKey = `${year}年${month}月`;
        if (!groups[monthKey]) groups[monthKey] = { items: [], monthTotal: 0 };
        groups[monthKey].items.push(item);
        groups[monthKey].monthTotal += Number(item.totalHours || 0);
      });
      setGroupedHistory(groups);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [shop]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // 日付変更の処理（ポップアップから呼ばれる）
  const executeEditDate = async (oldDate: string, newDate: string, itemData: any) => {
    try {
      setLoading(true);
      const newRef = doc(db, "kintai", shop, "dailyData", newDate);
      await setDoc(newRef, { ...itemData, id: newDate, date: newDate, updatedAt: Date.now() });
      await deleteDoc(doc(db, "kintai", shop, "dailyData", oldDate));
      await fetchHistory();
    } catch (e) {
      alert("変更に失敗しました。");
    } finally {
      setLoading(false);
      setModal(prev => ({ ...prev, show: false }));
    }
  };

  const handleEditDate = (oldDate: string, newDate: string, itemData: any) => {
    if (!newDate || newDate === oldDate) return;
    
    // 🔥 ここでポップアップの内容をカスタマイズ！
    setModal({
      show: true,
      title: "日付を変更しますか？",
      message: `${oldDate} のデータを ${newDate} に移動します。よろしいですか？`,
      type: 'edit',
      onConfirm: () => executeEditDate(oldDate, newDate, itemData)
    });
  };

  const handleDelete = (dateId: string) => {
    // 🔥 削除時のメッセージもカスタマイズ！
    setModal({
      show: true,
      title: "データを削除しますか？",
      message: `${dateId} の勤務記録を完全に削除します。この操作は取り消せません。`,
      type: 'delete',
      onConfirm: async () => {
        setLoading(true);
        await deleteDoc(doc(db, "kintai", shop, "dailyData", dateId));
        await fetchHistory();
        setModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8 font-sans overflow-x-hidden relative">
      {/* 🛠️ オリジナルカスタムポップアップ */}
      {modal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${modal.type === 'delete' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
              {modal.type === 'delete' ? <Trash2 size={28} /> : <Calendar size={28} />}
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">{modal.title}</h3>
            <p className="text-sm font-bold text-slate-500 leading-relaxed mb-8">{modal.message}</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setModal(prev => ({ ...prev, show: false }))}
                className="py-4 rounded-2xl bg-slate-100 text-slate-500 font-black active:scale-95 transition-all"
              >
                キャンセル
              </button>
              <button 
                onClick={modal.onConfirm}
                className={`py-4 rounded-2xl text-white font-black active:scale-95 transition-all shadow-lg ${modal.type === 'delete' ? 'bg-red-500 shadow-red-200' : 'bg-blue-600 shadow-blue-200'}`}
              >
                確定する
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-8">
        <header className="flex justify-between items-center px-2">
          <button onClick={() => router.push(`/${shop}`)} className="p-3 bg-white rounded-2xl border shadow-sm active:scale-95 transition-all">
            <ArrowLeft size={20} className="text-slate-400" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-black text-slate-800 tracking-tight text-center">履歴</h1>
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest leading-none mt-1 text-center">{shop === 'kosai' ? '湖西店' : '西駅店'}</p>
          </div>
          <div className="w-11"></div>
        </header>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
        ) : (
          Object.entries(groupedHistory).map(([month, data]: any) => (
            <section key={month} className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <h2 className="text-xl font-black text-slate-800">{month}</h2>
                <div className="bg-blue-50 px-4 py-2 rounded-2xl font-black text-blue-700 border border-blue-100">{data.monthTotal.toFixed(2)} H</div>
              </div>
              <div className="grid gap-3">
                {data.items.map((item: any) => (
                  <HistoryItem 
                    key={`${item.id}_${item.updatedAt}`} 
                    item={item} 
                    onEditDate={handleEditDate} 
                    onDelete={handleDelete} 
                    onGoToDetail={() => router.push(`/${shop}?date=${item.id}`)} 
                  />
                ))}
              </div>
            </section>
          ))
        )}
        <div className="h-10 w-full flex-shrink-0" aria-hidden="true" />
      </div>
    </main>
  );
}

export default function Page() { return <Suspense fallback={<div>Loading...</div>}><HistoryContent /></Suspense>; }