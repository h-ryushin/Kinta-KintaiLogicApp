"use client";

import React, { useState, Suspense, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { TrendingUp, HelpCircle } from 'lucide-react';
import { HeaderSection } from './_components/HeaderSection';
import { SalesDashboard } from './_components/SalesDashboard';
import { StaffSection } from './_components/StaffSection';
import { ActionButtons } from './_components/ActionButtons'; 
import { ConfirmModal } from '@/components/organisms/ConfirmModal';
import { BottomNav } from '@/components/organisms/BottomNav';

import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useAttendanceModal } from '@/hooks/useAttendanceModal';
import { useAttendanceData } from '@/hooks/useAttendanceData';

function AttendanceContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const shop = params.shopId as string;
  const dateParam = searchParams.get('date');
  
  // 今日の日付（YYYY-MM-DD）を取得する関数
  const getTodayString = () => new Date().toISOString().split('T')[0];
  
  const [date, setDate] = useState(dateParam || getTodayString());
  const [showToast, setShowToast] = useState(false);
  const [sales, setSales] = useState<number>(0);

  // 🟢 【新機能】朝3時を過ぎたら自動で今日の日付にリロードする監視ロジック
  // useEffect(() => {
  //   // 1分ごとにチェックを入れる
  //   const interval = setInterval(() => {
  //     const now = new Date();
  //     const currentHours = now.getHours();
  //     const currentMinutes = now.getMinutes();

  //     // 現在の「実際の今日の日付」
  //     const realToday = getTodayString();

  //     // もしアプリが「過去の日付」を表示していて、かつ現在時刻が「朝3時以降」になった場合
  //     // または、純粋に日を跨いで朝3時ちょうどになった場合
  //     if (date !== realToday && currentHours >= 3) {
  //       // 念のため、朝3時〜3時1分の間に確実に1回だけリロードが走るようにするか、日付が変わっているなら強制リフレッシュ
  //       window.location.href = `/${shop}?date=${realToday}`;
  //     }
  //   }, 60000); // 60,000ms = 1分

  //   return () => clearInterval(interval);
  // }, [date, shop]);
  // 🟢 【修正版】朝3時を過ぎて、日を跨いだ瞬間に1回だけ自動で今日の日付にリロードするロジック
  useEffect(() => {
    // 1分ごとにチェックを入れる
    const interval = setInterval(() => {
      const now = new Date();
      
      // 朝3時営業切り替えのロジック：もし現在時刻が「朝0時〜2時59分」なら、日付としては「前日」として扱う
      const targetDate = new Date(now);
      if (now.getHours() < 3) {
        targetDate.setDate(targetDate.getDate() - 1);
      }
      
      // 朝3時基準で計算された「あるべき今日の日付（YYYY-MM-DD）」
      const businessToday = targetDate.toISOString().split('T')[0];

      // 【超重要】ユーザーが意図的に過去のURL（?date=...）を開いている時はリロードを絶対に阻止！
      // 「今アプリが開いている日付」が「朝3時基準の今日」であり、かつ「実際の時間が翌日の朝3時を過ぎた」時だけ走らせる
      const currentSearchParams = new URLSearchParams(window.location.search);
      const isViewingToday = !currentSearchParams.get('date') || currentSearchParams.get('date') === businessToday;

      if (isViewingToday && date !== businessToday && now.getHours() >= 3) {
        window.location.href = `/${shop}?date=${businessToday}`;
      }
    }, 60000); // 1分ごと

    return () => clearInterval(interval);
  }, [date, shop]);

  const {
    staffList,
    setStaffList,
    dailyTotal,
    calculateHours,
    albaStaffs,
    albaTotalHours,
    partStaffs,
    partTotalHours,
    salesEfficiency
  } = useAttendanceData({ shop, date, sales , setSales });

  const { startListening, listeningStaffId } = useSpeechRecognition({ setStaffList });
  const shopDisplayName = shop === 'kosai' ? '湖西店' : '西駅店';

  const { modal, setModal, handleSaveClick } = useAttendanceModal({
    shop,
    date,
    staffList,
    dailyTotal,
    sales,
    setShowToast
  });

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans text-slate-900 overflow-x-hidden relative">
      
      <ConfirmModal
        show={modal.show}
        title={modal.title || "上書き保存しますか？"}
        message={modal.message || "既存の勤務データを上書き保存しちゃうけどいいの？"}
        type={modal.type || 'edit'}
        onCancel={() => setModal(prev => ({ ...prev, show: false }))}
        onConfirm={modal.onConfirm}
      />

      <div className="max-w-4xl mx-auto space-y-6">
        {showToast && <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[150] bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl">保存完了しました！</div>}

        {/* 🏢 1. ヘッダー */}
        <HeaderSection
          shopDisplayName={shopDisplayName}
          date={date}
          onDateChange={(newDate) => { setDate(newDate); router.push(`/${shop}?date=${newDate}`); }}
        />

        {/* 💰 2. 売上ダッシュボード */}
        <SalesDashboard
          sales={sales}
          onSalesChange={setSales}
          salesEfficiency={salesEfficiency}
        />

        {/* ヘルプ文 */}
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
          <HelpCircle size={18} className="text-slate-300" />
          <p className="text-[11px] text-slate-500 font-bold">音声入力を使う場合「17時3分入り22時30分上がり」のように喋ってください。</p>
        </div>

        {/* 👥 3. 役割ごとのスタッフセクション */}
        <div className="space-y-8">
          <StaffSection
            title="アルバイト入力枠"
            titleColor="text-blue-600"
            dotColor="bg-blue-500"
            totalHours={albaTotalHours}
            staffs={albaStaffs}
            listeningStaffId={listeningStaffId}
            startListening={startListening}
            setStaffList={setStaffList}
            calculateHours={calculateHours}
          />

          <StaffSection
            title="パート入力枠"
            titleColor="text-orange-600"
            dotColor="bg-orange-500"
            totalHours={partTotalHours}
            staffs={partStaffs}
            listeningStaffId={listeningStaffId}
            startListening={startListening}
            setStaffList={setStaffList}
            calculateHours={calculateHours}
          />
        </div>

        {/* 総合計時間 */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex justify-between items-center shadow-2xl mt-4 border border-slate-800">
          <div className="flex items-center gap-5">
            <div className="bg-blue-600 p-4 rounded-3xl shadow-lg shadow-blue-500/20"><TrendingUp size={32} /></div>
            <div>
              <p className="text-blue-300 text-[10px] font-black mb-1 uppercase tracking-widest leading-none mb-1">Total Hours (All Staff)</p>
              <h2 className="text-5xl font-black tabular-nums leading-none">{dailyTotal.toFixed(2)} <span className="text-xl text-blue-400 font-bold">H</span></h2>
            </div>
          </div>
        </div>

        {/* 🟢 4. 下部ボタンパーツ */}
        <ActionButtons shop={shop} setStaffList={setStaffList} onSave={handleSaveClick} />

        <div className="h-10 w-full flex-shrink-0" aria-hidden="true" />
        <BottomNav />
      </div>
    </main>
  );
}

export default function Page() { return <Suspense fallback={<div>Loading...</div>}><AttendanceContent /></Suspense>; }