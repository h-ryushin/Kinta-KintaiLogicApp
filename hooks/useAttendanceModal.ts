import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore'

interface UseAttendanceModalProps {
    shop: string;
    date: string;
    staffList: any[];
    dailyTotal: number;
    setShowToast: React.Dispatch<React.SetStateAction<boolean>>; // トースト表示用のリモコン
}
export function useAttendanceModal({ shop, date, staffList, dailyTotal, setShowToast }: UseAttendanceModalProps) {
    const [modal, setModal] = useState<{
        show: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'success' | 'warning' | 'info';
    }>({
        show: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'info'
    });
    const executeSave = async () => {
        const docRef = doc(db, "kintai", shop, "dailyData", date);
        await setDoc(docRef, { id: date, date, shop, totalHours: dailyTotal, staffList, updatedAt: Date.now() });
        setModal(prev => ({ ...prev, show: false }));
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
    };
    const handleSaveClick = async () => {
        const docRef = doc(db, "kintai", shop, "dailyData", date);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            setModal({
                show: true,
                title: "上書き保存しますか？",
                message: `${date} のデータは既に存在します。現在の内容で更新してもよろしいですか？`,
                type: 'warning',
                onConfirm: executeSave
            });
        } else {
            setModal({
                show: true,
                title: "データを保存しますか？",
                message: `${date} の勤務記録を保存します。`,
                type: 'success',
                onConfirm: executeSave
            });
        }
    };
    return {
        modal,
        setModal,          // モーダルを閉じる時にも使うので一緒に返しておくと便利！
        handleSaveClick
    };
}