// hooks/useAnalysisData.ts
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { calculateSalesEfficiency, calculateStaffHours } from '@/lib/utils';
import { fetchWithRetry } from '@/lib/firestoreRetry';

interface UseAnalysisDataProps {
  shop: string;
}

export function useAnalysisData({ shop }: UseAnalysisDataProps) {
  const [allData, setAllData] = useState<any[]>([]); // 🟢 全データを保持
  const [availableMonths, setAvailableMonths] = useState<string[]>([]); // 🟢 存在する月のリスト
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  // 🔁 「再読み込み」ボタン用のトリガー
  const [retryToken, setRetryToken] = useState(0);
  const refetch = useCallback(() => setRetryToken(t => t + 1), []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!shop) return;
      setLoading(true);
      setError(false);
      try {
        const historyRef = collection(db, "kintai", shop, "dailyData");
        const querySnapshot = await fetchWithRetry(() => getDocs(historyRef));

        const rawData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
        rawData.sort((a, b) => a.id.localeCompare(b.id));

        // 月のリストを自動抽出 (例: "2026-06-22" ➔ "2026-06")
        const monthsSet = new Set<string>();

        const formattedData = rawData.map(day => {
          const albaTotalHours = (day.staffList || [])
            .filter((staff: any) => staff.role === 'alba')
            .reduce((sum: number, staff: any) => sum + calculateStaffHours(staff), 0);
          const partTotalHours = (day.staffList || [])
            .filter((staff: any) => staff.role === 'part')
            .reduce((sum: number, staff: any) => sum + calculateStaffHours(staff), 0);

          const sales = Number(day.sales || 0);
          const salesEfficiency = calculateSalesEfficiency(sales, albaTotalHours, partTotalHours);

          let status: 'low' | 'good' | 'high' = 'good';
          if (salesEfficiency < 4800) status = 'low';
          if (salesEfficiency > 6200) status = 'high';

          const labelDate = day.id.includes('-') ? day.id.split('-').slice(1).join('/') : day.id;

          // 日付から年月(YYYY-MM)を抽出してSetに追加
          if (day.id.includes('-')) {
            const [year, month] = day.id.split('-');
            monthsSet.add(`${year}-${month}`);
          }

          return {
            date: day.id,
            monthKey: day.id.substring(0, 7), // "2026-06" のようなキーを持たせる
            displayDate: labelDate,
            sales: sales,
            albaHours: albaTotalHours,
            salesEfficiency: salesEfficiency,
            status: status
          };
        });

        setAllData(formattedData);
        // 月のリストを降順（新しい月が上）にして格納
        setAvailableMonths(Array.from(monthsSet).sort((a, b) => b.localeCompare(a)));
      } catch (err) {
        console.error("分析データの取得に失敗しました:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [shop, retryToken]);

  const latestDayData = allData.length > 0 ? allData[allData.length - 1] : null;

  return {
    allData, // 🟢 全データを出荷
    availableMonths, // 🟢 存在する月の選択肢を出荷
    latestDayData,
    loading,
    error,
    refetch
  };
}