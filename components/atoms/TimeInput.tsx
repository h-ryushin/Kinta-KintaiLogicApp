"use client";

import React, { useState, useEffect } from 'react';

interface TimeInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  onErrorChange?: (error: string | null) => void; // 🟢 エラーが起きたことを外に伝えるための関数
}

export const TimeInput: React.FC<TimeInputProps> = ({
  value,
  onChange,
  placeholder,
  className = "",
  onErrorChange
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => { setLocalValue(value); }, [value]);

  // 🧮 クレンジング ＆ バリデーション
  const formatAndValidateTime = (val: string): { formatted: string; error: string | null } => {
    // 空っぽの時はエラーなし
    if (!val.trim()) return { formatted: val, error: null };

    // 全角を半角に
    let normalized = val.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
    normalized = normalized.replace(/：/g, ':');

    let hours = "";
    let mins = "";

    if (normalized.includes(':')) {
      const [h, m] = normalized.split(':');
      hours = h.replace(/\D/g, '').padStart(2, '0');
      mins = m.replace(/\D/g, '').padStart(2, '0');
    } else {
      const digits = normalized.replace(/\D/g, '');
      if (digits.length === 3 || digits.length === 4) {
        const padded = digits.padStart(4, '0');
        hours = padded.substring(0, 2);
        mins = padded.substring(2, 4);
      } else {
        // 🟢 意味不明な文字や、2桁以下・5桁以上の数字の時はあかん！
        return { formatted: val, error: "時間を4桁（例: 1040）で打ってください" };
      }
    }

    // 🟢 25時とか70分とか、ありえない数字の時もあかん！
    if (Number(hours) >= 24 || Number(mins) >= 60) {
      return { formatted: `${hours}:${mins}`, error: "正しい時刻（00:00〜23:59）にしてください" };
    }

    return { formatted: `${hours}:${mins}`, error: null };
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      // 🟢 入力し始めたら一瞬でまっさらにする！
      onFocus={() => setLocalValue('')}
      // 🟢 ユーザーが入力を離れた瞬間（onBlur）を検知！
      onBlur={(e) => {
        const { formatted, error } = formatAndValidateTime(e.target.value);
        
        setLocalValue(error ? e.target.value : formatted); // エラーなら打った文字を残す
        if (onErrorChange) onErrorChange(error); // カード側へエラーを通知
        
        if (!error) {
          onChange(formatted); // 正常な時だけ大元のデータを書き換える
        }
      }}
      placeholder={placeholder}
      className={`bg-slate-50 border border-slate-100 rounded-2xl py-2 font-black text-center text-slate-800 outline-none text-sm focus:border-blue-500 focus:bg-white transition-all ${className}`}
    />
  );
};