"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAnalysisData } from '@/hooks/useAnalysisData';
import { ArrowLeft, Store } from 'lucide-react';

// 🟢 新しく切り出したコンポーネントたちをインポート！
import { MonthSelector } from './_components/MonthSelector';
import { ReportGenerator } from './_components/ReportGenerator';
import { SalesChart } from './_components/SalesChart';

function AnalysisContent() {
    const router = useRouter();
    const params = useParams();
    const shop = params.shopId as string;
    const { allData, availableMonths, latestDayData, loading, error, refetch } = useAnalysisData({ shop });

    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const shopDisplayName = shop === 'kosai' ? '湖西店' : '西駅店';

    // データが読み込まれたら、自動的に一番最新の月をデフォルト選択にする
    useEffect(() => {
        if (availableMonths.length > 0 && !selectedMonth) {
            setSelectedMonth(availableMonths[0]);
        }
    }, [availableMonths, selectedMonth]);

    // 選択された月のデータだけにフィルタリング
    const filteredChartData = allData.filter(day => day.monthKey === selectedMonth);

    // 選択された月の「平均人時売上高」を算出
      const monthlyAverageEfficiency = filteredChartData.length > 0
        ? Math.round(filteredChartData.reduce((sum, day) => sum + day.salesEfficiency, 0) / filteredChartData.length)
        : 0;

    if (loading || error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
                <div className="text-center space-y-2">
                    {error ? (
                        <div className="mx-auto w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 text-lg">!</div>
                    ) : (
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    )}
                    <p className="text-sm font-bold text-slate-400">
                        {error ? '分析データを取得できませんでした' : '分析データを読み込み中...'}
                    </p>
                    {error && (
                        <button
                            className="mt-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                            onClick={refetch}
                        >
                            再読み込み
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans text-slate-900 overflow-x-hidden">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* ヘッダー */}
                <header className="flex items-center justify-between">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-0.5 leading-none">Analytics Dashboard</p>
                        <h1 className="text-xl font-black flex items-center gap-1.5 justify-end"><Store size={18} className="text-blue-500" />{shopDisplayName} 人時売上分析</h1>
                    </div>
                </header>

                {/* 🟢 1. 月選択 ＆ 月間平均ダッシュボード */}
                <MonthSelector
                    selectedMonth={selectedMonth}
                    setSelectedMonth={setSelectedMonth}
                    availableMonths={availableMonths}
                    filteredChartData={filteredChartData}
                    monthlyAverageEfficiency={monthlyAverageEfficiency}
                />

                {/* 🟢 2. 日報報告用ジェネレーター */}
                {latestDayData ? (
                    <ReportGenerator latestDayData={latestDayData} />
                ) : (
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center">
                        <p className="text-sm font-bold text-slate-400">本日のデータはまだ入力されていません</p>
                    </div>
                )}

                {/* 🟢 3. 人時売上高の推移グラフ (キリッと折れ線バージョン) */}
                <SalesChart
                    selectedMonth={selectedMonth}
                    filteredChartData={filteredChartData}
                />

            </div>
        </main>
    );
}

export default function Page() { return <Suspense fallback={<div className="p-8 text-center font-bold text-slate-400">Loading...</div>}><AnalysisContent /></Suspense>; }