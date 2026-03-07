import { SourceAttribution, type SourceItem } from "./SourceAttribution";
import Image from "next/image";
import { useEffect, useState } from "react";

type MessageBubbleProps = {
  role: "user" | "assistant";
  content: string;
  sources?: SourceItem[];
  timestamp?: string; // Optional timestamp prop to match design
};

export function MessageBubble({
  role,
  content,
  sources = [],
  timestamp,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const [mountedTime, setMountedTime] = useState<string>("JUST NOW");

  useEffect(() => {
    if (!timestamp) {
      setMountedTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }
  }, [timestamp]);

  const displayTime = timestamp || mountedTime;

  return (
    <div
      className={`animate-fade-in flex w-full gap-3 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Profile Avatar */}
      <div className="mt-1 flex-shrink-0">
        {isUser ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f4d4ba] text-[#c07b5a] shadow-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6"
            >
              <path
                fillRule="evenodd"
                d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-telesur-yellow shadow-md p-1">
            <Image
              src="/telesur-logo.png"
              alt="TeleBot profile"
              width={28}
              height={28}
              className="h-full w-full object-contain"
            />
          </div>
        )}
      </div>

      {/* Bubble & Label Container */}
      <div
        className={`flex max-w-[85%] flex-col sm:max-w-[75%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {/* Message Bubble Text */}
        <div
          className={`rounded-2xl px-5 py-4 text-[15px] leading-relaxed shadow-sm ${
            isUser
              ? "rounded-tr-sm border border-slate-200 bg-white text-slate-800"
              : "rounded-tl-sm bg-telesur-blue text-white"
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{content}</p>
        </div>

        {/* Source Attribution (Outside the blue text bubble for Telebot) */}
        {!isUser && sources.length > 0 && (
          <div className="mt-2 w-full max-w-full">
            <SourceAttribution sources={sources} />
          </div>
        )}

        {/* Sender Name and Time Below the Bubble */}
        <div className="mt-2 px-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            {isUser ? `YOU • ${displayTime}` : `TELEBOT • ${displayTime}`}
          </span>
        </div>
      </div>
    </div>
  );
}
