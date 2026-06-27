// hooks/useAttendanceData.ts
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { calculateSalesEfficiency, calculateStaffHours } from '@/lib/utils';

interface UseAttendanceDataProps {
    shop: string;
    date: string;
    sales: number;
    setSales: React.Dispatch<React.SetStateAction<number>>;
}

export function useAttendanceData({ shop, date, sales, setSales }: UseAttendanceDataProps) {
    const [staffList, setStaffList] = useState<any[]>([]);
    // 🟢 Firebaseの通信状態を管理するフラグを新設
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        setLoading(true);
        let isMounted = true; // 連打されたときのレースコンディションバグ防止弁

        const loadSavedData = async () => {
            try {
                const docRef = doc(db, "kintai", shop, "dailyData", date);
                const docSnap = await getDoc(docRef);

                if (!isMounted) return;

                if (docSnap.exists()) {
                    const docData = docSnap.data();

                    // 💰 売上のセット
                    if (typeof docData.sales === 'number') {
                        setSales(docData.sales);
                    } else {
                        setSales(0);
                    }

                    // 👥 スタッフリストのセット
                    if (docData.staffList) {
                        const savedList = docData.staffList as any[];
                        const sanitizedList = savedList.map(staff => ({
                            ...staff,
                            role: staff.role || 'alba'
                        }));
                        setStaffList(sanitizedList);
                    } else {
                        setStaffList([]);
                    }
                } else {
                    // 💰 データのない真っ新な日付なら初期化
                    setSales(0);
                    setStaffList([
                        { id: '1', name: '', startTime: '17:30', endTime: '20:00', breakMinutes: 0, role: 'alba' },
                        { id: '2', name: '', startTime: '19:00', endTime: '22:00', breakMinutes: 0, role: 'alba' },
                        { id: '3', name: '', startTime: '13:30', endTime: '15:30', breakMinutes: 0, role: 'part' },
                    ]);
                }
            } catch (error) {
                console.error("Firebaseからのデータ取得に失敗したわ:", error);
            } finally {
                // 🟢 通信が終わったら、成功でも失敗でもローディングを解除！
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadSavedData();

        return () => {
            isMounted = false; // クリーンアップ関数で二重実行を防ぐ
        };
    }, [date, shop, setSales]);

    const dailyTotal = staffList.reduce((sum, staff) => sum + calculateStaffHours(staff), 0);
    const albaStaffs = staffList.filter(staff => staff.role === 'alba');
    const albaTotalHours = albaStaffs.reduce((sum, staff) => sum + calculateStaffHours(staff), 0);
    const partStaffs = staffList.filter(staff => staff.role === 'part');
    const partTotalHours = partStaffs.reduce((sum, staff) => sum + calculateStaffHours(staff), 0);
    const salesEfficiency = calculateSalesEfficiency(sales, albaTotalHours, partTotalHours);

    return {
        staffList,
        setStaffList,
        dailyTotal,
        calculateHours: calculateStaffHours,
        albaStaffs,
        albaTotalHours,
        partStaffs,
        partTotalHours,
        salesEfficiency,
        loading // 🟢 親コンポーネントに状態を伝えるために追加
    };
}