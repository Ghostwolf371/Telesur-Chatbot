"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function AppNavbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (pathname === "/") {
    return null;
  }

  const links = [
    { href: "/chat", label: "Chat" },
    { href: "/monitor", label: "Monitor" },
    { href: "/feedback", label: "Feedback" },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-telesur-blue">
      <div className="flex h-14 items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-telesur-yellow">
            <Image
              src="/telesur-logo.png"
              alt="Telesur logo"
              width={64}
              height={64}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <span className="font-display text-sm font-semibold text-white">
            TeleBot
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-5">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition hover:text-white ${
                pathname === l.href ? "text-white" : "text-white/70"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="sm:hidden flex flex-col items-center justify-center gap-[5px] p-2"
          aria-label="Toggle menu"
        >
          <span
            className={`block h-0.5 w-5 rounded bg-white transition-transform ${
              menuOpen ? "translate-y-[7px] rotate-45" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-5 rounded bg-white transition-opacity ${
              menuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-5 rounded bg-white transition-transform ${
              menuOpen ? "-translate-y-[7px] -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden border-t border-white/10 bg-telesur-blue px-5 pb-3 pt-2 flex flex-col gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-white/10 ${
                pathname === l.href ? "text-white bg-white/10" : "text-white/80"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
