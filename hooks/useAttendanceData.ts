import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface UseAttendanceDataProps {
    shop: string;
    date: string;
}
export function useAttendanceData({ shop, date }: UseAttendanceDataProps) {
    const [staffList, setStaffList] = useState<any[]>([]);
    useEffect(() => {
        const loadSavedData = async () => {
            const docRef = doc(db, "kintai", shop, "dailyData", date);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().staffList) {
                setStaffList(docSnap.data().staffList);
            } else {
                setStaffList([
                    { id: '1', name: '', startTime: '17:30', endTime: '20:00', breakMinutes: 0 },
                    { id: '2', name: '', startTime: '19:00', endTime: '22:00', breakMinutes: 0 },
                    { id: '3', name: '', startTime: '13:30', endTime: '15:30', breakMinutes: 0 },
                ]);
            }
        };
        loadSavedData();
    }, [date, shop]);
    const calculateHours = (s: any) => {
        const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
        let start = toMin(s.startTime), end = toMin(s.endTime);
        if (end < start) end += 1440;
        const diff = end - start - s.breakMinutes;
        return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0;
    };
    const dailyTotal = staffList.reduce((sum, staff) => sum + calculateHours(staff), 0);
    return {
        staffList,
        setStaffList,
        dailyTotal,
        calculateHours // 💡これ元の画面のStaffCardに渡してたから、一緒に出荷しておくと便利！
    };
}