// lib/utils.ts

/**
 * スタッフ1人の勤務時間を計算する共通関数
 */
export const calculateStaffHours = (staff: { startTime: string; endTime: string; breakMinutes: number }) => {
  if (!staff.startTime || !staff.endTime) return 0;
  
  const toMin = (t: string) => { 
    const [h, m] = t.split(':').map(Number); 
    return h * 60 + m; 
  };
  
  let start = toMin(staff.startTime);
  let end = toMin(staff.endTime);
  
  if (end < start) end += 1440; // 24時間またぎ対応
  
  const diff = end - start - (staff.breakMinutes || 0);
  return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0;
};