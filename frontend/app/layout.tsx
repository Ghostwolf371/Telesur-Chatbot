import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import Link from "next/link";

import "./globals.css";

const bodyFont = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

const displayFont = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "TeleBot | Telesur Support",
  description: "Production-ready AI support assistant for Telesur services.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${bodyFont.variable} ${displayFont.variable} antialiased`}
      >
        {/* ── Top nav bar ── */}
        <nav className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-lg sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-sm font-bold text-white shadow-sm">
              T
            </span>
            <span className="font-display text-[15px] font-semibold text-slate-800">
              TeleBot
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              href="/chat"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Chat
            </Link>
            <Link
              href="/monitor"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Monitor
            </Link>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}
