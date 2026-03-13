import { SourceAttribution, type SourceItem } from "./SourceAttribution";
import Image from "next/image";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

type MessageBubbleProps = {
  role: "user" | "assistant";
  content: string;
  sources?: SourceItem[];
  timestamp?: string;
  onFeedback?: (positive: boolean) => void;
};

export function MessageBubble({
  role,
  content,
  sources = [],
  timestamp,
  onFeedback,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const [mountedTime, setMountedTime] = useState<string>("JUST NOW");
  const [feedbackGiven, setFeedbackGiven] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (!timestamp) {
      setMountedTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
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
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{content}</p>
          ) : (
            <div className="prose-chat break-words">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Sender Name, Time, and Feedback Below the Bubble */}
        <div className="mt-2 flex items-center gap-2 px-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            {isUser ? `YOU • ${displayTime}` : `TELEBOT • ${displayTime}`}
          </span>
          {!isUser && onFeedback && content && (
            <div className="flex items-center gap-1">
              {feedbackGiven ? (
                <span className="text-[10px] font-medium text-emerald-500">
                  {feedbackGiven === "up" ? "👍 Thanks!" : "👎 Thanks!"}
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => { setFeedbackGiven("up"); onFeedback(true); }}
                    className="rounded p-0.5 text-slate-300 transition hover:text-emerald-500"
                    title="Helpful"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                      <path d="M1 8.998a1 1 0 011-1h1a1 1 0 011 1v6a1 1 0 01-1 1H2a1 1 0 01-1-1v-6zm5.5-5.003a3.224 3.224 0 00-.327 1.42v.003l.003.148c.017.357.07.708.158 1.049l.041.152H4.25A2.25 2.25 0 002 8.998v.5l1.646 5.766A1 1 0 004.608 16h7.558a2.25 2.25 0 002.093-1.418l2.489-6.284A1.25 1.25 0 0015.583 6.5h-3.558l.607-2.429A2.25 2.25 0 0010.451 1.5h-.003a1.5 1.5 0 00-1.372.892L6.5 3.995z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFeedbackGiven("down"); onFeedback(false); }}
                    className="rounded p-0.5 text-slate-300 transition hover:text-red-400"
                    title="Not helpful"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                      <path d="M19 11.002a1 1 0 00-1 1v6a1 1 0 001 1h-1a1 1 0 001-1v-6a1 1 0 00-1-1zm-5.5 5.003a3.224 3.224 0 00.327-1.42v-.003a5.46 5.46 0 00-.161-1.197l-.041-.152H15.75a2.25 2.25 0 002.25-2.23v-.5L16.354 4.74A1 1 0 0015.392 4H7.834A2.25 2.25 0 005.74 5.418l-2.489 6.284A1.25 1.25 0 004.417 13.5h3.558l-.607 2.429a2.25 2.25 0 002.181 2.571h.003a1.5 1.5 0 001.372-.892l2.576-1.603z" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
