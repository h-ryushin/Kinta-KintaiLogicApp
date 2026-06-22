import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
interface UseHistoryModalProps {
    shop: string;
    fetchHistory: () => Promise<void>;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}
export function useHistoryModal({ shop, fetchHistory, setLoading }: UseHistoryModalProps) {
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
        onConfirm: () => { },
        type: 'edit'
    });
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
    return {
        modal,
        setModal,
        handleEditDate,
        handleDelete
    };
}