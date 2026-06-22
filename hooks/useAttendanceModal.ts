// hooks/useAttendanceModal.ts
import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface UseAttendanceModalProps {
    shop: string;
    date: string;
    staffList: any[];
    dailyTotal: number;
    sales: number; // 🟢 1. 画面から売上金を仕入れるように追加！
    setShowToast: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useAttendanceModal({ shop, date, staffList, dailyTotal, sales, setShowToast }: UseAttendanceModalProps) {
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
        // 🟢 2. Firebaseに保存するオブジェクトの中に「sales」と、ついでに「albaTotalHours」なども混ぜて保存する！
        await setDoc(docRef, { 
            id: date, 
            date, 
            shop, 
            totalHours: dailyTotal, 
            sales: sales, // ◀ ココ！
            staffList, 
            updatedAt: Date.now() 
        });
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
        setModal,
        handleSaveClick
    };
}