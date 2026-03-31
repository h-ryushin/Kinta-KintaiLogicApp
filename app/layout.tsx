import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNav } from "./components/organisms/BottomNav";

const inter = Inter({ subsets: ["latin"] });

// 🔥 ここを修正！LINEの表示を「平野くん」から「プロ仕様」に変える
export const metadata: Metadata = {
  title: "勤怠管理システム | Management App",
  description: "スタッフの勤務時間を正確に記録・計算するための専用管理ツールです。",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  openGraph: {
    title: "勤怠管理システム",
    description: "勤務時間の管理",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${inter.className} bg-slate-50`}>
        {/* 🔥 pb-40 を追加して、全てのページでフッター被りを物理的に防ぐ！ */}
        <div className="min-h-screen pb-40">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}