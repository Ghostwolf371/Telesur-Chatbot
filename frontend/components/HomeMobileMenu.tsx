"use client";

import { useState } from "react";
import Link from "next/link";

type MenuItem = {
  label: string;
  links: { label: string; href: string }[];
};

export function HomeMobileMenu({ menuItems }: { menuItems: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  return (
    <>
      {/* Hamburger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex flex-col items-center justify-center gap-[5px] p-2 md:hidden"
        aria-label="Toggle menu"
      >
        <span
          className={`block h-0.5 w-5 rounded bg-white transition-transform ${
            open ? "translate-y-[7px] rotate-45" : ""
          }`}
        />
        <span
          className={`block h-0.5 w-5 rounded bg-white transition-opacity ${
            open ? "opacity-0" : ""
          }`}
        />
        <span
          className={`block h-0.5 w-5 rounded bg-white transition-transform ${
            open ? "-translate-y-[7px] -rotate-45" : ""
          }`}
        />
      </button>

      {/* Mobile dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 border-t border-white/10 bg-telesur-blue shadow-lg md:hidden">
          <div className="mx-auto max-w-6xl px-4 py-3 space-y-1">
            {menuItems.map((item) => (
              <div key={item.label}>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedGroup(
                      expandedGroup === item.label ? null : item.label,
                    )
                  }
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10"
                >
                  {item.label}
                  <span className="text-xs text-white/50">
                    {expandedGroup === item.label ? "▲" : "▼"}
                  </span>
                </button>
                {expandedGroup === item.label && (
                  <div className="ml-3 space-y-0.5 pb-1">
                    {item.links.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Link
              href="/chat"
              onClick={() => setOpen(false)}
              className="block rounded-lg bg-white/10 px-3 py-2.5 text-center text-sm font-semibold text-telesur-yellow transition hover:bg-white/20"
            >
              💬 TeleBot Chat
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
