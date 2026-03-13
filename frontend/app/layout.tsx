import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import { FloatingChatWidget } from "@/components/chat/FloatingChatWidget";
import { AppNavbar } from "@/components/AppNavbar";

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
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
};

// Enable static optimization and caching
export const dynamic = 'force-static';
export const revalidate = 31536000; // Cache for 1 year

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  interactiveWidget: "resizes-visual",
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
        <div id="app-root">
          <AppNavbar />
          {children}
        </div>
        <FloatingChatWidget />
      </body>
    </html>
  );
}
