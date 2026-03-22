import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Calculator, History } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "勤怠計算アプリ",
  description: "1分単位で計算してExcel用に変換",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${inter.className} bg-slate-50`}>
        {/* コンテンツエリア：ナビの高さ分だけ下に余白を強制確保 */}
        <div className="min-h-screen">
          {children}
        </div>

        {/* --- 下部ナビゲーション（悪さ解消版） --- */}
        <nav className="px-4 pb-6 pt-3">
          <div className="max-w-md mx-auto bg-white/80 backdrop-blur-xl border border-slate-200/50 flex justify-around p-3 rounded-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] transition-all hover:bg-white">
            
            <Link href="/" className="flex flex-col items-center gap-1.5 px-8 py-1 rounded-2xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-90 group">
              <Calculator size={22} className="group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-tighter">Entry</span>
            </Link>
            
            <Link href="/history" className="flex flex-col items-center gap-1.5 px-8 py-1 rounded-2xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-90 group">
              <History size={22} className="group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-tighter">History</span>
            </Link>

          </div>
        </nav>
      </body>
    </html>
  );
}