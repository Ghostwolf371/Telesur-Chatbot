import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { FloatingChatWidget } from "@/components/chat/FloatingChatWidget";

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
        {/* ── Navbar ── */}
        <nav className="sticky top-0 z-40 flex h-14 items-center justify-between bg-telesur-blue px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-telesur-yellow">
              <Image
                src="/telesur-logo.png"
                alt="Telesur logo"
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="font-display text-sm font-semibold text-white">
              TeleBot
            </span>
          </Link>
          <div className="flex items-center gap-5">
            <Link
              href="/chat"
              className="text-sm font-medium text-white/80 transition hover:text-white"
            >
              Chat
            </Link>
            <Link
              href="/monitor"
              className="text-sm font-medium text-white/80 transition hover:text-white"
            >
              Monitor
            </Link>
          </div>
        </nav>

        {children}
        <FloatingChatWidget />
      </body>
    </html>
  );
}
