import { useState, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface UseHistoryDataProps {
    shop: string;
}
export function useHistoryData({ shop }: UseHistoryDataProps) {
    const [groupedHistory, setGroupedHistory] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
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
    return {
        groupedHistory,
        loading,
        setLoading, // モーダル側でローディングを挟むために出荷しておくよ
        fetchHistory
    };
}