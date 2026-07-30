"use client";

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ConfirmModal } from '@/components/organisms/ConfirmModal';
import { BottomNav } from '@/components/organisms/BottomNav';
import { HistoryItem } from './_components/HistoryItem';
import { useHistoryData } from '@/hooks/useHistoryData';
import { useHistoryModal } from '@/hooks/useHistoryModal';

export default function HistoryPage() {
  const router = useRouter();
  const params = useParams();
  const shop = params.shopId as string;

  // 🏢 店舗ID（'kosai' など）から表示名（'湖西店'）を作るロジック
  const shopDisplayName = shop === 'kosai' ? '湖西店' : '西駅店';

  // 💡 フックから月切り替え機能と、現在選ばれている月の身軽なデータを取得
  const {
    monthOptions,
    selectedMonth,
    setSelectedMonth,
    currentMonthData,
    loading,
    setLoading,
    fetchHistory
  } = useHistoryData({ shop });

  // 💡 モーダル管理用のフック
  const {
    modal,
    setModal,
    handleEditDate,
    handleDelete
  } = useHistoryModal({ shop, fetchHistory, setLoading });

  if (loading && monthOptions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <h2 className="text-lg font-black text-slate-900">データを読み込み中です</h2>
          <button
            className="mt-6 rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
            onClick={() => router.refresh()}
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans text-slate-900 overflow-x-hidden relative">
      {/* ⚠️ 上書き・削除の確認モーダル */}
      <ConfirmModal
        show={modal.show}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onCancel={() => setModal(prev => ({ ...prev, show: false }))}
        onConfirm={modal.onConfirm}
      />


      <div className="max-w-2xl mx-auto space-y-6">

        {/* 🗺️ タイトルと月選択のヘッダーエリア（店舗バッジ付きデザイン） */}
        <div className="bg-white p-5 sm:p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-none tracking-tight">勤務履歴</h1>
              {/* 🏢 今どっちの店舗か一発でわかる今風なミニバッジ */}
              <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-black px-2 py-0.5 rounded-md leading-none uppercase tracking-wider">
                {shopDisplayName}
              </span>
            </div>
            <p className="hidden sm:block text-xs text-slate-400 font-bold">過去の勤務実績データを月別で確認・編集できます。</p>
          </div>

          {/* 📅 月切り替えのプルダウンメニュー */}
          <div className="relative min-w-[140px] sm:min-w-[160px] flex-shrink-0">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-black pl-4 pr-10 py-2.5 rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none transition-all text-sm"
            >
              {monthOptions.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            {/* 右側のカスタム矢印 */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] font-black text-slate-400 select-none">
              ▼
            </div>
          </div>
        </div>

        {/* 📊 選択されている「その月だけ」の合計ステータスカード */}
        <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-xl flex justify-between items-center border border-slate-800">
          <div>
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest leading-none mb-1">
              {selectedMonth || "---"} {shopDisplayName}の合計
            </p>
            <h2 className="text-3xl font-black tabular-nums leading-none">
              {currentMonthData.monthTotal.toFixed(2)} <span className="text-sm text-slate-400 font-bold">H</span>
            </h2>
          </div>
          <div className="bg-slate-800 text-slate-400 text-xs font-black px-4 py-2 rounded-xl border border-slate-700">
            稼働日数: {currentMonthData.items.length} 日
          </div>
        </div>

        {/* 👥 履歴一覧リスト（選ばれた月のアイテムだけを表示） */}
        <div className="space-y-4">
          {currentMonthData.items.length > 0 ? (
            currentMonthData.items.map((item: any) => (
              <HistoryItem
                key={item.id}
                item={item}
                onEditDate={handleEditDate}
                onDelete={handleDelete}
                onGoToDetail={() => router.push(`/${shop}?date=${item.id}`)}
              />
            ))
          ) : (
            <div className="text-center py-12 text-slate-400 font-bold bg-white rounded-[2.5rem] border border-slate-100">
              この月の勤務データはまだありません。
            </div>
          )}
        </div>

        {/* 🗺️ フッターとコンテンツが被らないためのクッション ＆ ボトムナビ */}
        <div className="h-10 w-full flex-shrink-0" aria-hidden="true" />
        <BottomNav />

      </div>
    </main>
  );
}