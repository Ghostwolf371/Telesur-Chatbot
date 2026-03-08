"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export function ChatbotPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    // Show after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    // Hide tooltip after 10 seconds
    const tooltipTimer = setTimeout(() => {
      setShowTooltip(false);
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearTimeout(tooltipTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Tooltip/Notification Bubble */}
      {showTooltip && (
        <div className="animate-slide-up glass-card relative mr-2 max-w-[280px] rounded-2xl border-2 border-blue-200 bg-white p-4 shadow-2xl">
          <button
            onClick={() => setShowTooltip(false)}
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close notification"
          >
            ×
          </button>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-800 shadow-lg">
              <Image
                src="/telesur-logo.png"
                alt="Telesur"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                Heb je hulp nodig?
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Chat met onze AI assistent voor snelle antwoorden!
              </p>
            </div>
          </div>
          {/* Arrow pointing to button */}
          <div className="absolute -bottom-2 right-8 h-4 w-4 rotate-45 border-b-2 border-r-2 border-blue-200 bg-white"></div>
        </div>
      )}

      {/* Floating Chat Button */}
      <Link
        href="/chat"
        className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-700 to-blue-900 shadow-2xl transition-all hover:scale-110 hover:shadow-blue-500/50 active:scale-95"
        onMouseEnter={() => setShowTooltip(true)}
      >
        {/* Pulse animation ring */}
        <span className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-75"></span>

        {/* Button content */}
        <div className="relative z-10 flex h-full w-full items-center justify-center">
          <Image
            src="/telesur-logo.png"
            alt="Chat with Telesur"
            width={40}
            height={40}
            className="object-contain transition-transform group-hover:scale-110"
          />
        </div>

        {/* Notification badge */}
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-blue-900 shadow-lg">
          1
        </span>
      </Link>

      {/* Small helper text */}
      <p className="animate-fade-in mr-2 text-xs font-semibold text-white drop-shadow-lg">
        💬 Chat met ons
      </p>
    </div>
  );
}
