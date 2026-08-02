"use client";

import { useState, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { fetchWithRetry } from '@/lib/firestoreRetry';

interface UseHistoryDataProps {
    shop: string;
}

export function useHistoryData({ shop }: UseHistoryDataProps) {
    const [currentMonthData, setCurrentMonthData] = useState<{ items: any[]; monthTotal: number }>({ items: [], monthTotal: 0 });
    const [monthOptions, setMonthOptions] = useState<string[]>([]); // 💡 Firebaseに本当に存在する月のリスト
    const [selectedMonth, setSelectedMonth] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    // 🔁 「再読み込み」ボタン用のトリガー（月一覧の再取得をやり直す）
    const [retryToken, setRetryToken] = useState(0);

    // 🌟 ステップ1: Firebaseに「本当に存在する月」のリストだけを、ドキュメントのID（名前）だけで抽出する
    useEffect(() => {
        const fetchAvailableMonths = async () => {
            if (!shop) return;
            setError(false);
            try {
                const historyRef = collection(db, "kintai", shop, "dailyData");
                const querySnapshot = await fetchWithRetry(() => getDocs(historyRef));
                
                const monthsSet = new Set<string>();
                querySnapshot.docs.forEach(doc => {
                    if (!doc.id || !doc.id.includes('-')) return;
                    const [year, month] = doc.id.split('-');
                    monthsSet.add(`${year}年${month}月`);
                });

                // 新しい月が上に来るように降順ソート
                const sortedMonths = Array.from(monthsSet).sort((a, b) => b.localeCompare(a));
                setMonthOptions(sortedMonths);

                // 初期選択月の決定ロジック
                if (sortedMonths.length > 0) {
                    const now = new Date();
                    if (now.getHours() < 3) now.setDate(now.getDate() - 1); // 朝3時跨ぎ対応
                    const defaultMonthKey = `${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月`;

                    // 今月のデータが存在すれば今月、なければ存在する一番最新の月をデフォルトにする
                    if (sortedMonths.includes(defaultMonthKey)) {
                        setSelectedMonth(defaultMonthKey);
                    } else {
                        setSelectedMonth(sortedMonths[0]);
                    }
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error("存在する月の取得に失敗しました:", err);
                setError(true);
                setLoading(false);
            }
        };

        fetchAvailableMonths();
    }, [shop, retryToken]);

    // 🌟 ステップ2: 選択された月が変わった瞬間、その「1ヶ月分のデータだけ」を狙い撃ちで回収する
    const fetchHistory = useCallback(async () => {
        if (!shop || !selectedMonth) return;
        setLoading(true);
        setError(false);
        try {
            // "2026年06月" ➔ "2026-06" の検索用キーを作る
            const match = selectedMonth.match(/(\d+)年(\d+)月/);
            if (!match) return;
            const searchKey = `${match[1]}-${match[2]}`; // "2026-06"

            const historyRef = collection(db, "kintai", shop, "dailyData");
            
            // 🔥 ドキュメントID（__name__）が "2026-06" から始まるものだけをピンポイント取得（月ごとバラバラ回収）
            const q = query(
                historyRef,
                where("__name__", ">=", searchKey),
                where("__name__", "<=", searchKey + "\uf8ff")
            );
            
            const querySnapshot = await fetchWithRetry(() => getDocs(q));
            const rawData = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

            // 日付の新しい順（降順）に並び替え
            rawData.sort((a, b) => b.id.localeCompare(a.id));

            // 選択された月だけの総時間を集計
            let total = 0;
            rawData.forEach(item => {
                total += Number(item.totalHours || 0);
            });

            setCurrentMonthData({
                items: rawData,
                monthTotal: total
            });

        } catch (err) {
            console.error("月別データの取得に失敗しました:", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [shop, selectedMonth]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // 🔁 「再読み込み」ボタン用: 月一覧・月別データの両方をやり直す
    const refetch = useCallback(() => {
        setRetryToken(t => t + 1);
        fetchHistory();
    }, [fetchHistory]);

    return {
        monthOptions,     // 🟢 データが存在する月だけの配列（空の月は出ない！）
        selectedMonth,    // 🟢 現在選ばれている月
        setSelectedMonth, // 🟢 月を切り替える関数
        currentMonthData, // 🟢 選ばれた月の実データ
        loading,
        error,
        setLoading,
        fetchHistory,
        refetch
    };
}