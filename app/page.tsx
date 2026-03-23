"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Trash2, Save, Calculator, CheckCircle2, ArrowRight, Mic, User, TrendingUp, ChevronLeft, ChevronRight, Store } from 'lucide-react';
import Link from 'next/link';

// --- Firebase ---
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface StaffWork {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
}

function AttendanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URLパラメータから日付と店舗を取得（デフォルト設定あり）
  const dateParam = searchParams.get('date');
  const shopParam = searchParams.get('shop') || 'nishieki'; 
  
  const [date, setDate] = useState(dateParam || new Date().toISOString().split('T')[0]);
  const [shop, setShop] = useState(shopParam);
  const [showToast, setShowToast] = useState(false);
  const [activeListeningId, setActiveListeningId] = useState<string | null>(null);

  const [staffList, setStaffList] = useState<StaffWork[]>([
    { id: '1', name: '', startTime: '17:30', endTime: '20:00', breakMinutes: 0 },
    { id: '2', name: '', startTime: '19:00', endTime: '22:00', breakMinutes: 0 }
  ]);

  // 店舗名表示用
  const shopDisplayName = shop === 'nishieki' ? '西駅店' : '湖西店';

  // 日付や店舗が変わったらURLを更新
  const updateURL = (newDate: string, newShop: string) => {
    router.push(`/?date=${newDate}&shop=${newShop}`);
  };

  // 日付変更
  const changeDate = (offset: number) => {
    const current = new Date(date);
    current.setDate(current.getDate() + offset);
    const newDateStr = current.toISOString().split('T')[0];
    setDate(newDateStr);
    updateURL(newDateStr, shop);
  };

  // 店舗変更
  const handleShopChange = (newShop: string) => {
    setShop(newShop);
    updateURL(date, newShop);
  };

  // 労働時間計算
  const calculateHours = (s: StaffWork) => {
    const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    let start = toMin(s.startTime), end = toMin(s.endTime);
    if (end < start) end += 1440;
    const diff = end - start - s.breakMinutes;
    return diff > 0 ? Math.floor((diff / 60) * 100) / 100 : 0;
  };

  const dailyTotal = staffList.reduce((sum, staff) => sum + calculateHours(staff), 0);

  // 保存処理（Firebaseの階層を店舗ごとに分離）
  const handleSave = async () => {
    try {
      // kintaiコレクション > 店舗名ドキュメント > dailyDataサブコレクション > 日付ドキュメント
      const docRef = doc(db, "kintai", shop, "dailyData", date);
      await setDoc(docRef, { 
        totalHours: dailyTotal, 
        shopName: shopDisplayName,
        updatedAt: new Date() 
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (error) {
      console.error("保存失敗:", error);
      alert("保存に失敗しました。");
    }
  };

  const updateStaff = (id: string, field: keyof StaffWork, value: any) => {
    setStaffList(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // 音声入力処理（タイポ修正済み）
  const startListening = (staffId: string) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("お使いのブラウザは音声入力に対応していません。iPhoneならSafari、PCならChromeをお試しください。");
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.onstart = () => setActiveListeningId(staffId);
    recognition.onend = () => setActiveListeningId(null);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.replace(/[０-９]/g, (s: string) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/[：:。、.？?]/g, '');
      setStaffList(prev => prev.map(staff => {
        if (staff.id !== staffId) return staff;
        let updated = { ...staff };
        const parseTime = (keywords: string[], isStart: boolean) => {
          const regex = new RegExp(`(?:(\\d+)\\s*時)?\\s*(\\d+)?\\s*分?\\s*(?:${keywords.join('|')})|(?:${keywords.join('|')})\\s*(?:(\\d+)\\s*時)?\\s*(\\d+)?\\s*分?`);
          const m = transcript.match(regex);
          if (m) {
            let h = parseInt(m[1] || m[3]);
            const min = m[2] || m[4] || "00";
            if (!isNaN(h)) {
              if (isStart && h < 15) h += 12;
              if (!isStart && h >= 8 && h < 12) h += 12;
              return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
            }
          }
          return null;
        };
        const st = parseTime(["入り", "出勤", "開始"], true), et = parseTime(["上がり", "退勤", "終了"], false);
        if (st) updated.startTime = st; if (et) updated.endTime = et;
        return updated;
      }));
    };
    recognition.start();
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-8 pb-40 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {showToast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in zoom-in">
            <CheckCircle2 className="text-green-500" size={18} />
            <span className="font-bold text-sm">{shopDisplayName}のデータを保存しました！</span>
          </div>
        )}

        <header className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg"><Calculator size={24} /></div>
            <div>
              <h1 className="text-xl font-black tracking-tight">勤怠計算アプリ</h1>
              <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><Store size={10}/> {shopDisplayName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-blue-600 shadow-sm">
              <ChevronLeft size={20} />
            </button>
            <input type="date" value={date} onChange={(e) => { setDate(e.target.value); updateURL(e.target.value, shop); }} className="bg-white border-none rounded-xl px-4 py-1.5 text-sm font-black shadow-sm outline-none cursor-pointer" />
            <button onClick={() => changeDate(1)} className="p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-blue-600 shadow-sm">
              <ChevronRight size={20} />
            </button>
          </div>
        </header>

        {/* 店舗切り替えタブ */}
        <div className="flex bg-slate-200 p-1 rounded-2xl w-full max-w-[300px] mx-auto shadow-inner">
          <button onClick={() => handleShopChange('nishieki')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${shop === 'nishieki' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>西駅店</button>
          <button onClick={() => handleShopChange('kosai')} className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${shop === 'kosai' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>湖西店</button>
        </div>

        <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100/50 space-y-3">
          <div className="flex items-center gap-2 text-blue-600">
            <Mic size={16} className="animate-pulse" />
            <span className="text-xs font-black tracking-widest uppercase">音声入力の使い方</span>
          </div>
          <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
            例「19時入り、23時15分上がり」と話してください。休憩は手動入力です。
            <br />
            <span className="text-blue-500 text-[10px]">※一部のブラウザ端末では動かない可能性があります🙏<br></br>音声入力の精度の都合上目視で時間を確認お願いします</span>
          </p>
        </div>

        <div className="grid gap-3">
          {staffList.map((staff) => (
            <div key={staff.id} className="bg-white rounded-3xl border border-slate-200/60 p-4 shadow-sm hover:border-blue-200 transition-all">
              <div className="flex flex-col lg:flex-row items-end gap-4">
                <div className="w-full lg:w-48">
                  <label className="text-[10px] font-black text-slate-400 mb-1 block">名前</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input type="text" placeholder="スタッフ名" value={staff.name} onChange={(e) => updateStaff(staff.id, 'name', e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl pl-9 pr-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black text-slate-400">勤務時間</label>
                    <button onClick={() => startListening(staff.id)} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black transition-all ${activeListeningId === staff.id ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                      <Mic size={10} /> {activeListeningId === staff.id ? '録音中...' : '音声入力'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="time" value={staff.startTime} onChange={(e) => updateStaff(staff.id, 'startTime', e.target.value)} className="flex-1 bg-slate-50 border-none rounded-2xl p-2.5 text-sm font-black text-center focus:ring-2 focus:ring-blue-500 outline-none" />
                    <span className="text-slate-300 font-bold">〜</span>
                    <input type="time" value={staff.endTime} onChange={(e) => updateStaff(staff.id, 'endTime', e.target.value)} className="flex-1 bg-slate-50 border-none rounded-2xl p-2.5 text-sm font-black text-center focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>
                <div className="flex items-end gap-3 w-full lg:w-auto">
                  <div className="w-20">
                    <label className="text-[10px] font-black text-slate-400 mb-1 block text-center">休憩(分)</label>
                    <input type="number" value={staff.breakMinutes} onChange={(e) => updateStaff(staff.id, 'breakMinutes', parseInt(e.target.value) || 0)} className="w-full bg-slate-50 border-none rounded-2xl p-2.5 text-sm font-black text-center outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="flex-1 lg:w-28 bg-blue-50 rounded-2xl p-2.5 text-center border border-blue-100">
                    <div className="text-[8px] font-black text-blue-300 mb-1 leading-none">実働時間</div>
                    <div className="text-xl font-black text-blue-700 leading-none">{calculateHours(staff).toFixed(2)}</div>
                  </div>
                  <button onClick={() => setStaffList(prev => prev.length > 1 ? prev.filter(s => s.id !== staff.id) : prev)} className="p-2.5 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex justify-between items-center shadow-2xl">
          <div className="flex items-center gap-5">
            <div className="bg-blue-500 p-4 rounded-3xl shadow-lg shadow-blue-500/20"><TrendingUp size={32} /></div>
            <div>
              <p className="text-blue-300 text-[10px] font-black uppercase tracking-widest mb-1">{shopDisplayName} 合計時間</p>
              <h2 className="text-5xl font-black tracking-tighter">{dailyTotal.toFixed(2)} <span className="text-xl text-blue-400">時間</span></h2>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button onClick={() => setStaffList(prev => [...prev, { id: Date.now().toString(), name: '', startTime: '19:00', endTime: '22:00', breakMinutes: 0 }])} className="md:col-span-1 bg-white border-2 border-dashed border-slate-300 text-slate-400 py-4 rounded-3xl font-bold flex items-center justify-center gap-2 hover:border-blue-500 transition-all hover:text-blue-500 animate-in fade-in duration-500"><Plus size={20} /> 人を追加</button>
          <button onClick={handleSave} className="md:col-span-2 bg-blue-600 text-white py-4 rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-blue-700 shadow-xl shadow-blue-500/10 transition-all active:scale-[0.98]"><Save size={24} /> {shopDisplayName}の合計を保存</button>
          <Link href={`/history?shop=${shop}`} className="md:col-span-1 bg-white border border-slate-200 text-slate-600 py-4 rounded-3xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-all text-sm">履歴を確認 <ArrowRight size={16} /></Link>
        </div>
      </div>
    </main>
  );
}

export default function Page() { return <Suspense fallback={<div>読み込み中...</div>}><AttendanceContent /></Suspense>; }