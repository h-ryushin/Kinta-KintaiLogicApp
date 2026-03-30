import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Calculator, History } from "lucide-react";
import { BottomNav } from "./components/organisms/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "勤怠計算アプリ",
  description: "平野くんが作った勤怠管理アプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${inter.className} bg-slate-50`}>
        {/* コンテンツエリア：ナビの高さ分だけ下に余白を強制確保 */}
        <div className="min-h-screen">
          {children}
        </div>
        <BottomNav></BottomNav>
      </body>
    </html>
  );
}