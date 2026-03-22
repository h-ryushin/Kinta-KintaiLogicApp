"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Trash2, Save, Calculator, Clock, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface StaffWork {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
}

function AttendanceContent() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');

  const [date, setDate] = useState(dateParam || new Date().toISOString().split('T')[0]);
  const [showToast, setShowToast] = useState(false);
  
  // デフォルト 19:00 / 休憩 0分
  const [staffList, setStaffList] = useState<StaffWork[]>([
    { id: '1', name: '', startTime: '19:00', endTime: '22:00', breakMinutes: 0 }
  ]);

  useEffect(() => {
    if (dateParam) setDate(dateParam);
  }, [dateParam]);

  useEffect(() => {
    const savedData = localStorage.getItem(`kintai-${date}`);
    if (savedData) {
      setStaffList(JSON.parse(savedData));
    } else {
      setStaffList([{ id: Date.now().toString(), name: '', startTime: '19:00', endTime: '22:00', breakMinutes: 0 }]);
    }
  }, [date]);

  const timeToMinutes = (time: string) => {
    const [hrs, mins] = time.split(':').map(Number);
    return hrs * 60 + mins;
  };

  const calculateDecimalHours = (staff: StaffWork) => {
    const start = timeToMinutes(staff.startTime);
    let end = timeToMinutes(staff.endTime);
    if (end < start) end += 24 * 60; // 日またぎ対応
    
    const totalMins = end - start - staff.breakMinutes;
    if (totalMins <= 0) return 0;
    return Math.floor((totalMins / 60) * 100) / 100;
  };

  const dailyTotal = staffList.reduce((sum, staff) => sum + calculateDecimalHours(staff), 0);

  // 保存処理（ページ遷移を削除）
  const handleSave = () => {
    localStorage.setItem(`kintai-${date}`, JSON.stringify(staffList));
    
    // 保存完了の通知を出す
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000); // 3秒後に消す
  };

  const addStaff = () => {
    setStaffList([...staffList, { 
      id: Date.now().toString(), 
      name: '', 
      startTime: '19:00', 
      endTime: '22:00', 
      breakMinutes: 0 
    }]);
  };

  const removeStaff = (id: string) => {
    if (staffList.length > 1) setStaffList(staffList.filter(s => s.id !== id));
  };

  const updateStaff = (id: string, field: keyof StaffWork, value: string | number) => {
    setStaffList(staffList.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8 pb-32 relative">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* 保存完了トースト */}
        {showToast && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="text-green-400" size={20} />
            <span className="font-bold">{date} のデータを保存しました</span>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="text-blue-600" size={24} /> 勤怠入力
              </h1>
              <p className="text-sm text-slate-500 mt-1 font-medium text-blue-600">デフォルト：19:00入り / 休憩0分</p>
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {staffList.map((staff) => (
            <div key={staff.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 transition-all hover:border-blue-200">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                <div className="sm:col-span-3">
                  <label className="text-[10px] font-bold text-slate-400 mb-1 block">スタッフ名</label>
                  <input type="text" placeholder="名前" value={staff.name} onChange={(e) => updateStaff(staff.id, 'name', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm focus:bg-white outline-none" />
                </div>
                <div className="sm:col-span-4">
                  <label className="text-[10px] font-bold text-slate-400 mb-1 block">勤務 (19:00~)</label>
                  <div className="flex items-center gap-2">
                    <input type="time" value={staff.startTime} onChange={(e) => updateStaff(staff.id, 'startTime', e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-md p-2 text-sm font-medium" />
                    <span className="text-slate-300">-</span>
                    <input type="time" value={staff.endTime} onChange={(e) => updateStaff(staff.id, 'endTime', e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-md p-2 text-sm font-medium" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 mb-1 block text-center">休憩(分)</label>
                  <input type="number" value={staff.breakMinutes} onChange={(e) => updateStaff(staff.id, 'breakMinutes', parseInt(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-medium text-center" />
                </div>
                <div className="sm:col-span-2 flex flex-col items-center justify-center bg-blue-50 border border-blue-100 rounded-md p-2 text-blue-700">
                  <label className="text-[10px] font-bold uppercase mb-1 block">稼働</label>
                  <span className="text-xl font-black">{calculateDecimalHours(staff).toFixed(2)}</span>
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <button onClick={() => removeStaff(staff.id)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={addStaff} className="flex-1 bg-white border-2 border-dashed border-slate-300 text-slate-400 py-3 rounded-xl hover:border-blue-400 hover:text-blue-500 font-bold flex items-center justify-center gap-2 tracking-tight transition-all active:scale-[0.98]">
            <Plus size={20} /> スタッフを追加
          </button>
          <div className="flex-1 bg-slate-900 rounded-xl p-4 text-white flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-xs">Day Total</div>
            <div className="text-3xl font-black text-blue-400">{dailyTotal.toFixed(2)}</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={handleSave} 
            className="flex-[2] bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 shadow-xl active:scale-[0.98] transition-all"
          >
            <Save size={22} /> データを確定保存
          </button>
          <Link 
            href="/history" 
            className="flex-1 bg-slate-200 text-slate-700 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-300 transition-all active:scale-[0.98]"
          >
            履歴を見る <ArrowRight size={18} />
          </Link>
        </div>

      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 font-bold">読み込み中...</div>}>
      <AttendanceContent />
    </Suspense>
  );
}