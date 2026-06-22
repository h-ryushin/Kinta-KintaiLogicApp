"use client";

import React, { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle, Calendar, Trash2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { HistoryItem } from './_components/HistoryItem';
import { BottomNav } from '@/components/organisms/BottomNav';
import { useHistoryData } from '@/hooks/useHistoryData';
import { useHistoryModal } from '@/hooks/useHistoryModal';
import { ConfirmModal } from '@/components/organisms/ConfirmModal'; // 🟢 共通モーダルをインポート

function HistoryContent() {
  const router = useRouter();
  const params = useParams();
  const shop = params?.shopId as string;
  const { groupedHistory, loading, setLoading, fetchHistory } = useHistoryData({ shop });
  const { modal, setModal, handleEditDate, handleDelete } = useHistoryModal({ shop, fetchHistory, setLoading });

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8 font-sans overflow-x-hidden relative">
      
      {/* 🟢 重なっていたモーダル部分を共通コンポーネントに差し替え（フックのロジックはそのまま完全維持） */}
      <ConfirmModal
        show={modal.show}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onCancel={() => setModal(prev => ({ ...prev, show: false }))}
        onConfirm={modal.onConfirm}
      />

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
          Object.entries(groupedHistory || {}).map(([month, data]: any) => (
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
      <BottomNav />
    </main>
  );
}

export default function Page() { return <Suspense fallback={<div>Loading...</div>}><HistoryContent /></Suspense>; }