"use client";

import React from 'react';
import { StaffCard } from '@/components/molecules/StaffCard';

interface Staff {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  role: 'alba' | 'part';
}

interface StaffSectionProps {
  title: string;
  titleColor: string;
  dotColor: string;
  totalHours: number;
  staffs: Staff[];
  listeningStaffId: string | null;
  startListening: (id: string) => void;
  setStaffList: React.Dispatch<React.SetStateAction<Staff[]>>;
  calculateHours: (staff: Staff) => number;
}

export const StaffSection: React.FC<StaffSectionProps> = ({
  title,
  titleColor,
  dotColor,
  totalHours = 0,
  staffs = [],
  listeningStaffId,
  startListening,
  setStaffList,
  calculateHours,
}) => {

  const handleDeleteStaff = (id: string) => {
    setStaffList(prev => prev.filter(staff => staff.id !== id));
  };

  const handleUpdateStaff = (id: string, field: keyof Staff, value: any) => {
    setStaffList(prev => prev.map(staff => staff.id === id ? { ...staff, [field]: value } : staff));
  };

  return (
    <div className="space-y-4">
      {/* 枠ごとのヘッダー */}
      <div className="flex items-center justify-between pl-1">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <h2 className={`text-sm font-black ${titleColor}`}>{title}</h2>
        </div>
        <div className="text-[11px] font-bold text-slate-400 tabular-nums">
          計 {totalHours.toFixed(2)} H
        </div>
      </div>

      {/* 🗂️ 1行横並びのカード一覧（勝手に出現させていた点線の追加ボタンは跡形もなく消去！） */}
      <div className="grid gap-3">
        {staffs.map((staff, index) => (
          <StaffCard
            key={staff.id}
            staff={staff}
            index={index}
            onUpdate={handleUpdateStaff}
            onDelete={handleDeleteStaff}
            calculateHours={calculateHours}
            isListening={listeningStaffId === staff.id}
            startListening={startListening}
          />
        ))}
      </div>
    </div>
  );
};