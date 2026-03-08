"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppNavbar() {
  const pathname = usePathname();

  // Keep the original TeleBot top bar on app pages, not on the marketing home page.
  if (pathname === "/") {
    return null;
  }

  return (
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
  );
}
