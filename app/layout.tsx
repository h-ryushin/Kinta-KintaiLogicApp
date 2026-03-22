// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Calculator, History } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        {children}
        {/* 下部ナビゲーション */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-3 pb-6 shadow-lg z-50">
          <Link href="/" className="flex flex-col items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors">
            <Calculator size={24} />
            <span className="text-[10px] font-bold uppercase">入力</span>
          </Link>
          <Link href="/history" className="flex flex-col items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors">
            <History size={24} />
            <span className="text-[10px] font-bold uppercase">履歴</span>
          </Link>
        </nav>
      </body>
    </html>
  );
}