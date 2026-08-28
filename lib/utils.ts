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

/**
 * 「営業日」基準の今日の日付(YYYY-MM-DD)をローカル時間で取得する共通関数
 * 朝3時までは前日の営業日として扱う（app/[shopId]/page.tsxの3時締めルールと統一）
 */
export const getBusinessDateString = (baseDate: Date = new Date()) => {
  const d = new Date(baseDate);
  if (d.getHours() < 3) {
    d.setDate(d.getDate() - 1);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 人時売上を算出する共通関数
 * ルール: 売上 ÷ (アルバイト時間 + パート時間 + 8時間)
 */
export const calculateSalesEfficiency = (
  sales: number,
  albaHours: number,
  partHours: number,
  baseHours: number = 8
) => {
  const totalTargetHours = albaHours + partHours + baseHours;
  return totalTargetHours > 0 ? Math.round(sales / totalTargetHours) : 0;
};